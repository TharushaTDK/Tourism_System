import { Router } from 'express';
import { getAllDestinations, getDestinationById, getDestinationBySlug, getDestinationAttractions, getFeaturedDestinations, createDestination, updateDestination, deleteDestination, toggleFeatured } from '../controllers/destinationController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();
router.get('/', getAllDestinations);
router.get('/featured', getFeaturedDestinations);
router.get('/slug/:slug', getDestinationBySlug);
router.get('/:id', getDestinationById);
router.get('/:id/attractions', getDestinationAttractions);
router.post('/', authenticate, authorizeAdmin, createDestination);
router.put('/:id', authenticate, authorizeAdmin, updateDestination);
router.delete('/:id', authenticate, authorizeAdmin, deleteDestination);
router.patch('/:id/feature', authenticate, authorizeAdmin, toggleFeatured);
export default router;
