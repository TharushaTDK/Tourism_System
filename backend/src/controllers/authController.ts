import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database';
import { User } from '../types';
import { AuthRequest } from '../middleware/auth';

const signToken = (payload: object): string =>
  jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  });

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone, nationality } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const result = await pool.query<User>(
      'INSERT INTO users (name, email, password, phone, nationality) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,phone,nationality,role,is_verified,created_at',
      [name, email, hashed, phone, nationality]
    );
    const user = result.rows[0];
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ success: true, message: 'Registration successful', data: { user, token } });
  } catch (err) {
    console.error('Register:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const result = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const { password: _pw, reset_token: _rt, ...safe } = user;
    res.json({ success: true, message: 'Login successful', data: { user: safe, token } });
  } catch (err) {
    console.error('Login:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const { google_id, email, name, profile_image } = req.body;
  try {
    let result = await pool.query<User>('SELECT * FROM users WHERE google_id = $1 OR email = $2', [google_id, email]);
    let user: User;
    if (result.rows.length > 0) {
      user = result.rows[0];
      await pool.query('UPDATE users SET google_id=$1, profile_image=COALESCE($2, profile_image), updated_at=NOW() WHERE id=$3', [google_id, profile_image, user.id]);
    } else {
      const inserted = await pool.query<User>(
        'INSERT INTO users (name, email, google_id, profile_image, is_verified) VALUES ($1,$2,$3,$4,true) RETURNING *',
        [name, email, google_id, profile_image]
      );
      user = inserted.rows[0];
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const { password: _pw, reset_token: _rt, ...safe } = user;
    res.json({ success: true, message: 'Google login successful', data: { user: safe, token } });
  } catch (err) {
    console.error('GoogleLogin:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT id,name,email,phone,whatsapp,contact_email,nationality,profile_image,role,is_verified,created_at FROM users WHERE id=$1', [req.user?.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, message: 'Profile fetched', data: result.rows[0] });
  } catch (err) {
    console.error('GetMe:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, phone, whatsapp, contact_email, nationality, profile_image } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone), whatsapp=COALESCE($3,whatsapp), contact_email=COALESCE($4,contact_email), nationality=COALESCE($5,nationality), profile_image=COALESCE($6,profile_image), updated_at=NOW() WHERE id=$7 RETURNING id,name,email,phone,whatsapp,contact_email,nationality,profile_image,role',
      [name, phone, whatsapp, contact_email, nationality, profile_image, req.user?.id]
    );
    res.json({ success: true, message: 'Profile updated', data: result.rows[0] });
  } catch (err) {
    console.error('UpdateProfile:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (!result.rows[0]) { res.json({ success: true, message: 'If that email exists, a reset link was sent.' }); return; }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await pool.query('UPDATE users SET reset_token=$1, reset_token_expires=$2 WHERE id=$3', [token, expires, result.rows[0].id]);
    // In production: send email with reset link containing token
    res.json({ success: true, message: 'Password reset token generated', data: { reset_token: token } });
  } catch (err) {
    console.error('ForgotPassword:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;
  try {
    const result = await pool.query('SELECT id FROM users WHERE reset_token=$1 AND reset_token_expires > NOW()', [token]);
    if (!result.rows[0]) { res.status(400).json({ success: false, message: 'Invalid or expired reset token' }); return; }
    const hashed = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password=$1, reset_token=NULL, reset_token_expires=NULL, updated_at=NOW() WHERE id=$2', [hashed, result.rows[0].id]);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('ResetPassword:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { current_password, new_password } = req.body;
  try {
    const result = await pool.query<User>('SELECT * FROM users WHERE id=$1', [req.user?.id]);
    const user = result.rows[0];
    if (!user.password || !(await bcrypt.compare(current_password, user.password))) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' }); return;
    }
    const hashed = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2', [hashed, req.user?.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('ChangePassword:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.json({ success: true, message: 'Logged out successfully' });
};
