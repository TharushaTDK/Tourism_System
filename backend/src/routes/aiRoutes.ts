import { Router } from 'express';
import { generateItinerary, optimizeRoute, estimateCost, getChatResponse, getSmartRecommendations } from '../controllers/aiController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
router.post('/itinerary', authenticate, generateItinerary);
router.post('/route/optimize', authenticate, optimizeRoute);
router.post('/cost/estimate', estimateCost);
router.post('/chat', getChatResponse);
router.get('/recommendations', optionalAuth, getSmartRecommendations);
export default router;
