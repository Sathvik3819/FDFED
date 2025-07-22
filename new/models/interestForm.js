import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import crypto from 'crypto';
import admin from '../models/admin.js';
const InterestSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{3,6}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },

  // Password fields
  password: {
    type: String,
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  temporaryPassword: {
    type: String,
    select: false
  },

  

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'admin'
  },
  approvedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'admin'
  },
  rejectedAt: Date,
  rejectionReason: String,
  
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected', 'deactivated'],
    default: 'pending'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Password encryption middleware
InterestSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000; // Ensures token is created after password change
  next();
});

// Generate verification token
InterestSchema.methods.createVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Generate password reset token
InterestSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate temporary password
InterestSchema.methods.generateTemporaryPassword = function() {
  const tempPassword = crypto.randomBytes(4).toString('hex');
  this.temporaryPassword = tempPassword;
  this.passwordChangedAt = Date.now();
  return tempPassword;
};

// Check password
InterestSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if password was changed after token was issued
InterestSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Query middleware to populate approvedBy admin
InterestSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'approvedBy rejectedBy',
    select: 'name email'
  });
  next();
});

const Interest = mongoose.model('Interest', InterestSchema);
export default Interest;