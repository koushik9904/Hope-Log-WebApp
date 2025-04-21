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

export function setupAuth(app: Express) {
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
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );
  
  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Determine the correct callback URL based on environment
    const hostname = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:5000';
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

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
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
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      prompt: "select_account"
    })(req, res, next);
  });
  
  app.get(
    "/auth/google/callback",
    (req: Request, res: Response, next: NextFunction) => {
      console.log("Google OAuth callback received:", req.url);
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
      return res.redirect("/auth?error=" + encodeURIComponent(err.message || "Authentication failed"));
    }
    next(err);
  });
  
  // Apple OAuth routes
  app.get("/auth/apple", passport.authenticate("apple"));
  
  app.get(
    "/auth/apple/callback",
    passport.authenticate("apple", { failureRedirect: "/auth" }),
    (req, res) => {
      res.redirect("/");
    }
  );
}
