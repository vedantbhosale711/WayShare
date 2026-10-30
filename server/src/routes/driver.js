import express from 'express';
import { registerAsDriver, getDriverProfile, getDriverStats } from '../controllers/driverController.js';
import { authenticate, requireDriver } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/register',
  authenticate,
  upload.fields([
    { name: 'licence_document', maxCount: 1 },
    { name: 'rc_document', maxCount: 1 },
    { name: 'vehicle_image', maxCount: 1 },
  ]),
  registerAsDriver
);
router.get('/stats', authenticate, requireDriver, getDriverStats);
router.get('/profile', authenticate, requireDriver, (req, res, next) => {
  req.params.driverId = req.user.id; getDriverProfile(req, res, next);
});
router.get('/:driverId/profile', getDriverProfile);

export default router;
