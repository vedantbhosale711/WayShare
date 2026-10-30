import express from 'express';
import {
  createBooking, getMyBookings, getBookingDetails,
  getRideBookingRequests, getAllDriverBookingRequests,
  updateBookingStatus, cancelBooking,
} from '../controllers/bookingController.js';
import { authenticate, requireDriver } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createBooking);
router.get('/my', authenticate, getMyBookings);
router.get('/driver/all', authenticate, requireDriver, getAllDriverBookingRequests);
router.get('/ride/:rideId', authenticate, requireDriver, getRideBookingRequests);
router.get('/:id', authenticate, getBookingDetails);
router.post('/:id/action', authenticate, requireDriver, updateBookingStatus);
router.post('/:id/cancel', authenticate, cancelBooking);

export default router;
