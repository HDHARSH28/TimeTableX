import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  LogOut, 
  Menu, 
  X,
  Clock
} from 'lucide-react';
import { authAPI } from '../services/api';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = authAPI.getCurrentUser();

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/departments', label: 'Departments', icon: Building2 },
    { to: '/faculty', label: 'Faculty', icon: Users },
    { to: '/classrooms', label: 'Classrooms', icon: GraduationCap },
    { to: '/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/timetables', label: 'Timetables', icon: Calendar },
  ];

  return (
    <div className="app-container">
      {/* Mobile Header Banner */}
      <header className="mobile-header">
        <div className="sidebar-logo" style={{ margin: 0, padding: 0 }}>
          <Clock className="sidebar-logo-icon" />
          <span className="sidebar-logo-text">TimeTableX</span>
        </div>
        <button 
          className="btn-icon" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle Navigation"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div>
          <div className="sidebar-logo">
            <Clock className="sidebar-logo-icon" />
            <span className="sidebar-logo-text">TimeTableX</span>
          </div>

          <nav>
            <ul className="sidebar-menu">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink 
                    to={item.to} 
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="sidebar-link-icon" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="sidebar-footer">
          {currentUser && (
            <div className="user-profile">
              <div className="user-avatar">
                {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{currentUser?.username || 'User'}</span>
                <span className="badge badge-role" style={{ fontSize: '0.65rem', marginTop: '2px', padding: '2px 6px', display: 'inline-block', width: 'fit-content' }}>
                  {currentUser?.role || 'Guest'}
                </span>
              </div>
            </div>
          )}

          <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
