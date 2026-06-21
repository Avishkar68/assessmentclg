import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, User as UserIcon, ChevronDown, Bell, Check, Loader2, Sun, Moon } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import notificationService from '../../services/notificationService';

export const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  // Derive page title from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/questions')) return 'Question Bank';
    if (path.includes('/exams/create')) return 'Create Exam';
    if (path.includes('/exams')) return 'Exams';
    if (path.includes('/evaluation')) return 'Evaluations Queue';
    if (path.includes('/results')) return 'Results Ledger';
    if (path.includes('/analytics')) return 'Performance Analytics';
    if (path.includes('/profile')) return 'User Profile';
    if (path.includes('/teachers')) return 'Teachers Registry';
    if (path.includes('/students')) return 'Students Registry';
    return 'Portal';
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      if (response && response.success) {
        setNotifications(response.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Initial fetch and 30s background polling
  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDays}d ago`;
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await notificationService.markRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      }
      setNotificationsOpen(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (loadingNotifications) return;
    setLoadingNotifications(true);
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="h-[72px] border-b border-neutral-200 bg-white sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Left: Mobile hamburger menu & Section Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg md:hidden cursor-pointer transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 hidden sm:block">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right: Notifications & User Profile Menu */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-full cursor-pointer transition-all duration-200 group text-neutral-500 hover:text-neutral-900"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4.5 h-4.5 transition-transform group-hover:rotate-45 duration-300" />
          ) : (
            <Moon className="w-4.5 h-4.5 transition-transform group-hover:-rotate-12 duration-300" />
          )}
        </button>

        {/* Notification Bell Dropdown */}
        {user && (
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-full cursor-pointer transition-all duration-200 group text-neutral-500 hover:text-neutral-900"
              aria-label="View notifications"
            >
              <Bell className="w-4.5 h-4.5 transition-transform group-hover:rotate-12 duration-200" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-[16px] bg-white border border-neutral-200 shadow-lg z-50 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      disabled={loadingNotifications}
                      className="text-xs font-semibold text-neutral-900 hover:underline disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {loadingNotifications ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Notification Items List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-neutral-400 text-xs">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      return (
                        <div
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 flex gap-3 hover:bg-neutral-50 transition-colors cursor-pointer select-none relative ${
                            !notif.isRead ? 'bg-neutral-50/50' : ''
                          }`}
                        >
                          {/* Unread marker dot */}
                          {!notif.isRead && (
                            <span className="absolute top-4.5 right-4 w-2 h-2 rounded-full bg-neutral-950"></span>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border leading-none bg-white text-neutral-600 border-neutral-200">
                                {notif.title}
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                {formatRelativeTime(notif.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-700 font-normal leading-normal">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Profile Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-full cursor-pointer transition-colors"
          >
            {user?.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt={user.name} 
                className="w-7 h-7 rounded-full object-cover border border-neutral-200"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center text-[10px] font-bold text-white">
                {getInitials(user?.name)}
              </div>
            )}
            <span className="text-xs font-semibold text-neutral-800 hidden md:block select-none px-1">
              {user?.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden md:block" />
          </button>

          {/* Dropdown Menu Cards */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-56 rounded-[16px] bg-white border border-neutral-200 shadow-lg z-50 p-2 animate-[fadeIn_0.15s_ease-out]">
              {/* Header info */}
              <div className="px-3.5 py-2.5 border-b border-neutral-100 mb-1">
                <p className="text-xs font-bold text-neutral-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
                <span className="inline-block mt-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200 rounded">
                  {user?.role}
                </span>
              </div>

              {/* Menu Links */}
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(`/${user?.role}/profile`);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg cursor-pointer transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-neutral-400" />
                  <span>View Profile</span>
                </button>
                
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
