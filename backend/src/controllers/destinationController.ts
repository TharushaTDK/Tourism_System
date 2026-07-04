import { Request, Response } from 'express';
import pool from '../config/database';

export const getAllDestinations = async (req: Request, res: Response): Promise<void> => {
  const { category, province, search, featured, page = '1', limit = '12' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = 'SELECT * FROM destinations WHERE is_active = true';
    const params: (string | number | boolean)[] = [];
    let idx = 1;
    if (category) { query += ` AND category = $${idx++}`; params.push(String(category)); }
    if (province) { query += ` AND province ILIKE $${idx++}`; params.push(`%${province}%`); }
    if (featured === 'true') { query += ` AND is_featured = $${idx++}`; params.push(true); }
    if (search) { query += ` AND (name ILIKE $${idx} OR short_description ILIKE $${idx++})`; params.push(`%${search}%`); }
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const total = Number((await pool.query(countQuery, params)).rows[0].count);
    query += ` ORDER BY is_featured DESC, rating DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    res.json({ success: true, message: 'Destinations fetched', data: { items: result.rows, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getFeaturedDestinations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM destinations WHERE is_featured=true AND is_active=true ORDER BY rating DESC LIMIT 6');
    res.json({ success: true, message: 'Featured destinations', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getDestinationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM destinations WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Destination not found' }); return; }
    res.json({ success: true, message: 'Destination fetched', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getDestinationBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM destinations WHERE slug=$1', [req.params.slug]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Destination not found' }); return; }
    const dest = result.rows[0];
    const [attractions, activities, hotels] = await Promise.all([
      pool.query('SELECT * FROM attractions WHERE destination_id=$1', [dest.id]),
      pool.query('SELECT * FROM activities WHERE destination_id=$1 AND is_active=true LIMIT 6', [dest.id]),
      pool.query('SELECT * FROM hotels WHERE destination_id=$1 AND is_active=true LIMIT 6', [dest.id]),
    ]);
    res.json({ success: true, message: 'Destination fetched', data: { ...dest, attractions: attractions.rows, activities: activities.rows, nearby_hotels: hotels.rows } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getDestinationAttractions = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM attractions WHERE destination_id=$1 ORDER BY distance_km', [req.params.id]);
    res.json({ success: true, message: 'Attractions fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createDestination = async (req: Request, res: Response): Promise<void> => {
  const { name, slug, description, short_description, category, province, latitude, longitude, image_urls, video_url, best_time_to_visit, entry_fee, opening_hours, emoji, budget_price, mid_range_price, luxury_price } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO destinations (name,slug,description,short_description,category,province,latitude,longitude,image_urls,video_url,best_time_to_visit,entry_fee,opening_hours,emoji,budget_price,mid_range_price,luxury_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,COALESCE($14,'📍'),COALESCE($15,0),COALESCE($16,0),COALESCE($17,0)) RETURNING *`,
      [name, slug, description, short_description, category, province, latitude, longitude, image_urls, video_url, best_time_to_visit, entry_fee, opening_hours, emoji, budget_price, mid_range_price, luxury_price]
    );
    res.status(201).json({ success: true, message: 'Destination created', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateDestination = async (req: Request, res: Response): Promise<void> => {
  const { name, description, short_description, category, province, latitude, longitude, image_urls, video_url, best_time_to_visit, entry_fee, opening_hours, is_active, emoji, budget_price, mid_range_price, luxury_price } = req.body;
  try {
    const result = await pool.query(
      `UPDATE destinations SET name=COALESCE($1,name), description=COALESCE($2,description), short_description=COALESCE($3,short_description), category=COALESCE($4,category), province=COALESCE($5,province), latitude=COALESCE($6,latitude), longitude=COALESCE($7,longitude), image_urls=COALESCE($8,image_urls), video_url=COALESCE($9,video_url), best_time_to_visit=COALESCE($10,best_time_to_visit), entry_fee=COALESCE($11,entry_fee), opening_hours=COALESCE($12,opening_hours), is_active=COALESCE($13,is_active), emoji=COALESCE($14,emoji), budget_price=COALESCE($15,budget_price), mid_range_price=COALESCE($16,mid_range_price), luxury_price=COALESCE($17,luxury_price), updated_at=NOW() WHERE id=$18 RETURNING *`,
      [name, description, short_description, category, province, latitude, longitude, image_urls, video_url, best_time_to_visit, entry_fee, opening_hours, is_active, emoji, budget_price, mid_range_price, luxury_price, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Destination updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteDestination = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM destinations WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Destination deleted' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const toggleFeatured = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('UPDATE destinations SET is_featured = NOT is_featured, updated_at=NOW() WHERE id=$1 RETURNING id, is_featured', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: `Destination ${result.rows[0].is_featured ? 'featured' : 'unfeatured'}`, data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
