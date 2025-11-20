import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';

export default function Courses() {
  const { token, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [allCourses, setAllCourses] = useState([]); // all courses from API or sample
  const [filteredCourses, setFilteredCourses] = useState([]); // filtered courses
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'programming', name: 'Programming' },
    { id: 'webdevelopment', name: 'Web Development' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'cybersecurity', name: 'Cybersecurity' }
  ];

  const sampleCourses = [
    { _id: '1', title: 'Complete JavaScript Course 2023', category: 'programming', rating: 4.8, studentsEnrolled: 1245, instructor: { name: 'John Smith' }, thumbnailUrl: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=JavaScript', description: 'Learn JavaScript from scratch. Master fundamentals, ES6+, async/await, and more.', price: 49.99 },
    { _id: '2', title: 'UI/UX Design Masterclass', category: 'webdevelopment', rating: 4.7, studentsEnrolled: 843, instructor: { name: 'Sarah Johnson' }, thumbnailUrl: 'https://via.placeholder.com/300x200/EC4899/FFFFFF?text=UI/UX', description: 'Comprehensive design course covering wireframing, prototyping, and user research.', price: 59.99 },
    { _id: '3', title: 'Python for Data Science', category: 'programming', rating: 4.9, studentsEnrolled: 2156, instructor: { name: 'Michael Chen' }, thumbnailUrl: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Python', description: 'Master Python for data analysis, visualization, and machine learning applications.', price: 69.99 },
    { _id: '4', title: 'Digital Marketing Fundamentals', category: 'marketing', rating: 4.6, studentsEnrolled: 1532, instructor: { name: 'Emily Rodriguez' }, thumbnailUrl: 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Marketing', description: 'Learn SEO, social media marketing, email campaigns, and digital advertising strategies.', price: 39.99 },
    { _id: '5', title: 'Ethical Hacking & Cybersecurity', category: 'cybersecurity', rating: 4.8, studentsEnrolled: 978, instructor: { name: 'David Wilson' }, thumbnailUrl: 'https://via.placeholder.com/300x200/6366F1/FFFFFF?text=Security', description: 'Learn penetration testing, vulnerability assessment, and security best practices.', price: 79.99 }
  ];

  // ----------------- Handlers -----------------
  const handleCategoryChange = (categoryId) => setSelectedCategory(categoryId);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  // ----------------- Filter Courses -----------------
  const filterCourses = useCallback(() => {
    let filtered = [...allCourses];
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c => c.title.toLowerCase().includes(q) || 
             c.description.toLowerCase().includes(q) || 
             c.instructor.name.toLowerCase().includes(q)
      );
    }
    setFilteredCourses(filtered);
  }, [allCourses, selectedCategory, searchQuery]);

  // Debounce filtering for search
  useEffect(() => {
    const timeoutId = setTimeout(() => filterCourses(), 300); // 300ms debounce
    return () => clearTimeout(timeoutId);
  }, [filterCourses]);

  // Fetch courses from API or fallback to sample
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/courses`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('API fetch failed');
        const data = await res.json();
        setAllCourses(data.courses || sampleCourses);
      } catch (err) {
        console.log('API fetch failed, using sample courses');
        setAllCourses(sampleCourses);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [token]);

  if (loading) return <div className="w-screen min-h-screen flex items-center justify-center bg-slate-50 pt-16">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen w-screen overflow-x-hidden bg-slate-50 text-black">
      <main className="flex-1 pt-16 w-screen px-4">
        {/* Category & Search */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <input 
            type="text" 
            placeholder="Search courses..." 
            value={searchQuery} 
            onChange={handleSearchChange} 
            className="flex-1 px-4 py-2 border rounded-lg text-black bg-gray-100 placeholder-black"
          />
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => handleCategoryChange(cat.id)} 
                className={`px-4 py-2 rounded ${selectedCategory===cat.id?'bg-cyan-500 text-white':'bg-white text-black'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length ? filteredCourses.map(course => (
            <div key={course._id || course.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
              <img src={course.image || course.thumbnailUrl} alt={course.title} className="w-full h-32 object-cover"/>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-lg font-semibold text-black">{course.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2">{course.description}</p>
                <p className="text-xs text-slate-500 mt-auto">by {course.instructor?.name}</p>
                <Link to={`/course/${course._id || course.id}`} className="mt-2 bg-cyan-500 text-white text-center py-2 rounded hover:bg-cyan-600">View Course</Link>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-12">
              <p>No courses found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
