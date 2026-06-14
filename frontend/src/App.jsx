import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import NotFoundPage from './pages/NotFoundPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import ApplyPage from './pages/ApplyPage';
const App = () => {
  const { user } = useAuth();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <ScrollToTop />
      <Navbar />
      {/* ↑ Navbar shows on every page */}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/apply/:id" element={
          <ProtectedRoute allowedRole="candidate"><ApplyPage /></ProtectedRoute>
        } />
        <Route path="/" element={
          user ? <Navigate to="/dashboard" /> : <Navigate to="/jobs" />
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};
export default App;