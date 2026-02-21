import { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { useFilters } from '../context/FilterContext';
import { Bell, Settings, X, CheckCircle, Clock, AlertTriangle, Info, ExternalLink, Menu, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../services/api';

const Layout = ({ children, title }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [previousCount, setPreviousCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const filterRef = useRef(null);
  const { selectedMonth, selectedYear, updateMonth, updateYear, setPresetRange, dateRange } = useFilters();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (showDropdown) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      const newCount = response.data.unreadCount || 0;

      // Show toast if count increased (new notification)
      if (newCount > previousCount && previousCount > 0) {
        showNewNotificationToast();
      }

      setPreviousCount(newCount);
      setUnreadCount(newCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll({ limit: 10 });
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const showNewNotificationToast = async () => {
    try {
      // Fetch the latest notification
      const response = await notificationsAPI.getAll({ limit: 1, isRead: false });
      const latestNotif = response.data.data?.[0];

      if (latestNotif) {
        const toastId = Date.now();
        setToasts(prev => [...prev, { id: toastId, notification: latestNotif }]);

        // Auto-remove toast after 5 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 5000);
      }
    } catch (error) {
      console.error('Error showing toast:', error);
    }
  };

  const handleBellClick = async () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      await fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n =>
        n._id === id ? { ...n, isRead: true } : n
      ));
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    setShowDropdown(false);

    // Navigate to related page
    if (notification.taskId) {
      navigate('/tasks');
    } else if (notification.leadId || notification.relatedToModel === 'Lead' || notification.relatedToModel === 'FollowUp') {
      const leadId = notification.leadId?._id || notification.leadId;
      if (leadId) {
          navigate(`/leads?open=${leadId}`);
      } else {
          navigate('/leads');
      }
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'task_assigned': 
      case 'lead_assigned':
      case 'follow_up_assigned':
        return <CheckCircle className="w-4 h-4" />;
      
      case 'task_updated': 
      case 'lead_status_changed':
        return <Info className="w-4 h-4" />;
        
      case 'deadline_reminder': 
      case 'follow_up_upcoming':
        return <Clock className="w-4 h-4" />;
        
      case 'overdue_alert': 
      case 'follow_up_overdue':
      case 'lead_escalated':
        return <AlertTriangle className="w-4 h-4" />;
        
      case 'manual_reminder': return <Bell className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'task_assigned': 
      case 'lead_assigned':
        return 'bg-green-100 text-green-600';
      
      case 'task_updated': 
      case 'lead_status_changed':
        return 'bg-blue-100 text-blue-600';
      
      case 'deadline_reminder': 
      case 'follow_up_upcoming':
        return 'bg-[#D7CCC8]/20 text-[#3E2723]';
      
      case 'overdue_alert': 
      case 'follow_up_overdue':
        return 'bg-red-100 text-red-600';
        
      case 'lead_escalated':
        return 'bg-red-500 text-white shadow-lg shadow-red-500/30';
        
      case 'manual_reminder': 
      case 'follow_up_assigned':
        return 'bg-[#3E2723]/10 text-[#3E2723]';
        
      case 'system': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-[#FAF9F8]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 overflow-auto lg:ml-64">
        {title && (
          <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#D7CCC8]/30 shadow-sm">
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
              {/* Mobile Menu Button */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-1.5 sm:p-2 text-gray-500 hover:text-[#3E2723] hover:bg-[#D7CCC8]/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#3E2723] truncate">{title}</h1>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 group relative ${showFilterDropdown ? 'bg-[#3E2723] text-white' : 'text-gray-500 hover:text-[#3E2723] hover:bg-[#D7CCC8]/20'}`}
                    title="Filter"
                  >
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Filter Dropdown */}
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#D7CCC8]/30 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50">
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
                        <h3 className="font-bold text-[#3E2723]">Data Filters</h3>
                        <Filter className="w-4 h-4 text-gray-400" />
                      </div>
                      
                      <div className="p-4 space-y-4">
                        {/* Preset Ranges */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick Select</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'today', label: 'Today' },
                              { id: 'thisWeek', label: 'This Week' },
                              { id: 'thisMonth', label: 'This Month' },
                              { id: 'allTime', label: 'All Time' }
                            ].map(preset => (
                              <button
                                key={preset.id}
                                onClick={() => {
                                  setPresetRange(preset.id);
                                  setShowFilterDropdown(false);
                                }}
                                className="text-xs font-semibold py-2 px-3 bg-gray-50 hover:bg-[#D7CCC8]/20 text-gray-600 hover:text-[#3E2723] rounded-xl transition-all border border-gray-100"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Month/Year Selectors */}
                        <div className="space-y-3 pt-2 border-t border-gray-50">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Month</label>
                            <select
                              value={selectedMonth}
                              onChange={(e) => updateMonth(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-100 text-[#3E2723] text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3E2723]/10"
                            >
                              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                                <option key={idx} value={idx}>{month}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Year</label>
                            <select
                              value={selectedYear}
                              onChange={(e) => updateYear(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-100 text-[#3E2723] text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3E2723]/10"
                            >
                              {[2024, 2025, 2026].map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Status Display */}
                        <div className="mt-2 p-3 bg-[#D7CCC8]/10 rounded-xl border border-[#D7CCC8]/20">
                           <div className="flex items-center gap-2 mb-1">
                             <Clock className="w-3 h-3 text-[#3E2723]" />
                             <span className="text-[10px] font-bold text-[#3E2723] uppercase">Active Range</span>
                           </div>
                           <p className="text-[11px] text-gray-600 font-medium">
                             {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
                           </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={handleBellClick}
                    className="p-1.5 sm:p-2 text-gray-500 hover:text-[#3E2723] hover:bg-[#D7CCC8]/20 rounded-full transition-all duration-200 relative group"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-[#3E2723] text-[#FAF9F8] text-[10px] sm:text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 lg:w-96 bg-white rounded-2xl shadow-2xl border border-[#D7CCC8]/30 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50 max-w-md">
                      <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
                        <h3 className="font-bold text-[#3E2723] text-sm sm:text-base">Notifications</h3>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-[10px] sm:text-xs font-bold text-[#3E2723] hover:underline transition-colors whitespace-nowrap"
                            >
                              Mark all read
                            </button>
                          )}
                          <Link
                            to="/notifications"
                            onClick={() => setShowDropdown(false)}
                            className="text-[10px] sm:text-xs font-bold text-gray-500 hover:text-[#3E2723] transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            View all
                            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </Link>
                        </div>
                      </div>

                      <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 sm:p-8 text-center text-gray-400">
                            <Bell className="w-10 h-10 sm:w-12 sm:h-12 border-gray-100 mx-auto mb-2 sm:mb-3" />
                            <p className="text-xs sm:text-sm font-medium">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-[#D7CCC8]/10' : ''
                                }`}
                            >
                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className={`p-1.5 sm:p-2 rounded-xl ${getTypeColor(notif.type)} flex-shrink-0`}>
                                  {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className={`text-xs sm:text-sm ${!notif.isRead ? 'font-bold text-[#3E2723]' : 'font-semibold text-gray-600'}`}>
                                      {notif.title}
                                    </h4>
                                    {!notif.isRead && (
                                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#3E2723] rounded-full flex-shrink-0 mt-1"></span>
                                    )}
                                  </div>
                                  <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">
                                    {notif.message}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-gray-400 font-medium mt-1">
                                    {formatTime(notif.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to="/settings"
                  className="p-1.5 sm:p-2 text-gray-500 hover:text-[#3E2723] hover:bg-[#D7CCC8]/20 rounded-full transition-all duration-200"
                  title="Settings"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>
          </div>
        )}
        <main className="p-3 sm:p-4 lg:p-6">{children}</main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-[calc(100vw-2rem)] sm:max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#D7CCC8]/30 p-3 sm:p-4 w-full animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-xl ${getTypeColor(toast.notification.type)} flex-shrink-0`}>
                {getIcon(toast.notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#3E2723]">
                    {toast.notification.title}
                  </h4>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-gray-400 hover:text-[#3E2723] transition-colors flex-shrink-0"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">
                  {toast.notification.message}
                </p>
                <p className="text-[10px] sm:text-xs text-[#3E2723] font-bold mt-2">
                  Just now
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Layout;
