import Interest from '../models/interestForm.js';
import CommunityManager from '../models/cManager.js';
import admin from '../models/admin.js';
import Community from '../models/communities.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import dotenv from 'dotenv';
dotenv.config();
// multerConfig.js - Create this file for reusable multer configuration
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

export default upload;
// Email transporter setup - Simplified version
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  }
});

// Display interest form (Public)
export const showInterestForm = (req, res) => {
  res.render('interestForms', {
    title: 'Community Manager Application',
    message: req.flash('message') || '',
    formData: req.flash('formData')[0] || {}
  });
};


export const submitInterestForm = async (req, res) => {
  try {
    // Extract form data
    const {
      firstName,
      lastName,
      email,
      phone,
      communityName,
      location,
      description
    } = req.body;

    // Required fields validation
    if (!firstName || !lastName || !email || !phone || !communityName || !location || !description) {
      // Clean up uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled.',
        receivedFields: {
          firstName: !!firstName,
          lastName: !!lastName,
          email: !!email,
          phone: !!phone,
          communityName: !!communityName,
          location: !!location,
          description: !!description
        }
      });
    }

    // Email validation
    if (!validator.isEmail(email)) {
      // Clean up uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    // Phone validation (basic)
    if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) {
      // Clean up uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid phone number.'
      });
    }

    // Process uploaded photos
    let photoPaths = [];
    if (req.files && req.files.length > 0) {
      console.log('Files received:', req.files.length);
      
      // The multer middleware already handles file type and size validation
      // Store relative paths for database
      photoPaths = req.files.map(file => {
        console.log('File saved at:', file.path);
        return file.path;
      });
    }

    // Create new interest application
    const newApplication = new Interest({
      firstName: validator.escape(firstName.trim()),
      lastName: validator.escape(lastName.trim()),
      email: email.toLowerCase().trim(),
      phone: validator.escape(phone.trim()),
      communityName: validator.escape(communityName.trim()),
      location: validator.escape(location.trim()),
      description: validator.escape(description.trim()),
      photos: photoPaths,
      status: 'pending',
      submittedAt: new Date()
    });

    // Save to database
    const savedApplication = await newApplication.save();
    console.log('New application saved:', savedApplication._id);
    console.log('Photos saved:', photoPaths);

    // Send notification email to admin (non-blocking)
    // Uncomment if you have this function implemented
    // notifyAdminOfNewApplication(savedApplication).catch(error => {
    //   console.error('Failed to send admin notification:', error);
    // });

    // Success response
    res.status(201).json({
      success: true,
      message: 'Your application has been submitted successfully! We will review it and get back to you soon.',
      data: {
        applicationId: savedApplication._id,
        submittedAt: savedApplication.submittedAt,
        status: savedApplication.status,
        photosCount: photoPaths.length
      }
    });

  } catch (error) {
    console.error('Error in submitInterestForm:', error);

    // Clean up any uploaded files if there was an error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `An application with this ${field} already exists.`
      });
    }

    // Multer error handling
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Each image must be smaller than 5MB.'
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 5 photos allowed.'
        });
      }
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your application. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// Admin: Get all applications
export const getAllApplications = async (req, res) => {
  try {
    const interests = await Interest.find().sort('createdAt');
    
    res.render('admin/interests', {
      title: 'Community Interest Applications',
      interests, // Changed from applications to interests
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Get interests error:', error);
    req.flash('error', 'Error fetching applications');
    res.redirect('/admin/dashboard');
  }
};

// Admin: Get single application
export const getApplication = async (req, res) => {
  try {
    const interest = await Interest.findById(req.params.id)
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email');
    
    if (!interest) {
      req.flash('error', 'Application not found');
      return res.redirect('/admin/interests'); // Updated route
    }

    res.render('admin/interestDetail', { // Updated view name
      title: 'Interest Application Details',
      interest // Changed from application to interest
    });
  } catch (error) {
    console.error('Get interest error:', error);
    req.flash('error', 'Error fetching application');
    res.redirect('/admin/interests'); // Updated route
  }
};

export const approveApplication = async (req, res) => {
  console.log("=== Approve Application Request ===");
  console.log("Params:", req.params);
  console.log("Body:", req.body);
  console.log("User:", req.user);

  try {
    // 1. Generate credentials
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 12);
    console.log("[Step 1] Generated credentials:", { randomPassword, hashedPassword: "(hidden)" });

    // 2. Get the interest application
    const interest = await Interest.findById(req.params.id);
    console.log("[Step 2] Fetched interest:", interest ? interest._id : "Not Found");

    if (!interest) {
      console.warn("[Step 2] No interest found for ID:", req.params.id);
      req.flash('error', 'Application not found');
      return res.redirect('/admin/interests');
    }

    // 3. Check for existing manager
    const existingManager = await CommunityManager.findOne({ email: interest.email });
    console.log("[Step 3] Existing manager check:", existingManager ? "Exists" : "Not Found");

    if (existingManager) {
      req.flash('error', 'Manager already exists with this email');
      return res.redirect('/admin/interests');
    }

    // 4. Prepare manager data
    const managerData = {
      name: `${interest.firstName} ${interest.lastName}`,
      email: interest.email,
      password: hashedPassword,
      contact: interest.phone || "0000000000",
      assignedCommunity: req.body.community
        ? mongoose.Types.ObjectId(req.body.community)
        : undefined
    };
    console.log("[Step 4] Manager data prepared:", managerData);

    // 5. Create manager
    const newManager = await CommunityManager.create(managerData);
    console.log("[Step 5] New manager created:", newManager._id);

    // 6. Create community
    const newCommunity = new Community({
      name: interest.communityName?.trim() || '',
      location: interest.location?.trim() || '',
      email: interest.communityEmail?.trim() || '',
      description: interest.description?.trim() || '',
      totalMembers: parseInt(interest.totalMembers) || 0,
      communityManager: newManager._id
    });
    console.log("[Step 6] New community prepared:", newCommunity);

    // Link community to manager
    newManager.assignedCommunity = newCommunity._id;
    await newManager.save();
    await newCommunity.save();
    console.log("[Step 6] Community saved and linked to manager");

    // 7. Update interest status
    const updatedInterest = await Interest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: Date.now()
      },
      { new: true }
    );
    console.log("[Step 7] Interest status updated:", updatedInterest.status);

    // 8. Send email
    console.log("[Step 8] Sending approval email to:", interest.email);
    await sendStatusEmail(
      interest.email,
      'approved',
      req.user.name,
      '',
      randomPassword
    );
    console.log("[Step 8] Email sent successfully");

    req.flash('success', 'Manager account and community created successfully');
    res.redirect('/admin/interests');

  } catch (error) {
    console.error("[ERROR] Approval process failed:", error);

    let errorMessage = 'Error creating manager account';
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.code === 11000) {
      errorMessage = 'A manager with this email already exists';
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid community ID format';
    }

    req.flash('error', errorMessage);
    res.redirect('/admin/interests');
  }
};



