import { Router } from 'express';
import { getAllPackages, getPackageById, getFeaturedPackages, createPackage, updatePackage, deletePackage } from '../controllers/packageController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();
router.get('/', getAllPackages);
router.get('/featured', getFeaturedPackages);
router.get('/:id', getPackageById);
router.post('/', authenticate, authorizeAdmin, createPackage);
router.put('/:id', authenticate, authorizeAdmin, updatePackage);
router.delete('/:id', authenticate, authorizeAdmin, deletePackage);
export default router;
