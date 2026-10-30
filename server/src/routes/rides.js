import express from 'express';
import {
  createRide, getRide, searchRides, getWomenOnlyRides, getMyRides,
  updateRide, cancelRide, duplicateRide, saveRoute, getSavedRoutes, deleteSavedRoute,
} from '../controllers/rideController.js';
import { authenticate, requireDriver, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', optionalAuth, searchRides);
router.get('/women-only', optionalAuth, getWomenOnlyRides);
router.get('/my', authenticate, requireDriver, getMyRides);
router.get('/saved-routes', authenticate, getSavedRoutes);
router.post('/saved-routes', authenticate, saveRoute);
router.delete('/saved-routes/:id', authenticate, deleteSavedRoute);
router.post('/', authenticate, requireDriver, createRide);
router.get('/:id', optionalAuth, getRide);
router.put('/:id', authenticate, requireDriver, updateRide);
router.post('/:id/cancel', authenticate, requireDriver, cancelRide);
router.post('/:id/duplicate', authenticate, requireDriver, duplicateRide);

export default router;
