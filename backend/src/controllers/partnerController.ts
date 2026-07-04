import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getPartnerDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.user?.id;
  try {
    const [hotels, activities, bookingsRevenue] = await Promise.all([
      pool.query('SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM hotels WHERE partner_id=$1', [id]),
      pool.query('SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM activities WHERE provider_id=$1', [id]),
      pool.query(`SELECT COUNT(b.id) as total_bookings, COALESCE(SUM(b.total_amount),0) as revenue FROM bookings b WHERE (b.booking_type='hotel' AND b.reference_id IN (SELECT id FROM hotels WHERE partner_id=$1)) OR (b.booking_type='activity' AND b.reference_id IN (SELECT id FROM activities WHERE provider_id=$1))`, [id]),
    ]);
    res.json({ success: true, message: 'Partner dashboard', data: { hotels: hotels.rows[0], activities: activities.rows[0], bookings_revenue: bookingsRevenue.rows[0] } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getPartnerBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.user?.id;
  try {
    const result = await pool.query(
      `SELECT b.*, u.name as tourist_name, u.email FROM bookings b JOIN users u ON b.user_id=u.id WHERE (b.booking_type='hotel' AND b.reference_id IN (SELECT id FROM hotels WHERE partner_id=$1)) OR (b.booking_type='activity' AND b.reference_id IN (SELECT id FROM activities WHERE provider_id=$1)) ORDER BY b.created_at DESC`,
      [id]
    );
    res.json({ success: true, message: 'Partner bookings', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getPartnerRevenue = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.user?.id;
  try {
    const result = await pool.query(
      `SELECT DATE_TRUNC('month', b.created_at) as month, SUM(b.total_amount) as revenue, COUNT(b.id) as bookings FROM bookings b WHERE (b.booking_type='hotel' AND b.reference_id IN (SELECT id FROM hotels WHERE partner_id=$1)) OR (b.booking_type='activity' AND b.reference_id IN (SELECT id FROM activities WHERE provider_id=$1)) GROUP BY month ORDER BY month DESC LIMIT 12`,
      [id]
    );
    res.json({ success: true, message: 'Partner revenue', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getPartnerReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.user?.id;
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as reviewer_name FROM reviews r JOIN users u ON r.user_id=u.id WHERE (r.reviewable_type='hotel' AND r.reviewable_id IN (SELECT id FROM hotels WHERE partner_id=$1)) OR (r.reviewable_type='activity' AND r.reviewable_id IN (SELECT id FROM activities WHERE provider_id=$1)) ORDER BY r.created_at DESC`,
      [id]
    );
    res.json({ success: true, message: 'Partner reviews', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updatePartnerListing = async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Use /api/hotels/:id or /api/activities/:id endpoints to update listings' });
};
