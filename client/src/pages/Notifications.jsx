import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI, usersAPI, tasksAPI } from '../services/api';
import './Notifications.css';

const Notifications = () => {
    const { isTeamLead } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [members, setMembers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [reminderForm, setReminderForm] = useState({
        userId: '',
        taskId: '',
        title: '',
        message: '',
        priority: 'medium'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [notifRes, membersRes, tasksRes] = await Promise.all([
                notificationsAPI.getAll({ limit: 50 }),
                usersAPI.getAll(),
                tasksAPI.getAll()
            ]);
            setNotifications(notifRes.data.data);
            setMembers(membersRes.data.data);
            setTasks(tasksRes.data.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationsAPI.delete(id);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const handleSendReminder = async (e) => {
        e.preventDefault();
        try {
            await notificationsAPI.createReminder(reminderForm);
            setShowReminderModal(false);
            setReminderForm({ userId: '', taskId: '', title: '', message: '', priority: 'medium' });
            alert('Reminder sent successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send reminder');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'task_assigned':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                );
            case 'deadline_reminder':
            case 'overdue_alert':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                );
            case 'manual_reminder':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                );
            default:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                );
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'task_assigned':
                return 'var(--primary-500)';
            case 'deadline_reminder':
                return 'var(--warning-500)';
            case 'overdue_alert':
                return 'var(--error-500)';
            case 'manual_reminder':
                return 'var(--info-500)';
            default:
                return 'var(--neutral-400)';
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <Layout title="Notifications">
            <div className="notifications-page">
                <div className="page-header">
                    <div className="header-info">
                        <span className="unread-count">{unreadCount} unread</span>
                        {unreadCount > 0 && (
                            <button className="btn btn-ghost btn-sm" onClick={handleMarkAllAsRead}>
                                Mark all as read
                            </button>
                        )}
                    </div>
                    {isTeamLead && (
                        <button className="btn btn-primary" onClick={() => setShowReminderModal(true)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            Send Reminder
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <h3>No notifications</h3>
                        <p>You're all caught up!</p>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {notifications.map(notif => (
                            <div
                                key={notif._id}
                                className={`notification-card ${!notif.isRead ? 'unread' : ''}`}
                            >
                                <div
                                    className="notification-icon"
                                    style={{ backgroundColor: `${getNotificationColor(notif.type)}15`, color: getNotificationColor(notif.type) }}
                                >
                                    {getNotificationIcon(notif.type)}
                                </div>
                                <div className="notification-content">
                                    <h4 className="notification-title">{notif.title}</h4>
                                    <p className="notification-message">{notif.message}</p>
                                    <div className="notification-meta">
                                        {notif.senderId && (
                                            <span className="notification-sender">From: {notif.senderId.name}</span>
                                        )}
                                        <span className="notification-time">
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="notification-actions">
                                    {!notif.isRead && (
                                        <button
                                            className="btn btn-ghost btn-icon"
                                            onClick={() => handleMarkAsRead(notif._id)}
                                            title="Mark as read"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => handleDelete(notif._id)}
                                        title="Delete"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Send Reminder Modal */}
                {showReminderModal && (
                    <div className="modal-overlay" onClick={() => setShowReminderModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Send Reminder</h3>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowReminderModal(false)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleSendReminder}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Send To *</label>
                                        <select
                                            value={reminderForm.userId}
                                            onChange={e => setReminderForm({ ...reminderForm, userId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select member</option>
                                            {members.map(m => (
                                                <option key={m._id} value={m._id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Related Task (Optional)</label>
                                        <select
                                            value={reminderForm.taskId}
                                            onChange={e => setReminderForm({ ...reminderForm, taskId: e.target.value })}
                                        >
                                            <option value="">Select task</option>
                                            {tasks.map(t => (
                                                <option key={t._id} value={t._id}>{t.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Title</label>
                                        <input
                                            type="text"
                                            value={reminderForm.title}
                                            onChange={e => setReminderForm({ ...reminderForm, title: e.target.value })}
                                            placeholder="Reminder title"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Message *</label>
                                        <textarea
                                            rows="3"
                                            value={reminderForm.message}
                                            onChange={e => setReminderForm({ ...reminderForm, message: e.target.value })}
                                            required
                                            placeholder="Enter your reminder message..."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Priority</label>
                                        <select
                                            value={reminderForm.priority}
                                            onChange={e => setReminderForm({ ...reminderForm, priority: e.target.value })}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowReminderModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Send Reminder
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Notifications;
