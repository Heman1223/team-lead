import React, { useState, useEffect } from 'react';
import {
    Activity,
    Clock,
    User,
    Filter,
    Search,
    ChevronDown,
    FileText,
    TrendingUp,
    UserCheck,
    Mail,
    Phone,
    Calendar
} from 'lucide-react';
import { leadsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const activityIcons = {
    lead_created: FileText,
    lead_status_changed: TrendingUp,
    lead_assigned: UserCheck,
    lead_updated: Activity,
    lead_note_added: FileText,
    lead_escalated: TrendingUp,
    lead_converted: TrendingUp,
    lead_deleted: Activity,
    lead_restored: Activity
};

const activityColors = {
    lead_created: 'text-blue-500 bg-blue-500/10',
    lead_status_changed: 'text-purple-500 bg-purple-500/10',
    lead_assigned: 'text-green-500 bg-green-500/10',
    lead_updated: 'text-orange-500 bg-orange-500/10',
    lead_note_added: 'text-cyan-500 bg-cyan-500/10',
    lead_escalated: 'text-yellow-500 bg-yellow-500/10',
    lead_converted: 'text-emerald-500 bg-emerald-500/10',
    lead_deleted: 'text-rose-500 bg-rose-500/10',
    lead_restored: 'text-indigo-500 bg-indigo-500/10'
};

const LeadActivities = () => {
    const { user, isAdmin, isTeamLead } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [groupByLead, setGroupByLead] = useState(false);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const response = await leadsAPI.getActivities();
            setActivities(response.data.data);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredActivities = activities.filter(activity => {
        const matchesSearch =
            activity.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.leadId?.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterAction === 'all' || activity.action === filterAction;

        return matchesSearch && matchesFilter;
    });

    const groupedActivities = groupByLead
        ? filteredActivities.reduce((acc, activity) => {
            const leadId = activity.leadId?._id || 'unknown';
            if (!acc[leadId]) {
                acc[leadId] = {
                    lead: activity.leadId,
                    activities: []
                };
            }
            acc[leadId].activities.push(activity);
            return acc;
        }, {})
        : null;

    const uniqueActions = [...new Set(activities.map(a => a.action))];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-950">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading activities...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-rose-500 rounded-[2rem] flex items-center justify-center shadow-2xl">
                        <Activity size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Lead Activities</h1>
                        <p className="text-gray-400 mt-1">
                            {isAdmin ? 'All lead activities' : isTeamLead ? 'Activities on your team\'s leads' : 'Activities on your assigned leads'}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>

                    {/* Action Filter */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="all">All Actions</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>
                                    {action.replace('lead_', '').replace(/_/g, ' ').toUpperCase()}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                    </div>

                    {/* Group Toggle */}
                    <button
                        onClick={() => setGroupByLead(!groupByLead)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${groupByLead
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-orange-500'
                            }`}
                    >
                        {groupByLead ? 'Grouped by Lead' : 'Timeline View'}
                    </button>
                </div>
            </div>

            {/* Activities */}
            <div className="space-y-6">
                {filteredActivities.length === 0 ? (
                    <div className="text-center py-16 bg-gray-900/30 rounded-3xl border border-gray-800">
                        <Activity size={64} className="mx-auto text-gray-700 mb-4" />
                        <p className="text-gray-500 text-lg">No activities found</p>
                    </div>
                ) : groupByLead ? (
                    // Grouped View
                    Object.values(groupedActivities).map(({ lead, activities }) => (
                        <div key={lead?._id || 'unknown'} className="bg-gray-900/50 rounded-3xl border border-gray-800 p-6">
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-800">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                                    <FileText size={24} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white">{lead?.clientName || 'Unknown Lead'}</h3>
                                    <div className="flex items-center gap-4 mt-1">
                                        {lead?.email && (
                                            <span className="text-sm text-gray-400 flex items-center gap-1">
                                                <Mail size={14} /> {lead.email}
                                            </span>
                                        )}
                                        {lead?.status && (
                                            <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs font-bold uppercase">
                                                {lead.status.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm text-gray-500">{activities.length} activities</span>
                            </div>
                            <div className="space-y-3 pl-4 border-l-2 border-gray-800">
                                {activities.map((activity) => (
                                    <ActivityItem key={activity._id} activity={activity} showLead={false} />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    // Timeline View
                    <div className="bg-gray-900/50 rounded-3xl border border-gray-800 p-6">
                        <div className="space-y-4 pl-4 border-l-2 border-gray-800">
                            {filteredActivities.map((activity) => (
                                <ActivityItem key={activity._id} activity={activity} showLead={true} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ActivityItem = ({ activity, showLead }) => {
    const Icon = activityIcons[activity.action] || Activity;
    const colorClass = activityColors[activity.action] || 'text-gray-500 bg-gray-500/10';

    return (
        <div className="relative group">
            <div className="absolute -left-[21px] top-3 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
            <div className="bg-gray-800/30 rounded-xl p-4 hover:bg-gray-800/50 transition-all">
                <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} flex-shrink-0`}>
                        <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white capitalize">
                                    {activity.action.replace('lead_', '').replace(/_/g, ' ')}
                                </p>
                                {showLead && activity.leadId && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Lead: <span className="text-orange-400 font-medium">{activity.leadId.clientName}</span>
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={12} />
                                {new Date(activity.createdAt).toLocaleString(undefined, {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                })}
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{activity.details}</p>
                        {activity.userId && (
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs text-white">
                                    {activity.userId.name?.charAt(0) || 'U'}
                                </div>
                                <span className="text-xs text-gray-500">
                                    {activity.userId.name}
                                    {activity.userId.role && (
                                        <span className="ml-2 text-gray-600">• {activity.userId.role.replace('_', ' ')}</span>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadActivities;
