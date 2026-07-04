import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllVehicles = async (req: Request, res: Response): Promise<void> => {
  const { type, available } = req.query;
  try {
    let query = `SELECT v.*, u.name as driver_name, u.phone as driver_phone FROM vehicles v JOIN users u ON v.driver_id=u.id WHERE 1=1`;
    const params: (string | number | boolean)[] = [];
    let idx = 1;
    if (type) { query += ` AND v.type=$${idx++}`; params.push(String(type)); }
    if (available === 'true') { query += ` AND v.is_available=$${idx++}`; params.push(true); }
    query += ' ORDER BY v.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, message: 'Vehicles fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, make, model, year, plate_number, capacity, ac, image_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO vehicles (driver_id,type,make,model,year,plate_number,capacity,ac,image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user?.id, type, make, model, year, plate_number, capacity, ac !== false, image_url]
    );
    res.status(201).json({ success: true, message: 'Vehicle added', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, make, model, year, plate_number, capacity, ac, image_url } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vehicles SET type=COALESCE($1,type), make=COALESCE($2,make), model=COALESCE($3,model), year=COALESCE($4,year), plate_number=COALESCE($5,plate_number), capacity=COALESCE($6,capacity), ac=COALESCE($7,ac), image_url=COALESCE($8,image_url), updated_at=NOW() WHERE id=$9 AND driver_id=$10 RETURNING *`,
      [type, make, model, year, plate_number, capacity, ac, image_url, req.params.id, req.user?.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
    res.json({ success: true, message: 'Vehicle updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM vehicles WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const toggleAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('UPDATE vehicles SET is_available=NOT is_available, updated_at=NOW() WHERE id=$1 AND driver_id=$2 RETURNING id, is_available', [req.params.id, req.user?.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: `Vehicle ${result.rows[0].is_available ? 'available' : 'unavailable'}`, data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
