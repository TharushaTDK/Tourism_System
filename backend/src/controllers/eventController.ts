import { Request, Response } from 'express';
import pool from '../config/database';

export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  const { category, upcoming, destination_id, page = '1', limit = '12' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = 'SELECT e.*, d.name as destination_name FROM events e LEFT JOIN destinations d ON e.destination_id=d.id WHERE 1=1';
    const params: (string | number)[] = [];
    let idx = 1;
    if (category) { query += ` AND e.category=$${idx++}`; params.push(String(category)); }
    if (destination_id) { query += ` AND e.destination_id=$${idx++}`; params.push(Number(destination_id)); }
    if (upcoming === 'true') { query += ` AND e.end_date >= NOW()`; }
    query += ` ORDER BY e.start_date ASC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    res.json({ success: true, message: 'Events fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getFeaturedEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE is_featured=true AND end_date>=NOW() ORDER BY start_date LIMIT 6');
    res.json({ success: true, message: 'Featured events', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT e.*, d.name as destination_name FROM events e LEFT JOIN destinations d ON e.destination_id=d.id WHERE e.id=$1', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    res.json({ success: true, message: 'Event fetched', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  const { title, slug, description, location, destination_id, start_date, end_date, category, image_url, is_featured } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO events (title,slug,description,location,destination_id,start_date,end_date,category,image_url,is_featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, slug, description, location, destination_id || null, start_date, end_date, category, image_url, is_featured || false]
    );
    res.status(201).json({ success: true, message: 'Event created', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  const { title, description, location, start_date, end_date, category, image_url, is_featured } = req.body;
  try {
    const result = await pool.query(
      `UPDATE events SET title=COALESCE($1,title), description=COALESCE($2,description), location=COALESCE($3,location), start_date=COALESCE($4,start_date), end_date=COALESCE($5,end_date), category=COALESCE($6,category), image_url=COALESCE($7,image_url), is_featured=COALESCE($8,is_featured), updated_at=NOW() WHERE id=$9 RETURNING *`,
      [title, description, location, start_date, end_date, category, image_url, is_featured, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Event updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM events WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
