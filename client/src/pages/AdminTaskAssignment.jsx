import { useState, useEffect, useRef } from 'react';
import { 
    ClipboardList, Plus, Calendar, Clock, AlertCircle, CheckCircle, X, Search, 
    Target, User, Users, Briefcase, TrendingUp, Filter, Eye, Edit, Trash2, 
    FileText, Paperclip, Upload, Download, AlertTriangle, Check, ChevronRight,
    MessageSquare, ListTodo, Layers, ArrowRight, Save, RotateCcw, Activity, 
    Zap, MoreVertical, ChevronDown, Bookmark
} from 'lucide-react';
import { adminTasksAPI } from '../services/adminApi';
import { leadsAPI, teamsAPI } from '../services/api';
import Layout from '../components/Layout';

const AdminTaskAssignment = () => {
    const [tasks, setTasks] = useState([]);
    const [teamLeads, setTeamLeads] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);
    
    // New Task Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        taskType: 'project_task',
        category: 'development',
        teamId: '',
        teamLeadId: '',
        relatedProject: '',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        estimatedEffort: '',
        estimatedEffortUnit: 'hours',
        reminder: '',
        notes: '',
        status: 'pending'
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = (name) => {
        if (!name) return "U";
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksRes, leadsRes, teamsRes] = await Promise.all([
                adminTasksAPI.getAll(),
                adminTasksAPI.getTeamLeads(),
                teamsAPI.getAll()
            ]);
            setTasks(tasksRes.data.data || []);
            setTeamLeads(leadsRes.data.data || []);
            setTeams(teamsRes.data.data || []);

            if (selectedTask) {
                const updated = (tasksRes.data.data || []).find(t => t._id === selectedTask._id);
                if (updated) setSelectedTask(updated);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateTask = () => {
        setFormData({
            title: '',
            description: '',
            priority: 'medium',
            taskType: 'project_task',
            category: 'development',
            teamId: '',
            teamLeadId: '',
            relatedProject: '',
            startDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            estimatedEffort: '',
            estimatedEffortUnit: 'hours',
            reminder: '',
            notes: '',
            status: 'pending'
        });
        setSelectedTask(null);
        setShowModal(true);
    };

    const handleEditTask = (task) => {
        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'medium',
            taskType: task.taskType || 'project_task',
            category: task.category || 'development',
            teamId: task.teamId?._id || task.teamId || '',
            teamLeadId: task.assignedTo?._id || task.assignedTo || '',
            relatedProject: task.relatedProject || '',
            startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            estimatedEffort: task.estimatedEffort || '',
            estimatedEffortUnit: task.estimatedEffortUnit || 'hours',
            reminder: task.reminder ? new Date(task.reminder).toISOString().split('T')[0] : '',
            notes: task.notes || '',
            status: task.status || 'pending'
        });
        setSelectedTask(task);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.dueDate || !formData.teamLeadId) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            if (selectedTask) {
                await adminTasksAPI.updateTask(selectedTask._id, formData);
                alert('✅ Task updated successfully!');
            } else {
                await adminTasksAPI.assignToTeamLead(formData);
                alert('✅ Task assigned successfully!');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving task:', error);
            alert('❌ Failed to save task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task? (Soft Delete)')) return;
        try {
            await adminTasksAPI.deleteTask(taskId);
            alert('✅ Task deleted successfully!');
            fetchData();
        } catch (error) {
            console.error('Error deleting task:', error);
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

            await adminTasksAPI.uploadAttachment(selectedTask._id, {
                fileName: file.name,
                fileUrl: base64String,
                fileType: file.type,
                fileSize: file.size,
                originalName: file.name
            });
            
            alert('✅ File uploaded successfully');
            fetchData();
        } catch (err) {
            console.error('Upload Error:', err);
            alert('❌ Failed to upload file: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploadingFile(false);
            // Reset input so same file can be selected again
            e.target.value = '';
        }
    };

    const handleAddLink = async () => {
        const link = prompt('Enter the full URL for the attachment:');
        if (!link || !selectedTask) return;
        
        try {
            setUploadingFile(true);
            await adminTasksAPI.uploadAttachment(selectedTask._id, {
                fileName: link.split('/').pop() || 'Web Link',
                fileUrl: link,
                fileType: 'link',
                fileSize: 0,
                originalName: link
            });
            fetchData();
        } catch (err) {
            alert('❌ Failed to add link');
        } finally {
            setUploadingFile(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]';
            case 'in_progress': return 'bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]';
            case 'on_hold': return 'bg-[#FFF8E1] text-[#795548] border-[#FFECB3]';
            case 'blocked': return 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]';
            case 'pending': return 'bg-[#FAFAFA] text-[#9E9E9E] border-[#F5F5F5]';
            case 'overdue': return 'bg-[#1D1110] text-[#FF5252] border-[#FF5252]/20';
            default: return 'bg-[#FAFAFA] text-[#9E9E9E] border-[#F5F5F5]';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return 'bg-[#1D1110] text-white shadow-lg shadow-[#1D1110]/20';
            case 'high': return 'bg-[#3E2723] text-[#D7CCC8] shadow-md shadow-[#3E2723]/10';
            case 'medium': return 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]';
            case 'low': return 'bg-[#F1F8E9] text-[#33691E] border-[#DCEDC8]';
            default: return 'bg-gray-50 text-gray-400 border-gray-100';
        }
    };

    const getOverdueStatus = (task) => {
        if (task.status === 'completed') return 'on_track';
        const now = new Date();
        const due = new Date(task.dueDate);
        if (due < now) return 'overdue';
        const diff = (due - now) / (1000 * 60 * 60 * 24);
        if (diff <= 3) return 'near_deadline';
        return 'on_track';
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'development': return <Briefcase className="w-4 h-4" />;
            case 'testing': return <ClipboardList className="w-4 h-4" />; // Using default for now
            case 'research': return <ClipboardList className="w-4 h-4" />; // Using default for now
            case 'design': return <Target className="w-4 h-4" />;
            case 'documentation': return <ClipboardList className="w-4 h-4" />; // Using default for now
            case 'marketing': return <TrendingUp className="w-4 h-4" />;
            case 'meeting': return <Users className="w-4 h-4" />;
            case 'review': return <Eye className="w-4 h-4" />;
            case 'deployment': return <Zap className="w-4 h-4" />;
            case 'maintenance': return <Activity className="w-4 h-4" />;
            default: return <ClipboardList className="w-4 h-4" />;
        }
    };
    if (loading) {
        return (
            <Layout title="Task Assignment">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E2723]"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Task Assignment">
            <div className="max-w-[1600px] mx-auto px-4 lg:px-10 py-8 space-y-8 bg-[#FAF9F8]">

                {/* KPI METRICS ROW (MATCHING TEAMS PAGE) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* KPI: TOTAL MISSIONS */}
                    <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                    Total Missions
                                </p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">
                                        {tasks.length}
                                    </h3>
                                    <span className="text-[10px] font-bold text-green-500 tracking-tighter">
                                        +12%
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
                                    Success Factor
                                </p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">
                                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
                                    </h3>
                                    <span className="text-[10px] font-bold text-blue-500 tracking-tighter truncate">
                                        READY
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* KPI: ACTIVE ROSTER */}
                    <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                    Active Roster
                                </p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">
                                        {teamLeads.length}
                                    </h3>
                                    <span className="text-[10px] font-bold text-green-500 tracking-tighter truncate">
                                        ACTIVE
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* KPI: RISK FACTOR */}
                    <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                    Risk Factor
                                </p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-3xl font-black text-red-600 tracking-tighter">
                                        {tasks.filter(t => t.priority === 'critical' || getOverdueStatus(t) === 'overdue').length}
                                    </h3>
                                    <span className="text-[10px] font-bold text-red-500 tracking-tighter truncate">
                                        ALERT
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SEARCH & FILTER ROW (MATCHING TEAMS PAGE) */}
                <div className="flex flex-wrap lg:flex-nowrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-2 flex items-center group focus-within:ring-2 focus-within:ring-[#1D1110]/10 transition-all">
                        <div className="p-3">
                            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#1D1110] transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search missions, leads, or categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-[#1D1110] placeholder-gray-400 flex-1 px-2"
                        />
                    </div>
                    
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
                        <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-100 p-1 flex items-center flex-1 sm:flex-none sm:min-w-[170px]">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-5 pr-10 py-2.5 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-[#3E2723] appearance-none cursor-pointer"
                            >
                                <option value="all">Global Status</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">Active Duty</option>
                                <option value="completed">Mission Success</option>
                                <option value="on_hold">Suspended</option>
                                <option value="blocked">Obstructed</option>
                            </select>
                            <div className="pr-4 pointer-events-none">
                                <Filter className="w-3 h-3 text-gray-400" />
                            </div>
                        </div>

                        <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-100 p-1 flex items-center flex-1 sm:flex-none sm:min-w-[170px]">
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="w-full pl-5 pr-10 py-2.5 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-[#3E2723] appearance-none cursor-pointer"
                            >
                                <option value="all">Priority Level</option>
                                <option value="critical">Critical (P0)</option>
                                <option value="high">High (P1)</option>
                                <option value="medium">Standard (P2)</option>
                                <option value="low">Low (P3)</option>
                            </select>
                            <div className="pr-4 pointer-events-none">
                                <Activity className="w-3 h-3 text-gray-400" />
                            </div>
                        </div>

                        <button 
                            onClick={handleCreateTask}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1D1110] text-white rounded-[1.25rem] hover:bg-[#3E2723] transition-all shadow-md hover:shadow-lg font-black text-[10px] uppercase tracking-widest whitespace-nowrap min-w-[140px]"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Task
                        </button>
                    </div>
                </div>

                {/* MISSION GRID (CLEAN THEME) */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
                    {filteredTasks.map(task => (
                        <div 
                            key={task._id} 
                            onClick={() => { setSelectedTask(task); setShowDetailsModal(true); }}
                            className="group bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer overflow-hidden transform hover:-translate-y-2 flex flex-col"
                        >
                            <div className="p-8 space-y-6 flex-1">
                                {/* CARD HEADER */}
                                <div className="flex items-start justify-between relative">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black text-[#1D1110] tracking-tight group-hover:text-amber-500 transition-colors uppercase line-clamp-1">
                                            {task.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className="text-amber-500/60">
                                                {getCategoryIcon(task.category)}
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                {task.category || 'Strategic Ops'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === task._id ? null : task._id)}
                                                className="p-2.5 text-gray-400 hover:text-[#1D1110] hover:bg-[#FAF9F8] rounded-2xl transition-all border border-transparent hover:border-gray-100"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>

                                            {openMenuId === task._id && (
                                                <div 
                                                    ref={menuRef}
                                                    className="absolute right-0 mt-2 w-56 bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in duration-200"
                                                >
                                                    <button
                                                        onClick={() => { setSelectedTask(task); setShowDetailsModal(true); setOpenMenuId(null); }}
                                                        className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-[#FAF9F8] hover:text-[#1D1110] flex items-center gap-4 transition-all"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Eye className="w-4 h-4 text-blue-500" /></div>
                                                        View Intel
                                                    </button>
                                                    <button
                                                        onClick={() => { handleEditTask(task); setOpenMenuId(null); }}
                                                        className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-[#FAF9F8] hover:text-[#1D1110] flex items-center gap-4 transition-all"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Edit className="w-4 h-4 text-amber-500" /></div>
                                                        Refine Parameters
                                                    </button>
                                                    <div className="h-px bg-gray-50 my-2 mx-5"></div>
                                                    <button
                                                        onClick={() => { handleDeleteTask(task._id); setOpenMenuId(null); }}
                                                        className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 flex items-center gap-4 transition-all"
                                                      >
                                                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 className="w-4 h-4 text-red-500" /></div>
                                                        Abort Directive
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-400 font-bold line-clamp-2 leading-relaxed h-10">
                                    {task.description}
                                </p>

                                {/* ASSIGNEE & PRIORITY */}
                                <div className="flex items-center justify-between py-5 border-y border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1D1110] to-[#3E2723] flex items-center justify-center text-white text-xs font-black shadow-lg">
                                            {getInitials(task.assignedTo?.name)}
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Asset In-Charge</p>
                                            <p className="text-xs font-black text-[#1D1110] uppercase tracking-tight">{task.assignedTo?.name || 'Unassigned'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-sm ${getPriorityColor(task.priority)}`}>
                                            {task.priority || 'Normal'}
                                        </span>
                                    </div>
                                </div>

                                {/* PROGRESS & STATUS */}
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 bg-[#FAF9F8] px-3 py-1.5 rounded-lg border border-gray-50">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                {new Date(task.dueDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm ${getStatusColor(task.status)}`}>
                                            {task.status?.replace('_', ' ') || 'Pending'}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Task Success Rate</p>
                                            <span className="text-[10px] font-black text-[#1D1110] bg-gray-50 px-2 py-0.5 rounded-md">{task.progressPercentage || 0}%</span>
                                        </div>
                                        <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5 shadow-inner relative">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[#1D1110] to-amber-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(29,17,16,0.2)]"
                                                style={{ width: `${task.progressPercentage || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredTasks.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                            <div className="p-10 bg-[#FAF9F8] rounded-[2rem] w-36 h-36 flex items-center justify-center mx-auto mb-8 shadow-inner border border-white">
                                <ClipboardList className="w-14 h-14 text-gray-200" />
                            </div>
                            <h3 className="text-4xl font-black text-[#1D1110] mb-4 tracking-tighter uppercase">No Tasks Found</h3>
                            <p className="text-gray-400 font-bold max-w-md mx-auto leading-relaxed uppercase text-[10px] tracking-widest">No tasks match the current filters. Adjust filters to broaden your search.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* PREMIUM MISSION BRIEFING MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-[#1D1110]/80 backdrop-blur-xl" onClick={() => setShowModal(false)} />
                    
                    <div className="relative bg-[#FAF9F8] w-full max-w-5xl h-full lg:h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 border border-white/20">
                        
                        {/* PREMIUM MODAL HEADER */}
                        <div className="shrink-0 p-8 lg:p-10 bg-gradient-to-br from-[#1D1110] to-[#3E2723] text-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-3xl" />
                            
                            <div className="relative z-10 space-y-3">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
                                        <Target className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="h-px w-8 bg-white/20" />
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em]">Task Creation</p>
                                </div>
                                <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                                    {selectedTask ? 'Edit Task' : 'Create Task'}
                                </h2>
                                <p className="text-white/40 text-[10px] font-medium tracking-widest uppercase ml-1">Assign tasks to team leads</p>
                            </div>
                            
                            <button
                                onClick={() => setShowModal(false)}
                                className="relative z-10 w-14 h-14 flex items-center justify-center bg-white/10 text-white/60 rounded-2xl hover:bg-red-500 hover:text-white hover:rotate-90 transition-all duration-500 backdrop-blur-md border border-white/10 group shadow-xl"
                            >
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 custom-scrollbar bg-white">
                                
                                {/* SECTION: CORE INFORMATION */}
                                <div className="bg-[#FAF9F8] p-10 rounded-[2.5rem] border border-gray-50 shadow-inner space-y-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#1D1110] flex items-center justify-center shadow-lg shadow-[#1D1110]/20">
                                            <Activity className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-black text-[#1D1110] uppercase tracking-[0.3em]">Task Details</h3>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Define the primary objective and parameters</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                            Task Title <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            required
                                            className="w-full bg-white border border-gray-100 rounded-2xl px-8 py-6 text-xl font-black text-[#1D1110] focus:ring-8 focus:ring-[#3E2723]/5 focus:border-[#1D1110] focus:outline-none transition-all placeholder-gray-200 shadow-sm"
                                            placeholder="Enter descriptive title..."
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                            Description <span className="text-red-400">*</span>
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            required
                                            rows="4"
                                            className="w-full bg-white border border-gray-100 rounded-2xl px-8 py-6 text-sm font-bold text-[#1D1110] focus:ring-8 focus:ring-[#3E2723]/5 focus:outline-none transition-all resize-none shadow-sm leading-relaxed"
                                            placeholder="Specify the full mission scope..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Priority Level</label>
                                            <div className="relative group">
                                                <select
                                                    value={formData.priority}
                                                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                                    className="w-full bg-white border border-gray-100 rounded-2xl px-8 py-5 text-[10px] font-black text-[#1D1110] uppercase tracking-widest focus:ring-8 focus:ring-[#3E2723]/5 focus:outline-none appearance-none cursor-pointer shadow-sm"
                                                >
                                                    <option value="low">Standard</option>
                                                    <option value="medium">Elevated</option>
                                                    <option value="high">High Strategic</option>
                                                    <option value="critical">Critical / Urgent</option>
                                                </select>
                                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#1D1110] transition-colors" />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Task Type</label>
                                            <div className="relative group">
                                                <select
                                                    value={formData.taskType}
                                                    onChange={(e) => setFormData({...formData, taskType: e.target.value})}
                                                    className="w-full bg-white border border-gray-100 rounded-2xl px-8 py-5 text-[10px] font-black text-[#1D1110] uppercase tracking-widest focus:ring-8 focus:ring-[#3E2723]/5 focus:outline-none appearance-none cursor-pointer shadow-sm"
                                                >
                                                    <option value="project_task">Project Task</option>
                                                    <option value="lead_task">Lead Task</option>
                                                    <option value="internal_task">Internal Task</option>
                                                    <option value="one_time">Other One-Time</option>
                                                </select>
                                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#1D1110] transition-colors" />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Category</label>
                                            <div className="relative group">
                                                <select
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                                    className="w-full bg-white border border-gray-100 rounded-2xl px-8 py-5 text-[10px] font-black text-[#1D1110] uppercase tracking-widest focus:ring-8 focus:ring-[#3E2723]/5 focus:outline-none appearance-none cursor-pointer shadow-sm"
                                                >
                                                    <option value="development">Strategic Dev</option>
                                                    <option value="testing">Operational Test</option>
                                                    <option value="design">Blueprint Design</option>
                                                    <option value="documentation">Intelligence Docs</option>
                                                    <option value="other">General Mission</option>
                                                </select>
                                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#1D1110] transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: PERSONNEL ASSIGNMENT */}
                                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-black text-[#1D1110] uppercase tracking-[0.3em]">Assignment</h3>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Designate leadership and team allocation</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                                <Users className="w-3 h-3" /> Team Lead <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative group">
                                                <select
                                                    value={formData.teamLeadId}
                                                    onChange={(e) => setFormData({...formData, teamLeadId: e.target.value, teamId: ''})}
                                                    required
                                                    className="w-full bg-[#FAF9F8] border border-gray-50 rounded-2xl px-8 py-6 text-xs font-black text-[#1D1110] focus:ring-8 focus:ring-amber-500/5 focus:outline-none appearance-none cursor-pointer transition-all"
                                                >
                                                    <option value="">Awaiting Designation...</option>
                                                    {teamLeads.map(lead => (
                                                        <option key={lead._id} value={lead._id}>{lead.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#1D1110] transition-colors" />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                                <Briefcase className="w-3 h-3" /> Team
                                            </label>
                                            <div className="relative group">
                                                <select
                                                    value={formData.teamId}
                                                    onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                                                    disabled={!formData.teamLeadId}
                                                    className="w-full bg-[#FAF9F8] border border-gray-50 rounded-2xl px-8 py-6 text-xs font-black text-[#1D1110] focus:ring-8 focus:ring-amber-500/5 focus:outline-none appearance-none cursor-pointer transition-all disabled:opacity-50"
                                                >
                                                    <option value="">{formData.teamLeadId ? 'None / Global' : 'Select leader first'}</option>
                                                    {teams
                                                        .filter(team => team.leadId?._id === formData.teamLeadId || team.leadId === formData.teamLeadId)
                                                        .map(team => (
                                                            <option key={team._id} value={team._id}>{team.name}</option>
                                                        ))
                                                    }
                                                </select>
                                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#1D1110] transition-colors" />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                                <Bookmark className="w-3 h-3" /> Project/Client
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.relatedProject}
                                                onChange={(e) => setFormData({...formData, relatedProject: e.target.value})}
                                                className="w-full bg-[#FAF9F8] border border-gray-50 rounded-2xl px-8 py-6 text-xs font-black text-[#1D1110] focus:ring-8 focus:ring-amber-500/5 focus:outline-none transition-all placeholder-gray-300"
                                                placeholder="e.g. Website Overhaul v2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: TIMELINE & EFFORT */}
                                <div className="bg-[#FAF9F8] p-10 rounded-[2.5rem] border border-gray-50 shadow-inner space-y-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                            <Calendar className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-black text-[#1D1110] uppercase tracking-[0.3em]">Timeline</h3>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure task duration and effort</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Start Date</label>
                                            <input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-xs font-black text-[#1D1110] focus:ring-8 focus:ring-blue-500/5 focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Due Date <span className="text-red-400">*</span></label>
                                            <input
                                                type="date"
                                                value={formData.dueDate}
                                                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                                required
                                                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-xs font-black text-[#1D1110] focus:ring-8 focus:ring-blue-500/5 focus:outline-none transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Estimated Effort</label>
                                            <div className="flex bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm focus-within:ring-8 focus-within:ring-blue-500/5 transition-all">
                                                <input
                                                    type="number"
                                                    value={formData.estimatedEffort}
                                                    onChange={(e) => setFormData({...formData, estimatedEffort: e.target.value})}
                                                    className="w-full px-6 py-5 text-xs font-black text-[#1D1110] focus:outline-none"
                                                    placeholder="0"
                                                />
                                                <select
                                                    value={formData.estimatedEffortUnit}
                                                    onChange={(e) => setFormData({...formData, estimatedEffortUnit: e.target.value})}
                                                    className="bg-gray-50 px-4 text-[10px] font-black uppercase text-gray-500 border-l border-gray-100 focus:outline-none"
                                                >
                                                    <option value="hours">Hrs</option>
                                                    <option value="days">Days</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Reminder Date</label>
                                            <input
                                                type="date"
                                                value={formData.reminder}
                                                onChange={(e) => setFormData({...formData, reminder: e.target.value})}
                                                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-xs font-black text-[#1D1110] focus:ring-8 focus:ring-blue-500/5 focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: TACTICAL NOTES */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-3">
                                        <MessageSquare className="w-4 h-4" /> Additional Instructions
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        rows="4"
                                        className="w-full bg-[#FAF9F8] border border-gray-50 rounded-[2.5rem] px-10 py-8 text-sm font-bold text-[#1D1110] focus:ring-12 focus:ring-[#1D1110]/5 focus:outline-none transition-all italic leading-relaxed placeholder-gray-300 shadow-inner"
                                        placeholder="Add high-level tactical considerations for the lead..."
                                        maxLength={1000}
                                    />
                                    <div className="flex justify-end pr-8">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">{formData.notes?.length || 0} / 1000 UNITS</span>
                                    </div>
                                </div>
                                
                                {/* ATTACHMENTS (IF EDITING) */}
                                {selectedTask && (
                                    <div className="p-10 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl space-y-8 animate-in slide-in-from-top-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                                <Paperclip className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <h3 className="text-[10px] font-black text-[#1D1110] uppercase tracking-[0.3em]">Attachments</h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedTask.attachments?.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-[#FAF9F8] rounded-2xl border border-gray-50 group hover:border-[#1D1110]/20 transition-all">
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <FileText className="w-5 h-5 text-[#3E2723]" />
                                                        <span className="text-[10px] font-black text-[#1D1110] uppercase tracking-widest truncate">{file.originalName}</span>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={async () => {
                                                            if (confirm('Declassify and remove asset?')) {
                                                                await adminTasksAPI.deleteAttachment(selectedTask._id, file._id);
                                                                fetchData();
                                                            }
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-6">
                                            <label className="flex-1 flex flex-col items-center justify-center gap-4 p-10 border-4 border-dashed border-gray-100 rounded-[2.5rem] cursor-pointer hover:bg-gray-50 hover:border-amber-100 transition-all group">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all">
                                                    <Upload className="w-6 h-6 text-gray-300 group-hover:text-amber-500" />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-300 group-hover:text-[#1D1110] uppercase tracking-widest">
                                                    {uploadingFile ? 'Uploading...' : 'Upload File'}
                                                </span>
                                                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                                            </label>
                                            <button 
                                                type="button" 
                                                onClick={handleAddLink}
                                                className="flex-1 flex flex-col items-center justify-center gap-4 p-10 border-4 border-dashed border-gray-100 rounded-[2.5rem] hover:bg-gray-50 hover:border-amber-100 transition-all group"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all">
                                                    <Zap className="w-6 h-6 text-gray-300 group-hover:text-amber-500" />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-300 group-hover:text-[#1D1110] uppercase tracking-widest">Add Link</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                    {/* FOOTER (INSIDE SCROLLABLE AREA) */}
                                    <div className="py-8 border-t border-gray-100 flex items-center justify-between gap-6 relative z-10">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex items-center gap-4 px-10 py-5 bg-[#FAF9F8] text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl border border-gray-100 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all duration-300"
                                        >
                                            <X className="w-4 h-4" /> Cancel
                                        </button>
                                        
                                        <div className="flex items-center gap-6">
                                            <p className="hidden md:block text-[10px] font-black text-gray-200 uppercase tracking-widest italic">Ensure all details are correct</p>
                                            <button
                                                type="submit"
                                                className="group flex items-center gap-6 px-12 py-5 bg-[#1D1110] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-[#3E2723] transition-all duration-300 shadow-2xl hover:shadow-[#1D1110]/40 overflow-hidden relative"
                                            >
                                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                                <Save className="w-5 h-5 relative z-10" />
                                                <span className="relative z-10">{selectedTask ? 'Update Task' : 'Create Task'}</span>
                                                <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform duration-500" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            {/* PREMIUM DETAILS MODAL */}
            {showDetailsModal && selectedTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-[#1D1110]/80 backdrop-blur-xl" onClick={() => setShowDetailsModal(false)} />
                    
                    <div className="relative bg-[#FAF9F8] w-full max-w-5xl h-full lg:h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 border border-white/20">
                        
                        {/* PREMIUM MODAL HEADER */}
                        <div className="shrink-0 p-8 lg:p-10 bg-gradient-to-br from-[#1D1110] to-[#3E2723] text-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-3xl" />
                            
                            <div className="relative z-10 space-y-3">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
                                        <ClipboardList className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="h-px w-8 bg-white/20" />
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 text-[8px] font-black uppercase rounded-lg ${getStatusColor(selectedTask.status)} shadow-lg`}>
                                            {selectedTask.status}
                                        </span>
                                        <span className={`px-3 py-1 text-[8px] font-black uppercase rounded-lg ${getPriorityColor(selectedTask.priority)} shadow-lg`}>
                                            {selectedTask.priority}
                                        </span>
                                    </div>
                                </div>
                                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase leading-tight max-w-2xl">
                                    {selectedTask.title}
                                </h1>
                                <p className="text-white/40 text-[10px] font-medium tracking-widest uppercase ml-1">Task Details Review</p>
                            </div>
                            
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="relative z-10 w-14 h-14 flex items-center justify-center bg-white/10 text-white/60 rounded-2xl hover:bg-red-500 hover:text-white hover:rotate-90 transition-all duration-500 backdrop-blur-md border border-white/10 group shadow-xl"
                            >
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                            <div className="p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                                
                                {/* MAIN INTELLIGENCE COLUMN */}
                                <div className="lg:col-span-8 space-y-12">
                                    <div className="bg-[#FAF9F8] p-10 rounded-[2.5rem] border border-gray-50 shadow-inner space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#1D1110] flex items-center justify-center shadow-lg">
                                                <Target className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-black text-[#1D1110] uppercase tracking-[0.3em]">Information</h3>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Full task description and objectives</p>
                                            </div>
                                        </div>
                                        <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                            <p className="text-sm font-bold text-[#1D1110] leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
                                        </div>
                                    </div>

                                    {selectedTask.notes && (
                                        <div className="bg-amber-50/30 p-10 rounded-[2.5rem] border border-amber-100/50 space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                                    <MessageSquare className="w-5 h-5 text-white" />
                                                </div>
                                                <h3 className="text-[10px] font-black text-[#1D1110] uppercase tracking-[0.3em]">Instructions</h3>
                                            </div>
                                            <div className="p-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-amber-100 italic shadow-sm">
                                                <p className="text-sm font-bold text-[#3E2723] leading-relaxed">{selectedTask.notes}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* ATTACHMENTS & ASSETS */}
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                                    <Paperclip className="w-5 h-5 text-white" />
                                                </div>
                                                <h3 className="text-[10px] font-black text-[#1D1110] uppercase tracking-[0.3em]">Attachments</h3>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={handleAddLink}
                                                    className="p-2.5 bg-[#FAF9F8] text-[#1D1110] rounded-xl hover:bg-gray-100 transition-all border border-gray-100"
                                                >
                                                    <Zap className="w-4 h-4" />
                                                </button>
                                                <label className="p-2.5 bg-[#FAF9F8] text-[#1D1110] rounded-xl hover:bg-gray-100 transition-all border border-gray-100 cursor-pointer">
                                                    <Upload className="w-4 h-4" />
                                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedTask.attachments?.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-[#FAF9F8] rounded-2xl border border-gray-50 group hover:border-[#1D1110]/20 transition-all">
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <FileText className="w-5 h-5 text-[#3E2723]" />
                                                        <div className="flex flex-col truncate">
                                                            <span className="text-[10px] font-black text-[#1D1110] uppercase tracking-widest truncate">{file.originalName}</span>
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase">{file.fileType || 'Asset'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <a 
                                                            href={file.url} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="p-2 bg-white rounded-lg text-[#1D1110] hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            {file.fileType === 'link' ? <Eye className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                                        </a>
                                                        <button 
                                                            onClick={async () => {
                                                                if (confirm('Declassify and remove asset?')) {
                                                                    await adminTasksAPI.deleteAttachment(selectedTask._id, file._id);
                                                                    fetchData();
                                                                }
                                                            }}
                                                            className="p-2 bg-white rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* SIDEBAR METADATA COLUMN */}
                                <div className="lg:col-span-4 space-y-8">
                                    {/* PERSONNEL CARD */}
                                    <div className="p-8 bg-[#FAF9F8] rounded-[2.5rem] border border-gray-50 shadow-inner space-y-8 text-center">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Designated Leadership</p>
                                            <div className="relative inline-block">
                                                <div className="w-24 h-24 bg-gradient-to-br from-[#1D1110] to-[#3E2723] rounded-full mx-auto flex items-center justify-center text-white font-black text-3xl border-8 border-white shadow-2xl">
                                                    {selectedTask.assignedTo?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-8 h-8 bg-amber-500 rounded-full border-4 border-white flex items-center justify-center">
                                                    <CheckCircle className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-[#1D1110] uppercase tracking-tighter">{selectedTask.assignedTo?.name}</h4>
                                                <p className="text-[10px] font-black text-[#3E2723]/40 uppercase tracking-widest mt-1">{selectedTask.teamId?.name || 'General Projects'}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                                <Calendar className="w-4 h-4 text-blue-600 mx-auto mb-2" />
                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Due Date</p>
                                                <p className="text-[10px] font-black text-[#1D1110]">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                                            </div>
                                            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                                <Clock className="w-4 h-4 text-amber-500 mx-auto mb-2" />
                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Load</p>
                                                <p className="text-[10px] font-black text-[#1D1110]">{selectedTask.estimatedEffort || 0} {selectedTask.estimatedEffortUnit || 'Hrs'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PROGRESS CARD */}
                                    <div className="p-8 bg-[#1D1110] rounded-[2.5rem] shadow-2xl space-y-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Task Progress</p>
                                            <p className="text-xl font-black text-white">{selectedTask.progressPercentage || 0}%</p>
                                        </div>
                                        <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/10">
                                            <div 
                                                className="h-full bg-gradient-to-r from-amber-500 to-amber-200 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all duration-1000"
                                                style={{ width: `${selectedTask.progressPercentage || 0}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">
                                            <span>Started</span>
                                            <span>Completed</span>
                                        </div>
                                    </div>

                                    {/* METADATA TAGS */}
                                    <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex flex-col group">
                                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1 group-hover:text-amber-500 transition-colors">Category</span>
                                                <span className="text-[10px] font-black text-[#1D1110] uppercase tracking-widest">{selectedTask.category || 'General'}</span>
                                            </div>
                                            <div className="h-px bg-gray-50" />
                                            <div className="flex flex-col group">
                                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1 group-hover:text-amber-500 transition-colors">Project</span>
                                                <span className="text-[10px] font-black text-[#1D1110] uppercase tracking-widest">{selectedTask.relatedProject || 'General'}</span>
                                            </div>
                                            <div className="h-px bg-gray-50" />
                                            <div className="flex flex-col group">
                                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1 group-hover:text-amber-500 transition-colors">Assigned By</span>
                                                <span className="text-[10px] font-black text-[#1D1110] uppercase tracking-widest">{selectedTask.assignedBy?.name || 'Administrator'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* MODERN PREMIUM FOOTER (INSIDE SCROLLABLE AREA) */}
                                <div className="shrink-0 py-10 border-t border-gray-100 bg-white flex items-center justify-between gap-6 relative z-10">
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        className="flex items-center gap-4 px-10 py-5 bg-[#FAF9F8] text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl border border-gray-100 hover:text-[#1D1110] hover:bg-gray-100 transition-all duration-500"
                                    >
                                        <ArrowRight className="w-4 h-4 rotate-180" /> Close
                                    </button>
                                    
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => { setShowDetailsModal(false); handleEditTask(selectedTask); }}
                                            className="px-10 py-5 bg-[#1D1110] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-[#3E2723] transition-all duration-500 shadow-2xl hover:shadow-[#1D1110]/40 flex items-center gap-4"
                                        >
                                            <Edit className="w-4 h-4" /> Edit
                                        </button>
                                        <button
                                            onClick={() => setShowDetailsModal(false)}
                                            className="px-12 py-5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-amber-600 transition-all duration-500 shadow-2xl shadow-amber-500/20"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AdminTaskAssignment;
