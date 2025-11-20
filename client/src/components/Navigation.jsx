import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/student-dashboard';
    switch (user.role) {
      case 'instructor':
        return '/instructor-dashboard';
      case 'admin':
        return '/admin-dashboard';
      default:
        return '/student-dashboard';
    }
  };

  const showQuizLink = !user || user.role !== 'instructor';

  return (
    <nav className="w-full bg-gradient-to-r from-blue-900 to-cyan-800 shadow-lg z-50 fixed top-0 left-0">
      {/* Full-width container */}
      <div className="w-full flex justify-between items-center h-16 px-6">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-white">
          EduTrek
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-white/90 hover:text-white transition">Home</Link>
          <Link to="/courses" className="text-white/90 hover:text-white transition">Courses</Link>
          <Link to="/games" className="text-white/90 hover:text-white transition">Games</Link>
          {showQuizLink && (
            <Link to="/quiz" className="text-white/90 hover:text-white transition">Quiz</Link>
          )}
          <Link to="/chatbot" className="text-white/90 hover:text-white transition">AI Assistant</Link>

          {user ? (
            <div className="flex items-center space-x-4">
              <Link
                to={getDashboardLink()}
                className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition"
              >
                Dashboard
              </Link>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-white/90 hover:text-white transition"
                >
                  {user.name} ({user.role}) ▼
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 text-sm text-slate-500 border-b">
                      Signed in as {user.name}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-white/90 hover:text-white transition">Login</Link>
              <Link
                to="/register"
                className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md w-full px-6 py-4 shadow-lg">
          <div className="flex flex-col space-y-4">
            <Link to="/" className="text-slate-700 hover:text-slate-900 transition">Home</Link>
            <Link to="/courses" className="text-slate-700 hover:text-slate-900 transition">Courses</Link>
            <Link to="/games" className="text-slate-700 hover:text-slate-900 transition">Games</Link>
            {showQuizLink && (
              <Link to="/quiz" className="text-slate-700 hover:text-slate-900 transition">Quiz</Link>
            )}
            <Link to="/chatbot" className="text-slate-700 hover:text-slate-900 transition">AI Assistant</Link>

            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition text-center"
                >
                  Dashboard
                </Link>
                <div className="border-t pt-4">
                  <div className="px-4 py-2 text-sm text-slate-500 border-b">
                    Signed in as {user.name}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left py-2 text-red-600 hover:bg-red-50 rounded px-2"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/login"
                  className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition text-center"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="border border-cyan-500 text-cyan-500 px-6 py-2 rounded-lg hover:bg-cyan-50 transition text-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
