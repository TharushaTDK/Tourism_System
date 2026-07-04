import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  const { category, search, published = 'true', page = '1', limit = '12' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = 'SELECT bp.*, u.name as author_name FROM blog_posts bp LEFT JOIN users u ON bp.author_id=u.id WHERE 1=1';
    const params: (string | number | boolean)[] = [];
    let idx = 1;
    if (published === 'true') { query += ` AND bp.published=$${idx++}`; params.push(true); }
    if (category) { query += ` AND bp.category=$${idx++}`; params.push(String(category)); }
    if (search) { query += ` AND (bp.title ILIKE $${idx} OR bp.excerpt ILIKE $${idx++})`; params.push(`%${search}%`); }
    const total = Number((await pool.query(query.replace('SELECT bp.*, u.name as author_name', 'SELECT COUNT(*)'), params)).rows[0].count);
    query += ` ORDER BY bp.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    res.json({ success: true, message: 'Posts fetched', data: { items: result.rows, total, page: Number(page), limit: Number(limit) } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getPostBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT bp.*, u.name as author_name FROM blog_posts bp LEFT JOIN users u ON bp.author_id=u.id WHERE bp.slug=$1 AND bp.published=true', [req.params.slug]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Post not found' }); return; }
    await pool.query('UPDATE blog_posts SET view_count=view_count+1 WHERE id=$1', [result.rows[0].id]);
    res.json({ success: true, message: 'Post fetched', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, slug, content, excerpt, category, image_url, tags } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO blog_posts (title,slug,content,excerpt,category,author_id,image_url,tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, slug, content, excerpt, category, req.user?.id, image_url, tags || []]
    );
    res.status(201).json({ success: true, message: 'Post created', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updatePost = async (req: Request, res: Response): Promise<void> => {
  const { title, content, excerpt, category, image_url, tags } = req.body;
  try {
    const result = await pool.query(
      `UPDATE blog_posts SET title=COALESCE($1,title), content=COALESCE($2,content), excerpt=COALESCE($3,excerpt), category=COALESCE($4,category), image_url=COALESCE($5,image_url), tags=COALESCE($6,tags), updated_at=NOW() WHERE id=$7 RETURNING *`,
      [title, content, excerpt, category, image_url, tags, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Post updated', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM blog_posts WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const publishPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('UPDATE blog_posts SET published=NOT published, updated_at=NOW() WHERE id=$1 RETURNING id, published', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: `Post ${result.rows[0].published ? 'published' : 'unpublished'}`, data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const incrementViewCount = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE blog_posts SET view_count=view_count+1 WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'View counted' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
