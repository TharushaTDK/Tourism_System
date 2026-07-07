import { Router } from 'express';
import { getDashboardData, manageUser, verifyDriver, getAllUsers } from '../controllers/adminController';
import { adminListItineraries, adminUpdateItinerary, approveItinerary, setItineraryPrice, showPriceToCustomer } from '../controllers/itineraryController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();
router.get('/dashboard', authenticate, authorizeAdmin, getDashboardData);
router.get('/users', authenticate, authorizeAdmin, getAllUsers);
router.put('/users/:id', authenticate, authorizeAdmin, manageUser);
router.post('/drivers/:id/verify', authenticate, authorizeAdmin, verifyDriver);
router.get('/itineraries', authenticate, authorizeAdmin, adminListItineraries);
router.put('/itineraries/:id', authenticate, authorizeAdmin, adminUpdateItinerary);
router.patch('/itineraries/:id/approve', authenticate, authorizeAdmin, approveItinerary);
router.patch('/itineraries/:id/price', authenticate, authorizeAdmin, setItineraryPrice);
router.patch('/itineraries/:id/show-price', authenticate, authorizeAdmin, showPriceToCustomer);
export default router;
