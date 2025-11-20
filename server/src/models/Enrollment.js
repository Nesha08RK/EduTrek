import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
	{
		moduleIndex: Number,
		videoIndex: Number,
		completed: { type: Boolean, default: false },
		quizScore: { type: Number, default: 0 },
	},
	{ _id: false }
);

const assessmentAttemptSchema = new mongoose.Schema(
	{
		attemptNumber: { type: Number, required: true },
		score: { type: Number, required: true },
		passed: { type: Boolean, required: true },
		attemptedAt: { type: Date, default: Date.now },
		answers: [{ questionId: String, selectedIndex: Number, correct: Boolean }],
	},
	{ _id: false }
);

const enrollmentSchema = new mongoose.Schema(
	{
		student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
		progress: { type: Number, default: 0 }, // Overall progress percentage
		progressDetails: [progressSchema], // Detailed progress per module/video
		isCompleted: { type: Boolean, default: false },
		certificateId: { type: String },
		enrolledAt: { type: Date, default: Date.now },
		completedLessons: [{ type: String }], // Array of completed lesson IDs
		assessmentAttempts: [assessmentAttemptSchema], // Assessment attempts
		assessmentPassed: { type: Boolean, default: false },
		certificateEligible: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);
