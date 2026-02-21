import { useState, useEffect } from 'react';
import { Activity, Search, User, FileText, Users, CheckSquare, RefreshCw, Filter, TrendingUp, Shield, Zap } from 'lucide-react';
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
        if (action.includes('user')) return <User className="w-4 h-4" />;
        if (action.includes('task')) return <CheckSquare className="w-4 h-4" />;
        if (action.includes('team')) return <Users className="w-4 h-4" />;
        return <FileText className="w-4 h-4" />;
    };

    const getActionColor = (action) => {
        if (action.includes('created')) return 'bg-green-100 text-green-800 border-green-200';
        if (action.includes('updated')) return 'bg-[#D7CCC8]/30 text-[#3E2723] border-[#D7CCC8]/50';
        if (action.includes('deleted')) return 'bg-red-100 text-red-800 border-red-200';
        if (action.includes('login')) return 'bg-blue-50 text-blue-700 border-blue-200';
        if (action.includes('logout')) return 'bg-gray-100 text-gray-600 border-gray-200';
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

    // Compute stats
    const userActions = activities.filter(a => a.action.includes('user')).length;
    const taskActions = activities.filter(a => a.action.includes('task')).length;
    const teamActions = activities.filter(a => a.action.includes('team') || a.action.includes('member')).length;

    if (loading) {
        return (
            <Layout title="Activity Logs">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3E2723] mx-auto"></div>
                        <p className="mt-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Loading activities...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Activity Logs">
            <div className="space-y-5" style={{ background: '#FAF9F8' }}>

                {/* KPI CARDS (BEIGE THEME - MATCHING PROJECT) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Activities */}
                    <div className="bg-[#F3EFE7] rounded-[2rem] p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                    Total Events
                                </p>
                                <div className="flex items-baseline gap-2 mt-1.5">
                                    <h3 className="text-2xl font-black text-[#1D1110] tracking-tighter">
                                        {activities.length}
                                    </h3>
                                    <span className="text-[10px] font-bold text-green-500 tracking-tighter truncate">
                                        ALL TIME
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 p-2.5 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* User Actions */}
                    <div className="bg-[#F3EFE7] rounded-[2rem] p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                    User Actions
                                </p>
                                <div className="flex items-baseline gap-2 mt-1.5">
                                    <h3 className="text-2xl font-black text-[#1D1110] tracking-tighter">
                                        {userActions}
                                    </h3>
                                    <span className="text-[10px] font-bold text-[#5D4037] tracking-tighter truncate">
                                        LOGINS
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 p-2.5 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                <Shield className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Task Actions */}
                    <div className="bg-[#F3EFE7] rounded-[2rem] p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                    Task Actions
                                </p>
                                <div className="flex items-baseline gap-2 mt-1.5">
                                    <h3 className="text-2xl font-black text-[#1D1110] tracking-tighter">
                                        {taskActions}
                                    </h3>
                                    <span className="text-[10px] font-bold text-[#5D4037] tracking-tighter truncate">
                                        UPDATES
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 p-2.5 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                <Zap className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Team Actions */}
                    <div className="bg-[#F3EFE7] rounded-[2rem] p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                    Team Actions
                                </p>
                                <div className="flex items-baseline gap-2 mt-1.5">
                                    <h3 className="text-2xl font-black text-green-600 tracking-tighter">
                                        {teamActions}
                                    </h3>
                                    <span className="text-[10px] font-bold text-green-500 tracking-tighter truncate">
                                        ACTIVE
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 p-2.5 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SEARCH & FILTER ROW (PILL-SHAPED - MATCHING PROJECT) */}
                <div className="flex flex-wrap lg:flex-nowrap gap-3 items-center">
                    <div className="flex-1 min-w-[280px] bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-1.5 flex items-center group focus-within:ring-2 focus-within:ring-[#1D1110]/10 transition-all">
                        <div className="p-2.5">
                            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-[#1D1110] transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-xs font-bold text-[#1D1110] placeholder-gray-400 flex-1 px-1"
                        />
                    </div>

                    <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-100 p-1 flex items-center min-w-[180px]">
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="w-full pl-4 pr-8 py-2 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-[#3E2723] appearance-none cursor-pointer"
                        >
                            {actionTypes.map(action => (
                                <option key={action} value={action}>
                                    {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>
                        <div className="pr-3 pointer-events-none">
                            <Filter className="w-3 h-3 text-gray-400" />
                        </div>
                    </div>

                    <button
                        onClick={fetchActivities}
                        className="bg-[#1D1110] text-white rounded-[1.25rem] px-5 py-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#3E2723] transition-all shadow-sm"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </button>
                </div>

                {/* RESULTS COUNT */}
                <div className="flex items-center justify-between px-1">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Showing <span className="text-[#1D1110]">{filteredActivities.length}</span> of <span className="text-[#1D1110]">{activities.length}</span> activities
                    </p>
                </div>

                {/* ACTIVITY TIMELINE */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5">
                        <div className="space-y-0">
                            {filteredActivities.length === 0 ? (
                                <div className="text-center py-12">
                                    <Activity className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                                    <h3 className="text-sm font-black text-gray-900 mb-1">No activities found</h3>
                                    <p className="text-[11px] text-gray-400 font-medium">Try adjusting your search or filters</p>
                                </div>
                            ) : (
                                filteredActivities.map((activity, index) => (
                                    <div key={activity._id} className={`flex gap-3 py-3 ${index < filteredActivities.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                        {/* Timeline Icon */}
                                        <div className="flex flex-col items-center pt-0.5">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${getActionColor(activity.action)}`}>
                                                {getActionIcon(activity.action)}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 leading-snug">{activity.details}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-md border uppercase tracking-wider ${getActionColor(activity.action)}`}>
                                                            {activity.action.replace(/_/g, ' ')}
                                                        </span>
                                                        {activity.userId && (
                                                            <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold">
                                                                <User className="w-2.5 h-2.5" />
                                                                {activity.userId.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[10px] text-gray-500 font-bold">{formatDate(activity.createdAt)}</p>
                                                    <p className="text-[9px] text-gray-300 font-medium mt-0.5">{formatFullDate(activity.createdAt)}</p>
                                                </div>
                                            </div>

                                            {/* Related Entities */}
                                            {(activity.taskId || activity.teamId || activity.targetUserId) && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {activity.taskId && (
                                                        <span className="text-[9px] bg-[#F3EFE7] text-[#3E2723] px-2 py-0.5 rounded-md font-bold border border-[#D7CCC8]/40">
                                                            Task: {activity.taskId.title}
                                                        </span>
                                                    )}
                                                    {activity.teamId && (
                                                        <span className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-bold border border-green-200">
                                                            Team: {activity.teamId.name}
                                                        </span>
                                                    )}
                                                    {activity.targetUserId && (
                                                        <span className="text-[9px] bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md font-bold border border-gray-200">
                                                            User: {activity.targetUserId.name}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdminActivityLogs;