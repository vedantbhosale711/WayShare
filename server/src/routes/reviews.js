import express from 'express';
import { createReview, getDriverReviews, getMyReview } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.post('/', authenticate, createReview);
router.get('/driver/:driverId', getDriverReviews);
router.get('/booking/:bookingId/mine', authenticate, getMyReview);

export default router;
