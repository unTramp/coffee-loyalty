import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { CustomerHome } from './pages/CustomerHome';
import { Login } from './pages/Login';
import { BaristaHome } from './pages/BaristaHome';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminCustomers } from './pages/AdminCustomers';
import { AdminStaff } from './pages/AdminStaff';
import { AdminLogs } from './pages/AdminLogs';
import { ReactNode } from 'react';

function ProtectedRoute({ children, requiredRole }: { children: ReactNode; requiredRole?: string }) {
  const { staff } = useAuthStore();
  if (!staff) return <Navigate to="/login" replace />;
  if (requiredRole && staff.role !== requiredRole) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/customer/:customerId" element={<CustomerHome />} />
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

      {/* Default */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
