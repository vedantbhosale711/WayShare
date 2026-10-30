
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { runMigrations } from './db/migrate.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import driverRoutes from './routes/driver.js';
import vehicleRoutes from './routes/vehicles.js';
import rideRoutes from './routes/rides.js';
import bookingRoutes from './routes/bookings.js';
import notificationRoutes from './routes/notifications.js';
import paymentRoutes from './routes/payments.js';
import reviewRoutes from './routes/reviews.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://10.203.28.74:5173',
  'http://ec2-13-233-120-45.ap-south-1.compute.amazonaws.com:5173'
];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads
app.use(
  '/uploads',
  (req, res, next) => {
    // In production, verify JWT here for sensitive documents
    next();
  },
  express.static(path.join(__dirname, '..', 'uploads'))
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await runMigrations();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚗 WayShare Server running on http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
