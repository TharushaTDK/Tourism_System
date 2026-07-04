import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

const TABLE_MAP: Record<string, string> = {
  destination: 'destinations',
  activity: 'activities',
  hotel: 'hotels',
  package: 'tour_packages',
};

const recalcRating = async (type: string, id: number): Promise<void> => {
  const table = TABLE_MAP[type];
  if (!table) return;
  await pool.query(
    `UPDATE ${table} SET rating=(SELECT COALESCE(AVG(rating),0) FROM reviews WHERE reviewable_type=$1 AND reviewable_id=$2), review_count=(SELECT COUNT(*) FROM reviews WHERE reviewable_type=$1 AND reviewable_id=$2) WHERE id=$2`,
    [type, id]
  );
};

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { reviewable_type, reviewable_id, rating, title, comment, images } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO reviews (user_id,reviewable_type,reviewable_id,rating,title,comment,images) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user?.id, reviewable_type, reviewable_id, rating, title, comment, images || []]
    );
    await recalcRating(reviewable_type, reviewable_id);
    res.status(201).json({ success: true, message: 'Review submitted', data: result.rows[0] });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ success: false, message: 'You already reviewed this' }); return;
    }
    console.error(err); res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  const { type, id } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as user_name, u.profile_image FROM reviews r JOIN users u ON r.user_id=u.id WHERE r.reviewable_type=$1 AND r.reviewable_id=$2 ORDER BY r.created_at DESC`,
      [type, id]
    );
    res.json({ success: true, message: 'Reviews fetched', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getMyReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM reviews WHERE user_id=$1 ORDER BY created_at DESC', [req.user?.id]);
    res.json({ success: true, message: 'My reviews', data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { rating, title, comment } = req.body;
  try {
    const result = await pool.query(
      `UPDATE reviews SET rating=COALESCE($1,rating), title=COALESCE($2,title), comment=COALESCE($3,comment), updated_at=NOW() WHERE id=$4 AND user_id=$5 RETURNING *`,
      [rating, title, comment, req.params.id, req.user?.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Review not found' }); return; }
    await recalcRating(result.rows[0].reviewable_type, result.rows[0].reviewable_id);
    res.json({ success: true, message: 'Review updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rev = await pool.query('SELECT * FROM reviews WHERE id=$1 AND user_id=$2', [req.params.id, req.user?.id]);
    if (!rev.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    await pool.query('DELETE FROM reviews WHERE id=$1', [req.params.id]);
    await recalcRating(rev.rows[0].reviewable_type, rev.rows[0].reviewable_id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const markHelpful = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('UPDATE reviews SET helpful_count=helpful_count+1 WHERE id=$1 RETURNING id, helpful_count', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Marked as helpful', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
