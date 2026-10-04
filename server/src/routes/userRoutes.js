import { Router } from 'express';
import { body } from 'express-validator';
import { getPreferences, savePreferences, getProgress, saveProgress } from '../controllers/userController.js';
import { validate } from './validate.js';

const router = Router();
router.get('/preferences', getPreferences);
router.put('/preferences', body().isObject(), validate, savePreferences);
router.get('/progress', getProgress);
router.put('/progress', body().isObject(), validate, saveProgress);
export default router;