import express from 'express';
import {
  createReport, createSupportTicket, getMyTickets,
  adminGetUsers, adminToggleUser, adminGetRides,
  adminGetReports, adminUpdateReport, adminGetTickets, adminUpdateTicket, adminGetStats,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public (authenticated) - for users
router.post('/reports', authenticate, createReport);
router.post('/support-tickets', authenticate, createSupportTicket);
router.get('/support-tickets/mine', authenticate, getMyTickets);

// Admin only
router.get('/stats', authenticate, requireAdmin, adminGetStats);
router.get('/users', authenticate, requireAdmin, adminGetUsers);
router.put('/users/:id/toggle', authenticate, requireAdmin, adminToggleUser);
router.get('/rides', authenticate, requireAdmin, adminGetRides);
router.get('/reports', authenticate, requireAdmin, adminGetReports);
router.put('/reports/:id', authenticate, requireAdmin, adminUpdateReport);
router.get('/support-tickets', authenticate, requireAdmin, adminGetTickets);
router.put('/support-tickets/:id', authenticate, requireAdmin, adminUpdateTicket);

export default router;
