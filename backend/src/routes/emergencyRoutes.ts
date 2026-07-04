import { Router } from 'express';
import { getEmergencyContacts, getContactsByType, createContact, updateContact } from '../controllers/emergencyController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();
router.get('/', getEmergencyContacts);
router.get('/type/:type', getContactsByType);
router.post('/', authenticate, authorizeAdmin, createContact);
router.put('/:id', authenticate, authorizeAdmin, updateContact);
export default router;
