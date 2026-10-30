import { query } from '../db/pool.js';

export const createReview = async (req, res, next) => {
  try {
    const { booking_id, rating, comment } = req.body;
    if (!booking_id || !rating) return res.status(400).json({ message: 'booking_id and rating required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    // Verify booking belongs to passenger and is completed
    const bookingRes = await query(
      `SELECT b.id, b.passenger_id, r.driver_id, b.status
       FROM bookings b JOIN rides r ON r.id=b.ride_id
       WHERE b.id=$1 AND b.passenger_id=$2`,
      [booking_id, req.user.id]
    );
    if (!bookingRes.rows.length) return res.status(403).json({ message: 'Booking not found or not authorized' });
    const booking = bookingRes.rows[0];
    if (booking.status !== 'completed') return res.status(400).json({ message: 'Can only review completed rides' });

    const result = await query(
      `INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [booking_id, req.user.id, booking.driver_id, parseInt(rating), comment || null]
    );

    // Update driver average rating
    await query(
      `UPDATE driver_profiles SET average_rating=(
         SELECT AVG(r2.rating) FROM reviews r2
         JOIN bookings b2 ON b2.id=r2.booking_id
         JOIN rides ri ON ri.id=b2.ride_id
         WHERE ri.driver_id=$1
       ), updated_at=NOW() WHERE user_id=$1`,
      [booking.driver_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

export const getDriverReviews = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT rv.*, u.full_name as reviewer_name, u.profile_picture as reviewer_photo
       FROM reviews rv JOIN users u ON u.id=rv.reviewer_id
       WHERE rv.reviewee_id=$1 ORDER BY rv.created_at DESC`,
      [req.params.driverId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const getMyReview = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM reviews WHERE booking_id=$1 AND reviewer_id=$2',
      [req.params.bookingId, req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) { next(err); }
};
