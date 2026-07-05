import React, { useState } from 'react';
import { Bell, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ title, breadcrumb }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, hubName, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = user?.role || '';
  const displayRole = userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  const subtitle = hubName ? `${hubName} · ${displayRole}` : displayRole;

  return (
    <header className="sticky top-0 h-16 bg-cz-nav-bg border-b border-cz-accent-orange z-40 flex items-center justify-between px-6 transition-all duration-300 w-full">
      {/* Left side */}
      <div>
        <h1 className="text-white text-xl font-bold">{title}</h1>
        <div className="text-cz-text-secondary text-xs mt-0.5">
          {breadcrumb ? breadcrumb : subtitle}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-6">
        <button className="relative text-cz-text-secondary hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-cz-nav-bg">
            3
          </span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-cz-card-bg border border-cz-border flex items-center justify-center text-cz-accent-orange">
              <User size={16} />
            </div>
            <span className="text-sm font-medium hidden md:block text-cz-text-primary">{user?.name || 'User'}</span>
            <ChevronDown size={16} className="text-cz-text-secondary hidden md:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-cz-card-bg border border-cz-border rounded-lg shadow-xl py-1 z-50">
              <button onClick={() => { setDropdownOpen(false); navigate('/profile'); }} className="w-full text-left px-4 py-2 text-sm text-cz-text-primary hover:bg-white/5 transition-colors flex items-center">
                <User size={16} className="mr-2 text-cz-text-secondary" />
                Profile
              </button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center">
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
