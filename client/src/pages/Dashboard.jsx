import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    CheckCircle, Clock, AlertCircle, Users, TrendingUp, 
    Calendar, Phone, Bell, Activity, Target, BarChart3, PieChart,
    ChevronRight, Plus, Filter, Trophy, Briefcase, FileCheck,
    ArrowUpRight, Mail, MapPin, Search, MoreVertical,
    MessageSquare, ListTodo, Zap, Folder
} from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useFilters } from '../context/FilterContext';
import { tasksAPI, teamsAPI, usersAPI, leadsAPI, analyticsAPI, reportsAPI, followUpsAPI, meetingsAPI } from '../services/api';
import leadStore from '../utils/leadStore';
import { 
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area
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
    const [upcomingFollowUps, setUpcomingFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myTasks, setMyTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [allLeads, setAllLeads] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [todayMeetings, setTodayMeetings] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [teamLeadStats, setTeamLeadStats] = useState({
        performance: 0,
        teamLeadsStats: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]); // Re-fetch when global date range changes

    // Listen for lead updates using global store
    useEffect(() => {
        const unsubscribe = leadStore.subscribe((version) => {
            console.log('Dashboard: Global store update received, version:', version);
            fetchDashboardData();
        });
        return unsubscribe;
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Use global date range
            const startDate = dateRange.startDate;
            const endDate = dateRange.endDate;
            
            if (isTeamLead) {
                // Fetch team lead specific data
                const [tasksRes, teamRes, leadsRes, followUpsRes, meetingsRes] = await Promise.all([
                    tasksAPI.getMyTasks(),
                    teamsAPI.getMyTeam(),
                    leadsAPI.getStats(),
                    followUpsAPI.getUpcoming(),
                    meetingsAPI.getAll()
                ]);

                const tasks = tasksRes.data.data || [];
                const allMeetings = meetingsRes.data?.data || [];
                
                // Filter today's meetings
                const today = new Date();
                const todayString = today.toISOString().split('T')[0];
                const todayMeetingsData = allMeetings.filter(m => {
                    const mDate = new Date(m.startTime).toISOString().split('T')[0];
                    return mDate === todayString;
                });
                setTodayMeetings(todayMeetingsData);

                // Format events for calendar
                const formattedEvents = allMeetings.map(meeting => ({
                    id: meeting._id,
                    title: meeting.title,
                    start: meeting.startTime,
                    end: meeting.endTime,
                    backgroundColor: meeting.color || '#3E2723',
                    borderColor: meeting.color || '#3E2723',
                    className: ['rescheduled', 'cancelled'].includes(meeting.status) ? 'opacity-50 grayscale-[0.5]' : '',
                    extendedProps: { ...meeting }
                }));
                setCalendarEvents(formattedEvents);

                // Use ALL tasks for charts and stats (not date-filtered)
                setMyTasks(tasks);

                const stats = {
                    total: tasks.length,
                    completed: tasks.filter(t => t.status === 'completed').length,
                    inProgress: tasks.filter(t => t.status === 'in_progress').length,
                    onHold: tasks.filter(t => t.status === 'on_hold').length,
                    overdue: tasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && new Date(t.deadline || t.dueDate) < new Date())).length,
                    notStarted: tasks.filter(t => t.status === 'pending').length,
                    subtasksPending: tasks.reduce((acc, t) => acc + (t.subtasks?.filter(st => st.status !== 'completed').length || 0), 0),
                    activeProjects: tasks.filter(t => t.taskType === 'project_task' && t.status !== 'completed').length
                };
                setTaskStats(stats);

                // Set lead statistics
                if (leadsRes.data.data) {
                    const leadData = leadsRes.data.data;
                    setLeadStats({
                        total: leadData.totalLeads || 0,
                        new: leadData.statusDist?.new || 0,
                        contacted: leadData.statusDist?.contacted || 0,
                        interested: leadData.statusDist?.interested || 0,
                        follow_up: leadData.statusDist?.follow_up || 0,
                        converted: leadData.convertedLeads || 0,
                        not_interested: leadData.statusDist?.not_interested || 0,
                        followUpsToday: leadData.followUpsToday || 0,
                        highValueLeads: leadData.highValueLeads || 0,
                        inactiveLeads: leadData.inactiveLeads || 0,
                        conversionRate: leadData.conversionRate || 0
                    });

                    // Prepare chart data with correct model statuses
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

                // Set upcoming follow-ups
                setUpcomingFollowUps(followUpsRes.data.data || []);

                if (teamRes.data.data) {
                    setTeamMembers(teamRes.data.data.members || []);
                }
            } else {
                // Team member view
                const [tasksRes, leadsRes, followUpsRes, meetingsRes] = await Promise.all([
                    tasksAPI.getMyTasks(),
                    leadsAPI.getStats(),
                    followUpsAPI.getUpcoming(),
                    meetingsAPI.getAll()
                ]);
                
                const tasks = tasksRes.data.data || [];
                const allMeetings = meetingsRes.data?.data || [];
                
                // Filter today's meetings
                const today = new Date();
                const todayString = today.toISOString().split('T')[0];
                const todayMeetingsData = allMeetings.filter(m => {
                    const mDate = new Date(m.startTime).toISOString().split('T')[0];
                    return mDate === todayString;
                });
                setTodayMeetings(todayMeetingsData);
                
                // Use ALL tasks for charts and stats (not date-filtered)
                setMyTasks(tasks);

                const stats = {
                    total: tasks.length,
                    completed: tasks.filter(t => t.status === 'completed').length,
                    inProgress: tasks.filter(t => t.status === 'in_progress').length,
                    overdue: tasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && new Date(t.deadline || t.dueDate) < new Date())).length,
                    notStarted: tasks.filter(t => t.status === 'pending' || t.status === 'not_started').length,
                    activeProjects: tasks.filter(t => t.taskType === 'project_task' && t.status !== 'completed').length
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
                        follow_up: leadData.statusDist?.follow_up || 0,
                        converted: leadData.convertedLeads || 0,
                        not_interested: leadData.statusDist?.not_interested || 0,
                        followUpsToday: leadData.followUpsToday || 0,
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
                {/* Top Section -> Welcome & Calendar */}
                <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                    {/* Left -> Welcome & Stats Grid */}
                    <div className="lg:w-2/3 flex flex-col gap-6">
                        {/* Welcome Card */}
                        <div className="bg-[#FDF8F3] rounded-3xl border border-[#EBD9C1] p-6 text-[#3E2723] relative overflow-hidden flex flex-col justify-center min-h-[160px]">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold mb-1">
                                    Welcome back, {user?.name?.split(' ')[0]}
                                </h2>
                                <p className="text-gray-600 text-sm font-medium">
                                    {isTeamLead 
                                        ? "Your team's performance is at " + (teamLeadStats.performance || 0) + "% today." 
                                        : "You have " + (taskStats.inProgress || 0) + " tasks in progress."}
                                </p>
                                <div className="mt-4 flex gap-3">
                                    <button onClick={() => navigate('/leads')} className="px-4 py-2 bg-[#3E2723] text-white rounded-xl font-bold text-xs hover:bg-[#5D4037] transition-all flex items-center gap-1.5">
                                        <Plus className="w-3.5 h-3.5" /> New Lead
                                    </button>
                                    <button onClick={() => navigate('/tasks')} className="px-4 py-2 bg-white border border-[#EBD9C1] text-[#3E2723] rounded-xl font-bold text-xs hover:bg-gray-50 transition-all flex items-center gap-1.5">
                                        <ListTodo className="w-3.5 h-3.5" /> My Tasks
                                    </button>
                                </div>
                            </div>
                            <Activity className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-[#3E2723] opacity-[0.03] rotate-12" />
                        </div>

                        {/* 3x2 Stats Grid Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Assigned Tasks', value: taskStats.total || 0, sub: 'My queue', icon: ListTodo, color: '#3b82f6' },
                                { label: 'Active Projects', value: taskStats.activeProjects || 0, sub: 'In progress', icon: Folder, color: '#6366f1' },
                                { label: 'Assigned Leads', value: leadStats.total || 0, sub: 'Pipeline', icon: Users, color: '#f59e0b' },
                                { label: 'Leads Converted', value: leadStats.converted || 0, sub: 'Won leads', icon: Trophy, color: '#10b981' },
                                { label: 'Overdue Tasks', value: taskStats.overdue || 0, sub: 'Needs action', icon: AlertCircle, color: '#ef4444' },
                                { label: 'Team Performance', value: `${teamLeadStats.performance || 0}%`, sub: 'Average %', icon: TrendingUp, color: '#3E2723' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: stat.color }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400">
                                            <stat.icon size={16} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                        <div className="flex items-baseline gap-1.5">
                                            <h4 className="text-xl font-black text-gray-900 leading-none">{stat.value}</h4>
                                            <span className="text-[9px] font-medium text-gray-400">{stat.sub}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right -> Calendar Section */}
                    <div className="lg:w-1/3">
                        <div className="bg-white rounded-3xl border border-gray-200 p-6 h-full shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[#3E2723]" />
                                    Schedule Overview
                                </h3>
                                <button onClick={() => navigate('/calendar')} className="text-[10px] font-bold text-[#3E2723] uppercase hover:underline">Full View</button>
                            </div>
                            
                            <div className="flex-1 dashboard-calendar-container">
                                <style>{`
                                    .dashboard-calendar-container .fc {
                                        font-family: inherit;
                                        --fc-border-color: #f3f4f6;
                                        --fc-daygrid-event-dot-width: 4px;
                                        font-size: 0.65rem;
                                        background: white;
                                    }
                                    .dashboard-calendar-container .fc-header-toolbar {
                                        margin-bottom: 0.5rem !important;
                                        padding: 0 0.5rem;
                                    }
                                    .dashboard-calendar-container .fc-toolbar-title {
                                        font-size: 0.85rem !important;
                                        font-weight: 800;
                                        color: #3E2723;
                                        text-transform: uppercase;
                                        letter-spacing: 0.05em;
                                    }
                                    .dashboard-calendar-container .fc-button {
                                        padding: 0.15rem 0.4rem !important;
                                        font-size: 0.6rem !important;
                                        border-radius: 6px !important;
                                        background-color: #FDF8F3 !important;
                                        border: 1px solid #EBD9C1 !important;
                                        color: #3E2723 !important;
                                        box-shadow: none !important;
                                    }
                                    .dashboard-calendar-container .fc-button:hover {
                                        background-color: #EBD9C1 !important;
                                    }
                                    .dashboard-calendar-container .fc-button-active {
                                        background-color: #3E2723 !important;
                                        color: white !important;
                                    }
                                    .dashboard-calendar-container .fc-col-header-cell {
                                        padding: 4px 0 !important;
                                        background: #f9fafb;
                                    }
                                    .dashboard-calendar-container .fc-col-header-cell-cushion {
                                        font-size: 0.6rem;
                                        font-weight: 700;
                                        color: #9ca3af;
                                        text-transform: uppercase;
                                    }
                                    .dashboard-calendar-container .fc-daygrid-day-number {
                                        padding: 2px 4px !important;
                                        font-weight: 700;
                                        color: #374151;
                                        position: relative;
                                        z-index: 2;
                                    }
                                    .dashboard-calendar-container .fc-daygrid-day {
                                        height: 40px !important;
                                        transition: all 0.2s;
                                    }
                                    .dashboard-calendar-container .fc-day-today {
                                        background-color: transparent !important;
                                    }
                                    .dashboard-calendar-container .fc-day-today .fc-daygrid-day-number {
                                        background: #3E2723;
                                        color: white;
                                        border-radius: 4px;
                                        min-width: 1.2rem;
                                        text-align: center;
                                    }
                                    /* Hide event list in mini view */
                                    .dashboard-calendar-container .fc-daygrid-day-events {
                                        display: none;
                                    }
                                    /* Colored backgrounds for days with events */
                                    .has-event-upcoming { background-color: rgba(37, 99, 235, 0.15) !important; }
                                    .has-event-ongoing { background-color: rgba(147, 51, 234, 0.15) !important; }
                                    .has-event-completed { background-color: rgba(22, 163, 74, 0.15) !important; }
                                    .has-event-missed { background-color: rgba(220, 38, 38, 0.15) !important; }
                                    .has-event-rescheduled { background-color: rgba(156, 163, 175, 0.2) !important; }
                                    .has-event-default { background-color: rgba(62, 39, 35, 0.1) !important; }
                                    
                                    .dashboard-calendar-container .fc-daygrid-day:hover {
                                        filter: brightness(0.95);
                                        cursor: pointer;
                                    }
                                `}</style>
                                <FullCalendar
                                    plugins={[dayGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    headerToolbar={{
                                        left: 'prev,next',
                                        center: 'title',
                                        right: 'today'
                                    }}
                                    events={calendarEvents}
                                    height="auto"
                                    eventClick={(arg) => navigate('/calendar')}
                                    dayMaxEvents={0}
                                    dayCellDidMount={(arg) => {
                                        const dateStr = arg.date.toISOString().split('T')[0];
                                        const dayEvents = calendarEvents.filter(e => e.start.split('T')[0] === dateStr);
                                        if (dayEvents.length > 0) {
                                            const status = dayEvents[0].extendedProps?.status || 'default';
                                            arg.el.classList.add(`has-event-${status}`);
                                        }
                                    }}
                                />
                            </div>
                            
                            {/* Quick Stats below calendar */}
                            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {teamMembers.slice(0, 3).map((m, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                            {m.name?.charAt(0)}
                                        </div>
                                    ))}
                                    {teamMembers.length > 3 && (
                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                            +{teamMembers.length - 3}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today's Load</p>
                                    <p className="text-sm font-bold text-[#3E2723]">{todayMeetings.length} Meetings</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Project Progress Line Chart */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Project Progress
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={myTasks.filter(t => t.taskType === 'project_task').slice(0, 8)}>
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="title" fontSize={10} tick={{ fill: '#999' }} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={10} tick={{ fill: '#999' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)', fontSize: '12px' }}
                                        formatter={(value) => [`${value}%`, 'Progress']}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="progressPercentage" 
                                        stroke="#6366f1" 
                                        strokeWidth={2.5} 
                                        fill="url(#progressGradient)" 
                                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                </AreaChart>
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
                                    <p className="text-xs font-medium text-gray-400">Not Interested</p>
                                    <p className="text-xl font-semibold text-red-500">{leadStats.not_interested || 0}</p>
                                </div>
                                <button onClick={() => navigate('/leads')} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all">Full CRM</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allLeads.filter(l => l.assignedTo?._id === user._id || !l.assignedTo).slice(0, 4).map(lead => (
                                <div key={lead._id} className="p-4 rounded-3xl border border-gray-100 hover:shadow-xl transition-all bg-white group border-l-4" style={{ borderColor: lead.status === 'converted' ? '#10b981' : lead.status === 'not_interested' ? '#ef4444' : '#6366f1' }}>
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

