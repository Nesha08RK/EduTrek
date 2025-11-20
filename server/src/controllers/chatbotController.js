import { chatWithCohere } from '../services/cohereService.js';

const faqResponses = {
	'how to enroll': 'To enroll in a course, click on the course card and press the "Enroll" button. You can browse courses on the homepage.',
	'payment': 'We accept Stripe, Razorpay, and PayPal. Select your preferred payment method during checkout.',
	'certificate': 'Certificates are automatically generated when you complete a course. You can download them from your dashboard.',
	'progress': 'Track your progress in the "My Courses" section of your dashboard. Each module shows completion status.',
	'contact': 'For support, email us at support@edutrek.com or use the chat feature.',
	'help': 'I can help you with enrollment, payments, certificates, progress tracking, and general questions. What would you like to know?'
};

export async function chatMessage(req, res) {
	try {
		const { message } = req.body;
		const lowerMessage = message.toLowerCase();

		let response = null;

		// Try Cohere first if configured
		if (process.env.COHERE_API_KEY) {
			try {
				console.log('[chatbot] Attempting Cohere response...');
				response = await chatWithCohere(message);
			} catch (err) {
				// If Cohere fails, fall back to FAQ
				console.error('[chatbot] Cohere error, falling back to FAQ:', err?.message || err);
				response = null;
			}
		}

		// Fallback: Simple keyword matching
		if (!response) {
			response = 'I\'m here to help! Ask me about enrollment, payments, certificates, or course progress.';
			for (const [keyword, reply] of Object.entries(faqResponses)) {
				if (lowerMessage.includes(keyword)) {
					response = reply;
					break;
				}
			}
			// Course navigation help
			if (lowerMessage.includes('course') && lowerMessage.includes('find')) {
				response = 'You can find courses by browsing the homepage or using the search bar. Filter by category to narrow down options.';
			}
		}

		res.json({
			message: response,
			timestamp: new Date(),
			bot: true
		});
	} catch (e) {
		res.status(500).json({ message: 'Chat service unavailable' });
	}
}
