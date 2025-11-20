import { Router } from 'express';
import { chatMessage } from '../controllers/chatbotController.js';

const router = Router();

router.post('/message', chatMessage);

export default router;
