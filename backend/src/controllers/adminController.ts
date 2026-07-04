import { Request, Response } from 'express';
import pool from '../config/database';

export const getDashboardData = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [users, bookings, revenue, drivers, destinations, recentBookings, recentUsers] = await Promise.all([
      pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
      pool.query('SELECT status, COUNT(*) as count FROM bookings GROUP BY status'),
      pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='success'`),
      pool.query(`SELECT COUNT(*) FROM users WHERE role='driver' AND is_verified=true`),
      pool.query('SELECT COUNT(*) FROM destinations WHERE is_active=true'),
      pool.query(`SELECT b.*, u.name as user_name FROM bookings b JOIN users u ON b.user_id=u.id ORDER BY b.created_at DESC LIMIT 10`),
      pool.query(`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10`),
    ]);
    res.json({ success: true, message: 'Admin dashboard', data: { users_by_role: users.rows, bookings_by_status: bookings.rows, total_revenue: Number(revenue.rows[0].total), verified_drivers: Number(drivers.rows[0].count), active_destinations: Number(destinations.rows[0].count), recent_bookings: recentBookings.rows, recent_users: recentUsers.rows } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const manageUser = async (req: Request, res: Response): Promise<void> => {
  const { role, is_verified } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET role=COALESCE($1,role), is_verified=COALESCE($2,is_verified), updated_at=NOW() WHERE id=$3 RETURNING id,name,email,role,is_verified',
      [role, is_verified, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, message: 'User updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const verifyDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const [userResult, vehicleResult] = await Promise.all([
      pool.query(`UPDATE users SET is_verified=true, updated_at=NOW() WHERE id=$1 AND role='driver' RETURNING id, name`, [req.params.id]),
      pool.query(`UPDATE vehicles SET is_verified=true, updated_at=NOW() WHERE driver_id=$1`, [req.params.id]),
    ]);
    if (!userResult.rows[0]) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    res.json({ success: true, message: 'Driver verified', data: { ...userResult.rows[0], vehicles_verified: vehicleResult.rowCount } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  const { role, search, page = '1', limit = '20' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = 'SELECT id,name,email,phone,whatsapp,nationality,role,is_verified,created_at FROM users WHERE 1=1';
    const params: (string | number)[] = [];
    let idx = 1;
    if (role) { query += ` AND role=$${idx++}`; params.push(String(role)); }
    if (search) { query += ` AND (name ILIKE $${idx} OR email ILIKE $${idx} OR nationality ILIKE $${idx++})`; params.push(`%${search}%`); }
    const total = Number((await pool.query(query.replace('SELECT id,name,email,phone,whatsapp,nationality,role,is_verified,created_at', 'SELECT COUNT(*)'), params)).rows[0].count);
    query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    res.json({ success: true, message: 'Users fetched', data: { items: result.rows, total, page: Number(page) } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
