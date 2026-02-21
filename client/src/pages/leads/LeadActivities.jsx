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
    Mail
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
    lead_created: 'text-blue-600 bg-blue-50',
    lead_status_changed: 'text-purple-600 bg-purple-50',
    lead_assigned: 'text-green-600 bg-green-50',
    lead_updated: 'text-[#3E2723] bg-[#FAF7F2]',
    lead_note_added: 'text-cyan-600 bg-cyan-50',
    lead_escalated: 'text-yellow-600 bg-yellow-50',
    lead_converted: 'text-emerald-600 bg-emerald-50',
    lead_deleted: 'text-rose-600 bg-rose-50',
    lead_restored: 'text-indigo-600 bg-indigo-50'
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
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#3E2723] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading activities...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Lead Activities</h2>
                <p className="text-sm sm:text-base text-gray-600">
                    {isAdmin ? 'All lead activities' : isTeamLead ? 'Activities on your team\'s leads' : 'Activities on your assigned leads'}
                </p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search activities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-300 text-gray-900 pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg focus:ring-2 focus:ring-[#3E2723] focus:border-transparent outline-none text-sm sm:text-base"
                    />
                </div>

                {/* Action Filter */}
                <div className="relative">
                    <Filter className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="w-full bg-white border border-gray-300 text-gray-900 pl-10 sm:pl-12 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-lg focus:ring-2 focus:ring-[#3E2723] focus:border-transparent outline-none appearance-none cursor-pointer text-sm sm:text-base"
                    >
                        <option value="all">All Actions</option>
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>
                                {action.replace('lead_', '').replace(/_/g, ' ').toUpperCase()}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>

                {/* Group Toggle */}
                <button
                    onClick={() => setGroupByLead(!groupByLead)}
                    className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold text-sm sm:text-base transition-all ${groupByLead
                            ? 'bg-[#3E2723] text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-[#3E2723]'
                        }`}
                >
                    {groupByLead ? 'Grouped by Lead' : 'Timeline View'}
                </button>
            </div>

            {/* Activities */}
            <div className="space-y-4 sm:space-y-6">
                {filteredActivities.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl border border-gray-200">
                        <Activity size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-base sm:text-lg">No activities found</p>
                    </div>
                ) : groupByLead ? (
                    // Grouped View
                    Object.values(groupedActivities).map(({ lead, activities }) => (
                        <div key={lead?._id || 'unknown'} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 border-b border-gray-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FileText size={20} className="text-white sm:w-6 sm:h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{lead?.clientName || 'Unknown Lead'}</h3>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                                        {lead?.email && (
                                            <span className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 truncate">
                                                <Mail size={12} className="flex-shrink-0" />
                                                <span className="truncate">{lead.email}</span>
                                            </span>
                                        )}
                                        {lead?.status && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold uppercase">
                                                {lead.status.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">{activities.length} activities</span>
                            </div>
                            <div className="space-y-3 pl-0 sm:pl-4 border-l-0 sm:border-l-2 border-gray-200">
                                {activities.map((activity) => (
                                    <ActivityItem key={activity._id} activity={activity} showLead={false} />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    // Timeline View
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                        <div className="space-y-3 sm:space-y-4 pl-0 sm:pl-4 border-l-0 sm:border-l-2 border-gray-200">
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
    const colorClass = activityColors[activity.action] || 'text-gray-600 bg-gray-50';

    return (
        <div className="relative group">
            <div className="absolute -left-[21px] top-3 w-2 h-2 rounded-full bg-[#3E2723] shadow-sm hidden sm:block" />
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-all border border-gray-100">
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${colorClass} flex-shrink-0`}>
                        <Icon size={16} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm sm:text-base font-bold text-gray-900 capitalize">
                                    {activity.action.replace('lead_', '').replace(/_/g, ' ')}
                                </p>
                                {showLead && activity.leadId && (
                                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
                                        Lead: <span className="text-[#3E2723] font-medium">{activity.leadId.clientName}</span>
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 flex-shrink-0">
                                <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                                <span className="whitespace-nowrap">
                                    {new Date(activity.createdAt).toLocaleString(undefined, {
                                        dateStyle: 'short',
                                        timeStyle: 'short'
                                    })}
                                </span>
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700 mb-2 line-clamp-2">{activity.details}</p>
                        {activity.userId && (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs text-white font-semibold flex-shrink-0">
                                    {activity.userId.name?.charAt(0) || 'U'}
                                </div>
                                <span className="text-xs sm:text-sm text-gray-600 truncate">
                                    {activity.userId.name}
                                    {activity.userId.role && (
                                        <span className="ml-2 text-gray-500">• {activity.userId.role.replace('_', ' ')}</span>
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
