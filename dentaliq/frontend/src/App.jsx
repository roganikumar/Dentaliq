// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/layout/Sidebar';
import AuthPage from './components/auth/AuthPage';
import PatientsPage from './components/patients/PatientsPage';
import ChatPage from './components/chat/ChatPage';

// Protected layout — shows sidebar, redirects if not authenticated
function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

// Public route — redirect to /patients if already logged in
function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/patients" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/patients" replace />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:patientId" element={<ChatPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { fontFamily: 'var(--font-body)', fontSize: 14, borderRadius: 10, boxShadow: 'var(--shadow-md)' },
          success: { iconTheme: { primary: '#0d9488', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  );
}
