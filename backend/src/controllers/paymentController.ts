import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { booking_id, payment_method, amount } = req.body;
  try {
    const booking = await pool.query('SELECT * FROM bookings WHERE id=$1 AND user_id=$2', [booking_id, req.user?.id]);
    if (!booking.rows[0]) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    const transaction_id = crypto.randomBytes(16).toString('hex');
    const result = await pool.query(
      `INSERT INTO payments (booking_id,user_id,amount,payment_method,transaction_id,status,payment_date) VALUES ($1,$2,$3,$4,$5,'success',NOW()) RETURNING *`,
      [booking_id, req.user?.id, amount || booking.rows[0].total_amount, payment_method, transaction_id]
    );
    await pool.query(`UPDATE bookings SET payment_status='paid', status='confirmed', updated_at=NOW() WHERE id=$1`, [booking_id]);
    res.status(201).json({ success: true, message: 'Payment successful', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getMyPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT p.*, b.booking_type, b.reference_id FROM payments p JOIN bookings b ON p.booking_id=b.id WHERE p.user_id=$1 ORDER BY p.created_at DESC', [req.user?.id]);
    res.json({ success: true, message: 'Payments fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  const { page = '1', limit = '20' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    const result = await pool.query('SELECT p.*, u.name as user_name, u.email FROM payments p JOIN users u ON p.user_id=u.id ORDER BY p.created_at DESC LIMIT $1 OFFSET $2', [Number(limit), offset]);
    const total = Number((await pool.query('SELECT COUNT(*) FROM payments')).rows[0].count);
    res.json({ success: true, message: 'All payments', data: { items: result.rows, total, page: Number(page), limit: Number(limit) } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getPaymentStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, monthly, byMethod] = await Promise.all([
      pool.query(`SELECT SUM(amount) as total, COUNT(*) as count FROM payments WHERE status='success'`),
      pool.query(`SELECT DATE_TRUNC('month', payment_date) as month, SUM(amount) as revenue, COUNT(*) as count FROM payments WHERE status='success' GROUP BY month ORDER BY month DESC LIMIT 12`),
      pool.query(`SELECT payment_method, COUNT(*) as count, SUM(amount) as total FROM payments WHERE status='success' GROUP BY payment_method`),
    ]);
    res.json({ success: true, message: 'Payment stats', data: { total_revenue: total.rows[0].total, total_transactions: total.rows[0].count, monthly: monthly.rows, by_method: byMethod.rows } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
