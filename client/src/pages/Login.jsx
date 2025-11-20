import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
	const [formData, setFormData] = useState({
		email: '',
		password: ''
	});
	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
		// Clear error when user starts typing
		if (errors[name]) {
			setErrors(prev => ({
				...prev,
				[name]: ''
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.email) {
			newErrors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Email is invalid';
		}

		if (!formData.password) {
			newErrors.password = 'Password is required';
		} else if (formData.password.length < 6) {
			newErrors.password = 'Password must be at least 6 characters';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!validateForm()) return;

		setIsLoading(true);
		const result = await login(formData.email, formData.password);
		setIsLoading(false);

		if (result.success) {
			// Redirect based on user role
			const { role } = result.user || { role: 'student' };
			switch (role) {
				case 'instructor':
					navigate('/instructor-dashboard');
					break;
				case 'admin':
					navigate('/admin-dashboard');
					break;
				default:
					navigate('/student-dashboard');
			}
		} else {
			setErrors({ general: result.message || 'Login failed. Please check your credentials.' });
		}
	};

	return (
		<div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
						Sign in to your account
					</h2>
					<p className="mt-2 text-center text-sm text-slate-600">
						Or{' '}
						<Link to="/register" className="font-medium text-cyan-600 hover:text-cyan-500">
							create a new account
						</Link>
					</p>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="rounded-md shadow-sm -space-y-px">
						<div>
							<label htmlFor="email" className="sr-only">
								Email address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
									errors.email ? 'border-red-300' : 'border-slate-300'
								} placeholder-slate-500 text-slate-900 rounded-t-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm`}
								placeholder="Email address"
								value={formData.email}
								onChange={handleChange}
							/>
							{errors.email && (
								<p className="mt-1 text-sm text-red-600">{errors.email}</p>
							)}
						</div>
						<div>
							<label htmlFor="password" className="sr-only">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
									errors.password ? 'border-red-300' : 'border-slate-300'
								} placeholder-slate-500 text-slate-900 rounded-b-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm`}
								placeholder="Password"
								value={formData.password}
								onChange={handleChange}
							/>
							{errors.password && (
								<p className="mt-1 text-sm text-red-600">{errors.password}</p>
							)}
						</div>
					</div>

					{errors.general && (
						<div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
							{errors.general}
						</div>
					)}

					<div>
						<button
							type="submit"
							disabled={isLoading}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<div className="flex items-center">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Signing in...
								</div>
							) : (
								'Sign in'
							)}
						</button>
					</div>

					<div className="flex items-center justify-between">
						<div className="text-sm">
							<Link to="/forgot-password" className="font-medium text-cyan-600 hover:text-cyan-500">
								Forgot your password?
							</Link>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
