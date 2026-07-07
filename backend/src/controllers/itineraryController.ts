import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

export const createItinerary = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    title, start_date, end_date, total_budget, notes, ai_generated,
    contact_email, contact_phone, contact_whatsapp, trip_details,
  } = req.body;
  try {
    const days = Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / 86400000) + 1;
    const result = await pool.query(
      `INSERT INTO itineraries (user_id,title,start_date,end_date,total_days,total_budget,notes,ai_generated,status,contact_email,contact_phone,contact_whatsapp,trip_details)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending_approval',$9,$10,$11,$12) RETURNING *`,
      [req.user?.id, title, start_date, end_date, days, total_budget, notes, ai_generated || false, contact_email, contact_phone, contact_whatsapp, trip_details ? JSON.stringify(trip_details) : null]
    );

    // Remember the traveler's contact details on their profile so future trips prefill automatically.
    if (req.user?.id && (contact_email || contact_phone || contact_whatsapp)) {
      await pool.query(
        'UPDATE users SET contact_email=COALESCE($1,contact_email), phone=COALESCE($2,phone), whatsapp=COALESCE($3,whatsapp), updated_at=NOW() WHERE id=$4',
        [contact_email, contact_phone, contact_whatsapp, req.user.id]
      );
    }

    res.status(201).json({ success: true, message: 'Itinerary submitted for approval', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getMyItineraries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM itineraries WHERE user_id=$1 ORDER BY created_at DESC', [req.user?.id]);
    res.json({ success: true, message: 'Itineraries fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getItineraryById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const itin = await pool.query('SELECT * FROM itineraries WHERE id=$1 AND (user_id=$2 OR share_token IS NOT NULL)', [req.params.id, req.user?.id]);
    if (!itin.rows[0]) { res.status(404).json({ success: false, message: 'Itinerary not found' }); return; }
    const items = await pool.query('SELECT * FROM itinerary_items WHERE itinerary_id=$1 ORDER BY day_number, order_number', [req.params.id]);
    res.json({ success: true, message: 'Itinerary fetched', data: { ...itin.rows[0], items: items.rows } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateItinerary = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, start_date, end_date, total_budget, notes, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE itineraries SET title=COALESCE($1,title), start_date=COALESCE($2,start_date), end_date=COALESCE($3,end_date), total_budget=COALESCE($4,total_budget), notes=COALESCE($5,notes), status=COALESCE($6,status), updated_at=NOW() WHERE id=$7 AND user_id=$8 RETURNING *`,
      [title, start_date, end_date, total_budget, notes, status, req.params.id, req.user?.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Itinerary updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteItinerary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM itineraries WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user?.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Itinerary deleted' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const addItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { day_number, order_number, type, reference_id, title, description, start_time, end_time, cost, notes, latitude, longitude } = req.body;
  try {
    const itin = await pool.query('SELECT id FROM itineraries WHERE id=$1 AND user_id=$2', [req.params.id, req.user?.id]);
    if (!itin.rows[0]) { res.status(404).json({ success: false, message: 'Itinerary not found' }); return; }
    const result = await pool.query(
      `INSERT INTO itinerary_items (itinerary_id,day_number,order_number,type,reference_id,title,description,start_time,end_time,cost,notes,latitude,longitude) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.params.id, day_number, order_number || 1, type, reference_id, title, description, start_time, end_time, cost || 0, notes, latitude, longitude]
    );
    res.status(201).json({ success: true, message: 'Item added', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, start_time, end_time, cost, notes, day_number, order_number } = req.body;
  try {
    const result = await pool.query(
      `UPDATE itinerary_items SET title=COALESCE($1,title), description=COALESCE($2,description), start_time=COALESCE($3,start_time), end_time=COALESCE($4,end_time), cost=COALESCE($5,cost), notes=COALESCE($6,notes), day_number=COALESCE($7,day_number), order_number=COALESCE($8,order_number), updated_at=NOW() WHERE id=$9 AND itinerary_id=$10 RETURNING *`,
      [title, description, start_time, end_time, cost, notes, day_number, order_number, req.params.itemId, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Item not found' }); return; }
    res.json({ success: true, message: 'Item updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const removeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM itinerary_items WHERE id=$1 AND itinerary_id=$2 RETURNING id', [req.params.itemId, req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Item not found' }); return; }
    res.json({ success: true, message: 'Item removed' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const reorderItems = async (req: Request, res: Response): Promise<void> => {
  const { items } = req.body as { items: { id: number; day_number: number; order_number: number }[] };
  try {
    await Promise.all(items.map(({ id, day_number, order_number }) =>
      pool.query('UPDATE itinerary_items SET day_number=$1, order_number=$2 WHERE id=$3', [day_number, order_number, id])
    ));
    res.json({ success: true, message: 'Items reordered' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const shareItinerary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = crypto.randomBytes(16).toString('hex');
    const result = await pool.query('UPDATE itineraries SET share_token=$1 WHERE id=$2 AND user_id=$3 RETURNING share_token', [token, req.params.id, req.user?.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Share link created', data: { share_token: token } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getSharedItinerary = async (req: Request, res: Response): Promise<void> => {
  try {
    const itin = await pool.query('SELECT * FROM itineraries WHERE share_token=$1', [req.params.token]);
    if (!itin.rows[0]) { res.status(404).json({ success: false, message: 'Itinerary not found' }); return; }
    const items = await pool.query('SELECT * FROM itinerary_items WHERE itinerary_id=$1 ORDER BY day_number, order_number', [itin.rows[0].id]);
    res.json({ success: true, message: 'Shared itinerary', data: { ...itin.rows[0], items: items.rows } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const calculateCost = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT COALESCE(SUM(cost),0) as total FROM itinerary_items WHERE itinerary_id=$1', [req.params.id]);
    const total = Number(result.rows[0].total);
    await pool.query('UPDATE itineraries SET estimated_cost=$1 WHERE id=$2', [total, req.params.id]);
    res.json({ success: true, message: 'Cost calculated', data: { estimated_cost: total } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

// --- Admin: trip request approval workflow ---

export const adminListItineraries = async (req: Request, res: Response): Promise<void> => {
  const { status, page = '1', limit = '20' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = `SELECT i.*, u.name as customer_name, u.email as account_email
                 FROM itineraries i JOIN users u ON u.id = i.user_id WHERE 1=1`;
    const params: (string | number)[] = [];
    let idx = 1;
    if (status) { query += ` AND i.status=$${idx++}`; params.push(String(status)); }
    const countQuery = query.replace('SELECT i.*, u.name as customer_name, u.email as account_email', 'SELECT COUNT(*)');
    const total = Number((await pool.query(countQuery, params)).rows[0].count);
    query += ` ORDER BY i.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    res.json({ success: true, message: 'Itineraries fetched', data: { items: result.rows, total } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const adminUpdateItinerary = async (req: Request, res: Response): Promise<void> => {
  const { title, notes, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE itineraries SET title=COALESCE($1,title), notes=COALESCE($2,notes), status=COALESCE($3,status), updated_at=NOW() WHERE id=$4 RETURNING *`,
      [title, notes, status, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Itinerary updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const approveItinerary = async (req: Request, res: Response): Promise<void> => {
  const { notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE itineraries SET status='approved', notes=COALESCE($1,notes), approved_at=NOW(), updated_at=NOW() WHERE id=$2 AND status='payment_submitted' RETURNING *`,
      [notes, req.params.id]
    );
    if (!result.rows[0]) { res.status(400).json({ success: false, message: 'Trip needs a submitted payment slip before it can be fully approved' }); return; }
    res.json({ success: true, message: 'Itinerary approved', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const setItineraryPrice = async (req: Request, res: Response): Promise<void> => {
  const quoted_price = Number(req.body.quoted_price);
  if (!quoted_price || quoted_price <= 0) { res.status(400).json({ success: false, message: 'A valid quoted_price is required' }); return; }
  const advance_amount = Math.round(quoted_price * 0.2 * 100) / 100;
  try {
    const result = await pool.query(
      `UPDATE itineraries SET quoted_price=$1, advance_amount=$2, status = CASE WHEN status='pending_approval' THEN 'price_set' ELSE status END, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [quoted_price, advance_amount, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Price saved', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const showPriceToCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `UPDATE itineraries SET status='quoted', price_shown_at=NOW(), updated_at=NOW() WHERE id=$1 AND quoted_price IS NOT NULL RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) { res.status(400).json({ success: false, message: 'Set a price before showing it to the customer' }); return; }
    res.json({ success: true, message: 'Price shown to customer', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const submitAdvancePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ success: false, message: 'A payment slip file is required' }); return; }
  try {
    const slipUrl = `/uploads/${req.file.filename}`;
    const result = await pool.query(
      `UPDATE itineraries SET advance_payment_slip_url=$1, advance_payment_submitted_at=NOW(), status='payment_submitted', updated_at=NOW() WHERE id=$2 AND user_id=$3 AND status='quoted' RETURNING *`,
      [slipUrl, req.params.id, req.user?.id]
    );
    if (!result.rows[0]) { res.status(400).json({ success: false, message: 'Trip must be quoted before submitting an advance payment' }); return; }
    res.json({ success: true, message: 'Payment slip submitted', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
