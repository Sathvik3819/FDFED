import express from 'express';
import {
  submitInterestForm,
  showInterestForm,
} from '../controllers/interestForm.js';

const interestRouter = express.Router();

// Public routes
interestRouter.get('/', showInterestForm);
interestRouter.post('/submit', submitInterestForm);

export default interestRouter;