import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Mail, Phone, Target, Award, CheckCircle2, Activity, AlertCircle, BarChart3, Calendar, TrendingUp, Clock, UserMinus, Briefcase } from 'lucide-react';
import { adminTeamsAPI } from '../services/adminApi';
import Layout from '../components/Layout';

const TeamDetailsPage = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [teamDetails, setTeamDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeamDetails();
    }, [teamId]);

    const fetchTeamDetails = async () => {
        try {
            setLoading(true);
            const response = await adminTeamsAPI.getDetails(teamId);
            setTeamDetails(response.data.data);
        } catch (error) {
            console.error('Error fetching team details:', error);
            alert('Failed to load team details');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId, memberName) => {
        if (window.confirm(`Remove ${memberName} from this team?`)) {
            try {
                await adminTeamsAPI.removeMember(teamId, memberId);
                alert('✅ Member removed successfully!');
                fetchTeamDetails();
            } catch (error) {
                console.error('Error removing member:', error);
                alert('Failed to remove member');
            }
        }
    };

    const getHealthColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-red-600';
    };

    const getHealthBgColor = (score) => {
        if (score >= 80) return 'bg-green-100 border-green-200';
        if (score >= 60) return 'bg-blue-100 border-blue-200';
        if (score >= 40) return 'bg-orange-100 border-orange-200';
        return 'bg-red-100 border-red-200';
    };

    const getProgressColor = (progress) => {
        if (progress >= 75) return 'bg-green-500';
        if (progress >= 50) return 'bg-amber-500';
        if (progress >= 25) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    if (loading) {
        return (
            <Layout title="Team Details">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading team details...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!teamDetails) {
        return (
            <Layout title="Team Details">
                <div className="text-center py-12">
                    <p className="text-gray-500">Team not found</p>
                    <button
                        onClick={() => navigate('/admin/teams')}
                        className="mt-4 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700"
                    >
                        Back to Teams
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title={teamDetails.team.name}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/admin/teams')}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Teams
                    </button>
                </div>

                {/* Team Header Card */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{teamDetails.team.name}</h1>
                            <p className="text-orange-100 mb-4">{teamDetails.team.description || 'No description'}</p>
                            <div className="flex items-center gap-4">
                                {teamDetails.team.coreField && (
                                    <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                                        <Target className="w-4 h-4" />
                                        <span className="font-semibold">{teamDetails.team.coreField}</span>
                                    </div>
                                )}
                                {teamDetails.team.department && (
                                    <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                                        <Briefcase className="w-4 h-4" />
                                        <span className="font-semibold">{teamDetails.team.department}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-orange-100 text-sm mb-1">Created</p>
                            <p className="text-xl font-bold">{new Date(teamDetails.team.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Team Health Score */}
                <div className={`rounded-2xl p-6 border-2 ${getHealthBgColor(teamDetails.healthScore)}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Team Health Score</h2>
                            <p className="text-sm text-gray-600">Overall team performance indicator</p>
                        </div>
                        <div className="text-center">
                            <div className={`text-6xl font-bold ${getHealthColor(teamDetails.healthScore)}`}>
                                {teamDetails.healthScore}
                            </div>
                            <p className="text-lg font-semibold text-gray-600 mt-1">{teamDetails.teamStatus}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                            <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                            <p className="text-3xl font-bold text-gray-900">{teamDetails.completionRate}%</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                            <p className="text-sm text-gray-600 mb-1">Active Members</p>
                            <p className="text-3xl font-bold text-green-600">{teamDetails.activeMembers}/{teamDetails.team.members.length}</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                            <p className="text-sm text-gray-600 mb-1">Overdue Tasks</p>
                            <p className="text-3xl font-bold text-red-600">{teamDetails.taskStats.overdue}</p>
                        </div>
                    </div>
                </div>

                {/* Task Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 font-medium">Total Tasks</p>
                                <p className="text-3xl font-bold text-gray-900">{teamDetails.taskStats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 font-medium">Completed</p>
                                <p className="text-3xl font-bold text-green-600">{teamDetails.taskStats.completed}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Activity className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 font-medium">In Progress</p>
                                <p className="text-3xl font-bold text-orange-600">{teamDetails.taskStats.inProgress}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 font-medium">Overdue</p>
                                <p className="text-3xl font-bold text-red-600">{teamDetails.taskStats.overdue}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance & Team Lead */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            Performance Metrics
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-700 font-medium">Task Completion Speed</span>
                                    <span className="text-lg font-bold text-gray-900">{teamDetails.avgCompletionTime} days</span>
                                </div>
                                <p className="text-xs text-gray-600">Average time to complete tasks</p>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-700 font-medium">Success Rate</span>
                                    <span className="text-lg font-bold text-green-600">{teamDetails.completionRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className="bg-green-500 h-3 rounded-full transition-all"
                                        style={{ width: `${teamDetails.completionRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-orange-600" />
                            Team Lead
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                {teamDetails.team.leadId?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 text-xl mb-1">{teamDetails.team.leadId?.name}</p>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="w-4 h-4" />
                                        <span>{teamDetails.team.leadId?.email}</span>
                                    </div>
                                    {teamDetails.team.leadId?.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            <span>{teamDetails.team.leadId.phone}</span>
                                        </div>
                                    )}
                                    {teamDetails.team.leadId?.coreField && (
                                        <div className="flex items-center gap-2 text-sm text-orange-600 font-semibold">
                                            <Target className="w-4 h-4" />
                                            <span>{teamDetails.team.leadId.coreField}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Project */}
                {teamDetails.team.currentProject && (
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-amber-600" />
                            Current Project
                        </h3>
                        <p className="text-2xl font-bold text-gray-900 mb-4">{teamDetails.team.currentProject}</p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 font-medium">Progress</span>
                                <span className="font-bold text-gray-900">{teamDetails.team.projectProgress || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div 
                                    className={`h-4 rounded-full transition-all ${getProgressColor(teamDetails.team.projectProgress || 0)}`}
                                    style={{ width: `${teamDetails.team.projectProgress || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Members */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Users className="w-6 h-6 text-orange-600" />
                        Team Members ({teamDetails.memberActivity.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teamDetails.memberActivity.map(member => (
                            <div 
                                key={member.userId} 
                                className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200 cursor-pointer"
                                onClick={() => navigate(`/admin/member/${member.userId}`)}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                                        {member.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 text-lg">{member.name}</p>
                                        <p className="text-sm text-gray-600 mb-2">{member.email}</p>
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <div className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-lg">
                                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                                <span className="text-gray-700 font-medium">{member.tasksCompleted}/{member.tasksAssigned} tasks</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-lg">
                                                <Activity className="w-3 h-3 text-blue-600" />
                                                <span className="text-gray-700 font-medium">{member.recentActivity} activities</span>
                                            </div>
                                            <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                                member.completionRate >= 75 ? 'bg-green-100 text-green-700' :
                                                member.completionRate >= 50 ? 'bg-blue-100 text-blue-700' :
                                                member.completionRate >= 25 ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {member.completionRate}% success
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveMember(member.userId, member.name);
                                    }}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove from team"
                                >
                                    <UserMinus className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Tasks */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-orange-600" />
                        Recent Tasks ({teamDetails.tasks.length})
                    </h3>
                    {teamDetails.tasks.length > 0 ? (
                        <div className="space-y-3">
                            {teamDetails.tasks.slice(0, 15).map(task => (
                                <div key={task._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 text-lg mb-1">{task.title}</p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <Users className="w-4 h-4" />
                                                <span>Assigned to: <span className="font-medium">{task.assignedTo?.name}</span></span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <Clock className="w-4 h-4" />
                                                <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        task.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {task.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-12">No tasks assigned yet</p>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default TeamDetailsPage;
