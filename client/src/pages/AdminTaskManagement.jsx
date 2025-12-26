import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Calendar, Clock, AlertCircle, CheckCircle, X, Search, Edit, Trash2, RefreshCw, Eye, MoreVertical, FileText, MessageSquare } from 'lucide-react';
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
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'blocked': return 'bg-red-100 text-red-700 border-red-200';
            case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
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
            <Layout title="Task Management">
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
            <Layout title="Task Management">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and track all assigned tasks</p>
                        </div>
                        <button
                            onClick={handleCreateTask}
                            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base"
                        >
                            <Plus className="w-5 h-5" />
                            Assign New Task
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-200">
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
                                    <CheckCircle className="w-8 h-8 text-blue-600" />
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
                                <option value="blocked">Blocked</option>
                                <option value="cancelled">Cancelled</option>
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

                    {/* Tasks List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">All Tasks ({filteredTasks.length})</h2>
                            {filteredTasks.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredTasks.map(task => (
                                        <div key={task._id} className="p-4 sm:p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                                                        <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                                                        {task.isOverdue && task.status !== 'completed' && (
                                                            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                                                                OVERDUE
                                                            </span>
                                                        )}
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap mb-3">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <span className="font-medium">Assigned to:</span>
                                                            <span className="font-bold text-gray-900">{task.assignedTo?.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Due: {new Date(task.dueDate || task.deadline).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-gray-600">Progress:</span>
                                                            <span className="font-bold text-gray-900">{task.progressPercentage || 0}%</span>
                                                        </div>
                                                        {task.subtasks && task.subtasks.length > 0 && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <FileText className="w-4 h-4" />
                                                                <span>{task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length} subtasks</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Progress Bar */}
                                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                        <div
                                                            className="bg-green-500 h-2 rounded-full transition-all"
                                                            style={{ width: `${task.progressPercentage || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getPriorityColor(task.priority)}`}>
                                                        {task.priority?.toUpperCase()}
                                                    </span>
                                                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getStatusColor(task.status)}`}>
                                                        {task.status?.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                    {/* Action Buttons */}
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleViewTask(task)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditTask(task)}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Edit Task"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReassignTask(task)}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                            title="Reassign Task"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </button>
                                                        {task.status !== 'cancelled' && task.status !== 'completed' && (
                                                            <button
                                                                onClick={() => handleCancelTask(task)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Cancel Task"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <ClipboardList className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                                    <p className="text-gray-600 mb-6">Start by assigning a task to a team lead.</p>
                                    <button
                                        onClick={handleCreateTask}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-semibold"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Assign First Task
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Layout>

            {/* Modals will be added in next part due to length */}
        </>
    );
};

export default AdminTaskManagement;

