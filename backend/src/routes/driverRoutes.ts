import { Router } from 'express';
import { getAllDrivers, getDriverById, getDriverStats, updateDriverProfile, getDriverBookings, getDriverTrips, rateDriver } from '../controllers/driverController';
import { authenticate, authorizeDriver } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, getAllDrivers);
router.get('/stats', authenticate, authorizeDriver, getDriverStats);
router.get('/my/bookings', authenticate, authorizeDriver, getDriverBookings);
router.get('/my/trips', authenticate, authorizeDriver, getDriverTrips);
router.get('/:id', authenticate, getDriverById);
router.put('/profile', authenticate, authorizeDriver, updateDriverProfile);
router.post('/:id/rate', authenticate, rateDriver);
export default router;
