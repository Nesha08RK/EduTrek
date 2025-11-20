import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';

export default function CourseCertificate({ courseId: propCourseId, userName }) {
  const { courseId: paramCourseId } = useParams();
  const courseId = propCourseId || paramCourseId;
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollmentId, setEnrollmentId] = useState(null);

  useEffect(() => {
    fetchEnrollmentData();
  }, [courseId]);

  const fetchEnrollmentData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/courses/me/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch enrollment data');
      }

      const data = await response.json();
      // server returns { progress: [ { enrollmentId, courseId, ... } ] }
      const enrollment = (data.progress || []).find((e) => String(e.courseId) === String(courseId));

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      setEnrollmentId(enrollment.enrollmentId);

      if (enrollment.certificateEligible) {
        await generateCertificate(enrollment.enrollmentId);
      } else {
        setError('You are not eligible for a certificate. Complete the course and pass the assessment.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async (enrollmentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/certificates/enrollment/${enrollmentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate certificate');
      }

      const data = await response.json();
      setCertificate(data.certificate || data); // handle either structure
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadCertificate = async () => {
    if (!certificate) return;

    try {
      const certificateHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Certificate of Completion</title>
          <style>
            @page { size: A4; margin: 25mm; }
            body { font-family: 'Georgia', serif; background: #f4f1e9; margin: 0; }
            .frame { max-width: 900px; margin: 0 auto; background: #fff; border: 10px solid #b8860b; box-shadow: 0 6px 18px rgba(0,0,0,0.15); }
            .inner { border: 4px solid #d4af37; padding: 40px 50px; text-align: center; }
            .brand { color: #b8860b; font-size: 24px; letter-spacing: 4px; font-weight: 700; }
            .title { font-size: 40px; color: #2b2b2b; margin: 18px 0 8px; font-weight: 700; }
            .line { width: 120px; height: 3px; background: #d4af37; margin: 12px auto 24px; }
            .sub { font-size: 18px; color: #555; }
            .name { font-size: 32px; font-weight: 700; color: #1f2937; margin: 16px 0; }
            .desc { font-size: 18px; color: #374151; margin-bottom: 8px; }
            .course { font-size: 24px; font-weight: 700; color: #111827; }
            .meta { display: flex; justify-content: space-between; align-items: center; margin-top: 36px; }
            .left, .right { text-align: left; font-size: 14px; color: #4b5563; }
            .sign { text-align: center; }
            .sign-line { border-top: 1px solid #9ca3af; width: 220px; margin: 4px auto 0; }
            .qr { width: 120px; height: 120px; border: 1px solid #ddd; }
            .id { font-size: 12px; color: #6b7280; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="frame">
            <div class="inner">
              <div class="brand">EDUTREK</div>
              <div class="title">Certificate of Completion</div>
              <div class="line"></div>
              <div class="sub">This certifies that</div>
              <div class="name">${userName || user?.name || user?.email || 'Student'}</div>
              <div class="desc">has successfully completed the course</div>
              <div class="course">${certificate.courseTitle || certificate.courseName}</div>
              <div class="meta">
                <div class="left">
                  <div>Issued on: ${new Date(certificate.issuedAt).toLocaleDateString()}</div>
                  <div>Certificate ID: ${certificate.certificateId}</div>
                </div>
                <div class="sign">
                  <div>Authorized Signatory</div>
                  <div class="sign-line"></div>
                </div>
                <div class="right">
                  ${certificate.qrCode ? `<img class="qr" src="${certificate.qrCode}" alt="QR" />` : ''}
                </div>
              </div>
              <div class="id">Verify online using the QR code or Certificate ID</div>
            </div>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([certificateHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(certificate.courseTitle || certificate.courseName || 'Course').replace(/\s+/g, '_')}_Certificate.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download certificate: ' + err.message);
    }
  };

  // ------------------- UI States -------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-800">Generating certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Certificate Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Certificate Not Available</h2>
          <p className="text-gray-600 mb-4">
            Complete the course and pass the assessment to earn your certificate.
          </p>
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  // ------------------- Main Certificate UI -------------------

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Certificate Preview */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-600 mb-4">🎓 Certificate of Completion</div>
            <div className="text-gray-600 text-lg mb-6">This certifies that</div>
            <div className="text-3xl font-bold text-gray-900 mb-6">{userName || user?.name || 'Student'}</div>
            <div className="text-gray-600 text-lg mb-6">has successfully completed the course</div>
            <div className="text-2xl font-semibold text-gray-800 mb-8">
              {certificate.courseTitle || certificate.courseName}
            </div>
            <div className="text-gray-600 mb-8">
              Issued on: {new Date(certificate.issuedAt).toLocaleString()}
            </div>

            {/* QR Code */}
            {certificate.qrCode && (
              <div className="flex justify-center mb-6">
                <img
                  src={certificate.qrCode}
                  alt="Certificate QR Code"
                  className="w-32 h-32"
                />
              </div>
            )}

            <div className="text-sm text-gray-500">
              Certificate ID: {certificate.certificateId}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-x-4">
          <button
            onClick={downloadCertificate}
            className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition"
          >
            📥 Download Certificate
          </button>
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition"
          >
            Back to Course
          </button>
        </div>

        {/* Verification Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Certificate Verification</h3>
          <p className="text-blue-800 text-sm">
            This certificate can be verified online using the QR code or certificate ID.
            It is digitally signed and tamper-proof.
          </p>
        </div>
      </div>
    </div>
  );
}
