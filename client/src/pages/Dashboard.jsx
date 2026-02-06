import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    CheckCircle, Clock, AlertCircle, Users, TrendingUp, 
    Calendar, Phone, Bell, Activity, Target, BarChart3,
    ChevronRight, Plus, Filter
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, teamsAPI, usersAPI, leadsAPI } from '../services/api';

const Dashboard = () => {
    const { user, isTeamLead } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [myTasks, setMyTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [leadStats, setLeadStats] = useState({
        total: 0,
        new: 0,
        contacted: 0,
        interested: 0,
        converted: 0,
        conversionRate: 0
    });
    const [leadChartData, setLeadChartData] = useState([]);
    const [taskStats, setTaskStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
        notStarted: 0
    });
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, [selectedMonth, selectedYear]); // Re-fetch when month or year changes

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Calculate date range for selected month
            const startDate = new Date(selectedYear, selectedMonth, 1);
            const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
            
            if (isTeamLead) {
                // Fetch team lead specific data
                const [tasksRes, teamRes, leadsRes] = await Promise.all([
                    tasksAPI.getMyTasks(),
                    teamsAPI.getMyTeam(),
                    leadsAPI.getStats()
                ]);

                const tasks = tasksRes.data.data || [];
                
                // Filter tasks by selected month
                const filteredTasks = tasks.filter(t => {
                    const taskDate = new Date(t.createdAt);
                    return taskDate >= startDate && taskDate <= endDate;
                });
                
                setMyTasks(filteredTasks);

                // Calculate task statistics from filtered tasks
                const stats = {
                    total: filteredTasks.length,
                    completed: filteredTasks.filter(t => t.status === 'completed').length,
                    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
                    overdue: filteredTasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && new Date(t.deadline || t.dueDate) < new Date())).length,
                    notStarted: filteredTasks.filter(t => t.status === 'not_started' || t.status === 'assigned').length
                };
                setTaskStats(stats);

                // Set lead statistics
                if (leadsRes.data.data) {
                    const leadData = leadsRes.data.data;
                    setLeadStats({
                        total: leadData.totalLeads || 0,
                        new: leadData.statusDist?.new || 0,
                        contacted: leadData.statusDist?.contacted || 0,
                        interested: leadData.statusDist?.interested || 0,
                        converted: leadData.convertedLeads || 0,
                        conversionRate: leadData.conversionRate || 0
                    });

                    // Prepare chart data for lead status distribution
                    const statusDist = leadData.statusDist || {};
                    setLeadChartData([
                        { name: 'New', value: statusDist.new || 0, color: '#3b82f6' },
                        { name: 'Contacted', value: statusDist.contacted || 0, color: '#6366f1' },
                        { name: 'Interested', value: statusDist.interested || 0, color: '#8b5cf6' },
                        { name: 'Follow Up', value: statusDist.follow_up || 0, color: '#f59e0b' },
                        { name: 'Converted', value: statusDist.converted || 0, color: '#10b981' },
                        { name: 'Not Interested', value: statusDist.not_interested || 0, color: '#ef4444' }
                    ].filter(item => item.value > 0));
                }

                // Get upcoming deadlines (next 7 days) from filtered tasks
                const now = new Date();
                const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const upcoming = filteredTasks
                    .filter(t => {
                        const deadline = new Date(t.deadline || t.dueDate);
                        return t.status !== 'completed' && deadline >= now && deadline <= nextWeek;
                    })
                    .sort((a, b) => new Date(a.deadline || a.dueDate) - new Date(b.deadline || b.dueDate))
                    .slice(0, 5);
                setUpcomingDeadlines(upcoming);

                // Set team members
                if (teamRes.data.data) {
                    setTeamMembers(teamRes.data.data.members || []);
                }
            } else {
                // Team member view
                const [tasksRes, leadsRes] = await Promise.all([
                    tasksAPI.getMyTasks(),
                    leadsAPI.getStats()
                ]);
                
                const tasks = tasksRes.data.data || [];
                
                // Filter tasks: include those created in selected month OR those currently active (not completed)
                const filteredTasks = tasks.filter(t => {
                    const taskDate = new Date(t.createdAt);
                    const isInRange = taskDate >= startDate && taskDate <= endDate;
                    const isActive = t.status !== 'completed';
                    return isInRange || isActive;
                });
                
                setMyTasks(filteredTasks);

                const stats = {
                    total: filteredTasks.length,
                    completed: filteredTasks.filter(t => t.status === 'completed').length,
                    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
                    overdue: filteredTasks.filter(t => t.status === 'overdue').length,
                    notStarted: filteredTasks.filter(t => t.status === 'not_started').length
                };
                setTaskStats(stats);

                // Set lead statistics for team members
                if (leadsRes.data.data) {
                    const leadData = leadsRes.data.data;
                    setLeadStats({
                        total: leadData.totalLeads || 0,
                        new: leadData.statusDist?.new || 0,
                        contacted: leadData.statusDist?.contacted || 0,
                        interested: leadData.statusDist?.interested || 0,
                        converted: leadData.convertedLeads || 0,
                        conversionRate: leadData.conversionRate || 0
                    });

                    // Prepare chart data for lead status distribution
                    const statusDist = leadData.statusDist || {};
                    setLeadChartData([
                        { name: 'New', value: statusDist.new || 0, color: '#3b82f6' },
                        { name: 'Contacted', value: statusDist.contacted || 0, color: '#6366f1' },
                        { name: 'Interested', value: statusDist.interested || 0, color: '#8b5cf6' },
                        { name: 'Follow Up', value: statusDist.follow_up || 0, color: '#f59e0b' },
                        { name: 'Converted', value: statusDist.converted || 0, color: '#10b981' },
                        { name: 'Not Interested', value: statusDist.not_interested || 0, color: '#ef4444' }
                    ].filter(item => item.value > 0));
                }
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getCompletionRate = () => {
        if (taskStats.total === 0) return 0;
        return Math.round((taskStats.completed / taskStats.total) * 100);
    };

    const getOnlineMembers = () => {
        return teamMembers.filter(m => m.status === 'online').length;
    };

    const getTaskProgress = (task) => {
        if (task.subtasks && task.subtasks.length > 0) {
            const completed = task.subtasks.filter(st => st.status === 'completed').length;
            return Math.round((completed / task.subtasks.length) * 100);
        }
        return task.progressPercentage || 0;
    };

    const formatDeadline = (deadline) => {
        const now = new Date();
        const due = new Date(deadline);
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `${diffDays} days left`;
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'low': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'in_progress': return 'bg-blue-500';
            case 'overdue': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    if (loading) {
        return (
            <Layout title="Dashboard">
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
        <Layout title="Dashboard">
            <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">
                                Welcome back, {user?.name?.split(' ')[0]}! 👋
                            </h2>
                            <p className="text-orange-100">
                                {isTeamLead 
                                    ? "Here's an overview of your team's activity and performance." 
                                    : "Here's an overview of your tasks and progress."}
                            </p>
                        </div>
                        {/* Month Filter */}
                        <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-xl px-3 py-2">
                            <Filter className="w-4 h-4" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer"
                            >
                                <option value={0} className="text-gray-900">January</option>
                                <option value={1} className="text-gray-900">February</option>
                                <option value={2} className="text-gray-900">March</option>
                                <option value={3} className="text-gray-900">April</option>
                                <option value={4} className="text-gray-900">May</option>
                                <option value={5} className="text-gray-900">June</option>
                                <option value={6} className="text-gray-900">July</option>
                                <option value={7} className="text-gray-900">August</option>
                                <option value={8} className="text-gray-900">September</option>
                                <option value={9} className="text-gray-900">October</option>
                                <option value={10} className="text-gray-900">November</option>
                                <option value={11} className="text-gray-900">December</option>
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer"
                            >
                                <option value={2024} className="text-gray-900">2024</option>
                                <option value={2025} className="text-gray-900">2025</option>
                                <option value={2026} className="text-gray-900">2026</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Lead Stats */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Leads</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{leadStats.total}</p>
                                <p className="text-xs text-gray-500 mt-1">In pipeline</p>
                            </div>
                            <div className="p-4 bg-purple-100 rounded-xl">
                                <Users className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Converted</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{leadStats.converted}</p>
                                <p className="text-xs text-gray-500 mt-1">{leadStats.conversionRate}% conversion</p>
                            </div>
                            <div className="p-4 bg-green-100 rounded-xl">
                                <TrendingUp className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* Task Stats */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Tasks</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{taskStats.total}</p>
                                <p className="text-xs text-gray-500 mt-1">Assigned to you</p>
                            </div>
                            <div className="p-4 bg-blue-100 rounded-xl">
                                <Target className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Completed</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{taskStats.completed}</p>
                                <p className="text-xs text-gray-500 mt-1">{getCompletionRate()}% completion rate</p>
                            </div>
                            <div className="p-4 bg-green-100 rounded-xl">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Lead Pipeline & My Tasks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Lead Pipeline */}
                    {leadChartData.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Lead Pipeline</h3>
                                    <p className="text-sm text-gray-500 mt-1">Status overview</p>
                                </div>
                            </div>
                            
                            {/* Simple Bar Visualization */}
                            <div className="space-y-4">
                                {leadChartData.map((item, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{item.value}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                                            <div
                                                className="h-2.5 rounded-full transition-all duration-500"
                                                style={{ 
                                                    width: `${(item.value / leadStats.total) * 100}%`,
                                                    backgroundColor: item.color
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900">{leadStats.total}</p>
                                        <p className="text-xs text-gray-600 mt-1">Total</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">{leadStats.converted}</p>
                                        <p className="text-xs text-gray-600 mt-1">Converted</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-orange-600">{leadStats.conversionRate}%</p>
                                        <p className="text-xs text-gray-600 mt-1">Rate</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* My Tasks */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {isTeamLead ? 'My Assigned Tasks' : 'My Tasks'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Recent activities</p>
                            </div>
                            <button
                                onClick={() => navigate('/tasks')}
                                className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                            >
                                View All
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {myTasks.length === 0 ? (
                            <div className="text-center py-12">
                                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">No tasks assigned yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {myTasks.slice(0, 5).map((task) => (
                                    <div
                                        key={task._id}
                                        onClick={() => navigate(isTeamLead ? '/task-breakdown' : '/tasks')}
                                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer hover:border-orange-300"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                                                <p className="text-sm text-gray-600 line-clamp-1">{task.description}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}></div>
                                                <span className="text-xs text-gray-600 capitalize">{task.status?.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Calendar className="w-3 h-3" />
                                                {formatDeadline(task.deadline || task.dueDate)}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-3">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-orange-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${getTaskProgress(task)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Team Lead Specific Section */}
                {isTeamLead && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Team Status */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Team Overview</h3>
                                <Users className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-semibold text-gray-700">Online Members</span>
                                    </div>
                                    <span className="text-2xl font-bold text-green-600">{getOnlineMembers()}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                        <span className="text-sm font-semibold text-gray-700">Total Members</span>
                                    </div>
                                    <span className="text-2xl font-bold text-gray-900">{teamMembers.length}</span>
                                </div>
                                <button
                                    onClick={() => navigate('/team')}
                                    className="w-full mt-2 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                                >
                                    View Team Details
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Task Progress */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Task Progress</h3>
                                <Activity className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="space-y-4">
                                <div className="text-center py-4">
                                    <p className="text-5xl font-bold text-gray-900">{getCompletionRate()}%</p>
                                    <p className="text-sm text-gray-600 mt-2">Completion Rate</p>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${getCompletionRate()}%` }}
                                    ></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                        <p className="text-xl font-bold text-green-600">{taskStats.completed}</p>
                                        <p className="text-xs text-gray-600 mt-1">Completed</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-xl font-bold text-gray-900">{taskStats.total - taskStats.completed}</p>
                                        <p className="text-xs text-gray-600 mt-1">Remaining</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upcoming Deadlines - Team Lead Only */}
                {isTeamLead && upcomingDeadlines.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-600" />
                                Upcoming Deadlines
                            </h3>
                            <span className="text-sm text-gray-600">Next 7 days</span>
                        </div>
                        <div className="space-y-3">
                            {upcomingDeadlines.map((task) => (
                                <div
                                    key={task._id}
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1 h-12 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{task.title}</p>
                                            <p className="text-xs text-gray-600">
                                                {task.assignedTo?.name || 'Unassigned'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-orange-600">
                                            {formatDeadline(task.deadline || task.dueDate)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(task.deadline || task.dueDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Dashboard;
