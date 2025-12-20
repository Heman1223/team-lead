import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Target, Briefcase, CheckCircle2, Activity, AlertCircle, Clock, Calendar, TrendingUp, Award, Users, BarChart3 } from 'lucide-react';
import { adminUsersAPI } from '../services/adminApi';
import Layout from '../components/Layout';

const MemberDetailsPage = () => {
    const { memberId } = useParams();
    const navigate = useNavigate();
    const [memberDetails, setMemberDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMemberDetails();
    }, [memberId]);

    const fetchMemberDetails = async () => {
        try {
            setLoading(true);
            const response = await adminUsersAPI.getDetails(memberId);
            setMemberDetails(response.data.data);
        } catch (error) {
            console.error('Error fetching member details:', error);
            alert('Failed to load member details');
        } finally {
            setLoading(false);
        }
    };

    const getActivityColor = (level) => {
        switch (level) {
            case 'Very High': return 'text-green-600';
            case 'High': return 'text-blue-600';
            case 'Medium': return 'text-orange-600';
            default: return 'text-gray-600';
        }
    };

    const getActivityBgColor = (level) => {
        switch (level) {
            case 'Very High': return 'bg-green-100 border-green-200';
            case 'High': return 'bg-blue-100 border-blue-200';
            case 'Medium': return 'bg-orange-100 border-orange-200';
            default: return 'bg-gray-100 border-gray-200';
        }
    };

    const getActivityProgress = (level) => {
        switch (level) {
            case 'Very High': return 100;
            case 'High': return 75;
            case 'Medium': return 50;
            default: return 25;
        }
    };

    if (loading) {
        return (
            <Layout title="Member Details">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading member details...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!memberDetails) {
        return (
            <Layout title="Member Details">
                <div className="text-center py-12">
                    <p className="text-gray-500">Member not found</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700"
                    >
                        Go Back
                    </button>
                </div>
            </Layout>
        );
    }

    const { user, tasks, activities, taskStats, activityLevel, recentActivityCount } = memberDetails;

    return (
        <Layout title={user.name}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                </div>

                {/* Member Profile Card */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl">
                    <div className="flex items-start gap-6">
                        <div className="w-32 h-32 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-6xl font-bold shadow-lg">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-orange-100">
                                    <Mail className="w-5 h-5" />
                                    <span className="text-lg">{user.email}</span>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center gap-2 text-orange-100">
                                        <Phone className="w-5 h-5" />
                                        <span className="text-lg">{user.phone}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                                    <Award className="w-5 h-5" />
                                    <span className="font-semibold">{user.role.replace('_', ' ').toUpperCase()}</span>
                                </div>
                                {user.designation && (
                                    <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                                        <Briefcase className="w-5 h-5" />
                                        <span className="font-semibold">{user.designation}</span>
                                    </div>
                                )}
                                {user.coreField && (
                                    <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                                        <Target className="w-5 h-5" />
                                        <span className="font-semibold">{user.coreField}</span>
                                    </div>
                                )}
                                {user.teamId && (
                                    <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                                        <Users className="w-5 h-5" />
                                        <span className="font-semibold">Team: {user.teamId.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-orange-100 text-sm mb-1">Status</p>
                            <p className={`text-xl font-bold px-4 py-2 rounded-lg ${
                                user.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Activity Level Card */}
                <div className={`rounded-2xl p-6 border-2 ${getActivityBgColor(activityLevel)}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Activity Level</h2>
                            <p className="text-sm text-gray-600">Based on last 7 days performance</p>
                        </div>
                        <div className="text-center">
                            <div className={`text-5xl font-bold ${getActivityColor(activityLevel)}`}>
                                {activityLevel}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{recentActivityCount} activities</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                            className={`h-4 rounded-full transition-all ${
                                activityLevel === 'Very High' ? 'bg-green-500' :
                                activityLevel === 'High' ? 'bg-blue-500' :
                                activityLevel === 'Medium' ? 'bg-orange-500' :
                                'bg-gray-500'
                            }`}
                            style={{ width: `${getActivityProgress(activityLevel)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Task Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 font-medium">Total Tasks</p>
                                <p className="text-3xl font-bold text-gray-900">{taskStats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 font-medium">Completed</p>
                                <p className="text-3xl font-bold text-green-600">{taskStats.completed}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Activity className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 font-medium">In Progress</p>
                                <p className="text-3xl font-bold text-orange-600">{taskStats.inProgress}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 font-medium">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600">{taskStats.pending}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 font-medium">Overdue</p>
                                <p className="text-3xl font-bold text-red-600">{taskStats.overdue}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            Performance Overview
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-700 font-medium">Completion Rate</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className="bg-green-500 h-3 rounded-full transition-all"
                                        style={{ width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-700 font-medium">Success Rate</span>
                                    <span className="text-lg font-bold text-green-600">
                                        {taskStats.total > 0 ? Math.round(((taskStats.completed + taskStats.inProgress) / taskStats.total) * 100) : 0}%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600">Tasks completed or in progress</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Recent Activity
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <span className="text-sm text-gray-700 font-medium">Last 7 Days</span>
                                <span className="text-lg font-bold text-blue-600">{recentActivityCount} actions</span>
                            </div>
                            {user.lastLogin && (
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                    <span className="text-sm text-gray-700 font-medium">Last Login</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {new Date(user.lastLogin).toLocaleString()}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <span className="text-sm text-gray-700 font-medium">Member Since</span>
                                <span className="text-sm font-bold text-gray-900">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* All Tasks */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-orange-600" />
                        All Tasks ({tasks.length})
                    </h3>
                    {tasks.length > 0 ? (
                        <div className="space-y-3">
                            {tasks.map(task => (
                                <div key={task._id} className="p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-lg mb-1">{task.title}</h4>
                                            {task.description && (
                                                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                            )}
                                        </div>
                                        <span className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap ml-4 ${
                                            task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                            task.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {task.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>Due: <span className="font-medium">{new Date(task.deadline).toLocaleDateString()}</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Award className="w-4 h-4" />
                                            <span>Priority: <span className={`font-medium ${
                                                task.priority === 'high' ? 'text-red-600' :
                                                task.priority === 'medium' ? 'text-orange-600' :
                                                'text-green-600'
                                            }`}>{task.priority.toUpperCase()}</span></span>
                                        </div>
                                        {task.teamId && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Users className="w-4 h-4" />
                                                <span>Team: <span className="font-medium">{task.teamId.name}</span></span>
                                            </div>
                                        )}
                                        {task.assignedBy && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <span>Assigned by: <span className="font-medium">{task.assignedBy.name}</span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-12">No tasks assigned yet</p>
                    )}
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-orange-600" />
                        Recent Activity Timeline ({activities.length})
                    </h3>
                    {activities.length > 0 ? (
                        <div className="space-y-3">
                            {activities.map(activity => (
                                <div key={activity._id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex-shrink-0 w-3 h-3 bg-orange-500 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900 font-medium">{activity.details}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(activity.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-12">No recent activity</p>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default MemberDetailsPage;
