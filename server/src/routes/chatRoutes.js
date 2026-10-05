import { Router } from 'express';
import { body, param } from 'express-validator';
import { emergencyInterceptor } from '../middleware/emergencyInterceptor.js';
import { getCharacters, streamChat } from '../controllers/chatController.js';
import { validate } from './validate.js';
import { getAiConfigError } from '../config/env.js';

const router = Router();
const filters = ['Children', 'Teenagers', 'Adult', 'Young Man', 'Old/Senior', 'Gen Z', 'Gen Alpha'];

function requireAiConfiguration(req, res, next) {
	const error = getAiConfigError();
	if (error) return res.status(503).json({ error, code: 'AI_NOT_CONFIGURED', retryable: false });
	return next();
}

router.post('/stream', requireAiConfiguration, emergencyInterceptor, [body('message').isString().trim().isLength({ min: 1, max: 10000 }), body('ageFilter').optional().isIn(filters)], validate, streamChat);
router.post('/characters', requireAiConfiguration, [body('messages').isArray({ max: 20 }), body('ageFilter').optional().isIn(filters)], validate, getCharacters);

export default router;