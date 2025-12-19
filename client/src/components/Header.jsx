import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import './Header.css';

const Header = ({ onMenuClick, title }) => {
    const { user, logout, updateStatus } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await notificationsAPI.getAll({ limit: 5 });
            setNotifications(response.data.data);
            setUnreadCount(response.data.unreadCount);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleStatusChange = async (status) => {
        await updateStatus(status);
        setShowDropdown(false);
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await notificationsAPI.markAsRead(notification._id);
            fetchNotifications();
        }
        if (notification.taskId) {
            navigate(`/tasks?id=${notification.taskId._id || notification.taskId}`);
        }
        setShowNotifications(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'var(--status-online)';
            case 'busy': return 'var(--status-busy)';
            default: return 'var(--status-offline)';
        }
    };

    return (
        <header className="header">
            <div className="header-left">
                <button className="menu-btn hide-desktop" onClick={onMenuClick}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <h1 className="page-title">{title}</h1>
            </div>

            <div className="header-right">
                {/* Notifications */}
                <div className="notification-container">
                    <button
                        className="icon-btn notification-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </button>

                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="dropdown-header">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <button
                                        className="mark-all-btn"
                                        onClick={async () => {
                                            await notificationsAPI.markAllAsRead();
                                            fetchNotifications();
                                        }}
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <div className="empty-notifications">No notifications</div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif._id}
                                            className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                                            onClick={() => handleNotificationClick(notif)}
                                        >
                                            <div className="notification-content">
                                                <span className="notification-title">{notif.title}</span>
                                                <span className="notification-message">{notif.message}</span>
                                                <span className="notification-time">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="dropdown-footer">
                                <button onClick={() => { navigate('/notifications'); setShowNotifications(false); }}>
                                    View all notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="user-menu-container">
                    <button
                        className="user-menu-btn"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <div className="avatar avatar-sm">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="user-name hide-mobile">{user?.name}</span>
                        <span
                            className="status-indicator"
                            style={{ backgroundColor: getStatusColor(user?.status) }}
                        />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {showDropdown && (
                        <div className="user-dropdown">
                            <div className="dropdown-header">
                                <div className="avatar">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="user-info">
                                    <span className="user-name">{user?.name}</span>
                                    <span className="user-email">{user?.email}</span>
                                </div>
                            </div>

                            <div className="dropdown-section">
                                <label className="section-label">Status</label>
                                <div className="status-options">
                                    {['online', 'busy', 'offline'].map((status) => (
                                        <button
                                            key={status}
                                            className={`status-option ${user?.status === status ? 'active' : ''}`}
                                            onClick={() => handleStatusChange(status)}
                                        >
                                            <span className={`status-dot ${status}`} />
                                            <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="dropdown-divider" />

                            <button className="dropdown-item" onClick={handleLogout}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
