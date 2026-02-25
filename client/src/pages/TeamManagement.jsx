import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
    Users, User, Phone, Mail, MapPin, Calendar, TrendingUp,
    CheckCircle, Clock, AlertCircle, X, Search, Filter,
    PhoneCall, PhoneOff, PhoneMissed, Target, Activity, AlertTriangle,
    ChevronDown, ChevronRight, Briefcase, ClipboardList
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
    const [teamSearchTerm, setTeamSearchTerm] = useState('');
    const [teamSpecFilter, setTeamSpecFilter] = useState('all');
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

    const filteredTeams = teams.filter(t => {
        const matchesSearch = t.name?.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                            t.description?.toLowerCase().includes(teamSearchTerm.toLowerCase());
        const matchesSpec = teamSpecFilter === 'all' || 
                           t.specialization?.toLowerCase() === teamSpecFilter.toLowerCase() ||
                           t.name?.toLowerCase().includes(teamSpecFilter.toLowerCase()); // Fallback if specialization not explicitly defined
        return matchesSearch && matchesSpec;
    });

    const getTeamStats = () => {
        const total = teams.length;
        const active = teams.filter(t => t.status === 'active').length;
        const done = teams.filter(t => t.completionRate === 100).length;
        const avgProgress = total > 0 
            ? Math.round(teams.reduce((acc, t) => acc + (t.completionRate || 0), 0) / total) 
            : 0;

        return {
            total,
            active,
            done,
            avgProgress
        };
    };

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
            <div className="max-w-[1600px] mx-auto px-4 lg:px-10 py-8 space-y-8 bg-[#FAF9F8]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-black text-[#1D1110] tracking-tighter uppercase">
                            {viewMode === 'teams' ? 'My Teams' : currentTeam?.name || 'Team Members'}
                        </h2>
                        {viewMode === 'members' && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
                                Manage members and view performance for {currentTeam?.name}
                            </p>
                        )}
                    </div>
                    {viewMode === 'members' && isTeamLead && (
                         <button 
                            onClick={handleBackToTeams}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-[#1D1110] rounded-[1.25rem] hover:bg-gray-50 transition-all shadow-sm hover:shadow-md font-black text-[10px] uppercase tracking-widest"
                         >
                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                            Back to Teams
                         </button>
                    )}
                </div>

                {/* KPI METRICS ROW */}
                {viewMode === 'teams' && isTeamLead && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(() => {
                            const stats = getTeamStats();
                            return (
                                <>
                                    <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Total Teams</p>
                                                <div className="flex items-baseline gap-2 mt-2">
                                                    <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">{stats.total}</h3>
                                                    <span className="text-[10px] font-bold text-[#3E2723] tracking-tighter">UNITS</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                                <Users className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Active Teams</p>
                                                <div className="flex items-baseline gap-2 mt-2">
                                                    <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">{stats.active}</h3>
                                                    <span className="text-[10px] font-bold text-green-500 tracking-tighter">LIVE</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Avg Progress</p>
                                                <div className="flex items-baseline gap-2 mt-2">
                                                    <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">{stats.avgProgress}%</h3>
                                                    <span className="text-[10px] font-bold text-purple-500 tracking-tighter">EFFORT</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                                <TrendingUp className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Teams Done</p>
                                                <div className="flex items-baseline gap-2 mt-2">
                                                    <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">{stats.done}</h3>
                                                    <span className="text-[10px] font-bold text-blue-500 tracking-tighter">COMPLETE</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                {viewMode === 'members' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* TOTAL MEMBERS */}
                        <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                        Total Members
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">
                                            {members.length}
                                        </h3>
                                        <span className="text-[10px] font-bold text-blue-500 tracking-tighter">
                                            STAFF
                                        </span>
                                    </div>
                                </div>
                                <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* ONLINE MEMBERS */}
                        <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                        Online Now
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <h3 className="text-3xl font-black text-green-600 tracking-tighter">
                                            {members.filter(m => m.status === 'online').length}
                                        </h3>
                                        <span className="text-[10px] font-bold text-green-500 tracking-tighter">
                                            ACTIVE
                                        </span>
                                    </div>
                                </div>
                                <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                    <Activity className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* TEAM EFFICIENCY */}
                        <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                        Avg. Completion
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">
                                            {members.length > 0 
                                                ? Math.round(members.reduce((acc, curr) => acc + (getMemberStats(curr._id).completionRate || 0), 0) / members.length) 
                                                : 0}%
                                        </h3>
                                        <span className="text-[10px] font-bold text-purple-500 tracking-tighter">
                                            YIELD
                                        </span>
                                    </div>
                                </div>
                                <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* ACTIVE MISSIONS */}
                        <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                        Active Tasks
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">
                                            {teamTasks.filter(t => t.status !== 'completed').length}
                                        </h3>
                                        <span className="text-[10px] font-bold text-amber-500 tracking-tighter">
                                            ONGOING
                                        </span>
                                    </div>
                                </div>
                                <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                    <ClipboardList className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap lg:flex-nowrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] bg-white rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center group focus-within:ring-2 focus-within:ring-[#3E2723]/5 transition-all">
                        <div className="pl-4">
                            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#3E2723] transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder={viewMode === 'teams' ? "Search teams by name or description..." : "Search members by name, email or designation..."}
                            value={viewMode === 'teams' ? teamSearchTerm : searchTerm}
                            onChange={(e) => viewMode === 'teams' ? setTeamSearchTerm(e.target.value) : setSearchTerm(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-[#3E2723] placeholder-gray-400 flex-1 px-4 py-4"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-100 p-1 flex items-center flex-1 lg:min-w-[200px]">
                            <select
                                value={viewMode === 'teams' ? teamSpecFilter : statusFilter}
                                onChange={(e) => viewMode === 'teams' ? setTeamSpecFilter(e.target.value) : setStatusFilter(e.target.value)}
                                className="w-full pl-5 pr-10 py-2.5 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-[#3E2723] appearance-none cursor-pointer"
                            >
                                {viewMode === 'teams' ? (
                                    <>
                                        <option value="all">All Specialties</option>
                                        <option value="web dev">Web Development</option>
                                        <option value="sales">Sales</option>
                                        <option value="marketing">Marketing</option>
                                        <option value="hr">Human Resources</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="all">All Status</option>
                                        <option value="online">Online</option>
                                        <option value="busy">Busy</option>
                                        <option value="offline">Offline</option>
                                    </>
                                )}
                            </select>
                            <div className="pr-4 pointer-events-none">
                                <Filter className="w-3 h-3 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* TEAMS GRID VIEW */}
                {viewMode === 'teams' && isTeamLead && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                        {filteredTeams.map(team => (
                            <div 
                                key={team._id} 
                                onClick={() => handleTeamClick(team)}
                                className="group bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer overflow-hidden transform hover:-translate-y-2 flex flex-col"
                            >
                                <div className="p-8 space-y-6 flex-1">
                                    <div className="flex justify-between items-start">
                                        <div className="w-14 h-14 bg-[#F3EFE7] rounded-2xl flex items-center justify-center text-[#3E2723] group-hover:bg-[#3E2723] group-hover:text-white transition-all duration-500 shadow-sm">
                                            <Users className="w-7 h-7" />
                                        </div>
                                        <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest ${
                                            team.status === 'active' 
                                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                                        }`}>
                                            {team.status}
                                        </span>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-xl font-bold text-[#1D1110] mb-2 group-hover:text-[#3E2723] transition-colors tracking-tight">{team.name}</h3>
                                        <p className="text-xs font-medium text-gray-400 leading-relaxed line-clamp-2 h-10">{team.description || 'No description provided.'}</p>
                                    </div>
                                    
                                    <div className="space-y-4 pt-4 border-t border-gray-50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Members</span>
                                            <span className="text-sm font-black text-[#1D1110]">{team.members?.length || 0}</span>
                                        </div>
                                        
                                        {/* Overall Progress */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Team Progress</span>
                                                <span className="text-xs font-black text-[#3E2723]">{team.completionRate || 0}%</span>
                                            </div>
                                            <div className="w-full bg-gray-50 rounded-full h-2.5 p-0.5 border border-gray-100 shadow-inner overflow-hidden">
                                                <div 
                                                    className="bg-[#3E2723] h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${team.completionRate || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div className="px-8 py-5 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between group-hover:bg-[#F3EFE7]/30 transition-colors">
                                    <div className="flex -space-x-3">
                                        {(team.members || []).slice(0, 4).map((m, idx) => (
                                            <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-[#3E2723] flex items-center justify-center text-[10px] font-black text-white shadow-sm overflow-hidden">
                                                {m.name?.charAt(0)}
                                            </div>
                                        ))}
                                        {(team.members || []).length > 4 && (
                                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 shadow-sm">
                                                +{(team.members || []).length - 4}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-[#1D1110] uppercase tracking-widest group-hover:text-[#3E2723] transition-colors">
                                        View Details <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MEMBERS VIEW (Existing Logic wrapped) */}
                {viewMode === 'members' && (
                    <>
                {/* Members Grid */}
                <div className="relative">
                    {filteredMembers.length === 0 ? (
                        <div className="py-24 text-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className="p-8 bg-gray-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <Users className="w-12 h-12 text-gray-200" />
                            </div>
                            <h3 className="text-3xl font-black text-[#3E2723] mb-4 tracking-tighter uppercase">No Members Found</h3>
                            <p className="text-gray-400 font-medium max-w-md mx-auto leading-relaxed">Try adjusting your search or filters to find team members.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredMembers.map(member => {
                                const stats = isTeamLead ? getMemberStats(member._id) : null;
                                
                                return (
                                    <div 
                                        key={member._id} 
                                        onClick={() => handleViewDetails(member)}
                                        className="group bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer overflow-hidden transform hover:-translate-y-2 flex flex-col"
                                    >
                                        <div className="p-8 space-y-6 flex-1">
                                            {/* CARD HEADER */}
                                            <div className="flex items-start gap-5">
                                                <div className="relative shrink-0">
                                                    <div className="w-16 h-16 rounded-2xl bg-[#3E2723] flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:scale-110 transition-transform duration-500">
                                                        {member.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(member.status)} rounded-full border-4 border-white shadow-sm`}></div>
                                                </div>
                                                <div className="min-w-0 pt-1">
                                                    <h3 className="text-lg font-bold text-[#1D1110] tracking-tight group-hover:text-[#3E2723] transition-colors truncate">
                                                        {member.name}
                                                    </h3>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                                        {member.designation || 'Team Member'}
                                                    </p>
                                                    <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(member.status)}`} />
                                                        {getStatusLabel(member.status)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CONTACT INFO */}
                                            <div className="space-y-3 py-4 border-y border-gray-50">
                                                <div className="flex items-center gap-3 text-sm text-gray-400 font-medium">
                                                    <Mail className="w-4 h-4 text-gray-300" />
                                                    <span className="truncate">{member.email}</span>
                                                </div>
                                                {member.phone && (
                                                    <div className="flex items-center gap-3 text-sm text-gray-400 font-medium">
                                                        <Phone className="w-4 h-4 text-gray-300" />
                                                        <span>{member.phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* PERFORMANCE INDICATORS (Team Lead Only) */}
                                            {isTeamLead && stats && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Efficiency</p>
                                                        <span className="text-xs font-black text-[#1D1110]">{stats.completionRate}%</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5 shadow-inner">
                                                        <div 
                                                            className="h-full bg-[#1D1110] rounded-full transition-all duration-1000"
                                                            style={{ width: `${stats.completionRate}%` }}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                                        <div className="text-center p-2 bg-gray-50 rounded-xl border border-gray-100">
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Tasks</p>
                                                            <p className="text-xs font-black text-[#1D1110]">{stats.totalTasks}</p>
                                                        </div>
                                                        <div className="text-center p-2 bg-green-50 rounded-xl border border-green-100">
                                                            <p className="text-[9px] font-bold text-green-400 uppercase tracking-tight">Done</p>
                                                            <p className="text-xs font-black text-green-700">{stats.completed}</p>
                                                        </div>
                                                        <div className="text-center p-2 bg-amber-50 rounded-xl border border-amber-100">
                                                            <p className="text-[9px] font-bold text-amber-400 uppercase tracking-tight">Active</p>
                                                            <p className="text-xs font-black text-amber-700">{stats.inProgress}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* ACTIONS FOOTER */}
                                        <div className="px-8 py-4 bg-gray-50/30 border-t border-gray-100 backdrop-blur-sm self-end w-full flex items-center justify-between">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleInitiateCall(member); }}
                                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-[#3E2723] hover:bg-[#3E2723] hover:text-white transition-all shadow-sm"
                                                title="Initiate Call"
                                            >
                                                <PhoneCall className="w-4 h-4" />
                                            </button>
                                            <button className="text-[10px] font-black text-[#1D1110] uppercase tracking-widest hover:text-[#3E2723] transition-colors flex items-center gap-2">
                                                View Profile <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                    </>
                )}
            </div>
        </Layout>

        {showDetailsModal && selectedMember && (
            <div className="fixed inset-0 bg-[#1D1110]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-[3rem] max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden border border-gray-100">
                    <div className="bg-[#3E2723] px-10 py-8 relative">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Member Intel</h3>
                                <p className="text-[10px] font-bold text-[#EBD9C1] uppercase tracking-[0.2em] mt-1">Detailed personnel records</p>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="bg-white/10 hover:bg-white/20 text-white rounded-2xl p-2 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-10 overflow-y-auto max-h-[calc(90vh-120px)] space-y-8 custom-scrollbar">
                        {/* Member Info */}
                        <div className="flex items-center gap-8">
                            <div className="relative">
                                <div className="w-24 h-24 bg-[#FAF9F8] border border-gray-100 rounded-3xl flex items-center justify-center text-[#3E2723] text-3xl font-black shadow-inner">
                                    {selectedMember.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${getStatusColor(selectedMember.status)} rounded-full border-4 border-white shadow-sm`}></div>
                            </div>
                            <div>
                                <h4 className="text-3xl font-black text-[#1D1110] tracking-tighter uppercase">{selectedMember.name}</h4>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{selectedMember.designation || 'Team Member'}</p>
                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedMember.status)}`} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#1D1110]">
                                        {getStatusLabel(selectedMember.status)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-[#FAF9F8] rounded-[2rem] border border-gray-100 flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-gray-400">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                                    <p className="text-sm font-black text-[#1D1110] truncate mt-0.5">{selectedMember.email}</p>
                                </div>
                            </div>
                            {selectedMember.phone && (
                                <div className="p-6 bg-[#FAF9F8] rounded-[2rem] border border-gray-100 flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm text-gray-400">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Phone Line</p>
                                        <p className="text-sm font-black text-[#1D1110] mt-0.5">{selectedMember.phone}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Performance Stats */}
                        {isTeamLead && (() => {
                            const stats = getMemberStats(selectedMember._id);
                            const memberTasks = getMemberTasks(selectedMember._id);
                            
                            return (
                                <div className="space-y-8">
                                    <div className="p-8 bg-[#F3EFE7] rounded-[2.5rem] border border-gray-100">
                                        <h5 className="text-[10px] font-black text-[#3E2723] uppercase tracking-[0.2em] mb-6">Efficiency Analytics</h5>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center space-y-1">
                                                <p className="text-2xl font-black text-[#1D1110]">{stats.totalTasks}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase">Assigned</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center space-y-1">
                                                <p className="text-2xl font-black text-green-600">{stats.completed}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase">Deployed</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center space-y-1">
                                                <p className="text-2xl font-black text-amber-600">{stats.inProgress}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase">Active</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center space-y-1">
                                                <p className="text-2xl font-black text-[#3E2723]">{stats.completionRate}%</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase">Yield</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assigned Tasks */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-[10px] font-black text-[#1D1110] uppercase tracking-[0.2em]">Mission Logs</h5>
                                            <span className="px-3 py-1 bg-gray-100 text-[10px] font-black rounded-lg text-gray-400 uppercase tracking-widest">
                                                {memberTasks.length} Active
                                            </span>
                                        </div>
                                        {memberTasks.length === 0 ? (
                                            <div className="py-10 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active missions</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                                {memberTasks.map(task => (
                                                    <div key={task._id} className="p-5 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center justify-between group/task hover:bg-[#F3EFE7]/30 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-[#FAF9F8] rounded-xl flex items-center justify-center text-[#3E2723]">
                                                                <Target className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-[#1D1110] group-hover/task:text-[#3E2723] transition-colors">{task.title}</p>
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                                                    Priority: <span className="text-[#3E2723]">{task.priority}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="px-3 py-1.5 bg-[#FAF9F8] text-[9px] font-black rounded-lg text-gray-400 uppercase tracking-widest group-hover/task:bg-white transition-colors">
                                                            {task.status?.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        )}

        {/* Call Modal */}
        {showCallModal && selectedMember && (
            <div className="fixed inset-0 bg-[#1D1110]/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
                <div className="bg-white rounded-[3rem] max-w-md w-full shadow-2xl overflow-hidden border border-white/20 relative">
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-[#3E2723] -skew-y-6 -translate-y-16" />
                    
                    <div className="p-10 text-center relative pt-16">
                        {/* Member Avatar */}
                        <div className="relative inline-block mb-6">
                            <div className="w-32 h-32 bg-[#FAF9F8] border-4 border-white rounded-[2.5rem] flex items-center justify-center text-[#3E2723] text-4xl font-black shadow-2xl relative z-10">
                                {selectedMember.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-10 h-10 ${getStatusColor(selectedMember.status)} rounded-2xl border-4 border-white z-20 shadow-lg flex items-center justify-center`}>
                                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                            </div>
                        </div>

                        <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter uppercase mb-1">{selectedMember.name}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">{selectedMember.designation || 'Team Member'}</p>

                        {/* Call Status UI */}
                        <div className="min-h-[160px] flex flex-col items-center justify-center mb-8">
                            {callStatus === 'checking' && (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-[#3E2723] animate-spin mx-auto" />
                                        <Search className="w-6 h-6 text-[#3E2723] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanning availability...</p>
                                </div>
                            )}

                            {callStatus === 'unavailable' && (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
                                        <PhoneOff className="w-8 h-8" />
                                    </div>
                                    <p className="text-xs font-black text-red-600 uppercase tracking-widest">Member Offline</p>
                                </div>
                            )}

                            {callStatus === 'ringing' && (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 scale-110">
                                            <PhoneCall className="w-10 h-10 animate-shake" />
                                        </div>
                                        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20" />
                                    </div>
                                    <p className="text-xs font-black text-green-600 uppercase tracking-[0.3em] animate-pulse">ESTABLISHING LINK...</p>
                                </div>
                            )}

                            {callStatus === 'oncall' && (
                                <div className="space-y-4">
                                    <div className="w-24 h-24 bg-[#3E2723] rounded-[2.5rem] flex items-center justify-center mx-auto text-white shadow-xl shadow-[#3E2723]/20">
                                        <Phone className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-[#3E2723] uppercase tracking-[0.2em]">CONNECTION LIVE</p>
                                        <p className="text-4xl font-black text-[#1D1110] tracking-tighter">{formatDuration(callDuration)}</p>
                                    </div>
                                </div>
                            )}

                            {callStatus === 'missed' && (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
                                        <PhoneMissed className="w-8 h-8" />
                                    </div>
                                    <p className="text-xs font-black text-amber-600 uppercase tracking-widest">No Response</p>
                                </div>
                            )}

                            {callStatus === 'ended' && (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">COMMS SECURED</p>
                                        <p className="text-sm font-bold text-[#1D1110]">Duration: {formatDuration(callDuration)}</p>
                                    </div>
                                </div>
                            )}

                            {callStatus === 'error' && (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
                                        <AlertTriangle className="w-8 h-8" />
                                    </div>
                                    <p className="text-xs font-black text-red-600 uppercase tracking-widest">Signal Interrupted</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {callStatus === 'oncall' ? (
                                <button
                                    onClick={handleEndCall}
                                    className="w-full py-4 bg-red-600 text-white rounded-[1.25rem] hover:bg-red-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-200 flex items-center justify-center gap-3"
                                >
                                    <PhoneOff className="w-5 h-5" />
                                    Terminate Connection
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setShowCallModal(false);
                                        setCallStatus(null);
                                    }}
                                    className="w-full py-4 bg-[#FAF9F8] text-[#1D1110] border border-gray-100 rounded-[1.25rem] hover:bg-gray-50 transition-all font-black text-[10px] uppercase tracking-widest"
                                >
                                    Close Terminal
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default TeamManagement;
