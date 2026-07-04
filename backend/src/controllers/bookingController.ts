import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

const getPriceForBooking = async (type: string, ref_id: number, guests: number, check_in?: string, check_out?: string): Promise<number> => {
  if (type === 'hotel') {
    const r = await pool.query('SELECT price_per_night FROM hotels WHERE id=$1', [ref_id]);
    if (!r.rows[0]) throw new Error('Hotel not found');
    const nights = check_in && check_out ? Math.ceil((new Date(check_out).getTime() - new Date(check_in).getTime()) / 86400000) : 1;
    return r.rows[0].price_per_night * nights * guests;
  }
  if (type === 'activity') {
    const r = await pool.query('SELECT price_per_person FROM activities WHERE id=$1', [ref_id]);
    if (!r.rows[0]) throw new Error('Activity not found');
    return r.rows[0].price_per_person * guests;
  }
  if (type === 'package') {
    const r = await pool.query('SELECT price_per_person FROM tour_packages WHERE id=$1', [ref_id]);
    if (!r.rows[0]) throw new Error('Package not found');
    return r.rows[0].price_per_person * guests;
  }
  if (type === 'transport') {
    const r = await pool.query('SELECT fare FROM trips WHERE id=$1', [ref_id]);
    return r.rows[0]?.fare || 0;
  }
  return 0;
};

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const { booking_type, reference_id, itinerary_id, check_in, check_out, guests = 1, discount = 0, special_requests } = req.body;
  try {
    const amount = await getPriceForBooking(booking_type, reference_id, guests, check_in, check_out);
    const total_amount = amount - discount;
    const result = await pool.query(
      `INSERT INTO bookings (user_id,booking_type,reference_id,itinerary_id,check_in,check_out,guests,amount,discount,total_amount,special_requests) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user?.id, booking_type, reference_id, itinerary_id || null, check_in || null, check_out || null, guests, amount, discount, total_amount, special_requests]
    );
    res.status(201).json({ success: true, message: 'Booking created', data: result.rows[0] });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ success: false, message: (err as Error).message || 'Server error' });
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT b.*,
        CASE b.booking_type
          WHEN 'hotel' THEN h.name
          WHEN 'activity' THEN a.name
          WHEN 'package' THEN p.name
          ELSE 'Transport'
        END AS reference_name,
        CASE b.booking_type
          WHEN 'hotel' THEN h.image_urls[1]
          WHEN 'activity' THEN a.image_urls[1]
          WHEN 'package' THEN p.image_urls[1]
          ELSE NULL
        END AS image_url
      FROM bookings b
      LEFT JOIN hotels h ON b.booking_type='hotel' AND b.reference_id=h.id
      LEFT JOIN activities a ON b.booking_type='activity' AND b.reference_id=a.id
      LEFT JOIN tour_packages p ON b.booking_type='package' AND b.reference_id=p.id
      WHERE b.user_id=$1 ORDER BY b.created_at DESC`,
      [req.user?.id]
    );
    res.json({ success: true, message: 'Bookings fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM bookings WHERE id=$1 AND (user_id=$2 OR $3=true)', [req.params.id, req.user?.id, req.user?.role === 'admin']);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    res.json({ success: true, message: 'Booking fetched', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `UPDATE bookings SET status='cancelled', payment_status=CASE WHEN payment_status='paid' THEN 'refunded' ELSE payment_status END, updated_at=NOW() WHERE id=$1 AND user_id=$2 AND status='pending' RETURNING *`,
      [req.params.id, req.user?.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Booking not found or cannot be cancelled' }); return; }
    res.json({ success: true, message: 'Booking cancelled', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
  const { status, booking_type, page = '1', limit = '20' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = 'SELECT b.*, u.name as user_name, u.email FROM bookings b JOIN users u ON b.user_id=u.id WHERE 1=1';
    const params: (string | number)[] = [];
    let idx = 1;
    if (status) { query += ` AND b.status=$${idx++}`; params.push(String(status)); }
    if (booking_type) { query += ` AND b.booking_type=$${idx++}`; params.push(String(booking_type)); }
    query += ` ORDER BY b.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    res.json({ success: true, message: 'All bookings', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;
  try {
    const result = await pool.query('UPDATE bookings SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [status, req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Status updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getBookingStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, byStatus, byType, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM bookings'),
      pool.query('SELECT status, COUNT(*) as count FROM bookings GROUP BY status'),
      pool.query('SELECT booking_type, COUNT(*) as count FROM bookings GROUP BY booking_type'),
      pool.query('SELECT SUM(total_amount) as total FROM bookings WHERE payment_status=\'paid\''),
    ]);
    res.json({ success: true, message: 'Booking stats', data: { total: Number(total.rows[0].count), by_status: byStatus.rows, by_type: byType.rows, total_revenue: revenue.rows[0].total } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
