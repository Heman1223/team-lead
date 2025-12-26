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
        // Auto-refresh every 30 seconds
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

            setStats(statsRes.data.data);
            setTeamPerformance(performanceRes.data.data);
            setBestTeams(bestTeamsRes.data.data);

            // Calculate today's task statistics
            const tasks = tasksRes.data.data || [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const assignedToday = tasks.filter(t => {
                const assignedDate = new Date(t.assignedAt || t.createdAt);
                assignedDate.setHours(0, 0, 0, 0);
                return assignedDate.getTime() === today.getTime();
            }).length;

            const dueToday = tasks.filter(t => {
                const dueDate = new Date(t.dueDate || t.deadline);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate.getTime() === today.getTime() && t.status !== 'completed' && t.status !== 'cancelled';
            }).length;

            const overdue = tasks.filter(t => t.isOverdue && t.status !== 'completed' && t.status !== 'cancelled').length;

            // Find best responding team lead (highest completion rate)
            const bestTeamLead = bestTeamsRes.data.data && bestTeamsRes.data.data.length > 0
                ? bestTeamsRes.data.data[0]
                : null;

            setTaskStats({
                assignedToday,
                dueToday,
                overdue,
                bestTeamLead
            });
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

    const teamCompletionData = teamPerformance.map(team => ({
        name: team.teamName.length > 15 ? team.teamName.substring(0, 15) + '...' : team.teamName,
        completion: team.progressPercentage,
        overdue: team.overdueTasks
    }));

    const completionTrendData = stats?.completionTrend || [];

    if (loading) {
        return (
            <Layout title="Admin Dashboard">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading dashboard...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Admin Dashboard">
            <div className="space-y-6 p-4 sm:p-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team Lead Performance Dashboard</h1>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">Real-time analytics and team performance metrics</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="hidden sm:inline">Live</span>
                        </div>
                        <button
                            onClick={fetchDashboardData}
                            disabled={refreshing}
                            className="px-3 sm:px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 sm:p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Total Teams</p>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalTeams || 0}</p>
                                <div className="mt-3 flex items-center gap-1">
                                    <span className="text-xs text-gray-600">{stats?.totalTeamLeads || 0} Team Leads</span>
                                </div>
                            </div>
                            <div className="p-4 bg-blue-200 rounded-xl">
                                <Users className="w-8 h-8 text-blue-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Total Members</p>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalMembers || 0}</p>
                                <div className="mt-3 flex items-center gap-1">
                                    <span className="text-xs text-green-600 font-medium">Active Users</span>
                                </div>
                            </div>
                            <div className="p-4 bg-purple-200 rounded-xl">
                                <Briefcase className="w-8 h-8 text-purple-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Total Tasks</p>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalTasks || 0}</p>
                                <div className="mt-3 flex items-center gap-1">
                                    <span className="text-xs text-green-600 font-medium">{stats?.completedTasks || 0} Completed</span>
                                </div>
                            </div>
                            <div className="p-4 bg-orange-200 rounded-xl">
                                <CheckCircle className="w-8 h-8 text-orange-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600 mb-1">Overall Progress</p>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.overallProgress || 0}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${stats?.overallProgress || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="p-4 bg-green-200 rounded-xl ml-4">
                                <TrendingUp className="w-8 h-8 text-green-700" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today's Task Statistics - NEW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-6 border border-cyan-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Tasks Assigned Today</p>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{taskStats.assignedToday}</p>
                                <div className="mt-3 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-cyan-600" />
                                    <span className="text-xs text-cyan-600 font-medium">Today's Activity</span>
                                </div>
                            </div>
                            <div className="p-4 bg-cyan-200 rounded-xl">
                                <Zap className="w-8 h-8 text-cyan-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Tasks Due Today</p>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{taskStats.dueToday}</p>
                                <div className="mt-3 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span className="text-xs text-amber-600 font-medium">Needs Attention</span>
                                </div>
                            </div>
                            <div className="p-4 bg-amber-200 rounded-xl">
                                <Calendar className="w-8 h-8 text-amber-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Overdue Tasks</p>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{taskStats.overdue}</p>
                                <div className="mt-3 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-red-600" />
                                    <span className="text-xs text-red-600 font-medium">Urgent Action</span>
                                </div>
                            </div>
                            <div className="p-4 bg-red-200 rounded-xl">
                                <AlertCircle className="w-8 h-8 text-red-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Best Team Lead</p>
                                {taskStats.bestTeamLead ? (
                                    <>
                                        <p className="text-lg font-bold text-gray-900 mb-1 truncate">{taskStats.bestTeamLead.teamLead}</p>
                                        <div className="mt-2 flex items-center gap-1">
                                            <Trophy className="w-3 h-3 text-emerald-600" />
                                            <span className="text-xs text-emerald-600 font-medium">{taskStats.bestTeamLead.completionRate}% completion</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-lg font-bold text-gray-500">No data yet</p>
                                )}
                            </div>
                            <div className="p-4 bg-emerald-200 rounded-xl">
                                <Award className="w-8 h-8 text-emerald-700" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                    {/* LEFT SIDE - Charts (8 columns) */}
                    <div className="lg:col-span-8 space-y-5">
                        {/* Task Completion Trend */}
                        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                    Task Completion Trend
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Daily task completion over the last 7 days</p>
                            </div>
                            <div className="h-48 sm:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={completionTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            axisLine={{ stroke: '#E5E7EB' }}
                                        />
                                        <YAxis
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            axisLine={{ stroke: '#E5E7EB' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="completed"
                                            stroke="#3B82F6"
                                            strokeWidth={3}
                                            dot={{ fill: '#3B82F6', r: 5 }}
                                            activeDot={{ r: 7 }}
                                            name="Completed Tasks"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Team Completion Rate */}
                        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-orange-600" />
                                    Team Completion Rate
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Completion percentage and overdue tasks by team</p>
                            </div>
                            <div className="h-48 sm:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={teamCompletionData} barGap={8}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            axisLine={{ stroke: '#E5E7EB' }}
                                        />
                                        <YAxis
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            axisLine={{ stroke: '#E5E7EB' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Bar
                                            dataKey="completion"
                                            fill="#10B981"
                                            name="Completion %"
                                            radius={[8, 8, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="overdue"
                                            fill="#EF4444"
                                            name="Overdue Tasks"
                                            radius={[8, 8, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Task Status Distribution */}
                        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-purple-600" />
                                    Task Status Distribution
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Overall task status breakdown</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                                <div className="h-40 w-40 sm:h-48 sm:w-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={taskStatusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {taskStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #E5E7EB',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 w-full grid grid-cols-2 gap-3">
                                    {taskStatusData.map((item) => (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            ></div>
                                            <div>
                                                <p className="text-sm text-gray-700 font-medium">{item.name}</p>
                                                <p className="text-lg font-bold text-gray-900">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR (4 columns) */}
                    <div className="lg:col-span-4 space-y-5">
                        {/* Best Performing Teams */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-orange-600" />
                                    Top Teams
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {bestTeams.slice(0, 5).map((team, index) => (
                                    <div
                                        key={team.teamId}
                                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100 hover:shadow-sm transition-shadow cursor-pointer"
                                    >
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-orange-200 flex-shrink-0">
                                            <span className="text-orange-600 font-bold text-sm">{getRankBadge(index)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-gray-900 truncate">{team.teamName}</p>
                                            <p className="text-xs text-gray-600">{team.teamLead}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-bold text-green-600">{team.completionRate}%</p>
                                            <p className="text-xs text-gray-500">{team.avgResponseTime}h avg</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Task Status Overview */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                            <h3 className="text-base font-bold text-gray-900 mb-4">Quick Stats</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-medium text-gray-700">Completed</span>
                                    </div>
                                    <span className="text-lg font-bold text-green-600">{stats?.completedTasks || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                        <span className="text-sm font-medium text-gray-700">In Progress</span>
                                    </div>
                                    <span className="text-lg font-bold text-orange-600">{stats?.inProgressTasks || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Pending</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-600">{stats?.pendingTasks || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <span className="text-sm font-medium text-gray-700">Overdue</span>
                                    </div>
                                    <span className="text-lg font-bold text-red-600">{stats?.overdueTasks || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Performance Leaderboard */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Users className="w-6 h-6 text-orange-600" />
                            </div>
                            Team Lead Performance Evaluation
                        </h2>
                    </div>

                    {teamPerformance.length === 0 ? (
                        <div className="text-center py-16">
                            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">No Teams Yet</h3>
                            <p className="text-gray-600 mt-2">Create teams and assign tasks to see performance data</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {teamPerformance.map((team, index) => (
                                <div
                                    key={team.teamId}
                                    className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-gray-900">{team.teamName}</h3>
                                                <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">Lead: {team.teamLead.name}</p>
                                            <p className="text-xs text-gray-500">{team.memberCount} members</p>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${getPerformanceColor(team.performanceStatus)}`}>
                                            {getPerformanceLabel(team.performanceStatus)}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                                            <span className="text-sm font-bold text-orange-600">{team.progressPercentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full transition-all duration-500 ${team.performanceStatus === 'doing_great' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                                    team.performanceStatus === 'average' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                                        'bg-gradient-to-r from-red-500 to-red-600'
                                                    }`}
                                                style={{ width: `${team.progressPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                                            <p className="text-xs text-gray-600 font-medium">Total</p>
                                            <p className="text-lg font-bold text-gray-900">{team.totalTasks}</p>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                            <p className="text-xs text-gray-600 font-medium">Done</p>
                                            <p className="text-lg font-bold text-green-600">{team.completedTasks}</p>
                                        </div>
                                        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                                            <p className="text-xs text-gray-600 font-medium">Overdue</p>
                                            <p className="text-lg font-bold text-red-600">{team.overdueTasks}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                                        <div>
                                            <p className="text-xs text-gray-600 font-medium">Avg Completion</p>
                                            <p className="text-sm font-bold text-gray-900">{team.avgCompletionTime}h</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 font-medium">Recent Rate</p>
                                            <p className="text-sm font-bold text-gray-900">{team.recentCompletionRate} tasks/week</p>
                                        </div>
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

export default AdminDashboard;
