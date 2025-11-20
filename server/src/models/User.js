import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true, index: true },
		password: { type: String, required: true },
		role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
		avatarUrl: { type: String },
		degree: { type: String, default: '' },
		badges: [{ type: String }],
		points: { type: Number, default: 0 },
		enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }], // <--- added
	},
	{ timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
	if (!this.isModified('password')) return next();
	this.password = await bcrypt.hash(this.password, 10);
	next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
	return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
