import { query, transaction } from '../db/pool.js';

export const registerAsDriver = async (req, res, next) => {
  try {
    const { licence_number, registration_number, make, model, year, color, vehicle_type, total_seats } = req.body;
    if (!registration_number || !make || !model || !year || !color || !total_seats) {
      return res.status(400).json({ message: 'Vehicle details are required' });
    }
    const licence_document = req.files?.licence_document?.[0]
      ? `/uploads/licence_document/${req.files.licence_document[0].filename}` : null;
    const rc_document = req.files?.rc_document?.[0]
      ? `/uploads/rc_document/${req.files.rc_document[0].filename}` : null;
    const vehicle_image = req.files?.vehicle_image?.[0]
      ? `/uploads/vehicle_image/${req.files.vehicle_image[0].filename}` : null;

    await transaction(async (client) => {
      // Upsert driver_profile
      await client.query(
        `INSERT INTO driver_profiles (user_id, licence_number, licence_document, rc_document)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (user_id) DO UPDATE SET licence_number=$2, licence_document=COALESCE($3, driver_profiles.licence_document), rc_document=COALESCE($4, driver_profiles.rc_document), updated_at=NOW()`,
        [req.user.id, licence_number || null, licence_document, rc_document]
      );

      // Insert vehicle
      await client.query(
        `INSERT INTO vehicles (driver_id, registration_number, make, model, year, color, vehicle_type, total_seats, vehicle_image)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [req.user.id, registration_number.toUpperCase(), make, model, parseInt(year), color, vehicle_type || 'car', parseInt(total_seats), vehicle_image]
      );

      // Promote user to driver
      await client.query(
        `UPDATE users SET is_driver=TRUE, role='driver', updated_at=NOW() WHERE id=$1`,
        [req.user.id]
      );
    });

    const result = await query(
      'SELECT id, full_name, email, mobile, gender, role, is_driver FROM users WHERE id=$1',
      [req.user.id]
    );
    res.status(201).json({ message: 'Driver registration successful', user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const getDriverProfile = async (req, res, next) => {
  try {
    const driverId = req.params.driverId || req.user.id;
    const result = await query(
      `SELECT u.id, u.full_name, u.mobile, u.profile_picture, u.gender,
              dp.licence_number, dp.is_verified, dp.total_rides, dp.average_rating,
              (SELECT COUNT(*) FROM reviews r JOIN bookings b ON b.id=r.booking_id JOIN rides ri ON ri.id=b.ride_id WHERE ri.driver_id=u.id) AS review_count
       FROM users u LEFT JOIN driver_profiles dp ON dp.user_id=u.id
       WHERE u.id=$1 AND u.is_driver=TRUE`,
      [driverId]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const getDriverStats = async (req, res, next) => {
  try {
    const stats = await query(
      `SELECT
        (SELECT COUNT(*) FROM rides WHERE driver_id=$1) AS total_rides,
        (SELECT COUNT(*) FROM rides WHERE driver_id=$1 AND status='published' AND departure_datetime > NOW()) AS upcoming_rides,
        (SELECT COUNT(*) FROM rides WHERE driver_id=$1 AND status='completed') AS completed_rides,
        (SELECT COUNT(*) FROM rides WHERE driver_id=$1 AND status='cancelled') AS cancelled_rides,
        (SELECT COUNT(*) FROM bookings b JOIN rides r ON r.id=b.ride_id WHERE r.driver_id=$1 AND b.status='pending') AS pending_requests,
        (SELECT COUNT(*) FROM bookings b JOIN rides r ON r.id=b.ride_id WHERE r.driver_id=$1 AND b.status='confirmed') AS confirmed_passengers,
        (SELECT COUNT(*) FROM vehicles WHERE driver_id=$1 AND is_active=TRUE) AS vehicles,
        (SELECT COALESCE(average_rating,0) FROM driver_profiles WHERE user_id=$1) AS rating`,
      [req.user.id]
    );
    res.json(stats.rows[0]);
  } catch (err) {
    next(err);
  }
};
