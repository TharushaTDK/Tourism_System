import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id=$1 OR user_id IS NULL ORDER BY sent_at DESC LIMIT 50',
      [req.user?.id]
    );
    res.json({ success: true, message: 'Notifications fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE (user_id=$1 OR user_id IS NULL) AND is_read=false',
      [req.user?.id]
    );
    res.json({ success: true, message: 'Unread count', data: { count: Number(result.rows[0].count) } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE notifications SET is_read=true WHERE id=$1 AND (user_id=$2 OR user_id IS NULL)', [req.params.id, req.user?.id]);
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE notifications SET is_read=true WHERE (user_id=$1 OR user_id IS NULL) AND is_read=false', [req.user?.id]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM notifications WHERE id=$1 AND (user_id=$2 OR user_id IS NULL)', [req.params.id, req.user?.id]);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const sendNotification = async (req: Request, res: Response): Promise<void> => {
  const { user_id, type, title, message, data } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO notifications (user_id,type,title,message,data) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [user_id || null, type, title, message, data ? JSON.stringify(data) : null]
    );
    res.status(201).json({ success: true, message: 'Notification sent', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const broadcastNotification = async (req: Request, res: Response): Promise<void> => {
  const { type, title, message, data } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO notifications (user_id,type,title,message,data) VALUES (NULL,$1,$2,$3,$4) RETURNING *',
      [type, title, message, data ? JSON.stringify(data) : null]
    );
    res.status(201).json({ success: true, message: 'Broadcast sent', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
