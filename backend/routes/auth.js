import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public endpoints
router.post('/register', register);
router.post('/login', login);

// Protected “me” endpoint
router.get('/me', verifyToken, getMe);

export default router;