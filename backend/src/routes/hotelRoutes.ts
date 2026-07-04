import { Router } from 'express';
import { getAllHotels, getHotelById, getFeaturedHotels, checkAvailability, createHotel, updateHotel, deleteHotel } from '../controllers/hotelController';
import { authenticate, authorizeAdmin, authorizePartner } from '../middleware/auth';

const router = Router();
router.get('/', getAllHotels);
router.get('/featured', getFeaturedHotels);
router.get('/:id', getHotelById);
router.get('/:id/availability', checkAvailability);
router.post('/', authenticate, authorizePartner, createHotel);
router.put('/:id', authenticate, authorizePartner, updateHotel);
router.delete('/:id', authenticate, authorizeAdmin, deleteHotel);
export default router;
