import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Helper function to get the dynamic callback URL based on the current request
function getCallbackUrl(req: Request): string {
  if (req && req.headers && req.headers.host) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    return `${protocol}://${req.headers.host}/auth/google/callback`;
  }
  
  // Fallback to environment variables
  const hostname = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:5000';
  return `${hostname}/auth/google/callback`;
}

export async function setupAuth(app: Express) {
  // Check for OAuth credentials in database first, then environment variables
  const googleClientId = await storage.getSystemSetting("GOOGLE_CLIENT_ID") || process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = await storage.getSystemSetting("GOOGLE_CLIENT_SECRET") || process.env.GOOGLE_CLIENT_SECRET;
  
  // Update environment variables with database values for backward compatibility
  if (googleClientId) process.env.GOOGLE_CLIENT_ID = googleClientId;
  if (googleClientSecret) process.env.GOOGLE_CLIENT_SECRET = googleClientSecret;
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "hopelog-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    },
    rolling: true // Refresh the cookie on each request
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log("LocalStrategy: Attempting to authenticate user:", username);
      try {
        const user = await storage.getUserByUsername(username);
        console.log("LocalStrategy: User lookup result:", user ? "Found" : "Not found");
        
        if (!user) {
          console.log("LocalStrategy: Authentication failed - user not found");
          return done(null, false);
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log("LocalStrategy: Password comparison result:", passwordMatch ? "Match" : "No match");
        
        if (!passwordMatch) {
          console.log("LocalStrategy: Authentication failed - password incorrect");
          return done(null, false);
        }
        
        console.log("LocalStrategy: Authentication successful for user ID:", user.id);
        return done(null, user);
      } catch (error) {
        console.error("LocalStrategy: Error during authentication:", error);
        return done(error);
      }
    }),
  );
  
  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Determine the correct callback URL based on environment
    const hostname = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:5000';
    
    // Using the global getCallbackUrl function defined above
    
    // Default callback URL (will be updated in the route handler)
    const googleCallbackURL = `${hostname}/auth/google/callback`;
    console.log('Using Google callback URL:', googleCallbackURL);
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: googleCallbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await storage.getUserByUsername(`google-${profile.id}`);
            
            if (!user) {
              // Create a new user if they don't exist
              user = await storage.createUser({
                username: `google-${profile.id}`,
                password: await hashPassword(randomBytes(16).toString('hex')),
                firstName: profile.name?.givenName || '',
                lastName: profile.name?.familyName || '',
                email: profile.emails?.[0]?.value || '',
                avatar: profile.photos?.[0]?.value || '',
                provider: 'google',
                providerId: profile.id
              });
            }
            
            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }
  
  // Apple OAuth
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyLocation: process.env.APPLE_PRIVATE_KEY,
          callbackURL: "/auth/apple/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await storage.getUserByUsername(`apple-${profile.id}`);
            
            if (!user) {
              // Create a new user if they don't exist
              user = await storage.createUser({
                username: `apple-${profile.id}`,
                password: await hashPassword(randomBytes(16).toString('hex')),
                firstName: profile.name?.firstName || '',
                lastName: profile.name?.lastName || '',
                email: profile.emails?.[0]?.value || '',
                provider: 'apple',
                providerId: profile.id
              });
            }
            
            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
      provider: 'local'
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt for username:", req.body.username);
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      if (!user) {
        console.log("Login failed - user not found or password incorrect");
        return res.status(401).json({ message: "Authentication failed" });
      }
      
      req.login(user, (loginErr: Error | null) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return next(loginErr);
        }
        console.log("Login successful for user ID:", user.id);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Google OAuth routes
  app.get("/auth/google", (req: Request, res: Response, next: NextFunction) => {
    console.log("Starting Google OAuth flow");
    console.log("Request headers:", req.headers);
    
    // Check if Google OAuth credentials are available
    const credentialsAvailable = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
    console.log("Google OAuth credentials available:", credentialsAvailable);
    
    // Update the Google strategy with the current domain's callback URL
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      const dynamicCallbackUrl = getCallbackUrl(req);
      console.log("Using dynamic callback URL:", dynamicCallbackUrl);
      
      // Generate JavaScript origin for debugging
      const jsOrigin = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host || ''}`;
      console.log("Required JavaScript Origin for OAuth:", jsOrigin);
      
      // Log full OAuth configuration
      console.log("=== OAuth DEBUG INFORMATION ===");
      console.log("Client ID length:", process.env.GOOGLE_CLIENT_ID?.length || 0);
      console.log("Client Secret length:", process.env.GOOGLE_CLIENT_SECRET?.length || 0);
      console.log("Full redirect URL:", dynamicCallbackUrl);
      console.log("For Google OAuth configuration you MUST add:");
      console.log("1. Redirect URI:", dynamicCallbackUrl);
      console.log("2. JavaScript Origin:", jsOrigin);
      console.log("==============================");

      // Always create a fresh Google strategy with the current callback URL
      // Remove existing strategy if possible
      try {
        if ((passport as any)._strategies && (passport as any)._strategies.google) {
          delete (passport as any)._strategies.google;
          console.log("Removed existing Google strategy");
        }
      } catch (e) {
        console.log("No existing Google strategy to remove");
      }
      
      console.log("Re-creating Google OAuth strategy with fresh callback URL");
      passport.use(
        'google',
        new GoogleStrategy(
          {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: dynamicCallbackUrl,
          },
          async (accessToken, refreshToken, profile, done) => {
            try {
              console.log("Google OAuth callback received profile:", profile.id);
              // Check if user already exists
              let user = await storage.getUserByUsername(`google-${profile.id}`);
              
              if (!user) {
                // Create a new user if they don't exist
                console.log("Creating new user for Google profile:", profile.id);
                user = await storage.createUser({
                  username: `google-${profile.id}`,
                  password: await hashPassword(randomBytes(16).toString('hex')),
                  firstName: profile.name?.givenName || '',
                  lastName: profile.name?.familyName || '',
                  email: profile.emails?.[0]?.value || '',
                  avatar: profile.photos?.[0]?.value || '',
                  provider: 'google',
                  providerId: profile.id
                });
              }
              
              return done(null, user);
            } catch (error) {
              console.error("Error in Google profile callback:", error);
              return done(error as Error);
            }
          }
        )
      );
      
      // Use the direct approach for consistent behavior
      console.log("Using direct redirect approach to Google OAuth");
      try {
        // Construct the Google OAuth URL directly
        const googleOAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        const params = new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          redirect_uri: dynamicCallbackUrl,
          response_type: "code",
          scope: "profile email",
          prompt: "select_account",
          access_type: "offline"
        });
        
        const redirectUrl = `${googleOAuthUrl}?${params.toString()}`;
        console.log("Redirecting directly to:", redirectUrl);
        return res.redirect(redirectUrl);
      } catch (error) {
        console.error("Error with direct redirect approach:", error);
        // Fall back to passport if direct approach fails
      }
      
      // Strategy is already initialized above, no need to repeat
      return; // We've already redirected, so return and don't execute the code below
    } else {
      console.error("Google OAuth credentials not available! Please check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env variables.");
      return res.redirect("/auth?error=" + encodeURIComponent("Google OAuth credentials not properly configured. Please contact the administrator."));
    }
    
    // This code should never be reached because we either redirect above or return
    // But keep it as a fallback just in case something goes wrong
    console.log("WARNING: Using passport authentication approach as fallback. This should not happen.");
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      prompt: "select_account"
    })(req, res, next);
  });
  
  app.get(
    "/auth/google/callback",
    (req: Request, res: Response, next: NextFunction) => {
      console.log("Google OAuth callback received:", req.url);
      console.log("Callback query params:", req.query);
      
      // Check if there's an error from Google
      if (req.query.error) {
        console.error("Google OAuth returned an error:", req.query.error);
        return res.redirect("/auth?error=" + encodeURIComponent("Google OAuth error: " + req.query.error));
      }
      
      // If we have a code but no error, we can try to exchange it directly
      if (req.query.code && !req.query.error) {
        console.log("Received authorization code from Google, proceeding with authentication");
      }
      
      passport.authenticate("google", { 
        failureRedirect: "/auth",
        failWithError: true
      })(req, res, next);
    },
    (req: Request, res: Response) => {
      console.log("Google OAuth successful, redirecting to home page");
      res.redirect("/");
    }
  );
  
  // Error handler for Google OAuth
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (req.url.startsWith('/auth/google')) {
      console.error("Google OAuth error:", err);
      console.error("Full error object:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      console.error("Error occurred in route:", req.url);
      console.error("Original request headers:", req.headers);
      
      // Check for specific Google OAuth errors
      if (err.message && (
        err.message.includes('redirect_uri_mismatch') || 
        err.message.includes('invalid_request') ||
        err.message.includes('unauthorized_client')
      )) {
        console.error("DETECTED OAUTH CONFIGURATION ERROR IN GOOGLE CLOUD CONSOLE");
      }
      
      let errorMessage = err.message || "Authentication failed";
      
      // Get the current dynamic callback URL
      const currentCallbackUrl = getCallbackUrl(req);
      
      // Add detailed instructions with formatting for better display in the UI
      errorMessage = "Google OAuth Configuration Required\n\n" +
      "To complete Google OAuth setup, please add these URLs to your Google Cloud Console:\n\n" +
      "Redirect URI (required):\n" +
      currentCallbackUrl + "\n\n" +
      "JavaScript Origin (required):\n" +
      (req.headers['x-forwarded-proto'] || 'http') + '://' + (req.headers.host || '') + "\n\n" +
      "Step-by-step instructions:\n" +
      "1. Go to Google Cloud Console (https://console.cloud.google.com/)\n" +
      "2. Select your project and go to 'APIs & Services' > 'Credentials'\n" +
      "3. Edit your OAuth 2.0 Client ID\n" +
      "4. Add the above Redirect URI to 'Authorized redirect URIs'\n" +
      "5. Add the JavaScript Origin to 'Authorized JavaScript origins'\n" +
      "6. Click 'Save' and wait a few minutes for changes to propagate\n" +
      "7. Make sure to update these values if your Replit domain changes\n\n" +
      "Original error: " + err.message;
      
      console.log("Redirecting to auth page with error message:", errorMessage);
      return res.redirect("/auth?error=" + encodeURIComponent(errorMessage));
    }
    next(err);
  });
  
  // Apple OAuth routes
  app.get("/auth/apple", passport.authenticate("apple"));
  
  app.get(
    "/auth/apple/callback",
    passport.authenticate("apple", { failureRedirect: "/auth" }),
    (req: Request, res: Response) => {
      res.redirect("/");
    }
  );
}
