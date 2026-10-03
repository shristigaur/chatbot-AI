import { Router } from 'express';
import { body } from 'express-validator';
import { clearChats, deleteChat, getChatById, listChats, updateChat } from '../controllers/chatController.js';
import { validate } from './validate.js';

const router = Router();
router.get('/', listChats);
router.get('/:id', getChatById);
router.patch('/:id', [body('title').optional().isString().trim().isLength({ min: 1, max: 120 }), body('ageFilter').optional().isString(), body('activeCharacter').optional().isObject()], validate, updateChat);
router.delete('/:id', deleteChat);
router.delete('/', clearChats);
export default router;