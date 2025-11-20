import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';

export default function AddVideoForm({ courseId, moduleIndex = 0, onVideoAdded }) {
    const { token } = useAuth();
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!url.includes('youtube.com') && !url.includes('youtu.be') && !url.includes('vimeo.com')) {
                setError('Please enter a valid YouTube or Vimeo URL');
                setLoading(false);
                return;
            }

            const courseResponse = await axios.get(
                `${API_BASE}/api/courses/${courseId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const course = courseResponse.data.course;

            if (!course.modules || course.modules.length <= moduleIndex) {
                try {
                    await axios.post(
                        `${API_BASE}/api/courses/${courseId}/modules`,
                        { title: `Module ${course.modules.length + 1}` },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } catch (err) {
                    console.error('Error creating module:', err.response?.data?.message || err.message);
                    throw new Error('Failed to create a new module for the course.');
                }
            }

            const response = await axios.post(
                `${API_BASE}/api/courses/${courseId}/modules/${moduleIndex}/videos`,
                {
                    title,
                    url,
                    description,
                    durationSec: Number(duration) || 0
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess('Video added successfully!');
            if (onVideoAdded) onVideoAdded();

            setTitle('');
            setUrl('');
            setDescription('');
            setDuration('');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to add video. Please ensure the course has a module to add the video to.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border p-3 rounded space-y-2 bg-gray-50">
            <h4 className="font-semibold text-gray-800">Add Video</h4>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            <input
                type="text"
                placeholder="Video Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="border p-1 w-full rounded bg-white text-gray-900"
            />
            <input
                type="text"
                placeholder="Video URL (YouTube or Vimeo)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="border p-1 w-full rounded bg-white text-gray-900"
            />
            <textarea
                placeholder="Video Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border p-1 w-full rounded bg-white text-gray-900"
                rows="3"
            />
            <input
                type="number"
                placeholder="Duration (seconds)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="border p-1 w-full rounded bg-white text-gray-900"
            />
            <button
                type="submit"
                disabled={loading}
                className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600 disabled:bg-cyan-300"
            >
                {loading ? 'Adding...' : 'Add Video'}
            </button>
        </form>
    );
}
