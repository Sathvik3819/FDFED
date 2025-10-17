import nodemailer from "nodemailer";
import Resident from "../models/resident.js";
import Worker from "../models/workers.js";
import Security from "../models/security.js";
import bcrypt from "bcrypt";

import dotenv from "dotenv";
import CommunityManager from "../models/cManager.js";
dotenv.config();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

let otp1;

// Store OTPs for forgot password with expiration
const forgotPasswordOTPs = new Map();

async function OTP(email) {
  const otp = await generateOTP();
  otp1 = otp;

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
    rejectUnauthorized: false
  }
  });

  let mes = {
    from: '"Urban ease" ',
    to: email,
    subject: "Your One-Time Password (OTP) for Account Access",
    text: `Dear User,\n\nYour OTP is: ${otp}\n\nDo not share it with anyone.`,
    html: `
    <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
      <p>Dear User,</p>
      <p>We received a request to log in or perform a secure action using your account.</p>
      <p><strong style="font-size: 18px;">🔐 OTP: ${otp}</strong></p>
      <p>Please do not share this OTP with anyone. It is valid for a limited time and can be used only once.</p>
      <p>If you did not request this OTP, please ignore this email or contact support.</p>
      <br/>
      <p>Best regards,<br/>Uran ease<br/>\nVisitor Management System</p>
    </div>
  `,
  };

  const info = await transporter.sendMail(mes, (err, info) => {
    if (err) console.log(err);
    else console.log(otp);
  });

  return otp;
}

function verify(email, otp) {
  if (otp1 === otp) {
    return true;
  } else {
    return false;
  }
}

function generateSecurePassword(email) {
  const randomChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&";
  const randomLength = 8;

  const emailPrefix = email.split("@")[0].slice(0, 4);

  let randomPart = "";
  for (let i = 0; i < randomLength; i++) {
    const randomIndex = Math.floor(Math.random() * randomChars.length);
    randomPart += randomChars[randomIndex];
  }

  const password = emailPrefix + "_" + randomPart;

  return password;
}

