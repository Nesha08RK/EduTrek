import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

// Helper: generate course image
function getCourseImage(category) {
    const images = {
        programming: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop&q=80',
        webdevelopment: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=200&fit=crop&q=80',
        design: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=300&h=200&fit=crop&q=80',
        marketing: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop&q=80',
        cybersecurity: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=300&h=200&fit=crop&q=80',
        'data-science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop&q=80',
        mobile: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=200&fit=crop&q=80',
        general: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop&q=80'
    };
    return images[category?.toLowerCase()] || images.general;
}

// Format course for frontend
function formatCourse(course) {
    // Normalize category: 'design' should be 'webdevelopment' for consistency
    let category = course.category;
    if (category && category.toLowerCase() === 'design') {
        category = 'webdevelopment';
    }
    
        return {
        id: course._id,
        _id: course._id,
        title: course.title,
        description: course.description,
        price: course.price,
        category: category,
        requirements: course.requirements || [],
        curriculum: course.curriculum || '',
        status: course.isPublished ? 'published' : 'draft',
        studentsEnrolled: course.studentsEnrolled || 0,
        modules: course.modules || [],
        instructor: course.instructor,
        thumbnailUrl: course.thumbnailUrl || course.image || getCourseImage(category),
        image: course.image || course.thumbnailUrl || getCourseImage(category),
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        hasAssessment: !!course.assessment
    };
}

