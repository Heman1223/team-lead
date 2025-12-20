import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    CheckCircle, Clock, AlertCircle, Users, TrendingUp, 
    Calendar, Phone, Bell, Activity, Target, BarChart3,
    ChevronRight, Plus, RefreshCw
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, teamsAPI, usersAPI } from '../services/api';

const Dashboard = () => {
    const { user, isTeamLead } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [myTasks, setMyTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
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
        // Refresh data every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            if (isTeamLead) {
                // Fetch team lead specific data
                const [tasksRes, teamRes] = await Promise.all([
                    tasksAPI.getMyTasks(),
                    teamsAPI.getMyTeam()
                ]);

                const tasks = tasksRes.data.data || [];
                setMyTasks(tasks);

                // Calculate task statistics
                const stats = {
                    total: tasks.length,
                    completed: tasks.filter(t => t.status === 'completed').length,
                    inProgress: tasks.filter(t => t.status === 'in_progress').length,
                    overdue: tasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && new Date(t.deadline || t.dueDate) < new Date())).length,
                    notStarted: tasks.filter(t => t.status === 'not_started' || t.status === 'assigned').length
                };
                setTaskStats(stats);

                // Get upcoming deadlines (next 7 days)
                const now = new Date();
                const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const upcoming = tasks
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
                const tasksRes = await tasksAPI.getMyTasks();
                const tasks = tasksRes.data.data || [];
                setMyTasks(tasks);

                const stats = {
                    total: tasks.length,
                    completed: tasks.filter(t => t.status === 'completed').length,
                    inProgress: tasks.filter(t => t.status === 'in_progress').length,
                    overdue: tasks.filter(t => t.status === 'overdue').length,
                    notStarted: tasks.filter(t => t.status === 'not_started').length
                };
                setTaskStats(stats);
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
                    <div className="flex items-center justify-between">
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
                        <button
                            onClick={fetchDashboardData}
                            className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-all"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                <p className="text-sm font-semibold text-gray-600">In Progress</p>
                                <p className="text-3xl font-bold text-blue-600 mt-2">{taskStats.inProgress}</p>
                                <p className="text-xs text-gray-500 mt-1">Active tasks</p>
                            </div>
                            <div className="p-4 bg-blue-100 rounded-xl">
                                <Activity className="w-8 h-8 text-blue-600" />
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

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Overdue</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">{taskStats.overdue}</p>
                                <p className="text-xs text-gray-500 mt-1">Needs attention</p>
                            </div>
                            <div className="p-4 bg-red-100 rounded-xl">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Lead Specific Section */}
                {isTeamLead && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Team Status */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Team Status</h3>
                                <Users className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-semibold text-gray-700">Online</span>
                                    </div>
                                    <span className="text-lg font-bold text-green-600">{getOnlineMembers()}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <span className="text-sm font-semibold text-gray-700">Total Members</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">{teamMembers.length}</span>
                                </div>
                                <button
                                    onClick={() => navigate('/team')}
                                    className="w-full mt-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                                >
                                    View Team
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                                <Activity className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="space-y-2">
                                <button
                                    onClick={() => navigate('/task-breakdown')}
                                    className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all font-semibold text-sm flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Break Down Task
                                </button>
                                <button
                                    onClick={() => navigate('/team')}
                                    className="w-full px-4 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-all font-semibold text-sm flex items-center gap-2"
                                >
                                    <Phone className="w-4 h-4" />
                                    Call Team Member
                                </button>
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-all font-semibold text-sm flex items-center gap-2"
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    View Reports
                                </button>
                            </div>
                        </div>

                        {/* Completion Progress */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Overall Progress</h3>
                                <TrendingUp className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="relative w-32 h-32">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="#e5e7eb"
                                            strokeWidth="12"
                                            fill="none"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="#10b981"
                                            strokeWidth="12"
                                            fill="none"
                                            strokeDasharray={`${getCompletionRate() * 3.51} 351`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-gray-900">{getCompletionRate()}%</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-4">Task Completion Rate</p>
                                <div className="mt-4 w-full space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Completed</span>
                                        <span className="font-semibold text-green-600">{taskStats.completed}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Remaining</span>
                                        <span className="font-semibold text-gray-900">{taskStats.total - taskStats.completed}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* My Tasks Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">
                            {isTeamLead ? 'My Assigned Tasks' : 'My Tasks'}
                        </h3>
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
                        <div className="space-y-3">
                            {myTasks.slice(0, 5).map((task) => (
                                <div
                                    key={task._id}
                                    onClick={() => navigate(isTeamLead ? '/task-breakdown' : '/tasks')}
                                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer"
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
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}></div>
                                                <span className="text-xs text-gray-600 capitalize">{task.status?.replace('_', ' ')}</span>
                                            </div>
                                            {task.subtasks && task.subtasks.length > 0 && (
                                                <span className="text-xs text-gray-600">
                                                    {task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length} subtasks
                                                </span>
                                            )}
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

                {/* Upcoming Deadlines */}
                {isTeamLead && upcomingDeadlines.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
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
