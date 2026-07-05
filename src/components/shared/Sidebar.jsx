import React, { useState, useEffect } from 'react';
import { Menu, LogOut, LayoutDashboard, Package, Users, Users2, RefreshCw, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const activeRoute = location.pathname;
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = user?.name || 'User';
  const userRole = user?.role || 'Role';
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const navItems = userRole === 'hub_manager' ? [
    {icon: LayoutDashboard, label: "Dashboard", path: "/dashboard"},
    {icon: Package, label: "Orders", path: "/orders"},
    {icon: Users, label: "Delivery Partners", path: "/delivery-partners"},
    {icon: Users2, label: "Customers", path: "/customers"},
    {icon: RefreshCw, label: "Status Updates", path: "/status-updates"},
    {icon: User, label: "My Profile", path: "/profile"}
  ] : [
    {icon: Package, label: "My Orders", path: "/my-orders"},
    {icon: User, label: "My Profile", path: "/profile"}
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-cz-nav-bg border-r border-cz-border transition-all duration-300 z-50 flex flex-col ${isCollapsed ? 'w-20' : 'w-60'}`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-cz-border">
        {!isCollapsed && (
          <img src="https://finixia.in/logo%27s/curozip.png?v=1.4" alt="Curozip" className="h-8 object-contain" />
        )}
        {isCollapsed && (
          <img src="https://finixia.in/logo%27s/curozip-icon.png?v=1.4" alt="Curozip Icon" className="h-8 w-8 mx-auto object-contain" />
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1 rounded text-cz-text-secondary hover:text-cz-text-primary hover:bg-cz-card-bg transition-colors ${isCollapsed ? 'hidden' : 'block'}`}
        >
          <Menu size={20} />
        </button>
      </div>

      {isCollapsed && (
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 mx-auto mt-2 text-cz-text-secondary hover:text-cz-text-primary hover:bg-cz-card-bg rounded transition-colors"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = activeRoute.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <li key={index}>
                <Link 
                  to={item.path}
                  className={`flex items-center px-4 py-3 transition-colors duration-150 group
                    ${isActive 
                      ? 'border-l-[3px] border-cz-accent-orange bg-white/10 text-cz-accent-orange' 
                      : 'border-l-[3px] border-transparent text-cz-text-secondary hover:bg-white/5 hover:text-cz-text-primary'
                    }`}
                >
                  <Icon size={20} className={`${isCollapsed ? 'mx-auto' : 'mr-3'} ${isActive ? 'text-cz-accent-orange' : 'group-hover:text-cz-text-primary'}`} />
                  {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-cz-border">
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-cz-accent-orange text-white flex items-center justify-center font-bold shadow-md">
              {initials}
            </div>
            <button onClick={handleLogout} className="text-cz-text-secondary hover:text-red-400 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-cz-accent-orange text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                {initials}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-cz-text-primary truncate">{userName}</p>
                <p className="text-xs text-cz-text-secondary truncate capitalize">{userRole.replace('_', ' ')}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-cz-text-secondary hover:text-red-400 hover:bg-white/5 rounded transition-colors flex-shrink-0" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
