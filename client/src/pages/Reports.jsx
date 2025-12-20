import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { reportsAPI } from '../services/api';
// import './Reports.css';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [teamPerformance, setTeamPerformance] = useState([]);
    const [overdueTasks, setOverdueTasks] = useState([]);
    const [period, setPeriod] = useState('week');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summaryRes, performanceRes, overdueRes] = await Promise.all([
                reportsAPI.getSummary(),
                reportsAPI.getTeamPerformance(),
                reportsAPI.getOverdueTrends()
            ]);
            setSummary(summaryRes.data.data);
            setTeamPerformance(performanceRes.data.data);
            setOverdueTasks(overdueRes.data.data);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type) => {
        try {
            setExporting(true);
            const response = await reportsAPI.export(type);
            const data = response.data.data;

            // Convert to CSV
            if (data.length === 0) {
                alert('No data to export');
                return;
            }

            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(item =>
                Object.values(item).map(v =>
                    typeof v === 'object' ? JSON.stringify(v) : v
                ).join(',')
            );
            const csv = [headers, ...rows].join('\n');

            // Download
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <Layout title="Reports & Analytics">
                <div className="loading-container">
                    <div className="loading-spinner" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Reports & Analytics">
            <div className="reports-page">
                {/* Period Selector & Export */}
                <div className="page-header">
                    <div className="period-selector">
                        {['week', 'month', 'year'].map(p => (
                            <button
                                key={p}
                                className={`period-btn ${period === p ? 'active' : ''}`}
                                onClick={() => setPeriod(p)}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="export-buttons">
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleExport('tasks')}
                            disabled={exporting}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export Tasks
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleExport('members')}
                            disabled={exporting}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export Members
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="summary-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                        </div>
                        <div className="summary-content">
                            <span className="summary-value">{summary?.tasks?.total || 0}</span>
                            <span className="summary-label">Total Tasks</span>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="summary-icon" style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-600)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <div className="summary-content">
                            <span className="summary-value">{summary?.completionRate || 0}%</span>
                            <span className="summary-label">Completion Rate</span>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="summary-icon" style={{ backgroundColor: 'var(--error-50)', color: 'var(--error-600)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div className="summary-content">
                            <span className="summary-value">{summary?.tasks?.overdue || 0}</span>
                            <span className="summary-label">Overdue Tasks</span>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="summary-icon" style={{ backgroundColor: 'var(--info-50)', color: 'var(--info-600)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="summary-content">
                            <span className="summary-value">{summary?.team?.total || 0}</span>
                            <span className="summary-label">Team Members</span>
                        </div>
                    </div>
                </div>

                <div className="reports-grid">
                    {/* Team Performance */}
                    <div className="report-section">
                        <h3 className="section-title">Team Performance</h3>
                        <div className="performance-list">
                            {teamPerformance.map((member, index) => (
                                <div key={member.member._id} className="performance-item">
                                    <div className="performance-rank">#{index + 1}</div>
                                    <div className="performance-member">
                                        <div className="avatar avatar-sm">
                                            {member.member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="member-name">{member.member.name}</span>
                                    </div>
                                    <div className="performance-stats">
                                        <div className="stat-item">
                                            <span className="stat-value">{member.tasksCompleted}</span>
                                            <span className="stat-label">Completed</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">{member.totalTasks}</span>
                                            <span className="stat-label">Total</span>
                                        </div>
                                    </div>
                                    <div className="performance-bar-container">
                                        <div
                                            className="performance-bar"
                                            style={{ width: `${member.completionRate}%` }}
                                        />
                                        <span className="performance-rate">{member.completionRate}%</span>
                                    </div>
                                </div>
                            ))}
                            {teamPerformance.length === 0 && (
                                <div className="empty-state-sm">
                                    <p>No performance data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Task Distribution */}
                    <div className="report-section">
                        <h3 className="section-title">Task Distribution</h3>
                        <div className="task-distribution">
                            {Object.entries(summary?.tasks || {}).filter(([key]) => key !== 'total').map(([status, count]) => {
                                const percentage = summary?.tasks?.total ? Math.round((count / summary.tasks.total) * 100) : 0;
                                const colors = {
                                    assigned: 'var(--info-500)',
                                    in_progress: 'var(--primary-500)',
                                    blocked: 'var(--warning-500)',
                                    overdue: 'var(--error-500)',
                                    completed: 'var(--success-500)'
                                };
                                return (
                                    <div key={status} className="distribution-item">
                                        <div className="distribution-header">
                                            <span
                                                className="distribution-indicator"
                                                style={{ backgroundColor: colors[status] }}
                                            />
                                            <span className="distribution-label">
                                                {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                                            </span>
                                            <span className="distribution-count">{count}</span>
                                        </div>
                                        <div className="distribution-bar-bg">
                                            <div
                                                className="distribution-bar"
                                                style={{ width: `${percentage}%`, backgroundColor: colors[status] }}
                                            />
                                        </div>
                                        <span className="distribution-percentage">{percentage}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Overdue Tasks */}
                {overdueTasks.overdueTasks?.length > 0 && (
                    <div className="report-section full-width">
                        <h3 className="section-title">Overdue Tasks ({overdueTasks.totalOverdue})</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Task</th>
                                        <th>Assigned To</th>
                                        <th>Deadline</th>
                                        <th>Days Overdue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {overdueTasks.overdueTasks.map(task => {
                                        const daysOverdue = Math.ceil((new Date() - new Date(task.deadline)) / (1000 * 60 * 60 * 24));
                                        return (
                                            <tr key={task._id}>
                                                <td>
                                                    <div className="task-cell">
                                                        <div className={`priority-indicator priority-${task.priority}`} />
                                                        <span>{task.title}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="assignee-cell">
                                                        <div className="avatar avatar-sm">
                                                            {task.assignedTo?.name?.charAt(0) || '?'}
                                                        </div>
                                                        <span>{task.assignedTo?.name || 'Unassigned'}</span>
                                                    </div>
                                                </td>
                                                <td>{new Date(task.deadline).toLocaleDateString()}</td>
                                                <td>
                                                    <span className="badge badge-error">{daysOverdue} days</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Reports;
