import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
    Users, User, Phone, Mail, MapPin, Calendar, TrendingUp,
    CheckCircle, Clock, AlertCircle, X, Search, Filter,
    PhoneCall, PhoneOff, PhoneMissed
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { usersAPI, teamsAPI, tasksAPI, callsAPI } from '../services/api';

const TeamManagement = () => {
    const { isTeamLead, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // View Mode: 'teams' (list of teams) or 'members' (list of members in a team)
    // For regular members, this defaults to 'members' and stays there.
    // For Team Leads, it starts at 'teams' (if they have multiple?) or we can default to 'teams' list always for consistency.
    const [viewMode, setViewMode] = useState(isTeamLead ? 'teams' : 'members');
    
    const [teams, setTeams] = useState([]);
    const [currentTeam, setCurrentTeam] = useState(null); // The team currently being viewed
    
    const [members, setMembers] = useState([]);
    const [teamTasks, setTeamTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCallModal, setShowCallModal] = useState(false);
    const [callStatus, setCallStatus] = useState(null); 
    const [callDuration, setCallDuration] = useState(0);
    const [callTimer, setCallTimer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

    useEffect(() => {
        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Cleanup call timer on unmount
        return () => {
            if (callTimer) clearInterval(callTimer);
        };
    }, [callTimer]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            if (isTeamLead) {
                // Fetch ALL teams led by this user
                const teamsRes = await teamsAPI.getLedTeams();
                const teamsData = teamsRes.data.data;
                setTeams(teamsData);

                // If user was already viewing a specific team (e.g. back navigation or deep link logic could go here)
                // For now, if currentTeam is set, we assume we want to refresh its data
                if (currentTeam) {
                   const updatedTeam = teamsData.find(t => t._id === currentTeam._id);
                   if (updatedTeam) {
                       setCurrentTeam(updatedTeam);
                       setMembers(updatedTeam.members || []);
                       // Fetch tasks for this specific team
                       const tasksRes = await tasksAPI.getAll({ teamId: updatedTeam._id });
                       setTeamTasks(tasksRes.data.data || []);
                   }
                }
            } else {
                // Regular member - get their single team details
                const teamRes = await teamsAPI.getMyTeam();
                const teamData = teamRes.data.data;
                setCurrentTeam(teamData);
                setMembers(teamData.members || []);
                setViewMode('members'); // Force members view
                
                // Get tasks
                if (teamData._id) {
                     const tasksRes = await tasksAPI.getAll({ teamId: teamData._id });
                     setTeamTasks(tasksRes.data.data || []);
                }
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTeamClick = async (team) => {
        setLoading(true);
        setCurrentTeam(team);
        setMembers(team.members || []);
        setViewMode('members');
        try {
            const tasksRes = await tasksAPI.getAll({ teamId: team._id });
            setTeamTasks(tasksRes.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToTeams = () => {
        setCurrentTeam(null);
        setMembers([]);
        setTeamTasks([]);
        setViewMode('teams');
    };

    const getMemberTasks = (memberId) => {
        return teamTasks.filter(task => {
            // Check if task is assigned to member or has subtasks assigned to member
            if (task.assignedTo?._id === memberId || task.assignedTo === memberId) return true;
            if (task.subtasks && task.subtasks.length > 0) {
                return task.subtasks.some(st => st.assignedTo?._id === memberId || st.assignedTo === memberId);
            }
            return false;
        });
    };

    const getMemberStats = (memberId) => {
        const memberTasks = getMemberTasks(memberId);
        const subtasks = memberTasks.flatMap(t => t.subtasks || []).filter(st => st.assignedTo?._id === memberId || st.assignedTo === memberId);
        
        const completed = subtasks.filter(st => st.status === 'completed').length;
        const inProgress = subtasks.filter(st => st.status === 'in_progress').length;
        const total = subtasks.length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            totalTasks: total,
            completed,
            inProgress,
            pending: total - completed - inProgress,
            completionRate
        };
    };

    const handleViewDetails = (member) => {
        setSelectedMember(member);
        setShowDetailsModal(true);
    };

    const handleInitiateCall = async (member) => {
        setSelectedMember(member);
        setShowCallModal(true);
        setCallStatus('checking');

        try {
            // Check availability
            const availRes = await callsAPI.checkAvailability(member._id);
            const isAvailable = availRes.data.data.available;

            if (!isAvailable) {
                setCallStatus('unavailable');
                setTimeout(() => {
                    setShowCallModal(false);
                    setCallStatus(null);
                }, 3000);
                return;
            }

            // Initiate call
            setCallStatus('ringing');
            const callRes = await callsAPI.initiate({
                receiverId: member._id,
                callType: 'voice'
            });

            // Simulate call answer after 3 seconds (in real app, this would be socket-based)
            setTimeout(() => {
                const answered = Math.random() > 0.3; // 70% chance of answer
                if (answered) {
                    setCallStatus('oncall');
                    setCallDuration(0);
                    // Start timer
                    const timer = setInterval(() => {
                        setCallDuration(prev => prev + 1);
                    }, 1000);
                    setCallTimer(timer);
                } else {
                    setCallStatus('missed');
                    callsAPI.update(callRes.data.data._id, { status: 'missed' });
                    setTimeout(() => {
                        setShowCallModal(false);
                        setCallStatus(null);
                    }, 2000);
                }
            }, 3000);
        } catch (error) {
            console.error('Call error:', error);
            setCallStatus('error');
            setTimeout(() => {
                setShowCallModal(false);
                setCallStatus(null);
            }, 2000);
        }
    };

    const handleEndCall = async () => {
        if (callTimer) clearInterval(callTimer);
        setCallStatus('ended');
        
        // In real app, update call record with duration
        setTimeout(() => {
            setShowCallModal(false);
            setCallStatus(null);
            setCallDuration(0);
            setCallTimer(null);
        }, 2000);
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'busy': return 'bg-yellow-500';
            case 'offline': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'online': return 'Online';
            case 'busy': return 'Busy';
            case 'offline': return 'Offline';
            default: return 'Unknown';
        }
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.designation?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <Layout title="Team Management">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3E2723] mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading team members...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <>
        <Layout title="Team Management">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {viewMode === 'teams' ? 'My Teams' : currentTeam?.name || 'Team Members'}
                        </h2>
                        <p className="text-gray-600 mt-1">
                            {viewMode === 'teams' 
                                ? 'Manage and oversee all your teams' 
                                : `Manage members and view performance for ${currentTeam?.name}`}
                        </p>
                    </div>
                    {viewMode === 'members' && isTeamLead && (
                         <button 
                            onClick={handleBackToTeams}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                         >
                            <User className="w-4 h-4" /> {/* Fallback icon, ensure ArrowLeft is imported if strictly needed, using User as placeholder or imported lucide icons */}
                            Back to Teams
                         </button>
                    )}
                </div>

                {/* TEAMS GRID VIEW */}
                {viewMode === 'teams' && isTeamLead && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {teams.map(team => (
                            <div 
                                key={team._id} 
                                onClick={() => handleTeamClick(team)}
                                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#5D4037] transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-[#F3EFE7] rounded-xl flex items-center justify-center text-[#3E2723] group-hover:bg-[#3E2723] group-hover:text-white transition-colors">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-lg uppercase ${
                                        team.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {team.status}
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{team.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{team.description || 'No description provided.'}</p>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Members</span>
                                        <span className="font-bold text-gray-900">{team.members?.length || 0}</span>
                                    </div>
                                    
                                    {/* Overall Progress */}
                                    <div className="pt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-gray-500">Overall Progress</span>
                                            <span className="text-xs font-bold text-[#3E2723]">{team.completionRate || 0}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div 
                                                className="bg-[#3E2723] h-2 rounded-full transition-all"
                                                style={{ width: `${team.completionRate || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Per-Task/Project Progress */}
                                    {team.tasksWithProgress && team.tasksWithProgress.length > 0 && (
                                        <div className="pt-2 space-y-2 border-t border-gray-100">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</span>
                                            {team.tasksWithProgress.slice(0, 3).map(task => (
                                                <div key={task._id}>
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <span className="text-xs font-medium text-gray-700 truncate max-w-[60%]">{task.title}</span>
                                                        <span className="text-xs font-bold text-gray-500">{task.completedCount}/{task.totalCount}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div 
                                                            className={`h-1.5 rounded-full transition-all ${
                                                                task.progress === 100 ? 'bg-green-500' : 
                                                                task.progress > 0 ? 'bg-[#5D4037]' : 'bg-gray-300'
                                                            }`}
                                                            style={{ width: `${task.progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                            {team.tasksWithProgress.length > 3 && (
                                                <p className="text-xs text-gray-400 text-center">+{team.tasksWithProgress.length - 3} more tasks</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MEMBERS VIEW (Existing Logic wrapped) */}
                {viewMode === 'members' && (
                    <>
                {/* Stats Cards (Filtered by current team) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Members</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{members.length}</p>
                            </div>
                            <div className="p-4 bg-blue-100 rounded-xl">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Online</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {members.filter(m => m.status === 'online').length}
                                </p>
                            </div>
                            <div className="p-4 bg-green-100 rounded-xl">
                                <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Busy</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">
                                    {members.filter(m => m.status === 'busy').length}
                                </p>
                            </div>
                            <div className="p-4 bg-yellow-100 rounded-xl">
                                <div className="w-8 h-8 bg-yellow-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Offline</p>
                                <p className="text-3xl font-bold text-gray-600 mt-2">
                                    {members.filter(m => m.status === 'offline').length}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-100 rounded-xl">
                                <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-2.5 sm:left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 sm:pl-10 lg:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                            {['all', 'online', 'busy', 'offline'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                                        statusFilter === status
                                            ? 'bg-[#3E2723] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                    <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-lg text-xs">
                                        {status === 'all' ? members.length : members.filter(m => m.status === status).length}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Members Grid */}
                {filteredMembers.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-200">
                        <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No members found</h3>
                        <p className="text-gray-600">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMembers.map(member => {
                            const stats = isTeamLead ? getMemberStats(member._id) : null;
                            
                            return (
                                <div key={member._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all">
                                    <div className="p-6">
                                        {/* Member Header */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="relative">
                                                <div className="w-16 h-16 bg-gradient-to-br from-[#3E2723] to-[#3E2723] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                                                    {member.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 text-lg truncate">{member.name}</h3>
                                                <p className="text-sm text-gray-600 truncate">{member.designation || 'Team Member'}</p>
                                                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-lg ${
                                                    member.status === 'online' ? 'bg-green-100 text-green-700' :
                                                    member.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {getStatusLabel(member.status)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Mail className="w-4 h-4" />
                                                <span className="truncate">{member.email}</span>
                                            </div>
                                            {member.phone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone className="w-4 h-4" />
                                                    <span>{member.phone}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Performance Stats (Team Lead Only) */}
                                        {isTeamLead && stats && (
                                            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-gray-600">Performance</span>
                                                    <span className="text-xs font-bold text-[#3E2723]">{stats.completionRate}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                    <div
                                                        className="bg-[#3E2723] h-2 rounded-full transition-all"
                                                        style={{ width: `${stats.completionRate}%` }}
                                                    ></div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div className="text-center">
                                                        <p className="font-bold text-gray-900">{stats.totalTasks}</p>
                                                        <p className="text-gray-600">Tasks</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-bold text-green-600">{stats.completed}</p>
                                                        <p className="text-gray-600">Done</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-bold text-blue-600">{stats.inProgress}</p>
                                                        <p className="text-gray-600">Active</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            {isTeamLead && member._id !== user._id && (
                                                <button
                                                    onClick={() => handleInitiateCall(member)}
                                                    disabled={member.status === 'offline'}
                                                    className={`flex-1 px-4 py-2 rounded-xl transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                                                        member.status === 'offline'
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                    }`}
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    Call
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                    </>
                )}
            </div>
        </Layout>

        {/* Member Details Modal */}
        {showDetailsModal && selectedMember && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-r from-[#3E2723] to-[#3E2723] px-6 py-5 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Member Details</h3>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                        {/* Member Info */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#3E2723] to-[#3E2723] rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-md">
                                {selectedMember.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h4>
                                <p className="text-gray-600">{selectedMember.designation || 'Team Member'}</p>
                                <span className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-lg ${
                                    selectedMember.status === 'online' ? 'bg-green-100 text-green-700' :
                                    selectedMember.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {getStatusLabel(selectedMember.status)}
                                </span>
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                            <h5 className="font-bold text-gray-900 mb-3">Contact Information</h5>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-700">{selectedMember.email}</span>
                                </div>
                                {selectedMember.phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-700">{selectedMember.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Performance Stats */}
                        {isTeamLead && (() => {
                            const stats = getMemberStats(selectedMember._id);
                            const memberTasks = getMemberTasks(selectedMember._id);
                            
                            return (
                                <>
                                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                        <h5 className="font-bold text-gray-900 mb-3">Performance Metrics</h5>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="text-center p-3 bg-white rounded-lg">
                                                <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
                                                <p className="text-sm text-gray-600">Total Tasks</p>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg">
                                                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                                                <p className="text-sm text-gray-600">Completed</p>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg">
                                                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                                                <p className="text-sm text-gray-600">In Progress</p>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg">
                                                <p className="text-2xl font-bold text-[#3E2723]">{stats.completionRate}%</p>
                                                <p className="text-sm text-gray-600">Completion Rate</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assigned Tasks */}
                                    <div className="mb-4">
                                        <h5 className="font-bold text-gray-900 mb-3">Assigned Tasks ({memberTasks.length})</h5>
                                        {memberTasks.length === 0 ? (
                                            <p className="text-gray-600 text-sm">No tasks assigned yet</p>
                                        ) : (
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {memberTasks.map(task => (
                                                    <div key={task._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                        <p className="font-semibold text-gray-900 text-sm">{task.title}</p>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            Status: <span className="font-semibold capitalize">{task.status?.replace('_', ' ')}</span>
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        )}

        {/* Call Modal */}
        {showCallModal && selectedMember && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                    <div className="p-8 text-center">
                        {/* Member Avatar */}
                        <div className="w-24 h-24 bg-gradient-to-br from-[#3E2723] to-[#3E2723] rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg mx-auto mb-4">
                            {selectedMember.name?.charAt(0).toUpperCase()}
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedMember.name}</h3>
                        <p className="text-gray-600 mb-6">{selectedMember.designation || 'Team Member'}</p>

                        {/* Call Status */}
                        {callStatus === 'checking' && (
                            <div className="mb-6">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#3E2723] mx-auto mb-3"></div>
                                <p className="text-gray-700 font-semibold">Checking availability...</p>
                            </div>
                        )}

                        {callStatus === 'unavailable' && (
                            <div className="mb-6">
                                <PhoneOff className="w-12 h-12 text-red-600 mx-auto mb-3" />
                                <p className="text-red-600 font-semibold">Member is currently unavailable</p>
                            </div>
                        )}

                        {callStatus === 'ringing' && (
                            <div className="mb-6">
                                <div className="relative">
                                    <PhoneCall className="w-12 h-12 text-green-600 mx-auto mb-3 animate-pulse" />
                                </div>
                                <p className="text-gray-700 font-semibold">Calling...</p>
                            </div>
                        )}

                        {callStatus === 'oncall' && (
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                                    <Phone className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-green-600 font-semibold text-lg mb-2">Call in progress</p>
                                <p className="text-3xl font-bold text-gray-900">{formatDuration(callDuration)}</p>
                            </div>
                        )}

                        {callStatus === 'missed' && (
                            <div className="mb-6">
                                <PhoneMissed className="w-12 h-12 text-red-600 mx-auto mb-3" />
                                <p className="text-red-600 font-semibold">Call not answered</p>
                            </div>
                        )}

                        {callStatus === 'ended' && (
                            <div className="mb-6">
                                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                <p className="text-green-600 font-semibold">Call ended</p>
                                <p className="text-gray-600 text-sm mt-2">Duration: {formatDuration(callDuration)}</p>
                            </div>
                        )}

                        {callStatus === 'error' && (
                            <div className="mb-6">
                                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
                                <p className="text-red-600 font-semibold">Call failed</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {callStatus === 'oncall' && (
                            <button
                                onClick={handleEndCall}
                                className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold flex items-center justify-center gap-2"
                            >
                                <PhoneOff className="w-5 h-5" />
                                End Call
                            </button>
                        )}

                        {(callStatus === 'checking' || callStatus === 'ringing') && (
                            <button
                                onClick={() => {
                                    setShowCallModal(false);
                                    setCallStatus(null);
                                }}
                                className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default TeamManagement;