export const rejectApplication = async (req, res) => {
  try {
    if (!req.body.reason || req.body.reason.trim().length < 10) {
      req.flash('error', 'Rejection reason must be at least 10 characters');
      return res.redirect(`/admin/interests/${req.params.id}`); // Updated route
    }

    const interest = await Interest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectedBy: req.user.id,
        rejectedAt: Date.now(),
        rejectionReason: validator.escape(req.body.reason.trim())
      },
      { new: true, runValidators: true }
    );

    if (!interest) {
      req.flash('error', 'Application not found');
      return res.redirect('/admin/interests'); // Updated route
    }

    await sendStatusEmail(
      interest.email, 
      'rejected', 
      req.user.name, 
      validator.escape(req.body.reason.trim())
    );

    req.flash('success', 'Application rejected successfully');
    res.redirect('/admin/interests'); // Updated route

  } catch (error) {
    console.error('Rejection error:', error);
    req.flash('error', error.name === 'ValidationError' 
      ? 'Invalid rejection data' 
      : 'Error rejecting application');
    res.redirect(`/admin/interests/${req.params.id}`); // Updated route
  }
};
// Admin: Suspend application







const notifyAdminOfNewApplication = async (application) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ,
      to: process.env.ADMIN_EMAIL ,
      subject: 'New Community Manager Application',
      text: `New application received from ${application.firstName} ${application.lastName}`,
      html: `
        <h2>New Application Received</h2>
        <p><strong>Name:</strong> ${application.firstName} ${application.lastName}</p>
        <p><strong>Email:</strong> ${application.email}</p>
        <p><strong>Phone:</strong> ${application.phone}</p>
        <p>Please review this application in the admin panel.</p>
        <a href="${process.env.BASE_URL || 'http://localhost:3000'}/admin/applications">View Applications</a>
      `
    });
    console.log('Admin notification sent');
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

