import { Express, Request, Response } from "express";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import { storage } from "../storage";
import { OpenAI } from "openai";

// Define custom Request type for multer
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

// Initialize OpenAI client using environment variable
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB file size limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: File upload only supports image files"));
  }
});

// Ensure avatar directories exist
const ensureAvatarDirs = () => {
  const uploadDir = path.join(process.cwd(), 'public', 'avatars');
  const uploadsDir = path.join(uploadDir, 'uploads');
  const generatedDir = path.join(uploadDir, 'generated');
  const standardDir = path.join(uploadDir, 'standard');
  
  [uploadDir, uploadsDir, generatedDir, standardDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

export function registerAvatarRoutes(app: Express): void {
  // Ensure avatar directories exist
  ensureAvatarDirs();
  
  // Upload custom avatar
  app.post("/api/users/:id/avatar", upload.single("avatar"), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.id);
    if (req.user?.id !== userId && !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Create unique filename
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const filename = `${userId}_${Date.now()}${fileExt}`;
      const avatarPath = path.join(process.cwd(), 'public', 'avatars', 'uploads', filename);
      
      // Save file to disk
      fs.writeFileSync(avatarPath, req.file.buffer);
      
      // Update user's avatar in database
      const avatarUrl = `/public/avatars/uploads/${filename}`;
      await storage.updateUser(userId, { avatar: avatarUrl });
      
      res.status(200).json({ avatarUrl });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  });
  
  // Delete avatar
  app.delete("/api/users/:id/avatar", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.id);
    if (req.user?.id !== userId && !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.avatar) {
        return res.status(404).json({ error: "User or avatar not found" });
      }
      
      // Update user's avatar in database
      await storage.updateUser(userId, { avatar: null });
      
      res.status(200).json({ message: "Avatar removed successfully" });
    } catch (error) {
      console.error("Error removing avatar:", error);
      res.status(500).json({ error: "Failed to remove avatar" });
    }
  });
  
  // Set standard avatar
  app.post("/api/users/:id/avatar/standard", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.id);
    if (req.user?.id !== userId && !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const { avatarUrl } = req.body;
      
      if (!avatarUrl) {
        return res.status(400).json({ error: "Avatar URL is required" });
      }
      
      // Update user's avatar in database (using the DiceBear URL directly)
      await storage.updateUser(userId, { avatar: avatarUrl });
      
      res.status(200).json({ avatarUrl });
    } catch (error) {
      console.error("Error setting standard avatar:", error);
      res.status(500).json({ error: "Failed to set standard avatar" });
    }
  });
  
  // Generate AI avatars with OpenAI
  app.post("/api/avatar/generate", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }
      
      // Generate avatars using DALL-E
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Create a high-quality profile picture avatar based on this description: ${prompt}. The image should be suitable for a profile picture, with a clean background and clear facial features if it's a person. Make it stylish and professional.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      
      // Return generated avatar URLs
      res.status(200).json({ 
        avatars: response.data.map(item => item.url)
      });
    } catch (error) {
      console.error("Error generating AI avatars:", error);
      res.status(500).json({ error: "Failed to generate avatars" });
    }
  });
  
  // Save AI-generated avatar
  app.post("/api/users/:id/avatar/generated", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.id);
    if (req.user?.id !== userId && !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const { avatarUrl } = req.body;
      
      if (!avatarUrl) {
        return res.status(400).json({ error: "Avatar URL is required" });
      }
      
      // Update user's avatar in database with the OpenAI-generated URL
      await storage.updateUser(userId, { avatar: avatarUrl });
      
      res.status(200).json({ avatarUrl });
    } catch (error) {
      console.error("Error saving generated avatar:", error);
      res.status(500).json({ error: "Failed to save generated avatar" });
    }
  });
  
  // Get standard avatars (not used with DiceBear approach, but kept for future use)
  app.get("/api/avatars/standard", (_req: Request, res: Response) => {
    try {
      const avatarDirectoryPath = path.join(process.cwd(), 'public', 'avatars', 'standard');
      
      // If directory doesn't exist, return empty array
      if (!fs.existsSync(avatarDirectoryPath)) {
        return res.json({ avatars: [] });
      }
      
      // Read all files from the standard avatars directory
      const avatarFiles = fs.readdirSync(avatarDirectoryPath)
        .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
        .map(file => `/public/avatars/standard/${file}`);
      
      res.json({ avatars: avatarFiles });
    } catch (error) {
      console.error("Error fetching standard avatars:", error);
      res.status(500).json({ error: "Failed to fetch standard avatars" });
    }
  });
}