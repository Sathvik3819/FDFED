import nodemailer from "nodemailer";
import Resident from "../models/resident.js";
import Worker from "../models/workers.js";
import Security from "../models/security.js";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

let otp1;

async function OTP(email) {
  const otp = await generateOTP();
  otp1 = otp;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "sathvikchiluka@gmail.com",
      pass: "ehho qecv dlaz rtrr",
    },
  });

  let mes = {
    from: '"Urban ease" <sathvikchiluka@gmail.com>',
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

async function sendPassword(email) {
  const password = generateSecurePassword(email);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "sathvikchiluka@gmail.com",
      pass: "ehho qecv dlaz rtrr",
    },
  });

  let mes = {
    from: '"Urban ease Team" <sathvikchiluka@gmail.com>',
    to: email,
    subject: "Password To Login",
    text: `Dear User,\n\nYour OTP is: ${password}\n\nDo not share it with anyone.`,
    html: `
    <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
      <p>Dear User,</p>
      <p>We received a request to log in or perform a secure action using your account.</p>
      <p><strong style="font-size: 18px;">🔐 PASSWORD : ${password}</strong></p>
      <p>Please do not share this password with anyone.\n<b style="font-size: 20px;">Log in using this password and set your custom password to ensure security</b>.</p>
      <br/>
      <p>Best regards,<br/>Urban ease<br/>\nUser Management System</p>
    </div>
  `,
  };

  const info = await transporter.sendMail(mes, (err, info) => {
    if (err) console.log(err);
    else console.log("password sent to email:",pass);
  });

  return password;
}

export { OTP, verify, sendPassword };
