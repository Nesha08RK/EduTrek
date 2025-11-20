import { Router } from 'express';
import { generateCertificate, downloadCertificate, validateCertificate } from '../controllers/certificateController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Generate certificate for enrollment
router.post('/enrollment/:enrollmentId', requireAuth, generateCertificate);

// Download certificate
router.get('/:certificateId/download', downloadCertificate);

// Validate certificate
router.get('/:certificateId/validate', validateCertificate);

export default router;