import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createStripePayment, createRazorpayPayment, createPayPalPayment } from '../controllers/paymentController.js';

const router = Router();

router.post('/stripe', requireAuth, createStripePayment);
router.post('/razorpay', requireAuth, createRazorpayPayment);
router.post('/paypal', requireAuth, createPayPalPayment);

export default router;
