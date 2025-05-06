import { Router } from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

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
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@hopelog.com',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

const unlinkAsync = promisify(fs.unlink);

router.post('/support', upload.single('attachment'), async (req, res) => {
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
    
    // Send email
    // Only attempt to send if credentials are set
    let emailSent = false;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      await transporter.sendMail(mailOptions);
      emailSent = true;
    } else {
      console.log('Email credentials not set. Would have sent:', mailOptions);
    }
    
    // Delete temp file after sending
    if (file) {
      await unlinkAsync(file.path);
    }
    
    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'Support request submitted successfully',
      emailSent
    });
  } catch (error) {
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
      details: error.message 
    });
  }
});

export default router;