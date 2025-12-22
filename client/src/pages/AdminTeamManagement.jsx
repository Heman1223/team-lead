import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, UserPlus, X, Search, Eye, Target, Briefcase, TrendingUp, Award, MoreVertical, Trash2, Edit, RefreshCw, Activity } from 'lucide-react';
import { adminTeamsAPI, adminUsersAPI, adminTasksAPI } from '../services/adminApi';
import Layout from '../components/Layout';

const AdminTeamManagement = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [teamLeads, setTeamLeads] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [teamTaskStats, setTeamTaskStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        objective: '',
        leadId: '',
        department: '',
        coreField: '',
        currentProject: '',
        projectProgress: 0,
        status: 'active',
        priority: 'medium',
        taskType: 'project_based',
        memberIds: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teamsRes, usersRes, tasksRes] = await Promise.all([
                adminTeamsAPI.getAll(),
                adminUsersAPI.getAll(),
                adminTasksAPI.getAll()
            ]);
            
            const teamsData = teamsRes.data.data || [];
            const tasksData = tasksRes.data.data || [];
            
            setTeams(teamsData);
            setUsers(usersRes.data.data || []);
            setTeamLeads(usersRes.data.data.filter(u => u.role === 'team_lead') || []);
            setTasks(tasksData);
            
            // Calculate task statistics for each team
            const statsMap = {};
            teamsData.forEach(team => {
                const teamTasks = tasksData.filter(task => 
                    task.teamId?._id === team._id || task.teamId === team._id
                );
                
                const completedTasks = teamTasks.filter(t => t.status === 'completed');
                const activeTasks = teamTasks.filter(t => 
                    t.status !== 'completed' && t.status !== 'cancelled'
                );
                const overdueTasks = teamTasks.filter(t => 
                    t.status !== 'completed' && 
                    t.status !== 'cancelled' && 
                    new Date(t.deadline || t.dueDate) < new Date()
                );
                
                // Calculate team progress from task progress (average)
                let calculatedProgress = 0;
                if (teamTasks.length > 0) {
                    const totalProgress = teamTasks.reduce((sum, task) => {
                        return sum + (task.progressPercentage || 0);
                    }, 0);
                    calculatedProgress = Math.round(totalProgress / teamTasks.length);
                }
                
                statsMap[team._id] = {
                    total: teamTasks.length,
                    active: activeTasks.length,
                    completed: completedTasks.length,
                    overdue: overdueTasks.length,
                    calculatedProgress: calculatedProgress
                };
            });
            
            setTeamTaskStats(statsMap);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = () => {
        setSelectedTeam(null);
        setFormData({
            name: '',
            description: '',
            objective: '',
            leadId: '',
            department: '',
            coreField: '',
            currentProject: '',
            projectProgress: 0,
            status: 'active',
            priority: 'medium',
            taskType: 'project_based',
            memberIds: []
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const selectedLead = users.find(u => u._id === formData.leadId);
            const teamData = {
                ...formData,
                coreField: selectedLead?.coreField || formData.coreField
            };
            await adminTeamsAPI.create(teamData);
            setShowModal(false);
            fetchData();
            alert('✅ Team created successfully!');
        } catch (error) {
            console.error('Error creating team:', error);
            alert(error.response?.data?.message || 'Failed to create team');
        }
    };

    const handleAddMembers = (team) => {
        setSelectedTeam(team);
        setFormData({ ...formData, memberIds: [] });
        setShowMemberModal(true);
    };

    const handleViewDetails = (team) => {
        navigate(`/admin/team/${team._id}`);
    };

    const handleEditTeam = (team) => {
        setSelectedTeam(team);
        setFormData({
            name: team.name,
            description: team.description || '',
            leadId: team.leadId?._id || '',
            department: team.department || '',
            coreField: team.coreField || '',
            currentProject: team.currentProject || '',
            projectProgress: team.projectProgress || 0,
            memberIds: []
        });
        setShowEditModal(true);
        setOpenMenuId(null);
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        try {
            await adminTeamsAPI.update(selectedTeam._id, {
                name: formData.name,
                description: formData.description,
                currentProject: formData.currentProject,
                projectProgress: formData.projectProgress,
                department: formData.department,
                coreField: formData.coreField
            });
            setShowEditModal(false);
            fetchData();
            alert('✅ Team updated successfully!');
        } catch (error) {
            console.error('Error updating team:', error);
            alert(error.response?.data?.message || 'Failed to update team');
        }
    };

    const handleAssignMembers = async (e) => {
        e.preventDefault();
        try {
            await adminTeamsAPI.assignMembers(selectedTeam._id, formData.memberIds);
            setShowMemberModal(false);
            fetchData();
            alert('✅ Members assigned successfully!');
        } catch (error) {
            console.error('Error assigning members:', error);
            alert(error.response?.data?.message || 'Failed to assign members');
        }
    };

    const handleDeleteTeam = async (teamId, teamName) => {
        if (window.confirm(`⚠️ Delete team "${teamName}"? All members will be unassigned.`)) {
            try {
                await adminTeamsAPI.delete(teamId);
                alert('✅ Team deleted successfully!');
                fetchData();
                setOpenMenuId(null);
            } catch (error) {
                console.error('Error deleting team:', error);
                alert('Failed to delete team');
            }
        }
    };

    const filteredTeams = teams.filter(team =>
        team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.coreField?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.leadId?.coreField?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableMembers = users.filter(u => 
        u.role === 'team_member' && 
        (!selectedTeam || !selectedTeam.members.some(m => m._id === u._id))
    );

    const getProgressColor = (progress) => {
        if (progress >= 75) return 'bg-green-500';
        if (progress >= 50) return 'bg-amber-500';
        if (progress >= 25) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    if (loading) {
        return (
            <Layout title="Team Management">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading teams...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <>
        <Layout title="Team Management">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 mt-1">Create and manage teams with detailed tracking</p>
                    </div>
                    <button
                        onClick={handleCreateTeam}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        Create Team
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Teams</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{teams.length}</p>
                            </div>
                            <div className="p-4 bg-orange-100 rounded-xl">
                                <Users className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Members</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {teams.reduce((sum, team) => sum + (team.members?.length || 0), 0)}
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl">
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Active Projects</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {teams.filter(t => t.currentProject).length}
                                </p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-xl">
                                <Briefcase className="w-8 h-8 text-amber-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Avg Progress</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {teams.length > 0 ? Math.round(teams.reduce((sum, t) => sum + (t.projectProgress || 0), 0) / teams.length) : 0}%
                                </p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-xl">
                                <TrendingUp className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search teams by name or core field..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Teams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTeams.map((team) => (
                        <div 
                            key={team._id} 
                            onClick={() => handleViewDetails(team)}
                            className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-200 cursor-pointer"
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{team.name}</h3>
                                        {(team.coreField || team.leadId?.coreField) && (
                                            <div className="flex items-center gap-1 text-orange-600 mb-2">
                                                <Target className="w-4 h-4" />
                                                <span className="text-sm font-semibold">{team.coreField || team.leadId?.coreField}</span>
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-600 line-clamp-2">{team.description || 'No description'}</p>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === team._id ? null : team._id);
                                            }}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                        
                                        {openMenuId === team._id && (
                                            <div 
                                                ref={menuRef}
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute right-0 top-10 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 py-2"
                                            >
                                                <button
                                                    onClick={() => {
                                                        handleViewDetails(team);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3"
                                                >
                                                    <Eye className="w-4 h-4 text-blue-600" />
                                                    <span className="font-medium">View Details</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleAddMembers(team);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-green-50 flex items-center gap-3"
                                                >
                                                    <UserPlus className="w-4 h-4 text-green-600" />
                                                    <span className="font-medium">Add Members</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleEditTeam(team);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-orange-50 flex items-center gap-3"
                                                >
                                                    <Edit className="w-4 h-4 text-orange-600" />
                                                    <span className="font-medium">Edit Team</span>
                                                </button>
                                                <div className="border-t border-gray-200 my-1"></div>
                                                <button
                                                    onClick={() => {
                                                        handleDeleteTeam(team._id, team.name);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="font-medium">Delete Team</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Team Lead Card */}
                                <div className="space-y-3 mb-4">
                                    <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md">
                                                {team.leadId?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{team.leadId?.name}</p>
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <Award className="w-3 h-3" />
                                                    <span>Team Lead</span>
                                                </div>
                                                {team.leadId?.coreField && (
                                                    <div className="flex items-center gap-1 text-xs text-orange-600 mt-0.5">
                                                        <Target className="w-3 h-3" />
                                                        <span className="font-semibold">{team.leadId.coreField}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Project Progress */}
                                    {team.currentProject && (
                                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Briefcase className="w-4 h-4 text-amber-600" />
                                                <span className="text-sm font-semibold text-gray-900">{team.currentProject}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-600">Progress</span>
                                                    <span className="font-bold text-gray-900">{team.projectProgress || 0}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full transition-all ${getProgressColor(team.projectProgress || 0)}`}
                                                        style={{ width: `${team.projectProgress || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Team Stats */}
                                    <div className="space-y-3">
                                        {/* Task Statistics */}
                                        {teamTaskStats[team._id] && (
                                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm font-semibold text-gray-900">Tasks</span>
                                                    </div>
                                                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">
                                                        {teamTaskStats[team._id].total}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div className="text-center">
                                                        <p className="text-gray-600">Active</p>
                                                        <p className="font-bold text-orange-600">{teamTaskStats[team._id].active}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-gray-600">Done</p>
                                                        <p className="font-bold text-green-600">{teamTaskStats[team._id].completed}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-gray-600">Overdue</p>
                                                        <p className="font-bold text-red-600">{teamTaskStats[team._id].overdue}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Team Completion Progress */}
                                        {teamTaskStats[team._id] && teamTaskStats[team._id].total > 0 && (
                                            <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-semibold text-gray-900">Completion Rate</span>
                                                    <span className="text-sm font-bold text-green-600">
                                                        {team.completionRate || 0}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full transition-all ${getProgressColor(team.completionRate || 0)}`}
                                                        style={{ width: `${team.completionRate || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Health Status */}
                                        <div className={`p-3 rounded-xl border ${
                                            team.healthStatus === 'healthy' ? 'bg-green-50 border-green-200' :
                                            team.healthStatus === 'at_risk' ? 'bg-yellow-50 border-yellow-200' :
                                            'bg-red-50 border-red-200'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        team.healthStatus === 'healthy' ? 'bg-green-500' :
                                                        team.healthStatus === 'at_risk' ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`}></div>
                                                    <span className="text-sm font-semibold text-gray-900">Team Health</span>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                                    team.healthStatus === 'healthy' ? 'bg-green-100 text-green-700' :
                                                    team.healthStatus === 'at_risk' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {team.healthStatus === 'healthy' ? '🟢 Healthy' :
                                                     team.healthStatus === 'at_risk' ? '🟡 At Risk' :
                                                     '🔴 Critical'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Members Count */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-3 bg-gray-50 rounded-xl text-center">
                                                <p className="text-xs text-gray-600 mb-1">Members</p>
                                                <p className="text-lg font-bold text-gray-900">{team.members?.length || 0}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-xl text-center">
                                                <p className="text-xs text-gray-600 mb-1">Status</p>
                                                <p className="text-lg font-bold text-green-600">Active</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredTeams.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-200">
                        <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No teams found</h3>
                        <p className="text-gray-600 mb-6">Get started by creating your first team.</p>
                        <button
                            onClick={handleCreateTeam}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Create Team
                        </button>
                    </div>
                )}
            </div>
        </Layout>

        {/* Create Team Modal */}
        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus className="w-6 h-6" />
                                Create New Team
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                        {/* Section 1: Team Basic Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-orange-200">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <span className="text-orange-600 font-bold">1</span>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">Team Basic Information</h4>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Team Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., Backend Development Team"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">Unique and meaningful name for the team</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Team Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Brief description of the team"
                                    rows="2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Team Objective / Responsibility
                                </label>
                                <textarea
                                    value={formData.objective}
                                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="What is this team responsible for?"
                                    rows="3"
                                />
                                <p className="mt-1 text-xs text-gray-500">Define the team's main responsibilities and goals</p>
                            </div>
                        </div>

                        {/* Section 2: Team Lead Assignment */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-orange-200">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <span className="text-orange-600 font-bold">2</span>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">Team Lead Assignment</h4>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Select Team Lead <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.leadId}
                                    onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                    required
                                >
                                    <option value="">Select Team Lead</option>
                                    {teamLeads.map(lead => (
                                        <option key={lead._id} value={lead._id}>
                                            {lead.name} {lead.email ? `(${lead.email})` : ''} {lead.coreField ? `- ${lead.coreField}` : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">This person becomes the owner of the team's tasks and performance</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Department
                                </label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., Engineering, Design, Marketing"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Core Field / Specialization
                                </label>
                                <input
                                    type="text"
                                    value={formData.coreField}
                                    onChange={(e) => setFormData({ ...formData, coreField: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., Web Development, Mobile Apps, UI/UX"
                                />
                            </div>
                        </div>

                        {/* Section 3: Team Members */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-orange-200">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <span className="text-orange-600 font-bold">3</span>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">Team Members (Optional)</h4>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Select Team Members
                                </label>
                                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50">
                                    {users.filter(u => u.role === 'team_member').length === 0 ? (
                                        <p className="text-gray-500 text-center py-4 text-sm">No team members available. You can add members later.</p>
                                    ) : (
                                        users.filter(u => u.role === 'team_member').map(member => (
                                            <label key={member._id} className="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.memberIds.includes(member._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, memberIds: [...formData.memberIds, member._id] });
                                                        } else {
                                                            setFormData({ ...formData, memberIds: formData.memberIds.filter(id => id !== member._id) });
                                                        }
                                                    }}
                                                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                                                    <p className="text-xs text-gray-600">{member.email}</p>
                                                    {member.coreField && (
                                                        <p className="text-xs text-orange-600 flex items-center gap-1 mt-0.5">
                                                            <Target className="w-3 h-3" />
                                                            {member.coreField}
                                                        </p>
                                                    )}
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    Selected: <span className="font-semibold text-orange-600">{formData.memberIds.length}</span> member(s)
                                </p>
                            </div>
                        </div>

                        {/* Section 4: Team Configuration & Control */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-orange-200">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <span className="text-orange-600 font-bold">4</span>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">Team Configuration & Control</h4>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Team Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                    >
                                        <option value="active">✅ Active</option>
                                        <option value="inactive">⏸️ Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Team Priority
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                    >
                                        <option value="low">🟢 Low</option>
                                        <option value="medium">🟡 Medium</option>
                                        <option value="high">🔴 High</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Task Type
                                    </label>
                                    <select
                                        value={formData.taskType}
                                        onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                    >
                                        <option value="project_based">📋 Project-based</option>
                                        <option value="ongoing">🔄 Ongoing</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900 mb-1">Configuration Help</p>
                                        <ul className="text-xs text-blue-700 space-y-1">
                                            <li><strong>Status:</strong> Active teams can receive tasks, inactive teams are paused</li>
                                            <li><strong>Priority:</strong> Helps manage workload distribution across teams</li>
                                            <li><strong>Task Type:</strong> Project-based for specific projects, Ongoing for continuous work</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 5: Current Project (Optional) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-orange-200">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <span className="text-orange-600 font-bold">5</span>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">Current Project (Optional)</h4>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.currentProject}
                                    onChange={(e) => setFormData({ ...formData, currentProject: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., E-commerce Website Redesign"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Project Progress (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.projectProgress}
                                    onChange={(e) => setFormData({ ...formData, projectProgress: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="0"
                                />
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className={`h-3 rounded-full transition-all ${getProgressColor(formData.projectProgress)}`}
                                        style={{ width: `${formData.projectProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-4 border-t-2 border-gray-200 sticky bottom-0 bg-white">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all"
                            >
                                Create Team
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Add Members Modal */}
        {showMemberModal && selectedTeam && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <UserPlus className="w-6 h-6" />
                                Add Members to {selectedTeam.name}
                            </h3>
                            <button onClick={() => setShowMemberModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleAssignMembers} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Members</label>
                            <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-xl p-3">
                                {availableMembers.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No available members</p>
                                ) : (
                                    availableMembers.map(member => (
                                        <label key={member._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.memberIds.includes(member._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData({ ...formData, memberIds: [...formData.memberIds, member._id] });
                                                    } else {
                                                        setFormData({ ...formData, memberIds: formData.memberIds.filter(id => id !== member._id) });
                                                    }
                                                }}
                                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{member.name}</p>
                                                <p className="text-sm text-gray-600">{member.email}</p>
                                                {member.coreField && (
                                                    <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                                                        <Target className="w-3 h-3" />
                                                        {member.coreField}
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowMemberModal(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-lg"
                            >
                                Add Members
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Edit Team Modal */}
        {showEditModal && selectedTeam && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Edit className="w-6 h-6" />
                                Edit Team: {selectedTeam.name}
                            </h3>
                            <button onClick={() => setShowEditModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitEdit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Team Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Enter team name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Team description"
                                rows="3"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="e.g., Engineering, Design"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Core Field</label>
                            <input
                                type="text"
                                value={formData.coreField}
                                onChange={(e) => setFormData({ ...formData, coreField: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="e.g., Web Development, Mobile Apps"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Current Project</label>
                            <input
                                type="text"
                                value={formData.currentProject}
                                onChange={(e) => setFormData({ ...formData, currentProject: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="e.g., E-commerce Website"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Project Progress (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.projectProgress}
                                onChange={(e) => setFormData({ ...formData, projectProgress: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="0"
                            />
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full transition-all ${getProgressColor(formData.projectProgress)}`}
                                    style={{ width: `${formData.projectProgress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-lg"
                            >
                                Update Team
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
};

export default AdminTeamManagement;
