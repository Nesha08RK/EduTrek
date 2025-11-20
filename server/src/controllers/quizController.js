import { v4 as uuidv4 } from 'uuid';
import { generateQuizQuestions } from '../services/cohereService.js';

// In-memory attempt store: attemptId -> { userId, topic, difficulty, questions }
const attempts = new Map();

// POST /api/quiz/start { topic, difficulty }
export async function startQuiz(req, res) {
  try {
    const userId = req.user?.id;
    const { topic, difficulty = 'mixed' } = req.body || {};

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ message: 'topic is required' });
    }

    const questions = await generateQuizQuestions(topic, difficulty);
    if (!questions || questions.length === 0) {
      return res.status(500).json({ message: 'Failed to generate questions' });
    }

    // Hide correctIndex from client
    const clientQuestions = questions.map(({ id, prompt, options, difficulty }) => ({ id, prompt, options, difficulty }));

    const attemptId = uuidv4();
    attempts.set(attemptId, { userId, topic, difficulty, questions });

    return res.json({ attemptId, topic, difficulty, count: clientQuestions.length, questions: clientQuestions });
  } catch (e) {
    console.error('[quiz] start error', e);
    return res.status(500).json({ message: 'Quiz service unavailable' });
  }
}

// POST /api/quiz/submit { attemptId, answers: [{ id, selectedIndex }] }
export async function submitQuiz(req, res) {
  try {
    const { attemptId, answers } = req.body || {};
    if (!attemptId || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'attemptId and answers[] are required' });
    }
    const attempt = attempts.get(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found or expired' });
    }

    const { questions, topic, difficulty } = attempt;
    const byId = new Map(questions.map(q => [String(q.id), q]));

    let score = 0;
    const review = [];

    for (const a of answers) {
      const q = byId.get(String(a.id));
      if (!q) continue;
      const selectedIndex = Number.isInteger(a.selectedIndex) ? a.selectedIndex : -1;
      const correct = selectedIndex === q.correctIndex;
      if (correct) score += 1;
      review.push({
        id: String(q.id),
        prompt: q.prompt,
        options: q.options,
        selectedIndex,
        correctIndex: q.correctIndex,
        correct,
        explanation: q.explanation,
        difficulty: q.difficulty,
      });
    }

    // Optionally clear the attempt after submit
    attempts.delete(attemptId);

    return res.json({ topic, difficulty, score, total: questions.length, review });
  } catch (e) {
    console.error('[quiz] submit error', e);
    return res.status(500).json({ message: 'Quiz scoring failed' });
  }
}
