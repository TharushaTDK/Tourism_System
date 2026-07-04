import { Router } from 'express';
import { getAllActivities, getActivityById, getFeaturedActivities, getActivitiesByCategory, createActivity, updateActivity, deleteActivity } from '../controllers/activityController';
import { authenticate, authorizeAdmin, authorizePartner } from '../middleware/auth';

const router = Router();
router.get('/', getAllActivities);
router.get('/featured', getFeaturedActivities);
router.get('/category/:category', getActivitiesByCategory);
router.get('/:id', getActivityById);
router.post('/', authenticate, authorizePartner, createActivity);
router.put('/:id', authenticate, authorizePartner, updateActivity);
router.delete('/:id', authenticate, authorizeAdmin, deleteActivity);
export default router;
