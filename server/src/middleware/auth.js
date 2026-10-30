import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT id, email, role, is_driver, is_active, full_name, gender FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!result.rows.length || !result.rows[0].is_active) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireDriver = (req, res, next) => {
  if (!req.user.is_driver) {
    return res.status(403).json({ message: 'Driver registration required' });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT id, email, role, is_driver, is_active, full_name, gender FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (result.rows.length && result.rows[0].is_active) {
      req.user = result.rows[0];
    }
  } catch (_) {}
  next();
};
