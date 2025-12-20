import { useState, useEffect } from 'react';
import { Activity, Search, Calendar, User, FileText, Users, CheckSquare, RefreshCw } from 'lucide-react';
import { adminActivitiesAPI } from '../services/adminApi';
import Layout from '../components/Layout';

const AdminActivityLogs = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await adminActivitiesAPI.getAll();
            setActivities(response.data.data);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredActivities = activities.filter(activity => {
        const matchesSearch = activity.details.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAction = filterAction === 'all' || activity.action === filterAction;
        return matchesSearch && matchesAction;
    });

    const getActionIcon = (action) => {
        if (action.includes('user')) return <User className="w-5 h-5" />;
        if (action.includes('task')) return <CheckSquare className="w-5 h-5" />;
        if (action.includes('team')) return <Users className="w-5 h-5" />;
        return <FileText className="w-5 h-5" />;
    };

    const getActionColor = (action) => {
        if (action.includes('created')) return 'bg-green-100 text-green-800 border-green-200';
        if (action.includes('updated')) return 'bg-orange-100 text-orange-800 border-orange-200';
        if (action.includes('deleted')) return 'bg-red-100 text-red-800 border-red-200';
        if (action.includes('login')) return 'bg-gray-100 text-gray-800 border-gray-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const formatFullDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const actionTypes = [
        'all',
        'user_login',
        'user_logout',
        'user_created',
        'user_updated',
        'user_deleted',
        'task_created',
        'task_updated',
        'task_assigned',
        'task_completed',
        'team_created',
        'team_updated',
        'member_added',
        'member_removed'
    ];

    if (loading) {
        return (
            <Layout title="Activity Logs">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading activities...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Activity Logs">
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 mt-1">Monitor all system activities</p>
                    </div>
                    <button
                        onClick={fetchActivities}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search activities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>

                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="px-6 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white font-medium"
                        >
                            {actionTypes.map(action => (
                                <option key={action} value={action}>
                                    {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200 hover:shadow-lg transition-all">
                        <p className="text-sm font-semibold text-gray-600 mb-1">Total Activities</p>
                        <p className="text-3xl font-bold text-gray-900">{activities.length}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <p className="text-sm font-semibold text-gray-600 mb-1">User Actions</p>
                        <p className="text-3xl font-bold text-orange-600">
                            {activities.filter(a => a.action.includes('user')).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <p className="text-sm font-semibold text-gray-600 mb-1">Task Actions</p>
                        <p className="text-3xl font-bold text-orange-600">
                            {activities.filter(a => a.action.includes('task')).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <p className="text-sm font-semibold text-gray-600 mb-1">Team Actions</p>
                        <p className="text-3xl font-bold text-green-600">
                            {activities.filter(a => a.action.includes('team') || a.action.includes('member')).length}
                        </p>
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Activity className="w-6 h-6 text-orange-600" />
                            </div>
                            Recent Activities
                        </h2>
                        
                        <div className="space-y-3">
                            {filteredActivities.map((activity, index) => (
                                <div key={activity._id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                    {/* Timeline dot */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${getActionColor(activity.action)}`}>
                                            {getActionIcon(activity.action)}
                                        </div>
                                        {index < filteredActivities.length - 1 && (
                                            <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900">{activity.details}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${getActionColor(activity.action)}`}>
                                                        {activity.action.replace(/_/g, ' ').toUpperCase()}
                                                    </span>
                                                    {activity.userId && (
                                                        <span className="text-xs text-gray-600 flex items-center gap-1 font-medium">
                                                            <User className="w-3 h-3" />
                                                            {activity.userId.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-600 font-semibold">{formatDate(activity.createdAt)}</p>
                                                <p className="text-xs text-gray-400 mt-1">{formatFullDate(activity.createdAt)}</p>
                                            </div>
                                        </div>

                                        {/* Additional Info */}
                                        {(activity.taskId || activity.teamId || activity.targetUserId) && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {activity.taskId && (
                                                    <span className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg font-semibold border border-orange-200">
                                                        Task: {activity.taskId.title}
                                                    </span>
                                                )}
                                                {activity.teamId && (
                                                    <span className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-semibold border border-green-200">
                                                        Team: {activity.teamId.name}
                                                    </span>
                                                )}
                                                {activity.targetUserId && (
                                                    <span className="text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg font-semibold border border-gray-200">
                                                        User: {activity.targetUserId.name}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredActivities.length === 0 && (
                            <div className="text-center py-16">
                                <Activity className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No activities found</h3>
                                <p className="text-gray-600">Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination Info */}
                    {filteredActivities.length > 0 && (
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-700 font-medium">
                                    Showing <span className="font-bold text-orange-600">{filteredActivities.length}</span> of{' '}
                                    <span className="font-bold text-gray-900">{activities.length}</span> activities
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default AdminActivityLogs;