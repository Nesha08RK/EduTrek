import { Router } from 'express';
import * as courseController from '../controllers/courseController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const uploadsDir = path.join(path.resolve(), 'uploads');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '-'));
	}
});

const upload = multer({ storage });

const router = Router();

// -------------------- PUBLIC --------------------
router.get('/', courseController.getAllCourses);
router.get('/search', courseController.searchCourses);
router.get('/:id', courseController.getCourseById);

// -------------------- STUDENT --------------------
router.post('/:courseId/enroll', requireAuth, requireRole('student'), courseController.enrollInCourse);
router.delete('/:courseId/unenroll', requireAuth, requireRole('student'), courseController.unenrollFromCourse);
router.get('/me/progress', requireAuth, requireRole('student'), courseController.getStudentProgress);
router.put('/:courseId/progress', requireAuth, requireRole('student'), courseController.updateStudentProgress);
router.put('/:courseId/video-progress', requireAuth, requireRole('student'), courseController.trackVideoCompletion);
router.get('/:courseId/assessment', requireAuth, courseController.getCourseAssessment);
router.post('/:courseId/assessment/submit', requireAuth, requireRole('student'), courseController.submitCourseAssessment);

// -------------------- INSTRUCTOR / ADMIN --------------------
router.post('/', requireAuth, requireRole('instructor', 'admin'), upload.single('image'), courseController.createCourse);
router.put('/:id', requireAuth, requireRole('instructor', 'admin'), upload.single('image'), courseController.updateCourse);
router.delete('/:id', requireAuth, requireRole('instructor', 'admin'), courseController.deleteCourse);

router.post('/:courseId/modules', requireAuth, requireRole('instructor', 'admin'), courseController.createModule);
router.post('/:courseId/modules/:moduleIndex/videos', requireAuth, requireRole('instructor', 'admin'), courseController.addVideoToModule);
router.delete('/:courseId/modules/:moduleIndex/videos/:videoIndex', requireAuth, requireRole('instructor', 'admin'), courseController.deleteVideo);
router.put('/:courseId/modules/:moduleIndex/videos/:videoIndex', requireAuth, requireRole('instructor', 'admin'), courseController.updateVideoInModule);
router.post('/:courseId/assessment', requireAuth, requireRole('instructor', 'admin'), courseController.createOrUpdateAssessment);
// Live session control (instructor) and status (public for enrolled students)
router.post('/:courseId/live/start', requireAuth, requireRole('instructor', 'admin'), courseController.startLiveSession);
router.post('/:courseId/live/stop', requireAuth, requireRole('instructor', 'admin'), courseController.stopLiveSession);
router.get('/:courseId/live/status', requireAuth, courseController.getLiveStatus);

router.get('/instructor/courses', requireAuth, requireRole('instructor', 'admin'), courseController.getInstructorCourses);
router.get('/:courseId/students', requireAuth, requireRole('instructor', 'admin'), courseController.getEnrolledStudents);

// -------------------- LEGACY (for compatibility) --------------------
router.get('/list', courseController.listCourses);
router.post('/:courseId/enroll-legacy', requireAuth, courseController.enroll);
router.get('/me/progress-legacy', requireAuth, courseController.myProgress);

export default router;
