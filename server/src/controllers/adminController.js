import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

export async function getAllUsers(req, res) {
	try {
		const users = await User.find({})
			.select('-password')
			.sort({ createdAt: -1 });

		const usersWithStats = await Promise.all(
			users.map(async (user) => {
				const enrollmentCount = await Enrollment.countDocuments({ student: user._id });
				const courseCount = await Course.countDocuments({ instructor: user._id });
				
				return {
					id: user._id,
					name: user.name,
					email: user.email,
					role: user.role,
					status: user.status || 'active',
					joined: user.createdAt,
					enrollmentCount,
					courseCount
				};
			})
		);

		res.json({ users: usersWithStats });
	} catch (error) {
		console.error('Get users error:', error);
		res.status(500).json({ message: 'Failed to fetch users' });
	}
}

export async function getAllCourses(req, res) {
	try {
		const courses = await Course.find({})
			.populate('instructor', 'name email')
			.sort({ createdAt: -1 });

		const coursesWithStats = await Promise.all(
			courses.map(async (course) => {
				const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
				const revenue = enrollmentCount * course.price;
				
				return {
					id: course._id,
					title: course.title,
					instructor: course.instructor.name,
					status: course.status,
					students: enrollmentCount,
					revenue: revenue,
					createdAt: course.createdAt
				};
			})
		);

		res.json({ courses: coursesWithStats });
	} catch (error) {
		console.error('Get courses error:', error);
		res.status(500).json({ message: 'Failed to fetch courses' });
	}
}

export async function updateUser(req, res) {
	try {
		const { userId } = req.params;
		const { role, status } = req.body;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ role, status },
			{ new: true }
		).select('-password');

		res.json({
			message: 'User updated successfully',
			user: updatedUser
		});
	} catch (error) {
		console.error('Update user error:', error);
		res.status(500).json({ message: 'Failed to update user' });
	}
}

export async function deleteUser(req, res) {
	try {
		const { userId } = req.params;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Don't allow admin to delete themselves
		if (userId === req.user.userId) {
			return res.status(400).json({ message: 'Cannot delete your own account' });
		}

		await User.findByIdAndDelete(userId);

		res.json({ message: 'User deleted successfully' });
	} catch (error) {
		console.error('Delete user error:', error);
		res.status(500).json({ message: 'Failed to delete user' });
	}
}

export async function updateCourse(req, res) {
	try {
		const { courseId } = req.params;
		const { status } = req.body;

		const course = await Course.findById(courseId);
		if (!course) {
			return res.status(404).json({ message: 'Course not found' });
		}

		const updatedCourse = await Course.findByIdAndUpdate(
			courseId,
			{ status },
			{ new: true }
		);

		res.json({
			message: 'Course updated successfully',
			course: updatedCourse
		});
	} catch (error) {
		console.error('Update course error:', error);
		res.status(500).json({ message: 'Failed to update course' });
	}
}

export async function deleteCourse(req, res) {
	try {
		const { courseId } = req.params;

		const course = await Course.findById(courseId);
		if (!course) {
			return res.status(404).json({ message: 'Course not found' });
		}

		await Course.findByIdAndDelete(courseId);

		res.json({ message: 'Course deleted successfully' });
	} catch (error) {
		console.error('Delete course error:', error);
		res.status(500).json({ message: 'Failed to delete course' });
	}
}

export async function getDashboardStats(req, res) {
	try {
		const totalUsers = await User.countDocuments();
		const totalCourses = await Course.countDocuments();
		const totalEnrollments = await Enrollment.countDocuments();
		
		// Calculate total revenue
		const enrollments = await Enrollment.find({}).populate('course', 'price');
		const totalRevenue = enrollments.reduce((sum, enrollment) => {
			return sum + (enrollment.course?.price || 0);
		}, 0);

		// Get recent activity
		const recentUsers = await User.find({})
			.select('name email role createdAt')
			.sort({ createdAt: -1 })
			.limit(5);

		const recentCourses = await Course.find({})
			.populate('instructor', 'name')
			.select('title instructor status createdAt')
			.sort({ createdAt: -1 })
			.limit(5);

		res.json({
			stats: {
				totalUsers,
				totalCourses,
				totalEnrollments,
				totalRevenue
			},
			recentUsers,
			recentCourses
		});
	} catch (error) {
		console.error('Get dashboard stats error:', error);
		res.status(500).json({ message: 'Failed to fetch dashboard stats' });
	}
}
