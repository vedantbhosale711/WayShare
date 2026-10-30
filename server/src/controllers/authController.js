import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const register = async (req, res, next) => {
  try {
    const { full_name, email, mobile, password, gender } = req.body;
    if (!full_name || !email || !mobile || !password) {
      return res.status(400).json({ message: 'full_name, email, mobile, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const existing = await query('SELECT id FROM users WHERE email=$1 OR mobile=$2', [email, mobile]);
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email or mobile already registered' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (full_name, email, mobile, password_hash, gender, role)
       VALUES ($1,$2,$3,$4,$5,'passenger') RETURNING id, full_name, email, mobile, gender, role, is_driver`,
      [full_name.trim(), email.toLowerCase().trim(), mobile.trim(), hash, gender || null]
    );
    const user = result.rows[0];
    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const result = await query(
      'SELECT id, full_name, email, mobile, password_hash, gender, role, is_driver, is_active FROM users WHERE email=$1',
      [email.toLowerCase().trim()]
    );
    if (!result.rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account deactivated. Contact support.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = signToken(user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'current_password and new_password required' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    const result = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.full_name, u.email, u.mobile, u.gender, u.profile_picture, u.role, u.is_driver, u.is_mobile_verified, u.created_at,
              dp.licence_number, dp.is_verified as driver_verified, dp.total_rides, dp.average_rating
       FROM users u LEFT JOIN driver_profiles dp ON dp.user_id = u.id
       WHERE u.id=$1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { full_name, gender, mobile } = req.body;
    const profile_picture = req.file ? `/uploads/profile_picture/${req.file.filename}` : undefined;

    // Check mobile uniqueness if changed
    if (mobile) {
      const existing = await query('SELECT id FROM users WHERE mobile=$1 AND id!=$2', [mobile, req.user.id]);
      if (existing.rows.length) return res.status(409).json({ message: 'Mobile already in use' });
    }

    const fields = [];
    const values = [];
    let idx = 1;
    if (full_name) { fields.push(`full_name=$${idx++}`); values.push(full_name.trim()); }
    if (gender) { fields.push(`gender=$${idx++}`); values.push(gender); }
    if (mobile) { fields.push(`mobile=$${idx++}`); values.push(mobile.trim()); }
    if (profile_picture) { fields.push(`profile_picture=$${idx++}`); values.push(profile_picture); }
    fields.push(`updated_at=NOW()`);

    if (fields.length === 1) return res.status(400).json({ message: 'No fields to update' });

    values.push(req.user.id);
    const result = await query(
      `UPDATE users SET ${fields.join(',')} WHERE id=$${idx} RETURNING id, full_name, email, mobile, gender, profile_picture, role, is_driver`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};
