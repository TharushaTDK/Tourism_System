import { Router } from 'express';
import { createBooking, getMyBookings, getBookingById, cancelBooking, getAllBookings, updateBookingStatus, getBookingStats } from '../controllers/bookingController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();
router.post('/', authenticate, createBooking);
router.get('/my', authenticate, getMyBookings);
router.get('/stats', authenticate, authorizeAdmin, getBookingStats);
router.get('/', authenticate, authorizeAdmin, getAllBookings);
router.get('/:id', authenticate, getBookingById);
router.put('/:id/cancel', authenticate, cancelBooking);
router.put('/:id/status', authenticate, authorizeAdmin, updateBookingStatus);
export default router;
