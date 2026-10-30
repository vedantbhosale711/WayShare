import { query } from '../db/pool.js';

export const createReport = async (req, res, next) => {
  try {
    const { reported_user_id, ride_id, reason, description } = req.body;
    if (!reported_user_id || !reason) return res.status(400).json({ message: 'reported_user_id and reason required' });
    const result = await query(
      `INSERT INTO reports (reporter_id, reported_user_id, ride_id, reason, description) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, reported_user_id, ride_id || null, reason, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

export const createSupportTicket = async (req, res, next) => {
  try {
    const { subject, description, category } = req.body;
    if (!subject || !description) return res.status(400).json({ message: 'subject and description required' });
    const result = await query(
      `INSERT INTO support_tickets (user_id, subject, description, category) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, subject, description, category || 'general']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM support_tickets WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// Admin
export const adminGetUsers = async (req, res, next) => {
  try {
    const { role, is_driver, search } = req.query;
    const conditions = ['1=1'];
    const params = [];
    let idx = 1;
    if (role) { conditions.push(`u.role=$${idx++}`); params.push(role); }
    if (is_driver !== undefined) { conditions.push(`u.is_driver=$${idx++}`); params.push(is_driver === 'true'); }
    if (search) {
      conditions.push(`(LOWER(u.full_name) LIKE LOWER($${idx}) OR LOWER(u.email) LIKE LOWER($${idx}) OR u.mobile LIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    const result = await query(
      `SELECT u.id, u.full_name, u.email, u.mobile, u.gender, u.role, u.is_driver, u.is_active, u.is_demo, u.created_at,
              dp.average_rating, dp.total_rides
       FROM users u LEFT JOIN driver_profiles dp ON dp.user_id=u.id
       WHERE ${conditions.join(' AND ')} ORDER BY u.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const adminToggleUser = async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE users SET is_active=NOT is_active, updated_at=NOW() WHERE id=$1 RETURNING id, is_active',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const adminGetRides = async (req, res, next) => {
  try {
    const { status, ride_type } = req.query;
    const conditions = ['1=1'];
    const params = [];
    let idx = 1;
    if (status) { conditions.push(`r.status=$${idx++}`); params.push(status); }
    if (ride_type) { conditions.push(`r.ride_type=$${idx++}`); params.push(ride_type); }
    const result = await query(
      `SELECT r.id, r.ride_type, r.status, r.origin_address, r.destination_address, r.departure_datetime,
              r.total_seats, r.available_seats, r.contribution_per_seat, r.is_demo,
              u.full_name as driver_name, u.email as driver_email, v.registration_number
       FROM rides r JOIN users u ON u.id=r.driver_id JOIN vehicles v ON v.id=r.vehicle_id
       WHERE ${conditions.join(' AND ')} ORDER BY r.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const adminGetReports = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT rp.*, u1.full_name as reporter_name, u2.full_name as reported_name
       FROM reports rp JOIN users u1 ON u1.id=rp.reporter_id JOIN users u2 ON u2.id=rp.reported_user_id
       ORDER BY rp.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const adminUpdateReport = async (req, res, next) => {
  try {
    const { status, admin_notes } = req.body;
    const result = await query(
      'UPDATE reports SET status=$1, admin_notes=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
      [status, admin_notes || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Report not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const adminGetTickets = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT st.*, u.full_name, u.email FROM support_tickets st JOIN users u ON u.id=st.user_id ORDER BY st.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const adminUpdateTicket = async (req, res, next) => {
  try {
    const { status, admin_reply } = req.body;
    const result = await query(
      'UPDATE support_tickets SET status=$1, admin_reply=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
      [status, admin_reply || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Ticket not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const adminGetStats = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE NOT is_demo) AS total_users,
        (SELECT COUNT(*) FROM users WHERE is_driver AND NOT is_demo) AS total_drivers,
        (SELECT COUNT(*) FROM rides WHERE NOT is_demo) AS total_rides,
        (SELECT COUNT(*) FROM rides WHERE status='published' AND NOT is_demo) AS active_rides,
        (SELECT COUNT(*) FROM bookings WHERE NOT is_demo) AS total_bookings,
        (SELECT COUNT(*) FROM reports WHERE status='open') AS open_reports,
        (SELECT COUNT(*) FROM support_tickets WHERE status='open') AS open_tickets
    `);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};
