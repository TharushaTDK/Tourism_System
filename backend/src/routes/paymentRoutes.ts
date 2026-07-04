import { Router } from 'express';
import { createPayment, getMyPayments, getAllPayments, getPaymentStats } from '../controllers/paymentController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();
router.post('/', authenticate, createPayment);
router.get('/my', authenticate, getMyPayments);
router.get('/stats', authenticate, authorizeAdmin, getPaymentStats);
router.get('/', authenticate, authorizeAdmin, getAllPayments);
export default router;
