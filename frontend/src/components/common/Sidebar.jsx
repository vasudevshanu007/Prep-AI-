import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { authAPI } from '../../services/api';
import {
  RiDashboardLine, RiRobotLine, RiMicLine, RiFileTextLine,
  RiCodeLine, RiBarChartLine, RiHistoryLine, RiSettings3Line,
  RiLogoutBoxLine, RiAdminLine, RiUser3Line, RiShieldStarLine,
  RiBuildingLine, RiScanLine, RiBook2Line, RiLayoutGridLine,
  RiRoadMapLine, RiTrophyLine,
} from 'react-icons/ri';

const studentLinks = [
  { path: '/dashboard',            icon: RiDashboardLine,  label: 'Dashboard' },
  { path: '/interview/generate',   icon: RiRobotLine,      label: 'AI Interview' },
  { path: '/interview/companies',  icon: RiBuildingLine,   label: 'Company Interviews' },
  { path: '/interview/mock',       icon: RiMicLine,        label: 'Mock Chat' },
  { path: '/interview/voice',      icon: RiMicLine,        label: 'Voice Interview' },
  { path: '/resume',               icon: RiFileTextLine,   label: 'Resume Analysis' },
  { path: '/ats',                  icon: RiScanLine,       label: 'ATS Matcher' },
  { path: '/coding',               icon: RiCodeLine,       label: 'DSA Arena' },
  { path: '/coding/sheets',        icon: RiBook2Line,      label: 'DSA Sheets' },
  { path: '/coding/progress',      icon: RiLayoutGridLine, label: 'My Progress' },
  { path: '/coding/roadmaps',      icon: RiRoadMapLine,    label: 'Roadmaps' },
  { path: '/coding/contests',      icon: RiTrophyLine,     label: 'Contests' },
  { path: '/analytics',            icon: RiBarChartLine,   label: 'Analytics' },
  { path: '/history',              icon: RiHistoryLine,    label: 'History' },
];

const adminLinks = [
  { path: '/admin', icon: RiAdminLine, label: 'Admin Dashboard' },
];

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [avatarError, setAvatarError] = useState(false);
  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch { /* best-effort — still clear local state */ }
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-800">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
            P
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">PrepAI</h1>
            <p className="text-gray-500 text-xs">Interview Prep</p>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold flex-shrink-0">
            {user?.avatar && !avatarError ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-gray-100 font-medium text-sm truncate">{user?.name}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <RiShieldStarLine className="text-yellow-400 text-sm" />
          <span className="text-yellow-400 text-xs font-semibold">{user?.stats?.xp || 0} XP</span>
          <span className="text-gray-600 text-xs">•</span>
          <span className="text-gray-400 text-xs">{user?.stats?.streak || 0} day streak</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Icon className="text-lg flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        <Link to="/settings" onClick={onClose} className="sidebar-link">
          <RiSettings3Line className="text-lg" />
          <span>Settings</span>
        </Link>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:bg-red-900/20 hover:text-red-400">
          <RiLogoutBoxLine className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
