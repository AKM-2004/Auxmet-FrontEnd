import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Lazy load pages for code splitting
const PreLoginPage = lazy(() => import('./pages/PreLoginPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const PostLoginPage = lazy(() => import('./pages/PostLoginPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const InterviewStartPage = lazy(() => import('./pages/InterviewStartPage'))
const InterviewSessionPage = lazy(() => import('./pages/InterviewSessionPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const ResultDashboard = lazy(() => import('./pages/ResultDashboard'))

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400"></div>
  </div>
)

function App() {
  return (
    <Router>
      <div className="App">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<PreLoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/pre-login" element={<PreLoginPage />} />
            <Route path="/dashboard" element={<PostLoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/interview" element={<InterviewStartPage />} />
            <Route path="/interview-session" element={<InterviewSessionPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/result/:id" element={<ResultDashboard />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  )
}

export default App
