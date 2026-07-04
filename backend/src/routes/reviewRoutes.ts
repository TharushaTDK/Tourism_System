import { Router } from 'express';
import { createReview, getReviews, getMyReviews, updateReview, deleteReview, markHelpful } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.post('/', authenticate, createReview);
router.get('/my', authenticate, getMyReviews);
router.get('/:type/:id', getReviews);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);
router.post('/:id/helpful', authenticate, markHelpful);
export default router;
