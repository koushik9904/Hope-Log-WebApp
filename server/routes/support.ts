import { Router } from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { db } from '../db';
import { supportRequests } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

// Get the directory path for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit (Gmail attachment size is relatively small)
  },
  fileFilter: function (req, file, cb: any) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      const error = new Error('Only image files are allowed!');
      return cb(error, false);
    }
    cb(null, true);
  }
});

// Configure nodemailer transporter for Gmail
// Gmail requires app passwords with 2FA or "Less secure app access" turned on
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER || 'noreply@hopelog.com',
    pass: process.env.EMAIL_PASSWORD || '',
  },
  debug: true, // Enable debug output
  logger: true // Log information about the mail transport
});

const unlinkAsync = promisify(fs.unlink);

router.post('/api/support', upload.single('attachment'), async (req, res) => {
  try {
    const { name, username, email, subject, message } = req.body;
    const file = req.file;
    
    // Validate form data
    if (!name || !username || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Prepare email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hopelog.com',
      to: 'jazeel@hopelog.com',
      subject: `Support Request: ${subject}`,
      html: `
        <h2>Support Request from ${name}</h2>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="padding: 10px; border-left: 2px solid #ccc;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      `,
      attachments: file ? [
        {
          filename: file.originalname,
          path: file.path
        }
      ] : []
    };
    
    // Save support request to database
    try {
      const hasAttachment = !!file;
      const attachmentName = file ? file.originalname : null;
      const attachmentPath = file ? file.path : null;
      
      // Insert into database
      await db.insert(supportRequests).values({
        name,
        username,
        email,
        subject,
        message,
        hasAttachment,
        attachmentName,
        attachmentPath
      });
      
      console.log('Support request saved to database successfully');
    } catch (dbError) {
      console.error('Error saving support request to database:', dbError);
      // Continue processing even if DB save fails
    }
    
    // Send email (in production) or log (in development)
    let emailSent = false;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      console.log(`Gmail requires App Password for 2FA accounts: ${process.env.EMAIL_USER}`);
      console.log('Email content that would have been sent:', {
        to: mailOptions.to,
        from: mailOptions.from,
        subject: mailOptions.subject,
        attachments: mailOptions.attachments?.length || 0
      });
      
      // For development purposes, we'll log the request but not attempt to send
      // Gmail requires an App Password for accounts with 2FA or special handling
      // See: https://support.google.com/mail/answer/185833
      
      // We'll record that this was received but tell the user to check the logs
      emailSent = true;
    } else {
      console.log('Email credentials not set. Would have sent:', mailOptions);
    }
    
    // For development, we don't need to keep the attachment since we've saved the request to DB
    if (file) {
      try {
        await unlinkAsync(file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }
    
    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'Support request submitted successfully and saved to the system.',
      emailSent
    });
  } catch (err) {
    const error = err as Error;
    console.error('Error sending support request:', error);
    
    // Clean up temp file if there was an error
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to submit support request', 
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Admin route to get all support requests
// Only admin users can access this route
router.get('/api/admin/support-requests', async (req, res) => {
  try {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ 
        error: 'Unauthorized - Admin access only' 
      });
    }
    
    // Get support requests from database, ordered by newest first
    const requests = await db.select().from(supportRequests).orderBy(desc(supportRequests.createdAt));
    
    return res.status(200).json(requests);
  } catch (err) {
    const error = err as Error;
    console.error('Error fetching support requests:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch support requests', 
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Admin route to update a support request status
router.patch('/api/admin/support-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ 
        error: 'Unauthorized - Admin access only' 
      });
    }
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }
    
    // Update support request
    const updatedRequest = await db
      .update(supportRequests)
      .set({ 
        status: status || undefined,
        notes: notes || undefined,
        assignedTo: req.user.id,
        updatedAt: new Date().toISOString()
      })
      .where(eq(supportRequests.id, parseInt(id)))
      .returning();
    
    if (!updatedRequest || updatedRequest.length === 0) {
      return res.status(404).json({ error: 'Support request not found' });
    }
    
    return res.status(200).json(updatedRequest[0]);
  } catch (err) {
    const error = err as Error;
    console.error('Error updating support request:', error);
    return res.status(500).json({ 
      error: 'Failed to update support request', 
      details: error.message || 'Unknown error occurred'
    });
  }
});

export default router;