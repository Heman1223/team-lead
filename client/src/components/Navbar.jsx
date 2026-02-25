import { useState, useEffect, useRef } from 'react';
import { Bell, ChevronDown, LogOut, Check, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { notificationsAPI } from '../services/api';

const Navbar = ({ title = 'Dashboard', onMenuToggle = () => { } }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }

        // Close dropdowns when clicking outside
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [user]);

    const fetchNotifications = async () => {
        try {
            // Get recent notifications
            const response = await notificationsAPI.getAll({ limit: 10 });
            const recentNotifications = response.data.slice(0, 5).map((n) => ({
                id: n._id,
                type: n.type || 'notification',
                title: n.title,
                message: n.message,
                time: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                read: n.read
            }));
            setNotifications(recentNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };


    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userName = user?.name || 'User';
    const userTitle = user?.role === 'admin' ? 'Admin Manager' : 'Sales Executive';
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="navbar">
            <div className="navbar-left">
                {user && (
                    <button
                        className="hamburger-btn"
                        onClick={onMenuToggle}
                        aria-label="Toggle menu"
                    >
                        <Menu size={24} />
                    </button>
                )}
                <div className="navbar-logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/logo.jpeg" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
                    <span style={{ fontWeight: 'bold', color: 'var(--primary-100)', fontSize: '1.2rem', letterSpacing: '1px' }}>AVANI ENTERPRISES</span>
                </div>
            </div>

            <div className="navbar-right">
                {user ? (
                    <>
                        <div className="notification-wrapper" ref={notificationRef}>
                            <button
                                className="navbar-icon-btn"
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="badge">{unreadCount}</span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="notification-dropdown">
                                    <div className="notification-header">
                                        <h4>Notifications</h4>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllAsRead} className="mark-all-read">
                                                <Check size={14} /> Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="notification-list">
                                        {notifications.length === 0 ? (
                                            <div className="notification-empty">No notifications</div>
                                        ) : (
                                            notifications.map(notification => (
                                                <div
                                                    key={notification.id}
                                                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                                    onClick={() => markAsRead(notification.id)}
                                                >
                                                    <div className="notification-content">
                                                        <div className="notification-title">{notification.title}</div>
                                                        <div className="notification-message">{notification.message}</div>
                                                    </div>
                                                    <div className="notification-time">{notification.time}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="notification-footer">
                                        <button onClick={() => { navigate('/sales'); setShowNotifications(false); }}>
                                            View all activity
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="navbar-profile" onClick={() => navigate('/settings')}>
                            <div className="navbar-profile-avatar">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }} />
                                ) : (
                                    getInitials(userName)
                                )}
                            </div>
                            <div className="navbar-profile-info">
                                <span>{userName}</span>
                                <span>{userTitle}</span>
                            </div>
                            <ChevronDown size={16} />
                        </div>

                        <button className="navbar-icon-btn" onClick={handleLogout} title="Logout">
                            <LogOut size={20} />
                        </button>
                    </>
                ) : (
                    <div className="auth-buttons" style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => navigate('/login')} className="nav-login-btn">Login</button>
                        <button onClick={() => navigate('/register')} className="nav-register-btn">Sign Up</button>
                    </div>
                )}
            </div>

            <style>{`
                .navbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 24px;
                    height: var(--header-height);
                    background: var(--primary-brand);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    color: var(--primary-100);
                }
                .navbar-left, .navbar-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .navbar-icon-btn {
                    background: none;
                    border: none;
                    color: var(--primary-100);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px;
                    border-radius: 50%;
                    transition: all 0.2s;
                    position: relative;
                }
                .navbar-icon-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
                .badge {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: var(--error-500);
                    color: white;
                    font-size: 0.65rem;
                    min-width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                }
                .navbar-profile {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: var(--radius-md);
                    transition: background 0.2s;
                }
                .navbar-profile:hover {
                    background: var(--bg-hover);
                }
                .navbar-profile-avatar {
                    width: 32px;
                    height: 32px;
                    background: var(--primary-brand);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.85rem;
                }
                .navbar-profile-info {
                    display: flex;
                    flex-direction: column;
                }
                .navbar-profile-info span:first-child {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: var(--primary-100);
                }
                .navbar-profile-info span:last-child {
                    font-size: 0.75rem;
                    color: rgba(245, 236, 229, 0.7);
                }
                .hamburger-btn {
                    display: none;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--primary-100);
                }
                @media (max-width: 768px) {
                    .hamburger-btn {
                        display: block;
                    }
                    .navbar-profile-info {
                        display: none;
                    }
                }
                
                .nav-login-btn, .nav-register-btn {
                    padding: 8px 16px;
                    border-radius: 50px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .nav-login-btn {
                    background: transparent;
                    border: 1px solid var(--primary-100);
                    color: var(--primary-100);
                }
                .nav-login-btn:hover {
                    background: var(--primary-100);
                    color: var(--primary-brand);
                }
                .nav-register-btn {
                    background: var(--primary-100);
                    border: 1px solid var(--primary-100);
                    color: var(--primary-brand);
                }
                .nav-register-btn:hover {
                    background: white;
                    color: var(--primary-brand);
                    transform: translateY(-2px);
                }

                .notification-wrapper {
                    position: relative;
                }
                .notification-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    width: 360px;
                    max-width: calc(100vw - 24px);
                    background: white;
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-xl);
                    border: 1px solid var(--border-light);
                    z-index: 1000;
                    margin-top: 8px;
                }
                
                .notification-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    border-bottom: 1px solid var(--border-light);
                }
                .notification-header h4 {
                    margin: 0;
                    color: var(--text-primary);
                }
                .mark-all-read {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: none;
                    border: none;
                    color: var(--primary-brand);
                    font-size: 0.8rem;
                    cursor: pointer;
                }
                .notification-list {
                    max-height: 320px;
                    overflow-y: auto;
                }
                .notification-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-light);
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .notification-item:hover {
                    background: var(--bg-secondary);
                }
                .notification-item.unread {
                    background: rgba(62, 39, 35, 0.05);
                    border-left: 3px solid var(--primary-brand);
                }
                .notification-content {
                    flex: 1;
                }
                .notification-title {
                    font-weight: 500;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }
                .notification-message {
                    font-size: 0.85rem;
                    color: var(--text-tertiary);
                }
                .notification-time {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    white-space: nowrap;
                    margin-left: 12px;
                }
                .notification-empty {
                    padding: 32px;
                    text-align: center;
                    color: var(--text-muted);
                }
                .notification-footer {
                    padding: 12px 16px;
                    border-top: 1px solid var(--border-light);
                    text-align: center;
                }
                .notification-footer button {
                    background: none;
                    border: none;
                    color: var(--primary-brand);
                    font-weight: 500;
                    cursor: pointer;
                }
            `}</style>
        </header>
    );
};

export default Navbar;
