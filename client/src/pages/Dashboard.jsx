import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, tasksAPI, usersAPI } from '../services/api';
// import './Dashboard.css';

const Dashboard = () => {
    const { user, isTeamLead } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [taskStats, setTaskStats] = useState(null);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [summaryRes, taskStatsRes] = await Promise.all([
                reportsAPI.getSummary(),
                tasksAPI.getStats()
            ]);
            setSummary(summaryRes.data.data);
            setTaskStats(taskStatsRes.data.data.stats);
            setUpcomingDeadlines(taskStatsRes.data.data.upcomingDeadlines || []);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const taskStatusColors = {
        assigned: 'var(--info-500)',
        in_progress: 'var(--primary-500)',
        blocked: 'var(--warning-500)',
        overdue: 'var(--error-500)',
        completed: 'var(--success-500)'
    };

    const taskStatusLabels = {
        assigned: 'Assigned',
        in_progress: 'In Progress',
        blocked: 'Blocked',
        overdue: 'Overdue',
        completed: 'Completed'
    };

    const StatCard = ({ title, value, subtitle, icon, color, onClick }) => (
        <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className="stat-icon" style={{ backgroundColor: `${color}15`, color }}>
                {icon}
            </div>
            <div className="stat-content">
                <span className="stat-value">{value}</span>
                <span className="stat-title">{title}</span>
                {subtitle && <span className="stat-subtitle">{subtitle}</span>}
            </div>
        </div>
    );

    if (loading) {
        return (
            <Layout title="Dashboard">
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>Loading dashboard...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Dashboard">
            <div className="dashboard">
                {/* Welcome Section */}
                <div className="welcome-section">
                    <div className="welcome-content">
                        <h2>Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
                        <p>Here's an overview of your team's activity and performance.</p>
                    </div>
                    {isTeamLead && (
                        <div className="quick-actions">
                            <button className="btn btn-primary" onClick={() => navigate('/team')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                                Add Member
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/tasks')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Create Task
                            </button>
                        </div>
                    )}
                </div>

                {/* Team Overview */}
                <div className="section">
                    <h3 className="section-title">Team Overview</h3>
                    <div className="stat-grid">
                        <StatCard
                            title="Online"
                            value={summary?.team?.online || 0}
                            icon={<span className="status-dot online" />}
                            color="var(--status-online)"
                            onClick={() => navigate('/team?status=online')}
                        />
                        <StatCard
                            title="Busy"
                            value={summary?.team?.busy || 0}
                            icon={<span className="status-dot busy" />}
                            color="var(--status-busy)"
                            onClick={() => navigate('/team?status=busy')}
                        />
                        <StatCard
                            title="Offline"
                            value={summary?.team?.offline || 0}
                            icon={<span className="status-dot offline" />}
                            color="var(--status-offline)"
                            onClick={() => navigate('/team?status=offline')}
                        />
                        <StatCard
                            title="Total Members"
                            value={summary?.team?.total || 0}
                            icon={
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            }
                            color="var(--primary-500)"
                            onClick={() => navigate('/team')}
                        />
                    </div>
                </div>

                {/* Task Statistics */}
                <div className="section">
                    <h3 className="section-title">Task Statistics</h3>
                    <div className="task-stats-container">
                        <div className="task-stats-grid">
                            {Object.entries(taskStats || {}).filter(([key]) => key !== 'total').map(([status, count]) => (
                                <div
                                    key={status}
                                    className="task-stat-item"
                                    onClick={() => navigate(`/tasks?status=${status}`)}
                                >
                                    <div
                                        className="task-stat-bar"
                                        style={{
                                            backgroundColor: taskStatusColors[status],
                                            width: `${taskStats?.total ? (count / taskStats.total) * 100 : 0}%`
                                        }}
                                    />
                                    <div className="task-stat-info">
                                        <span className="task-stat-label">{taskStatusLabels[status]}</span>
                                        <span className="task-stat-count">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="task-summary-card">
                            <div className="completion-rate">
                                <svg width="80" height="80" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="none"
                                        stroke="var(--neutral-200)"
                                        strokeWidth="12"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="none"
                                        stroke="var(--success-500)"
                                        strokeWidth="12"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(summary?.completionRate || 0) * 2.51} 251`}
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                <div className="completion-text">
                                    <span className="completion-value">{summary?.completionRate || 0}%</span>
                                    <span className="completion-label">Complete</span>
                                </div>
                            </div>
                            <div className="task-totals">
                                <div className="task-total-item">
                                    <span className="total-value">{taskStats?.total || 0}</span>
                                    <span className="total-label">Total Tasks</span>
                                </div>
                                <div className="task-total-item">
                                    <span className="total-value text-success">{taskStats?.completed || 0}</span>
                                    <span className="total-label">Completed</span>
                                </div>
                                <div className="task-total-item">
                                    <span className="total-value text-error">{taskStats?.overdue || 0}</span>
                                    <span className="total-label">Overdue</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="section">
                    <div className="section-header">
                        <h3 className="section-title">Upcoming Deadlines</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>
                            View All
                        </button>
                    </div>
                    {upcomingDeadlines.length === 0 ? (
                        <div className="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <p>No upcoming deadlines</p>
                        </div>
                    ) : (
                        <div className="deadlines-list">
                            {upcomingDeadlines.map((task) => (
                                <div
                                    key={task._id}
                                    className="deadline-item"
                                    onClick={() => navigate(`/tasks?id=${task._id}`)}
                                >
                                    <div className={`priority-indicator priority-${task.priority}`} />
                                    <div className="deadline-content">
                                        <span className="deadline-title">{task.title}</span>
                                        <span className="deadline-assignee">
                                            {task.assignedTo?.name || 'Unassigned'}
                                        </span>
                                    </div>
                                    <div className="deadline-date">
                                        <span className={getDaysRemaining(task.deadline) <= 1 ? 'urgent' : ''}>
                                            {formatDeadline(task.deadline)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

const getDaysRemaining = (deadline) => {
    const now = new Date();
    const due = new Date(deadline);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
};

const formatDeadline = (deadline) => {
    const days = getDaysRemaining(deadline);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return `${Math.abs(days)} days ago`;
    return `${days} days`;
};

export default Dashboard;
