import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './shared/Sidebar';
import TopBar from './shared/TopBar';
import { useAuth } from '../context/AuthContext';

const HubLayout = ({ title }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    if (title) return title;
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/orders/')) return 'Order Details';
    if (path.startsWith('/orders')) return 'Orders';
    if (path.startsWith('/delivery-partners')) return 'Delivery Partners';
    if (path.startsWith('/customers')) return 'Customers';
    if (path.startsWith('/status-updates')) return 'Status Updates';
    if (path.startsWith('/profile')) return 'Profile';
    if (path.startsWith('/my-orders')) return 'My Orders';
    return 'Curozip Hub';
  };

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen bg-cz-dark-bg overflow-hidden">
      <Sidebar onCollapseChange={setCollapsed} />
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 overflow-hidden"
        style={{ marginLeft: collapsed ? '5rem' : '15rem' }}
      >
        <TopBar title={getPageTitle()} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-cz-dark-bg p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HubLayout;
