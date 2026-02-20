import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { CustomerHome } from './pages/CustomerHome';
import { Join } from './pages/Join';
import { Login } from './pages/Login';
import { BaristaHome } from './pages/BaristaHome';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminCustomers } from './pages/AdminCustomers';
import { AdminStaff } from './pages/AdminStaff';
import { AdminLogs } from './pages/AdminLogs';
import { ReactNode, useEffect } from 'react';

const LAST_PATH_KEY = 'coffee-lastPath';

/** Save current path so PWA can reopen on the same screen */
function useRememberPath() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Only remember meaningful pages, not root or login
    if (pathname !== '/' && pathname !== '/login' && pathname !== '/join') {
      localStorage.setItem(LAST_PATH_KEY, pathname);
    }
  }, [pathname]);
}

function SmartRedirect() {
  const lastPath = localStorage.getItem(LAST_PATH_KEY);
  if (lastPath) {
    return <Navigate to={lastPath} replace />;
  }
  const customerId = localStorage.getItem('coffee-customerId');
  if (customerId) {
    return <Navigate to={`/customer/${customerId}`} replace />;
  }
  return <Navigate to="/join" replace />;
}

function ProtectedRoute({ children, requiredRole }: { children: ReactNode; requiredRole?: string }) {
  const { staff } = useAuthStore();
  if (!staff) return <Navigate to="/login" replace />;
  if (requiredRole && staff.role !== requiredRole) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  useRememberPath();

  return (
    <Routes>
      {/* Public */}
      <Route path="/customer/:customerId" element={<CustomerHome />} />
      <Route path="/join" element={<Join />} />
      <Route path="/login" element={<Login />} />

      {/* Barista */}
      <Route path="/barista" element={
        <ProtectedRoute>
          <BaristaHome />
        </ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/customers" element={
        <ProtectedRoute requiredRole="admin">
          <AdminCustomers />
        </ProtectedRoute>
      } />
      <Route path="/admin/staff" element={
        <ProtectedRoute requiredRole="admin">
          <AdminStaff />
        </ProtectedRoute>
      } />
      <Route path="/admin/logs" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLogs />
        </ProtectedRoute>
      } />

      {/* Default — redirect based on saved session */}
      <Route path="*" element={<SmartRedirect />} />
    </Routes>
  );
}
