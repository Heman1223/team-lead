import { useState, useEffect } from 'react';
import { Users, Briefcase, CheckCircle, TrendingUp, Award, BarChart3, RefreshCw, Clock, AlertCircle, Target, Activity, Calendar, Zap, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/Layout';
import { adminAnalyticsAPI, adminTasksAPI } from '../services/adminApi';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [teamPerformance, setTeamPerformance] = useState([]);
    const [bestTeams, setBestTeams] = useState([]);
    const [taskStats, setTaskStats] = useState({
        assignedToday: 0,
        dueToday: 0,
        overdue: 0,
        bestTeamLead: null
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setRefreshing(true);
            const [statsRes, performanceRes, bestTeamsRes, tasksRes] = await Promise.all([
                adminAnalyticsAPI.getDashboardStats(),
                adminAnalyticsAPI.getTeamPerformance(),
                adminAnalyticsAPI.getBestTeams(),
                adminTasksAPI.getAll()
            ]);

            console.log('Stats Response:', statsRes.data);
            console.log('Performance Response:', performanceRes.data);
            console.log('Best Teams Response:', bestTeamsRes.data);

            const statsData = statsRes.data.data || {};

            // Transform stats data
            const transformedStats = {
                totalTeams: statsData.overview?.totalTeams || 0,
                totalTeamLeads: statsData.overview?.totalUsers || 0,
                totalMembers: statsData.overview?.totalUsers || 0,
                totalTasks: statsData.tasks?.total || 0,
                completedTasks: statsData.tasks?.completed || 0,
                inProgressTasks: statsData.tasks?.inProgress || 0,
                pendingTasks: (statsData.tasks?.total || 0) - (statsData.tasks?.completed || 0) - (statsData.tasks?.inProgress || 0),
                overdueTasks: statsData.tasks?.overdue || 0,
                overallProgress: statsData.tasks?.completionRate || 0
            };

            setStats(transformedStats);
            setTeamPerformance(performanceRes.data.data || []);
            setBestTeams(bestTeamsRes.data.data || []);

            // Calculate today's task statistics
            const tasks = tasksRes.data.data || [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const assignedToday = tasks.filter(t => {
                const assignedDate = new Date(t.assignedAt || t.createdAt);
                assignedDate.setHours(0, 0, 0, 0);
                return assignedDate.getTime() === today.getTime();
            }).length;

            const dueToday = tasks.filter(t => {
                const dueDate = new Date(t.dueDate || t.deadline);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate.getTime() === today.getTime() && t.status !== 'completed';
            }).length;

            const overdue = tasks.filter(t => t.isOverdue && t.status !== 'completed').length;
            const bestTeamLead = bestTeamsRes.data.data?.[0] || null;

            setTaskStats({ assignedToday, dueToday, overdue, bestTeamLead });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getPerformanceColor = (status) => {
        switch (status) {
            case 'doing_great': return 'text-green-700 bg-green-50 border-green-200';
            case 'average': return 'text-orange-700 bg-orange-50 border-orange-200';
            case 'needs_attention': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-gray-700 bg-gray-50 border-gray-200';
        }
    };

    const getPerformanceLabel = (status) => {
        switch (status) {
            case 'doing_great': return 'Best Performing';
            case 'average': return 'Average';
            case 'needs_attention': return 'Needs Improvement';
            default: return 'Unknown';
        }
    };

    const getRankBadge = (index) => {
        const badges = ['1st', '2nd', '3rd', '4th', '5th'];
        return badges[index] || `${index + 1}th`;
    };

    // Prepare chart data
    const taskStatusData = stats ? [
        { name: 'Completed', value: stats.completedTasks, color: '#10B981' },
        { name: 'In Progress', value: stats.inProgressTasks, color: '#F59E0B' },
        { name: 'Pending', value: stats.pendingTasks, color: '#6B7280' },
        { name: 'Overdue', value: stats.overdueTasks, color: '#EF4444' }
    ] : [];

    const teamCompletionData = bestTeams.map(team => ({
        name: team.teamName?.length > 15 ? team.teamName.substring(0, 15) + '...' : (team.teamName || 'Unknown'),
        completion: team.completionRate || 0,
        overdue: team.overdueTasks || 0
    }));

    if (loading) {
        return (
            <Layout title="Admin Dashboard">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Admin Dashboard">
            <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500 mt-0.5 sm:mt-1 text-xs sm:text-sm">Real-time analytics</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-green-50 text-green-700 rounded-lg text-xs sm:text-sm font-medium border border-green-200">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Live</span>
                        </div>
                        <button
                            onClick={fetchDashboardData}
                            disabled={refreshing}
                            className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 flex items-center gap-1.5 text-xs sm:text-sm"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">Total Teams</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{stats?.totalTeams || 0}</p>
                                <div className="mt-1.5 sm:mt-2">
                                    <span className="text-xs text-gray-600">{stats?.totalTeamLeads || 0} Leads</span>
                                </div>
                            </div>
                            <div className="p-2.5 sm:p-3 bg-blue-200 rounded-lg flex-shrink-0 ml-2">
                                <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-blue-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">Total Members</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{stats?.totalMembers || 0}</p>
                                <div className="mt-1.5 sm:mt-2">
                                    <span className="text-xs text-green-600 font-medium">Active</span>
                                </div>
                            </div>
                            <div className="p-2.5 sm:p-3 bg-purple-200 rounded-lg flex-shrink-0 ml-2">
                                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-purple-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">Total Tasks</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{stats?.totalTasks || 0}</p>
                                <div className="mt-1.5 sm:mt-2">
                                    <span className="text-xs text-green-600 font-medium">{stats?.completedTasks || 0} Done</span>
                                </div>
                            </div>
                            <div className="p-2.5 sm:p-3 bg-orange-200 rounded-lg flex-shrink-0 ml-2">
                                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-orange-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-2">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">Progress</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.overallProgress || 0}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-1.5 sm:mt-2">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 sm:h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${stats?.overallProgress || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="p-2.5 sm:p-3 bg-green-200 rounded-lg flex-shrink-0">
                                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-green-700" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today's Task Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-4 border border-cyan-200 shadow-sm">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-700" />
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5">Assigned Today</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{taskStats.assignedToday}</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-4 border border-amber-200 shadow-sm">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5">Due Today</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{taskStats.dueToday}</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-4 border border-red-200 shadow-sm">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5">Overdue</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{taskStats.overdue}</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-4 border border-emerald-200 shadow-sm">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5">Best Lead</p>
                            {taskStats.bestTeamLead ? (
                                <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 truncate">{taskStats.bestTeamLead.leadName}</p>
                            ) : (
                                <p className="text-sm font-bold text-gray-500">No data</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
                    {/* LEFT SIDE - Charts (8 columns) */}
                    <div className="lg:col-span-8 space-y-3 sm:space-y-4">
                        {/* Team Completion Rate Bar Chart */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-gray-200 shadow-sm">
                            <div className="mb-3 sm:mb-4">
                                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                                    <span>Team Completion</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Completion % by team</p>
                            </div>
                            <div className="h-40 sm:h-48 lg:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={teamCompletionData} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: '#6B7280', fontSize: 10 }}
                                            axisLine={{ stroke: '#E5E7EB' }}
                                        />
                                        <YAxis
                                            tick={{ fill: '#6B7280', fontSize: 10 }}
                                            axisLine={{ stroke: '#E5E7EB' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Bar
                                            dataKey="completion"
                                            fill="#10B981"
                                            name="Completion %"
                                            radius={[6, 6, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Task Status Distribution Pie Chart */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-gray-200 shadow-sm">
                            <div className="mb-3 sm:mb-4">
                                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                    <span>Task Status</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Overall breakdown</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                                <div className="h-32 w-32 sm:h-40 sm:w-40 lg:h-48 lg:w-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={taskStatusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {taskStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ fontSize: '12px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 w-full grid grid-cols-2 gap-2 sm:gap-3">
                                    {taskStatusData.map((item) => (
                                        <div key={item.name} className="flex items-center gap-1.5 sm:gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            ></div>
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm text-gray-700 font-medium truncate">{item.name}</p>
                                                <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR (4 columns) */}
                    <div className="lg:col-span-4 space-y-3 sm:space-y-4">
                        {/* Best Performing Teams */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-3">
                                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                                <h3 className="text-sm sm:text-base font-bold text-gray-900">Top Teams</h3>
                            </div>
                            <div className="space-y-2">
                                {bestTeams.slice(0, 5).map((team, index) => (
                                    <div
                                        key={team.teamId}
                                        className="flex items-center gap-2 p-2 sm:p-2.5 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-100 hover:shadow-sm transition-shadow"
                                    >
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-orange-200 flex-shrink-0">
                                            <span className="text-orange-600 font-bold text-xs sm:text-sm">#{index + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{team.teamName || 'Unknown'}</p>
                                            <p className="text-xs text-gray-600 truncate">{team.leadName || 'Unknown'}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs sm:text-sm font-bold text-green-600">{team.completionRate || 0}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Task Status Overview */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3">Quick Stats</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 sm:p-2.5 bg-green-50 rounded-lg border border-green-100">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                        <span className="text-xs sm:text-sm font-medium text-gray-700">Completed</span>
                                    </div>
                                    <span className="text-base sm:text-lg font-bold text-green-600">{stats?.completedTasks || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 sm:p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                                        <span className="text-xs sm:text-sm font-medium text-gray-700">In Progress</span>
                                    </div>
                                    <span className="text-base sm:text-lg font-bold text-orange-600">{stats?.inProgressTasks || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 sm:p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                        <span className="text-xs sm:text-sm font-medium text-gray-700">Pending</span>
                                    </div>
                                    <span className="text-base sm:text-lg font-bold text-gray-600">{stats?.pendingTasks || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 sm:p-2.5 bg-red-50 rounded-lg border border-red-100">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                        <span className="text-xs sm:text-sm font-medium text-gray-700">Overdue</span>
                                    </div>
                                    <span className="text-base sm:text-lg font-bold text-red-600">{stats?.overdueTasks || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdminDashboard;
