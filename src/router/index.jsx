import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HubLayout from '../components/HubLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import OrdersPage from '../pages/OrdersPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import DeliveryPartnersPage from '../pages/DeliveryPartnersPage';
import CustomersPage from '../pages/CustomersPage';
import StatusUpdatesPage from '../pages/StatusUpdatesPage';
import ProfilePage from '../pages/ProfilePage';
import MyOrdersPage from '../pages/MyOrdersPage';
import TrackingPage from '../pages/TrackingPage';
import NotFoundPage from '../pages/NotFoundPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-cz-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cz-accent-orange border-t-transparent rounded-full animate-spin" />
          <p className="text-cz-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.role === 'super_admin') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-cz-dark-bg text-cz-text-primary p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
        <p className="text-cz-text-secondary">Super admins must use the Admin Portal.</p>
        <a href="https://curozip-admin.vercel.app" className="mt-4 px-4 py-2 bg-cz-accent-orange text-white rounded-lg text-sm">Go to Admin Portal</a>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'hub_manager') {
      return <Navigate to="/dashboard" replace />;
    } else if (user?.role === 'delivery_partner') {
      return <Navigate to="/my-orders" replace />;
    }
  }

  return children;
};

const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'delivery_partner') return <Navigate to="/my-orders" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AppRouter = () => {
  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/track" element={<TrackingPage />} />

      {/* Root redirect */}
      <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

      {/* Protected routes inside HubLayout */}
      <Route element={<HubLayout />}>
        {/* Hub Manager Routes */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['hub_manager']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute allowedRoles={['hub_manager']}><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={['hub_manager']}><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/delivery-partners" element={<ProtectedRoute allowedRoles={['hub_manager']}><DeliveryPartnersPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute allowedRoles={['hub_manager']}><CustomersPage /></ProtectedRoute>} />
        <Route path="/status-updates" element={<ProtectedRoute allowedRoles={['hub_manager']}><StatusUpdatesPage /></ProtectedRoute>} />

        {/* Delivery Partner Routes */}
        <Route path="/my-orders" element={<ProtectedRoute allowedRoles={['delivery_partner']}><MyOrdersPage /></ProtectedRoute>} />

        {/* Shared Routes */}
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['hub_manager', 'delivery_partner']}><ProfilePage /></ProtectedRoute>} />
      </Route>

      {/* 404 — show proper NotFound page instead of redirecting */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
