import { query, transaction } from '../db/pool.js';
import { createNotification } from './notificationController.js';

export const createRide = async (req, res, next) => {
  try {
    const {
      vehicle_id, ride_type, origin_address, origin_lat, origin_lng,
      destination_address, destination_lat, destination_lng, departure_datetime,
      total_seats, contribution_per_seat, toll_charges, additional_instructions,
      booking_type, booking_deadline, cancellation_hours,
      estimated_distance_km, estimated_duration_min, route_polyline,
      preferences, stops, status,
    } = req.body;

    if (!vehicle_id || !origin_address || !destination_address || !departure_datetime || !total_seats || !contribution_per_seat) {
      return res.status(400).json({ message: 'Missing required ride fields' });
    }

    // Verify vehicle ownership
    const vehicleCheck = await query('SELECT id FROM vehicles WHERE id=$1 AND driver_id=$2 AND is_active=TRUE', [vehicle_id, req.user.id]);
    if (!vehicleCheck.rows.length) {
      return res.status(403).json({ message: 'Invalid vehicle selection' });
    }

    // Women-only rides can only be published by female drivers
    if (ride_type === 'women_only') {
      const driverGender = await query('SELECT gender FROM users WHERE id=$1', [req.user.id]);
      if (driverGender.rows[0]?.gender !== 'female') {
        return res.status(403).json({ message: 'Women-only rides can only be created by female drivers' });
      }
    }

    const rideStatus = ['published', 'draft'].includes(status) ? status : 'draft';

    const result = await transaction(async (client) => {
      const rideRes = await client.query(
        `INSERT INTO rides (driver_id, vehicle_id, ride_type, status, origin_address, origin_lat, origin_lng,
          destination_address, destination_lat, destination_lng, departure_datetime, total_seats, available_seats,
          contribution_per_seat, toll_charges, additional_instructions, booking_type, booking_deadline,
          cancellation_hours, estimated_distance_km, estimated_duration_min, route_polyline)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         RETURNING *`,
        [req.user.id, vehicle_id, ride_type || 'regular', rideStatus,
          origin_address, parseFloat(origin_lat), parseFloat(origin_lng),
          destination_address, parseFloat(destination_lat), parseFloat(destination_lng),
          departure_datetime, parseInt(total_seats), parseInt(contribution_per_seat),
          parseInt(toll_charges) || 0, additional_instructions || null,
          booking_type || 'manual', booking_deadline || null,
          parseInt(cancellation_hours) || 2,
          estimated_distance_km ? parseFloat(estimated_distance_km) : null,
          estimated_duration_min ? parseInt(estimated_duration_min) : null,
          route_polyline ? JSON.stringify(route_polyline) : null]
      );
      const ride = rideRes.rows[0];

      // Insert preferences
      if (preferences) {
        const p = preferences;
        await client.query(
          `INSERT INTO ride_preferences (ride_id, ac, smoking_allowed, pets_allowed, food_allowed, music_allowed, luggage_size, front_seat_available)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [ride.id, p.ac ?? true, p.smoking_allowed ?? false, p.pets_allowed ?? false,
           p.food_allowed ?? true, p.music_allowed ?? true, p.luggage_size || 'small', p.front_seat_available ?? false]
        );
      }

      // Insert stops
      if (stops && stops.length) {
        for (let i = 0; i < Math.min(stops.length, 3); i++) {
          const s = stops[i];
          await client.query(
            `INSERT INTO ride_stops (ride_id, stop_order, address, lat, lng) VALUES ($1,$2,$3,$4,$5)`,
            [ride.id, i + 1, s.address, parseFloat(s.lat), parseFloat(s.lng)]
          );
        }
      }
      return ride;
    });

    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const getRide = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.*, u.full_name as driver_name, u.mobile as driver_mobile, u.profile_picture as driver_photo, u.gender as driver_gender,
              v.make, v.model, v.color, v.registration_number, v.vehicle_image, v.vehicle_type, v.total_seats as vehicle_seats,
              rp.ac, rp.smoking_allowed, rp.pets_allowed, rp.food_allowed, rp.music_allowed, rp.luggage_size, rp.front_seat_available,
              dp.average_rating, dp.total_rides as driver_total_rides
       FROM rides r
       JOIN users u ON u.id=r.driver_id
       JOIN vehicles v ON v.id=r.vehicle_id
       LEFT JOIN ride_preferences rp ON rp.ride_id=r.id
       LEFT JOIN driver_profiles dp ON dp.user_id=r.driver_id
       WHERE r.id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Ride not found' });

    const stops = await query('SELECT * FROM ride_stops WHERE ride_id=$1 ORDER BY stop_order', [req.params.id]);
    res.json({ ...result.rows[0], stops: stops.rows });
  } catch (err) { next(err); }
};

export const searchRides = async (req, res, next) => {
  try {
    const { origin, destination, date, ride_type, min_seats, max_price, ac, sort } = req.query;
    if (!origin || !destination || !date) {
      return res.status(400).json({ message: 'origin, destination, and date are required' });
    }

    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conditions = [
      `r.status='published'`,
      `r.departure_datetime BETWEEN $1 AND $2`,
      `r.available_seats > 0`,
      `(LOWER(r.origin_address) LIKE LOWER($3) OR LOWER(r.destination_address) LIKE LOWER($4))`,
    ];
    // Use ilike for origin and destination match
    const params = [startOfDay, endOfDay, `%${origin}%`, `%${destination}%`];
    let idx = 5;

    // More specific: must match both origin AND destination
    conditions.pop();
    conditions.push(`LOWER(r.origin_address) LIKE LOWER($3)`);
    conditions.push(`LOWER(r.destination_address) LIKE LOWER($4)`);

    if (ride_type) { conditions.push(`r.ride_type=$${idx++}`); params.push(ride_type); }
    if (min_seats) { conditions.push(`r.available_seats>=$${idx++}`); params.push(parseInt(min_seats)); }
    if (max_price) { conditions.push(`r.contribution_per_seat<=$${idx++}`); params.push(parseInt(max_price)); }
    if (ac === 'true') { conditions.push(`rp.ac=TRUE`); }

    const orderMap = {
      price_asc: 'r.contribution_per_seat ASC',
      price_desc: 'r.contribution_per_seat DESC',
      time_asc: 'r.departure_datetime ASC',
      time_desc: 'r.departure_datetime DESC',
    };
    const orderBy = orderMap[sort] || 'r.departure_datetime ASC';

    const sql = `
         SELECT r.id, r.ride_type, r.status,
         r.origin_address, r.origin_lat, r.origin_lng,
         r.destination_address, r.destination_lat, r.destination_lng,
         r.departure_datetime,
         r.available_seats, r.total_seats, r.contribution_per_seat, r.toll_charges,
             r.estimated_distance_km, r.estimated_duration_min, r.booking_type,
             u.full_name as driver_name, u.profile_picture as driver_photo,
             v.make, v.model, v.color, v.registration_number, v.vehicle_image, v.vehicle_type,
             rp.ac, rp.smoking_allowed, rp.pets_allowed,
             dp.average_rating
      FROM rides r
      JOIN users u ON u.id=r.driver_id
      JOIN vehicles v ON v.id=r.vehicle_id
      LEFT JOIN ride_preferences rp ON rp.ride_id=r.id
      LEFT JOIN driver_profiles dp ON dp.user_id=r.driver_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
    `;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const getWomenOnlyRides = async (req, res, next) => {
  try {
    const { origin, destination, date, min_seats, max_price, sort } = req.query;
    const conditions = [`r.status='published'`, `r.ride_type='women_only'`, `r.available_seats > 0`];
    const params = [];
    let idx = 1;

    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate); startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(searchDate); endOfDay.setHours(23,59,59,999);
      conditions.push(`r.departure_datetime BETWEEN $${idx++} AND $${idx++}`);
      params.push(startOfDay, endOfDay);
    } else {
      conditions.push(`r.departure_datetime > NOW()`);
    }
    if (origin) { conditions.push(`LOWER(r.origin_address) LIKE LOWER($${idx++})`); params.push(`%${origin}%`); }
    if (destination) { conditions.push(`LOWER(r.destination_address) LIKE LOWER($${idx++})`); params.push(`%${destination}%`); }
    if (min_seats) { conditions.push(`r.available_seats>=$${idx++}`); params.push(parseInt(min_seats)); }
    if (max_price) { conditions.push(`r.contribution_per_seat<=$${idx++}`); params.push(parseInt(max_price)); }

    const orderMap = { price_asc: 'r.contribution_per_seat ASC', price_desc: 'r.contribution_per_seat DESC', time_asc: 'r.departure_datetime ASC', time_desc: 'r.departure_datetime DESC' };
    const orderBy = orderMap[sort] || 'r.departure_datetime ASC';

    const sql = `
      SELECT r.id, r.ride_type, r.status, r.origin_address, r.destination_address, r.departure_datetime,
             r.available_seats, r.total_seats, r.contribution_per_seat, r.toll_charges,
             r.estimated_distance_km, r.estimated_duration_min, r.booking_type,
             u.full_name as driver_name, u.profile_picture as driver_photo,
             v.make, v.model, v.color, v.registration_number, v.vehicle_image, v.vehicle_type,
             rp.ac, dp.average_rating
      FROM rides r
      JOIN users u ON u.id=r.driver_id
      JOIN vehicles v ON v.id=r.vehicle_id
      LEFT JOIN ride_preferences rp ON rp.ride_id=r.id
      LEFT JOIN driver_profiles dp ON dp.user_id=r.driver_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
    `;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const getMyRides = async (req, res, next) => {
  try {
    const { status } = req.query;
    const conditions = ['r.driver_id=$1'];
    const params = [req.user.id];
    if (status) { conditions.push(`r.status=$2`); params.push(status); }
    const result = await query(
      `SELECT r.*, v.make, v.model, v.color, v.registration_number, v.vehicle_image,
              (SELECT COUNT(*) FROM bookings b WHERE b.ride_id=r.id AND b.status='confirmed') AS confirmed_passengers
       FROM rides r JOIN vehicles v ON v.id=r.vehicle_id
       WHERE ${conditions.join(' AND ')} ORDER BY r.departure_datetime DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const updateRide = async (req, res, next) => {
  try {
    const rideCheck = await query('SELECT id, status, driver_id FROM rides WHERE id=$1', [req.params.id]);
    if (!rideCheck.rows.length) return res.status(404).json({ message: 'Ride not found' });
    if (rideCheck.rows[0].driver_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (rideCheck.rows[0].status === 'completed' || rideCheck.rows[0].status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot edit a completed or cancelled ride' });
    }

    const {
      additional_instructions, toll_charges, booking_type, booking_deadline,
      cancellation_hours, status, preferences, stops,
      departure_datetime, contribution_per_seat,
    } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;
    if (additional_instructions !== undefined) { fields.push(`additional_instructions=$${idx++}`); values.push(additional_instructions); }
    if (toll_charges !== undefined) { fields.push(`toll_charges=$${idx++}`); values.push(parseInt(toll_charges)); }
    if (booking_type) { fields.push(`booking_type=$${idx++}`); values.push(booking_type); }
    if (booking_deadline) { fields.push(`booking_deadline=$${idx++}`); values.push(booking_deadline); }
    if (cancellation_hours !== undefined) { fields.push(`cancellation_hours=$${idx++}`); values.push(parseInt(cancellation_hours)); }
    if (status) { fields.push(`status=$${idx++}`); values.push(status); }
    if (departure_datetime) { fields.push(`departure_datetime=$${idx++}`); values.push(departure_datetime); }
    if (contribution_per_seat) { fields.push(`contribution_per_seat=$${idx++}`); values.push(parseInt(contribution_per_seat)); }
    fields.push(`updated_at=NOW()`);
    values.push(req.params.id);

    if (fields.length > 1) {
      await query(`UPDATE rides SET ${fields.join(',')} WHERE id=$${idx}`, values);
    }

    if (preferences) {
      const p = preferences;
      await query(
        `INSERT INTO ride_preferences (ride_id, ac, smoking_allowed, pets_allowed, food_allowed, music_allowed, luggage_size, front_seat_available)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (ride_id) DO UPDATE SET ac=$2, smoking_allowed=$3, pets_allowed=$4, food_allowed=$5, music_allowed=$6, luggage_size=$7, front_seat_available=$8`,
        [req.params.id, p.ac ?? true, p.smoking_allowed ?? false, p.pets_allowed ?? false, p.food_allowed ?? true, p.music_allowed ?? true, p.luggage_size || 'small', p.front_seat_available ?? false]
      );
    }

    if (stops !== undefined) {
      await query('DELETE FROM ride_stops WHERE ride_id=$1', [req.params.id]);
      for (let i = 0; i < Math.min(stops.length, 3); i++) {
        const s = stops[i];
        await query('INSERT INTO ride_stops (ride_id, stop_order, address, lat, lng) VALUES ($1,$2,$3,$4,$5)',
          [req.params.id, i + 1, s.address, parseFloat(s.lat), parseFloat(s.lng)]);
      }
    }

    // Notify confirmed passengers of updates
    if (departure_datetime || contribution_per_seat) {
      const passengers = await query(
        "SELECT b.passenger_id FROM bookings b WHERE b.ride_id=$1 AND b.status='confirmed'",
        [req.params.id]
      );
      for (const p of passengers.rows) {
        await createNotification(p.passenger_id, 'ride_update', 'Ride Updated', 'Your upcoming ride details have been updated by the driver.', { ride_id: req.params.id });
      }
    }

    const updated = await query('SELECT * FROM rides WHERE id=$1', [req.params.id]);
    res.json(updated.rows[0]);
  } catch (err) { next(err); }
};

export const cancelRide = async (req, res, next) => {
  try {
    const rideCheck = await query(
      "SELECT id, driver_id, status FROM rides WHERE id=$1",
      [req.params.id]
    );
    if (!rideCheck.rows.length) return res.status(404).json({ message: 'Ride not found' });
    if (rideCheck.rows[0].driver_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (['completed', 'cancelled'].includes(rideCheck.rows[0].status)) {
      return res.status(400).json({ message: 'Ride already completed or cancelled' });
    }

    await transaction(async (client) => {
      await client.query("UPDATE rides SET status='cancelled', updated_at=NOW() WHERE id=$1", [req.params.id]);
      // Cancel all pending/confirmed bookings
      const bookings = await client.query(
        "UPDATE bookings SET status='cancelled', updated_at=NOW() WHERE ride_id=$1 AND status IN ('pending','confirmed') RETURNING passenger_id",
        [req.params.id]
      );
      for (const b of bookings.rows) {
        await createNotification(b.passenger_id, 'ride_cancelled', 'Ride Cancelled', 'A ride you booked has been cancelled by the driver.', { ride_id: req.params.id });
      }
    });
    res.json({ message: 'Ride cancelled successfully' });
  } catch (err) { next(err); }
};

export const duplicateRide = async (req, res, next) => {
  try {
    const original = await query('SELECT * FROM rides WHERE id=$1 AND driver_id=$2', [req.params.id, req.user.id]);
    if (!original.rows.length) return res.status(404).json({ message: 'Ride not found' });
    const r = original.rows[0];
    const newRide = await query(
      `INSERT INTO rides (driver_id, vehicle_id, ride_type, status, origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng, departure_datetime, total_seats, available_seats, contribution_per_seat, toll_charges, additional_instructions, booking_type, cancellation_hours)
       VALUES ($1,$2,$3,'draft',$4,$5,$6,$7,$8,$9,$10,$11,$11,$12,$13,$14,$15,$16) RETURNING id`,
      [r.driver_id, r.vehicle_id, r.ride_type, r.origin_address, r.origin_lat, r.origin_lng, r.destination_address, r.destination_lat, r.destination_lng, new Date(Date.now() + 24*60*60*1000), r.total_seats, r.contribution_per_seat, r.toll_charges, r.additional_instructions, r.booking_type, r.cancellation_hours]
    );

    // Copy preferences
    const prefs = await query('SELECT * FROM ride_preferences WHERE ride_id=$1', [req.params.id]);
    if (prefs.rows.length) {
      const p = prefs.rows[0];
      await query(
        `INSERT INTO ride_preferences (ride_id, ac, smoking_allowed, pets_allowed, food_allowed, music_allowed, luggage_size, front_seat_available) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [newRide.rows[0].id, p.ac, p.smoking_allowed, p.pets_allowed, p.food_allowed, p.music_allowed, p.luggage_size, p.front_seat_available]
      );
    }
    res.status(201).json({ message: 'Ride duplicated as draft', id: newRide.rows[0].id });
  } catch (err) { next(err); }
};

export const saveRoute = async (req, res, next) => {
  try {
    const { name, origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng } = req.body;
    const result = await query(
      `INSERT INTO saved_routes (user_id, name, origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, name || null, origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

export const getSavedRoutes = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM saved_routes WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const deleteSavedRoute = async (req, res, next) => {
  try {
    await query('DELETE FROM saved_routes WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Route deleted' });
  } catch (err) { next(err); }
};
