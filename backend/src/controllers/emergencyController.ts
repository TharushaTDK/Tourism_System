import { Request, Response } from 'express';
import pool from '../config/database';

export const getEmergencyContacts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM emergency_contacts WHERE is_active=true ORDER BY type, name');
    res.json({ success: true, message: 'Emergency contacts fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getContactsByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM emergency_contacts WHERE type=$1 AND is_active=true ORDER BY name', [req.params.type]);
    res.json({ success: true, message: 'Contacts fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createContact = async (req: Request, res: Response): Promise<void> => {
  const { type, name, phone, address, city } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO emergency_contacts (type,name,phone,address,city) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [type, name, phone, address, city]
    );
    res.status(201).json({ success: true, message: 'Contact added', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateContact = async (req: Request, res: Response): Promise<void> => {
  const { type, name, phone, address, city, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE emergency_contacts SET type=COALESCE($1,type), name=COALESCE($2,name), phone=COALESCE($3,phone), address=COALESCE($4,address), city=COALESCE($5,city), is_active=COALESCE($6,is_active), updated_at=NOW() WHERE id=$7 RETURNING *`,
      [type, name, phone, address, city, is_active, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Contact updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
