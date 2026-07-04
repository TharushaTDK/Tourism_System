import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllRead, sendNotification, broadcastNotification, getUnreadCount, deleteNotification } from '../controllers/notificationController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();
router.get('/my', authenticate, getMyNotifications);
router.get('/my/unread-count', authenticate, getUnreadCount);
router.put('/read-all', authenticate, markAllRead);
router.put('/:id/read', authenticate, markAsRead);
router.delete('/:id', authenticate, deleteNotification);
router.post('/', authenticate, authorizeAdmin, sendNotification);
router.post('/broadcast', authenticate, authorizeAdmin, broadcastNotification);
export default router;
