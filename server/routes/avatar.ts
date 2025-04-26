import { Express, Request, Response } from "express";
import { storage } from "../storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";

// Add multer to Express Request type
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create standard avatars directory if it doesn't exist
const standardAvatarsDir = path.join(process.cwd(), "public", "avatars");
if (!fs.existsSync(standardAvatarsDir)) {
  fs.mkdirSync(standardAvatarsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req: any, _file: any, cb: any) => {
      cb(null, uploadsDir);
    },
    filename: (_req: any, file: any, cb: any) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `avatar-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max file size
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed') as any);
    }
  },
});

// Initialize OpenAI
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export function registerAvatarRoutes(app: Express): void {
  // Upload avatar
  app.post("/api/users/:id/avatar", upload.single("avatar"), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if the logged-in user is updating their own profile
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Unauthorized to update this profile" });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Create avatar URL
      const avatarUrl = `/uploads/${req.file.filename}`;
      
      // If user had a previous avatar, delete it (if it was in the uploads folder)
      if (user.avatar && user.avatar.startsWith('/uploads/')) {
        const oldAvatarPath = path.join(process.cwd(), "public", user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      
      // Update user avatar in database
      await storage.updateUser(userId, { avatar: avatarUrl });
      
      res.status(200).json({ avatarUrl });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  });
  
  // Delete avatar
  app.delete("/api/users/:id/avatar", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if the logged-in user is updating their own profile
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Unauthorized to update this profile" });
      }
      
      // If user had a previous avatar, delete it (if it was in the uploads folder)
      if (user.avatar && user.avatar.startsWith('/uploads/')) {
        const oldAvatarPath = path.join(process.cwd(), "public", user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      
      // Update user avatar in database
      await storage.updateUser(userId, { avatar: null });
      
      res.status(200).json({ message: "Avatar removed successfully" });
    } catch (error) {
      console.error("Error deleting avatar:", error);
      res.status(500).json({ error: "Failed to delete avatar" });
    }
  });
  
  // Set standard avatar
  app.post("/api/users/:id/avatar/standard", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { avatarUrl } = req.body;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if the logged-in user is updating their own profile
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Unauthorized to update this profile" });
      }
      
      // Validate that it's a standard avatar
      if (!avatarUrl.startsWith('/avatars/')) {
        return res.status(400).json({ error: "Invalid standard avatar URL" });
      }
      
      // If user had a previous custom avatar, delete it
      if (user.avatar && user.avatar.startsWith('/uploads/')) {
        const oldAvatarPath = path.join(process.cwd(), "public", user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      
      // Update user avatar in database
      await storage.updateUser(userId, { avatar: avatarUrl });
      
      res.status(200).json({ avatarUrl });
    } catch (error) {
      console.error("Error setting standard avatar:", error);
      res.status(500).json({ error: "Failed to set standard avatar" });
    }
  });
  
  // Generate AI avatar
  app.post("/api/avatar/generate", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      
      if (!openai) {
        return res.status(503).json({ error: "OpenAI service not available" });
      }
      
      // Generate avatars using DALL-E
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `A professional avatar portrait with this description: ${prompt}. Make it a close-up, front-facing portrait suitable for a profile picture. Centered composition with soft lighting.`,
        n: 1,
        size: "1024x1024",
        style: "natural",
      });
      
      // Get the URLs
      const avatarUrls = response.data.map(image => image.url || "");
      
      // Save images to local filesystem
      const savedAvatars = await Promise.all(
        avatarUrls.map(async (url) => {
          if (!url) return "";
          
          const fileName = `ai-avatar-${uuidv4()}.png`;
          const filePath = path.join(uploadsDir, fileName);
          
          // Download the image
          const imageResponse = await fetch(url);
          const buffer = Buffer.from(await imageResponse.arrayBuffer());
          
          // Save to disk
          fs.writeFileSync(filePath, buffer);
          
          return `/uploads/${fileName}`;
        })
      );
      
      res.status(200).json({ avatars: savedAvatars.filter(url => url) });
    } catch (error) {
      console.error("Error generating AI avatar:", error);
      res.status(500).json({ error: "Failed to generate avatar" });
    }
  });
  
  // Set generated avatar
  app.post("/api/users/:id/avatar/generated", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { avatarUrl } = req.body;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if the logged-in user is updating their own profile
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Unauthorized to update this profile" });
      }
      
      // Validate that it's a generated avatar
      if (!avatarUrl.startsWith('/uploads/ai-avatar-')) {
        return res.status(400).json({ error: "Invalid generated avatar URL" });
      }
      
      // If user had a previous custom avatar (but not this one), delete it
      if (user.avatar && user.avatar.startsWith('/uploads/') && user.avatar !== avatarUrl) {
        const oldAvatarPath = path.join(process.cwd(), "public", user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      
      // Update user avatar in database
      await storage.updateUser(userId, { avatar: avatarUrl });
      
      res.status(200).json({ avatarUrl });
    } catch (error) {
      console.error("Error setting generated avatar:", error);
      res.status(500).json({ error: "Failed to set generated avatar" });
    }
  });
  
  // List standard avatars
  app.get("/api/avatars/standard", (_req: Request, res: Response) => {
    try {
      // Read the avatars directory
      const avatars = fs.readdirSync(standardAvatarsDir)
        .filter(file => file.match(/\.(png|jpg|jpeg|gif)$/i))
        .map(file => `/avatars/${file}`);
      
      res.status(200).json({ avatars });
    } catch (error) {
      console.error("Error listing standard avatars:", error);
      res.status(500).json({ error: "Failed to list standard avatars" });
    }
  });
}