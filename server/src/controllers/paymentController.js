import { query } from '../db/pool.js';

export const getPaymentHistory = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, b.seats_booked, r.origin_address, r.destination_address, r.departure_datetime,
              payer.full_name as payer_name, payee.full_name as payee_name
       FROM payments p
       JOIN bookings b ON b.id=p.booking_id
       JOIN rides r ON r.id=b.ride_id
       JOIN users payer ON payer.id=p.payer_id
       JOIN users payee ON payee.id=p.payee_id
       WHERE p.payer_id=$1 OR p.payee_id=$1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status, payment_method } = req.body;
    const allowed = ['pending', 'completed', 'failed', 'refunded'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const result = await query(
      `UPDATE payments SET status=$1, payment_method=COALESCE($2, payment_method), updated_at=NOW()
       WHERE id=$3 AND (payer_id=$4 OR payee_id=$4) RETURNING *`,
      [status, payment_method || null, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Payment not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};
