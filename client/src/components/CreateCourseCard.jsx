import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';

export default function CreateCourseCard({ onCourseCreated }) {
  const { token, user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) return alert('You must be logged in.');
    if (!user || user.role !== 'instructor') return alert('You are not authorized to create a course.');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('price', Number(price));
    formData.append('requirements', JSON.stringify([]));
    formData.append('curriculum', '');
    if (imageFile) formData.append('image', imageFile);
    if (imageUrl) formData.append('imageUrl', imageUrl);

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/courses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create course.');
      }

      const data = await response.json();

      setTitle('');
      setDescription('');
      setCategory('');
      setPrice('');
      setImageFile(null);
      setImageUrl('');

      alert('Course created successfully!');
      if (onCourseCreated) onCourseCreated();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Create New Course</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Course Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border px-4 py-2 rounded bg-white text-gray-900"
          required
        />
        <textarea
          placeholder="Course Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border px-4 py-2 rounded bg-white text-gray-900"
          rows={4}
          required
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border px-4 py-2 rounded bg-white text-gray-900"
          required
        >
          <option value="">Select Category</option>
          <option value="programming">Programming</option>
          <option value="webdevelopment">Web Development</option>
          <option value="marketing">Marketing</option>
          <option value="cybersecurity">Cybersecurity</option>
        </select>
        <input
          type="number"
          placeholder="Price (₹)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border px-4 py-2 rounded bg-white text-gray-900"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files && e.target.files[0])}
            className="w-full mb-2"
          />

          <div className="text-sm text-gray-600 mb-1">Or provide an image URL</div>
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full border px-3 py-2 rounded bg-white text-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-cyan-500 text-white py-2 rounded hover:bg-cyan-600 transition ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating...' : 'Create Course'}
        </button>
      </form>
    </div>
  );
}