async function sendPassword({ email, userType,password }) {
 

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let mes = {
    from: '"Urban Ease Team" <noreply@urbaneaseapp.com>',
    to: email,
    subject: "Your Temporary Password - Immediate Action Required",
    text: `Dear ${userType || 'User'},

Your temporary password is: ${password}

IMPORTANT: This is a temporary password. Please log in immediately and set your custom password to ensure account security.

Do not share this password with anyone.

Best regards,
Urban Ease Team
User Management System`,

    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Temporary Password - Urban Ease</title>
      <style>
        /* Reset styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f8f9fa;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .header {
          background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        
        .header h1 {
          font-size: 32px;
          font-weight: 600;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        
        .header .subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 300;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .user-type-badge {
          display: inline-block;
          background: #e8f2ff;
          color: #0d6efd;
          padding: 10px 20px;
          border-radius: 25px;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 25px;
          border: 1px solid #b6d7ff;
        }
        
        .content h2 {
          color: #212529;
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 20px;
          line-height: 1.2;
        }
        
        .intro-text {
          color: #6c757d;
          font-size: 16px;
          margin-bottom: 30px;
          line-height: 1.7;
        }
        
        .password-container {
          background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
          border-radius: 12px;
          padding: 35px 25px;
          text-align: center;
          margin: 30px 0;
          position: relative;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        }
        
        .password-container::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
          border-radius: 14px;
          z-index: -1;
          opacity: 0.3;
        }
        
        .password-label {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          margin-bottom: 15px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .password-value {
          color: #ffffff;
          font-size: 32px;
          font-weight: 700;
          font-family: 'Courier New', Monaco, monospace;
          letter-spacing: 3px;
          margin-bottom: 10px;
          word-break: break-all;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .password-icon {
          font-size: 24px;
          margin-bottom: 10px;
        }
        
        .warning-box {
          background: linear-gradient(135deg, #fff3cd 0%, #ffecb5 100%);
          border-left: 5px solid #ffc107;
          padding: 20px 25px;
          margin: 30px 0;
          border-radius: 12px;
          position: relative;
        }
        
        .warning-box::before {
          content: '⚠️';
          position: absolute;
          left: 25px;
          top: 20px;
          font-size: 18px;
        }
        
        .warning-box .warning-title {
          color: #664d03;
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 8px;
          padding-left: 35px;
        }
        
        .warning-box .warning-text {
          color: #997404;
          font-size: 14px;
          line-height: 1.6;
          padding-left: 35px;
        }
        
        .security-notice {
          background: linear-gradient(135deg, #d1e7dd 0%, #badbcc 100%);
          border: 1px solid #a3cfbb;
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
        }
        
        .security-notice h3 {
          color: #0f5132;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
        }
        
        .security-notice h3::before {
          content: '🔒';
          margin-right: 10px;
        }
        
        .security-notice ul {
          color: #198754;
          font-size: 14px;
          padding-left: 20px;
          line-height: 1.7;
        }
        
        .security-notice li {
          margin-bottom: 6px;
        }
        
        .cta-section {
          text-align: center;
          margin: 35px 0;
        }
        
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #ff6b35 0%, #e55100 100%);
          color: white;
          
          padding: 15px 35px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }
        
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
          color: white;
          text-decoration: none;
        }
        .cta-button,
.cta-button:link,
.cta-button:visited,
.cta-button:hover,
.cta-button:active,
.cta-button:focus {
  color: #fff !important;
  text-decoration: none;
}

        .support-section {
          background-color: #f8f9fa;
          border-radius: 12px;
          padding: 25px;
          margin-top: 30px;
        }
        
        .support-section h4 {
          color: #212529;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        
        .support-section p {
          color: #6c757d;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }
        
        .support-section a {
          color: #0d6efd;
          text-decoration: none;
          font-weight: 500;
        }
        
        .support-section a:hover {
          color: #0056b3;
          text-decoration: underline;
        }
        
        .footer {
          background-color: #f8f9fa;
          padding: 30px;
          border-top: 1px solid #dee2e6;
          text-align: center;
        }
        
        .footer .signature {
          color: #212529;
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 5px;
        }
        
        .footer .company {
          color: #0d6efd;
          font-weight: 600;
          font-size: 18px;
        }
        
        .footer .system {
          color: #6c757d;
          font-size: 14px;
          margin: 8px 0;
        }
        
        .footer .disclaimer {
          color: #6c757d;
          font-size: 12px;
          margin-top: 20px;
          font-style: italic;
          opacity: 0.8;
        }
        
        /* Responsive Design */
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .header {
            padding: 30px 20px;
          }
          
          .header h1 {
            font-size: 24px;
          }
          
          .password-value {
            font-size: 24px;
            letter-spacing: 1px;
          }
          
          .content h2 {
            font-size: 22px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <h1>Urban Ease</h1>
          <div class="subtitle">User Management System</div>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- User Type Badge -->
          <div class="user-type-badge">
            ${userType || 'User'} Account
          </div>
          
          <h2>Temporary Password Issued</h2>
          
          <p class="intro-text">
            A temporary password has been generated for your account. Please use this password to log in and immediately set up your personal password for enhanced security.
          </p>
          
          <!-- Password Container -->
          <div class="password-container">
            <div class="password-icon">🔐</div>
            <div class="password-label">Your Temporary Password</div>
            <div class="password-value">${password}</div>
          </div>
          
          <!-- Warning Box -->
          <div class="warning-box">
            <div class="warning-title">Immediate Action Required</div>
            <div class="warning-text">
              This is a <strong>temporary password</strong>. You must change it immediately after your first login to ensure account security. Do not share this password with anyone.
            </div>
          </div>
          
         
          
          <!-- CTA Section -->
          <div class="cta-section">
            <a href="http://localhost:3000/manager/Login" class="cta-button">Login Now & Set Password</a>
          </div>
          
          <!-- Support Section -->
          <div class="support-section">
            <h4>Need Help?</h4>
            <p>
              If you're having trouble accessing your account or need assistance, 
              contact our support team at 
              <a href="mailto:urbanEase.team@gmail.com">urbanEase.team@gmail.com</a> 
              or visit our help center.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="signature">Best regards,</div>
          <div class="company">Urban Ease Team</div>
          <div class="system">User Management System</div>
          <div class="disclaimer">
            This is an automated message. Please do not reply to this email.
          </div>
        </div>
      </div>
    </body>
    </html>
  `
  };

  const info = await transporter.sendMail(mes, (err, info) => {
    if (err) console.log(err);
    else console.log("password sent to email:", password);
  });

  return password;
}

// NEW FUNCTIONS FOR FORGOT PASSWORD FEATURE

// Check if email exists in any user collection
async function checkEmailExists(email) {
  try {
    const resident = await Resident.findOne({ email: email });
    if (resident) return { exists: true, userType: 'Resident', user: resident };

    const worker = await Worker.findOne({ email: email });
    if (worker) return { exists: true, userType: 'Worker', user: worker };

    const security = await Security.findOne({ email: email });
    if (security) return { exists: true, userType: 'Security', user: security };

    const communityManager = await CommunityManager.findOne({ email: email });
    if (communityManager) return { exists: true, userType: 'Community Manager', user: communityManager };


    return { exists: false };
  } catch (error) {
    console.error("Error checking email:", error);
    throw error;
  }
}

// Send OTP for forgot password
async function sendForgotPasswordOTP(email) {
  const otp = generateOTP();
  
  // Store OTP with 5 minute expiration
  forgotPasswordOTPs.set(email, {
    otp: otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  let mes = {
    from: '"Urban Ease" ',
    to: email,
    subject: "Password Reset OTP - Urban Ease",
    text: `Dear User,\n\nYou requested to reset your password.\n\nYour OTP is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nIf you didn't request this, please ignore this email.`,
    html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You have requested to reset your password for Urban Ease.</p>
      <p>Your One-Time Password (OTP) is:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #666;">This OTP is valid for 5 minutes.</p>
      <p style="color: #666;">If you didn't request this, please ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #999; font-size: 12px;">Urban Ease - Community Management</p>
    </div>
  `,
  };

  await transporter.sendMail(mes, (err, info) => {
    if (err) console.log("Error sending OTP:", err);
    else console.log("Forgot password OTP sent:", otp);
  });

  return true;
}

// Verify forgot password OTP
function verifyForgotPasswordOTP(email, otp) {
  const storedData = forgotPasswordOTPs.get(email);

  if (!storedData) {
    return { success: false, message: "OTP not found or expired" };
  }

  if (Date.now() > storedData.expiresAt) {
    forgotPasswordOTPs.delete(email);
    return { success: false, message: "OTP has expired" };
  }

  if (storedData.otp !== otp) {
    return { success: false, message: "Invalid OTP" };
  }

  // OTP is valid
  forgotPasswordOTPs.delete(email);
  return { success: true };
}

// Reset password and send temporary password
async function resetPasswordAndSendEmail(email, userType) {
  try {
    const tempPassword = generateSecurePassword(email);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update password in the appropriate collection
    let updateResult;
    switch (userType) {
      case 'Resident':
        updateResult = await Resident.updateOne(
          { email: email },
          { password: hashedPassword }
        );
        break;
      case 'Worker':
        updateResult = await Worker.updateOne(
          { email: email },
          { password: hashedPassword }
        );
        break;
      case 'Security':
        updateResult = await Security.updateOne(
          { email: email },
          { password: hashedPassword }
        );

        break;
      case 'Community Manager':
        updateResult= await CommunityManager.updateOne(
          { email: email },
          { password: hashedPassword }
        );
        break;
      default:
        throw new Error("Invalid user type");
    }

    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to update password");
    }
    console.log(tempPassword)
    // Send temporary password email (reusing existing sendPassword function)
    await sendPassword({ email, userType, password: tempPassword});

    return { success: true, message: "Password reset successful" };
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
}

// Clean up expired OTPs periodically (run every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of forgotPasswordOTPs.entries()) {
    if (now > data.expiresAt) {
      forgotPasswordOTPs.delete(email);
    }
  }
}, 10 * 60 * 1000);

export { 
  OTP, 
  verify, 
  sendPassword,
  checkEmailExists,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPasswordAndSendEmail
};