const sendStatusEmail = async (email, status, adminName, reason = '', password = '') => {
  const subject = status === 'approved' 
    ? 'Your Application Has Been Approved' 
    : `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  
 
  // Enhanced HTML template with modern styling
  const htmlTemplate = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Status Update</title>
  <style type="text/css">
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
    }
    
    /* Main styles */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;
    }
    
    .status-approved { background-color: #4CAF50; }
    .status-rejected { background-color: #f44336; }
    .status-pending { background-color: #ff9800; }
    
    .icon-approved:before { content: "✓"; }
    .icon-rejected:before { content: "✗"; }
    .icon-pending:before { content: "!"; }
    
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        margin: 0 !important;
      }
      .mobile-padding {
        padding-left: 15px !important;
        padding-right: 15px !important;
      }
      .mobile-text {
        font-size: 14px !important;
      }
      .button {
        width: 100% !important;
        display: block !important;
        padding: 15px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 20px 0; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center">
        
        <!-- Email Container -->
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td class="${status === 'approved' ? 'status-approved' : status === 'rejected' ? 'status-rejected' : 'status-pending'}" style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, ${status === 'approved' ? '#4CAF50, #45a049' : status === 'rejected' ? '#f44336, #d32f2f' : '#ff9800, #f57c00'});">
              
              <!-- Status Icon -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 20px;">
                <tr>
                  <td style="width: 70px; height: 70px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="color: white; font-size: 28px; font-weight: bold; line-height: 70px;">
                      ${status === 'approved' ? '✓' : status === 'rejected' ? '✗' : '!'}
                    </span>
                  </td>
                </tr>
              </table>
              
              <!-- Header Title -->
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Application ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : status.charAt(0).toUpperCase() + status.slice(1)}
              </h1>
              
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 30px;">
              
              <!-- Message -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 25px 0;">
                      ${ 'Thank you for your application. Please see the details below regarding your application status.'}
                    </p>
                  </td>
                </tr>
              </table>

              ${reason ? `
              <!-- Additional Information -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 20px; border-radius: 0 6px 6px 0;">
                    <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.5;">
                      <strong style="color: #212529;">Additional Information:</strong><br><br>
                      ${reason}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${status === 'approved' && password ? `
              <!-- Login Credentials -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: #e3f2fd; border: 2px solid #bbdefb; border-radius: 8px; padding: 25px;">
                    
                    <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                      🔑 Your Login Credentials
                    </h3>
                    
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #333; font-size: 15px;">Email:</strong>
                          <span style="color: #555; font-size: 15px; margin-left: 10px;">${email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #333; font-size: 15px;">Temporary Password:</strong><br>
                          <code style="background-color: #f5f5f5; padding: 8px 12px; border-radius: 4px; font-family: 'Courier New', Consolas, monospace; font-size: 14px; color: #c7254e; border: 1px solid #e1e1e8; margin-top: 5px; display: inline-block;">${password}</code>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Security Warning -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 20px;">
                      <tr>
                        <td style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px;">
                          
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
              </table>
              ` : ''}

              ${status === 'approved' ? `
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 35px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-radius: 6px; background: linear-gradient(135deg, #4CAF50, #45a049); box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);">
                          <a href="${process.env.BASE_URL || 'http://localhost:3000'}/login" 
                             style="display: inline-block; color: white; text-decoration: none; padding: 16px 32px; font-weight: 600; font-size: 16px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                            Login to Your Account
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : status === 'rejected' ? `
              <!-- Support Information for Rejected -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 6px; padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #742a2a; font-size: 14px;">
                      If you have questions about this decision or would like to reapply, please contact our support team.
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; border-top: 1px solid #e9ecef; text-align: center;">
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <p style="margin: 0 0 15px 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                      This is an automated message regarding your application status.
                    </p>
                    <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                      If you have any questions, please contact our support team at 
                      <a href="mailto:support@company.com" style="color: #007bff; text-decoration: none;">support@company.com</a>
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>

        </table>
        
        <!-- Spacer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td height="30"></td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      text: (password ? `\n\nYour temporary password: ${password}` : ''),
      html: htmlTemplate
    });
    console.log('Status email sent to:', email);
  } catch (error) {
    console.error('Error sending status email:', error);
  }
};