import { Router } from 'express';
import { getAllEvents, getFeaturedEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../controllers/eventController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();
router.get('/', getAllEvents);
router.get('/featured', getFeaturedEvents);
router.get('/:id', getEventById);
router.post('/', authenticate, authorizeAdmin, createEvent);
router.put('/:id', authenticate, authorizeAdmin, updateEvent);
router.delete('/:id', authenticate, authorizeAdmin, deleteEvent);
export default router;
