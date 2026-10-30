import { query } from '../db/pool.js';

// Emergency Contacts
export const getEmergencyContact = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM emergency_contacts WHERE user_id=$1', [req.user.id]);
    res.json(result.rows[0] || null);
  } catch (err) { next(err); }
};

export const upsertEmergencyContact = async (req, res, next) => {
  try {
    const { contact_name, mobile, email } = req.body;
    if (!contact_name || !mobile) return res.status(400).json({ message: 'contact_name and mobile required' });
    const result = await query(
      `INSERT INTO emergency_contacts (user_id, contact_name, mobile, email) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id) DO UPDATE SET contact_name=$2, mobile=$3, email=$4, updated_at=NOW()
       RETURNING *`,
      [req.user.id, contact_name, mobile, email || null]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const deleteEmergencyContact = async (req, res, next) => {
  try {
    await query('DELETE FROM emergency_contacts WHERE user_id=$1', [req.user.id]);
    res.json({ message: 'Emergency contact removed' });
  } catch (err) { next(err); }
};

// Favourite Drivers
export const getFavouriteDrivers = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT fd.id, fd.created_at, u.id as driver_id, u.full_name, u.profile_picture, dp.average_rating, dp.total_rides
       FROM favourite_drivers fd JOIN users u ON u.id=fd.driver_id LEFT JOIN driver_profiles dp ON dp.user_id=u.id
       WHERE fd.passenger_id=$1 ORDER BY fd.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const addFavouriteDriver = async (req, res, next) => {
  try {
    const { driver_id } = req.body;
    await query(
      'INSERT INTO favourite_drivers (passenger_id, driver_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, driver_id]
    );
    res.status(201).json({ message: 'Added to favourites' });
  } catch (err) { next(err); }
};

export const removeFavouriteDriver = async (req, res, next) => {
  try {
    await query('DELETE FROM favourite_drivers WHERE passenger_id=$1 AND driver_id=$2', [req.user.id, req.params.driverId]);
    res.json({ message: 'Removed from favourites' });
  } catch (err) { next(err); }
};

// Favourite Locations
export const getFavouriteLocations = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM favourite_locations WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const addFavouriteLocation = async (req, res, next) => {
  try {
    const { name, address, lat, lng } = req.body;
    if (!address) return res.status(400).json({ message: 'address is required' });
    const result = await query(
      'INSERT INTO favourite_locations (user_id, name, address, lat, lng) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, name || null, address, lat ? parseFloat(lat) : null, lng ? parseFloat(lng) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

export const removeFavouriteLocation = async (req, res, next) => {
  try {
    await query('DELETE FROM favourite_locations WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Removed from favourites' });
  } catch (err) { next(err); }
};
