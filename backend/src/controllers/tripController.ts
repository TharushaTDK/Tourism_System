import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createTrip = async (req: Request, res: Response): Promise<void> => {
  const { booking_id, driver_id, tourist_id, vehicle_id, origin, destination, pickup_date, pickup_time, fare, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO trips (booking_id,driver_id,tourist_id,vehicle_id,origin,destination,pickup_date,pickup_time,fare,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [booking_id || null, driver_id, tourist_id, vehicle_id, origin, destination, pickup_date, pickup_time, fare, notes]
    );
    res.status(201).json({ success: true, message: 'Trip created', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT t.*, d.name as driver_name, d.phone as driver_phone, u.name as tourist_name, v.make, v.model, v.type as vehicle_type FROM trips t JOIN users d ON t.driver_id=d.id JOIN users u ON t.tourist_id=u.id LEFT JOIN vehicles v ON t.vehicle_id=v.id WHERE t.id=$1`,
      [req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Trip not found' }); return; }
    res.json({ success: true, message: 'Trip fetched', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getMyTrips = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as tourist_name, u.phone as tourist_phone FROM trips t JOIN users u ON t.tourist_id=u.id WHERE t.driver_id=$1 ORDER BY t.pickup_date DESC`,
      [req.user?.id]
    );
    res.json({ success: true, message: 'My trips', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getTouristTrips = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT t.*, d.name as driver_name, d.phone as driver_phone, v.make, v.model, v.type as vehicle_type FROM trips t JOIN users d ON t.driver_id=d.id LEFT JOIN vehicles v ON t.vehicle_id=v.id WHERE t.tourist_id=$1 ORDER BY t.pickup_date DESC`,
      [req.user?.id]
    );
    res.json({ success: true, message: 'Tourist trips', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const startTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `UPDATE trips SET status='in_progress', updated_at=NOW() WHERE id=$1 AND driver_id=$2 AND status='scheduled' RETURNING *`,
      [req.params.id, req.user?.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Trip not found or already started' }); return; }
    res.json({ success: true, message: 'Trip started', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const completeTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  const { total_km } = req.body;
  try {
    const result = await pool.query(
      `UPDATE trips SET status='completed', total_km=COALESCE($1,total_km), updated_at=NOW() WHERE id=$2 AND driver_id=$3 AND status='in_progress' RETURNING *`,
      [total_km, req.params.id, req.user?.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Trip not found or not in progress' }); return; }
    res.json({ success: true, message: 'Trip completed', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  const { latitude, longitude, speed, heading } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO trip_tracking (trip_id,latitude,longitude,speed,heading) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, latitude, longitude, speed, heading]
    );
    res.json({ success: true, message: 'Location updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getLiveLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM trip_tracking WHERE trip_id=$1 ORDER BY recorded_at DESC LIMIT 1',
      [req.params.id]
    );
    res.json({ success: true, message: 'Live location', data: result.rows[0] || null });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getTripRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT latitude, longitude, speed, heading, recorded_at FROM trip_tracking WHERE trip_id=$1 ORDER BY recorded_at ASC',
      [req.params.id]
    );
    res.json({ success: true, message: 'Trip route', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
