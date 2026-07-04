import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllDrivers = async (req: Request, res: Response): Promise<void> => {
  const { available, page = '1', limit = '20' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = `SELECT u.id, u.name, u.email, u.phone, u.profile_image, u.is_verified, u.nationality,
      v.id as vehicle_id, v.type as vehicle_type, v.make, v.model, v.year, v.capacity, v.ac, v.is_available
      FROM users u LEFT JOIN vehicles v ON v.driver_id=u.id AND v.is_verified=true
      WHERE u.role='driver'`;
    const params: (string | number | boolean)[] = [];
    let idx = 1;
    if (available === 'true') { query += ` AND v.is_available=$${idx++}`; params.push(true); }
    query += ` ORDER BY u.name LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    res.json({ success: true, message: 'Drivers fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getDriverById = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.profile_image, u.is_verified,
        v.type as vehicle_type, v.make, v.model, v.capacity, v.ac, v.is_available
       FROM users u LEFT JOIN vehicles v ON v.driver_id=u.id WHERE u.id=$1 AND u.role='driver'`,
      [req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    const [trips, reviews] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM trips WHERE driver_id=$1 AND status=\'completed\'', [req.params.id]),
      pool.query('SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE reviewable_type=\'driver\' AND reviewable_id=$1', [req.params.id]),
    ]);
    res.json({ success: true, message: 'Driver fetched', data: { ...result.rows[0], completed_trips: Number(trips.rows[0].count), avg_rating: reviews.rows[0].avg_rating, review_count: Number(reviews.rows[0].total) } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getDriverStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.user?.id;
  try {
    const [trips, revenue, upcoming] = await Promise.all([
      pool.query('SELECT status, COUNT(*) as count FROM trips WHERE driver_id=$1 GROUP BY status', [id]),
      pool.query(`SELECT COALESCE(SUM(fare),0) as total FROM trips WHERE driver_id=$1 AND status='completed'`, [id]),
      pool.query(`SELECT t.*, u.name as tourist_name FROM trips t JOIN users u ON t.tourist_id=u.id WHERE t.driver_id=$1 AND t.status IN ('scheduled','in_progress') ORDER BY t.pickup_date LIMIT 5`, [id]),
    ]);
    res.json({ success: true, message: 'Driver stats', data: { trips_by_status: trips.rows, total_revenue: revenue.rows[0].total, upcoming_trips: upcoming.rows } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateDriverProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, phone, profile_image } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone), profile_image=COALESCE($3,profile_image), updated_at=NOW() WHERE id=$4 RETURNING id,name,email,phone,profile_image',
      [name, phone, profile_image, req.user?.id]
    );
    res.json({ success: true, message: 'Profile updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getDriverBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as tourist_name, u.phone as tourist_phone FROM trips t JOIN users u ON t.tourist_id=u.id WHERE t.driver_id=$1 ORDER BY t.pickup_date DESC`,
      [req.user?.id]
    );
    res.json({ success: true, message: 'Driver bookings', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getDriverTrips = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.query;
  try {
    let query = `SELECT t.*, u.name as tourist_name, v.make, v.model FROM trips t JOIN users u ON t.tourist_id=u.id LEFT JOIN vehicles v ON t.vehicle_id=v.id WHERE t.driver_id=$1`;
    const params: (string | number)[] = [req.user?.id as number];
    if (status) { query += ` AND t.status=$2`; params.push(String(status)); }
    query += ' ORDER BY t.pickup_date DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, message: 'Driver trips', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const rateDriver = async (req: AuthRequest, res: Response): Promise<void> => {
  const { rating, comment, title } = req.body;
  try {
    await pool.query(
      `INSERT INTO reviews (user_id, reviewable_type, reviewable_id, rating, title, comment) VALUES ($1,'driver',$2,$3,$4,$5) ON CONFLICT (user_id, reviewable_type, reviewable_id) DO UPDATE SET rating=$3, title=$4, comment=$5, updated_at=NOW()`,
      [req.user?.id, req.params.id, rating, title, comment]
    );
    res.json({ success: true, message: 'Driver rated successfully' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
