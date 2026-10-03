import { Router } from 'express';
import { body } from 'express-validator';
import { getPreferences, savePreferences } from '../controllers/userController.js';
import { validate } from './validate.js';

const router = Router();
router.get('/preferences', getPreferences);
router.put('/preferences', body().isObject(), validate, savePreferences);
export default router;