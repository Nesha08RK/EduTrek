import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

export async function generateCertificate(req, res) {
	try {
		const { enrollmentId } = req.params;
		const userId = req.user.userId;
		
		// Find enrollment and verify ownership
		const enrollment = await Enrollment.findOne({ 
			_id: enrollmentId, 
			student: userId 
		}).populate('course', 'title instructor');
		
		if (!enrollment) {
			return res.status(404).json({ message: 'Enrollment not found' });
		}
		
		// Check if student is eligible for certificate
		if (!enrollment.certificateEligible) {
			return res.status(400).json({ 
				message: 'Not eligible for certificate. Complete the course and pass the assessment.' 
			});
		}
		
		// Generate certificate ID if not exists
		if (!enrollment.certificateId) {
			enrollment.certificateId = uuidv4();
			await enrollment.save();
		}
		
		const certificateId = enrollment.certificateId;
		const qrData = JSON.stringify({
			certificateId,
			enrollmentId: enrollment._id,
			courseId: enrollment.course._id,
			studentId: userId,
			issuedAt: new Date().toISOString(),
			courseTitle: enrollment.course.title
		});
		
		const qrCode = await QRCode.toDataURL(qrData);
		
		res.json({
			certificateId,
			qrCode,
			courseTitle: enrollment.course.title,
			issuedAt: new Date(),
			valid: true,
			downloadUrl: `/api/certificates/${certificateId}/download`
		});
	} catch (e) {
		console.error('Certificate generation error:', e);
		res.status(500).json({ message: 'Certificate generation failed' });
	}
}

export async function downloadCertificate(req, res) {
	try {
		const { certificateId } = req.params;
		
		// Find enrollment by certificate ID
		const enrollment = await Enrollment.findOne({ 
			certificateId 
		}).populate('student', 'name email').populate('course', 'title instructor');
		
		if (!enrollment) {
			return res.status(404).json({ message: 'Certificate not found' });
		}
		
		// Generate certificate PDF data (simplified version)
		const certificateData = {
			certificateId: enrollment.certificateId,
			studentName: enrollment.student.name,
			courseTitle: enrollment.course.title,
			issuedAt: enrollment.updatedAt,
			valid: true
		};
		
		// In a real application, you would generate a PDF here
		// For now, we'll return the certificate data
		res.json({
			message: 'Certificate data ready for download',
			certificate: certificateData,
			downloadUrl: `/api/certificates/${certificateId}/pdf`
		});
	} catch (e) {
		console.error('Certificate download error:', e);
		res.status(500).json({ message: 'Certificate download failed' });
	}
}

export async function validateCertificate(req, res) {
	try {
		const { certificateId } = req.params;
		
		const enrollment = await Enrollment.findOne({ 
			certificateId 
		}).populate('student', 'name email').populate('course', 'title instructor');
		
		if (!enrollment) {
			return res.status(404).json({ 
				valid: false,
				message: 'Certificate not found' 
			});
		}
		
		res.json({
			valid: true,
			certificateId,
			studentName: enrollment.student.name,
			courseTitle: enrollment.course.title,
			issuedAt: enrollment.updatedAt,
			message: 'Certificate is valid'
		});
	} catch (e) {
		console.error('Certificate validation error:', e);
		res.status(500).json({ message: 'Validation failed' });
	}
}
