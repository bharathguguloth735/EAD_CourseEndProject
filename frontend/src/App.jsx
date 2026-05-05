import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import BookingPage from './pages/BookingPage';
import ExperimentDetail from './pages/ExperimentDetail';
import Home from './pages/Home';
import AdminUsers from './pages/AdminUsers';
import Approvals from './pages/Approvals';
import Resources from './pages/Resources';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RoleSelection from './pages/RoleSelection';
import DepartmentSelection from './pages/DepartmentSelection';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("CRITICAL SYSTEM FAILURE:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100vh', background: '#0f172a', color: 'white', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', 
          justifyContent: 'center', padding: '2rem', textAlign: 'center' 
        }}>
          <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '2rem' }} />
          <h1 style={{ fontWeight: 900, letterSpacing: '0.1em', marginBottom: '1rem' }}>SYSTEM DIAGNOSTIC FAILURE</h1>
          <p style={{ color: '#94a3b8', maxWidth: '500px', marginBottom: '2rem' }}>
            The Lab Smart Portal has encountered a critical anomaly in the rendering protocol. 
            Detailed technical logs have been generated.
          </p>
          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', fontSize: '0.8rem', color: '#ef4444', fontFamily: 'monospace' }}>
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.href = '/'} 
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontWeight: 800 }}
          >
            <RefreshCcw size={18} style={{ marginRight: '0.5rem' }} /> REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} />;
  
  // 1. Role Selection Check
  if (user.needsRoleSelection && location.pathname !== '/select-role') {
    return <Navigate to="/select-role" />;
  }

  // 2. Department Selection Check (Staff Only)
  if (user.role?.toLowerCase() === 'staff' && !user.department && location.pathname !== '/select-department') {
    return <Navigate to="/select-department" />;
  }

  if (roles.length && !roles.some(r => r.toLowerCase() === user.role?.toLowerCase())) return <Navigate to="/dashboard" />;
  return children;
};

const PageWrapper = ({ children }) => {
  const location = useLocation();
  const fullWidthPaths = ['/', '/login', '/register', '/forgot-password'];
  const isFull = fullWidthPaths.includes(location.pathname) || location.pathname.startsWith('/reset-password');
  if (isFull) return <>{children}</>;
  return <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>{children}</div>;
};

import { GoogleOAuthProvider } from '@react-oauth/google';

function AppContent() {
  const { user } = useContext(AuthContext);
  const roleLower = user?.role?.toLowerCase() || '';
  const roleClass = roleLower ? `role-theme-${roleLower}` : '';

  return (
    <div className={roleClass} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <PageWrapper>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/select-role" element={<ProtectedRoute><RoleSelection /></ProtectedRoute>} />
          <Route path="/select-department" element={<ProtectedRoute><DepartmentSelection /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/equipment" element={<ProtectedRoute><EquipmentList /></ProtectedRoute>} />
          <Route path="/book/:id" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/experiment/:id" element={<ProtectedRoute roles={['Staff', 'Admin']}><ExperimentDetail /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['Admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/approvals" element={<ProtectedRoute roles={['Admin','Staff']}><Approvals /></ProtectedRoute>} />
        </Routes>
      </PageWrapper>
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <ToastProvider>
          <Router>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
