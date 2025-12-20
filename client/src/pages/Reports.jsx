import { useState, useEffect } from 'react';
import { 
    BarChart3, TrendingUp, Users, Phone, Bell, Download, 
    Calendar, Clock, CheckCircle, AlertCircle, Target, Award
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, callsAPI, tasksAPI, notificationsAPI } from '../services/api';

const Reports = () => {
    const { isTeamLead } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [summary, setSummary] = useState(null);
    const [teamPerformance, setTeamPerformance] = useState([]);
    const [callHistory, setCallHistory] = useState([]);
    const [period, setPeriod] = useState('week');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const promises = [
                reportsAPI.getSummary(),
                reportsAPI.getTeamPerformance()
            ];

            if (isTeamLead) {
                promises.push(callsAPI.getHistory());
            }

            const results = await Promise.all(promises);
            setSummary(results[0].data.data);
            setTeamPerformance(results[1].data.data || []);
            
            if (isTeamLead && results[2]) {
                setCallHistory(results[2].data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminder = async (taskId, taskTitle) => {
        if (!window.confirm(`Send reminder for task: "${taskTitle}"?`)) return;

        try {
            await notificationsAPI.createReminder({
                taskId,
                message: `Reminder: Task "${taskTitle}" is overdue. Please complete it as soon as possible.`
            });
            alert('✅ Reminder sent successfully!');
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Failed to send reminder');
        }
    };

    const handleExport = async (type) => {
        try {
            setExporting(true);
            const response = await reportsAPI.export(type);
            const data = response.data.data;

            if (!data || data.length === 0) {
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

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            alert('✅ Report exported successfully!');
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    const formatCallDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getCallStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'missed': return 'bg-red-100 text-red-700';
            case 'rejected': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <Layout title="Reports & Analytics">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading reports...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Reports & Analytics">
            <div className="space-y-6">
                {/* Header with Period Selector */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 mt-1">Comprehensive analytics and performance insights</p>
                    </div>
                    <div className="flex gap-2">
                        {['week', 'month', 'year'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                                    period === p
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Tasks</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.tasks?.total || 0}</p>
                            </div>
                            <div className="p-4 bg-blue-100 rounded-xl">
                                <Target className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Completion Rate</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{summary?.completionRate || 0}%</p>
                            </div>
                            <div className="p-4 bg-green-100 rounded-xl">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Overdue Tasks</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">{summary?.tasks?.overdue || 0}</p>
                            </div>
                            <div className="p-4 bg-red-100 rounded-xl">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Team Members</p>
                                <p className="text-3xl font-bold text-purple-600 mt-2">{summary?.team?.total || 0}</p>
                            </div>
                            <div className="p-4 bg-purple-100 rounded-xl">
                                <Users className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200 px-6">
                        <div className="flex gap-4">
                            {['overview', 'team', 'calls'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-4 font-semibold text-sm border-b-2 transition-all ${
                                        activeTab === tab
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Task Distribution */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Task Distribution</h3>
                                    <div className="space-y-3">
                                        {Object.entries(summary?.tasks || {})
                                            .filter(([key]) => key !== 'total')
                                            .map(([status, count]) => {
                                                const percentage = summary?.tasks?.total 
                                                    ? Math.round((count / summary.tasks.total) * 100) 
                                                    : 0;
                                                const colors = {
                                                    assigned: 'bg-blue-500',
                                                    in_progress: 'bg-yellow-500',
                                                    blocked: 'bg-red-500',
                                                    overdue: 'bg-red-600',
                                                    completed: 'bg-green-500'
                                                };
                                                return (
                                                    <div key={status} className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="font-semibold text-gray-700 capitalize">
                                                                {status.replace('_', ' ')}
                                                            </span>
                                                            <span className="text-gray-600">{count} ({percentage}%)</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${colors[status]}`}
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* Export Buttons */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => handleExport('tasks')}
                                        disabled={exporting}
                                        className="flex-1 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export Tasks
                                    </button>
                                    <button
                                        onClick={() => handleExport('members')}
                                        disabled={exporting}
                                        className="flex-1 px-4 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-all font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export Members
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Team Performance Tab */}
                        {activeTab === 'team' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Team Performance Rankings</h3>
                                    <span className="text-sm text-gray-600">{teamPerformance.length} members</span>
                                </div>

                                {teamPerformance.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                        <p className="text-gray-600">No performance data available</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {teamPerformance.map((member, index) => (
                                            <div key={member.member?._id || index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                <div className="flex items-center gap-4">
                                                    {/* Rank */}
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                                                        index === 0 ? 'bg-yellow-500' :
                                                        index === 1 ? 'bg-gray-400' :
                                                        index === 2 ? 'bg-orange-600' :
                                                        'bg-gray-300'
                                                    }`}>
                                                        {index === 0 ? '🏆' : `#${index + 1}`}
                                                    </div>

                                                    {/* Member Info */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                                                                {member.member?.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{member.member?.name}</p>
                                                                <p className="text-xs text-gray-600">{member.member?.designation || 'Team Member'}</p>
                                                            </div>
                                                        </div>

                                                        {/* Stats */}
                                                        <div className="grid grid-cols-3 gap-4 mb-2">
                                                            <div className="text-center">
                                                                <p className="text-lg font-bold text-gray-900">{member.totalTasks || 0}</p>
                                                                <p className="text-xs text-gray-600">Total</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-lg font-bold text-green-600">{member.tasksCompleted || 0}</p>
                                                                <p className="text-xs text-gray-600">Completed</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-lg font-bold text-orange-600">{member.completionRate || 0}%</p>
                                                                <p className="text-xs text-gray-600">Rate</p>
                                                            </div>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-orange-500 h-2 rounded-full transition-all"
                                                                style={{ width: `${member.completionRate || 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Call Logs Tab */}
                        {activeTab === 'calls' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Call History</h3>
                                    <span className="text-sm text-gray-600">{callHistory.length} calls</span>
                                </div>

                                {callHistory.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Phone className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                        <p className="text-gray-600">No call history available</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {callHistory.map((call) => (
                                            <div key={call._id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-3 rounded-xl ${
                                                            call.status === 'completed' ? 'bg-green-100' :
                                                            call.status === 'missed' ? 'bg-red-100' :
                                                            'bg-yellow-100'
                                                        }`}>
                                                            <Phone className={`w-5 h-5 ${
                                                                call.status === 'completed' ? 'text-green-600' :
                                                                call.status === 'missed' ? 'text-red-600' :
                                                                'text-yellow-600'
                                                            }`} />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">
                                                                {call.receiverId?.name || 'Unknown'}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                {new Date(call.createdAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getCallStatusColor(call.status)}`}>
                                                            {call.status}
                                                        </span>
                                                        {call.duration && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {formatCallDuration(call.duration)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Reports;
