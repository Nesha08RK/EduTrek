import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
		// Redirect to appropriate dashboard based on user role
		switch (user.role) {
			case 'instructor':
				return <Navigate to="/instructor-dashboard" replace />;
			case 'admin':
				return <Navigate to="/admin-dashboard" replace />;
			default:
				return <Navigate to="/student-dashboard" replace />;
		}
	}

	return children;
}
