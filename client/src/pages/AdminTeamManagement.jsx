import { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, X, Search, Eye, Target, Briefcase, TrendingUp, Award, Mail, Phone, CheckCircle2, Clock } from 'lucide-react';
import { adminTeamsAPI, adminUsersAPI } from '../services/adminApi';
import Layout from '../components/Layout';

const AdminTeamManagement = () => {
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [teamLeads, setTeamLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        leadId: '',
        department: '',
        coreField: '',
        currentProject: '',
        projectProgress: 0,
        memberIds: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teamsRes, usersRes] = await Promise.all([
                adminTeamsAPI.getAll(),
                adminUsersAPI.getAll()
            ]);
            setTeams(teamsRes.data.data || []);
            setUsers(usersRes.data.data || []);
            setTeamLeads(usersRes.data.data.filter(u => u.role === 'team_lead') || []);
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
            leadId: '',
            department: '',
            coreField: '',
            currentProject: '',
            projectProgress: 0,
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
        setSelectedTeam(team);
        setShowDetailModal(true);
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTeams.map((team) => (
                        <div key={team._id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-200">
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
                                </div>

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

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleViewDetails(team)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all font-semibold shadow-md"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleAddMembers(team)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-md"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Add
                                    </button>
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

        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl">
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

                    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Team Lead *</label>
                            <select
                                value={formData.leadId}
                                onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                required
                            >
                                <option value="">Select Team Lead</option>
                                {teamLeads.map(lead => (
                                    <option key={lead._id} value={lead._id}>
                                        {lead.name} {lead.coreField ? `- ${lead.coreField}` : ''}
                                    </option>
                                ))}
                            </select>
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
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-lg"
                            >
                                Create Team
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

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

        {showDetailModal && selectedTeam && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Eye className="w-6 h-6" />
                                {selectedTeam.name} - Team Details
                            </h3>
                            <button onClick={() => setShowDetailModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border border-orange-200">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-orange-600" />
                                    Team Lead
                                </h4>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                        {selectedTeam.leadId?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 text-lg">{selectedTeam.leadId?.name}</p>
                                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                            <Mail className="w-4 h-4" />
                                            <span>{selectedTeam.leadId?.email}</span>
                                        </div>
                                        {selectedTeam.leadId?.phone && (
                                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                                <Phone className="w-4 h-4" />
                                                <span>{selectedTeam.leadId.phone}</span>
                                            </div>
                                        )}
                                        {selectedTeam.leadId?.coreField && (
                                            <div className="flex items-center gap-1 text-sm text-orange-600 mt-1 font-semibold">
                                                <Target className="w-4 h-4" />
                                                <span>{selectedTeam.leadId.coreField}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-5 border border-amber-200">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-amber-600" />
                                    Current Project
                                </h4>
                                <p className="text-xl font-bold text-gray-900 mb-3">{selectedTeam.currentProject || 'No active project'}</p>
                                {selectedTeam.currentProject && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Progress</span>
                                            <span className="font-bold text-gray-900">{selectedTeam.projectProgress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div 
                                                className={`h-3 rounded-full transition-all ${getProgressColor(selectedTeam.projectProgress || 0)}`}
                                                style={{ width: `${selectedTeam.projectProgress || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-orange-600" />
                                Team Members ({selectedTeam.members?.length || 0})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedTeam.members && selectedTeam.members.length > 0 ? (
                                    selectedTeam.members.map(member => (
                                        <div key={member._id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md">
                                                {member.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                                                <p className="text-sm text-gray-600 truncate">{member.email}</p>
                                                {member.coreField && (
                                                    <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                                                        <Target className="w-3 h-3" />
                                                        <span className="font-semibold">{member.coreField}</span>
                                                    </div>
                                                )}
                                                {member.designation && (
                                                    <p className="text-xs text-gray-500 mt-1">{member.designation}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                <span className="text-xs text-gray-600">Active</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 text-center py-8 text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No team members yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border border-purple-200">
                            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-purple-600" />
                                Team Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Core Field</p>
                                    <p className="font-semibold text-gray-900">{selectedTeam.coreField || selectedTeam.leadId?.coreField || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Department</p>
                                    <p className="font-semibold text-gray-900">{selectedTeam.department || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Created</p>
                                    <p className="font-semibold text-gray-900">{new Date(selectedTeam.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Status</p>
                                    <p className="font-semibold text-green-600">Active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default AdminTeamManagement;
