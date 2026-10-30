import { query } from '../db/pool.js';

export const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data) VALUES ($1,$2,$3,$4,$5)`,
      [userId, type, title, message, JSON.stringify(data)]
    );
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const markAsRead = async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) { next(err); }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=FALSE',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) { next(err); }
};
