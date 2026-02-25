import {
    ClipboardList, Plus, Calendar, Clock, AlertCircle, CheckCircle,
    X, Search, Edit, Trash2, RefreshCw, Eye, MoreVertical,
    FileText, MessageSquare, Target, TrendingUp, Award, Activity, Users, Filter
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { adminTasksAPI } from '../services/adminApi';
import api from '../services/api';
import Layout from '../components/Layout';

const AdminTaskManagement = () => {
    const [tasks, setTasks] = useState([]);
    const [teamLeads, setTeamLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'development',
        priority: 'medium',
        teamLeadId: '',
        taskType: 'one_time',
        startDate: '',
        dueDate: '',
        estimatedEffort: '',
        estimatedEffortUnit: 'hours',
        deadlineType: 'soft',
        notes: ''
    });

    const getInitials = (name) => {
        if (!name) return "U";
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

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

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksRes, leadsRes] = await Promise.all([
                adminTasksAPI.getAll(),
                adminTasksAPI.getTeamLeads()
            ]);
            setTasks(tasksRes.data.data || []);
            setTeamLeads(leadsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = () => {
        const today = new Date().toISOString().split('T')[0];
        setFormData({
            title: '',
            description: '',
            category: 'development',
            priority: 'medium',
            teamLeadId: '',
            taskType: 'one_time',
            startDate: today,
            dueDate: '',
            estimatedEffort: '',
            estimatedEffortUnit: 'hours',
            deadlineType: 'soft',
            notes: ''
        });
        setShowCreateModal(true);
    };

    const handleViewTask = (task) => {
        setSelectedTask(task);
        setShowViewModal(true);
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            category: task.category,
            priority: task.priority,
            teamLeadId: task.assignedTo?._id || '',
            taskType: task.taskType,
            startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            estimatedEffort: task.estimatedEffort || '',
            estimatedEffortUnit: task.estimatedEffortUnit || 'hours',
            deadlineType: task.deadlineType || 'soft',
            notes: task.notes || ''
        });
        setShowEditModal(true);
    };

    const handleReassignTask = (task) => {
        setSelectedTask(task);
        setFormData({ ...formData, teamLeadId: task.assignedTo?._id || '' });
        setShowReassignModal(true);
    };

    const handleCancelTask = (task) => {
        setSelectedTask(task);
        setCancelReason('');
        setShowCancelModal(true);
    };

    const handleSubmitCreate = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.dueDate || !formData.teamLeadId) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await adminTasksAPI.assignToTeamLead(formData);
            alert('✅ Task assigned successfully!');
            setShowCreateModal(false);
            fetchData();
        } catch (error) {
            console.error('Error creating task:', error);
            alert('❌ ' + (error.response?.data?.message || 'Failed to create task'));
        }
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/tasks/${selectedTask._id}`, formData);
            alert('✅ Task updated successfully!');
            setShowEditModal(false);
            fetchData();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('❌ Failed to update task');
        }
    };

    const handleSubmitReassign = async (e) => {
        e.preventDefault();
        if (!formData.teamLeadId) {
            alert('Please select a team lead');
            return;
        }

        try {
            await api.put(`/admin/tasks/${selectedTask._id}/reassign`, {
                newTeamLeadId: formData.teamLeadId
            });
            alert('✅ Task reassigned successfully!');
            setShowReassignModal(false);
            fetchData();
        } catch (error) {
            console.error('Error reassigning task:', error);
            alert('❌ Failed to reassign task');
        }
    };

    const handleSubmitCancel = async (e) => {
        e.preventDefault();
        if (!cancelReason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }

        try {
            await api.put(`/admin/tasks/${selectedTask._id}/cancel`, {
                reason: cancelReason
            });
            alert('✅ Task cancelled successfully!');
            setShowCancelModal(false);
            fetchData();
        } catch (error) {
            console.error('Error cancelling task:', error);
            alert('❌ Failed to cancel task');
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-50 text-green-600 border-green-100';
            case 'in_progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'cancelled': return 'bg-gray-50 text-gray-400 border-gray-100';
            case 'not_started': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return 'bg-red-50 text-red-600 border-red-100';
            case 'high': return 'bg-[#FAF7F2] text-[#3E2723] border-[#EFEBE9]';
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'low': return 'bg-green-50 text-green-600 border-green-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'development': return '💻';
            case 'testing': return '🧪';
            case 'research': return '🔬';
            case 'design': return '🎨';
            case 'documentation': return '📝';
            case 'meeting': return '👥';
            case 'review': return '👀';
            case 'deployment': return '🚀';
            case 'maintenance': return '🔧';
            default: return '📋';
        }
    };

    if (loading) {
        return (
            <Layout title="Task Management">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3E2723] mx-auto"></div>
                        <p className="mt-4 text-[#3E2723] font-bold uppercase tracking-[0.2em] text-xs">Syncing Tasks...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <>
            <Layout title="Task Management">
                <div className="max-w-[1600px] mx-auto px-4 lg:px-10 py-8 space-y-10 bg-[#FAF9F8]">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-gray-100 pb-4">
                        <div className="space-y-0.5">
                            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Dashboard</h2>
                            <h1 className="text-2xl font-black text-[#1D1110] tracking-tight">Task Management</h1>
                            <p className="text-gray-500 font-medium text-xs">Assign and manage tasks for your team Leads.</p>
                        </div>
                        <button
                            onClick={handleCreateTask}
                            className="flex items-center justify-center gap-3 px-8 py-4 bg-[#3E2723] text-white rounded-2xl hover:bg-[#5D4037] transition-all shadow-xl hover:shadow-2xl font-bold text-sm tracking-widest uppercase group"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            Assign New Task
                        </button>
                    </div>

                    {/* Stats KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {[
                            { label: 'Total Tasks', value: tasks.length, icon: ClipboardList, color: 'bg-blue-500', trend: '+12.5%' },
                            { label: 'Pending', value: tasks.filter(t => t.status === 'not_started').length, icon: Clock, color: 'bg-amber-500', trend: 'Active' },
                            { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, icon: Activity, color: 'bg-indigo-500', trend: 'High' },
                            { label: 'Completed', value: tasks.filter(t => t.status === 'completed').length, icon: CheckCircle, color: 'bg-green-500', trend: '94%' },
                            { label: 'Overdue', value: tasks.filter(t => t.isOverdue).length, icon: AlertCircle, color: 'bg-red-500', trend: '-2.4%' }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-[#3E2723]/10 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className={`p-3 rounded-2xl ${stat.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                                        <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                                    </div>
                                    <div className="px-2 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{stat.trend}</div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                    <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter mt-1">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters & Search Row */}
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div className="relative group w-full md:w-[450px]">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#3E2723] transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by title, description or lead..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all text-sm font-bold text-[#1D1110] placeholder-gray-400"
                            />
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="appearance-none flex items-center justify-center gap-3 px-8 py-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all text-xs font-bold text-gray-500 uppercase tracking-[0.2em] outline-none pr-14 cursor-pointer"
                                >
                                    <option value="all">All Status</option>
                                    <option value="not_started">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <Filter className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                            </div>

                            <div className="relative">
                                <select
                                    value={filterPriority}
                                    onChange={(e) => setFilterPriority(e.target.value)}
                                    className="appearance-none flex items-center justify-center gap-3 px-8 py-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all text-xs font-bold text-gray-500 uppercase tracking-[0.2em] outline-none pr-14 cursor-pointer"
                                >
                                    <option value="all">All Priority</option>
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                                <Target className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Tasks Grid */}
                    {filteredTasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredTasks.map(task => (
                                <div 
                                    key={task._id} 
                                    onClick={() => handleViewTask(task)}
                                    className="group bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer overflow-hidden transform hover:-translate-y-2"
                                >
                                    <div className="p-8 space-y-6">
                                        {/* CARD HEADER */}
                                        <div className="flex items-start justify-between relative">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{getCategoryIcon(task.category)}</span>
                                                    <h3 className="text-lg font-bold text-[#1D1110] tracking-tight group-hover:underline decoration-2 underline-offset-4 line-clamp-1">
                                                        {task.title}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {task.category || 'General Task'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="relative" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === task._id ? null : task._id)}
                                                        className="p-2 text-gray-400 hover:text-[#1D1110] hover:bg-gray-100 rounded-full transition-all"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>

                                                    {openMenuId === task._id && (
                                                        <div 
                                                            ref={menuRef}
                                                            className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200"
                                                        >
                                                            <button
                                                                onClick={() => { handleViewTask(task); setOpenMenuId(null); }}
                                                                className="w-full px-4 py-3 text-left text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4 text-gray-400" />
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={() => { handleEditTask(task); setOpenMenuId(null); }}
                                                                className="w-full px-4 py-3 text-left text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                                            >
                                                                <Edit className="w-4 h-4 text-gray-400" />
                                                                Edit Task
                                                            </button>
                                                            <button
                                                                onClick={() => { handleReassignTask(task); setOpenMenuId(null); }}
                                                                className="w-full px-4 py-3 text-left text-xs font-bold text-[#3E2723] hover:bg-[#3E2723]/5 flex items-center gap-3 transition-colors"
                                                            >
                                                                <RefreshCw className="w-4 h-4 text-[#3E2723]/50" />
                                                                Reassign Task
                                                            </button>
                                                            <div className="h-px bg-gray-100 my-1 mx-2"></div>
                                                            {task.status !== 'cancelled' && task.status !== 'completed' && (
                                                                <button
                                                                    onClick={() => { handleCancelTask(task); setOpenMenuId(null); }}
                                                                    className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                    Cancel Task
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ASSIGNEE & PRIORITY */}
                                        <div className="flex items-center justify-between py-4 border-y border-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#3E2723] flex items-center justify-center text-white text-xs font-black shadow-inner">
                                                    {getInitials(task.assignedTo?.name)}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned To</p>
                                                    <p className="text-xs font-black text-[#1D1110]">{task.assignedTo?.name || 'Unassigned'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority || 'Normal'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* PROGRESS & STATUS */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        {new Date(task.dueDate || task.deadline).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(task.status)}`}>
                                                    {task.status?.replace('_', ' ') || 'Pending'}
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task Progress</p>
                                                    <span className="text-xs font-black text-[#1D1110]">{task.progressPercentage || 0}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5 shadow-inner">
                                                    <div 
                                                        className="h-full bg-green-500 rounded-full transition-all duration-1000"
                                                        style={{ width: `${task.progressPercentage || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100 shadow-sm">
                            <ClipboardList className="mx-auto h-20 w-20 text-gray-200 mb-6" />
                            <h3 className="text-2xl font-black text-[#1D1110] mb-2">No Active Tasks</h3>
                            <p className="text-gray-400 font-medium mb-8">Create your first task to start monitoring.</p>
                            <button
                                onClick={handleCreateTask}
                                className="inline-flex items-center gap-3 px-10 py-4 bg-[#1D1110] text-white rounded-[1.5rem] hover:bg-black transition-all font-bold text-sm tracking-widest uppercase shadow-xl"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Task
                            </button>
                        </div>
                    )}
                </div>
            </Layout>

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-[2.5rem] max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#3E2723] to-[#5D4037] px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                        <Plus className="w-5 h-5" /> Assign Task
                                    </h3>
                                    <p className="text-[#D7CCC8] text-[8px] font-bold uppercase tracking-widest">Task Creation</p>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="text-white hover:bg-white/10 rounded-lg p-1 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitCreate} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Task Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110]"
                                        placeholder="Enter task title..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Lead Agent</label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={formData.teamLeadId}
                                                onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110] appearance-none"
                                            >
                                                <option value="">Select Team Lead</option>
                                                {teamLeads.map(lead => (
                                                    <option key={lead._id} value={lead._id}>{lead.name}</option>
                                                ))}
                                            </select>
                                            <Users className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Priority Level</label>
                                        <div className="relative">
                                            <select
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110] appearance-none"
                                            >
                                                <option value="low">Low Priority</option>
                                                <option value="medium">Medium Priority</option>
                                                <option value="high">High Priority</option>
                                                <option value="critical">Critical Mission</option>
                                            </select>
                                            <Target className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Deployment Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                required
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110]"
                                            />
                                            <Calendar className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Deadline Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                required
                                                value={formData.dueDate}
                                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110]"
                                            />
                                            <Clock className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Task Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110] min-h-[120px]"
                                        placeholder="Detailed task description..."
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 transition-all font-bold text-sm tracking-widest uppercase"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-8 py-4 bg-[#3E2723] text-white rounded-2xl hover:bg-[#5D4037] transition-all shadow-xl hover:shadow-2xl font-bold text-sm tracking-widest uppercase"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Task Modal */}
            {showViewModal && selectedTask && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]" onClick={() => setShowViewModal(false)}>
                    <div className="bg-white rounded-[2.5rem] max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-[#3E2723] px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                        <FileText className="w-5 h-5" /> Task Details
                                    </h3>
                                    <p className="text-[#D7CCC8] text-[8px] font-bold uppercase tracking-widest">Status: {selectedTask.status?.replace('_', ' ')}</p>
                                </div>
                                <button onClick={() => setShowViewModal(false)} className="text-white hover:bg-white/10 rounded-lg p-1 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-[#3E2723] flex items-center justify-center text-white text-lg font-black shadow-inner">
                                        {getInitials(selectedTask.assignedTo?.name)}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Assigned To</p>
                                        <h4 className="text-lg font-black text-[#1D1110]">{selectedTask.assignedTo?.name}</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(selectedTask.priority)}`}>
                                        {selectedTask.priority} Priority
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-3xl font-black text-[#1D1110] tracking-tight">{selectedTask.title}</h2>
                                    <p className="mt-4 text-gray-500 font-medium leading-relaxed">{selectedTask.description || 'No specific parameters provided for this operation.'}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-8 py-6 border-y border-gray-50">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-[#3E2723]" /> Start Date
                                        </p>
                                        <p className="text-sm font-black text-[#1D1110]">{new Date(selectedTask.startDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-end gap-2">
                                            Due Date <Clock className="w-4 h-4 text-[#3E2723]" />
                                        </p>
                                        <p className="text-sm font-black text-[#1D1110]">{new Date(selectedTask.dueDate || selectedTask.deadline).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task Progress</p>
                                        <span className="text-sm font-black text-[#1D1110]">{selectedTask.progressPercentage || 0}%</span>
                                    </div>
                                    <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-1 shadow-inner">
                                        <div 
                                            className="h-full bg-green-500 rounded-full transition-all duration-1000 shadow-sm shadow-green-200"
                                            style={{ width: `${selectedTask.progressPercentage || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    onClick={() => { handleEditTask(selectedTask); setShowViewModal(false); }}
                                    className="flex-1 px-8 py-4 bg-[#3E2723] text-white rounded-2xl hover:bg-[#5D4037] transition-all font-bold text-sm tracking-widest uppercase shadow-xl"
                                >
                                    Edit Task
                                </button>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 transition-all font-bold text-sm tracking-widest uppercase"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {showEditModal && selectedTask && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white rounded-[2.5rem] max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#3E2723] to-[#5D4037] px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                        <Edit className="w-5 h-5" /> Edit Task
                                    </h3>
                                    <p className="text-[#D7CCC8] text-[8px] font-bold uppercase tracking-widest">Task: {selectedTask.title}</p>
                                </div>
                                <button onClick={() => setShowEditModal(false)} className="text-white hover:bg-white/10 rounded-lg p-1 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitEdit} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Task Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Lead Agent</label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={formData.teamLeadId}
                                                onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110] appearance-none"
                                            >
                                                <option value="">Select Team Lead</option>
                                                {teamLeads.map(lead => (
                                                    <option key={lead._id} value={lead._id}>{lead.name}</option>
                                                ))}
                                            </select>
                                            <Users className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Intel Category</label>
                                        <div className="relative">
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110] appearance-none"
                                            >
                                                <option value="development">Development</option>
                                                <option value="testing">Testing</option>
                                                <option value="research">Research</option>
                                                <option value="design">Design</option>
                                                <option value="documentation">Documentation</option>
                                                <option value="meeting">Meeting</option>
                                                <option value="review">Review</option>
                                                <option value="deployment">Deployment</option>
                                                <option value="maintenance">Maintenance</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <Target className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Priority Level</label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110]"
                                        >
                                            <option value="low">Low Priority</option>
                                            <option value="medium">Medium Priority</option>
                                            <option value="high">High Priority</option>
                                            <option value="critical">Critical Mission</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110]"
                                        >
                                            <option value="not_started">Pending</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Start Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Due Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Intel Brief</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110] min-h-[120px]"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 transition-all font-bold text-sm tracking-widest uppercase"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-8 py-4 bg-[#3E2723] text-white rounded-2xl hover:bg-[#5D4037] transition-all shadow-xl hover:shadow-2xl font-bold text-sm tracking-widest uppercase"
                                >
                                    Update Operation Intel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reassign Task Modal */}
            {showReassignModal && selectedTask && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]" onClick={() => setShowReassignModal(false)}>
                    <div className="bg-white rounded-[2.5rem] max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-[#3E2723] px-10 py-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                        <RefreshCw className="w-8 h-8" /> Reassign Unit
                                    </h3>
                                    <p className="text-[#D7CCC8] text-xs font-bold uppercase tracking-widest">Shifting Command Responsibility</p>
                                </div>
                                <button onClick={() => setShowReassignModal(false)} className="text-white hover:bg-white/10 rounded-2xl p-2 transition-all">
                                    <X className="w-8 h-8" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitReassign} className="p-10 space-y-8">
                            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Selected Objective</p>
                                <h4 className="text-lg font-black text-[#1D1110]">{selectedTask.title}</h4>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">New Lead Agent</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.teamLeadId}
                                        onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#3E2723]/30 focus:ring-4 focus:ring-[#3E2723]/5 outline-none transition-all font-bold text-[#1D1110] appearance-none"
                                    >
                                        <option value="">Select Command Lead</option>
                                        {teamLeads.map(lead => (
                                            <option key={lead._id} value={lead._id}>{lead.name}</option>
                                        ))}
                                    </select>
                                    <Users className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReassignModal(false)}
                                    className="flex-1 px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 transition-all font-bold text-sm tracking-widest uppercase"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-8 py-4 bg-[#3E2723] text-white rounded-2xl hover:bg-[#5D4037] transition-all font-bold text-sm tracking-widest uppercase shadow-xl"
                                >
                                    Confirm Shift
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cancel Task Modal */}
            {showCancelModal && selectedTask && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]" onClick={() => setShowCancelModal(false)}>
                    <div className="bg-white rounded-[2.5rem] max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-red-600 px-10 py-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                        <AlertCircle className="w-8 h-8" /> Abort Mission
                                    </h3>
                                    <p className="text-red-100 text-xs font-bold uppercase tracking-widest">Irreversible Command Action</p>
                                </div>
                                <button onClick={() => setShowCancelModal(false)} className="text-white hover:bg-white/10 rounded-2xl p-2 transition-all">
                                    <X className="w-8 h-8" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitCancel} className="p-10 space-y-8">
                            <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100">
                                <p className="text-red-600 font-bold text-sm leading-relaxed text-center">
                                    Are you certain you wish to terminate <span className="font-black">"{selectedTask.title}"</span>? All progress intel will be archived.
                                </p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Reason for Abort</label>
                                <textarea
                                    required
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-red-500/30 focus:ring-4 focus:ring-red-500/5 outline-none transition-all font-bold text-[#1D1110] min-h-[100px]"
                                    placeholder="Enter authorization justification..."
                                />
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 transition-all font-bold text-sm tracking-widest uppercase"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-8 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-bold text-sm tracking-widest uppercase shadow-xl"
                                >
                                    Execute Abort
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </>
    );
};

export default AdminTaskManagement;

