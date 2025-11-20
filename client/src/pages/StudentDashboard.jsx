import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user, token, enrollmentRefreshTrigger, authFetch, refreshUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [removingCourseId, setRemovingCourseId] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', degree: user?.degree || '', avatarData: null });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      degree: user?.degree || '',
      avatarData: null
    });
    setAvatarPreview(user?.avatarUrl || '');
  }, [user]);

  useEffect(() => {
    if (token) loadCourses();
  }, [token, enrollmentRefreshTrigger]);

  const handleAvatarFileChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm((prev) => ({ ...prev, avatarData: reader.result }));
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // (no live-status polling — show enrolled courses as before)

  // ---------------- LOAD COURSES ----------------
  const loadCourses = async () => {
    setLoading(true);
    try {
      const enrolled = await fetchEnrolledCourses();
      await fetchAvailableCourses(enrolled);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FETCH ENROLLED ----------------
  const fetchEnrolledCourses = async () => {
    if (!token) return [];
    try {
      const res = await fetch(`${API_BASE}/api/courses/me/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || 'Failed to fetch enrolled courses');
        return [];
      }

      const data = await res.json();
      const normalized = (data.progress || []).map(e => ({
        _id: e.courseId,
        title: e.title,
        progress: e.progress || 0,
        isCompleted: e.isCompleted || false,
        image:
          e.image ||
          e.thumbnailUrl ||
          `https://via.placeholder.com/300x180/3B82F6/FFFFFF?text=${encodeURIComponent(e.title)}`
      }));

      console.log('Enrolled courses:', normalized);
      setCourses(normalized);
      return normalized;
    } catch (err) {
      console.error(err);
      setError('Network error while fetching enrolled courses');
      return [];
    }
  };

  // ---------------- FETCH AVAILABLE ----------------
  const fetchAvailableCourses = async (enrolledCourses = []) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const enrolledIds = enrolledCourses.map(c => c._id);
      const available = (data.courses || [])
        .map(c => ({ ...c, _id: c._id || c.id }))
        .filter(c => !enrolledIds.includes(c._id) && c.status === 'published');
      setAvailableCourses(available);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- ENROLL ----------------
  const enrollInCourse = async (courseId) => {
    if (!token || !courseId) return;
    try {
      setEnrollingCourseId(courseId);
      const res = await fetch(`${API_BASE}/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to enroll');
        return;
      }

      const enrolledCourse = availableCourses.find(c => c._id === courseId);
      if (enrolledCourse) {
        setCourses(prev => [...prev, { ...enrolledCourse, progress: 0 }]);
        setAvailableCourses(prev => prev.filter(c => c._id !== courseId));
      }
    } catch (err) {
      console.error(err);
      setError('Network error while enrolling');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // ---------------- UNENROLL ----------------
  const removeCourse = async (courseId) => {
    if (!token || !courseId) return;
    const confirmRemove = window.confirm('Are you sure you want to remove this course?');
    if (!confirmRemove) return;

    try {
      setRemovingCourseId(courseId);
      const res = await fetch(`${API_BASE}/api/courses/${courseId}/unenroll`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to remove course');
        return;
      }

      setCourses(prev => prev.filter(c => c._id !== courseId));
      const removedCourse = courses.find(c => c._id === courseId);
      if (removedCourse) setAvailableCourses(prev => [...prev, removedCourse]);
    } catch (err) {
      console.error(err);
      setError('Network error while removing course');
    } finally {
      setRemovingCourseId(null);
    }
  };

  // ---------------- RENDER ----------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading your courses...</p>
        </div>
      </div>
    );
  }

  const studentAvatar = user?.avatarUrl;
  const studentInitials =
    (user?.name || 'S')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'S';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <div className="text-right">
            <p className="text-gray-800">Welcome back, {user?.name}!</p>
            
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-cyan-100 text-cyan-700 flex items-center justify-center text-2xl font-semibold">
              {studentAvatar ? (
                <img src={studentAvatar} alt={`${user?.name || 'Student'} avatar`} className="w-full h-full object-cover" />
              ) : (
                studentInitials
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-cyan-600 font-semibold">Student Profile</p>
              <h2 className="text-2xl font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-600">
                Email: <span className="text-gray-800 font-medium">{user?.email}</span>
              </p>
              <p className="text-sm text-gray-600">
                Degree / Specialization:{' '}
                <span className="text-gray-800 font-medium">{user?.degree || 'Add your academic details'}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-100 rounded-lg p-4 text-center">
              <p className="text-2xl font-semibold text-gray-900">{courses.length}</p>
              <p className="text-xs uppercase text-slate-600 tracking-wide">Enrolled Courses</p>
            </div>
            <div className="bg-slate-100 rounded-lg p-4 text-center">
              <p className="text-2xl font-semibold text-gray-900">{courses.filter(c => c.isCompleted).length}</p>
              <p className="text-xs uppercase text-slate-600 tracking-wide">Completed</p>
            </div>
            <div className="bg-slate-100 rounded-lg p-4 text-center">
              <p className="text-2xl font-semibold text-gray-900">{user?.points || 10}</p>
              <p className="text-xs uppercase text-slate-600 tracking-wide">Points</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowProfileEditor(prev => !prev)}
              className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition"
            >
              {showProfileEditor ? 'Hide Profile' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* ---------------- PROFILE EDIT ---------------- */}
        {showProfileEditor && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Profile</h2>
          {profileMessage && (
            <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{profileMessage}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Profile Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleAvatarFileChange(e.target.files?.[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              />
              {avatarPreview && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={avatarPreview} alt="Profile preview" className="h-16 w-16 rounded-full object-cover border" />
                  <p className="text-xs text-gray-500">Preview</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">Upload JPG or PNG up to 2MB.</p>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm text-gray-700 mb-1">Degree / Specialization</label>
              <input
                type="text"
                value={profileForm.degree}
                onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g., B.Tech in Computer Science"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={async () => {
                try {
                  setProfileSaving(true);
                  setProfileMessage(null);
                  const payload = { name: profileForm.name, degree: profileForm.degree };
                  if (profileForm.avatarData) payload.avatarData = profileForm.avatarData;
                  const res = await authFetch(`${API_BASE}/api/auth/me`, { method: 'PUT', body: JSON.stringify(payload) });
                  const data = await res.json();
                  if (!res.ok) { setError(data.message || 'Failed to update profile'); return; }
                  setProfileMessage('Profile updated');
                  setProfileForm((prev) => ({ ...prev, avatarData: null }));
                  await refreshUser();
                } catch (e) { setError('Network error while updating profile'); }
                finally { setProfileSaving(false); }
              }}
              disabled={profileSaving}
              className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 disabled:bg-gray-400"
            >
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* ---------------- MY COURSES ---------------- */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">My Courses</h2>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div
                  key={course._id}
                  className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={
                        course.image ||
                        course.thumbnailUrl ||
                        `https://via.placeholder.com/300x180/3B82F6/FFFFFF?text=${encodeURIComponent(course.title)}`
                      }
                      alt={course.title}
                      className="w-full h-40 object-cover"
                    />
                    {course.isCompleted && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Completed
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">{course.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{course.category || 'General'}</p>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700 font-medium">{course.progress}% Complete</span>
                        {course.isCompleted && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">✓ Completed</span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${course.isCompleted ? 'bg-green-500' : 'bg-cyan-500'}`}
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {course.progress > 0 && course.progress < 100 && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        📚 Keep watching to unlock assessment
                      </div>
                    )}
                    
                    {course.progress === 100 && !course.isCompleted && (
                      <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                        ✓ All videos watched! Ready to take assessment.
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4">
                      <Link
                        to={`/course/${course._id}`}
                        className="bg-cyan-500 text-white text-xs px-3 py-1.5 rounded hover:bg-cyan-600 transition"
                      >
                        Continue
                      </Link>
                      <button
                        onClick={() => removeCourse(course._id)}
                        disabled={removingCourseId === course._id}
                        className="text-red-600 hover:text-red-700 text-xs font-medium"
                      >
                        {removingCourseId === course._id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-medium mb-2 text-gray-900">No courses yet</h3>
              <p className="text-gray-800 mb-6">You haven't enrolled in any courses yet.</p>
              <Link
                to="/courses"
                className="bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600 transition"
              >
                Browse Courses
              </Link>
            </div>
          )}
        </div>

        {/* ---------------- AVAILABLE COURSES ---------------- */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Available Courses</h2>
          {availableCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map(course => (
                <div
                  key={course._id}
                  className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden"
                >
                  <img
                    src={
                      course.image ||
                      course.thumbnailUrl ||
                      `https://via.placeholder.com/300x180/3B82F6/FFFFFF?text=${encodeURIComponent(course.title)}`
                    }
                    alt={course.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{course.title}</h3>
                    <p className="text-xs text-gray-700 mt-1">
                      {course.description?.substring(0, 80)}...
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Instructor: {course.instructor?.name || 'Unknown'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {course.instructor?.degree ? `Degree: ${course.instructor.degree}` : 'Degree info unavailable'}
                    </p>
                    <div className="mt-3 flex justify-between items-center">
                      <button
                        onClick={() => enrollInCourse(course._id)}
                        disabled={enrollingCourseId === course._id}
                        className="bg-cyan-500 text-white text-xs px-3 py-1.5 rounded hover:bg-cyan-600 disabled:bg-cyan-300"
                      >
                        {enrollingCourseId === course._id ? 'Enrolling...' : 'Enroll'}
                      </button>
                      <Link
                        to={`/course/${course._id}`}
                        className="text-cyan-600 hover:text-cyan-700 text-xs font-medium"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded shadow text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-medium mb-2 text-gray-900">No courses available</h3>
              <p className="text-gray-700">Check back later for new courses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
