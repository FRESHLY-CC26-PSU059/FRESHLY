import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import PageFallback from './components/ui/PageFallback';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import PublicRoute from './components/layout/PublicRoute';
import DashboardRedirect from './components/layout/DashboardRedirect';
import AdminLayout from './components/layout/Layout';

// Lazy-loaded pages (code-splitting)
const Landing = lazy(() => import('./pages/Landing'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const VerifyOTPPage = lazy(() => import('./pages/VerifyOTPPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminNotificationPage = lazy(() => import('./pages/AdminNotificationPage'));
const AdminTestimonialPage = lazy(() => import('./pages/AdminTestimonialPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const ScansPage = lazy(() => import('./pages/ScansPage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const KnowledgePage = lazy(() => import('./pages/KnowledgePage'));
const ConversationsPage = lazy(() => import('./pages/ConversationsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EnsiklopediaPage = lazy(() => import('./pages/EnsiklopediaPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const NewsletterPage = lazy(() => import('./pages/NewsletterPage'));

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/ensiklopedia" element={<EnsiklopediaPage />} />
          <Route path="/ensiklopedia/:slug" element={<EnsiklopediaPage />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-otp" element={<VerifyOTPPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              {/* Regular user routes */}
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/user/dashboard" element={<DashboardPage />} />
              <Route path="/user/scans" element={<ScansPage />} />
              <Route path="/user/conversations" element={<ConversationsPage />} />
              <Route path="/user/conversations/:id" element={<ConversationsPage />} />
              <Route path="/user/settings" element={<SettingsPage />} />
              <Route path="/user/profile" element={<ProfilePage />} />

              {/* Admin routes -- all under /admin/* */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/scans" element={<ScansPage />} />
                <Route path="/admin/conversations" element={<ConversationsPage />} />
                <Route path="/admin/conversations/:id" element={<ConversationsPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/roles" element={<RolesPage />} />
                <Route path="/admin/articles" element={<ArticlesPage />} />
                <Route path="/admin/knowledge" element={<KnowledgePage />} />
                <Route path="/admin/testimonials" element={<AdminTestimonialPage />} />
                <Route path="/admin/notifications" element={<AdminNotificationPage />} />
                <Route path="/admin/newsletter" element={<NewsletterPage />} />
                <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route path="/admin/profile" element={<ProfilePage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
