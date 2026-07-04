import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllPackages = async (req: Request, res: Response): Promise<void> => {
  const { category, min_price, max_price, duration_days, search, page = '1', limit = '12' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = 'SELECT * FROM tour_packages WHERE is_active=true';
    const params: (string | number)[] = [];
    let idx = 1;
    if (category) { query += ` AND category=$${idx++}`; params.push(String(category)); }
    if (duration_days) { query += ` AND duration_days=$${idx++}`; params.push(Number(duration_days)); }
    if (min_price) { query += ` AND price_per_person>=$${idx++}`; params.push(Number(min_price)); }
    if (max_price) { query += ` AND price_per_person<=$${idx++}`; params.push(Number(max_price)); }
    if (search) { query += ` AND (name ILIKE $${idx} OR description ILIKE $${idx++})`; params.push(`%${search}%`); }
    const total = Number((await pool.query(query.replace('SELECT *', 'SELECT COUNT(*)'), params)).rows[0].count);
    query += ` ORDER BY is_featured DESC, rating DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    res.json({ success: true, message: 'Packages fetched', data: { items: result.rows, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getFeaturedPackages = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM tour_packages WHERE is_featured=true AND is_active=true ORDER BY rating DESC LIMIT 6');
    res.json({ success: true, message: 'Featured packages', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getPackageById = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM tour_packages WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Package not found' }); return; }
    res.json({ success: true, message: 'Package fetched', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createPackage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, slug, description, category, duration_days, price_per_person, max_group, inclusions, exclusions, image_urls, itinerary_overview } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tour_packages (name,slug,description,category,duration_days,price_per_person,max_group,inclusions,exclusions,image_urls,itinerary_overview,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, slug, description, category, duration_days, price_per_person, max_group, inclusions, exclusions, image_urls, JSON.stringify(itinerary_overview), req.user?.id]
    );
    res.status(201).json({ success: true, message: 'Package created', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updatePackage = async (req: Request, res: Response): Promise<void> => {
  const { name, description, category, duration_days, price_per_person, max_group, inclusions, exclusions, image_urls, is_featured, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tour_packages SET name=COALESCE($1,name), description=COALESCE($2,description), category=COALESCE($3,category), duration_days=COALESCE($4,duration_days), price_per_person=COALESCE($5,price_per_person), max_group=COALESCE($6,max_group), inclusions=COALESCE($7,inclusions), exclusions=COALESCE($8,exclusions), image_urls=COALESCE($9,image_urls), is_featured=COALESCE($10,is_featured), is_active=COALESCE($11,is_active), updated_at=NOW() WHERE id=$12 RETURNING *`,
      [name, description, category, duration_days, price_per_person, max_group, inclusions, exclusions, image_urls, is_featured, is_active, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Package updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deletePackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM tour_packages WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Package deleted' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
