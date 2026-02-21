import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Users, ArrowLeft, Mail, Phone, Target, Award, CheckCircle2, 
    Activity, AlertCircle, BarChart3, Calendar, TrendingUp, 
    Clock, UserMinus, Briefcase, ChevronRight, LayoutDashboard,
    History, Layers, FileText, ExternalLink, ShieldCheck, Zap,
    Plus, Share2, MessageSquare, PlusCircle, User, X, Search, Check, Send
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
    LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { adminTeamsAPI, adminUsersAPI } from '../services/adminApi';
import Layout from '../components/Layout';

const TeamDetailsPage = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [teamDetails, setTeamDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('analytics');
    const [viewingAssignees, setViewingAssignees] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [showMsgModal, setShowMsgModal] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [msgTitle, setMsgTitle] = useState('');
    const [msgBody, setMsgBody] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);
    const [messageSent, setMessageSent] = useState(false);
    const [memberAdded, setMemberAdded] = useState(false);
    const popoverRef = useRef(null);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setViewingAssignees(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        if (window.confirm(`⚠️ EXCLUDE PERSONNEL: Are you certain you wish to remove ${memberName.toUpperCase()} from this operational unit?`)) {
            try {
                await adminTeamsAPI.removeMember(teamId, memberId);
                fetchTeamDetails();
            } catch (error) {
                console.error('Error removing member:', error);
                alert('Failed to update roster');
            }
        }
    };

    const handleExportData = () => {
        if (!teamDetails) return;

        const { team, tasks, taskStats } = teamDetails;
        
        // Prepare CSV Content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Header Info
        csvContent += `TEAM PROFILE: ${team.name}\n`;
        csvContent += `Lead: ${team.leadId?.name || 'N/A'}\n`;
        csvContent += `Health Score: ${healthScore}\n`;
        csvContent += `Status: ${teamDetails.teamStatus}\n\n`;
        
        // Stats
        csvContent += `STATISTICS\n`;
        csvContent += `Total Tasks,${taskStats.total}\n`;
        csvContent += `Completed,${taskStats.completed}\n`;
        csvContent += `In Progress,${taskStats.inProgress}\n`;
        csvContent += `Pending,${taskStats.pending}\n`;
        csvContent += `Overdue,${taskStats.overdue}\n\n`;
        
        // Task List
        csvContent += `TASK LIST\n`;
        csvContent += `S.No,Title,Status,Priority,Deadline,Progress %\n`;
        
        tasks.forEach((task, index) => {
            const row = [
                String(index + 1).padStart(2, '0'),
                task.title.replace(/,/g, ' '), // escape commas
                task.status,
                task.priority,
                new Date(task.deadline).toLocaleDateString(),
                task.progressPercentage || 0
            ].join(",");
            csvContent += row + "\n";
        });

        // Download Browser Logic
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${team.name.replace(/\s+/g, '_')}_Performance_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchAvailableUsers = async () => {
        try {
            setSearchingUsers(true);
            const response = await adminUsersAPI.getAll();
            const allUsers = response.data.data;
            
            // Just get all team members
            const available = allUsers.filter(user => user.role === 'team_member');
            
            setAvailableUsers(available);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setSearchingUsers(false);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedRecipient || !msgBody) return;
        
        try {
            setSendingMsg(true);
            const recipientId = selectedRecipient._id || selectedRecipient.userId;
            await adminUsersAPI.sendDirectMessage(recipientId, {
                title: msgTitle || `Operational Update from Administrator`,
                message: msgBody,
                priority: 'medium'
            });
            
            setMessageSent(true);
            setTimeout(() => {
                setShowMsgModal(false);
                setMessageSent(false);
                setMsgTitle('');
                setMsgBody('');
            }, 1500);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSendingMsg(false);
        }
    };

    const handleAddMembers = async () => {
        if (selectedMembers.length === 0) return;
        
        try {
            setLoading(true);
            await adminTeamsAPI.assignMembers(teamId, selectedMembers);
            setMemberAdded(true);
            
            setTimeout(() => {
                setShowAddModal(false);
                setMemberAdded(false);
                setSelectedMembers([]);
                fetchTeamDetails();
            }, 1500);
        } catch (error) {
            console.error('Error adding members:', error);
            // In a real app, use a proper error toast here
        } finally {
            setLoading(false);
        }
    };

    const getHealthColor = (score) => {
        if (score >= 80) return '#059669'; // Emerald 600
        if (score >= 60) return '#2563eb'; // Blue 600
        if (score >= 40) return '#d97706'; // Amber 600
        return '#dc2626'; // Red 600
    };

    if (loading) {
        return (
            <Layout title="Team Details">
                <div className="flex items-center justify-center min-h-[70vh]">
                    <div className="text-center space-y-4">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 border-4 border-[#3E2723]/10 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-[#3E2723] rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-[#3E2723] font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Decrypting Unit Intel...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!teamDetails) return null;

    const { team, taskStats, healthScore, completionRate, activeMembers, avgCompletionTime, memberActivity, tasks } = teamDetails;

    // Chart Data
    const taskDistributionData = [
        { name: 'Completed', value: taskStats.completed, color: '#3E2723' },
        { name: 'Active', value: taskStats.inProgress + taskStats.pending, color: '#D7CCC8' },
        { name: 'Overdue', value: taskStats.overdue, color: '#DC2626' }
    ].filter(d => d.value > 0);

    const memberPerformanceData = memberActivity.map(m => ({
        name: m.name.split(' ')[0],
        success: m.completionRate,
        tasks: m.tasksAssigned
    }));

    const tabs = [
        { id: 'analytics', label: 'Tactical Analytics', icon: BarChart3 },
        { id: 'tasks', label: 'Operational Roster', icon: Layers },
        { id: 'members', label: 'Personnel', icon: Users },
        { id: 'projects', label: 'Strategic Context', icon: Briefcase }
    ];

    return (
        <Layout title="Team Profile">
            <div className="max-w-[1600px] mx-auto px-4 lg:px-10 py-6 space-y-6 bg-[#FAF9F8]">
                
                {/* BACK NAVIGATION */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/teams')} 
                        className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-[#1D1110] hover:border-[#1D1110]/20 hover:shadow-sm transition-all group"
                        title="Back to Teams"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Operational Unit</h2>
                        <h1 className="text-2xl font-black text-[#1D1110] tracking-tight">{team.name}</h1>
                    </div>
                </div>

                {/* COMPACT DASHBOARD HEADER & KPI HUB */}
                <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                    {/* STATS AXIS (3 Column Grid) */}
                    <div className="flex-[3] grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* KPI: TASKS DONE */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-[#1D1110]/10 transition-colors">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tasks Done</p>
                                <div className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold">+12.5%</div>
                            </div>
                            <h3 className="text-3xl font-bold text-[#1D1110] tracking-tighter mt-2">
                                {taskStats.completed}
                            </h3>
                        </div>

                        {/* KPI: ONGOING */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-[#1D1110]/10 transition-colors">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ongoing</p>
                                <div className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-bold">Active</div>
                            </div>
                            <h3 className="text-3xl font-bold text-[#1D1110] tracking-tighter mt-2">
                                {taskStats.inProgress}
                            </h3>
                        </div>

                        {/* KPI: PENDING */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-[#1D1110]/10 transition-colors">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</p>
                                <div className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold">-5.2%</div>
                            </div>
                            <h3 className="text-3xl font-bold text-[#1D1110] tracking-tighter mt-2">
                                {String(taskStats.pending).padStart(2, '0')}
                            </h3>
                        </div>
                    </div>

                    {/* CONTROL HUB (Vertical Stack) */}
                    <div className="flex-[1] flex flex-col gap-2 lg:min-w-[180px]">
                        <button 
                            onClick={handleExportData}
                            className="flex-1 flex items-center justify-between group px-5 py-3 bg-[#1D1110] text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-black/10"
                        >
                            <span>Export Data</span>
                            <Share2 className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" />
                        </button>
                        <button 
                            onClick={() => {
                                setShowAddModal(true);
                                fetchAvailableUsers();
                            }}
                            className="flex-1 flex items-center justify-between group px-5 py-3 bg-white border border-gray-200 text-[#1D1110] rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:border-[#1D1110] transition-all"
                        >
                            <span>Add Member</span>
                            <Plus className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#1D1110] transition-colors" />
                        </button>
                    </div>
                </div>

                {/* MAIN ANALYTICS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* VELOCITY CHART */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-[#1D1110] tracking-tighter">Team Velocity</h3>
                                <p className="text-sm font-bold text-gray-400">Story points delivered per cycle</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#1D1110]" />
                                    <span className="text-[10px] font-bold uppercase text-gray-500">Planned</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                                    <span className="text-[10px] font-bold uppercase text-gray-500">Actual</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[
                                    { name: 'Jan', planned: 30, actual: 25 },
                                    { name: 'Feb', planned: 45, actual: 40 },
                                    { name: 'Mar', planned: 55, actual: 60 },
                                    { name: 'Apr', planned: 70, actual: 65 },
                                    { name: 'May', planned: 85, actual: 90 },
                                    { name: 'Jun', planned: 75, actual: 80 }
                                ]}>
                                    <defs>
                                        <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1D1110" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#1D1110" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F9FAFB" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fontWeight: 900, fill: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                        dy={20}
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '1rem' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="planned" 
                                        stroke="#1D1110" 
                                        strokeWidth={4}
                                        fillOpacity={1} 
                                        fill="url(#colorPlanned)" 
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="actual" 
                                        stroke="#E5E7EB" 
                                        strokeWidth={4}
                                        fill="transparent"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* SIDE PANELS COLUMN */}
                    <div className="space-y-8">
                        {/* TEAM MEMBERS PANEL */}
                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xl font-bold text-[#1D1110] tracking-tighter">Team Members</h4>
                                <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md text-[10px] font-bold">{team.members?.length || 0} Total</span>
                            </div>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {memberActivity.map((member, i) => (
                                    <div key={i} className="flex items-center justify-between group py-2 first:pt-0">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-bold text-[#1D1110] group-hover:scale-105 transition-transform">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#1D1110]">{member.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400">{member.designation || 'Operational Specialist'}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setSelectedRecipient(member);
                                                setShowMsgModal(true);
                                            }}
                                            className="p-2 text-gray-300 hover:text-[#1D1110] transition-colors"
                                        >
                                            <MessageSquare className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RECENT COMPLETIONS PANEL */}
                        <div className="bg-white p-6 rounded-[3rem] border border-gray-100 shadow-sm space-y-4">
                            <h4 className="text-xl font-bold text-[#1D1110] tracking-tighter">Recent Completions</h4>
                            <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-50">
                                {tasks.filter(t => t.status === 'completed').slice(0, 3).map((task, i) => (
                                    <div key={i} className="relative pl-10 flex flex-col gap-1">
                                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 ${i === 0 ? 'border-[#1D1110]' : 'border-gray-100'} z-10 flex items-center justify-center shadow-sm`}>
                                            {i === 0 && <div className="w-1 h-1 bg-[#1D1110] rounded-full" />}
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{i === 0 ? '2 HOURS AGO' : i === 1 ? 'YESTERDAY' : 'OCT 20, 2023'}</p>
                                        <p className="text-sm font-bold text-[#1D1110] leading-tight">{task.title}</p>
                                        <p className="text-[10px] font-bold text-gray-400">Completed by <span className="text-[#1D1110]">@{task.assignedTo?.name.split(' ')[0].toLowerCase()}</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ONGOING TASKS TABLE */}
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden pb-4">
                    <div className="px-10 py-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-[#1D1110] tracking-tight">Ongoing Tasks</h3>
                        <button className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#1D1110] transition-colors">View All</button>
                    </div>
                    <div className="px-10">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-50">
                                    <th className="py-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] w-[40%]">Task Name</th>
                                    <th className="py-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Assignee</th>
                                    <th className="py-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] w-[20%]">Progress</th>
                                    <th className="py-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-right">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {tasks.filter(t => t.status !== 'completed').slice(0, 5).map((task, i) => (
                                    <tr key={i} className="group hover:bg-gray-50/50 transition-all cursor-pointer">
                                        <td className="py-4 pr-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-[11px] font-bold text-gray-500 border border-gray-100">
                                                    {String(i + 1).padStart(2, '0')}
                                                </div>
                                                <span className="text-sm font-bold text-[#1D1110]">{task.title}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 relative">
                                            {(() => {
                                                // Extract subtask assignees
                                                const subtaskAssignees = task.subtasks?.map(st => st.assignedTo).filter(Boolean) || [];
                                                const uniqueAssignees = Array.from(new Set(subtaskAssignees.map(a => a._id || a)))
                                                    .map(id => subtaskAssignees.find(a => (a._id || a) === id));
                                                
                                                const primaryAssignee = task.assignedTo;
                                                const displayAssignees = uniqueAssignees.length > 0 ? uniqueAssignees : [primaryAssignee];

                                                return (
                                                    <>
                                                        <div className="flex -space-x-2">
                                                            {displayAssignees.slice(0, 1).map((assignee, idx) => (
                                                                <div 
                                                                    key={idx}
                                                                    className="w-8 h-8 rounded-full bg-[#1D1110] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-gray-100 overflow-hidden" 
                                                                    title={`${assignee?.name} ${assignee?._id === task.assignedTo?._id ? '(Unit Lead)' : '(Personnel)'}`}
                                                                >
                                                                    {assignee?.avatar ? (
                                                                        <img src={assignee.avatar} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        assignee?.name?.charAt(0) || '?'
                                                                    )}
                                                                </div>
                                                            ))}
                                                            
                                                            {(displayAssignees.length > 1 || (displayAssignees.length === 1 && uniqueAssignees.length > 0)) && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setViewingAssignees(viewingAssignees === task._id ? null : task._id);
                                                                    }}
                                                                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-sm hover:border-[#1D1110] hover:text-[#1D1110] transition-all z-10"
                                                                >
                                                                    +{displayAssignees.length > 1 ? displayAssignees.length - 1 : 'Lead'}
                                                                </button>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Assignee Popover */}
                                                        <AnimatePresence>
                                                            {viewingAssignees === task._id && (
                                                                <motion.div
                                                                    ref={popoverRef}
                                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    className="absolute left-0 bottom-full mb-2 z-50 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4"
                                                                >
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2">Operational Personnel</p>
                                                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                                        {/* Primary Lead */}
                                                                        <div className="flex items-center gap-3 opacity-60">
                                                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 italic font-serif text-[#1D1110]">
                                                                                {task.assignedTo?.name?.charAt(0)}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs font-bold text-[#1D1110]">{task.assignedTo?.name}</p>
                                                                                <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Unit Lead (Supervisor)</p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Active Members from Subtasks */}
                                                                        {uniqueAssignees.length > 0 ? uniqueAssignees.map((member, idx) => (
                                                                            <div key={idx} className="flex items-center gap-3">
                                                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 overflow-hidden">
                                                                                    {member.avatar ? (
                                                                                        <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                                                                    ) : (
                                                                                        <User className="w-4 h-4 text-blue-400" />
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-xs font-bold text-[#1D1110]">{member.name || 'Anonymous'}</p>
                                                                                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">Active Personnel</p>
                                                                                </div>
                                                                            </div>
                                                                        )) : (
                                                                            <p className="text-[10px] text-gray-400 italic">No specific sub-personnel assigned by Lead yet.</p>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-4 pr-10">
                                            {(() => {
                                                const subtasks = task.subtasks || [];
                                                let taskProgress;
                                                if (subtasks.length > 0) {
                                                    const completedSubtasks = subtasks.filter(st => st.status === 'completed').length;
                                                    taskProgress = Math.round((completedSubtasks / subtasks.length) * 100);
                                                } else {
                                                    taskProgress = task.status === 'completed' ? 100 : 
                                                                   task.status === 'in_progress' ? (task.progressPercentage || 0) : 0;
                                                }
                                                return (
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${taskProgress === 100 ? 'bg-green-500' : taskProgress > 0 ? 'bg-[#1D1110]' : 'bg-gray-300'}`} style={{ width: `${taskProgress}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-[#1D1110]">{taskProgress}%</span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-4 text-right">
                                            <p className="text-xs font-bold text-[#1D1110]">{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* ADD MEMBER MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1D1110]/20 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h3 className="text-xl font-bold text-[#1D1110] tracking-tight">Expand Roster</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Assign operational personnel</p>
                                </div>
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="p-8 flex flex-col flex-1 overflow-hidden gap-6">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="FILTER BY NAME OR DESIGNATION..."
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-[10px] font-bold tracking-widest text-[#1D1110] focus:ring-2 focus:ring-[#1D1110]/5 transition-all outline-none placeholder:text-gray-300"
                                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* User List */}
                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    {searchingUsers ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                                            <div className="w-8 h-8 border-2 border-[#1D1110] border-t-transparent rounded-full animate-spin" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scanning Global Database...</p>
                                        </div>
                                    ) : memberAdded ? (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col items-center justify-center py-20 space-y-4"
                                        >
                                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                                                <Check className="w-10 h-10 text-white" />
                                            </div>
                                            <div className="text-center">
                                                <h4 className="text-2xl font-bold text-[#1D1110]">Unit Expanded!</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Personnel have been added to the team</p>
                                            </div>
                                        </motion.div>
                                    ) : (() => {
                                        const filtered = availableUsers.filter(u => 
                                            u.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) || 
                                            u.designation?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                                        );

                                        if (filtered.length === 0) {
                                            return (
                                                <div className="text-center py-12">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">No available personnel found</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="space-y-2">
                                                {filtered.map((user) => {
                                                    const isAlreadyMember = teamDetails.team.members.some(m => (m._id || m) === user._id);
                                                    const isSelected = selectedMembers.includes(user._id);

                                                    return (
                                                        <div 
                                                            key={user._id}
                                                            onClick={() => {
                                                                if (isAlreadyMember) return;
                                                                setSelectedMembers(prev => 
                                                                    prev.includes(user._id) 
                                                                        ? prev.filter(id => id !== user._id) 
                                                                        : [...prev, user._id]
                                                                );
                                                            }}
                                                            className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                                                                isAlreadyMember 
                                                                    ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60' 
                                                                    : isSelected
                                                                        ? 'bg-[#1D1110] border-[#1D1110] shadow-lg shadow-black/5 cursor-pointer'
                                                                        : 'bg-white border-gray-100 hover:border-gray-300 cursor-pointer'
                                                            }`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${
                                                                isSelected && !isAlreadyMember
                                                                    ? 'bg-white/10 border-white/20 text-white'
                                                                    : 'bg-gray-50 border-gray-100 text-gray-400'
                                                            }`}>
                                                                {user.avatar ? (
                                                                    <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                                                ) : (
                                                                    user.name.charAt(0)
                                                                )}
                                                            </div>
                                                            
                                                            <div className="flex-1">
                                                                <p className={`text-xs font-bold ${isSelected && !isAlreadyMember ? 'text-white' : 'text-[#1D1110]'}`}>
                                                                    {user.name}
                                                                </p>
                                                                <p className={`text-[10px] uppercase tracking-tighter ${isSelected && !isAlreadyMember ? 'text-white/50' : 'text-gray-400'}`}>
                                                                    {user.designation || 'Specialist'} {isAlreadyMember && '• ALREADY JOINED'}
                                                                </p>
                                                            </div>

                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                                isAlreadyMember
                                                                    ? 'bg-blue-500 border-blue-500'
                                                                    : isSelected
                                                                        ? 'bg-white border-white'
                                                                        : 'border-gray-100'
                                                            }`}>
                                                                {(isAlreadyMember || isSelected) && (
                                                                    <Check className={`w-3 h-3 ${isAlreadyMember ? 'text-white' : 'text-[#1D1110]'}`} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50/50 flex gap-4">
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAddMembers}
                                    disabled={selectedMembers.length === 0}
                                    className="flex-[2] py-4 bg-[#1D1110] text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add {selectedMembers.length > 0 ? `${selectedMembers.length} ` : ''}Personnel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {/* MESSAGE MODAL */}
                <AnimatePresence>
                    {showMsgModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowMsgModal(false)}
                                className="absolute inset-0 bg-[#1D1110]/20 backdrop-blur-md"
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl shadow-black/20 overflow-hidden border border-gray-100 flex flex-col"
                            >
                                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#1D1110] rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
                                            <MessageSquare className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#1D1110] tracking-tight">Direct Message</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To: {selectedRecipient?.name}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowMsgModal(false)}
                                        className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:border-[#1D1110] hover:text-[#1D1110] transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6">
                                    {messageSent ? (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col items-center justify-center py-12 space-y-4"
                                        >
                                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                                                <Check className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="text-center">
                                                <h4 className="text-xl font-bold text-[#1D1110]">Message Sent!</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Personnel has been notified</p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Subject (Optional)</label>
                                                <input 
                                                    type="text"
                                                    value={msgTitle}
                                                    onChange={(e) => setMsgTitle(e.target.value)}
                                                    placeholder="Operational Update..."
                                                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] text-sm font-bold text-[#1D1110] focus:bg-white focus:border-[#1D1110]/10 transition-all outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Message Content</label>
                                                <textarea 
                                                    value={msgBody}
                                                    onChange={(e) => setMsgBody(e.target.value)}
                                                    placeholder="Type your message here..."
                                                    rows={5}
                                                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] text-sm font-bold text-[#1D1110] focus:bg-white focus:border-[#1D1110]/10 transition-all outline-none resize-none custom-scrollbar"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {!messageSent && (
                                    <div className="p-8 bg-gray-50/50 flex gap-4">
                                        <button 
                                            onClick={() => setShowMsgModal(false)}
                                            className="flex-1 px-8 py-4 rounded-[1.5rem] text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border border-gray-200 hover:border-gray-300 transition-all"
                                        >
                                            Discard
                                        </button>
                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={sendingMsg || !msgBody}
                                            className={`flex-[2] flex items-center justify-center gap-3 px-8 py-4 rounded-[1.5rem] text-[10px] font-bold text-white uppercase tracking-[0.2em] transition-all shadow-xl ${
                                                !msgBody || sendingMsg ? 'bg-gray-300 shadow-none' : 'bg-[#1D1110] hover:bg-black shadow-black/10'
                                            }`}
                                        >
                                            {sendingMsg ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span>Send Message</span>
                                                    <Send className="w-3.5 h-3.5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </AnimatePresence>
        </Layout>

    );
};

export default TeamDetailsPage;
