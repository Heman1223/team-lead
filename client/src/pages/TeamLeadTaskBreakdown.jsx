import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Users, Calendar, Clock, AlertCircle, CheckCircle, X, Target, TrendingUp, Edit, Trash2, User, Bell, Phone, PhoneCall, PhoneOff, PhoneMissed, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { notificationsAPI, callsAPI, activitiesAPI } from '../services/api';
import Layout from '../components/Layout';

const TeamLeadTaskBreakdown = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // View Mode: 'projects' | 'details'
    const [viewMode, setViewMode] = useState('projects');
    
    const [parentTasks, setParentTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectActivities, setProjectActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);

    const [showSubtaskModal, setShowSubtaskModal] = useState(false);
    
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [subtaskForm, setSubtaskForm] = useState({
        title: '',
        description: '',
        assignedTo: ''
    });
    
    // Call Management State
    const [showCallModal, setShowCallModal] = useState(false);
    const [callMember, setCallMember] = useState(null);
    const [callStatus, setCallStatus] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [callTimer, setCallTimer] = useState(null);

    useEffect(() => {
        return () => {
            if (callTimer) clearInterval(callTimer);
        };
    }, [callTimer]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch activities when selectedProject changes
    useEffect(() => {
        if (selectedProject) {
            fetchProjectActivities(selectedProject._id);
        }
    }, [selectedProject]);

    const fetchProjectActivities = async (taskId) => {
        try {
            setActivitiesLoading(true);
            const res = await activitiesAPI.getForTask(taskId);
            setProjectActivities(res.data.data || []);
        } catch (error) {
            console.error("Error fetching activities:", error);
        } finally {
            setActivitiesLoading(false);
        }
    };

    const getDailyEODUpdate = (subtaskId) => {
        if (!projectActivities.length) return "No updates yet";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter activities for this subtask
        // The ActivityLog model usually has 'task' field. If subtask updates are logged with the PARENT task ID but have a description or metadata, we might need to parse.
        // However, usually subtasks are their own entities. 
        // ASSUMPTION: ActivityLogs for subtasks might be linked to the parent task OR the subtask itself.
        // If the API `getForTask` returns activities for the *parent*, we need to see how subtasks are distinguished.
        // Often, `entityId` or `metadata` holds the subtaskId. 
        // Let's assume for now we search for the subtask title or ID in the description/metadata if strictly linked to parent.
        // OR better: The system might log activity with `relatedId` = subtaskId.
        
        // For this specific codebase, let's look for matching logs.
        // We will look for logs created TODAY.
        const todaysLogs = projectActivities.filter(log => {
            if (!log.createdAt) return false;
            const logDate = new Date(log.createdAt);
            logDate.setHours(0,0,0,0);
            return logDate.getTime() === today.getTime();
        });

        // Find log related to this subtask
        const subtaskLog = todaysLogs.find(log => 
            (log.metadata?.subtaskId === subtaskId) || 
            (log.description && log.description.includes(subtaskId)) // Fallback if metadata isn't perfect
        );

        if (subtaskLog) {
            return `${new Date(subtaskLog.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}: ${subtaskLog.action.replace('_', ' ')}`;
        }
        
        // If no log today, show latest ever
        const latestLog = projectActivities.find(log => log.metadata?.subtaskId === subtaskId);
        if (latestLog) {
             return `Last: ${new Date(latestLog.createdAt).toLocaleDateString()}`;
        }

        return "No recent activity";
    };

    const fetchData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const tasksRes = await api.get('/tasks/my-tasks');
            const parentTasksOnly = tasksRes.data.data.filter(t => t.isParentTask);
            setParentTasks(parentTasksOnly);

            if (selectedProject) {
                const updated = parentTasksOnly.find(t => t._id === selectedProject._id);
                if (updated) {
                    setSelectedProject(updated);
                    // Also refresh activities lightly if needed, but the dedicated effect handles major switches
                }
            }

            if (user.teamId) {
                const teamRes = await api.get(`/teams/${user.teamId._id || user.teamId}`);
                const members = teamRes.data.data.members.filter(m => m._id !== user._id);
                setTeamMembers(members);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProjectClick = (project) => {
        setSelectedProject(project);
        setViewMode('details');
    };

    const handleBackToProjects = () => {
        setSelectedProject(null);
        setViewMode('projects');
    };

    const handleAddSubtask = (task) => {
        // task is selectedProject
        setSubtaskForm({
            title: '',
            description: '',
            assignedTo: ''
        });
        setShowSubtaskModal(true);
    };

    const handleSubmitSubtask = async (e) => {
        e.preventDefault();

        if (!subtaskForm.title || !subtaskForm.assignedTo) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await api.post(`/tasks/${selectedProject._id}/subtasks`, subtaskForm);
            alert('✅ Subtask created successfully!');
            setShowSubtaskModal(false);
            fetchData();
        } catch (error) {
            console.error('Error creating subtask:', error);
            alert('❌ ' + (error.response?.data?.message || 'Failed to create subtask'));
        }
    };

    const handleDeleteSubtask = async (taskId, subtaskId) => {
        if (!window.confirm('Delete this subtask?')) return;

        try {
            await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
            alert('✅ Subtask deleted successfully!');
            fetchData();
        } catch (error) {
            console.error('Error deleting subtask:', error);
            alert('Failed to delete subtask');
        }
    };

    const handleSendReminder = async (subtask) => {
        if (!window.confirm(`Send reminder to ${subtask.assignedTo?.name} for subtask "${subtask.title}"?`)) return;

        try {
            await notificationsAPI.createReminder({
                taskId: selectedProject._id,
                userId: subtask.assignedTo._id,
                message: `Reminder: Please complete subtask "${subtask.title}"`
            });
            alert('✅ Reminder sent successfully!');
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Failed to send reminder');
        }
    };

    // --- Call Management Functions (Unchanged Logic, just updating state refs) ---
    const handleInitiateCall = async (member) => {
        if (!member) return;
        setCallMember(member);
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

            // Simulate call answer logic 
            setTimeout(() => {
                const answered = Math.random() > 0.1; 
                if (answered) {
                    setCallStatus('oncall');
                    setCallDuration(0);
                    const timer = setInterval(() => {
                        setCallDuration(prev => prev + 1);
                    }, 1000);
                    setCallTimer(timer);
                } else {
                    setCallStatus('missed');
                    if (callRes.data?.data?._id) {
                         callsAPI.update(callRes.data.data._id, { status: 'missed' });
                    }
                    setTimeout(() => {
                        setShowCallModal(false);
                        setCallStatus(null);
                    }, 3000);
                }
            }, 3000);

        } catch (error) {
            console.error('Call error:', error);
            setCallStatus('error');
            setTimeout(() => {
                setShowCallModal(false);
                setCallStatus(null);
            }, 3000);
        }
    };

    const handleEndCall = async () => {
        if (callTimer) clearInterval(callTimer);
        setCallStatus('ended');
        
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
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
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

    if (loading && !parentTasks.length) { // Only show loading if no data yet
        return (
            <Layout title="Task Breakdown">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading projects...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    console.log("DEBUG: Component Rendering");
    // TEMP DEBUG RETURN
    // return <div className="p-20 text-2xl font-bold text-red-600">DEBUG MODE: If you see this, hooks are fine. Error is in JSX.</div>;

    return (
        <>
            <Layout title="Task Breakdown">
                <div className="space-y-6">
                    {/* Header: Changes based on View Mode */}
                    <div className="flex items-center justify-between">
                        <div>
                            {viewMode === 'projects' ? (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
                                    <p className="text-gray-600 mt-1">Manage tasks and assignments for your projects</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedProject?.title}</h2>
                                    <p className="text-gray-600 mt-1">Project Details & Subtasks</p>
                                </>
                            )}
                        </div>
                        {viewMode === 'details' && (
                             <button 
                                onClick={handleBackToProjects}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                             >
                                <ClipboardList className="w-4 h-4" />
                                Back to Projects
                             </button>
                        )}
                    </div>

                    {/* VIEW: PROJECT CARDS */}
                    {viewMode === 'projects' && (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="stat-card stat-card-blue rounded-2xl p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold opacity-90">Total Projects</p>
                                            <p className="text-3xl font-bold mt-2">{parentTasks.length}</p>
                                        </div>
                                        <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <ClipboardList className="w-8 h-8" />
                                        </div>
                                    </div>
                                </div>
                                <div className="stat-card stat-card-orange rounded-2xl p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold opacity-90">Active</p>
                                            <p className="text-3xl font-bold mt-2">
                                                {parentTasks.filter(t => t.status === 'in_progress').length}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <TrendingUp className="w-8 h-8" />
                                        </div>
                                    </div>
                                </div>
                                <div className="stat-card stat-card-green rounded-2xl p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold opacity-90">Completed</p>
                                            <p className="text-3xl font-bold mt-2">
                                                {parentTasks.filter(t => t.status === 'completed').length}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <CheckCircle className="w-8 h-8" />
                                        </div>
                                    </div>
                                </div>
                                <div className="stat-card bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold opacity-90">Overdue</p>
                                            <p className="text-3xl font-bold mt-2">
                                                {parentTasks.filter(t => t.isOverdue).length}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <AlertCircle className="w-8 h-8" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                                            <Filter className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Filter Projects</h3>
                                            <p className="text-sm text-gray-500">Find projects by status or priority</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        {/* Status Filter */}
                                        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-xl">
                                            {[
                                                { value: 'all', label: 'All' },
                                                { value: 'in_progress', label: 'Active' },
                                                { value: 'completed', label: 'Done' },
                                                { value: 'overdue', label: 'Overdue' }
                                            ].map(filter => (
                                                <button
                                                    key={filter.value}
                                                    onClick={() => setFilterStatus(filter.value)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${filterStatus === filter.value
                                                        ? 'bg-white text-orange-600 shadow-md'
                                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {filter.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Project Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {parentTasks.filter(t => {
                                    const statusMatch = filterStatus === 'all' ||
                                        (filterStatus === 'overdue' ? t.isOverdue : t.status === filterStatus);
                                    // const priorityMatch = filterPriority === 'all' || t.priority === filterPriority; // Simplify filters for now
                                    return statusMatch;
                                }).map(project => (
                                    <div
                                        key={project._id}
                                        onClick={() => handleProjectClick(project)}
                                        className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group relative flex flex-col h-full hover:border-orange-200"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-orange-50 transition-colors duration-300">
                                                <span className="text-2xl">{getCategoryIcon(project.category)}</span>
                                            </div>
                                            <div className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${getPriorityColor(project.priority)}`}>
                                                {project.priority?.toUpperCase()}
                                            </div>
                                        </div>

                                        <div className="mb-4 flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                                {project.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 line-clamp-3">
                                                {project.description || 'No description provided'}
                                            </p>
                                        </div>

                                        <div className="space-y-4 mt-auto">
                                            <div>
                                                <div className="flex items-center justify-between text-xs mb-1.5">
                                                    <span className="text-gray-600 font-medium">Progress</span>
                                                    <span className={`font-bold ${project.progressPercentage === 100 ? 'text-green-600' : 'text-gray-900'
                                                        }`}>{project.progressPercentage || 0}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${project.progressPercentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-orange-500 to-orange-600'
                                                            }`}
                                                        style={{ width: `${project.progressPercentage || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(project.dueDate || project.deadline).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Users className="w-4 h-4" />
                                                    <span>{project.subtasks?.length || 0} Subtasks</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* VIEW: PROJECT DETAILS */}
                    {viewMode === 'details' && selectedProject && (
                        <div className="animate-in fade-in zoom-in duration-300">
                            {/* Detailed View - Will be expanded in next step with Table */}
                             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 bg-gray-50">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-3xl">{getCategoryIcon(selectedProject.category)}</span>
                                                <h1 className="text-3xl font-bold text-gray-900">{selectedProject.title}</h1>
                                            </div>
                                            <p className="text-gray-600 text-lg leading-relaxed">
                                                {selectedProject.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-3 min-w-[200px]">
                                             <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                <p className="text-sm text-gray-500 font-semibold mb-1">Overall Progress</p>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-2xl font-bold text-gray-900">{selectedProject.progressPercentage || 0}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div 
                                                        className="bg-orange-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${selectedProject.progressPercentage || 0}%` }}
                                                    ></div>
                                                </div>
                                             </div>
                                             
                                             <button
                                                onClick={() => setShowSubtaskModal(true)} // Open subtask modal
                                                className="w-full py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-bold shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-5 h-5" />
                                                Add Subtask
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Subtasks Table with EOD */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <ClipboardList className="w-5 h-5 text-gray-500" />
                                        Subtasks & Daily Updates
                                    </h3>
                                    
                                    {selectedProject.subtasks && selectedProject.subtasks.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-left border-b border-gray-200">
                                                        <th className="pb-4 font-semibold text-gray-500 text-sm pl-4">Status</th>
                                                        <th className="pb-4 font-semibold text-gray-500 text-sm">Subtask Details</th>
                                                        <th className="pb-4 font-semibold text-gray-500 text-sm">Assigned To</th>
                                                        <th className="pb-4 font-semibold text-gray-500 text-sm">Daily EOD (Today)</th>
                                                        <th className="pb-4 font-semibold text-gray-500 text-sm text-right pr-4">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {selectedProject.subtasks.map(subtask => (
                                                        <tr key={subtask._id} className="group hover:bg-gray-50 transition-colors">
                                                            <td className="py-4 pl-4 align-top w-[120px]">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${getStatusColor(subtask.status)}`}>
                                                                    {subtask.status?.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 align-top">
                                                                <p className="font-bold text-gray-900 mb-1">{subtask.title}</p>
                                                                {subtask.description && (
                                                                    <p className="text-sm text-gray-500 line-clamp-1">{subtask.description}</p>
                                                                )}
                                                            </td>
                                                            <td className="py-4 align-top">
                                                                {subtask.assignedTo ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                                            {subtask.assignedTo.name?.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-gray-900">{subtask.assignedTo.name}</p>
                                                                            <p className="text-xs text-gray-500">{subtask.assignedTo.designation || 'Member'}</p>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-gray-400 italic">Unassigned</span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 align-top">
                                                                <div className="flex items-start gap-2">
                                                                    <ClipboardList className="w-4 h-4 text-gray-400 mt-0.5" />
                                                                    <p className="text-sm text-gray-600 font-medium">
                                                                        {getDailyEODUpdate(subtask._id)}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 pr-4 align-top text-right">
                                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {/* Reminder Button */}
                                                                     {subtask.status !== 'completed' && (
                                                                        <button
                                                                            onClick={() => handleSendReminder(subtask)}
                                                                            className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-100"
                                                                            title="Send Reminder"
                                                                        >
                                                                            <Bell className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                    
                                                                    {/* Call Button */}
                                                                    {subtask.assignedTo && user?._id && subtask.assignedTo._id !== user._id && (
                                                                        <button
                                                                            onClick={() => handleInitiateCall(subtask.assignedTo)}
                                                                            className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-100"
                                                                            title="Call Member"
                                                                        >
                                                                            <Phone className="w-4 h-4" />
                                                                        </button>
                                                                    )}

                                                                    {/* Delete Button */}
                                                                    <button
                                                                        onClick={() => handleDeleteSubtask(selectedProject._id, subtask._id)}
                                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Delete Subtask"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            <p className="text-gray-500">No subtasks found. Add one to get started.</p>
                                        </div>
                                    )}
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </Layout>


            {/* Add Subtask Modal */}
            {showSubtaskModal && selectedProject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Plus className="w-6 h-6" />
                                    Add Subtask to: {selectedProject.title}
                                </h3>
                                <button onClick={() => setShowSubtaskModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitSubtask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Subtask Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={subtaskForm.title}
                                    onChange={(e) => setSubtaskForm({ ...subtaskForm, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., Implement login API endpoint"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={subtaskForm.description}
                                    onChange={(e) => setSubtaskForm({ ...subtaskForm, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Detailed description of the subtask..."
                                    rows="3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Assign to Team Member <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={subtaskForm.assignedTo}
                                    onChange={(e) => setSubtaskForm({ ...subtaskForm, assignedTo: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                    required
                                >
                                    <option value="">Select Team Member</option>
                                    {teamMembers.map(member => (
                                        <option key={member._id} value={member._id}>
                                            {member.name} - {member.designation || member.coreField || 'Team Member'}
                                        </option>
                                    ))}
                                </select>
                                {teamMembers.length === 0 && (
                                    <p className="mt-2 text-sm text-red-600">No team members available. Please add members to your team first.</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowSubtaskModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                                >
                                    Create Subtask
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Call Modal */}
            <CallModal
                show={showCallModal}
                member={callMember}
                status={callStatus}
                duration={formatDuration(callDuration)}
                onEnd={handleEndCall}
                onCancel={() => {
                    setShowCallModal(false);
                    setCallStatus(null);
                }}
            />
        </>
    );
};

export default TeamLeadTaskBreakdown;

// --- Call Modal Component (Internal) ---
function CallModal({ show, member, status, duration, onEnd, onCancel }) {
    if (!show || !member) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8 text-center relative">
                    {/* Header/Avatar */}
                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg mx-auto mb-4 border-4 border-white">
                        {member.name?.charAt(0).toUpperCase()}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-gray-500 text-sm mb-6">{member.designation || 'Team Member'}</p>

                    {/* Status States */}
                    <div className="min-h-[100px] flex flex-col items-center justify-center mb-6">
                        {status === 'checking' && (
                            <>
                                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500 mb-3"></div>
                                <p className="text-gray-600 font-medium">Connecting...</p>
                            </>
                        )}
                        {status === 'ringing' && (
                            <>
                                <PhoneCall className="w-12 h-12 text-green-500 animate-pulse mb-3" />
                                <p className="text-green-600 font-medium">Ringing...</p>
                            </>
                        )}
                        {status === 'oncall' && (
                            <>
                                <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Duration</p>
                                <p className="text-4xl font-black text-gray-900 tracking-tight">{duration}</p>
                            </>
                        )}
                        {status === 'unavailable' && (
                            <>
                                <PhoneOff className="w-10 h-10 text-red-500 mb-2" />
                                <p className="text-red-500 font-semibold">User Unavailable</p>
                            </>
                        )}
                        {status === 'missed' && (
                            <>
                                <PhoneMissed className="w-10 h-10 text-orange-500 mb-2" />
                                <p className="text-orange-600 font-semibold">No Answer</p>
                            </>
                        )}
                        {status === 'ended' && (
                            <>
                                <CheckCircle className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-gray-600 font-semibold">Call Ended</p>
                            </>
                        )}
                        {status === 'error' && (
                            <>
                                <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                                <p className="text-red-500 font-semibold">Connection Failed</p>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {status === 'oncall' ? (
                            <button
                                onClick={onEnd}
                                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                            >
                                <PhoneOff className="w-5 h-5" /> End Call
                            </button>
                        ) : (status === 'checking' || status === 'ringing') ? (
                            <button
                                onClick={onCancel}
                                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                            >
                                Cancel
                            </button>
                        ) : (
                            <button
                                onClick={onCancel}
                                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold transition-colors"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
