import express from 'express';
import { register, login, getMe, updateProfile, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, upload.single('profile_picture'), updateProfile);
router.post('/change-password', authenticate, changePassword);

export default router;
