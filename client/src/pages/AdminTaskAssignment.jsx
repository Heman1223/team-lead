import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Calendar, Clock, AlertCircle, CheckCircle, X, Search, Target, User, Users, Briefcase, TrendingUp, Filter, Eye, Edit, Trash2, FileText, Paperclip, Upload, Download } from 'lucide-react';
import { adminTasksAPI } from '../services/adminApi';
import Layout from '../components/Layout';

const AdminTaskAssignment = () => {
    const [tasks, setTasks] = useState([]);
    const [teamLeads, setTeamLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [formData, setFormData] = useState({
        // Basic Info
        title: '',
        description: '',
        detailedDescription: '',
        clientRequirements: '',
        projectScope: '',
        category: 'development',
        priority: 'medium',
        
        // Ownership
        teamLeadId: '',
        taskType: 'one_time',
        
        // Timeline
        startDate: '',
        dueDate: '',
        estimatedEffort: '',
        estimatedEffortUnit: 'hours',
        deadlineType: 'soft',
        
        // Additional
        notes: ''
    });
    const [activeTab, setActiveTab] = useState('overview');
    const [uploadingFile, setUploadingFile] = useState(false);

    useEffect(() => {
        fetchData();
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

             // Refresh selected task if details modal is open
            if (selectedTask) {
                const updated = (tasksRes.data.data || []).find(t => t._id === selectedTask._id);
                if (updated) setSelectedTask(updated);
            }
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
            detailedDescription: '',
            clientRequirements: '',
            projectScope: '',
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
        setActiveTab('overview');
        setShowModal(true);
    };

    const handleEditTask = (task) => {
        setFormData({
            title: task.title,
            description: task.description || '',
            detailedDescription: task.detailedDescription || '',
            clientRequirements: task.clientRequirements || '',
            projectScope: task.projectScope || '',
            category: task.category || 'development',
            priority: task.priority,
            teamLeadId: task.assignedTo?._id || '',
            taskType: task.taskType || 'one_time',
            startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            estimatedEffort: task.estimatedEffort || '',
            estimatedEffortUnit: task.estimatedEffortUnit || 'hours',
            deadlineType: task.deadlineType || 'soft',
            notes: task.notes || ''
        });
        setSelectedTask(task);
        setActiveTab('overview');
        setShowDetailsModal(false);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title || !formData.dueDate || !formData.teamLeadId) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            if (selectedTask && showModal) {
                await adminTasksAPI.updateTask(selectedTask._id, formData);
                alert('✅ Task updated successfully!');
            } else {
                await adminTasksAPI.assignToTeamLead(formData);
                alert('✅ Task assigned successfully!');
            }
            setShowModal(false);
            setSelectedTask(null);
            fetchData();
        } catch (error) {
            console.error('Error saving task:', error);
            alert('❌ ' + (error.response?.data?.message || 'Failed to save task'));
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
        
        try {
            await adminTasksAPI.deleteTask(taskId);
            alert('✅ Task deleted successfully!');
            setShowDetailsModal(false);
            setSelectedTask(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('❌ Failed to delete task');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setUploadingFile(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result;
                
                await adminTasksAPI.uploadAttachment(selectedTask._id, {
                    fileName: file.name,
                    fileUrl: base64String,
                    fileType: file.type,
                    fileSize: file.size,
                    originalName: file.name
                });

                alert('✅ File uploaded successfully');
                fetchData();
            };
            reader.readAsDataURL(file);
        } catch (err) {
            alert('❌ Failed to upload file');
        } finally {
            setUploadingFile(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!confirm('Are you sure you want to delete this attachment?')) return;
        try {
            await adminTasksAPI.deleteAttachment(selectedTask._id, attachmentId);
            alert('✅ Attachment deleted');
            fetchData();
        } catch (err) {
            alert('❌ Failed to delete attachment');
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

    if (loading) {
        return (
            <Layout title="Task Assignment">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading tasks...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <>
        <Layout title="Task Assignment">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 mt-1">Assign high-level tasks to team leads</p>
                    </div>
                    <button
                        onClick={handleCreateTask}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        Assign New Task
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Tasks</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{tasks.length}</p>
                            </div>
                            <div className="p-4 bg-blue-100 rounded-xl">
                                <ClipboardList className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Not Started</p>
                                <p className="text-3xl font-bold text-gray-600 mt-2">
                                    {tasks.filter(t => t.status === 'not_started').length}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-100 rounded-xl">
                                <Clock className="w-8 h-8 text-gray-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">In Progress</p>
                                <p className="text-3xl font-bold text-blue-600 mt-2">
                                    {tasks.filter(t => t.status === 'in_progress').length}
                                </p>
                            </div>
                            <div className="p-4 bg-blue-100 rounded-xl">
                                <TrendingUp className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Completed</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {tasks.filter(t => t.status === 'completed').length}
                                </p>
                            </div>
                            <div className="p-4 bg-green-100 rounded-xl">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Overdue</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">
                                    {tasks.filter(t => t.isOverdue).length}
                                </p>
                            </div>
                            <div className="p-4 bg-red-100 rounded-xl">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-6 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white font-medium"
                        >
                            <option value="all">All Status</option>
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-6 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white font-medium"
                        >
                            <option value="all">All Priority</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>

                {/* Tasks Grid */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-orange-600" />
                        Assigned Tasks ({filteredTasks.length})
                    </h2>

                    {filteredTasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTasks.map(task => (
                                <div 
                                    key={task._id} 
                                    className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 group relative flex flex-col h-full hover:border-orange-200"
                                >
                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                            title="Edit Task"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                            title="Delete Task"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div 
                                        onClick={() => { setSelectedTask(task); setShowDetailsModal(true); }}
                                        className="cursor-pointer flex-1 flex flex-col"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-orange-50 transition-colors duration-300">
                                                <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                                            </div>
                                            <div className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${getPriorityColor(task.priority)}`}>
                                                {task.priority?.toUpperCase()}
                                            </div>
                                        </div>

                                        <div className="mb-4 flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                                {task.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                <Briefcase className="w-3.5 h-3.5" />
                                                <span>Lead: <span className="font-semibold text-gray-700">{task.assignedTo?.name}</span></span>
                                            </div>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                                                {task.description || 'No description provided'}
                                            </p>
                                            {(task.clientRequirements || task.detailedDescription) && (
                                                <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                                                    <FileText className="w-3 h-3" />
                                                    <span>Detailed requirements attached</span>
                                                </div>
                                            )}
                                            {task.attachments && task.attachments.length > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-green-600 font-medium mt-1">
                                                    <Paperclip className="w-3 h-3" />
                                                    <span>{task.attachments.length} file(s) attached</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4 mt-auto">
                                            <div>
                                                <div className="flex items-center justify-between text-xs mb-1.5">
                                                    <span className="text-gray-600 font-medium">Progress</span>
                                                    <span className={`font-bold ${
                                                        task.progressPercentage === 100 ? 'text-green-600' : 'text-gray-900'
                                                    }`}>{task.progressPercentage || 0}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className={`h-2 rounded-full transition-all duration-500 ${
                                                            task.progressPercentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-orange-500 to-orange-600'
                                                        }`}
                                                        style={{ width: `${task.progressPercentage || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(task.dueDate || task.deadline).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Users className="w-4 h-4" />
                                                    <span>{task.subtasks?.length || 0} Subtasks</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between gap-2 pt-2">
                                               <span className={`px-3 py-1 text-xs font-semibold rounded-lg border w-full text-center ${getStatusColor(task.status)}`}>
                                                    {task.status?.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <ClipboardList className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                            <p className="text-gray-600 mb-6">Start by assigning a task to a team lead.</p>
                            <button
                                onClick={handleCreateTask}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-semibold transition-all shadow-md hover:shadow-lg"
                            >
                                <Plus className="w-5 h-5" />
                                Assign First Task
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>

        {/* Task Details Modal */}
        {showDetailsModal && selectedTask && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <ClipboardList className="w-6 h-6" />
                                Task Details & Subtasks
                            </h3>
                            <button onClick={() => setShowDetailsModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        {/* Task Header Info */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-3xl">{getCategoryIcon(selectedTask.category)}</span>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h2>
                                    {selectedTask.isOverdue && (
                                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 animate-pulse">
                                            OVERDUE
                                        </span>
                                    )}
                                </div>
                                
                                <p className="text-gray-600 mb-4 text-base leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    {selectedTask.description || 'No description provided.'}
                                </p>

                                <div className="flex items-center gap-6 flex-wrap bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Briefcase className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">Assigned To (Lead)</p>
                                            <p className="font-semibold text-gray-900">{selectedTask.assignedTo?.name || 'Unassigned'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Calendar className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">Due Date</p>
                                            <p className="font-semibold text-gray-900">{new Date(selectedTask.dueDate || selectedTask.deadline).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Clock className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">Effort</p>
                                            <p className="font-semibold text-gray-900">{selectedTask.estimatedEffort || 0} {selectedTask.estimatedEffortUnit || 'hours'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 ml-6">
                                <div className={`px-4 py-2 text-sm font-bold rounded-xl border text-center shadow-sm ${getPriorityColor(selectedTask.priority)}`}>
                                    {selectedTask.priority?.toUpperCase()} PRIORITY
                                </div>
                                <div className={`px-4 py-2 text-sm font-bold rounded-xl border text-center shadow-sm ${getStatusColor(selectedTask.status)}`}>
                                    {selectedTask.status?.replace('_', ' ').toUpperCase()}
                                </div>
                            </div>
                        </div>

                        {/* Progress Section */}
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-gray-700" />
                                    <h4 className="text-lg font-bold text-gray-900">Overall Progress</h4>
                                </div>
                                <span className={`text-2xl font-black ${
                                    selectedTask.progressPercentage === 100 ? 'text-green-600' : 'text-orange-600'
                                }`}>{selectedTask.progressPercentage || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden">
                                <div 
                                    className={`h-4 rounded-full transition-all duration-700 ${
                                        selectedTask.progressPercentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-orange-500 to-orange-600'
                                    }`}
                                    style={{ width: `${selectedTask.progressPercentage || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Subtasks Section */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="w-6 h-6 text-orange-600" />
                                    Subtasks Created by Lead ({selectedTask.subtasks?.length || 0})
                                </h4>
                            </div>

                            {selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {selectedTask.subtasks.map(subtask => (
                                        <div key={subtask._id} className="group flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={`w-4 h-4 flex-shrink-0 rounded-full ring-4 ring-opacity-20 ${
                                                    subtask.status === 'completed' ? 'bg-green-500 ring-green-500' :
                                                    subtask.status === 'in_progress' ? 'bg-blue-500 ring-blue-500' :
                                                    'bg-gray-400 ring-gray-400'
                                                }`}></div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <p className="font-bold text-gray-900 text-lg">{subtask.title}</p>
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusColor(subtask.status)}`}>
                                                            {subtask.status?.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    
                                                    {subtask.description && (
                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{subtask.description}</p>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                                                        <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                                            <User className="w-3.5 h-3.5 text-gray-500" />
                                                            <span className="text-gray-600">Assigned to:</span>
                                                            <span className="font-bold text-gray-900">{subtask.assignedTo?.name || 'Unassigned'}</span>
                                                        </div>
                                                        
                                                        {/* Progress Bar for Subtask */}
                                                        <div className="flex-1 min-w-[200px]">
                                                            <div className="flex items-center justify-between text-xs mb-1">
                                                                <span className="text-gray-600 font-medium">Progress</span>
                                                                <span className={`font-bold ${
                                                                    subtask.progressPercentage === 100 ? 'text-green-600' : 'text-orange-600'
                                                                }`}>{subtask.progressPercentage || 0}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                <div 
                                                                    className={`h-2 rounded-full transition-all duration-500 ${
                                                                        subtask.progressPercentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                                                    }`}
                                                                    style={{ width: `${subtask.progressPercentage || 0}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* EOD Reports Count */}
                                                        {subtask.eodReports && subtask.eodReports.length > 0 && (
                                                            <div className="flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                                                                <FileText className="w-3 h-3 text-blue-600" />
                                                                <span className="text-blue-700 font-semibold">{subtask.eodReports.length} EOD Report{subtask.eodReports.length > 1 ? 's' : ''}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                                    <Target className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                    <p className="text-gray-600 font-medium mb-1">No subtasks created yet</p>
                                    <p className="text-sm text-gray-500">The assigned Team Lead has not broken this task down yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Create Task Modal */}
        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus className="w-6 h-6" />
                                Assign New Task to Team Lead
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                        {/* Basic Task Info */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-bold text-gray-900 border-b pb-2">📋 Basic Task Information</h4>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Task Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., Develop User Authentication Module"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Task Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Detailed description of the task objectives and requirements..."
                                    rows="4"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="development">💻 Development</option>
                                        <option value="testing">🧪 Testing</option>
                                        <option value="research">🔬 Research</option>
                                        <option value="design">🎨 Design</option>
                                        <option value="documentation">📝 Documentation</option>
                                        <option value="meeting">👥 Meeting</option>
                                        <option value="review">👀 Review</option>
                                        <option value="deployment">🚀 Deployment</option>
                                        <option value="maintenance">🔧 Maintenance</option>
                                        <option value="other">📋 Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Priority <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="low">🟢 Low</option>
                                        <option value="medium">🟡 Medium</option>
                                        <option value="high">🟠 High</option>
                                        <option value="critical">🔴 Critical</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Ownership & Scope */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-bold text-gray-900 border-b pb-2">👥 Ownership & Scope</h4>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Assign to Team Lead <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.teamLeadId}
                                    onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                    required
                                >
                                    <option value="">Select Team Lead</option>
                                    {teamLeads.map(lead => (
                                        <option key={lead._id} value={lead._id}>
                                            {lead.name} {lead.teamId ? `- ${lead.teamId.name}` : ''} {lead.coreField ? `(${lead.coreField})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">Team lead will break this down into subtasks for team members</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Task Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.taskType}
                                    onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                    required
                                >
                                    <option value="one_time">One-time Task</option>
                                    <option value="daily">Daily Task</option>
                                    <option value="weekly">Weekly Task</option>
                                    <option value="monthly">Monthly Task</option>
                                </select>
                            </div>
                        </div>

                        {/* Timeline Control */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-bold text-gray-900 border-b pb-2">📅 Timeline Control</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Due Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Estimated Effort
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.estimatedEffort}
                                        onChange={(e) => setFormData({ ...formData, estimatedEffort: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="e.g., 40"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Effort Unit
                                    </label>
                                    <select
                                        value={formData.estimatedEffortUnit}
                                        onChange={(e) => setFormData({ ...formData, estimatedEffortUnit: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                    >
                                        <option value="hours">Hours</option>
                                        <option value="days">Days</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Deadline Type
                                </label>
                                <select
                                    value={formData.deadlineType}
                                    onChange={(e) => setFormData({ ...formData, deadlineType: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                >
                                    <option value="soft">Soft Deadline (Flexible)</option>
                                    <option value="strict">Strict Deadline (Must meet)</option>
                                </select>
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-bold text-gray-900 border-b pb-2">📝 Additional Information</h4>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Notes / Instructions
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Any additional notes or special instructions..."
                                    rows="3"
                                />
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                            >
                                Assign Task
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
};

export default AdminTaskAssignment;
