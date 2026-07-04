import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllActivities = async (req: Request, res: Response): Promise<void> => {
  const { category, destination_id, difficulty, min_price, max_price, search, page = '1', limit = '12' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = 'SELECT a.*, d.name as destination_name FROM activities a LEFT JOIN destinations d ON a.destination_id = d.id WHERE a.is_active = true';
    const params: (string | number)[] = [];
    let idx = 1;
    if (category) { query += ` AND a.category = $${idx++}`; params.push(String(category)); }
    if (destination_id) { query += ` AND a.destination_id = $${idx++}`; params.push(Number(destination_id)); }
    if (difficulty) { query += ` AND a.difficulty = $${idx++}`; params.push(String(difficulty)); }
    if (min_price) { query += ` AND a.price_per_person >= $${idx++}`; params.push(Number(min_price)); }
    if (max_price) { query += ` AND a.price_per_person <= $${idx++}`; params.push(Number(max_price)); }
    if (search) { query += ` AND (a.name ILIKE $${idx} OR a.description ILIKE $${idx++})`; params.push(`%${search}%`); }
    const countQuery = query.replace('SELECT a.*, d.name as destination_name', 'SELECT COUNT(*)');
    const total = Number((await pool.query(countQuery, params)).rows[0].count);
    query += ` ORDER BY a.is_featured DESC, a.rating DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    res.json({ success: true, message: 'Activities fetched', data: { items: result.rows, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getFeaturedActivities = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT a.*, d.name as destination_name FROM activities a LEFT JOIN destinations d ON a.destination_id=d.id WHERE a.is_featured=true AND a.is_active=true ORDER BY a.rating DESC LIMIT 8');
    res.json({ success: true, message: 'Featured activities', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getActivitiesByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM activities WHERE category=$1 AND is_active=true ORDER BY rating DESC', [req.params.category]);
    res.json({ success: true, message: 'Activities by category', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getActivityById = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT a.*, d.name as destination_name FROM activities a LEFT JOIN destinations d ON a.destination_id=d.id WHERE a.id=$1', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Activity not found' }); return; }
    res.json({ success: true, message: 'Activity fetched', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, slug, description, category, location, destination_id, duration_hours, difficulty, min_group, max_group, price_per_person, image_urls } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO activities (name,slug,description,category,location,destination_id,duration_hours,difficulty,min_group,max_group,price_per_person,image_urls,provider_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name, slug, description, category, location, destination_id, duration_hours, difficulty, min_group, max_group, price_per_person, image_urls, req.user?.id]
    );
    res.status(201).json({ success: true, message: 'Activity created', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateActivity = async (req: Request, res: Response): Promise<void> => {
  const { name, description, category, location, destination_id, duration_hours, difficulty, min_group, max_group, price_per_person, image_urls, is_featured, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE activities SET name=COALESCE($1,name), description=COALESCE($2,description), category=COALESCE($3,category), location=COALESCE($4,location), destination_id=COALESCE($5,destination_id), duration_hours=COALESCE($6,duration_hours), difficulty=COALESCE($7,difficulty), min_group=COALESCE($8,min_group), max_group=COALESCE($9,max_group), price_per_person=COALESCE($10,price_per_person), image_urls=COALESCE($11,image_urls), is_featured=COALESCE($12,is_featured), is_active=COALESCE($13,is_active), updated_at=NOW() WHERE id=$14 RETURNING *`,
      [name, description, category, location, destination_id, duration_hours, difficulty, min_group, max_group, price_per_person, image_urls, is_featured, is_active, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Activity updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM activities WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Activity deleted' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