// -------------------- COURSES --------------------
export async function getAllCourses(req, res) {
    try {
        const courses = await Course.find({ isPublished: true }).populate('instructor', 'name email avatarUrl degree').select('-__v');
        res.json({ courses: courses.map(formatCourse) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch courses' });
    }
}

export async function getCourseById(req, res) {
    try {
        const id = req.params.id;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid course id' });
        }

        const course = await Course.findById(id).populate('instructor', 'name email avatarUrl degree').select('-__v');
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json({ course: formatCourse(course) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch course' });
    }
}

export async function createCourse(req, res) {
    try {
        const { title, description, category, requirements, curriculum, price } = req.body;
        if (!title || !description) return res.status(400).json({ message: 'Title and description are required' });

        let parsedRequirements = [];
        try { parsedRequirements = requirements ? JSON.parse(requirements) : []; } catch (err) { parsedRequirements = [] }

        const courseData = {
            title,
            description,
            price: price ? Number(price) : 0,
            category: category || 'General',
            requirements: parsedRequirements,
            curriculum: curriculum || '',
            instructor: req.user.userId,
            isPublished: true,
            studentsEnrolled: 0,
            modules: [],
            assessment: null
        };

        // If an image was uploaded, attach accessible URL
        if (req.file) {
            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            courseData.image = imageUrl;
            courseData.thumbnailUrl = imageUrl;
        } else if (req.body && req.body.imageUrl) {
            // Allow instructors to provide an external image URL instead of uploading
            const providedUrl = req.body.imageUrl;
            if (typeof providedUrl === 'string' && providedUrl.trim()) {
                courseData.image = providedUrl.trim();
                courseData.thumbnailUrl = providedUrl.trim();
            }
        }

        const course = new Course(courseData);

        await course.save();
        const populatedCourse = await Course.findById(course._id).populate('instructor', 'name email avatarUrl degree');
        res.status(201).json({ message: 'Course created', course: formatCourse(populatedCourse) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create course' });
    }
}

export async function updateCourse(req, res) {
    try {
        // Build update object (handle form-data and optional file)
        const updateData = { ...req.body };
        if (updateData.requirements && typeof updateData.requirements === 'string') {
            try { updateData.requirements = JSON.parse(updateData.requirements); } catch (e) { /* leave as string */ }
        }
        if (req.file) {
            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            updateData.image = imageUrl;
            updateData.thumbnailUrl = imageUrl;
        } else if (updateData.imageUrl) {
            const providedUrl = updateData.imageUrl;
            if (typeof providedUrl === 'string' && providedUrl.trim()) {
                updateData.image = providedUrl.trim();
                updateData.thumbnailUrl = providedUrl.trim();
            }
        }

        const courseId = req.params.id;
        if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid course id' });
        }

        const course = await Course.findOneAndUpdate(
            { _id: courseId, instructor: req.user.userId },
            updateData,
            { new: true }
        );
        if (!course) return res.status(404).json({ message: 'Course not found or not owned by you' });
        res.json({ message: 'Course updated', course: formatCourse(course) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update course' });
    }
}

export async function deleteCourse(req, res) {
    try {
        const courseId = req.params.id;
        if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid course id' });
        }
        const course = await Course.findOneAndDelete({ _id: courseId, instructor: req.user.userId });
        if (!course) return res.status(404).json({ message: 'Course not found or not owned by you' });

        // Remove any enrollments tied to this course to avoid stale references
        try {
            await Enrollment.deleteMany({ course: courseId });
            console.log(`Deleted enrollments for removed course ${courseId}`);
        } catch (e) {
            console.error(`Failed to delete enrollments for course ${courseId}:`, e);
        }

        res.json({ message: 'Course deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete course' });
    }
}

export async function updateVideoInModule(req, res) {
    try {
        const { courseId, moduleIndex, videoIndex } = req.params;
        const mIdx = Number(moduleIndex);
        const vIdx = Number(videoIndex);
        const { title, url, description, durationSec } = req.body;

        if (isNaN(mIdx) || isNaN(vIdx)) return res.status(400).json({ message: 'Invalid module/video index' });

        const course = await Course.findOne({ _id: courseId, instructor: req.user.userId });
        if (!course) return res.status(404).json({ message: 'Course not found or not owned by you' });
        if (!course.modules || course.modules.length <= mIdx) return res.status(400).json({ message: 'Module not found' });
        if (!course.modules[mIdx].videos || course.modules[mIdx].videos.length <= vIdx) return res.status(400).json({ message: 'Video not found' });

        const videoObj = course.modules[mIdx].videos[vIdx];
        if (title) videoObj.title = title;
        if (url) videoObj.url = url;
        if (description !== undefined) videoObj.description = description;
        if (durationSec !== undefined) videoObj.durationSec = durationSec ? Number(durationSec) : videoObj.durationSec;

        // Save and return updated module
        await course.save();
        res.json({ message: 'Video updated', video: course.modules[mIdx].videos[vIdx] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update video' });
    }
}

// -------------------- ENROLLMENT --------------------
export async function enrollInCourse(req, res) {
    try {
        const { courseId } = req.params;
        const userId = req.user.userId;

        const existing = await Enrollment.findOne({ student: userId, course: courseId });
        if (existing) {
            console.log(`Student ${userId} already enrolled in course ${courseId}`);
            return res.status(400).json({ message: 'Already enrolled' });
        }

        const enrollment = new Enrollment({
            student: userId,
            course: courseId,
            progress: 0,
            completedLessons: [],
            isCompleted: false
        });
        await enrollment.save();
        console.log(`Student ${userId} enrolled in course ${courseId}`);
        await Course.findByIdAndUpdate(courseId, { $inc: { studentsEnrolled: 1 } });

        res.status(201).json({ message: 'Enrolled successfully', enrollment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to enroll' });
    }
}

export async function unenrollFromCourse(req, res) {
    try {
        const { courseId } = req.params;
        const userId = req.user.userId;

        const enrollment = await Enrollment.findOneAndDelete({ student: userId, course: courseId });
        if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

        await Course.findByIdAndUpdate(courseId, { $inc: { studentsEnrolled: -1 } });
        res.status(200).json({ message: 'Successfully unenrolled from course' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to unenroll from course' });
    }
}

export async function getStudentProgress(req, res) {
    try {
        const enrollments = await Enrollment.find({ student: req.user.userId }).populate('course');
        // Some enrollments may reference courses that were removed -> e.course can be null.
        // Filter out those to avoid attempting to read properties of null.
        const validEnrollments = enrollments.filter(e => e && e.course);
        const skipped = enrollments.length - validEnrollments.length;
        if (skipped > 0) console.warn(`getStudentProgress: skipped ${skipped} enrollment(s) with missing course references for user ${req.user.userId}`);

        const progress = validEnrollments.map(e => ({
            enrollmentId: e._id,
            courseId: e.course._id,
            title: e.course.title,
            progress: e.progress,
            isCompleted: e.isCompleted,
            certificateEligible: !!e.certificateEligible,
            category: e.course.category,
            thumbnailUrl: e.course.thumbnailUrl || e.course.image || undefined,
            image: e.course.image || e.course.thumbnailUrl || undefined
        }));
        console.log('Student progress response:', progress);
        res.json({ progress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get progress' });
    }
}

export async function updateStudentProgress(req, res) {
    try {
        const { courseId } = req.params;
        const { lessonId, progress } = req.body;

        const enrollment = await Enrollment.findOne({ student: req.user.userId, course: courseId });
        if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

        enrollment.progress = Math.min(progress || enrollment.progress, 100);
        if (lessonId && !enrollment.completedLessons.includes(lessonId)) {
            enrollment.completedLessons.push(lessonId);
        }
        if (enrollment.progress >= 100) enrollment.isCompleted = true;

        await enrollment.save();
        res.json({ message: 'Progress updated', progress: enrollment.progress, isCompleted: enrollment.isCompleted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update progress' });
    }
}

// Track video completion for enrollment
export async function trackVideoCompletion(req, res) {
    try {
        const { courseId } = req.params;
        const { moduleIndex, videoIndex, watchTime, completedAt } = req.body;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const enrollment = await Enrollment.findOne({ student: req.user.userId, course: courseId });
        if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

        // Create a unique key for this video
        const videoKey = `${moduleIndex}-${videoIndex}`;
        
        // Track video completion
        if (!enrollment.completedLessons.includes(videoKey)) {
            enrollment.completedLessons.push(videoKey);
        }

        // Calculate overall progress based on total videos
        const totalVideos = course.modules.reduce((sum, m) => sum + (m.videos?.length || 0), 0);
        const completedVideos = enrollment.completedLessons.filter(key => {
            const [mIdx, vIdx] = key.split('-').map(Number);
            return !isNaN(mIdx) && !isNaN(vIdx);
        }).length;

        enrollment.progress = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

        // Check if all videos are completed - enable assessment
        if (completedVideos === totalVideos) {
            enrollment.progress = 100;
        }

        await enrollment.save();

        // return the completed lesson keys so the client can persist UI state
        const completedLessonKeys = Array.isArray(enrollment.completedLessons) ? enrollment.completedLessons : [];

        res.json({ 
            message: 'Video completion tracked',
            videoKey,
            progress: enrollment.progress,
            completedVideos,
            totalVideos,
            assessmentEnabled: completedVideos === totalVideos,
            completedLessons: completedLessonKeys
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to track video completion' });
    }
}

// -------------------- INSTRUCTOR --------------------
export async function getInstructorCourses(req, res) {
    try {
        const courses = await Course.find({ instructor: req.user.userId }).select('-__v');
        const courseIds = courses.map(c => c._id);
        let assessmentStatsMap = {};

        if (courseIds.length > 0) {
            const stats = await Enrollment.aggregate([
                { $match: { course: { $in: courseIds } } },
                {
                    $group: {
                        _id: '$course',
                        total: { $sum: 1 },
                        passed: { $sum: { $cond: ['$certificateEligible', 1, 0] } }
                    }
                }
            ]);
            assessmentStatsMap = stats.reduce((acc, stat) => {
                acc[stat._id.toString()] = { total: stat.total, passed: stat.passed };
                return acc;
            }, {});
        }

        res.json({
            courses: courses.map(c => {
                const formatted = { ...formatCourse(c), assessment: c.assessment };
                formatted.assessmentStats = assessmentStatsMap[c._id.toString()] || { total: 0, passed: 0 };
                return formatted;
            })
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch courses' });
    }
}

// -------------------- INSTRUCTOR: GET ENROLLED STUDENTS --------------------
export async function getEnrolledStudents(req, res) {
    try {
        const { courseId } = req.params;

        const course = await Course.findOne({ _id: courseId, instructor: req.user.userId });
        if (!course) {
            return res.status(404).json({ message: 'Course not found or not owned by you' });
        }

        const enrollments = await Enrollment.find({ course: courseId })
            .populate('student', 'name email')
            .select('progress isCompleted createdAt updatedAt');

        const students = enrollments.map(e => ({
            studentId: e.student._id,
            name: e.student.name,
            email: e.student.email,
            progress: e.progress,
            isCompleted: e.isCompleted,
            enrolledDate: e.createdAt,
            lastUpdated: e.updatedAt
        }));

        res.json({
            courseTitle: course.title,
            totalStudents: students.length,
            students
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch enrolled students' });
    }
}

// -------------------- SEARCH / LEGACY --------------------
export async function searchCourses(req, res) {
    try {
        const { q } = req.query;
        const courses = await Course.find({ title: { $regex: q || '', $options: 'i' }, isPublished: true });
        res.json({ courses: courses.map(formatCourse) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to search courses' });
    }
}

export async function listCourses(req, res) { return getAllCourses(req, res); }
export async function enroll(req, res) { return enrollInCourse(req, res); }
export async function myProgress(req, res) { return getStudentProgress(req, res); }

// -------------------- MODULES, VIDEOS, ASSESSMENTS --------------------
// Implementations follow below.

// -------------------- MODULES, VIDEOS, ASSESSMENTS (implemented) --------------------
export async function createModule(req, res) {
    try {
        const { courseId } = req.params;
        const { title } = req.body;
        const course = await Course.findOne({ _id: courseId, instructor: req.user.userId });
        if (!course) return res.status(404).json({ message: 'Course not found or not owned by you' });

        const moduleObj = { title: title || `Module ${course.modules.length + 1}`, videos: [], quizzes: [], resources: [] };
        course.modules.push(moduleObj);
        await course.save();

        res.status(201).json({ message: 'Module created', modules: course.modules });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create module' });
    }
}

export async function addVideoToModule(req, res) {
    try {
        const { courseId, moduleIndex } = req.params;
        const { title, url, description, durationSec } = req.body;
        const idx = Number(moduleIndex);

        if (isNaN(idx)) return res.status(400).json({ message: 'Invalid module index' });

        const course = await Course.findOne({ _id: courseId, instructor: req.user.userId });
        if (!course) return res.status(404).json({ message: 'Course not found or not owned by you' });
        if (!course.modules || course.modules.length <= idx) return res.status(400).json({ message: 'Module not found' });

        const videoObj = { title: title || 'Untitled Video', url, durationSec: durationSec ? Number(durationSec) : undefined };
        course.modules[idx].videos = course.modules[idx].videos || [];
        course.modules[idx].videos.push(videoObj);

        await course.save();
        res.status(201).json({ message: 'Video added', module: course.modules[idx] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add video to module' });
    }
}

export async function deleteVideo(req, res) {
    try {
        const { courseId, moduleIndex, videoIndex } = req.params;
        const mIdx = Number(moduleIndex);
        const vIdx = Number(videoIndex);

        if (isNaN(mIdx) || isNaN(vIdx)) return res.status(400).json({ message: 'Invalid indices' });

        const course = await Course.findOne({ _id: courseId, instructor: req.user.userId });
        if (!course) return res.status(404).json({ message: 'Course not found or not owned by you' });
        if (!course.modules || course.modules.length <= mIdx) return res.status(400).json({ message: 'Module not found' });
        if (!course.modules[mIdx].videos || course.modules[mIdx].videos.length <= vIdx) return res.status(400).json({ message: 'Video not found' });

        course.modules[mIdx].videos.splice(vIdx, 1);
        await course.save();
        res.json({ message: 'Video deleted', module: course.modules[mIdx] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete video' });
    }
}

export async function getCourseAssessment(req, res) {
    try {
        const { courseId } = req.params;
        if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid course id' });
        }

        const course = await Course.findById(courseId).populate('modules');
        if (!course) return res.status(404).json({ message: 'Course not found' });
        
        const hasAssessment = !!course.assessment;

        // Track enrollment/video completion regardless of assessment presence
        let assessmentEnabled = hasAssessment;
        let completedVideos = 0;
        let totalVideos = 0;
        let isEnrolled = false;
        let completedLessonKeys = [];

        if (req.user && req.user.userId) {
            const enrollment = await Enrollment.findOne({ student: req.user.userId, course: courseId });
            
            if (enrollment && course.modules && course.modules.length > 0) {
                isEnrolled = true;
                // Count total videos
                totalVideos = course.modules.reduce((sum, m) => sum + (m.videos?.length || 0), 0);
                
                // Count completed videos
                completedVideos = enrollment.completedLessons.filter(key => {
                    const [mIdx, vIdx] = key.split('-').map(Number);
                    return !isNaN(mIdx) && !isNaN(vIdx);
                }).length;

                // Keep the raw completed lesson keys so client can map to URLs
                completedLessonKeys = Array.isArray(enrollment.completedLessons) ? enrollment.completedLessons : [];

                // Assessment is enabled only if all videos are completed
                if (hasAssessment) {
                    assessmentEnabled = totalVideos > 0 && completedVideos === totalVideos;
                }
            }
        }

        res.json({ 
            assessment: course.assessment || null,
            assessmentEnabled: hasAssessment ? assessmentEnabled : false,
            videoProgress: {
                completed: completedVideos,
                total: totalVideos
            },
            completedLessons: completedLessonKeys || [],
            isEnrolled
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch assessment' });
    }
}

export async function submitCourseAssessment(req, res) {
    try {
        // Basic submission handling: record a student's answers and compute score
        const { courseId } = req.params;
        const { answers } = req.body; // expected: array of { selectedIndex } or plain indexes
        const course = await Course.findById(courseId).populate('modules');
        if (!course) return res.status(404).json({ message: 'Course not found' });
        if (!course.assessment || !course.assessment.questions) return res.status(400).json({ message: 'No assessment for this course' });

        // Verify all videos are watched before allowing assessment submission
        if (req.user && req.user.userId) {
            const enrollment = await Enrollment.findOne({ student: req.user.userId, course: courseId });
            if (enrollment && course.modules && course.modules.length > 0) {
                const totalVideos = course.modules.reduce((sum, m) => sum + (m.videos?.length || 0), 0);
                const completedVideos = enrollment.completedLessons.filter(key => {
                    const [mIdx, vIdx] = key.split('-').map(Number);
                    return !isNaN(mIdx) && !isNaN(vIdx);
                }).length;
                
                if (totalVideos > 0 && completedVideos < totalVideos) {
                    return res.status(403).json({ 
                        message: 'You must watch all course videos before taking the assessment.',
                        videoProgress: { completed: completedVideos, total: totalVideos }
                    });
                }
            }
        }

        const questions = course.assessment.questions || [];
        let correct = 0;
        const questionResults = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const submitted = Array.isArray(answers) ? answers[i] : null;
            const rawSelected = submitted && typeof submitted === 'object' && 'selectedIndex' in submitted ? submitted.selectedIndex : submitted;
            let rawExpected = (q.answerIndex !== undefined ? q.answerIndex : (q.correctOptionIndex !== undefined ? q.correctOptionIndex : (q.correctIndex !== undefined ? q.correctIndex : undefined)));
            if (rawExpected === undefined && submitted && typeof submitted === 'object' && 'correctIndex' in submitted) {
                rawExpected = submitted.correctIndex;
            }

            const sel = typeof rawSelected === 'string' ? parseInt(rawSelected, 10) : rawSelected;
            const exp = typeof rawExpected === 'string' ? parseInt(rawExpected, 10) : rawExpected;

            const selectedIndex = Number.isInteger(sel) ? sel : -1;
            const correctIndex = Number.isInteger(exp) ? exp : -1;
            const isCorrect = Number.isInteger(selectedIndex) && Number.isInteger(correctIndex) && selectedIndex === correctIndex;
            if (isCorrect) correct++;
            questionResults.push({
                index: i,
                question: q.question,
                options: Array.isArray(q.options) ? q.options : [],
                correctIndex,
                selectedIndex,
                correct: isCorrect
            });
        }
        const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
        const passed = score >= (course.assessment.passingScore || 70);

        // Update student enrollment progress/eligibility
        try {
            const enrollment = await Enrollment.findOne({ student: req.user.userId, course: courseId });
            if (enrollment) {
                // mark as completed if passed
                if (passed) {
                    enrollment.progress = 100;
                    enrollment.isCompleted = true;
                    enrollment.certificateEligible = true;
                }
                // store last assessment score and attempts
                enrollment.lastAssessment = enrollment.lastAssessment || {};
                enrollment.lastAssessment.score = score;
                enrollment.lastAssessment.date = new Date();
                await enrollment.save();
            }
        } catch (e) {
            console.error('Failed to update enrollment after assessment:', e);
        }

        res.json({ score, correct, total: questions.length, passed, certificateEligible: passed, questionResults });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to submit assessment' });
    }
}

// -------------------- LIVE SESSIONS (in-memory) --------------------
// Simple in-memory live session tracker. Does not persist across restarts.
const liveSessions = new Map(); // courseId -> { startedAt, instructorId }

export function startLiveSession(req, res) {
    try {
        const { courseId } = req.params;
        liveSessions.set(courseId, { startedAt: new Date(), instructor: req.user.userId });
        res.json({ message: 'Live session started', live: true });
    } catch (e) {
        console.error('startLiveSession error', e);
        res.status(500).json({ message: 'Failed to start live session' });
    }
}

export function stopLiveSession(req, res) {
    try {
        const { courseId } = req.params;
        liveSessions.delete(courseId);
        res.json({ message: 'Live session stopped', live: false });
    } catch (e) {
        console.error('stopLiveSession error', e);
        res.status(500).json({ message: 'Failed to stop live session' });
    }
}

export function getLiveStatus(req, res) {
    try {
        const { courseId } = req.params;
        const session = liveSessions.get(courseId) || null;
        res.json({ live: !!session, session });
    } catch (e) {
        console.error('getLiveStatus error', e);
        res.status(500).json({ message: 'Failed to get live status' });
    }
}

export async function createOrUpdateAssessment(req, res) {
    try {
        const { courseId } = req.params;
        const { title, description, questions, passingScore, duration, maxAttempts } = req.body;

        const course = await Course.findOne({ _id: courseId, instructor: req.user.userId });
        if (!course) return res.status(404).json({ message: 'Course not found or not owned by you' });

        const parsedQuestionsRaw = Array.isArray(questions) ? questions : (typeof questions === 'string' ? JSON.parse(questions) : []);
        const parsedQuestions = parsedQuestionsRaw.map(q => {
            const answerIndex = typeof q.answerIndex === 'number' ? q.answerIndex : (typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : undefined);
            return {
                question: q.question,
                options: Array.isArray(q.options) ? q.options : [],
                answerIndex,
                correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : (typeof answerIndex === 'number' ? answerIndex : undefined)
            };
        });

        course.assessment = {
            title: title || 'Assessment',
            description: description || '',
            questions: parsedQuestions,
            passingScore: passingScore ? Number(passingScore) : 70,
            duration: duration ? Number(duration) : undefined,
            maxAttempts: maxAttempts ? Number(maxAttempts) : 3,
        };

        await course.save();
        res.status(201).json({ message: 'Assessment created/updated', assessment: course.assessment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create/update assessment' });
    }
}

