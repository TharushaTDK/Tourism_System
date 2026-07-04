import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllHotels = async (req: Request, res: Response): Promise<void> => {
  const { category, type, destination_id, min_price, max_price, star_rating, search, page = '1', limit = '12' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = 'SELECT h.*, d.name as destination_name FROM hotels h LEFT JOIN destinations d ON h.destination_id=d.id WHERE h.is_active=true';
    const params: (string | number)[] = [];
    let idx = 1;
    if (category) { query += ` AND h.category=$${idx++}`; params.push(String(category)); }
    if (type) { query += ` AND h.type=$${idx++}`; params.push(String(type)); }
    if (destination_id) { query += ` AND h.destination_id=$${idx++}`; params.push(Number(destination_id)); }
    if (min_price) { query += ` AND h.price_per_night>=$${idx++}`; params.push(Number(min_price)); }
    if (max_price) { query += ` AND h.price_per_night<=$${idx++}`; params.push(Number(max_price)); }
    if (star_rating) { query += ` AND h.star_rating=$${idx++}`; params.push(Number(star_rating)); }
    if (search) { query += ` AND (h.name ILIKE $${idx} OR h.description ILIKE $${idx++})`; params.push(`%${search}%`); }
    const countQuery = query.replace('SELECT h.*, d.name as destination_name', 'SELECT COUNT(*)');
    const total = Number((await pool.query(countQuery, params)).rows[0].count);
    query += ` ORDER BY h.is_featured DESC, h.rating DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    res.json({ success: true, message: 'Hotels fetched', data: { items: result.rows, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getFeaturedHotels = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT h.*, d.name as destination_name FROM hotels h LEFT JOIN destinations d ON h.destination_id=d.id WHERE h.is_featured=true AND h.is_active=true ORDER BY h.rating DESC LIMIT 8');
    res.json({ success: true, message: 'Featured hotels', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getHotelById = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT h.*, d.name as destination_name FROM hotels h LEFT JOIN destinations d ON h.destination_id=d.id WHERE h.id=$1', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Hotel not found' }); return; }
    res.json({ success: true, message: 'Hotel fetched', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const checkAvailability = async (req: Request, res: Response): Promise<void> => {
  const { check_in, check_out, guests } = req.query;
  const { id } = req.params;
  try {
    const hotel = await pool.query('SELECT price_per_night FROM hotels WHERE id=$1 AND is_active=true', [id]);
    if (!hotel.rows[0]) { res.status(404).json({ success: false, message: 'Hotel not found' }); return; }
    const booked = await pool.query(
      `SELECT COUNT(*) FROM bookings WHERE booking_type='hotel' AND reference_id=$1 AND status NOT IN ('cancelled') AND check_in < $2 AND check_out > $3`,
      [id, check_out, check_in]
    );
    const nights = Math.ceil((new Date(String(check_out)).getTime() - new Date(String(check_in)).getTime()) / 86400000);
    const total = hotel.rows[0].price_per_night * nights * Number(guests || 1);
    res.json({ success: true, message: 'Availability checked', data: { available: Number(booked.rows[0].count) === 0, nights, price_per_night: hotel.rows[0].price_per_night, total_price: total } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createHotel = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, slug, description, category, type, destination_id, address, latitude, longitude, price_per_night, amenities, image_urls, star_rating } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO hotels (name,slug,description,category,type,destination_id,address,latitude,longitude,price_per_night,amenities,image_urls,star_rating,partner_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [name, slug, description, category, type, destination_id, address, latitude, longitude, price_per_night, amenities, image_urls, star_rating, req.user?.id]
    );
    res.status(201).json({ success: true, message: 'Hotel created', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateHotel = async (req: Request, res: Response): Promise<void> => {
  const { name, description, category, type, destination_id, address, price_per_night, amenities, image_urls, star_rating, is_featured, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE hotels SET name=COALESCE($1,name), description=COALESCE($2,description), category=COALESCE($3,category), type=COALESCE($4,type), destination_id=COALESCE($5,destination_id), address=COALESCE($6,address), price_per_night=COALESCE($7,price_per_night), amenities=COALESCE($8,amenities), image_urls=COALESCE($9,image_urls), star_rating=COALESCE($10,star_rating), is_featured=COALESCE($11,is_featured), is_active=COALESCE($12,is_active), updated_at=NOW() WHERE id=$13 RETURNING *`,
      [name, description, category, type, destination_id, address, price_per_night, amenities, image_urls, star_rating, is_featured, is_active, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Hotel updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteHotel = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM hotels WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Hotel deleted' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
