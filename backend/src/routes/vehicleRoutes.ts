import { Router } from 'express';
import { getAllVehicles, createVehicle, updateVehicle, deleteVehicle, toggleAvailability } from '../controllers/vehicleController';
import { authenticate, authorizeAdmin, authorizeDriver } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, getAllVehicles);
router.post('/', authenticate, authorizeDriver, createVehicle);
router.put('/:id', authenticate, authorizeDriver, updateVehicle);
router.delete('/:id', authenticate, authorizeAdmin, deleteVehicle);
router.patch('/:id/availability', authenticate, authorizeDriver, toggleAvailability);
export default router;
