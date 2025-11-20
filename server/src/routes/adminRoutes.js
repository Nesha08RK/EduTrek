import { Router } from 'express';
import { 
	getAllUsers, 
	getAllCourses, 
	updateUser, 
	deleteUser, 
	updateCourse, 
	deleteCourse, 
	getDashboardStats 
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireRole(['admin']));

// Dashboard stats
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

// Course management
router.get('/courses', getAllCourses);
router.put('/courses/:courseId', updateCourse);
router.delete('/courses/:courseId', deleteCourse);

export default router;
