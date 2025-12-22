import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Users, Calendar, Clock, AlertCircle, CheckCircle, X, Target, TrendingUp, Edit, Trash2, User, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { notificationsAPI } from '../services/api';
import Layout from '../components/Layout';

const TeamLeadTaskBreakdown = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [parentTasks, setParentTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showSubtaskModal, setShowSubtaskModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [subtaskForm, setSubtaskForm] = useState({
        title: '',
        description: '',
        assignedTo: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Get tasks assigned to this team lead
            const tasksRes = await api.get('/tasks/my-tasks');
            const parentTasksOnly = tasksRes.data.data.filter(t => t.isParentTask);
            setParentTasks(parentTasksOnly);

            // Refresh selected task if modal is open
            if (selectedTask) {
                const updated = parentTasksOnly.find(t => t._id === selectedTask._id);
                if (updated) setSelectedTask(updated);
            }

            // Get team members
            if (user.teamId) {
                const teamRes = await api.get(`/teams/${user.teamId._id || user.teamId}`);
                const members = teamRes.data.data.members.filter(m => m._id !== user._id);
                setTeamMembers(members);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubtask = (task) => {
        setSelectedTask(task);
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
            await api.post(`/tasks/${selectedTask._id}/subtasks`, subtaskForm);
            alert('✅ Subtask created successfully!');
            setShowSubtaskModal(false);
            fetchData();
        } catch (error) {
            console.error('Error creating subtask:', error);
            console.error('Error response:', error.response);
            console.error('Error response data:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Selected task ID:', selectedTask?._id);
            console.error('Subtask form data:', subtaskForm);
            alert('❌ ' + (error.response?.data?.message || error.message || 'Failed to create subtask'));
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
                taskId: selectedTask._id,
                userId: subtask.assignedTo._id,
                message: `Reminder: Please complete subtask "${subtask.title}"`
            });
            alert('✅ Reminder sent successfully!');
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Failed to send reminder');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'blocked': return 'bg-red-100 text-red-700 border-red-200';
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
            <Layout title="Task Breakdown">
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
            <Layout title="Task Breakdown">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 mt-1">Break down admin tasks into subtasks for your team</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="stat-card stat-card-blue rounded-2xl p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold opacity-90">Total Tasks</p>
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
                                    <p className="text-sm font-semibold opacity-90">In Progress</p>
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

                    {/* Professional Filter Section */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                                    <ClipboardList className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Filter Tasks</h3>
                                    <p className="text-sm text-gray-500">Find tasks by status or priority</p>
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

                                {/* Priority Filter */}
                                <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-xl">
                                    {[
                                        { value: 'all', label: 'Any Priority', color: 'gray' },
                                        { value: 'critical', label: 'Critical', color: 'red' },
                                        { value: 'high', label: 'High', color: 'orange' },
                                        { value: 'medium', label: 'Medium', color: 'yellow' }
                                    ].map(filter => (
                                        <button
                                            key={filter.value}
                                            onClick={() => setFilterPriority(filter.value)}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${filterPriority === filter.value
                                                ? 'bg-white shadow-md ' + (filter.value === 'critical' ? 'text-red-600' : filter.value === 'high' ? 'text-orange-600' : filter.value === 'medium' ? 'text-yellow-600' : 'text-gray-700')
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

                    {/* Parent Tasks Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                                Your Assigned Tasks
                                <span className="text-sm font-medium text-gray-500 ml-2">
                                    ({parentTasks.filter(t => {
                                        const statusMatch = filterStatus === 'all' ||
                                            (filterStatus === 'overdue' ? t.isOverdue : t.status === filterStatus);
                                        const priorityMatch = filterPriority === 'all' || t.priority === filterPriority;
                                        return statusMatch && priorityMatch;
                                    }).length})
                                </span>
                            </h2>
                        </div>

                        {(() => {
                            const filteredTasks = parentTasks.filter(t => {
                                const statusMatch = filterStatus === 'all' ||
                                    (filterStatus === 'overdue' ? t.isOverdue : t.status === filterStatus);
                                const priorityMatch = filterPriority === 'all' || t.priority === filterPriority;
                                return statusMatch && priorityMatch;
                            });

                            return filteredTasks.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredTasks.map(task => (
                                        <div
                                            key={task._id}
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setShowDetailsModal(true);
                                            }}
                                            className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group relative flex flex-col h-full hover:border-orange-200"
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
                                                <p className="text-sm text-gray-500 line-clamp-3">
                                                    {task.description || 'No description provided'}
                                                </p>
                                            </div>

                                            <div className="space-y-4 mt-auto">
                                                <div>
                                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                                        <span className="text-gray-600 font-medium">Progress</span>
                                                        <span className={`font-bold ${task.progressPercentage === 100 ? 'text-green-600' : 'text-gray-900'
                                                            }`}>{task.progressPercentage || 0}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-500 ${task.progressPercentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-orange-500 to-orange-600'
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
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <ClipboardList className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks assigned yet</h3>
                                    <p className="text-gray-600">Wait for admin to assign tasks to you.</p>
                                </div>
                            )
                        })()}
                    </div>
                </div>
            </Layout>

            {/* Task Details Modal */}
            {showDetailsModal && selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <ClipboardList className="w-6 h-6" />
                                    Task Details
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
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Calendar className="w-4 h-4" /></div>
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
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><User className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold">Assigned By</p>
                                                <p className="font-semibold text-gray-900">{selectedTask.assignedBy?.name || 'Admin'}</p>
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
                                        <h4 className="text-lg font-bold text-gray-900">Task Progress</h4>
                                    </div>
                                    <span className={`text-2xl font-black ${selectedTask.progressPercentage === 100 ? 'text-green-600' : 'text-orange-600'
                                        }`}>{selectedTask.progressPercentage || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden">
                                    <div
                                        className={`h-4 rounded-full transition-all duration-700 ${selectedTask.progressPercentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-orange-500 to-orange-600'
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
                                        Subtasks & Assignments ({selectedTask.subtasks?.length || 0})
                                    </h4>
                                    <button
                                        onClick={() => {
                                            // Keeping modal open, just opening subtask modal on top
                                            setShowSubtaskModal(true);
                                        }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold shadow-lg shadow-orange-200"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Assign Subtask
                                    </button>
                                </div>

                                {selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedTask.subtasks.map(subtask => (
                                            <div key={subtask._id} className="group flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className={`w-4 h-4 flex-shrink-0 rounded-full ring-4 ring-opacity-20 ${subtask.status === 'completed' ? 'bg-green-500 ring-green-500' :
                                                        subtask.status === 'in_progress' ? 'bg-blue-500 ring-blue-500' :
                                                            subtask.status === 'blocked' ? 'bg-red-500 ring-red-500' :
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

                                                        <div className="flex items-center gap-4 mt-3">
                                                            <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                                                <User className="w-3.5 h-3.5 text-gray-500" />
                                                                <span className="text-gray-600">Assigned into:</span>
                                                                <span className="font-bold text-gray-900">{subtask.assignedTo?.name || 'Unassigned'}</span>
                                                            </div>

                                                            {subtask.status !== 'completed' && (
                                                                <button
                                                                    onClick={() => handleSendReminder(subtask)}
                                                                    className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-lg transition-colors border border-orange-100"
                                                                >
                                                                    <Bell className="w-3 h-3" />
                                                                    Send Reminder
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pl-4 border-l border-gray-100 ml-4">
                                                    <button
                                                        onClick={() => handleDeleteSubtask(selectedTask._id, subtask._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Delete subtask"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                                        <Target className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                        <p className="text-gray-600 font-medium mb-1">No subtasks created yet</p>
                                        <p className="text-sm text-gray-500 mb-6">Break this task into smaller assignments for your team.</p>
                                        <button
                                            onClick={() => setShowSubtaskModal(true)}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-bold shadow-md opacity-90 hover:opacity-100 transition-all"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Create First Subtask
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subtask Modal */}
            {showSubtaskModal && selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Plus className="w-6 h-6" />
                                    Add Subtask to: {selectedTask.title}
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
        </>
    );
};

export default TeamLeadTaskBreakdown;
