import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import AddVideoForm from '../components/AddVideoForm';
import VideoPlayer from '../components/VideoPlayer';
import CourseAssessment from '../components/CourseAssessment';
import CourseCertificate from '../components/CourseCertificate';

export default function CourseDetail() {
    const { id } = useParams();
	const { user, token, triggerEnrollmentRefresh } = useAuth();
	const navigate = useNavigate();
	const [course, setCourse] = useState(null);
	const [loading, setLoading] = useState(true);
	const [enrolling, setEnrolling] = useState(false);
	const [error, setError] = useState(null);
	const [selectedVideo, setSelectedVideo] = useState(null);
	const [selectedModuleIndex, setSelectedModuleIndex] = useState(null);
	const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);
	const [completedVideos, setCompletedVideos] = useState([]);
	const [showAssessment, setShowAssessment] = useState(false);
	const [assessmentCompleted, setAssessmentCompleted] = useState(false);
	const [eligibleForCertificate, setEligibleForCertificate] = useState(false);
	const [videoCompletionMap, setVideoCompletionMap] = useState({});
	const [assessmentEnabled, setAssessmentEnabled] = useState(false);
	const [assessmentExists, setAssessmentExists] = useState(false);
	const [videoProgress, setVideoProgress] = useState({ completed: 0, total: 0 });
	const [isEnrolled, setIsEnrolled] = useState(false);
	const [completedLessonKeys, setCompletedLessonKeys] = useState(() => new Set());

	const addCompletedLessonKeys = useCallback((keys = []) => {
		if (!Array.isArray(keys) || keys.length === 0) return;
		setCompletedLessonKeys((prev) => {
			const updated = new Set(prev);
			keys.forEach((k) => {
				if (k === undefined || k === null) return;
				updated.add(String(k));
			});
			return updated;
		});
	}, [setCompletedLessonKeys]);

	const applyCompletedLessons = (keys = [], courseObj = course) => {
		if (!Array.isArray(keys) || keys.length === 0) return;
		addCompletedLessonKeys(keys);
		if (!courseObj || !courseObj.modules) return;
		const urls = [];
		const completionMapUpdate = {};
		keys.forEach((k) => {
			const parts = String(k).split('-').map(Number);
			if (parts.length !== 2) return;
			const [mIdx, vIdx] = parts;
			if (isNaN(mIdx) || isNaN(vIdx)) return;
			const mod = courseObj.modules[mIdx];
			if (!mod || !mod.videos || !mod.videos[vIdx]) return;
			const url = mod.videos[vIdx].url;
			if (url) urls.push(url);
			completionMapUpdate[`${mIdx}-${vIdx}`] = { completedAt: null };
		});
		setCompletedVideos((prev) => Array.from(new Set([...(Array.isArray(prev) ? prev : []), ...urls])));
		setVideoCompletionMap((prev) => ({ ...prev, ...completionMapUpdate }));
	};

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                if (!id || id === 'undefined' || id === 'null') {
                    setLoading(false);
                    return;
                }
                setLoading(true);
                setCompletedLessonKeys(new Set());
                setCompletedVideos([]);
                setVideoCompletionMap({});
                setIsEnrolled(false);
                const res = await fetch(`${API_BASE}/api/courses/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                if (!res.ok) throw new Error('Failed to fetch course');
                const data = await res.json();
                if (!mounted) return;
                setCourse(data.course);

				if (token) {
					try {
						// prefer route id, but fall back to fetched course._id when available
						const cid = id || (data && data.course && data.course._id) || null;
						if (cid) {
							const aresp = await fetch(`${API_BASE}/api/courses/${cid}/assessment`, { headers: { Authorization: `Bearer ${token}` } });
							if (aresp.ok) {
								const adata = await aresp.json();
								setAssessmentEnabled(adata.assessmentEnabled || false);
								setAssessmentExists(!!adata.assessment);
								setVideoProgress(adata.videoProgress || { completed: 0, total: 0 });
								setIsEnrolled(!!adata.isEnrolled);
								if (Array.isArray(adata.completedLessons) && adata.completedLessons.length > 0) {
									applyCompletedLessons(adata.completedLessons, data.course);
								}
							} else {
								setIsEnrolled(false);
							}
						} else {
							// no course id available yet; skip assessment fetch
						}
					} catch (err) {
						console.warn('Failed to fetch assessment status on load', err);
					}
				} else {
					setIsEnrolled(false);
				}
				setError(null);
            } catch (err) {
                console.error(err);
                setError('Failed to load course details');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [id, token]);

	const handleEnroll = async () => {
		if (!user) {
			navigate('/login', { state: { from: `/course/${id}` } });
			return;
		}
		setEnrolling(true);
		try {
			const res = await fetch(`${API_BASE}/api/courses/${id}/enroll`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: id }) });
			const data = await res.json();
			if (!res.ok) {
				alert(data.message || 'Failed to enroll');
				setEnrolling(false);
				return;
			}
			setIsEnrolled(true);
			triggerEnrollmentRefresh();
			navigate('/student-dashboard');
		} catch (err) {
			console.error(err);
			alert('Network error while enrolling');
			setEnrolling(false);
		}
	};

	const handleVideoComplete = async ({ courseId, moduleIndex, videoIndex, watchTime, completedAt }) => {
		const key = `${moduleIndex}-${videoIndex}`;
		addCompletedLessonKeys([key]);
		setVideoCompletionMap((p) => ({ ...p, [key]: { watchTime, completedAt } }));
		const mod = course?.modules?.[moduleIndex];
		const url = mod?.videos?.[videoIndex]?.url;
		if (url) setCompletedVideos((prev) => (prev.includes(url) ? prev : [...prev, url]));

		if (token) {
			try {
				const resp = await fetch(`${API_BASE}/api/courses/${courseId}/video-progress`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleIndex, videoIndex, watchTime, completedAt }) });
				if (resp.ok) {
					const data = await resp.json();
					if (Array.isArray(data.completedLessons) && data.completedLessons.length > 0) applyCompletedLessons(data.completedLessons, course);
					if (typeof data.assessmentEnabled === 'boolean') setAssessmentEnabled(data.assessmentEnabled);
				}
			} catch (err) { console.error('Error updating progress', err); }
		}
	};

	const handleEditVideo = async (mIdx, vIdx, video) => {
		try {
			const newTitle = prompt('Video title', video.title) || video.title;
			const newUrl = prompt('Video URL', video.url) || video.url;
			const newDescription = prompt('Video description', video.description || '') || video.description || '';
			const newDuration = prompt('Duration in seconds', video.durationSec || 0);
			const payload = { title: newTitle, url: newUrl, description: newDescription };
			if (newDuration !== null) payload.durationSec = Number(newDuration) || 0;
			const res = await fetch(`${API_BASE}/api/courses/${id}/modules/${mIdx}/videos/${vIdx}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
			const d = await res.json();
			if (!res.ok) { alert(d.message || 'Failed to update video'); return; }
			const r = await fetch(`${API_BASE}/api/courses/${id}`);
			const dd = await r.json();
			setCourse(dd.course);
		} catch (err) { console.error(err); alert('Network error'); }
	};

	if (loading) return (<div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div><p className="text-slate-800">Loading course details...</p></div></div>);
	if (error) return (<div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center"><div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md"><div className="text-red-500 text-5xl mb-4">⚠️</div><h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2><p className="text-slate-800 mb-4">{error}</p></div></div>);
	if (!course) return (<div className="min-h-screen bg-slate-50 pt-16"><div className="max-w-7xl mx-auto px-4 py-8"><div className="text-center"><h1 className="text-2xl font-bold text-slate-900 mb-4">Course not found</h1></div></div></div>);

	const displayRating = course?.rating && Number(course.rating) > 0 ? Number(course.rating).toFixed(1) : '4.5';

	const isInstructor = user?.role === 'instructor' && course.instructor?._id === user?._id;

	return (
		<div className="min-h-screen bg-slate-50 pt-16">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="mb-8">
					<nav className="text-sm text-slate-800 mb-4"><a href="/courses" className="hover:text-cyan-600">Courses</a><span className="mx-2">/</span><span>{course.title}</span></nav>
					<h1 className="text-4xl font-bold text-slate-900 mb-4">{course.title}</h1>
					<p className="text-lg text-slate-800 mb-4">{course.description}</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-8">
						{selectedVideo && (
							<div className="mb-8 bg-white p-6 rounded-lg shadow">
								<h3 className="text-xl font-semibold mb-4">{selectedVideo.title}</h3>
								<VideoPlayer videoUrl={selectedVideo.url} durationSec={selectedVideo.durationSec || selectedVideo.duration} courseId={id} moduleIndex={selectedModuleIndex} videoIndex={selectedVideoIndex} onComplete={handleVideoComplete} />
								<div className="mt-4"><button onClick={() => { setSelectedVideo(null); setSelectedModuleIndex(null); setSelectedVideoIndex(null); }} className="text-slate-600 hover:text-slate-800">Back to course content</button></div>
							</div>
						)}

						{!selectedVideo && assessmentExists && (
							<div className="mb-8">
								{!assessmentEnabled ? (
									<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 max-w-2xl">
										<h3 className="text-xl font-semibold text-blue-900 mb-2">Assessment Locked</h3>
										<p className="text-blue-800 mb-4">You must watch all course videos to unlock the assessment.</p>
										<div className="bg-white rounded-lg p-4 mb-4">
											<div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-700">Video Progress</span><span className="text-sm font-bold text-gray-900">{videoProgress.completed}/{videoProgress.total}</span></div>
											<div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-cyan-500 h-3 rounded-full transition-all" style={{ width: `${videoProgress.total > 0 ? (videoProgress.completed / videoProgress.total) * 100 : 0}%` }} /></div>
											<p className="text-xs text-gray-600 mt-2">Complete all {videoProgress.total} videos to unlock the assessment</p>
										</div>
										<button className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed" disabled>Start Assessment</button>
									</div>
								) : (
									<div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-6">
										<h3 className="text-xl font-semibold text-green-800 mb-2">Course Completed!</h3>
										<p className="text-green-700 mb-4">Congratulations on watching all videos. Take the assessment to earn your certificate.</p>
										<button onClick={() => setShowAssessment(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Start Assessment</button>
									</div>
								)}

								{showAssessment && !assessmentCompleted && (
									<CourseAssessment
										courseId={course._id}
										onComplete={(result) => {
											setShowAssessment(false);
											setAssessmentCompleted(true);
											setEligibleForCertificate(!!(result && result.certificateEligible));
										}}
									/>
								)}
								{assessmentCompleted && eligibleForCertificate && (
									<CourseCertificate courseId={course._id} userName={user?.name} />
								)}
								{assessmentCompleted && !eligibleForCertificate && (
									<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
										<h3 className="text-lg font-semibold text-yellow-900 mb-2">Assessment Result</h3>
										<p className="text-yellow-800">You did not meet the passing score. Please review and retake the assessment to unlock your certificate.</p>
									</div>
								)}
							</div>
						)}

						{!selectedVideo && (
							<div className="space-y-4">
								{course.modules && course.modules.map((module, mIdx) => (
									<div key={mIdx} className="border border-slate-200 rounded-lg">
										<div className="p-4 bg-slate-50"><h3 className="font-semibold text-slate-900">{module.title}</h3></div>
										<div className="p-4">
											<ul className="space-y-2">
												{module.videos && module.videos.map((video, vIdx) => {
													const key = `${mIdx}-${vIdx}`;
													const hasCompletedKey = completedLessonKeys.has(key);
													const isDone = hasCompletedKey || !!videoCompletionMap[key] || (video.url && completedVideos.includes(video.url));
													return (
														<li key={vIdx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
															<div className="flex items-center space-x-3 text-slate-900">
																<div className={`w-8 h-8 ${isDone ? 'bg-green-100 text-green-600' : 'bg-cyan-100 text-cyan-600'} rounded-full flex items-center justify-center`}>
																	{isDone ? (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>) }
																</div>
																<span>{video.title}</span>
															</div>
															<div className="flex items-center space-x-3">
																<button onClick={() => { setSelectedVideo(video); setSelectedModuleIndex(mIdx); setSelectedVideoIndex(vIdx); }} className="text-cyan-600 hover:text-cyan-800 text-sm font-medium">Watch</button>
																{isInstructor ? (<><button onClick={() => handleEditVideo(mIdx, vIdx, video)} className="text-yellow-600 hover:text-yellow-800 text-sm font-medium mr-2">Edit</button><button onClick={() => { if (confirm('Delete this video?')) { fetch(`${API_BASE}/api/courses/${id}/modules/${mIdx}/videos/${vIdx}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => { if (d.message) { alert(d.message); fetch(`${API_BASE}/api/courses/${id}`).then(rr => rr.json()).then(dd => setCourse(dd.course)); } }).catch(e => alert('Error: '+e.message)); } }} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button></>) : null}
															</div>
														</li>
													);
												})}
											</ul>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

							<div className="lg:col-span-1">
								<div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
							<div className="text-center mb-6">
								<div className="text-3xl font-bold text-slate-900 mb-2">{`$${course.price}`}</div>
								<div className="text-sm text-slate-800">One-time payment</div>
							</div>

							{!isInstructor && (
								<div className="mb-4">
									{isEnrolled ? (
										<button
											onClick={() => navigate('/student-dashboard')}
											className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition"
										>
											Go to Dashboard
										</button>
									) : (
										<button
											onClick={handleEnroll}
											disabled={enrolling}
											className="w-full bg-cyan-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
										>
											{enrolling ? 'Enrolling...' : 'Enroll Now'}
										</button>
									)}
								</div>
							)}

							<div className="space-y-4 text-sm">
								<div className="flex justify-between"><span className="text-slate-800 font-medium">Course includes:</span></div>
								<div className="space-y-2">{['12 hours on-demand video','Downloadable resources','Full lifetime access','Certificate of completion'].map((item, idx) => (<div key={idx} className="flex items-center space-x-2"><div className="w-4 h-4 bg-green-500 rounded"></div><span className="text-slate-900">{item}</span></div>))}</div>
							</div>

									<div className="mt-6 pt-6 border-t border-slate-200">
										<div className="flex items-center justify-between text-sm"><span className="text-slate-800">Students enrolled:</span><span className="font-semibold text-slate-900">{course.students?.toLocaleString()}</span></div>
										<div className="flex items-center justify-between text-sm mt-2"><span className="text-slate-800">Rating:</span><div className="flex items-center space-x-1"><span className="text-yellow-500">★</span><span className="font-semibold text-slate-900">{displayRating}</span></div></div>
										<div className="mt-4 bg-slate-50 rounded p-4">
											<div className="text-sm text-slate-800 font-medium mb-2">Instructor</div>
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold">
													{(course.instructor?.name || 'I').slice(0,1).toUpperCase()}
												</div>
												<div>
													<div className="text-slate-900 font-semibold">{course.instructor?.name}</div>
													<div className="text-slate-600 text-xs">{course.instructor?.degree || 'Degree not specified'}</div>
													<div className="text-slate-500 text-xs">{course.instructor?.email}</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
	);
}
