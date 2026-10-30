import { query } from '../db/pool.js';

export const getMyVehicles = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM vehicles WHERE driver_id=$1 AND is_active=TRUE ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const getVehicle = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM vehicles WHERE id=$1 AND driver_id=$2 AND is_active=TRUE',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const createVehicle = async (req, res, next) => {
  try {
    const { registration_number, make, model, year, color, vehicle_type, total_seats } = req.body;
    if (!registration_number || !make || !model || !year || !color || !total_seats) {
      return res.status(400).json({ message: 'All vehicle fields are required' });
    }
    const vehicle_image = req.file ? `/uploads/vehicle_image/${req.file.filename}` : null;
    const result = await query(
      `INSERT INTO vehicles (driver_id, registration_number, make, model, year, color, vehicle_type, total_seats, vehicle_image)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, registration_number.toUpperCase(), make, model, parseInt(year), color, vehicle_type || 'car', parseInt(total_seats), vehicle_image]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

export const updateVehicle = async (req, res, next) => {
  try {
    const existing = await query('SELECT id FROM vehicles WHERE id=$1 AND driver_id=$2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ message: 'Vehicle not found' });
    const { make, model, year, color, vehicle_type, total_seats } = req.body;
    const vehicle_image = req.file ? `/uploads/vehicle_image/${req.file.filename}` : undefined;
    const fields = [];
    const values = [];
    let idx = 1;
    if (make) { fields.push(`make=$${idx++}`); values.push(make); }
    if (model) { fields.push(`model=$${idx++}`); values.push(model); }
    if (year) { fields.push(`year=$${idx++}`); values.push(parseInt(year)); }
    if (color) { fields.push(`color=$${idx++}`); values.push(color); }
    if (vehicle_type) { fields.push(`vehicle_type=$${idx++}`); values.push(vehicle_type); }
    if (total_seats) { fields.push(`total_seats=$${idx++}`); values.push(parseInt(total_seats)); }
    if (vehicle_image) { fields.push(`vehicle_image=$${idx++}`); values.push(vehicle_image); }
    fields.push(`updated_at=NOW()`);
    values.push(req.params.id);
    const result = await query(`UPDATE vehicles SET ${fields.join(',')} WHERE id=$${idx} RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const deleteVehicle = async (req, res, next) => {
  try {
    const existing = await query('SELECT id FROM vehicles WHERE id=$1 AND driver_id=$2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ message: 'Vehicle not found' });
    // Check for active rides using this vehicle
    const activeRides = await query(
      "SELECT id FROM rides WHERE vehicle_id=$1 AND status IN ('published','ongoing')",
      [req.params.id]
    );
    if (activeRides.rows.length) {
      return res.status(400).json({ message: 'Cannot delete vehicle with active rides' });
    }
    await query('UPDATE vehicles SET is_active=FALSE, updated_at=NOW() WHERE id=$1', [req.params.id]);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) { next(err); }
};
