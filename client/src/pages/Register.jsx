import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		role: 'student'
	});
	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const { register } = useAuth();
	const navigate = useNavigate();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
		if (errors[name]) {
			setErrors(prev => ({
				...prev,
				[name]: ''
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.name.trim()) newErrors.name = 'Name is required';
		else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

		if (!formData.email) newErrors.email = 'Email is required';
		else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

		if (!formData.password) newErrors.password = 'Password is required';
		else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

		if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
		else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		setIsLoading(true);
		const result = await register(formData);
		setIsLoading(false);

		if (result.success) {
			switch (formData.role) {
				case 'instructor': navigate('/instructor-dashboard'); break;
				case 'admin': navigate('/admin-dashboard'); break;
				default: navigate('/student-dashboard');
			}
		} else {
			setErrors({ general: result.message || 'Registration failed. Please try again.' });
		}
	};

	return (
		<div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
						Create your account
					</h2>
					<p className="mt-2 text-center text-sm text-slate-600">
						Or{' '}
						<Link to="/login" className="font-medium text-cyan-600 hover:text-cyan-500">
							sign in to your existing account
						</Link>
					</p>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="space-y-4">
						{/* Name Input */}
						<div>
							<label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
							<input
								id="name"
								name="name"
								type="text"
								autoComplete="name"
								required
								className={`mt-1 block w-full px-3 py-2 border rounded-md placeholder-slate-500 text-slate-900 bg-gray-50 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm ${errors.name ? 'border-red-300' : 'border-slate-300'}`}
								placeholder="Enter your full name"
								value={formData.name}
								onChange={handleChange}
							/>
							{errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
						</div>

						{/* Email Input */}
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								className={`mt-1 block w-full px-3 py-2 border rounded-md placeholder-slate-500 text-slate-900 bg-gray-50 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm ${errors.email ? 'border-red-300' : 'border-slate-300'}`}
								placeholder="Enter your email"
								value={formData.email}
								onChange={handleChange}
							/>
							{errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
						</div>

						{/* Role Select */}
						<div>
							<label htmlFor="role" className="block text-sm font-medium text-slate-700">Role</label>
							<select
								id="role"
								name="role"
								className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md bg-gray-50 text-slate-900 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
								value={formData.role}
								onChange={handleChange}
							>
								<option value="student">Student</option>
								<option value="instructor">Instructor</option>
							</select>
						</div>

						{/* Password */}
						<div>
							<label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="new-password"
								required
								className={`mt-1 block w-full px-3 py-2 border rounded-md placeholder-slate-500 text-slate-900 bg-gray-50 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm ${errors.password ? 'border-red-300' : 'border-slate-300'}`}
								placeholder="Create a password"
								value={formData.password}
								onChange={handleChange}
							/>
							{errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
						</div>

						{/* Confirm Password */}
						<div>
							<label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm Password</label>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								autoComplete="new-password"
								required
								className={`mt-1 block w-full px-3 py-2 border rounded-md placeholder-slate-500 text-slate-900 bg-gray-50 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm ${errors.confirmPassword ? 'border-red-300' : 'border-slate-300'}`}
								placeholder="Confirm your password"
								value={formData.confirmPassword}
								onChange={handleChange}
							/>
							{errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
						</div>
					</div>

					{/* General Error */}
					{errors.general && (
						<div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
							{errors.general}
						</div>
					)}

					{/* Submit Button */}
					<div>
						<button
							type="submit"
							disabled={isLoading}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<div className="flex items-center">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Creating account...
								</div>
							) : (
								'Create account'
							)}
						</button>
					</div>

					{/* Terms */}
					<div className="text-center">
						<p className="text-sm text-slate-600">
							By creating an account, you agree to our{' '}
							<Link to="/terms" className="font-medium text-cyan-600 hover:text-cyan-500">Terms of Service</Link>{' '}
							and{' '}
							<Link to="/privacy" className="font-medium text-cyan-600 hover:text-cyan-500">Privacy Policy</Link>
						</p>
					</div>
				</form>
			</div>
		</div>
	);
}
