import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';

export default function AdminDashboard() {
	const { user, token } = useAuth();
	const [users, setUsers] = useState([]);
	const [courses, setCourses] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchAdminData();
	}, []);

	const fetchAdminData = async () => {
		try {
			// Fetch users and courses data
			const [usersResponse, coursesResponse] = await Promise.all([
				fetch(`${API_BASE}/api/admin/users`, {
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				}),
				fetch(`${API_BASE}/api/admin/courses`, {
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				})
			]);

			if (usersResponse.ok) {
				const usersData = await usersResponse.json();
				setUsers(usersData.users || []);
			} else {
				// Fallback to mock data
				setUsers([
					{ id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', status: 'active', joined: '2024-01-15' },
					{ id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'instructor', status: 'active', joined: '2024-01-10' },
					{ id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'student', status: 'inactive', joined: '2024-01-05' },
					{ id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', role: 'instructor', status: 'active', joined: '2024-01-20' }
				]);
			}

			if (coursesResponse.ok) {
				const coursesData = await coursesResponse.json();
				setCourses(coursesData.courses || []);
			} else {
				// Fallback to mock data
				setCourses([
					{ id: 1, title: 'React Fundamentals', instructor: 'John Doe', status: 'published', students: 45, revenue: 2250 },
					{ id: 2, title: 'Advanced JavaScript', instructor: 'Jane Smith', status: 'draft', students: 23, revenue: 1150 },
					{ id: 3, title: 'UI/UX Design', instructor: 'Mike Johnson', status: 'published', students: 67, revenue: 3350 }
				]);
			}
		} catch (error) {
			console.error('Error fetching admin data:', error);
			// Fallback to mock data
			setUsers([
				{ id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', status: 'active', joined: '2024-01-15' },
				{ id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'instructor', status: 'active', joined: '2024-01-10' },
				{ id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'student', status: 'inactive', joined: '2024-01-05' },
				{ id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', role: 'instructor', status: 'active', joined: '2024-01-20' }
			]);
			setCourses([
				{ id: 1, title: 'React Fundamentals', instructor: 'John Doe', status: 'published', students: 45, revenue: 2250 },
				{ id: 2, title: 'Advanced JavaScript', instructor: 'Jane Smith', status: 'draft', students: 23, revenue: 1150 },
				{ id: 3, title: 'UI/UX Design', instructor: 'Mike Johnson', status: 'published', students: 67, revenue: 3350 }
			]);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
					<div className="text-right">
						<p className="text-slate-600">Welcome back, {user?.name}!</p>
						<p className="text-sm text-slate-500">Administrator</p>
					</div>
				</div>
				
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white p-6 rounded-lg shadow">
						<h3 className="text-slate-500 text-sm">Total Users</h3>
						<p className="text-2xl font-bold text-slate-900">1,247</p>
					</div>
					<div className="bg-white p-6 rounded-lg shadow">
						<h3 className="text-slate-500 text-sm">Total Courses</h3>
						<p className="text-2xl font-bold text-slate-900">156</p>
					</div>
					<div className="bg-white p-6 rounded-lg shadow">
						<h3 className="text-slate-500 text-sm">Total Revenue</h3>
						<p className="text-2xl font-bold text-green-600">$45,230</p>
					</div>
					<div className="bg-white p-6 rounded-lg shadow">
						<h3 className="text-slate-500 text-sm">Active Sessions</h3>
						<p className="text-2xl font-bold text-blue-600">89</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* User Management */}
					<div className="bg-white rounded-lg shadow">
						<div className="p-6 border-b border-slate-200">
							<h2 className="text-xl font-semibold text-slate-900">Recent Users</h2>
						</div>
						<div className="p-6">
							<div className="space-y-4">
								{users.map(user => (
									<div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
										<div>
											<h3 className="font-medium text-slate-900">{user.name}</h3>
											<p className="text-sm text-slate-600">{user.email}</p>
											<div className="flex items-center space-x-2 mt-1">
												<span className={`px-2 py-1 rounded text-xs ${
													user.role === 'instructor' 
														? 'bg-purple-100 text-purple-800' 
														: 'bg-blue-100 text-blue-800'
												}`}>
													{user.role}
												</span>
												<span className={`px-2 py-1 rounded text-xs ${
													user.status === 'active' 
														? 'bg-green-100 text-green-800' 
														: 'bg-red-100 text-red-800'
												}`}>
													{user.status}
												</span>
											</div>
										</div>
										<div className="text-right">
											<p className="text-sm text-slate-500">Joined {user.joined}</p>
											<button className="text-cyan-600 hover:text-cyan-700 text-sm mt-1">
												View Details
											</button>
										</div>
									</div>
								))}
							</div>
							<div className="mt-6">
								<Link to="/admin/users" className="text-cyan-600 hover:text-cyan-700 font-medium">
									View All Users →
								</Link>
							</div>
						</div>
					</div>

					{/* Course Management */}
					<div className="bg-white rounded-lg shadow">
						<div className="p-6 border-b border-slate-200">
							<h2 className="text-xl font-semibold text-slate-900">Recent Courses</h2>
						</div>
						<div className="p-6">
							<div className="space-y-4">
								{courses.map(course => (
									<div key={course.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
										<div>
											<h3 className="font-medium text-slate-900">{course.title}</h3>
											<p className="text-sm text-slate-600">by {course.instructor}</p>
											<div className="flex items-center space-x-4 mt-1">
												<span className={`px-2 py-1 rounded text-xs ${
													course.status === 'published' 
														? 'bg-green-100 text-green-800' 
														: 'bg-yellow-100 text-yellow-800'
												}`}>
													{course.status}
												</span>
												<span className="text-sm text-slate-600">{course.students} students</span>
												<span className="text-sm text-green-600">${course.revenue}</span>
											</div>
										</div>
										<div className="text-right">
											<button className="text-cyan-600 hover:text-cyan-700 text-sm">
												Review
											</button>
										</div>
									</div>
								))}
							</div>
							<div className="mt-6">
								<Link to="/admin/courses" className="text-cyan-600 hover:text-cyan-700 font-medium">
									View All Courses →
								</Link>
							</div>
						</div>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="mt-8 bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<Link to="/admin/users" className="bg-blue-500 text-white p-4 rounded-lg text-center hover:bg-blue-600 transition">
							<div className="text-2xl mb-2">👥</div>
							<div className="font-medium">Manage Users</div>
						</Link>
						<Link to="/admin/courses" className="bg-green-500 text-white p-4 rounded-lg text-center hover:bg-green-600 transition">
							<div className="text-2xl mb-2">📚</div>
							<div className="font-medium">Review Courses</div>
						</Link>
						<Link to="/admin/analytics" className="bg-purple-500 text-white p-4 rounded-lg text-center hover:bg-purple-600 transition">
							<div className="text-2xl mb-2">📊</div>
							<div className="font-medium">View Analytics</div>
						</Link>
						<Link to="/admin/settings" className="bg-slate-500 text-white p-4 rounded-lg text-center hover:bg-slate-600 transition">
							<div className="text-2xl mb-2">⚙️</div>
							<div className="font-medium">Settings</div>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
