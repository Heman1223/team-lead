import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    CheckCircle, Clock, AlertCircle, Users, TrendingUp, 
    Calendar, Phone, Bell, Activity, Target, BarChart3, PieChart,
    ChevronRight, Plus, Filter, Trophy, Briefcase, FileCheck,
    ArrowUpRight, Mail, MapPin, Search, MoreVertical,
    MessageSquare, ListTodo, Zap
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useFilters } from '../context/FilterContext';
import { tasksAPI, teamsAPI, usersAPI, leadsAPI, analyticsAPI, reportsAPI } from '../services/api';
import { 
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';

const Dashboard = () => {
    const { user, isTeamLead } = useAuth();
    const { selectedMonth, selectedYear, dateRange } = useFilters();
    const navigate = useNavigate();
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
        notStarted: 0,
        subtasksPending: 0,
        activeProjects: 0
    });
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myTasks, setMyTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [allLeads, setAllLeads] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [teamLeadStats, setTeamLeadStats] = useState({
        performance: 0,
        teamLeadsStats: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]); // Re-fetch when global date range changes

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Use global date range
            const startDate = dateRange.startDate;
            const endDate = dateRange.endDate;
            
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
                    onHold: filteredTasks.filter(t => t.status === 'on_hold').length,
                    overdue: filteredTasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && new Date(t.deadline || t.dueDate) < new Date())).length,
                    notStarted: filteredTasks.filter(t => t.status === 'pending').length,
                    subtasksPending: filteredTasks.reduce((acc, t) => acc + (t.subtasks?.filter(st => st.status !== 'completed').length || 0), 0),
                    activeProjects: filteredTasks.filter(t => t.taskType === 'project_task' && t.status !== 'completed').length
                };
                setTaskStats(stats);

                // Set lead statistics
                if (leadsRes.data.data) {
                    const leadData = leadsRes.data.data;
                    setLeadStats({
                        total: leadData.totalLeads || 0,
                        new: leadData.statusDist?.new || 0,
                        contacted: leadData.statusDist?.contacted || 0,
                        qualified: leadData.statusDist?.qualified || 0,
                        proposal: leadData.statusDist?.proposal || 0,
                        converted: leadData.convertedLeads || 0,
                        lost: leadData.lostLeads || 0,
                        followUpsToday: leadData.followUpsToday || 0,
                        highValueLeads: leadData.highValueLeads || 0,
                        inactiveLeads: leadData.inactiveLeads || 0,
                        conversionRate: leadData.conversionRate || 0
                    });

                    // Prepare chart data with new statuses
                    const statusDist = leadData.statusDist || {};
                    setLeadChartData([
                        { name: 'New', value: statusDist.new || 0, color: '#3b82f6' },
                        { name: 'Contacted', value: statusDist.contacted || 0, color: '#6366f1' },
                        { name: 'Qualified', value: statusDist.qualified || 0, color: '#8b5cf6' },
                        { name: 'Proposal', value: statusDist.proposal || 0, color: '#f59e0b' },
                        { name: 'Converted', value: statusDist.converted || 0, color: '#10b981' },
                        { name: 'Lost', value: statusDist.lost || 0, color: '#ef4444' }
                    ].filter(item => item.value > 0));
                }

                // Fetch actual leads for Kanban
                const allLeadsRes = await leadsAPI.getAll();
                setAllLeads(allLeadsRes.data.data || []);

                // Prepare alerts
                const newAlerts = [];
                if (leadsRes.data.data?.followUpsToday > 0) {
                    newAlerts.push({ type: 'lead', message: `${leadsRes.data.data.followUpsToday} follow-ups due today`, severity: 'high', icon: Phone });
                }
                if (leadsRes.data.data?.highValueLeads > 0) {
                    newAlerts.push({ type: 'lead', message: `${leadsRes.data.data.highValueLeads} high-value leads need attention`, severity: 'urgent', icon: Zap });
                }
                if (leadsRes.data.data?.inactiveLeads > 0) {
                    newAlerts.push({ type: 'lead', message: `${leadsRes.data.data.inactiveLeads} leads inactive for 7+ days`, severity: 'medium', icon: Clock });
                }
                if (stats.overdue > 0) {
                    newAlerts.push({ type: 'task', message: `${stats.overdue} tasks are overdue`, severity: 'urgent', icon: AlertCircle });
                }
                setAlerts(newAlerts);

                // Team Performance
                const performanceRes = await reportsAPI.getTeamPerformance();
                if (performanceRes.data.data) {
                    const perfArray = performanceRes.data.data;
                    const avgPerf = perfArray.length > 0 
                        ? Math.round(perfArray.reduce((acc, curr) => acc + (curr.completionRate || 0), 0) / perfArray.length) 
                        : 0;
                    
                    setTeamLeadStats({
                        performance: avgPerf,
                        teamLeadsStats: perfArray.map(item => ({
                            name: item.member?.name || 'Unknown',
                            assignedLeads: item.totalTasks || 0,
                            convertedLeads: item.tasksCompleted || 0,
                            efficiencyScore: item.completionRate || 0
                        }))
                    });
                }

                // Get upcoming deadlines
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
        if (!task) return 0;
        if (task.subtasks && task.subtasks.length > 0) {
            const totalProgress = task.subtasks.reduce((sum, st) => sum + (st.progressPercentage || 0), 0);
            return Math.round(totalProgress / task.subtasks.length);
        }
        return task.progressPercentage || 0;
    };

    const formatDeadline = (deadline) => {
        if (!deadline) return 'No deadline';
        const now = new Date();
        const due = new Date(deadline);
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `${diffDays} days left`;
    };

    const handleConvertLead = async (leadId) => {
        try {
            const res = await leadsAPI.convertToProject(leadId);
            if (res.data.success) {
                alert('Lead converted to project task successfully!');
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Conversion error:', error);
            alert('Failed to convert lead to project.');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return 'text-red-700 bg-red-100 border-red-300 font-black animate-pulse';
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
            case 'on_hold': return 'bg-amber-500';
            case 'overdue': return 'bg-red-500';
            case 'pending': return 'bg-purple-500';
            default: return 'bg-gray-400';
        }
    };

    if (loading) {
        return (
            <Layout title="Dashboard">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3E2723] mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading dashboard...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Dashboard">
            <div className="space-y-6">
                {/* Welcome & Alerts Section */}
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 bg-[#FDF8F3] rounded-3xl border border-[#EBD9C1] p-8 text-[#3E2723] relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-semibold mb-2">
                                Welcome back, {user?.name?.split(' ')[0]}
                            </h2>
                            <p className="text-gray-600 text-lg">
                                {isTeamLead 
                                    ? "Your team's performance is at " + (teamLeadStats.performance || 0) + "% today." 
                                    : "You have " + (taskStats.inProgress || 0) + " tasks in progress."}
                            </p>
                            <div className="mt-6 flex gap-3">
                                <button onClick={() => navigate('/leads')} className="px-5 py-2.5 bg-[#3E2723] text-white rounded-xl font-bold text-sm hover:bg-[#5D4037] transition-all flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> New Lead
                                </button>
                                <button onClick={() => navigate('/tasks')} className="px-5 py-2.5 bg-white border border-[#EBD9C1] text-[#3E2723] rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                                    <ListTodo className="w-4 h-4" /> My Tasks
                                </button>
                            </div>
                        </div>
                        <Activity className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-[#3E2723] opacity-[0.03] rotate-12" />
                    </div>

                    {/* Alerts Section */}
                    <div className="lg:w-1/3 bg-white rounded-3xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Bell className="w-5 h-5 text-amber-500" />
                                Action Alerts
                            </h3>
                            <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                {alerts.length} New
                            </span>
                        </div>
                        <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                            {alerts.length > 0 ? alerts.map((alert, idx) => (
                                <div key={idx} className={`flex items-start gap-3 p-3 rounded-2xl border ${
                                    alert.severity === 'urgent' ? 'bg-red-50 border-red-100 text-red-700' : 
                                    alert.severity === 'high' ? 'bg-amber-50 border-amber-100 text-amber-700' : 
                                    'bg-blue-50 border-blue-100 text-blue-700'
                                }`}>
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <alert.icon className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-medium leading-tight pt-1">{alert.message}</p>
                                </div>
                            )) : (
                                <div className="text-center py-6 text-gray-400 italic text-sm">
                                    All clear for now
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 1️⃣ Top Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Assigned Tasks', value: taskStats.total, color: 'blue', sub: 'My queue' },
                        { label: 'Active Projects', value: taskStats.activeProjects, color: 'indigo', sub: 'In progress' },
                        { label: 'Assigned Leads', value: leadStats.total, color: 'purple', sub: 'Pipeline' },
                        { label: 'Leads Converted', value: leadStats.converted, color: 'green', sub: 'Won leads' },
                        { label: 'Overdue Tasks', value: taskStats.overdue, color: 'red', sub: 'Needs action' },
                        { label: 'Team Performance', value: `${teamLeadStats.performance || 0}%`, color: 'amber', sub: 'Average %' }
                    ].map((card, i) => (
                        <div key={i} className="bg-[#FDF8F3] p-5 rounded-3xl border border-[#EBD9C1] hover:border-[#3E2723]/30 transition-all group cursor-pointer">
                            <p className="text-[10px] font-medium text-gray-400 tracking-wider mb-1 uppercase">{card.label}</p>
                            <h4 className="text-2xl font-bold text-[#3E2723] leading-none mb-1">{card.value}</h4>
                            <p className="text-[10px] text-gray-400 font-medium">{card.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Project Progress Bar Chart */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                            Project Progress
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={myTasks.filter(t => t.taskType === 'project_task').slice(0, 6)}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="title" fontSize={10} tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={10} tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="progressPercentage" name="Progress %" radius={[4, 4, 0, 0]}>
                                        {myTasks.filter(t => t.taskType === 'project_task').slice(0, 6).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 6]} />
                                        ))}
                                    </Bar>
                                </ReBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Task Status Pie Chart */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-purple-500" />
                            Task Status Distribution
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={[
                                            { name: 'Completed', value: taskStats.completed, color: '#10b981' },
                                            { name: 'Overdue', value: taskStats.overdue, color: '#ef4444' },
                                            { name: 'Pending', value: taskStats.notStarted, color: '#8b5cf6' },
                                            { name: 'In Progress', value: taskStats.inProgress, color: '#3b82f6' }
                                        ].filter(d => d.value > 0)}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {[
                                            { name: 'Completed', value: taskStats.completed, color: '#10b981' },
                                            { name: 'Overdue', value: taskStats.overdue, color: '#ef4444' },
                                            { name: 'Pending', value: taskStats.notStarted, color: '#8b5cf6' },
                                            { name: 'In Progress', value: taskStats.inProgress, color: '#3b82f6' }
                                        ].filter(d => d.value > 0).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left -> My Tasks (4 cols) */}
                    <div className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <ListTodo className="w-5 h-5 text-blue-500" />
                                My Assigned Tasks
                            </h3>
                            <button onClick={() => navigate('/tasks')} className="text-[#3E2723] hover:underline font-bold text-xs">View All</button>
                        </div>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {myTasks.length > 0 ? myTasks.slice(0, 5).map(task => (
                                <div key={task._id} className="p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group bg-gray-50/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400">
                                            {formatDeadline(task.deadline || task.dueDate)}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-blue-600 transition-colors leading-tight">{task.title}</h4>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden shadow-inner">
                                        <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${getTaskProgress(task)}%` }}></div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                                        <span>{getTaskProgress(task)}% COMPLETE</span>
                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {task.subtasks?.length || 0}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 text-gray-400 italic">No tasks assigned.</div>
                            )}
                        </div>
                    </div>

                    {/* Right -> My Leads (8 cols) */}
                    <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-indigo-500" />
                                My Leads Overview
                            </h3>
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <p className="text-xs font-medium text-gray-400">Follow-up Today</p>
                                    <p className="text-xl font-serif italic text-amber-500">{leadStats.followUpsToday}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium text-gray-400">Lost</p>
                                    <p className="text-xl font-semibold text-red-500">{leadStats.lost}</p>
                                </div>
                                <button onClick={() => navigate('/leads')} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all">Full CRM</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allLeads.filter(l => l.assignedTo?._id === user._id || !l.assignedTo).slice(0, 4).map(lead => (
                                <div key={lead._id} className="p-4 rounded-3xl border border-gray-100 hover:shadow-xl transition-all bg-white group border-l-4" style={{ borderColor: lead.status === 'converted' ? '#10b981' : lead.status === 'lost' ? '#ef4444' : '#6366f1' }}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 text-base leading-none mb-1 group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate(`/leads/${lead._id}`)}>{lead.clientName}</h4>
                                            <p className="text-[10px] text-gray-500 font-medium tracking-widest">{lead.source} • {lead.category}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            {lead.status === 'proposal' && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleConvertLead(lead._id); }}
                                                    title="Convert to Project Task"
                                                    className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                                >
                                                    <Zap className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button className="p-1 hover:bg-gray-50 rounded-lg"><MoreVertical className="w-4 h-4 text-gray-400" /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                            <Mail className="w-3.5 h-3.5 text-indigo-400" /> {lead.email || 'No email'}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                            <Phone className="w-3.5 h-3.5 text-indigo-400" /> {lead.phone || 'No phone'}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 overflow-hidden">
                                                <span className="text-[10px] font-black text-indigo-600">{lead.assignedTo?.name?.charAt(0) || '?'}</span>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-medium text-gray-400 leading-none">Status</p>
                                                <p className="text-[10px] font-semibold text-indigo-600 leading-tight">{lead.status}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-medium text-gray-400 leading-none">Next Follow-up</p>
                                            <p className="text-[10px] font-semibold text-amber-600 leading-tight">
                                                {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : 'TBD'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bottom Left -> Projects (Existing Task Logic) */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                            <Briefcase className="w-5 h-5 text-indigo-500" />
                            Active Projects Overview
                        </h3>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {myTasks.filter(t => t.taskType === 'project_task').length > 0 ? (
                                myTasks.filter(t => t.taskType === 'project_task').map(proj => (
                                    <div key={proj._id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/30">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-semibold text-gray-900 text-sm">{proj.title}</h4>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg text-white ${getStatusColor(proj.status)}`}>
                                                {proj.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                            <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5" /> {proj.progressPercentage}% Progress</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDeadline(proj.deadline)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 italic">
                                    No active projects tagged.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Right -> Team Performance Section */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                Team performance Stats
                            </h3>
                            <button onClick={() => navigate('/team')} className="text-xs font-bold text-amber-600 hover:underline">Full Leaderboard</button>
                        </div>
                        <div className="space-y-1">
                            <div className="grid grid-cols-12 gap-2 pb-3 mb-2 border-b border-gray-50 text-[10px] font-medium text-gray-400 tracking-widest">
                                <div className="col-span-5">Member</div>
                                <div className="col-span-2 text-center">Assigned</div>
                                <div className="col-span-2 text-center">Converted</div>
                                <div className="col-span-3 text-right">Performance</div>
                            </div>
                            {teamLeadStats.teamLeadsStats.slice(0, 5).map((member, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 py-3 items-center hover:bg-gray-50 rounded-2xl transition-all px-2">
                                    <div className="col-span-1">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600 border-2 border-white shadow-sm">
                                            {member.name?.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="col-span-4">
                                        <p className="font-semibold text-gray-900 text-sm leading-none">{member.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">Team Member</p>
                                    </div>
                                    <div className="col-span-2 text-center font-bold text-gray-600">{member.assignedLeads || 0}</div>
                                    <div className="col-span-2 text-center font-black text-green-600">{member.convertedLeads || 0}</div>
                                    <div className="col-span-3 text-right">
                                        <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-xl font-black text-xs">
                                            {member.efficiencyScore || 0}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom -> Activity Feed (Simplified from Upcoming Deadlines / Global Feed) */}
                <div className="bg-[#FDF8F3] rounded-3xl border border-[#EBD9C1] p-8 text-[#3E2723] relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">Activity Feed & Deadlines</h3>
                            <p className="text-gray-600 opacity-80 text-sm leading-relaxed max-w-xl text-balance">
                                You have {upcomingDeadlines.length} critical deadlines in the next 7 days. 
                                Make sure to check follow-ups for {leadStats.followUpsToday} leads today.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            {upcomingDeadlines.slice(0, 2).map((item, i) => (
                                <div key={i} className="bg-white p-4 rounded-2xl border border-[#EBD9C1] min-w-[200px] shadow-sm">
                                    <p className="text-[10px] font-medium text-gray-400 mb-1 uppercase tracking-wider">{formatDeadline(item.deadline)}</p>
                                    <p className="font-semibold text-sm text-[#3E2723] line-clamp-1">{item.title}</p>
                                </div>
                            ))}
                            <button onClick={() => navigate('/notifications')} className="h-full px-6 bg-[#3E2723] text-white rounded-2xl font-semibold text-xs hover:bg-[#5D4037] transition-all flex items-center gap-2">
                                All Alerts <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <Activity className="absolute left-[-10px] top-[-10px] w-48 h-48 text-[#3E2723] opacity-[0.03]" />
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;

