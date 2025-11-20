import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config/api';
import { useAuth } from '../context/AuthContext';

const VideoPlayer = ({ videoUrl, courseId, moduleIndex, videoIndex, onComplete, durationSec }) => {
  const { token } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [watchTime, setWatchTime] = useState(0); // in seconds
  const [videoDuration, setVideoDuration] = useState(0);
  const [uploadingProgress, setUploadingProgress] = useState(false);

  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const pollRef = useRef(null);

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch && youtubeMatch[1]) return `https://www.youtube.com/embed/${youtubeMatch[1]}?enablejsapi=1`; 
    const vimeoRegex = /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)([0-9]+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  const embedUrl = getVideoEmbedUrl(videoUrl);

  // Initialize player and polling
  useEffect(() => {
    if (!embedUrl || !iframeRef.current) return;

    // If YouTube, use IFrame API
    const isYouTube = embedUrl.includes('youtube.com/embed');

    let isMounted = true;

    function setupYouTube() {
      try {
        playerRef.current = new window.YT.Player(iframeRef.current, {
          events: {
            onReady: (e) => {
              if (!isMounted) return;
              const duration = e.target.getDuration();
              if (duration) setVideoDuration(Math.round(duration));
              // start poller
              startPolling(() => {
                try {
                  const current = Math.floor(e.target.getCurrentTime());
                  return current;
                } catch (err) {
                  return null;
                }
              });
            },
            onStateChange: (e) => {
              // if ended
              if (e.data === 0) {
                setWatchTime(prev => Math.max(prev, Math.round(e.target.getDuration())));
              }
            }
          }
        });
      } catch (err) {
        // fallback to basic polling
        startPolling(() => null);
      }
    }

    function setupFallback() {
      // Start polling that just increases watchTime while iframe is visible (best-effort)
      startPolling(() => null);
    }

    // Load YouTube API if needed
    if (isYouTube) {
      if (!window.YT || !window.YT.Player) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = () => setupYouTube();
      } else {
        setupYouTube();
      }
    } else {
      setupFallback();
    }

    function startPolling(getCurrentTimeFn) {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => {
        // Prefer an authoritative current time from player when available
        let current = null;
        try {
          if (getCurrentTimeFn) current = getCurrentTimeFn();
          else if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') current = Math.floor(playerRef.current.getCurrentTime());
        } catch (e) {
          current = null;
        }

        if (current !== null && !isNaN(current)) {
          setWatchTime(prev => Math.max(prev, current));
        } else {
          // Best-effort fallback: increment by 1s
          setWatchTime(prev => prev + 1);
        }
      }, 1000);
    }

    return () => {
      isMounted = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      try {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') playerRef.current.destroy();
      } catch (e) {}
    };
  }, [embedUrl]);

  // If durationSec prop provided, use it as a fallback duration (in seconds)
  useEffect(() => {
    if (durationSec && Number(durationSec) > 0) {
      setVideoDuration(Math.round(Number(durationSec)));
    }
  }, [durationSec]);

  // Completion watcher
  useEffect(() => {
    if (isCompleted) return;
    const completionThreshold = Math.max(15, videoDuration * 0.9 || 15);
  }, [embedUrl]);
  
  // Fallback tracking when YouTube API unavailable
  const handleFallbackTracking = () => {
    const timer = setInterval(() => {
      if (isTracking) {
        setWatchTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  };
  
  // Check for video completion (90% watched or >95% duration)
  useEffect(() => {
    if (isCompleted) return;
    
    // Completion logic: either 90% of video watched or timer-based (15 seconds minimum)
    const completionThreshold = Math.max(15, videoDuration * 0.9);
    
    if (watchTime >= completionThreshold) {
      markVideoComplete();
    }
  }, [watchTime, videoDuration, isCompleted]);
  
  const markVideoComplete = () => {
    setIsCompleted(true);
    if (onComplete) {
      onComplete({
        courseId,
        moduleIndex,
        videoIndex,
        watchTime,
        completedAt: new Date().toISOString()
      });
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const watchPercentage = videoDuration > 0 ? Math.round((watchTime / videoDuration) * 100) : 0;
  
  if (!embedUrl) {
    return <div className="bg-red-100 text-red-800 p-4 rounded">Invalid video URL</div>;
  }
  
  return (
    <div className="video-player-container">
      <div className="relative pb-[56.25%] h-0 overflow-hidden max-w-full bg-black rounded-lg">
        <iframe 
          ref={iframeRef}
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full border-0"
          title="Video Player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      
      {/* Watch progress and completion indicator */}
      <div className="mt-4 space-y-3">
        {videoDuration > 0 && (
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Progress: {watchPercentage}%</span>
              <span>{formatTime(watchTime)} / {formatTime(videoDuration)}</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-cyan-500'} transition-all duration-300`}
                style={{ width: `${watchPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center text-green-700 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Video completed! Great job.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;