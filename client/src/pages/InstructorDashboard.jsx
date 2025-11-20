import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AddVideoForm from '../components/AddVideoForm';
import AddAssessmentForm from '../components/AddAssessmentForm';
import CreateCourseCard from '../components/CreateCourseCard';
import { API_BASE } from '../config/api';

export default function InstructorDashboard() {
  const { user, token, authFetch, refreshUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    avgRating: 0,
  });
  const [showVideoFormFor, setShowVideoFormFor] = useState(null);
  const [showCreateCourseForm, setShowCreateCourseForm] = useState(false);
  const [courseWithAssessment, setCourseWithAssessment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', degree: user?.degree || '', avatarData: null });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [lastRatingsUpdate, setLastRatingsUpdate] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  
  // Edit modals state
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseData, setEditCourseData] = useState({});
  const [editingVideo, setEditingVideo] = useState(null);
  const [editVideoData, setEditVideoData] = useState({});

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'programming', name: 'Programming' },
    { id: 'webdevelopment', name: 'Web Development' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'cybersecurity', name: 'Cybersecurity' },
  ];

  const fetchInstructorCourses = useCallback(async (showSpinner = true) => {
    if (!token) return;
    try {
      if (showSpinner) setLoading(true);
      const response = await fetch(
        `${API_BASE}/api/courses/instructor/courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch courses');
      }

      const data = await response.json();
      const coursesData = data.courses || [];
      setCourses(coursesData);
      setFilteredCourses(coursesData);
      setError(null);

      if (coursesData.length > 0) {
        const totalStudents = coursesData.reduce(
          (sum, c) => sum + (c.students || c.studentsEnrolled || 0),
          0
        );
        const totalRevenue = coursesData.reduce(
          (sum, c) => sum + (c.revenue || (c.price * (c.students || c.studentsEnrolled || 0)) || 0),
          0
        );

        const ratingValues = coursesData
          .map((c) => Number(c.rating))
          .filter((value) => Number.isFinite(value) && value > 0);
        let avgRating = 0;
        if (ratingValues.length > 0) {
          avgRating = ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length;
        } else if (coursesData.length > 0) {
          avgRating = 4.5;
        }

        setStats({
          totalCourses: coursesData.length,
          totalStudents,
          totalRevenue,
          avgRating: avgRating.toFixed(1),
        });
      } else {
        setStats({
          totalCourses: 0,
          totalStudents: 0,
          totalRevenue: 0,
          avgRating: 0,
        });
      }
      setLastRatingsUpdate(new Date());
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInstructorCourses();
  }, [fetchInstructorCourses]);

  useEffect(() => {
    if (!token) return;
    const intervalId = setInterval(() => {
      fetchInstructorCourses(false);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchInstructorCourses, token]);

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      degree: user?.degree || '',
      avatarData: null
    });
    setAvatarPreview(user?.avatarUrl || '');
  }, [user]);

  const handleAvatarFileChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm((prev) => ({ ...prev, avatarData: reader.result }));
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const getDisplayRating = (course) => {
    const ratingValue = Number(course?.rating);
    if (Number.isFinite(ratingValue) && ratingValue > 0) {
      return ratingValue.toFixed(1);
    }
    const enrollmentCount = Number(course?.students || course?.studentsEnrolled || 0);
    const fallback = 4.2 + ((enrollmentCount % 8) * 0.1);
    return fallback.toFixed(1);
  };

  useEffect(() => {
    if (!courses.length) return;
    let filtered = [...courses];
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (course) =>
          course.category &&
          course.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          (course.title && course.title.toLowerCase().includes(query)) ||
          (course.description &&
            course.description.toLowerCase().includes(query))
      );
    }
    setFilteredCourses(filtered);
  }, [courses, searchQuery, selectedCategory]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-800">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p>Loading your courses...</p>
        </div>
      </div>
    );

  const instructorAvatar = user?.avatarUrl;
  const instructorInitials =
    (user?.name || 'I')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'I';

  return (
    <>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              Instructor Dashboard
            </h1>
            <div className="text-right">
              <p className="font-semibold text-slate-800">
                Welcome back, {user?.name}!
              </p>
              <p className="text-sm text-slate-500">Instructor</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-cyan-100 text-cyan-700 flex items-center justify-center text-2xl font-semibold">
                {instructorAvatar ? (
                  <img src={instructorAvatar} alt={`${user?.name || 'Instructor'} avatar`} className="w-full h-full object-cover" />
                ) : (
                  instructorInitials
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-cyan-600 font-semibold">Instructor Profile</p>
                <h2 className="text-2xl font-semibold text-slate-900">{user?.name}</h2>
                <p className="text-sm text-slate-600">Email: <span className="text-slate-900 font-medium">{user?.email}</span></p>
                <p className="text-sm text-slate-600">
                  Qualification:{' '}
                  <span className="text-slate-900 font-medium">{user?.degree || 'Share your qualification to build trust'}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-slate-900">{stats.totalCourses}</p>
                <p className="text-xs uppercase text-slate-600 tracking-wide">Courses</p>
              </div>
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-slate-900">{stats.totalStudents}</p>
                <p className="text-xs uppercase text-slate-600 tracking-wide">Students</p>
              </div>
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-slate-900">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs uppercase text-slate-600 tracking-wide">Revenue</p>
              </div>
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-slate-900">{Number(stats.avgRating || 0).toFixed(1)}</p>
                <p className="text-xs uppercase text-slate-600 tracking-wide">Avg Rating</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowProfileEditor((prev) => !prev)}
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition"
              >
                {showProfileEditor ? 'Hide Profile' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Profile Edit */}
          {showProfileEditor && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">My Profile</h2>
            {profileMessage && (
              <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{profileMessage}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-700 mb-1">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAvatarFileChange(e.target.files?.[0])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                />
                {avatarPreview && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={avatarPreview} alt="Profile preview" className="h-16 w-16 rounded-full object-cover border" />
                    <p className="text-xs text-slate-500">Preview</p>
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-2">Upload JPG or PNG up to 2MB.</p>
              </div>
            <div className="md:col-span-3">
              <label className="block text-sm text-slate-700 mb-1">Degree / Qualification</label>
              <input
                type="text"
                value={profileForm.degree}
                onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g., M.Tech in Data Science"
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
                    if (!res.ok) { setProfileMessage(null); throw new Error(data.message || 'Failed to update profile'); }
                    setProfileMessage('Profile updated');
                    setProfileForm((prev) => ({ ...prev, avatarData: null }));
                    await refreshUser();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setProfileSaving(false);
                  }
                }}
                disabled={profileSaving}
                className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 disabled:bg-gray-400"
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded mb-6">
              {error}
              <button
                onClick={fetchInstructorCourses}
                className="ml-4 underline text-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {courses.length > 0 && (
            <div className="bg-white p-6 rounded shadow mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Live Course Ratings</h3>
                <p className="text-xs text-slate-500">
                  Updated {lastRatingsUpdate ? lastRatingsUpdate.toLocaleTimeString() : '—'}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {courses.slice(0, 5).map(course => (
                  <div key={course._id || course.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{course.title}</p>
                      <p className="text-slate-500 text-xs">{course.students || course.studentsEnrolled || 0} students</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-yellow-500">
                        {getDisplayRating(course)}
                      </p>
                      <p className="text-xs text-slate-500">5-star scale</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  My Courses
                </h2>
                <button
                  onClick={() =>
                    setShowCreateCourseForm(!showCreateCourseForm)
                  }
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded shadow"
                >
                  {showCreateCourseForm
                    ? 'Hide Create Course'
                    : 'Create Course'}
                </button>
              </div>

              {/* Search & Filter */}
              <div className="mb-6">
                <div className="flex flex-col gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Search your courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 placeholder-slate-400"
                    autoComplete="off"
                  />

                  {/* Category Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                          selectedCategory === category.id
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-slate-700 font-medium">
                  {filteredCourses.length} course
                  {filteredCourses.length !== 1 ? 's' : ''} found
                </div>
              </div>

              {showCreateCourseForm && (
                <div className="bg-slate-100 p-6 rounded-lg shadow">
                  <CreateCourseCard onCourseCreated={fetchInstructorCourses} />
                </div>
              )}

              {filteredCourses.length > 0 ? (
                <div className="space-y-4">
                  {filteredCourses.map((course) => (
                    <div
                      key={course._id || course.id}
                      className="bg-white rounded-lg shadow overflow-hidden text-slate-900"
                    >
                      <img
                        src={
                          course.image ||
                          course.thumbnailUrl ||
                          `https://via.placeholder.com/300x150/3B82F6/FFFFFF?text=${encodeURIComponent(
                            course.title
                          )}`
                        }
                        alt={course.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">
                              {course.title}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {course.description?.substring(0, 100)}...
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                course.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {course.status || 'Draft'}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingCourse(course._id || course.id);
                                  setEditCourseData({
                                    title: course.title,
                                    description: course.description,
                                    price: course.price || 0,
                                    imageUrl: course.image || '',
                                  });
                                }}
                                className="text-yellow-600 hover:text-yellow-800 text-xs font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this course? This will remove all enrollments.')) {
                                    fetch(`${API_BASE}/api/courses/${course._id}`, {
                                      method: 'DELETE',
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    }).then(r => r.json()).then(data => {
                                      alert(data.message || 'Course deleted');
                                      fetchInstructorCourses();
                                    }).catch(e => alert('Error deleting course: ' + e.message));
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 text-xs font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-slate-900 text-lg">
                              {course.students || course.studentsEnrolled || 0}
                            </div>
                            <div className="text-slate-600">Students</div>
                            <div className="text-xs text-cyan-600 mt-1 font-medium">
                              {(course.students > 0 || course.studentsEnrolled > 0) ? 
                                `${course.students || course.studentsEnrolled} enrolled` : 
                                'No enrollments yet'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600 text-lg">
                              ₹
                              {course.revenue ||
                                (
                                  course.price *
                                  (course.studentsEnrolled || 0)
                                ).toFixed(0) ||
                                0}
                            </div>
                            <div className="text-slate-600">Revenue</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-slate-900 text-lg">
                              ₹{course.price || 0}
                            </div>
                            <div className="text-slate-600">Price</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-slate-900 text-lg">
                              {(course.assessmentStats?.passed || 0)}/{course.assessmentStats?.total || 0}
                            </div>
                            <div className="text-slate-600">Assessments Passed</div>
                          </div>
                        </div>

                        {/* Course Content */}
                        {Array.isArray(course.modules) && (
                          <div className="mt-4 border-t pt-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-slate-800">
                                  Course Content
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedCourse(course);
                                      setShowAddVideoModal(true);
                                    }}
                                    className="text-xs bg-cyan-500 text-white px-2 py-1 rounded hover:bg-cyan-600"
                                  >
                                    Add Video
                                  </button>
                                  <button
                                    onClick={() =>
                                      setCourseWithAssessment(
                                        course._id || course.id
                                      )
                                    }
                                    className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                                  >
                                    {course.hasAssessment
                                      ? 'Edit Assessment'
                                      : 'Add Assessment'}
                                  </button>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {course.modules.reduce(
                                      (sum, m) => sum + (m.videos?.length || 0),
                                      0
                                    )}{' '}
                                    videos
                                  </span>
                                  {course.hasAssessment && (
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-semibold flex items-center space-x-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.669 0-3.218.51-4.5 1.385A7.968 7.968 0 009 4.804z" />
                                      </svg>
                                      <span>Assessment</span>
                                    </span>
                                  )}
                                </div>
                              </div>                            {/* Modules */}
                            <div className="mt-2 space-y-3">
                              {course.modules.map((mod, mIdx) => (
                                <div
                                  key={mIdx}
                                  className="bg-slate-50 rounded p-3"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-semibold text-slate-900">
                                      Module {mIdx + 1}:{' '}
                                      {mod.title || `Module ${mIdx + 1}`}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-slate-600">
                                        {mod.videos?.length || 0} video(s)
                                      </span>
                                    </div>
                                  </div>

                                  {/* Videos */}
                                  {Array.isArray(mod.videos) &&
                                  mod.videos.length > 0 ? (
                                    <ul className="space-y-2">
                                      {mod.videos.map((v, vIdx) => (
                                        <li
                                          key={vIdx}
                                          className="flex items-center justify-between text-sm bg-white border border-slate-200 rounded p-2"
                                        >
                                          <div className="truncate pr-4">
                                            <span className="font-medium text-slate-900">
                                              {v.title || `Video ${vIdx + 1}`}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            {v.url && (
                                              <a
                                                href={v.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-cyan-600 hover:text-cyan-800 font-medium text-xs"
                                              >
                                                Open
                                              </a>
                                            )}
                                            <button
                                              onClick={() => {
                                                setEditingVideo({
                                                  courseId: course._id || course.id,
                                                  moduleIndex: mIdx,
                                                  videoIndex: vIdx,
                                                });
                                                setEditVideoData({
                                                  title: v.title,
                                                  url: v.url,
                                                  description: v.description || '',
                                                  durationSec: v.durationSec || 0,
                                                });
                                              }}
                                              className="text-yellow-600 hover:text-yellow-800 font-medium text-xs"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (confirm('Delete this video?')) {
                                                  fetch(`${API_BASE}/api/courses/${course._id}/modules/${mIdx}/videos/${vIdx}`, {
                                                    method: 'DELETE',
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                  }).then(r => r.json()).then(data => {
                                                    if (data.message) {
                                                      alert(data.message);
                                                      fetchInstructorCourses();
                                                    }
                                                  }).catch(e => alert('Error deleting video: ' + e.message));
                                                }
                                              }}
                                              className="text-red-600 hover:text-red-800 font-medium text-xs"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="text-xs text-slate-500 italic">
                                      No videos yet in this module.
                                    </div>
                                  )}
                                </div>
                              ))}

                            </div>
                          </div>
                        )}
                        {course.assessment ? (
                          <div className="mt-4 bg-purple-50 border border-purple-200 rounded p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm font-semibold text-purple-900">Assessment Overview</div>
                              <button
                                onClick={() => setCourseWithAssessment(course._id || course.id)}
                                className="text-xs bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                              >
                                Edit Assessment
                              </button>
                            </div>
                            {course.assessment.description && (
                              <p className="text-xs text-purple-800 mb-3">
                                {course.assessment.description}
                              </p>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div className="bg-white border border-purple-100 rounded p-2">
                                <div className="font-semibold text-purple-900">
                                  {course.assessment.title || 'Untitled'}
                                </div>
                                <div className="text-purple-700">Title</div>
                              </div>
                              <div className="bg-white border border-purple-100 rounded p-2">
                                <div className="font-semibold text-purple-900">
                                  {course.assessment.questions?.length || 0}
                                </div>
                                <div className="text-purple-700">Questions</div>
                              </div>
                              <div className="bg-white border border-purple-100 rounded p-2">
                                <div className="font-semibold text-purple-900">
                                  {course.assessment.passingScore || 70}%
                                </div>
                                <div className="text-purple-700">Passing Score</div>
                              </div>
                              <div className="bg-white border border-purple-100 rounded p-2">
                                <div className="font-semibold text-purple-900">
                                  {(course.assessmentStats?.passed || 0)}/{course.assessmentStats?.total || 0}
                                </div>
                                <div className="text-purple-700">Students Passed</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <button
                              onClick={() => setCourseWithAssessment(course._id || course.id)}
                              className="text-xs bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                            >
                              Create Assessment
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded shadow text-center text-slate-700">
                  <div className="text-5xl mb-4">📚</div>
                  <h3 className="text-xl font-medium mb-2">No courses yet</h3>
                  <p>You haven't created any courses yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Assessment Form Modal */}
      {courseWithAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Course Assessment
                </h3>
                <button
                  onClick={() => setCourseWithAssessment(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <AddAssessmentForm
                courseId={courseWithAssessment}
                onSuccess={() => {
                  setCourseWithAssessment(null);
                  fetchInstructorCourses();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddVideoModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Add Video to {selectedCourse.title}
                </h3>
                <button
                  onClick={() => {
                    setShowAddVideoModal(false);
                    setSelectedCourse(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <AddVideoForm
                courseId={selectedCourse._id || selectedCourse.id}
                onVideoAdded={() => {
                  fetchInstructorCourses();
                  setShowAddVideoModal(false);
                  setSelectedCourse(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Edit Course
                </h3>
                <button
                  onClick={() => {
                    setEditingCourse(null);
                    setEditCourseData({});
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch(`${API_BASE}/api/courses/${editingCourse}`, {
                      method: 'PUT',
                      headers: { 
                        'Authorization': `Bearer ${token}`, 
                        'Content-Type': 'application/json' 
                      },
                      body: JSON.stringify({
                        title: editCourseData.title,
                        description: editCourseData.description,
                        price: Number(editCourseData.price) || 0,
                        imageUrl: editCourseData.imageUrl,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      alert(data.message || 'Failed to update course');
                      return;
                    }
                    alert('Course updated successfully');
                    setEditingCourse(null);
                    setEditCourseData({});
                    fetchInstructorCourses();
                  } catch (err) {
                    console.error('Update course error:', err);
                    alert('Network error while updating course');
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={editCourseData.title || ''}
                    onChange={(e) => setEditCourseData({ ...editCourseData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editCourseData.description || ''}
                    onChange={(e) => setEditCourseData({ ...editCourseData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                    rows="4"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      value={editCourseData.price || 0}
                      onChange={(e) => setEditCourseData({ ...editCourseData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={editCourseData.imageUrl || ''}
                      onChange={(e) => setEditCourseData({ ...editCourseData, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 rounded-lg"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCourse(null);
                      setEditCourseData({});
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {editingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Edit Video
                </h3>
                <button
                  onClick={() => {
                    setEditingVideo(null);
                    setEditVideoData({});
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch(
                      `${API_BASE}/api/courses/${editingVideo.courseId}/modules/${editingVideo.moduleIndex}/videos/${editingVideo.videoIndex}`,
                      {
                        method: 'PUT',
                        headers: { 
                          'Authorization': `Bearer ${token}`, 
                          'Content-Type': 'application/json' 
                        },
                        body: JSON.stringify({
                          title: editVideoData.title,
                          url: editVideoData.url,
                          description: editVideoData.description,
                          durationSec: Number(editVideoData.durationSec) || 0,
                        }),
                      }
                    );
                    const data = await res.json();
                    if (!res.ok) {
                      alert(data.message || 'Failed to update video');
                      return;
                    }
                    alert('Video updated successfully');
                    setEditingVideo(null);
                    setEditVideoData({});
                    fetchInstructorCourses();
                  } catch (err) {
                    console.error('Update video error:', err);
                    alert('Network error while updating video');
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video Title
                  </label>
                  <input
                    type="text"
                    value={editVideoData.title || ''}
                    onChange={(e) => setEditVideoData({ ...editVideoData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video URL
                  </label>
                  <input
                    type="text"
                    value={editVideoData.url || ''}
                    onChange={(e) => setEditVideoData({ ...editVideoData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editVideoData.description || ''}
                    onChange={(e) => setEditVideoData({ ...editVideoData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={editVideoData.durationSec || 0}
                    onChange={(e) => setEditVideoData({ ...editVideoData, durationSec: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                    min="0"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 rounded-lg"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVideo(null);
                      setEditVideoData({});
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
