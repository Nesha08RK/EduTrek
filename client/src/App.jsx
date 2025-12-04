import './App.css'
import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import axios from 'axios'

import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AnimatedBackground from './components/AnimatedBackground'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Checkout from './pages/Checkout'
import StudentDashboard from './pages/StudentDashboard'
import InstructorDashboard from './pages/InstructorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Games from './pages/Games'
import ChatbotPage from './pages/ChatbotPage'
import Quiz from './pages/Quiz'
import CourseAssessment from './components/CourseAssessment'
import CourseCertificate from './components/CourseCertificate'

function App() {

  // 🔥 Test Backend connectivity
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/health`)
      .then(res => console.log("Backend Response:", res.data))
      .catch(err => console.error("API Error:", err));
  }, []);

  return (
    <AuthProvider>
      <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
        <AnimatedBackground />
        <Navigation />

        <main className="flex-1 w-screen pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/course/:id" element={<CourseDetail />} />

            <Route
              path="/course/:courseId/assessment"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CourseAssessment />
                </ProtectedRoute>
              }
            />

            <Route
              path="/course/:courseId/certificate"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CourseCertificate />
                </ProtectedRoute>
              }
            />

            <Route
              path="/checkout/:id"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/quiz"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Quiz />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/instructor-dashboard"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/games" element={<Games />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
