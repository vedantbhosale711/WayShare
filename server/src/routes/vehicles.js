import express from 'express';
import { getMyVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import { authenticate, requireDriver } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', authenticate, requireDriver, getMyVehicles);
router.get('/:id', authenticate, requireDriver, getVehicle);
router.post('/', authenticate, requireDriver, upload.single('vehicle_image'), createVehicle);
router.put('/:id', authenticate, requireDriver, upload.single('vehicle_image'), updateVehicle);
router.delete('/:id', authenticate, requireDriver, deleteVehicle);

export default router;
