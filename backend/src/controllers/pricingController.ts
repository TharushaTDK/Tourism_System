import { Request, Response } from 'express';
import pool from '../config/database';

export const getCostSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM cost_settings ORDER BY accommodation_per_night ASC');
    res.json({ success: true, message: 'Cost settings fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateCostSetting = async (req: Request, res: Response): Promise<void> => {
  const { accommodation_per_night, food_per_day } = req.body;
  try {
    const result = await pool.query(
      `UPDATE cost_settings SET accommodation_per_night=COALESCE($1,accommodation_per_night), food_per_day=COALESCE($2,food_per_day), updated_at=NOW() WHERE category=$3 RETURNING *`,
      [accommodation_per_night, food_per_day, req.params.category]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Cost setting updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getTransportRates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM transport_rates ORDER BY category, min_passengers');
    res.json({ success: true, message: 'Transport rates fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createTransportRate = async (req: Request, res: Response): Promise<void> => {
  const { category, vehicle_type, min_passengers, max_passengers, price_per_km } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO transport_rates (category, vehicle_type, min_passengers, max_passengers, price_per_km) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [category, vehicle_type, min_passengers, max_passengers, price_per_km]
    );
    res.status(201).json({ success: true, message: 'Transport rate created', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateTransportRate = async (req: Request, res: Response): Promise<void> => {
  const { category, vehicle_type, min_passengers, max_passengers, price_per_km } = req.body;
  try {
    const result = await pool.query(
      `UPDATE transport_rates SET category=COALESCE($1,category), vehicle_type=COALESCE($2,vehicle_type), min_passengers=COALESCE($3,min_passengers), max_passengers=COALESCE($4,max_passengers), price_per_km=COALESCE($5,price_per_km), updated_at=NOW() WHERE id=$6 RETURNING *`,
      [category, vehicle_type, min_passengers, max_passengers, price_per_km, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Transport rate updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteTransportRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM transport_rates WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Transport rate deleted' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
