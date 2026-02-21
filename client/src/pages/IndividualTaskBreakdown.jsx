import React, { useState, useEffect } from 'react';
import { 
    Users, ClipboardList, CheckCircle2, Clock, 
    AlertCircle, ChevronRight, Search, Filter,
    ExternalLink, Paperclip, Activity, TrendingUp
} from 'lucide-react';
import { tasksAPI, teamsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const IndividualTaskBreakdown = () => {
    const { isTeamLead } = useAuth();
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksRes, teamsRes] = await Promise.all([
                tasksAPI.getAll(),
                teamsAPI.getLedTeams()
            ]);

            const allTasks = tasksRes.data.data || [];
            setTasks(allTasks);

            // Extract unique members from teams managed by the lead
            const leadTeams = teamsRes.data.data || [];
            const memberMap = new Map();

            leadTeams.forEach(team => {
                team.members.forEach(member => {
                    if (member.role === 'team_member' && !memberMap.has(member._id)) {
                        memberMap.set(member._id, {
                            ...member,
                            teamName: team.name,
                            subtasks: []
                        });
                    }
                });
            });

            // Distribute subtasks to members
            allTasks.forEach(task => {
                if (task.subtasks) {
                    task.subtasks.forEach(subtask => {
                        const assigneeId = subtask.assignedTo?._id || subtask.assignedTo;
                        if (memberMap.has(assigneeId)) {
                            memberMap.get(assigneeId).subtasks.push({
                                ...subtask,
                                parentTaskTitle: task.title,
                                parentTaskId: task._id,
                                projectName: task.relatedProject || 'General'
                            });
                        }
                    });
                }
            });

            setMembers(Array.from(memberMap.values()));
        } catch (err) {
            console.error('Failed to fetch breakdown data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getMemberStats = (memberSubtasks) => {
        const total = memberSubtasks.length;
        const completed = memberSubtasks.filter(st => st.status === 'completed').length;
        const inProgress = memberSubtasks.filter(st => st.status === 'in_progress').length;
        const pending = memberSubtasks.filter(st => st.status === 'pending').length;
        const totalProgress = memberSubtasks.reduce((sum, st) => sum + (st.progressPercentage || 0), 0);
        const percentage = total === 0 ? 0 : Math.round(totalProgress / total);

        return { total, completed, inProgress, pending, percentage };
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredMembers = members.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.teamName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Layout title="Member Breakdown">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#3E2723] border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest animate-pulse">Analyzing Performance...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Member Breakdown">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg ring-4 ring-indigo-50">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Member Breakdown</h1>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Individual Performance & Contributions</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#3E2723] transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search Member or Team..."
                                className="pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#3E2723] outline-none w-full md:w-64 transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Grid of Member Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map(member => {
                        const stats = getMemberStats(member.subtasks);
                        return (
                            <div 
                                key={member._id}
                                className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden relative"
                                onClick={() => setSelectedMember(member)}
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Users className="w-24 h-24" />
                                </div>

                                <div className="flex items-center gap-4 mb-6 relative">
                                    <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{member.name}</h3>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {Array.from(new Set(member.subtasks.map(st => st.projectName))).slice(0, 2).map((proj, idx) => (
                                                <span key={idx} className="text-[8px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded font-black uppercase tracking-tighter">
                                                    {proj}
                                                </span>
                                            ))}
                                            {new Set(member.subtasks.map(st => st.projectName)).size > 2 && (
                                                <span className="text-[8px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded font-black uppercase tracking-tighter">
                                                    +{new Set(member.subtasks.map(st => st.projectName)).size - 2} More
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 relative">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                        <span>Subtask Progress</span>
                                        <span className="text-gray-900">{stats.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div 
                                            className="bg-[#3E2723] h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${stats.percentage}%` }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 pt-2">
                                        <div className="bg-gray-50 rounded-2xl p-3 text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total</p>
                                            <p className="text-lg font-black text-gray-900">{stats.total}</p>
                                        </div>
                                        <div className="bg-green-50 rounded-2xl p-3 text-center">
                                            <p className="text-[10px] font-black text-green-400 uppercase mb-1">Done</p>
                                            <p className="text-lg font-black text-green-600">{stats.completed}</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-2xl p-3 text-center">
                                            <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Live</p>
                                            <p className="text-lg font-black text-blue-600">{stats.inProgress}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#3E2723] transition-colors">View Deep Analysis</span>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#3E2723] group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Member Detail Modal */}
                {selectedMember && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setSelectedMember(null)} />
                        
                        <div className="relative bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                            {/* Modal Header */}
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-gray-900 rounded-[30px] flex items-center justify-center text-white text-3xl font-black shadow-2xl">
                                        {selectedMember.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-1">{selectedMember.name}</h2>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-[#EFEBE9] text-[#3E2723] text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                {selectedMember.teamName}
                                            </span>
                                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" /> {getMemberStats(selectedMember.subtasks).percentage}% Overall Efficiency
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedMember(null)}
                                    className="p-4 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"
                                >
                                    <AlertCircle className="w-6 h-6 rotate-45" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50">
                                {/* Subtasks Drill-down */}
                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <ClipboardList className="w-4 h-4 text-[#3E2723]" /> Active Responsibilities
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {selectedMember.subtasks.map((st, i) => (
                                            <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all border-l-8 border-l-[#3E2723]">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${getStatusColor(st.status)}`}>
                                                                {st.status || 'Pending'}
                                                            </span>
                                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">Project: {st.projectName}</span>
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md">Task: {st.parentTaskTitle}</span>
                                                        </div>
                                                        <h5 className="text-lg font-black text-gray-900 uppercase tracking-tight mt-2">{st.title}</h5>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Completion</p>
                                                            <p className="text-lg font-black text-gray-900">{st.progressPercentage || 0}%</p>
                                                        </div>
                                                        <div className="h-10 w-[1px] bg-gray-100" />
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deadline</p>
                                                            <p className="text-sm font-black text-gray-900 uppercase">
                                                                {st.deadline ? new Date(st.deadline).toLocaleDateString() : 'No Target'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedMember.subtasks.length === 0 && (
                                            <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
                                                <Activity className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                                                <p className="text-gray-400 font-black uppercase tracking-widest">No active assignments</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Member's Perspective (Attachments uploaded by them) */}
                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-[#3E2723]" /> Evidence & Assets
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(() => {
                                            const memberAttachments = [];
                                            // Find attachments in all tasks that were uploaded by this member
                                            tasks.forEach(task => {
                                                if (task.attachments) {
                                                    task.attachments.forEach(att => {
                                                        const uploaderId = att.uploadedBy?._id || att.uploadedBy;
                                                        if (String(uploaderId) === String(selectedMember._id)) {
                                                            memberAttachments.push({ ...att, taskTitle: task.title });
                                                        }
                                                    });
                                                }
                                            });

                                            return memberAttachments.length > 0 ? memberAttachments.map((att, i) => (
                                                <div key={i} className="group bg-white border border-gray-100 rounded-3xl p-5 hover:shadow-xl transition-all flex items-center justify-between ring-1 ring-gray-50">
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${att.isExternalLink ? 'bg-indigo-50 text-indigo-600' : 'bg-[#FAF7F2] text-[#3E2723]'}`}>
                                                            {att.isExternalLink ? <ExternalLink className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight leading-tight mb-1">{att.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Linked to: {att.taskTitle}</p>
                                                        </div>
                                                    </div>
                                                    <a 
                                                        href={att.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="p-3 bg-gray-50 hover:bg-gray-900 text-gray-400 hover:text-white rounded-xl transition-all"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </a>
                                                </div>
                                            )) : (
                                                <div className="col-span-2 text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
                                                    <p className="text-gray-400 font-black uppercase tracking-widest">No contribution assets found</p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 border-t border-gray-100 bg-white relative z-10 flex justify-end gap-4">
                                <button 
                                    onClick={() => setSelectedMember(null)}
                                    className="px-10 py-4 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200"
                                >
                                    Close Analysis
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default IndividualTaskBreakdown;
