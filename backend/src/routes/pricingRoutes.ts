import { Router } from 'express';
import {
  getCostSettings, updateCostSetting,
  getTransportRates, createTransportRate, updateTransportRate, deleteTransportRate,
} from '../controllers/pricingController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

router.get('/settings', getCostSettings);
router.put('/settings/:category', authenticate, authorizeAdmin, updateCostSetting);

router.get('/transport-rates', getTransportRates);
router.post('/transport-rates', authenticate, authorizeAdmin, createTransportRate);
router.put('/transport-rates/:id', authenticate, authorizeAdmin, updateTransportRate);
router.delete('/transport-rates/:id', authenticate, authorizeAdmin, deleteTransportRate);

export default router;
