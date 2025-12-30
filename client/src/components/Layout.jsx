import { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { Bell, Settings, X, CheckCircle, Clock, AlertTriangle, Info, ExternalLink, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../services/api';

const Layout = ({ children, title }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [previousCount, setPreviousCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef(null);
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
      // If it's a lead-related notification, navigate to leads page
      // Ideally we would pass the ID to open the modal: /leads?open=ID
      // For now, simple navigation
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
        return <Info className="w-4 h-4" />; // Changed from CheckCircle for updates
        
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
        return 'bg-orange-100 text-orange-600';
      
      case 'overdue_alert': 
      case 'follow_up_overdue':
        return 'bg-red-100 text-red-600';
        
      case 'lead_escalated':
        return 'bg-red-500 text-white shadow-lg shadow-red-500/30'; // Distinct urgent style
        
      case 'manual_reminder': 
      case 'follow_up_assigned':
        return 'bg-purple-100 text-purple-600';
        
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 overflow-auto lg:ml-64">
        {title && (
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
              {/* Mobile Menu Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={handleBellClick}
                    className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all duration-200 relative group"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50">
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
                            >
                              Mark all read
                            </button>
                          )}
                          <Link
                            to="/notifications"
                            onClick={() => setShowDropdown(false)}
                            className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                          >
                            View all
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-orange-50/30' : ''
                                }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${getTypeColor(notif.type)}`}>
                                  {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                      {notif.title}
                                    </h4>
                                    {!notif.isRead && (
                                      <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1"></span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {notif.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
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
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        )}
        <main className="p-4 sm:p-6">{children}</main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getTypeColor(toast.notification.type)}`}>
                {getIcon(toast.notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-gray-900">
                    {toast.notification.title}
                  </h4>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {toast.notification.message}
                </p>
                <p className="text-xs text-orange-600 font-medium mt-2">
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