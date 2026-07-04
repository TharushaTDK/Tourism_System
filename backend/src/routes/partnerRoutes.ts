import { Router } from 'express';
import { getPartnerDashboard, getPartnerBookings, getPartnerRevenue, getPartnerReviews } from '../controllers/partnerController';
import { authenticate, authorizePartner } from '../middleware/auth';

const router = Router();
router.get('/dashboard', authenticate, authorizePartner, getPartnerDashboard);
router.get('/bookings', authenticate, authorizePartner, getPartnerBookings);
router.get('/revenue', authenticate, authorizePartner, getPartnerRevenue);
router.get('/reviews', authenticate, authorizePartner, getPartnerReviews);
export default router;
