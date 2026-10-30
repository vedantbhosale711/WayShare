import express from 'express';
import {
  getEmergencyContact, upsertEmergencyContact, deleteEmergencyContact,
  getFavouriteDrivers, addFavouriteDriver, removeFavouriteDriver,
  getFavouriteLocations, addFavouriteLocation, removeFavouriteLocation,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Emergency contacts
router.get('/emergency-contact', authenticate, getEmergencyContact);
router.put('/emergency-contact', authenticate, upsertEmergencyContact);
router.delete('/emergency-contact', authenticate, deleteEmergencyContact);

// Favourite drivers
router.get('/favourite-drivers', authenticate, getFavouriteDrivers);
router.post('/favourite-drivers', authenticate, addFavouriteDriver);
router.delete('/favourite-drivers/:driverId', authenticate, removeFavouriteDriver);

// Favourite locations
router.get('/favourite-locations', authenticate, getFavouriteLocations);
router.post('/favourite-locations', authenticate, addFavouriteLocation);
router.delete('/favourite-locations/:id', authenticate, removeFavouriteLocation);

export default router;
