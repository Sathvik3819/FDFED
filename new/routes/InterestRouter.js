import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  submitInterestForm,
  showInterestForm,
} from '../controllers/interestForm.js';

const interestRouter = express.Router();

// Ensure upload directory exists
const uploadDir = 'uploads/interest-photos';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `photo-${uniqueSuffix}${ext}`);
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

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  }
});

// Public routes
interestRouter.get('/', showInterestForm);
interestRouter.post('/submit', upload.array('photos', 5), submitInterestForm);

export default interestRouter;