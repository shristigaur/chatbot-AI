import { Router } from 'express';
import { body } from 'express-validator';
import { signup, login, refresh, logout } from '../controllers/authController.js';
import { validate } from './validate.js';

const router = Router();

router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('name').optional().isString(),
  body('ageGroup').optional().isIn(['Child', 'Teenager', 'Adult', 'Senior'])
], validate, signup);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('otp').optional().isString()
], validate, login);

router.post('/refresh', refresh);
router.post('/logout', logout);

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod');
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ user: { id: user._id, name: user.name, email: user.email, character: user.character, interests: user.interests, ageGroup: user.ageGroup } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
