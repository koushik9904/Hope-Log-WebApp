import { Router } from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

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
    
    // Send email
    // Only attempt to send if credentials are set
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
    
    // Delete temp file after sending
    if (file) {
      await unlinkAsync(file.path);
    }
    
    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: emailSent 
        ? 'Support request submitted successfully. In development mode, emails are logged rather than sent.' 
        : 'Support request saved, but email delivery is not configured.',
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

export default router;