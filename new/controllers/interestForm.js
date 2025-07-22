import Interest from '../models/interestForm.js';
import CommunityManager from '../models/cManager.js';
import admin from '../models/admin.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import dotenv from 'dotenv';
dotenv.config();
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

// Submit interest form (Public)
export const submitInterestForm = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    // Validate all required inputs
    if (!firstName || !lastName || !email || !phone) {
      req.flash('message', 'All fields are required');
      req.flash('formData', req.body);
      return res.redirect('/interest');
    }

    if (!validator.isEmail(email)) {
      req.flash('message', 'Please provide a valid email address');
      req.flash('formData', req.body);
      return res.redirect('/interest');
    }

    // Create new application
    const newInterest = await Interest.create({
      firstName,
      lastName,
      email,
      phone,
      status: 'pending'
    });

    // Create verification token and send email
    const verificationToken = newInterest.createVerificationToken();
    await newInterest.save({ validateBeforeSave: false });

    await sendVerificationEmail(newInterest.email, verificationToken);
    await notifyAdminOfNewApplication(newInterest);

    req.flash('success', 'Application submitted! Please check your email for verification.');
    res.redirect('/interest')

  } catch (error) {
    console.error('Application error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      req.flash('message', messages.join(', '));
    } else {
      req.flash('message', 'Error submitting application. Please try again.');
    }
    
    req.flash('formData', req.body);
    res.redirect('/interest');
  }
};

// Admin: Get all applications
export const getAllApplications = async (req, res) => {
  try {
    const applications = await Interest.find().sort('createdAt');
    
    res.render('admin/interests', {
      title: 'All Applications',
      applications,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Get applications error:', error);
    req.flash('error', 'Error fetching applications');
    res.redirect('/admin/dashboard');
  }
};

// Admin: Get single application
export const getApplication = async (req, res) => {
  try {
    const application = await Interest.findById(req.params.id)
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email');
    
    if (!application) {
      req.flash('error', 'Application not found');
      return res.redirect('/admin/applications');
    }

    res.render('admin/applicationDetail', {
      title: 'Application Details',
      application
    });
  } catch (error) {
    console.error('Get application error:', error);
    req.flash('error', 'Error fetching application');
    res.redirect('/admin/applications');
  }
};

export const approveApplication = async (req, res) => {
  try {
    // Generate credentials
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    // 1. Get the application
    const application = await Interest.findById(req.params.id);
    if (!application) {
      req.flash('error', 'Application not found');
      return res.redirect('/admin/applications');
    }
     console.log("haha1")
    // 2. Check for existing manager
    const existingManager = await CommunityManager.findOne({ email: application.email });
    if (existingManager) {
      req.flash('error', 'Manager already exists with this email');
      return res.redirect('/admin/applications');
    }
   

    // 3. Prepare manager data according to your schema
    const managerData = {
      name: `${application.firstName} ${application.lastName}`,
      email: application.email,
      password: hashedPassword,
      contact: application.phone||"0000000000", // Using phone from application as contact
      assignedCommunity: req.body.community 
        ? mongoose.Types.ObjectId(req.body.community) 
        : undefined // Don't set if not provided
    };

    // 4. Create manager
    const newManager = await CommunityManager.create(managerData);
    console.log('New manager created:', newManager);

    // 5. Update application status
    await Interest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'active',
        password: hashedPassword,
        approvedBy: req.user.id,
        approvedAt: Date.now()
      }
    );

    // 6. Send email
    await sendStatusEmail(
      application.email, 
      'approved', 
      req.user.name,
      '',
      randomPassword
    );

    req.flash('success', 'Manager account created successfully');
    res.redirect('/admin/applications');

  } catch (error) {
    console.error('Approval error:', error);
    
    let errorMessage = 'Error creating manager account';
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.code === 11000) {
      errorMessage = 'A manager with this email already exists';
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid community ID format';
    }
    
    req.flash('error', errorMessage);
    res.redirect('/admin/applications');
  }
};

export const rejectApplication = async (req, res) => {
  try {
    if (!req.body.reason || req.body.reason.trim().length < 10) {
      req.flash('error', 'Rejection reason must be at least 10 characters');
      return res.redirect(`admin/applications/${req.params.id}`);
    }

    const application = await Interest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectedBy: req.user.id,
        rejectedAt: Date.now(),
        rejectionReason: validator.escape(req.body.reason.trim())
      },
      { new: true, runValidators: true }
    );

    if (!application) {
      req.flash('error', 'Application not found');
      return res.redirect('/admin/applications');
    }

    await sendStatusEmail(
      application.email, 
      'rejected', 
      req.user.name, 
      validator.escape(req.body.reason.trim())
    );

    req.flash('success', 'Application rejected successfully');
    res.redirect('/admin/applications');

  } catch (error) {
    console.error('Rejection error:', error);
    req.flash('error', error.name === 'ValidationError' 
      ? 'Invalid rejection data' 
      : 'Error rejecting application');
    res.redirect(`/admin/applications/${req.params.id}`);
  }
};
// Admin: Suspend application





// Helper Functions

const sendVerificationEmail = async (email, token) => {
  const verificationURL = `${process.env.BASE_URL}/verify-email/${token}`;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ,
      to: email,
      subject: 'Verify Your Email Address',
      text: `Please verify your email by clicking this link: ${verificationURL}`,
      html: `
        <h2>Email Verification</h2>
        <p>Please click the link below to verify your email:</p>
        <a href="${verificationURL}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `
    });
    console.log('Verification email sent to:', email);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

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
  
  const message = status === 'approved'
    ? `Congratulations! Your application has been approved by ${adminName}.`
    : `Your application has been ${status} by ${adminName}. ${reason ? `Reason: ${reason}` : ''}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "likhit.2804@gmail.com",
      to: email,
      subject,
      text: message + (password ? `\n\nYour temporary password: ${password}` : ''),
      html: `
        <h2>Application Status Update</h2>
        <p>${message}</p>
        ${status === 'approved' ? `
          ${password ? `<p><strong>Temporary Password:</strong> ${password}</p>` : ''}
          <p>You can now <a href="${process.env.BASE_URL || 'http://localhost:3000'}/login">login to your account</a>.</p>
          <p>Please change your password after logging in.</p>
        ` : ''}
      `
    });
    console.log('Status email sent to:', email);
  } catch (error) {
    console.error('Error sending status email:', error);
  }
};