import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, users as usersTable } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";

// Extend express-session with passport property
declare module "express-session" {
  interface SessionData {
    passport?: {
      user?: number;
    };
  }
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    console.log("comparePasswords: Comparing supplied password with stored password");
    console.log("comparePasswords: Supplied length:", supplied.length, "Stored length:", stored.length);
    
    if (!stored || !stored.includes('.')) {
      console.error("comparePasswords: Invalid stored password format, missing salt separator");
      return false;
    }
    
    const [hashed, salt] = stored.split(".");
    console.log("comparePasswords: Hash length:", hashed.length, "Salt length:", salt.length);
    
    if (!hashed || !salt) {
      console.error("comparePasswords: Invalid stored password format, missing hash or salt");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    console.log("comparePasswords: Created hash buffer of length:", hashedBuf.length);
    
    console.log("comparePasswords: Supplied password first 5 chars:", supplied.substring(0, 5) + "...");
    console.log("comparePasswords: Hashing supplied password with salt");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    console.log("comparePasswords: Created supplied buffer of length:", suppliedBuf.length);
    
    // Check buffer lengths to avoid unequal buffer comparison which can throw
    if (hashedBuf.length !== suppliedBuf.length) {
      console.error("comparePasswords: Buffer length mismatch:", 
        hashedBuf.length, "vs", suppliedBuf.length);
      return false;
    }
    
    console.log("comparePasswords: Hash buffer:", hashedBuf.toString('hex').substring(0, 10) + "...");
    console.log("comparePasswords: Supplied buffer:", suppliedBuf.toString('hex').substring(0, 10) + "...");
    
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log("comparePasswords: Password comparison result:", result);
    
    // If no match and this is for admin, let's try a manual comparison
    if (!result && supplied === "admin123" && hashed) {
      // For debugging purposes, let's see if the admin password might have been changed
      console.log("comparePasswords: Special case - admin login with default password");
      
      // Create a new admin password hash and log it for comparison
      const newHash = await hashPassword("admin123");
      console.log("comparePasswords: Current stored hash (partial):", hashed.substring(0, 20) + "...");
      console.log("comparePasswords: Generated hash for admin123 (partial):", newHash.split('.')[0].substring(0, 20) + "...");
      
      // Just as a test for admin with the known password
      if (supplied === "admin123") {
        console.log("comparePasswords: This is an admin login attempt with default password");
      }
    }
    
    return result;
  } catch (error) {
    console.error("comparePasswords: Error during password comparison:", error);
    return false;
  }
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
    resave: true, // Changed to true to ensure session is saved on each request
    saveUninitialized: true, // Changed to true to allow session tracking before login
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      httpOnly: true,
      secure: false, // Set to false during development to work in all environments
      sameSite: "lax"
    },
    rolling: true // Refresh the cookie on each request
  };
  
  console.log(`Session configuration: 
    - Secret length: ${(process.env.SESSION_SECRET || "hopelog-secret-key").length}
    - Session store type: ${storage.sessionStore.constructor.name}
    - Cookie maxAge: ${7 * 24 * 60 * 60 * 1000}ms (1 week)
    - Secure cookies: ${process.env.NODE_ENV === "production"}
    - Environment: ${process.env.NODE_ENV}
  `);

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email', // Change username field to email
      passwordField: 'password'
    }, async (email, password, done) => {
      console.log("LocalStrategy: Attempting to authenticate user with email:", email);
      try {
        // First try to find user by email
        const user = await storage.getUserByEmail(email);
        console.log("LocalStrategy: User lookup result:", user ? "Found" : "Not found");
        
        if (!user) {
          // As a fallback, check if they're trying to use username instead of email
          const userByUsername = await storage.getUserByUsername(email);
          if (!userByUsername) {
            console.log("LocalStrategy: Authentication failed - user not found by email or username");
            return done(null, false);
          }
          console.log("LocalStrategy: Found user by username instead of email");
          
          const passwordMatch = await comparePasswords(password, userByUsername.password);
          console.log("LocalStrategy: Password comparison result:", passwordMatch ? "Match" : "No match");
          
          if (!passwordMatch) {
            console.log("LocalStrategy: Authentication failed - password incorrect");
            return done(null, false);
          }
          
          return done(null, userByUsername);
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
            // Get the email from the profile
            const email = profile.emails?.[0]?.value;
            
            if (!email) {
              return done(new Error("No email provided by Google"));
            }
            
            // First check if user exists by email
            let user = await storage.getUserByEmail(email);
            
            // If no user found by email, check by legacy username format
            if (!user) {
              user = await storage.getUserByUsername(`google-${profile.id}`);
            }
            
            if (!user) {
              // Create a new user if they don't exist
              user = await storage.createUser({
                username: email, // Use email as username
                password: await hashPassword(randomBytes(16).toString('hex')),
                name: `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || 'Google User',
                firstName: profile.name?.givenName || '',
                lastName: profile.name?.familyName || '',
                email: email,
                avatar: profile.photos?.[0]?.value || '',
                provider: 'google',
                providerId: profile.id,
                isVerified: true // Google verifies emails
              });
            } else if (user.username !== email) {
              // Update username to match email if different
              user = await storage.updateUser(user.id, { 
                username: email,
                isVerified: true
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
            // Get the email from the profile
            const email = profile.emails?.[0]?.value;
            
            if (!email) {
              return done(new Error("No email provided by Apple"));
            }
            
            // First check if user exists by email
            let user = await storage.getUserByEmail(email);
            
            // If no user found by email, check by legacy username format
            if (!user) {
              user = await storage.getUserByUsername(`apple-${profile.id}`);
            }
            
            if (!user) {
              // Create a new user if they don't exist
              user = await storage.createUser({
                username: email, // Use email as username
                password: await hashPassword(randomBytes(16).toString('hex')),
                name: `${profile.name?.firstName || ''} ${profile.name?.lastName || ''}`.trim() || 'Apple User',
                firstName: profile.name?.firstName || '',
                lastName: profile.name?.lastName || '',
                email: email,
                provider: 'apple',
                providerId: profile.id,
                isVerified: true // Apple already verifies emails
              });
            } else if (user.username !== email) {
              // Update username to match email if different
              user = await storage.updateUser(user.id, { 
                username: email,
                isVerified: true
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

  passport.serializeUser((user, done) => {
    console.log(`🔒 Serializing user ID:`, user.id);
    // Store only the user ID in the session
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    console.log(`🔓 Deserializing user ID: ${id}`);
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.error(`❌ Deserialization failed: User ID ${id} not found in database`);
        return done(null, false);
      }
      
      console.log(`✅ User deserialized successfully: ${user.id} (${user.username})`);
      // Force session save to make sure the newly deserialized user is stored
      if (globalReq?.session) {
        globalReq.session.save((err) => {
          if (err) {
            console.error('Session save error during deserialization:', err);
          } else {
            console.log('Session explicitly saved during deserialization');
          }
        });
      }
      
      // We now have the full user object with all properties
      done(null, user);
    } catch (error) {
      console.error(`❌ Deserialization error:`, error);
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    // Use email as username if not provided
    if (!req.body.username && req.body.email) {
      req.body.username = req.body.email;
    }
    
    // Check if username exists
    const existingUsername = await storage.getUserByUsername(req.body.username);
    if (existingUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }
    
    // Check if email exists
    if (req.body.email) {
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }
    
    // Generate verification token
    const verificationToken = randomBytes(20).toString('hex');
    
    // Create user with verification token
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
      provider: 'local',
      isVerified: false,
      verificationToken
    });
    
    // TODO: Send verification email
    // We'll mock this for now, but in a real application, you'd send an email with a link
    // to /api/verify-email/{token}
    
    console.log(`Verification link: ${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/api/verify-email/${verificationToken}`);
    
    // Auto-login the user after registration
    req.login(user, (err) => {
      if (err) return next(err);
      
      // Don't send password back to client
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({
        ...userWithoutPassword,
        verificationRequired: true
      });
    });
  });

  app.post("/api/login", (req, res, next) => {
    console.log(`🔑 LOGIN ATTEMPT: ${new Date().toISOString()}`);
    console.log(`🔑 Login body:`, req.body);
    console.log(`🔑 Session before login:`, {
      id: req.sessionID,
      cookie: req.session?.cookie,
      passport: req.session?.passport,
    });
    
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: any) => {
      if (err) {
        console.error("❌ Login error:", err);
        return next(err);
      }
      if (!user) {
        console.log("❌ Login failed - user not found or password incorrect");
        return res.status(401).json({ message: "Authentication failed" });
      }
      
      // Check if user is verified (unless they're logging in with a social provider or admin)
      if (user.provider === 'local' && !user.isAdmin && !user.isVerified) {
        console.log("❌ Login attempted with unverified account:", user.id);
        return res.status(403).json({ 
          message: "Email verification required", 
          verificationRequired: true,
          userId: user.id
        });
      }
      
      req.login(user, (loginErr: Error | null) => {
        if (loginErr) {
          console.error("❌ Session login error:", loginErr);
          return next(loginErr);
        }
        console.log(`✅ Login successful for user ID: ${user.id}`);
        console.log(`✅ Session after login:`, {
          id: req.sessionID,
          cookie: req.session?.cookie,
          passport: req.session?.passport,
        });
        
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
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
    console.log(`⭐ GET /api/user - Session ID: ${req.session?.id || 'none'}`);
    console.log(`⭐ GET /api/user - isAuthenticated: ${req.isAuthenticated()}`);
    console.log(`⭐ GET /api/user - Session cookie: ${req.headers.cookie ? 'Present' : 'Missing'}`);
    console.log(`⭐ GET /api/user - Passport: ${req.session?.passport ? JSON.stringify(req.session.passport) : 'Not in session'}`);
    
    if (!req.isAuthenticated()) {
      console.log(`❌ GET /api/user failed authentication check - no authenticated session`);
      return res.sendStatus(401);
    }
    
    console.log(`✅ GET /api/user success - authenticated as user ID: ${req.user?.id}`);
    
    // Don't send password back to client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // Email verification route
  app.get("/api/verify-email/:token", async (req, res) => {
    try {
      const token = req.params.token;
      
      // Find user with this verification token
      const users = await db.select().from(usersTable).where(eq(usersTable.verificationToken, token));
      
      if (users.length === 0) {
        return res.status(400).json({ error: "Invalid verification token" });
      }
      
      const user = users[0];
      
      // Update user to verified status
      const verifiedUser = await storage.verifyUser(user.id);
      
      // Auto-login the user
      req.login(verifiedUser, (err) => {
        if (err) {
          return res.status(500).json({ error: "Error during login" });
        }
        
        // Redirect to home page or specified redirect URL
        const redirectUrl = req.query.redirect || "/";
        res.redirect(redirectUrl as string);
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ error: "An error occurred during verification" });
    }
  });
  
  // Request password reset route
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Find user with this email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if user exists for security reasons
        return res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
      }
      
      // Generate reset token
      const resetToken = randomBytes(20).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour
      
      // Update user with reset token and expiry
      await db.update(usersTable)
        .set({
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires.toISOString()
        })
        .where(eq(usersTable.id, user.id));
      
      // TODO: Send password reset email
      // In a real application, you'd send an email with a link to /reset-password/{token}
      
      console.log(`Password reset link: ${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/reset-password/${resetToken}`);
      
      res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ error: "An error occurred" });
    }
  });
  
  // Reset password route - validates token
  app.get("/api/reset-password/:token", async (req, res) => {
    try {
      const token = req.params.token;
      
      // Find user with this reset token and check if token is expired
      const users = await db.select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.resetPasswordToken, token),
            gt(usersTable.resetPasswordExpires, new Date().toISOString())
          )
        );
      
      if (users.length === 0) {
        return res.status(400).json({ error: "Password reset token is invalid or has expired" });
      }
      
      // Token is valid
      res.status(200).json({ message: "Token is valid", userId: users[0].id });
    } catch (error) {
      console.error("Error validating reset token:", error);
      res.status(500).json({ error: "An error occurred" });
    }
  });
  
  // Reset password route - updates password
  app.post("/api/reset-password/:token", async (req, res) => {
    try {
      const { password } = req.body;
      const token = req.params.token;
      
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      
      // Find user with this reset token and check if token is expired
      const users = await db.select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.resetPasswordToken, token),
            gt(usersTable.resetPasswordExpires, new Date().toISOString())
          )
        );
      
      if (users.length === 0) {
        return res.status(400).json({ error: "Password reset token is invalid or has expired" });
      }
      
      const user = users[0];
      
      // Update user's password and clear reset token
      await db.update(usersTable)
        .set({
          password: await hashPassword(password),
          resetPasswordToken: null,
          resetPasswordExpires: null
        })
        .where(eq(usersTable.id, user.id));
      
      res.status(200).json({ message: "Password has been reset" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "An error occurred" });
    }
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
                  name: `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || 'Google User',
                  firstName: profile.name?.givenName || '',
                  lastName: profile.name?.familyName || '',
                  email: profile.emails?.[0]?.value || '',
                  avatar: profile.photos?.[0]?.value || '',
                  provider: 'google',
                  providerId: profile.id,
                  isVerified: true // Google already verifies emails
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
