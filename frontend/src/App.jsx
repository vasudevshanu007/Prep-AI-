import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { refreshSession } from './redux/slices/authSlice';

// Non-lazy: tiny components needed immediately on every page load
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
// Each dynamic import creates a separate chunk — Monaco Editor (~3 MB) only
// loads when the user actually navigates to /coding.

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

const StudentDashboard = lazy(() => import('./pages/dashboard/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));

const GenerateQuestions = lazy(() => import('./pages/interview/GenerateQuestions'));
const InterviewResult = lazy(() => import('./pages/interview/InterviewResult'));
const MockInterview = lazy(() => import('./pages/interview/MockInterview'));
const VoiceInterview = lazy(() => import('./pages/interview/VoiceInterview'));

const ResumeAnalysis = lazy(() => import('./pages/resume/ResumeAnalysis'));
const ATSMatcher = lazy(() => import('./pages/resume/ATSMatcher'));

// CodingModule contains Monaco Editor — the heaviest page (~3 MB)
const CodingModule  = lazy(() => import('./pages/coding/CodingModule'));
const DSASheets     = lazy(() => import('./pages/coding/DSASheets'));
const DSAProgress   = lazy(() => import('./pages/coding/DSAProgress'));
const DSARoadmaps   = lazy(() => import('./pages/coding/DSARoadmaps'));
const DSAContests   = lazy(() => import('./pages/coding/DSAContests'));

const CompanyInterview = lazy(() => import('./pages/interview/CompanyInterview'));

const Analytics = lazy(() => import('./pages/analytics/Analytics'));

const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));

// ─── Route-level suspense fallback ───────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <LoadingSpinner size="lg" text="Loading..." />
  </div>
);

// ─── Admin/student routing ────────────────────────────────────────────────────
function DashboardRoute() {
  const { user } = useSelector((s) => s.auth);
  return user?.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />;
}

export default function App() {
  const dispatch = useDispatch();

  // On every page load, exchange the httpOnly refresh cookie for a fresh access
  // token. ProtectedRoute renders a spinner until this promise resolves.
  useEffect(() => {
    dispatch(refreshSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1f2937' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1f2937' } },
        }}
      />

      {/* Suspense wraps the entire route tree so any lazy page shows the spinner */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ── Protected routes with sidebar layout ── */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard — wrapped in its own error boundary */}
            <Route
              path="dashboard"
              element={
                <ErrorBoundary>
                  <DashboardRoute />
                </ErrorBoundary>
              }
            />

            {/* Interview */}
            <Route
              path="interview/generate"
              element={<ErrorBoundary><GenerateQuestions /></ErrorBoundary>}
            />
            <Route
              path="interview/result/:id"
              element={<ErrorBoundary><InterviewResult /></ErrorBoundary>}
            />
            <Route
              path="interview/mock"
              element={<ErrorBoundary><MockInterview /></ErrorBoundary>}
            />
            <Route
              path="interview/voice"
              element={<ErrorBoundary><VoiceInterview /></ErrorBoundary>}
            />
            <Route
              path="interview/companies"
              element={<ErrorBoundary><CompanyInterview /></ErrorBoundary>}
            />

            {/* Resume */}
            <Route
              path="resume"
              element={<ErrorBoundary><ResumeAnalysis /></ErrorBoundary>}
            />
            <Route
              path="ats"
              element={<ErrorBoundary><ATSMatcher /></ErrorBoundary>}
            />

            {/* Coding / DSA Platform */}
            <Route path="coding"           element={<ErrorBoundary><CodingModule /></ErrorBoundary>} />
            <Route path="coding/sheets"    element={<ErrorBoundary><DSASheets /></ErrorBoundary>} />
            <Route path="coding/sheets/:slug" element={<ErrorBoundary><DSASheets /></ErrorBoundary>} />
            <Route path="coding/progress"  element={<ErrorBoundary><DSAProgress /></ErrorBoundary>} />
            <Route path="coding/roadmaps"  element={<ErrorBoundary><DSARoadmaps /></ErrorBoundary>} />
            <Route path="coding/contests"  element={<ErrorBoundary><DSAContests /></ErrorBoundary>} />

            {/* Analytics */}
            <Route
              path="analytics"
              element={<ErrorBoundary><Analytics /></ErrorBoundary>}
            />

            {/* History & Settings */}
            <Route path="history" element={<ErrorBoundary><History /></ErrorBoundary>} />
            <Route path="settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />

            {/* Admin */}
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <ErrorBoundary>
                    <AdminDashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
