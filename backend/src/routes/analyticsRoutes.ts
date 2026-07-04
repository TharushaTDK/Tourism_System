import { Router } from 'express';
import { getDashboardStats, getTouristAnalytics, getRevenueAnalytics, getRouteAnalytics } from '../controllers/analyticsController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();
router.get('/dashboard', authenticate, authorizeAdmin, getDashboardStats);
router.get('/tourists', authenticate, authorizeAdmin, getTouristAnalytics);
router.get('/revenue', authenticate, authorizeAdmin, getRevenueAnalytics);
router.get('/routes', authenticate, authorizeAdmin, getRouteAnalytics);
export default router;
