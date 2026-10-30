import { query, transaction } from '../db/pool.js';
import { createNotification } from './notificationController.js';
import { sendEmail, bookingConfirmationEmail, emergencyContactEmail } from '../utils/email.js';

export const createBooking = async (req, res, next) => {
  try {
    const {
      ride_id, seats_booked, pickup_address, pickup_lat, pickup_lng,
      dropoff_address, dropoff_lat, dropoff_lng,
    } = req.body;

    if (!ride_id || !seats_booked) {
      return res.status(400).json({ message: 'ride_id and seats_booked are required' });
    }

    const result = await transaction(async (client) => {
      // Lock ride row for update
      const rideRes = await client.query(
        `SELECT r.*, u.gender as driver_gender FROM rides r JOIN users u ON u.id=r.driver_id WHERE r.id=$1 FOR UPDATE`,
        [ride_id]
      );
      if (!rideRes.rows.length) throw Object.assign(new Error('Ride not found'), { status: 404 });
      const ride = rideRes.rows[0];

      if (ride.status !== 'published') throw Object.assign(new Error('Ride is not available'), { status: 400 });
      if (ride.driver_id === req.user.id) throw Object.assign(new Error('You cannot book your own ride'), { status: 400 });
      if (ride.departure_datetime < new Date()) throw Object.assign(new Error('Ride has already departed'), { status: 400 });

      // Women-only eligibility
      if (ride.ride_type === 'women_only') {
        const passengerRes = await client.query('SELECT gender FROM users WHERE id=$1', [req.user.id]);
        const passengerGender = passengerRes.rows[0]?.gender;
        if (passengerGender !== 'female') {
          throw Object.assign(new Error('This is a women-only ride. Only female passengers can book.'), { status: 403 });
        }
      }

      // Prevent duplicate booking
      const dupCheck = await client.query(
        "SELECT id FROM bookings WHERE ride_id=$1 AND passenger_id=$2 AND status NOT IN ('cancelled','rejected')",
        [ride_id, req.user.id]
      );
      if (dupCheck.rows.length) throw Object.assign(new Error('You have already booked this ride'), { status: 409 });

      // Check seat availability
      if (ride.available_seats < parseInt(seats_booked)) {
        throw Object.assign(new Error(`Only ${ride.available_seats} seats available`), { status: 400 });
      }

      const total_amount = ride.contribution_per_seat * parseInt(seats_booked);
      const bookingStatus = ride.booking_type === 'auto' ? 'confirmed' : 'pending';

      const bookingRes = await client.query(
        `INSERT INTO bookings (ride_id, passenger_id, status, seats_booked, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, total_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [ride_id, req.user.id, bookingStatus, parseInt(seats_booked),
         pickup_address || null, pickup_lat ? parseFloat(pickup_lat) : null, pickup_lng ? parseFloat(pickup_lng) : null,
         dropoff_address || null, dropoff_lat ? parseFloat(dropoff_lat) : null, dropoff_lng ? parseFloat(dropoff_lng) : null,
         total_amount]
      );

      // Deduct seats if auto-confirmed
      if (bookingStatus === 'confirmed') {
        await client.query(
          'UPDATE rides SET available_seats=available_seats-$1, updated_at=NOW() WHERE id=$2',
          [parseInt(seats_booked), ride_id]
        );
        // Create payment record
        await client.query(
          `INSERT INTO payments (booking_id, payer_id, payee_id, amount) VALUES ($1,$2,$3,$4)`,
          [bookingRes.rows[0].id, req.user.id, ride.driver_id, total_amount]
        );
      }

      return { booking: bookingRes.rows[0], ride, bookingStatus };
    });

    // Notifications (outside transaction)
    const { booking, ride, bookingStatus } = result;
    if (bookingStatus === 'pending') {
      await createNotification(ride.driver_id, 'booking_request', 'New Booking Request',
        `${req.user.full_name} wants to book ${seats_booked} seat(s) on your ride.`, { booking_id: booking.id, ride_id });
    } else {
      await createNotification(req.user.id, 'booking_confirmed', 'Booking Confirmed',
        'Your ride booking has been automatically confirmed!', { booking_id: booking.id, ride_id });
    }

    // Send emergency contact email if passenger has one
    const emergContact = await query('SELECT * FROM emergency_contacts WHERE user_id=$1', [req.user.id]);
    if (emergContact.rows.length && bookingStatus === 'confirmed') {
      const ec = emergContact.rows[0];
      const driverRes = await query('SELECT full_name, mobile FROM users WHERE id=$1', [ride.driver_id]);
      const vehicleRes = await query('SELECT * FROM vehicles WHERE id=$1', [ride.vehicle_id]);
      if (driverRes.rows.length && vehicleRes.rows.length) {
        const emailContent = emergencyContactEmail(ec, req.user, ride, driverRes.rows[0], vehicleRes.rows[0]);
        sendEmail({ to: ec.email, ...emailContent }).catch(console.error);
      }
    }

    res.status(201).json({ ...booking, status: bookingStatus });
  } catch (err) { next(err); }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const conditions = ['b.passenger_id=$1'];
    const params = [req.user.id];
    if (status) { conditions.push('b.status=$2'); params.push(status); }
    const result = await query(
      `SELECT b.*, r.origin_address, r.destination_address, r.departure_datetime, r.ride_type,
              r.contribution_per_seat, r.estimated_distance_km, r.estimated_duration_min,
              u.full_name as driver_name, u.mobile as driver_mobile, u.profile_picture as driver_photo,
              v.make, v.model, v.color, v.registration_number, v.vehicle_image
       FROM bookings b
       JOIN rides r ON r.id=b.ride_id
       JOIN users u ON u.id=r.driver_id
       JOIN vehicles v ON v.id=r.vehicle_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.departure_datetime DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const getBookingDetails = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, r.origin_address, r.destination_address, r.departure_datetime, r.ride_type,
              r.contribution_per_seat, r.toll_charges, r.estimated_distance_km, r.estimated_duration_min,
              r.additional_instructions, r.route_polyline, r.booking_type,
              u.full_name as driver_name, u.mobile as driver_mobile, u.profile_picture as driver_photo,
              v.make, v.model, v.color, v.registration_number, v.vehicle_image, v.vehicle_type,
              dp.average_rating
       FROM bookings b
       JOIN rides r ON r.id=b.ride_id
       JOIN users u ON u.id=r.driver_id
       JOIN vehicles v ON v.id=r.vehicle_id
       LEFT JOIN driver_profiles dp ON dp.user_id=r.driver_id
       WHERE b.id=$1 AND (b.passenger_id=$2 OR r.driver_id=$2)`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const getRideBookingRequests = async (req, res, next) => {
  try {
    // Verify driver owns the ride
    const rideCheck = await query('SELECT id FROM rides WHERE id=$1 AND driver_id=$2', [req.params.rideId, req.user.id]);
    if (!rideCheck.rows.length) return res.status(403).json({ message: 'Not authorized' });

    const result = await query(
      `SELECT b.*, u.full_name as passenger_name, u.mobile as passenger_mobile, u.profile_picture as passenger_photo, u.gender
       FROM bookings b JOIN users u ON u.id=b.passenger_id
       WHERE b.ride_id=$1 ORDER BY b.created_at DESC`,
      [req.params.rideId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const getAllDriverBookingRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const conditions = ['r.driver_id=$1'];
    const params = [req.user.id];
    if (status) { conditions.push('b.status=$2'); params.push(status); }
    const result = await query(
      `SELECT b.*, r.origin_address, r.destination_address, r.departure_datetime, r.ride_type,
              u.full_name as passenger_name, u.mobile as passenger_mobile, u.profile_picture as passenger_photo, u.gender
       FROM bookings b
       JOIN rides r ON r.id=b.ride_id
       JOIN users u ON u.id=b.passenger_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY b.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { action } = req.body; // 'confirm' | 'reject'
    if (!['confirm', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be confirm or reject' });
    }

    await transaction(async (client) => {
      const bookingRes = await client.query(
        `SELECT b.*, r.driver_id, r.available_seats, r.ride_type
         FROM bookings b JOIN rides r ON r.id=b.ride_id
         WHERE b.id=$1 FOR UPDATE`,
        [req.params.id]
      );
      if (!bookingRes.rows.length) throw Object.assign(new Error('Booking not found'), { status: 404 });
      const booking = bookingRes.rows[0];
      if (booking.driver_id !== req.user.id) throw Object.assign(new Error('Not authorized'), { status: 403 });
      if (booking.status !== 'pending') throw Object.assign(new Error('Booking is not pending'), { status: 400 });

      const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';
      await client.query('UPDATE bookings SET status=$1, updated_at=NOW() WHERE id=$2', [newStatus, req.params.id]);

      if (action === 'confirm') {
        if (booking.available_seats < booking.seats_booked) {
          throw Object.assign(new Error('Not enough seats available'), { status: 400 });
        }
        await client.query('UPDATE rides SET available_seats=available_seats-$1, updated_at=NOW() WHERE id=$2', [booking.seats_booked, booking.ride_id]);
        await client.query(`INSERT INTO payments (booking_id, payer_id, payee_id, amount) VALUES ($1,$2,$3,$4)`,
          [booking.id, booking.passenger_id, req.user.id, booking.total_amount]);
      }

      // Notify passenger
      const notifMsg = action === 'confirm'
        ? 'Your booking request has been confirmed by the driver!'
        : 'Your booking request has been declined by the driver.';
      await createNotification(booking.passenger_id, `booking_${newStatus}`, `Booking ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, notifMsg, { booking_id: booking.id });
    });

    res.json({ message: `Booking ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully` });
  } catch (err) { next(err); }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await transaction(async (client) => {
      const bookingRes = await client.query(
        `SELECT b.*, r.driver_id, r.cancellation_hours, r.departure_datetime
         FROM bookings b JOIN rides r ON r.id=b.ride_id
         WHERE b.id=$1 AND b.passenger_id=$2 FOR UPDATE`,
        [req.params.id, req.user.id]
      );
      if (!bookingRes.rows.length) throw Object.assign(new Error('Booking not found'), { status: 404 });
      const booking = bookingRes.rows[0];
      if (!['pending', 'confirmed'].includes(booking.status)) {
        throw Object.assign(new Error('Cannot cancel this booking'), { status: 400 });
      }

      // Cancellation window check
      const hoursUntilDeparture = (new Date(booking.departure_datetime) - new Date()) / (1000 * 60 * 60);
      if (booking.status === 'confirmed' && hoursUntilDeparture < booking.cancellation_hours) {
        throw Object.assign(new Error(`Cancellation is only allowed ${booking.cancellation_hours}h before departure`), { status: 400 });
      }

      await client.query(
        'UPDATE bookings SET status=$1, cancellation_reason=$2, updated_at=NOW() WHERE id=$3',
        ['cancelled', reason || null, booking.id]
      );

      if (booking.status === 'confirmed') {
        await client.query('UPDATE rides SET available_seats=available_seats+$1, updated_at=NOW() WHERE id=$2', [booking.seats_booked, booking.ride_id]);
      }

      await createNotification(booking.driver_id, 'booking_cancelled', 'Booking Cancelled',
        `A passenger has cancelled their booking.`, { booking_id: booking.id });
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) { next(err); }
};
