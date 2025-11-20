import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
	{
		question: String,
		options: [String],
		answerIndex: Number,
		explanation: String,
		difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
	},
	{ _id: false }
);

const assessmentSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		description: String,
		questions: [quizSchema],
		passingScore: { type: Number, default: 70 }, // Percentage
		duration: Number, // Duration in minutes
		maxAttempts: { type: Number, default: 3 },
		isRequired: { type: Boolean, default: true },
	},
	{ _id: false }
);

const videoSchema = new mongoose.Schema(
	{
		title: String,
		url: String,
		durationSec: Number,
	},
	{ _id: false }
);

const moduleSchema = new mongoose.Schema(
	{
		title: String,
		videos: [videoSchema],
		quizzes: [quizSchema],
		resources: [String],
	},
	{ _id: false }
);

const courseSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		description: String,
		category: String,
		price: { type: Number, default: 0 },
		thumbnailUrl: String,
		image: String, // Alternative image field
		modules: [moduleSchema],
		assessment: assessmentSchema, // Course assessment/quiz
		instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		isPublished: { type: Boolean, default: false },
		studentsEnrolled: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

export default mongoose.model('Course', courseSchema);
