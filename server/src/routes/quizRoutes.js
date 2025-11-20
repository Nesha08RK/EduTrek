import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { startQuiz, submitQuiz } from '../controllers/quizController.js';

const router = Router();

// Student-authenticated endpoints
router.use(requireAuth);

router.post('/start', startQuiz);
router.post('/submit', submitQuiz);

export default router;
