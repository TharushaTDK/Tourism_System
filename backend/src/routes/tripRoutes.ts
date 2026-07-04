import { Router } from 'express';
import { createTrip, getTrip, getMyTrips, getTouristTrips, startTrip, completeTrip, updateLocation, getLiveLocation, getTripRoute } from '../controllers/tripController';
import { authenticate, authorizeAdmin, authorizeDriver } from '../middleware/auth';

const router = Router();
router.post('/', authenticate, authorizeAdmin, createTrip);
router.get('/my/driver', authenticate, authorizeDriver, getMyTrips);
router.get('/my/tourist', authenticate, getTouristTrips);
router.get('/:id', authenticate, getTrip);
router.put('/:id/start', authenticate, authorizeDriver, startTrip);
router.put('/:id/complete', authenticate, authorizeDriver, completeTrip);
router.post('/:id/location', authenticate, authorizeDriver, updateLocation);
router.get('/:id/live', authenticate, getLiveLocation);
router.get('/:id/route', authenticate, getTripRoute);
export default router;
