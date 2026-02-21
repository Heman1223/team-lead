import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Clock, Plus, MessageSquare, Paperclip, Activity, 
    Trash2, CheckCircle2, Calendar, User, Send, 
    ExternalLink, ListTodo, ClipboardList, TrendingUp, 
    AlertTriangle, ChevronRight, Search, Target, Users, Filter,
    MoreVertical, Eye, Edit, Briefcase, ChevronDown, BookOpen, X, Award
} from 'lucide-react';
import { tasksAPI, usersAPI, activitiesAPI, teamsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
// import './TaskManagement.css';

const TaskManagement = () => {
    const { isTeamLead, user } = useAuth();
    const [searchParams] = useSearchParams();
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filter, setFilter] = useState({
        status: searchParams.get('status') || 'all',
        priority: 'all'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        detailedDescription: '',
        clientRequirements: '',
        projectScope: '',
        priority: 'medium',
        deadline: '',
        assignedTo: '',
        notes: ''
    });
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [uploadingFile, setUploadingFile] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkData, setLinkData] = useState({ title: '', url: '' });
    
    // Subtask management state
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);
    const [subtaskFormData, setSubtaskFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        deadline: ''
    });
    const [subtaskComment, setSubtaskComment] = useState({}); // { subtaskId: 'content' }
    const [taskActivities, setTaskActivities] = useState([]);
    const [submittingSubtask, setSubmittingSubtask] = useState(false);
    
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const taskId = searchParams.get('id');
        if (taskId && tasks.length > 0) {
            const task = tasks.find(t => t._id === taskId);
            if (task) {
                setSelectedTask(task);
                setShowDetailModal(true);
            }
        }
    }, [searchParams, tasks]);

    const fetchTaskDetails = async (taskId) => {
        try {
            const [taskRes, activityRes] = await Promise.all([
                tasksAPI.getOne(taskId),
                activitiesAPI.getForTask(taskId)
            ]);
            setSelectedTask(taskRes.data.data);
            setTaskActivities(activityRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch task details:', err);
        }
    };

    const handleSubtaskStatusChange = async (taskId, subtaskId, newStatus) => {
        try {
            const updateData = { status: newStatus };
            if (['pending', 'in_progress', 'completed'].includes(newStatus)) {
                updateData.progressPercentage = newStatus === 'completed' ? 100 : (newStatus === 'in_progress' ? 50 : 0);
            }

            await tasksAPI.updateSubtask(taskId, subtaskId, updateData);
            fetchData();
            if (showDetailModal && selectedTask?._id === taskId) {
                fetchTaskDetails(taskId);
            }
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleTaskStatusChange = async (taskId, newStatus) => {
        try {
            const updateData = { status: newStatus };
            // Simple mapping for core statuses, but avoid resetting progress for on_hold/blocked
            if (['pending', 'in_progress', 'completed'].includes(newStatus)) {
                updateData.progressPercentage = newStatus === 'completed' ? 100 : (newStatus === 'in_progress' ? 50 : 0);
            }
            
            await tasksAPI.update(taskId, updateData);
            fetchData();
            if (showDetailModal && selectedTask?._id === taskId) {
                fetchTaskDetails(taskId);
            }
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleAddSubtask = async (e) => {
        e.preventDefault();
        setSubmittingSubtask(true);
        try {
            await tasksAPI.addSubtask(selectedTask._id, subtaskFormData);
            await fetchTaskDetails(selectedTask._id);
            setShowSubtaskForm(false);
            setSubtaskFormData({
                title: '',
                description: '',
                assignedTo: '',
                deadline: ''
            });
        } catch (err) {
            alert('Failed to add subtask: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmittingSubtask(false);
        }
    };

    const handleAddSubtaskComment = async (subtaskId) => {
        const content = subtaskComment[subtaskId];
        if (!content?.trim()) return;

        try {
            await tasksAPI.addSubtaskComment(selectedTask._id, subtaskId, content);
            setSubtaskComment({ ...subtaskComment, [subtaskId]: '' });
            await fetchTaskDetails(selectedTask._id);
        } catch (err) {
            alert('Failed to add comment to subtask');
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            
            if (isTeamLead) {
                const membersList = [];
                const memberIds = new Set();
                // Team leads see all tasks and their managed teams
                const [tasksRes, leadTeamsRes] = await Promise.all([
                    tasksAPI.getAll(),
                    teamsAPI.getLedTeams()
                ]);
                setTasks(tasksRes.data.data);
                
                const leadTeams = leadTeamsRes.data.data || [];
                setTeams(leadTeams);
                
                // Extract unique members from all managed teams for general task assignment
                leadTeams.forEach(team => {
                    team.members.forEach(member => {
                        if (member.role === 'team_member' && !memberIds.has(member._id)) {
                            memberIds.add(member._id);
                            membersList.push(member);
                        }
                    });
                });
                
                setMembers(membersList);
            } else {
                // Team members see parent tasks that have subtasks assigned to them
                const tasksRes = await tasksAPI.getMyTasks();
                const allTasks = tasksRes.data.data || [];
                
                setTasks(allTasks);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (selectedTask && !showDetailModal) {
                await tasksAPI.update(selectedTask._id, formData);
            } else {
                await tasksAPI.create(formData);
            }
            setShowModal(false);
            setSelectedTask(null);
            resetForm();
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save task');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await tasksAPI.update(taskId, { status: newStatus });
            fetchData();
            if (selectedTask?._id === taskId) {
                const updated = await tasksAPI.getOne(taskId);
                setSelectedTask(updated.data.data);
            }
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleAddComment = async () => {
        if (!comment.trim()) return;
        try {
            await tasksAPI.addComment(selectedTask._id, comment);
            setComment('');
            await fetchTaskDetails(selectedTask._id);
        } catch (err) {
            alert('Failed to add comment');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await tasksAPI.delete(id);
            setShowDetailModal(false);
            setSelectedTask(null);
            fetchData();
        } catch (err) {
            alert('Failed to delete task');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedTask) return;

        // Check file size (max 5MB for base64)
        if (file.size > 5 * 1024 * 1024) {
            alert('❌ File size too large. Max 5MB allowed for direct upload.');
            return;
        }

        setUploadingFile(true);
        try {
            const base64String = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            await tasksAPI.uploadAttachment(selectedTask._id, {
                fileName: file.name,
                fileUrl: base64String,
                fileType: file.type,
                fileSize: file.size,
                originalName: file.name
            });

            const updated = await tasksAPI.getOne(selectedTask._id);
            setSelectedTask(updated.data.data);
            alert('✅ File uploaded successfully');
        } catch (err) {
            console.error('Upload Error:', err);
            alert('❌ Failed to upload file: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploadingFile(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!confirm('Are you sure you want to delete this attachment?')) return;
        try {
            await tasksAPI.deleteAttachment(selectedTask._id, attachmentId);
            const updated = await tasksAPI.getOne(selectedTask._id);
            setSelectedTask(updated.data.data);
        } catch (err) {
            alert('Failed to delete attachment');
        }
    };

    const handleAddLink = async (e) => {
        e.preventDefault();
        try {
            await tasksAPI.uploadAttachment(selectedTask._id, {
                fileName: linkData.title,
                fileUrl: linkData.url,
                fileType: 'link',
                isExternalLink: true
            });
            const updated = await tasksAPI.getOne(selectedTask._id);
            setSelectedTask(updated.data.data);
            setShowLinkModal(false);
            setLinkData({ title: '', url: '' });
        } catch (err) {
            alert('Failed to add link');
        }
    };



    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            detailedDescription: '',
            clientRequirements: '',
            projectScope: '',
            priority: 'medium',
            deadline: '',
            assignedTo: '',
            notes: ''
        });
        setActiveTab('overview');
    };

    const openEditModal = (task) => {
        setSelectedTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            detailedDescription: task.detailedDescription || '',
            clientRequirements: task.clientRequirements || '',
            projectScope: task.projectScope || '',
            priority: task.priority,
            deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
            assignedTo: task.assignedTo?._id || '',
            notes: task.notes || ''
        });
        setShowDetailModal(false);
        setShowModal(true);
        setActiveTab('overview');
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filter.status === 'all' || task.status === filter.status;
        const matchesPriority = filter.priority === 'all' || task.priority === filter.priority;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const statusColors = {
        assigned: 'info',
        in_progress: 'primary',
        overdue: 'error',
        completed: 'success'
    };

    const priorityColors = {
        high: 'error',
        medium: 'warning',
        low: 'success'
    };

    const getTaskProgress = (task) => {
        if (!task) return 0;
        if (task.subtasks && task.subtasks.length > 0) {
            const totalProgress = task.subtasks.reduce((sum, st) => sum + (st.progressPercentage || 0), 0);
            return Math.round(totalProgress / task.subtasks.length);
        }
        return task.progressPercentage || 0;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-50 text-green-600 border-green-100';
            case 'in_progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'on_hold': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'blocked': return 'bg-red-50 text-red-600 border-red-100';
            case 'overdue': return 'bg-red-50 text-red-600 border-red-100';
            case 'pending': return 'bg-gray-50 text-gray-400 border-gray-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'development': return <Briefcase className="w-4 h-4" />;
            case 'testing': return <ClipboardList className="w-4 h-4" />;
            case 'research': return <Search className="w-4 h-4" />;
            case 'design': return <Target className="w-4 h-4" />;
            case 'documentation': return <FileText className="w-4 h-4" />;
            case 'marketing': return <TrendingUp className="w-4 h-4" />;
            case 'meeting': return <Users className="w-4 h-4" />;
            default: return <ClipboardList className="w-4 h-4" />;
        }
    };

    const getInitials = (name) => {
        if (!name) return "?";
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
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

    return (
        <Layout title="Task Management">
            <div className="max-w-[1600px] mx-auto px-4 lg:px-10 py-8 space-y-8 bg-[#FAF9F8]">
                {/* KPI METRICS ROW (MATCHING ADMIN PANEL) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* KPI: TOTAL MISSIONS */}
                    <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                    Total Tasks
                                </p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">
                                        {tasks.length}
                                    </h3>
                                    <span className="text-[10px] font-bold text-green-500 tracking-tighter">
                                        Active
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                <Target className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* KPI: OPERATIONAL YIELD */}
                    <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                    Completion Rate
                                </p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">
                                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
                                    </h3>
                                    <span className="text-[10px] font-bold text-blue-500 tracking-tighter truncate">
                                        DONE
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* KPI: PENDING OBJECTIVES */}
                    <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                    Ongoing Tasks
                                </p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">
                                        {tasks.filter(t => t.status !== 'completed').length}
                                    </h3>
                                    <span className="text-[10px] font-bold text-amber-500 tracking-tighter truncate">
                                        ACTIVE
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* KPI: RISK FACTOR */}
                    <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                    Urgent Tasks
                                </p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-3xl font-black text-red-600 tracking-tighter">
                                        {tasks.filter(t => t.priority === 'critical' || new Date(t.deadline) < new Date()).length}
                                    </h3>
                                    <span className="text-[10px] font-bold text-red-500 tracking-tighter truncate">
                                        HIGH
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SEARCH & FILTER ROW (MATCHING ADMIN PANEL) */}
                <div className="flex flex-wrap lg:flex-nowrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-2 flex items-center group focus-within:ring-2 focus-within:ring-[#3E2723]/10 transition-all">
                        <div className="p-3">
                            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#3E2723] transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tasks, descriptions, or categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-[#3E2723] placeholder-gray-400 flex-1 px-2"
                        />
                    </div>
                    
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
                        <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-100 p-1 flex items-center flex-1 sm:flex-none sm:min-w-[170px]">
                            <select
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                className="w-full pl-5 pr-10 py-2.5 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-[#3E2723] appearance-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="on_hold">On Hold</option>
                                <option value="blocked">Blocked</option>
                            </select>
                            <div className="pr-4 pointer-events-none">
                                <Filter className="w-3 h-3 text-gray-400" />
                            </div>
                        </div>

                        <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-100 p-1 flex items-center flex-1 sm:flex-none sm:min-w-[170px]">
                            <select
                                value={filter.priority}
                                onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                                className="w-full pl-5 pr-10 py-2.5 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-[#3E2723] appearance-none cursor-pointer"
                            >
                                <option value="all">All Priority</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                            <div className="pr-4 pointer-events-none">
                                <Activity className="w-3 h-3 text-gray-400" />
                            </div>
                        </div>

                        {isTeamLead && (
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1D1110] text-white rounded-[1.25rem] hover:bg-[#3E2723] transition-all shadow-md hover:shadow-lg font-black text-[10px] uppercase tracking-widest whitespace-nowrap min-w-[140px]"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Task
                            </button>
                        )}
                    </div>
                </div>

                {/* MISSION GRID (ADMIN THEME) */}
                <div className="relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-16 h-16 border-4 border-[#3E2723]/20 border-t-[#3E2723] rounded-full animate-spin mb-4" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Loading Tasks...</p>
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="py-24 text-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className="p-8 bg-gray-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <ClipboardList className="w-12 h-12 text-gray-200" />
                            </div>
                            <h3 className="text-3xl font-black text-[#3E2723] mb-4 tracking-tighter uppercase">No Active Tasks</h3>
                            <p className="text-gray-400 font-medium max-w-md mx-auto leading-relaxed">There are currently no tasks that match your filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredTasks.map(task => (
                                <div 
                                    key={task._id} 
                                    onClick={() => { setSelectedTask(task); setShowDetailModal(true); }}
                                    className="group bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer overflow-hidden transform hover:-translate-y-2 flex flex-col"
                                >
                                    <div className="p-8 space-y-6 flex-1">
                                        {/* CARD HEADER */}
                                        <div className="flex items-start justify-between relative">
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold text-[#1D1110] tracking-tight group-hover:underline decoration-2 underline-offset-4 line-clamp-1" title={task.title}>
                                                    {task.title}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-gray-400">
                                                        <Briefcase className="w-4 h-4" />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {task.category || 'General Task'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-400 font-medium line-clamp-2 leading-relaxed h-10">
                                            {task.description}
                                        </p>

                                        {/* ASSIGNEE & PRIORITY */}
                                        <div className="flex items-center justify-between py-4 border-y border-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#3E2723] flex items-center justify-center text-white text-xs font-black shadow-inner">
                                                    {getInitials(task.assignedTo?.name || (isTeamLead ? user.name : 'Lead'))}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned To</p>
                                                    <p className="text-xs font-black text-[#1D1110]">{task.assignedTo?.name || 'Assigned Member'}</p>
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
                                                        {new Date(task.deadline).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(task.status)}`}>
                                                    {task.status?.replace('_', ' ') || 'Pending'}
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall Progress</p>
                                                    <span className="text-xs font-black text-[#1D1110]">{getTaskProgress(task)}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5 shadow-inner">
                                                    <div 
                                                        className="h-full bg-[#1D1110] rounded-full transition-all duration-1000"
                                                        style={{ width: `${getTaskProgress(task)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-8 py-4 bg-gray-50/30 border-t border-gray-100 backdrop-blur-sm self-end w-full flex justify-end">
                                        <button className="text-[10px] font-black text-[#1D1110] uppercase tracking-widest hover:text-[#3E2723] transition-colors flex items-center gap-2">
                                            View Details <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* MISSION BRIEFING MODAL (PREMIUM OVERHAUL) */}
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-[#1D1110]/80 backdrop-blur-xl" onClick={() => { setShowModal(false); setSelectedTask(null); }} />
                        
                        <div className="relative bg-[#FAF9F8] w-full max-w-5xl h-full lg:h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 border border-white/20">
                            
                            {/* COMPACT PREMIUM MODAL HEADER */}
                            <div className="shrink-0 py-5 lg:py-6 px-8 bg-gradient-to-br from-[#1D1110] to-[#3E2723] text-white flex items-center justify-between gap-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                                
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="h-px w-6 bg-white/20 hidden sm:block" />
                                    <div className="space-y-0.5">
                                        <h2 className="text-xl lg:text-2xl font-black text-white tracking-tighter uppercase leading-none">
                                            {selectedTask ? 'Edit Task' : 'Create New Task'}
                                        </h2>
                                        <p className="text-white/40 text-[9px] font-medium tracking-widest uppercase">Configure task details and parameters</p>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => { setShowModal(false); setSelectedTask(null); }}
                                    className="relative z-10 w-11 h-11 flex items-center justify-center bg-white/10 text-white/60 rounded-xl hover:bg-red-500 hover:text-white hover:rotate-90 transition-all duration-500 backdrop-blur-md border border-white/10 group shadow-xl"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* STREAMLINED TAB NAVIGATION */}
                            <div className="shrink-0 p-1.5 bg-white border-b border-gray-100">
                                <div className="max-w-2xl mx-auto flex items-center justify-center gap-1.5 p-1 bg-[#FAF9F8] rounded-xl font-black italic">
                                    {[
                                        { id: 'overview', label: 'Overview', icon: Target },
                                        { id: 'details', label: 'Description', icon: BookOpen },
                                        { id: 'requirements', label: 'Requirements', icon: ListTodo }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[9px] uppercase tracking-widest transition-all duration-300 ${
                                                activeTab === tab.id 
                                                ? 'bg-[#1D1110] text-white shadow-lg shadow-[#1D1110]/20' 
                                                : 'text-gray-400 hover:bg-gray-100 hover:text-[#1D1110]'
                                            }`}
                                        >
                                            <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
                                            <span className="inline">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                                <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 custom-scrollbar bg-white">
                                    {error && (
                                        <div className="p-8 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-6 animate-in slide-in-from-top-4">
                                            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Execution Interrupted</p>
                                                <p className="text-sm font-bold text-red-800 leading-relaxed">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- OVERVIEW TAB --- */}
                                    {activeTab === 'overview' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
                                            {/* SECTION: TITLE & CORE */}
                                            <div className="bg-[#FAF9F8] p-7 rounded-[2.5rem] border border-gray-50 shadow-inner space-y-7">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <div className="w-9 h-9 rounded-xl bg-[#1D1110] flex items-center justify-center shadow-lg">
                                                        <Activity className="w-4 h-4 text-white" />
                                                    </div>
                                                    <h3 className="text-[10px] font-black text-[#1D1110] uppercase tracking-[0.3em]">Basic Details</h3>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#3E2723]" />
                                                        Task Title <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.title}
                                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                        required
                                                        className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-base font-black text-[#1D1110] focus:ring-8 focus:ring-[#3E2723]/5 focus:border-[#1D1110] focus:outline-none transition-all placeholder-gray-200 shadow-sm"
                                                        placeholder="Define the primary objective..."
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                                            <Filter className="w-3 h-3" /> Priority Level
                                                        </label>
                                                        <div className="relative group">
                                                            <select
                                                                value={formData.priority}
                                                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                                                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-[10px] font-black text-[#1D1110] uppercase tracking-widest focus:ring-8 focus:ring-[#3E2723]/5 focus:outline-none transition-all appearance-none cursor-pointer shadow-sm"
                                                            >
                                                                <option value="low">Standard Priority</option>
                                                                <option value="medium">Elevated Priority</option>
                                                                <option value="high">High Strategic Priority</option>
                                                                <option value="critical">Critical (Immediate Deployment)</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#1D1110] transition-colors" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                                            <Calendar className="w-3 h-3" /> Deadline
                                                        </label>
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.deadline}
                                                            onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                                            required
                                                            className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-[10px] font-black text-[#1D1110] focus:ring-8 focus:ring-[#3E2723]/5 focus:outline-none transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SECTION: ASSIGNMENT */}
                                            <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-7">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg">
                                                        <User className="w-4 h-4 text-white" />
                                                    </div>
                                                    <h3 className="text-[10px] font-black text-[#1D1110] uppercase tracking-[0.3em]">Assignment Details</h3>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                                            <Users className="w-3 h-3" /> Assign To
                                                        </label>
                                                        <div className="relative group">
                                                            <select
                                                                value={formData.assignedTo}
                                                                onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                                                                required
                                                                className="w-full bg-[#FAF9F8] border border-gray-50 rounded-2xl px-6 py-4 text-[10px] font-black text-[#1D1110] focus:ring-8 focus:ring-[#3E2723]/5 focus:outline-none transition-all appearance-none cursor-pointer"
                                                            >
                                                                <option value="">Select Team Member</option>
                                                                {members.map(m => (
                                                                    <option key={m._id} value={m._id}>{m.name} — {m.designation || m.role?.replace('_', ' ')}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#1D1110] transition-colors" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                                            <Briefcase className="w-3 h-3" /> Project Category
                                                        </label>
                                                        <div className="relative group">
                                                            <select
                                                                value={formData.category}
                                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                                className="w-full bg-[#FAF9F8] border border-gray-50 rounded-2xl px-6 py-4 text-[10px] font-black text-[#1D1110] uppercase tracking-widest focus:ring-8 focus:ring-[#3E2723]/5 focus:outline-none transition-all appearance-none cursor-pointer"
                                                            >
                                                                <option value="development">Strategic Development</option>
                                                                <option value="testing">Operational Testing</option>
                                                                <option value="research">Market Intelligence</option>
                                                                <option value="design">Creative Blueprint</option>
                                                                <option value="documentation">Tactical Docs</option>
                                                                <option value="other">General Mission</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#1D1110] transition-colors" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                                        <MessageSquare className="w-3 h-3" /> Short Summary
                                                    </label>
                                                    <textarea
                                                        rows="3"
                                                        value={formData.description}
                                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                        className="w-full bg-[#FAF9F8] border border-gray-50 rounded-2xl px-6 py-4 text-sm font-bold text-[#1D1110] focus:ring-8 focus:ring-[#3E2723]/5 focus:outline-none transition-all resize-none placeholder-gray-300 leading-relaxed italic"
                                                        placeholder="Provide a high-level briefing..."
                                                        maxLength="2000"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- DETAILS TAB --- */}
                                    {activeTab === 'details' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
                                            <div className="bg-[#FAF9F8] p-8 rounded-[2.5rem] border border-gray-50 shadow-inner relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                                    <BookOpen className="w-24 h-24" />
                                                </div>
                                                
                                                <div className="relative z-10 space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-[#1D1110] flex items-center justify-center text-white shadow-xl">
                                                            <ClipboardList className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-black text-[#1D1110] tracking-tighter uppercase">Detailed Description</h3>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Full technical specifications</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <textarea
                                                        rows="10"
                                                        value={formData.detailedDescription}
                                                        onChange={e => setFormData({ ...formData, detailedDescription: e.target.value })}
                                                        className="w-full bg-white border border-gray-100 rounded-2xl px-8 py-8 text-sm font-mono font-medium text-[#1D1110] focus:ring-12 focus:ring-[#3E2723]/5 focus:outline-none transition-all shadow-inner leading-relaxed overflow-y-auto custom-scrollbar"
                                                        placeholder="Enter full task details here..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-3 flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" /> Additional Notes
                                                </label>
                                                <textarea
                                                    rows="3"
                                                    value={formData.notes}
                                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                                    className="w-full bg-[#FAF9F8] border border-gray-50 rounded-2xl px-6 py-4 text-sm font-bold text-[#1D1110] focus:ring-8 focus:ring-[#1D1110]/5 focus:outline-none transition-all placeholder-gray-300 italic shadow-sm"
                                                    placeholder="Add internal tactical considerations..."
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* --- REQUIREMENTS TAB --- */}
                                    {activeTab === 'requirements' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
                                            <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-2xl space-y-8 relative overflow-hidden">
                                                <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
                                                
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-3xl bg-amber-500 flex items-center justify-center text-white shadow-2xl shadow-amber-500/20 rotate-3">
                                                        <Target className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-[#1D1110] tracking-tighter uppercase leading-none mb-1.5">Success Criteria</h3>
                                                        <p className="text-[10px] font-bold text-gray-400 max-w-sm">Define deliverables that validate mission completion.</p>
                                                    </div>
                                                </div>
                                                
                                                <textarea
                                                    rows="12"
                                                    value={formData.clientRequirements}
                                                    onChange={e => setFormData({ ...formData, clientRequirements: e.target.value })}
                                                    className="w-full bg-[#FAF9F8] border border-gray-50 rounded-[2rem] px-10 py-10 text-sm font-bold text-[#1D1110] focus:ring-16 focus:ring-amber-500/5 focus:outline-none transition-all shadow-inner leading-[1.8] custom-scrollbar"
                                                    placeholder="Specify mission deliverables..."
                                                />
                                                
                                                <div className="flex justify-between items-center px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Project Requirements Active</span>
                                                    </div>
                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{formData.clientRequirements?.length || 0} / 5000</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* COMPACT FOOTER (INSIDE SCROLLABLE AREA) */}
                                    <div className="py-8 border-t border-gray-100 flex items-center justify-between gap-6 relative z-10">
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); setSelectedTask(null); }}
                                            className="flex items-center gap-3 px-8 py-4 bg-[#FAF9F8] text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] rounded-xl border border-gray-100 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all duration-300"
                                        >
                                            <X className="w-3.5 h-3.5" /> Cancel
                                        </button>
                                        
                                        <div className="flex items-center gap-6">
                                            <p className="hidden md:block text-[9px] font-black text-gray-200 uppercase tracking-widest italic">Review details before saving</p>
                                            <button
                                                type="submit"
                                                className="group flex items-center gap-5 px-10 py-4 bg-[#1D1110] text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-[#3E2723] transition-all duration-300 shadow-xl hover:shadow-[#1D1110]/40 overflow-hidden relative"
                                            >
                                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                                <span className="relative z-10">{selectedTask ? 'Update Task' : 'Create Task'}</span>
                                                <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Task Detail Modal */}
                {showDetailModal && selectedTask && (
                    <div className="modal-overlay" onClick={() => { setShowDetailModal(false); setSelectedTask(null); }}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                            {/* MODAL HEADER */}
                            <div className="px-8 lg:px-12 py-8 border-b border-gray-50 bg-white flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-3xl ${
                                        selectedTask.priority === 'critical' ? 'bg-red-50 text-red-600' : 
                                        selectedTask.priority === 'high' ? 'bg-orange-50 text-orange-600' : 
                                        selectedTask.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                                    }`}>
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                                selectedTask.priority === 'critical' ? 'text-red-500' : 
                                                selectedTask.priority === 'high' ? 'text-orange-500' : 
                                                selectedTask.priority === 'medium' ? 'text-amber-500' : 'text-green-500'
                                            }`}>
                                                {selectedTask.priority} Priority
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                By {selectedTask.assignedBy?.name || 'Admin'}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-[#1D1110] leading-none tracking-tighter uppercase">{selectedTask.title}</h3>
                                    </div>
                                </div>
                                <button 
                                    className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all duration-300" 
                                    onClick={() => { setShowDetailModal(false); setSelectedTask(null); }}
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* NAVIGATION TABS */}
                            <div className="px-8 lg:px-12 bg-white flex gap-2 border-b border-gray-50 sticky top-0 z-10">
                                {[
                                    { id: 'overview', label: 'Basic Info', icon: Activity },
                                    { id: 'subtasks', label: 'Subtasks', icon: ListTodo },
                                    { id: 'comments', label: 'Comments', icon: MessageSquare },
                                    { id: 'attachments', label: 'Attachments', icon: Paperclip }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group shrink-0 ${activeTab === tab.id ? 'text-[#1D1110]' : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        <tab.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-[#1D1110]' : 'text-gray-400'}`} />
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1D1110] rounded-t-full" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar bg-white">
                                {activeTab === 'overview' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                                        {/* TOP STATS GRID */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-[#FAF9F8] rounded-3xl p-6 border border-gray-100">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Status</p>
                                                <div className="flex items-center justify-between">
                                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedTask.status)}`}>
                                                        {selectedTask.status?.replace('_', ' ')}
                                                    </span>
                                                    <select
                                                        value={selectedTask.status}
                                                        onChange={e => handleStatusChange(selectedTask._id, e.target.value)}
                                                        className="p-2 bg-white/50 border-none text-[8px] font-black uppercase rounded-lg focus:ring-2 focus:ring-[#1D1110]/10"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="on_hold">On Hold</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="overdue">Overdue</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="bg-[#FAF9F8] rounded-3xl p-6 border border-gray-100">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Due Date</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1D1110] shadow-sm">
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-sm font-black text-[#1D1110] uppercase tracking-wider">
                                                        {new Date(selectedTask.deadline).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-[#FAF9F8] rounded-3xl p-6 border border-gray-100">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Category</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1D1110] shadow-sm">
                                                        {getCategoryIcon(selectedTask.category)}
                                                    </div>
                                                    <span className="text-sm font-black text-[#1D1110] uppercase tracking-wider">
                                                        {selectedTask.category || 'General'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* MAIN CONTENT AREA */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                            <div className="lg:col-span-2 space-y-10">
                                                <section className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <BookOpen className="w-4 h-4 text-gray-300" />
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Task Brief</h4>
                                                    </div>
                                                    <p className="text-[#1D1110] text-lg font-bold leading-relaxed px-1">
                                                        {selectedTask.description}
                                                    </p>
                                                </section>

                                                {selectedTask.detailedDescription && (
                                                    <section className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <ClipboardList className="w-4 h-4 text-gray-300" />
                                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Technical Specifications</h4>
                                                        </div>
                                                        <div className="bg-[#FAF9F8] rounded-[2rem] p-8 border border-gray-100">
                                                            <p className="text-[#1D1110] font-medium text-sm leading-relaxed whitespace-pre-wrap">
                                                                {selectedTask.detailedDescription}
                                                            </p>
                                                        </div>
                                                    </section>
                                                )}
                                            </div>

                                            <div className="space-y-8">
                                                {/* PROGRESS PANEL */}
                                                <div className="bg-[#1D1110] rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden relative">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6 relative z-10">Completion Status</h4>
                                                    <div className="space-y-4 relative z-10">
                                                        <div className="flex justify-between items-baseline">
                                                            <span className="text-4xl font-black">{getTaskProgress(selectedTask)}%</span>
                                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Complete</span>
                                                        </div>
                                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="bg-white h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                                                                style={{ width: `${getTaskProgress(selectedTask)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ASSIGNEE INFO */}
                                                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Assigned To</h4>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-[#FAF9F8] border border-gray-100 flex items-center justify-center text-lg font-black text-[#1D1110]">
                                                            {getInitials(selectedTask.assignedTo?.name || '?')}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-[#1D1110] uppercase tracking-wide">{selectedTask.assignedTo?.name || 'Unassigned'}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedTask.assignedTo?.department || 'Member'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'subtasks' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                                        <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                            <div className="space-y-1">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discussion Thread</h4>
                                                <p className="text-xl font-black text-[#1D1110] tracking-tighter uppercase">{selectedTask.comments?.length || 0} Total Comments</p>
                                            </div>
                                            {isTeamLead && !showSubtaskForm && (String(selectedTask.assignedTo?._id || selectedTask.assignedTo) === String(user?._id)) && (
                                                <button
                                                    onClick={() => setShowSubtaskForm(true)}
                                                    className="flex items-center gap-3 px-8 py-4 bg-[#1D1110] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#3E2723] transition-all shadow-xl hover:shadow-[#1D1110]/20"
                                                >
                                                    <Plus className="w-4 h-4" /> Add Subtask
                                                </button>
                                            )}
                                        </div>

                                        {showSubtaskForm && (
                                            <form onSubmit={handleAddSubtask} className="bg-[#FAF9F8] border border-gray-100 rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95 duration-500 shadow-inner">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subtask Title</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="Define the secondary objective..."
                                                            className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-[#3E2723]/5 focus:outline-none font-bold text-[#1D1110] shadow-sm transition-all"
                                                            value={subtaskFormData.title}
                                                            onChange={e => setSubtaskFormData({ ...subtaskFormData, title: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assign Member</label>
                                                        <select
                                                            required
                                                            className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-[#3E2723]/5 focus:outline-none font-bold text-[#1D1110] shadow-sm transition-all appearance-none cursor-pointer"
                                                            value={subtaskFormData.assignedTo}
                                                            onChange={e => setSubtaskFormData({ ...subtaskFormData, assignedTo: e.target.value })}
                                                        >
                                                            <option value="">Select Team Member</option>
                                                            {(selectedTask?.teamId ?
                                                                (teams.find(t => t._id === (selectedTask.teamId._id || selectedTask.teamId))?.members || members) :
                                                                members
                                                            ).filter(m => m.role === 'team_member').map(m => (
                                                                <option key={m._id} value={m._id}>{m.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deadline Date</label>
                                                        <input
                                                            type="datetime-local"
                                                            required
                                                            className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-[#3E2723]/5 focus:outline-none font-bold text-[#1D1110] shadow-sm transition-all"
                                                            value={subtaskFormData.deadline}
                                                            onChange={e => setSubtaskFormData({ ...subtaskFormData, deadline: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-4 pt-4">
                                                    <button type="button" onClick={() => setShowSubtaskForm(false)} className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-[#1D1110] transition-colors">Cancel</button>
                                                    <button
                                                        type="submit"
                                                        disabled={submittingSubtask}
                                                        className="px-10 py-4 bg-[#1D1110] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#3E2723] transition-all shadow-xl disabled:opacity-50"
                                                    >
                                                        {submittingSubtask ? 'Adding...' : 'Add Subtask'}
                                                    </button>
                                                </div>
                                            </form>
                                        )}

                                        <div className="grid grid-cols-1 gap-6">
                                            {selectedTask.subtasks?.map((subtask) => (
                                                <div key={subtask._id} className="group bg-[#FAF9F8] rounded-[2rem] p-8 border border-gray-100 hover:bg-white hover:shadow-2xl transition-all duration-500 flex flex-col gap-6">
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                                        <div className="flex-1 space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <h5 className="text-lg font-black text-[#1D1110] tracking-tighter uppercase">{subtask.title}</h5>
                                                                <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${subtask.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                         subtask.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                                                                             'bg-gray-100 text-gray-400'
                                                                    }`}>
                                                                    {subtask.status}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-xl bg-[#FAF9F8] border border-gray-100 flex items-center justify-center text-[10px] font-black text-[#1D1110]">
                                                                        {getInitials(subtask.assignedTo?.name || '?')}
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Assignee</p>
                                                                        <p className="text-xs font-bold text-[#1D1110]">{subtask.assignedTo?.name}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-xl bg-[#FAF9F8] border border-gray-100 flex items-center justify-center text-gray-400">
                                                                        <Clock className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Due Date</p>
                                                                        <p className="text-xs font-bold text-[#1D1110]">{new Date(subtask.deadline).toLocaleDateString()}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* SUBTASK PROGRESS */}
                                                            <div className="space-y-2 pt-2">
                                                                <div className="flex justify-between items-center">
                                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Progress</p>
                                                                    <span className="text-[10px] font-black text-[#1D1110]">{subtask.progressPercentage || 0}%</span>
                                                                </div>
                                                                <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5 shadow-inner">
                                                                    <div 
                                                                        className="h-full bg-[#1D1110] rounded-full transition-all duration-1000"
                                                                        style={{ width: `${subtask.progressPercentage || 0}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => handleSubtaskStatusChange(selectedTask._id, subtask._id, subtask.status === 'completed' ? 'in_progress' : 'completed')}
                                                                className={`p-4 rounded-2xl border transition-all duration-500 group/btn ${subtask.status === 'completed'
                                                                        ? 'bg-green-500 border-green-500 text-white shadow-xl shadow-green-100'
                                                                        : 'bg-white border-gray-100 text-gray-400 hover:border-green-500 hover:text-green-500 shadow-sm'
                                                                    }`}
                                                            >
                                                                <CheckCircle2 className="w-6 h-6 transition-transform group-hover/btn:scale-110" />
                                                            </button>
                                                            {String(subtask.assignedTo?._id || subtask.assignedTo) === String(user._id) && (
                                                                <div className="relative">
                                                                    <select
                                                                        value={subtask.status}
                                                                        onChange={(e) => handleSubtaskStatusChange(selectedTask._id, subtask._id, e.target.value)}
                                                                        className="pl-6 pr-12 py-4 bg-[#FAF9F8] border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[#1D1110] outline-none focus:ring-4 focus:ring-[#3E2723]/5 appearance-none cursor-pointer shadow-sm min-w-[180px]"
                                                                    >
                                                                        <option value="pending">Pending</option>
                                                                        <option value="in_progress">In Progress</option>
                                                                        <option value="completed">Completed</option>
                                                                    </select>
                                                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Subtask Discussion Hub */}
                                                    <div className="mt-8 pt-8 border-t border-gray-50">
                                                        <div className="flex items-center gap-2 mb-6">
                                                            <MessageSquare className="w-4 h-4 text-gray-300" />
                                                            <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Activity Feed</h6>
                                                        </div>
                                                        <div className="space-y-4 mb-6 max-h-[250px] overflow-y-auto pr-4 no-scrollbar">
                                                            {subtask.comments?.map((c, i) => (
                                                                <div key={i} className="flex gap-4 items-start">
                                                                    <div className="w-8 h-8 rounded-xl bg-[#FAF9F8] flex-shrink-0 flex items-center justify-center text-[10px] font-black text-[#1D1110] border border-gray-100">
                                                                        {getInitials(c.userId?.name || '?')}
                                                                    </div>
                                                                    <div className="bg-[#FAF9F8] rounded-2xl px-6 py-4 flex-1 border border-gray-50">
                                                                        <p className="text-sm text-[#1D1110] leading-relaxed font-medium">{c.content}</p>
                                                                        <p className="text-[8px] text-gray-400 mt-2 font-black uppercase tracking-widest">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {c.userId?.name}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(!subtask.comments || subtask.comments.length === 0) && (
                                                                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest text-center py-4">No activity yet</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="flex-1 relative">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Add a comment..."
                                                                    className="w-full bg-[#FAF9F8] border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-[#3E2723]/5 focus:outline-none font-bold text-[#1D1110] shadow-inner transition-all"
                                                                    value={subtaskComment[subtask._id] || ''}
                                                                    onChange={e => setSubtaskComment({ ...subtaskComment, [subtask._id]: e.target.value })}
                                                                    onKeyPress={e => e.key === 'Enter' && handleAddSubtaskComment(subtask._id)}
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handleAddSubtaskComment(subtask._id)}
                                                                className="px-6 py-4 bg-[#1D1110] text-white rounded-2xl hover:bg-[#3E2723] hover:rotate-12 transition-all duration-500 shadow-xl"
                                                            >
                                                                <Send className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!selectedTask.subtasks || selectedTask.subtasks?.length === 0) && (
                                                <div className="text-center py-24 bg-[#FAF9F8] rounded-[3rem] border border-gray-100 shadow-inner">
                                                    <div className="p-8 bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-sm">
                                                        <ListTodo className="w-8 h-8 text-gray-200" />
                                                    </div>
                                                    <h3 className="text-2xl font-black text-[#1D1110] tracking-tighter uppercase mb-2">No Subtasks Found</h3>
                                                    <p className="text-gray-400 font-medium max-w-xs mx-auto text-sm leading-relaxed">Break this task into smaller subtasks for the team.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'comments' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[600px] space-y-8">
                                        <div className="flex-1 overflow-y-auto space-y-6 pr-4 no-scrollbar">
                                            {selectedTask.comments?.map((c, i) => (
                                                <div key={i} className={`flex gap-4 ${c.userId?._id === user._id ? 'flex-row-reverse' : ''}`}>
                                                    <div className="w-8 h-8 rounded-xl bg-[#FAF9F8] border border-gray-100 flex-shrink-0 flex items-center justify-center text-[8px] font-black text-[#1D1110]">
                                                        {getInitials(c.userId?.name || '?')}
                                                    </div>
                                                    <div className={`max-w-[80%] rounded-3xl p-5 ${c.userId?._id === user._id
                                                            ? 'bg-[#1D1110] text-white rounded-tr-none'
                                                            : 'bg-[#FAF9F8] text-[#1D1110] rounded-tl-none border border-gray-100'
                                                        }`}>
                                                        <div className="flex justify-between items-center mb-2 gap-4">
                                                            <span className={`text-[8px] font-black uppercase tracking-widest ${c.userId?._id === user._id ? 'text-white/40' : 'text-gray-400'}`}>{c.userId?.name}</span>
                                                            <span className={`text-[7px] font-bold uppercase ${c.userId?._id === user._id ? 'text-white/20' : 'text-gray-300'}`}>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-sm leading-relaxed font-medium">{c.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                                                <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                                                    <MessageSquare className="w-12 h-12" />
                                                    <p className="text-[10px] uppercase font-black tracking-[0.3em]">No comments yet</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-xl flex gap-4 ring-8 ring-[#FAF9F8]">
                                            <div className="p-4 bg-[#FAF9F8] rounded-2xl">
                                                <Activity className="w-5 h-5 text-gray-400" />
                                            </div>
                                                <input
                                                    type="text"
                                                    placeholder="Add a comment..."
                                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-[#1D1110] placeholder-gray-300 px-0"
                                                value={comment}
                                                onChange={e => setComment(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                                            />
                                            <button
                                                onClick={handleAddComment}
                                                className="bg-[#1D1110] text-white px-8 py-4 rounded-2xl hover:bg-[#3E2723] hover:rotate-12 transition-all duration-500 shadow-xl"
                                            >
                                                <Send className="w-5 h-5" /> Send
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'timeline' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12 py-8 px-4">
                                        {taskActivities.map((activity, idx) => (
                                            <div key={idx} className="relative flex gap-8">
                                                {idx !== taskActivities.length - 1 && (
                                                    <div className="absolute top-12 left-6 w-px h-full bg-gradient-to-b from-gray-100 to-transparent -ml-[0.5px]" />
                                                )}
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center z-10 shadow-sm group-hover:shadow-md transition-shadow">
                                                    <Activity className="w-5 h-5 text-[#1D1110]" />
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] font-black text-[#1D1110] uppercase tracking-[0.2em]">{activity.action.replace('_', ' ')}</p>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(activity.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <div className="bg-[#FAF9F8] rounded-[1.5rem] p-6 border border-gray-50 flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-[#3E2723]" />
                                                            <span className="text-xs font-black text-[#1D1110] uppercase tracking-wide">{activity.userId?.name}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 font-medium leading-relaxed italic">{activity.details}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(!taskActivities || taskActivities.length === 0) && (
                                            <div className="py-24 text-center opacity-20">
                                                <Activity className="w-16 h-16 mx-auto mb-6" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Activity log empty</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'attachments' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                                        <div className="flex items-center justify-between border-b border-gray-50 pb-8">
                                            <div className="space-y-1">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Files & Links</h4>
                                                <p className="text-xl font-black text-[#1D1110] tracking-tighter uppercase">{(selectedTask.attachments?.length || 0) + (selectedTask.externalLinks?.length || 0)} Total Items</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => setShowLinkModal(true)}
                                                    className="flex items-center gap-3 px-8 py-4 bg-[#FAF9F8] text-[#1D1110] text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all"
                                                >
                                                    <ExternalLink className="w-4 h-4" /> Add Link
                                                </button>
                                                <label className="flex items-center gap-3 px-8 py-4 bg-[#1D1110] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#3E2723] transition-all shadow-xl cursor-pointer">
                                                    <Paperclip className="w-4 h-4" /> Upload File
                                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                                                </label>
                                            </div>
                                        </div>

                                        {uploadingFile && (
                                            <div className="flex items-center gap-6 p-8 bg-[#FAF9F8] rounded-[2rem] border border-gray-100 animate-pulse">
                                                <div className="w-10 h-10 rounded-full border-4 border-[#1D1110] border-t-transparent animate-spin" />
                                                <div className="space-y-1">
                                                    <span className="text-xs font-black text-[#1D1110] uppercase tracking-[0.2em]">Uploading file...</span>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Processing and saving...</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {selectedTask.attachments?.map((att, i) => (
                                                <div key={i} className="group bg-[#FAF9F8] border border-gray-100 rounded-[2rem] p-6 hover:bg-white hover:shadow-2xl transition-all duration-500 flex flex-col justify-between gap-6 relative">
                                                    <div className="flex items-start justify-between">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${att.isExternalLink ? 'bg-orange-50 text-orange-600' : 'bg-white text-gray-400'}`}>
                                                            {att.isExternalLink ? <ExternalLink className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white hover:bg-[#1D1110] rounded-xl text-gray-400 hover:text-white transition-all duration-500 shadow-sm">
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                            {isTeamLead && (
                                                                <button onClick={() => handleDeleteAttachment(att._id)} className="p-2.5 bg-red-50/50 hover:bg-red-500 rounded-xl text-red-300 hover:text-white transition-all duration-500 shadow-sm">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-[#1D1110] truncate uppercase tracking-tight">{att.originalName || att.name}</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{att.isExternalLink ? 'Link' : 'File'}</span>
                                                            {!att.isExternalLink && <span className="text-[8px] font-black text-[#1D1110] bg-white px-2 py-0.5 rounded-full border border-gray-50 uppercase tracking-tighter">{(att.fileSize / 1024).toFixed(1)} KB</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!selectedTask.attachments || selectedTask.attachments?.length === 0) && (
                                                <div className="col-span-full py-24 text-center bg-[#FAF9F8] rounded-[2.5rem] border border-gray-100 border-dashed flex flex-col items-center justify-center">
                                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                                        <Paperclip className="w-6 h-6 text-gray-100" />
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No attachments available</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="shrink-0 p-8 lg:p-12 border-t border-gray-50 bg-white flex flex-wrap items-center justify-between gap-6 rounded-b-[2.5rem]">
                                <div className="flex items-center gap-4">
                                    {isTeamLead && (
                                        <>
                                            <button
                                                onClick={() => handleDeleteTask(selectedTask._id)}
                                                className="px-8 py-5 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-red-50 transition-all"
                                            >
                                                Delete Task
                                            </button>
                                            <button
                                                onClick={() => openEditModal(selectedTask)}
                                                className="px-10 py-5 bg-[#1D1110] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#3E2723] transition-all shadow-xl hover:shadow-[#1D1110]/20"
                                            >
                                                Edit Task
                                            </button>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setShowDetailModal(false); setSelectedTask(null); }}
                                    className="px-10 py-5 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#1D1110] hover:text-white transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Link and Other Modals */}

                {/* Add Link Modal */}
                {showLinkModal && (
                    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[#1D1110]/40 backdrop-blur-md" onClick={() => setShowLinkModal(false)} />
                        <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-[#FAF9F8]">
                                <h3 className="text-xl font-black text-[#1D1110] tracking-tighter uppercase">Add Link</h3>
                                <button className="p-3 hover:bg-gray-100 rounded-xl transition-colors" onClick={() => setShowLinkModal(false)}>
                                    <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>
                            <form onSubmit={handleAddLink}>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Link Title</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Project Docs, Design Link"
                                            className="w-full bg-[#FAF9F8] border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-[#3E2723]/5 focus:outline-none font-bold text-[#1D1110] transition-all"
                                            value={linkData.title}
                                            onChange={e => setLinkData({ ...linkData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Link URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://example.com/..."
                                            className="w-full bg-[#FAF9F8] border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-[#3E2723]/5 focus:outline-none font-bold text-[#1D1110] transition-all"
                                            value={linkData.url}
                                            onChange={e => setLinkData({ ...linkData, url: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="p-8 bg-[#FAF9F8] border-t border-gray-100 flex gap-4">
                                    <button type="button" className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest" onClick={() => setShowLinkModal(false)}>Cancel</button>
                                    <button type="submit" className="flex-1 py-4 bg-[#1D1110] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#3E2723] transition-all shadow-xl">Add Link</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}


            </div>
        </Layout>
    );
};

export default TaskManagement;
