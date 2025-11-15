import express from 'express';
import { getUsers, updateUserSubscription, getAdminStats, deletePaper, deleteGuide, addUser, editUser, deleteUser, addPaper, editPaper, addGuide, editGuide } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All routes in this file are protected and require admin privileges
router.use(protect, admin);

router.get('/stats', getAdminStats);

// User management
router.get('/users', getUsers);
router.post('/users', addUser);
router.put('/users/:id', editUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/subscription', updateUserSubscription);


// Content management routes
router.post('/papers', addPaper);
router.put('/papers/:id', editPaper);
router.delete('/papers/:id', deletePaper);

router.post('/guides', addGuide);
router.put('/guides/:id', editGuide);
router.delete('/guides/:id', deleteGuide);

export default router;
