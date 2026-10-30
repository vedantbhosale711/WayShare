import express from 'express';
import { getPaymentHistory, updatePaymentStatus } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authenticate, getPaymentHistory);
router.put('/:id', authenticate, updatePaymentStatus);

export default router;
