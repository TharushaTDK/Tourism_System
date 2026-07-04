import { Router } from 'express';
import { getAllPosts, getPostBySlug, createPost, updatePost, deletePost, publishPost, incrementViewCount } from '../controllers/blogController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();
router.get('/', getAllPosts);
router.get('/slug/:slug', getPostBySlug);
router.post('/', authenticate, authorizeAdmin, createPost);
router.put('/:id', authenticate, authorizeAdmin, updatePost);
router.delete('/:id', authenticate, authorizeAdmin, deletePost);
router.patch('/:id/publish', authenticate, authorizeAdmin, publishPost);
router.post('/:id/view', incrementViewCount);
export default router;
