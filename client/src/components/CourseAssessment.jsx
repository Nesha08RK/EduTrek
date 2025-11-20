import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CourseAssessment({ courseId: propCourseId, onComplete }) {
  const { courseId: paramCourseId } = useParams();
  const courseId = propCourseId || paramCourseId;
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [assessmentEnabled, setAssessmentEnabled] = useState(false);
  const [videoProgress, setVideoProgress] = useState({ completed: 0, total: 0 });
  const [submittedResult, setSubmittedResult] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [graceSecondsLeft, setGraceSecondsLeft] = useState(0);
  const assessmentContainerRef = useRef(null);

  useEffect(() => {
    if (!courseId) {
      // Nothing to fetch yet (missing id from params or props)
      setLoading(false);
      return;
    }
    fetchAssessment();
  }, [courseId, token]);

  // Monitor fullscreen status
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      setIsFullscreen(isCurrentlyFullscreen);
      
      // Show warning if exited fullscreen during test
      if (!isCurrentlyFullscreen && testStarted && timeLeft > 0) {
        setFullscreenWarning(true);
        tryEnterFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [testStarted, timeLeft]);

  // Timer countdown - auto-submit when time expires
  useEffect(() => {
    let timer;
    if (timeLeft !== null && testStarted) {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      } else if (timeLeft === 0) {
        // Auto-submit when time expires
        handleSubmit();
      }
    }
    return () => clearTimeout(timer);
  }, [timeLeft, testStarted]);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/courses/${courseId}/assessment`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch assessment');
      }

      const data = await response.json();
      setAssessment(data.assessment);
      setAssessmentEnabled(data.assessmentEnabled || false);
      setVideoProgress(data.videoProgress || { completed: 0, total: 0 });
      
      // Initialize answers array
      if (data.assessment && data.assessment.questions) {
        setAnswers(new Array(data.assessment.questions.length).fill(-1));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    // Double-check that all videos are watched before starting
    if (!assessmentEnabled) {
      alert('You must watch all course videos before taking the assessment.');
      return;
    }
    
    setTestStarted(true);
    
    // Set timer if duration is specified
    if (assessment && assessment.duration) {
      setTimeLeft(assessment.duration * 60); // Convert minutes to seconds
      setStartTime(Date.now());
      
      // Enter fullscreen for proctored exam
      setTimeout(() => tryEnterFullscreen(), 100);
    }
  };

  const tryEnterFullscreen = () => {
    try {
      const el = assessmentContainerRef.current || document.documentElement;
      const fullscreenFn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      
      if (fullscreenFn) {
        fullscreenFn.call(el).catch(err => {
          console.warn('Fullscreen request failed:', err);
          // Continue test even if fullscreen fails
        });
      }
      
      // Add proctoring: disable context menu
      window.addEventListener('contextmenu', blockEvent, true);
      window.addEventListener('keydown', blockKeys, true);
      
      // Detect window tab switching
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } catch (e) {
      console.warn('Fullscreen setup failed:', e);
    }
  };

  const blockEvent = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
  };

  const blockKeys = (e) => {
    // ESC to quit exam (no submission)
    if (e.key === 'Escape' && testStarted && !reviewMode) {
      e.preventDefault();
      e.stopPropagation();
      const confirmed = window.confirm('Quit the exam? Your answers will not be submitted.');
      if (confirmed) {
        exitFullscreenCleanup();
        // Navigate back to course without submitting
        navigate(`/course/${courseId}`);
      }
      return;
    }

    // Block developer tools and refresh
    const blockedKeys = ['F12', 'F11'];
    const blockedCombos = [
      { ctrl: true, key: 'r' },
      { ctrl: true, shift: true, key: 'i' },
      { ctrl: true, shift: true, key: 'j' },
      { ctrl: true, key: 'p' }
    ];

    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }

    blockedCombos.forEach(combo => {
      if (combo.ctrl && e.ctrlKey && combo.shift && e.shiftKey && e.key.toLowerCase() === combo.key.toLowerCase()) {
        e.preventDefault();
        e.stopPropagation();
      } else if (combo.ctrl && e.ctrlKey && !combo.shift && e.key.toLowerCase() === combo.key.toLowerCase()) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  };

  const handleVisibilityChange = () => {
    if (document.hidden && testStarted) {
      setFullscreenWarning(true);
      // Optionally auto-submit on tab switch
      // handleSubmit();
    }
  };

  const exitFullscreenCleanup = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.webkitFullscreenElement) await document.webkitExitFullscreen();
      else if (document.msFullscreenElement) await document.msExitFullscreen();
    } catch (e) {
      console.warn('Fullscreen exit failed:', e);
    }
    
    window.removeEventListener('contextmenu', blockEvent, true);
    window.removeEventListener('keydown', blockKeys, true);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  useEffect(() => {
    return () => {
      exitFullscreenCleanup();
    };
  }, []);

  // Fullscreen grace countdown: 50s to return or end test
  useEffect(() => {
    let interval;
    if (fullscreenWarning && testStarted && !reviewMode) {
      setGraceSecondsLeft(50);
      interval = setInterval(() => {
        setGraceSecondsLeft(prev => {
          const next = prev - 1;
          if (next <= 0) {
            if (interval) clearInterval(interval);
            const isFullscreenNow = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
            if (!isFullscreenNow) {
              // End test by submitting
              handleSubmit();
            }
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fullscreenWarning, testStarted, reviewMode]);

  const handleAnswerChange = (questionIndex, selectedIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = selectedIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    // Final check: ensure all videos are watched before submission
    if (!assessmentEnabled) {
      alert('You must watch all course videos before submitting the assessment.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch(`${API_BASE}/api/courses/${courseId}/assessment/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          answers: answers.map((idx, i) => ({ 
            selectedIndex: idx,
            correctIndex: (
              assessment?.questions?.[i]?.answerIndex ??
              assessment?.questions?.[i]?.correctOptionIndex ??
              assessment?.questions?.[i]?.correctIndex
            )
          })),
          timeTaken: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit assessment');
      }

      const result = await response.json();

      // Show result
      alert(`Assessment submitted!\nScore: ${result.score}% (${result.correct}/${result.total} correct)\n${result.passed ? '✅ PASSED' : '❌ Need ' + (assessment.passingScore || 70) + '% to pass'}`);

      // Keep review visible
      setSubmittedResult(result);
      setReviewMode(true);

      // Clean up fullscreen
      exitFullscreenCleanup();
      
      // If passed, show certificate automatically; otherwise stay in review
      if (onComplete) {
        onComplete(result);
      } else if (result.certificateEligible) {
        navigate(`/course/${courseId}/certificate`);
      }
    } catch (err) {
      setError(err.message);
      alert('Error submitting assessment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (!timeLeft) return 'text-gray-600';
    if (timeLeft <= 60) return 'text-red-600 font-bold animate-pulse';
    if (timeLeft <= 300) return 'text-orange-600 font-semibold';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-gray-800">Loading assessment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-red-900 mb-2">Assessment Error</h2>
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition"
        >
          Back to Course
        </button>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-xl font-semibold text-yellow-900 mb-2">No Assessment Available</h2>
        <p className="text-yellow-800 mb-4">This course doesn't have an assessment yet.</p>
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition"
        >
          Back to Course
        </button>
      </div>
    );
  }

  if (!assessmentEnabled) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center max-w-2xl mx-auto">
        <div className="text-6xl mb-4">🎥</div>
        <h2 className="text-xl font-semibold text-blue-900 mb-2">Assessment Locked</h2>
        <p className="text-blue-800 mb-6">You must watch all course videos before taking the assessment.</p>
        
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Video Progress</span>
            <span className="text-sm font-bold text-gray-900">{videoProgress.completed}/{videoProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-cyan-500 h-3 rounded-full transition-all"
              style={{ width: `${videoProgress.total > 0 ? (videoProgress.completed / videoProgress.total) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Complete all {videoProgress.total} videos to unlock the assessment
          </p>
        </div>
        
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition"
        >
          Back to Watch Videos
        </button>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div ref={assessmentContainerRef} className="bg-white rounded-lg p-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{assessment.title}</h2>
          <p className="text-gray-600 text-lg mb-6">{assessment.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-6 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-3xl font-bold text-gray-900">{assessment.questions?.length || 0}</p>
            </div>
            {assessment.duration && (
              <div>
                <p className="text-sm text-gray-600">Time Limit</p>
                <p className="text-3xl font-bold text-gray-900">{assessment.duration} min</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Passing Score</p>
              <p className="text-3xl font-bold text-gray-900">{assessment.passingScore || 70}%</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">⚠️ Important: Test Mode Rules</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>✓ Test will run in fullscreen mode for exam security</li>
              <li>✓ You cannot exit fullscreen or switch tabs during the test</li>
              {assessment.duration && <li>✓ You have <strong>{assessment.duration} minutes</strong> to complete the test</li>}
              <li>✓ Developer tools and other shortcuts are disabled</li>
              <li>✓ Your answers are auto-saved as you go</li>
              <li>✓ Test will auto-submit when time expires</li>
              <li>✓ You can manually submit before time runs out</li>
              <li>✓ Press ESC to quit the exam (no submission)</li>
            </ul>
          </div>

          <button
            onClick={startTest}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg text-lg transition"
          >
            {submitting ? 'Starting...' : 'Start Test'}
          </button>
        </div>
      </div>
    );
  }

  if (reviewMode && submittedResult) {
    const { total, correct, score, passed, certificateEligible, questionResults } = submittedResult;
    const need = (assessment.passingScore || 70);
    const results = Array.isArray(questionResults) && questionResults.length > 0
      ? questionResults
      : (assessment.questions || []).map((question, qIdx) => {
          const normalizeIndex = (val) => {
            const n = typeof val === 'string' ? parseInt(val, 10) : val;
            return Number.isInteger(n) ? n : -1;
          };
          const correctIndex = normalizeIndex(
            question?.answerIndex !== undefined ? question.answerIndex : (
              question?.correctOptionIndex !== undefined ? question.correctOptionIndex : (
                question?.correctIndex !== undefined ? question.correctIndex : -1
              )
            )
          );
          const selectedIndex = answers[qIdx];
          return {
            index: qIdx,
            question: question.question,
            options: question.options || [],
            correctIndex,
            selectedIndex,
            correct: Number.isInteger(correctIndex) && selectedIndex === correctIndex
          };
        });
    return (
      <div ref={assessmentContainerRef} className="bg-white rounded-lg p-8 max-w-4xl mx-auto">
        <div className="mb-8 pb-8 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{assessment.title}</h2>
              <p className="text-sm text-gray-600 mt-1">Score: <strong>{score}% ({correct}/{total})</strong> — {passed ? 'Passed' : `Need ${need}%`}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 mb-8">
          {results.map((r) => (
              <div key={r.index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-4 mb-2">
                  <span className="flex-shrink-0 w-8 h-8 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-semibold text-sm">
                    {r.index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{r.question}</h3>
                    {r.correct ? (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">✅ Correct</span>
                    ) : (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded">Correct answer: {Number.isInteger(r.correctIndex) && r.correctIndex >= 0 ? r.options?.[r.correctIndex] : 'Unavailable'}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 ml-12">
                  {r.options && r.options.map((option, oIdx) => {
                    const isCorrect = Number.isInteger(r.correctIndex) && oIdx === r.correctIndex;
                    const isWrongSelection = r.selectedIndex === oIdx && r.selectedIndex !== r.correctIndex;
                    const base = 'flex items-center gap-3 p-3 rounded-lg border';
                    const style = isCorrect
                      ? ' bg-green-50 border-green-300 text-green-800'
                      : isWrongSelection
                        ? ' bg-red-50 border-red-300 text-red-800'
                        : ' bg-gray-50 border-gray-200 text-gray-800';
                    return (
                      <div key={oIdx} className={`${base}${style}`}>
                        <span className="w-5 h-5 inline-block rounded-full border border-gray-300 bg-white"></span>
                        <span className="transition">{option}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        <div className="flex justify-center gap-4 pt-8 border-t border-gray-200">
          {certificateEligible && (
            <button
              onClick={() => navigate(`/course/${courseId}/certificate`)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              View Certificate
            </button>
          )}
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={assessmentContainerRef} className="bg-white rounded-lg p-8 max-w-4xl mx-auto">
      {/* Header with timer */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{assessment.title}</h2>
            <p className="text-sm text-gray-600 mt-1">Question progress: <strong>{answers.filter(a => a !== -1).length}/{assessment.questions?.length || 0}</strong> answered</p>
          </div>
          {assessment.duration && timeLeft !== null && (
            <div className={`text-center p-4 bg-gray-50 rounded-lg ${getTimeColor()}`}>
              <p className="text-sm text-gray-600 mb-1">Time Remaining</p>
              <p className="text-3xl font-mono font-bold">{formatTime(timeLeft)}</p>
              {timeLeft <= 60 && <p className="text-xs text-red-600 mt-2">⏰ Time running out!</p>}
            </div>
          )}
        </div>
        
        {fullscreenWarning && (
          <div className="mt-4 bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-3">
            <span className="text-red-600 text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-red-900 font-semibold">Fullscreen exited!</p>
              <p className="text-sm text-red-800">Return to fullscreen within <strong>{graceSecondsLeft}</strong> seconds or the test will end.</p>
            </div>
            <button onClick={tryEnterFullscreen} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">Return to fullscreen</button>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-8 mb-8">
        {assessment.questions && assessment.questions.map((question, qIdx) => (
          <div key={qIdx} className="border border-gray-200 rounded-lg p-6 hover:border-cyan-300 transition">
            <div className="flex items-start gap-4 mb-4">
              <span className="flex-shrink-0 w-8 h-8 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-semibold text-sm">
                {qIdx + 1}
              </span>
              <h3 className="text-lg font-semibold text-gray-900">{question.question}</h3>
            </div>
            
            <div className="space-y-3 ml-12">
              {question.options && question.options.map((option, oIdx) => (
                <label key={oIdx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer group transition">
                  <input
                    type="radio"
                    name={`question-${qIdx}`}
                    checked={answers[qIdx] === oIdx}
                    onChange={() => handleAnswerChange(qIdx, oIdx)}
                    disabled={submitting}
                    className="w-5 h-5 text-cyan-600 cursor-pointer"
                  />
                  <span className={`text-gray-800 group-hover:text-gray-900 transition ${answers[qIdx] === oIdx ? 'font-semibold text-cyan-700' : ''}`}>
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-8 border-t border-gray-200">
        <button
          onClick={handleSubmit}
          disabled={submitting || answers.filter(a => a !== -1).length === 0}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white font-bold py-3 px-12 rounded-lg text-lg transition"
        >
          {submitting ? 'Submitting...' : `Submit Assessment (${answers.filter(a => a !== -1).length}/${assessment.questions?.length || 0} answered)`}
        </button>
      </div>
    </div>
  );
}
