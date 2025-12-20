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
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Tasks</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{parentTasks.length}</p>
                            </div>
                            <div className="p-4 bg-blue-100 rounded-xl">
                                <ClipboardList className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">In Progress</p>
                                <p className="text-3xl font-bold text-blue-600 mt-2">
                                    {parentTasks.filter(t => t.status === 'in_progress').length}
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
                                    {parentTasks.filter(t => t.status === 'completed').length}
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
                                    {parentTasks.filter(t => t.isOverdue).length}
                                </p>
                            </div>
                            <div className="p-4 bg-red-100 rounded-xl">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Parent Tasks List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Assigned Tasks ({parentTasks.length})</h2>
                        {parentTasks.length > 0 ? (
                            <div className="space-y-4">
                                {parentTasks.map(task => (
                                    <div key={task._id} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                                        {/* Task Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                                                    <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                                                    {task.isOverdue && (
                                                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                                                            OVERDUE
                                                        </span>
                                                    )}
                                                </div>
                                                {task.description && (
                                                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 flex-wrap">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-700">
                                                            Due: <span className="font-medium">{new Date(task.dueDate || task.deadline).toLocaleDateString()}</span>
                                                        </span>
                                                    </div>
                                                    {task.estimatedEffort > 0 && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Clock className="w-4 h-4 text-gray-500" />
                                                            <span className="text-gray-700">
                                                                {task.estimatedEffort} {task.estimatedEffortUnit || 'hours'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <User className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-700">
                                                            Assigned by: <span className="font-medium">{task.assignedBy?.name}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority?.toUpperCase()}
                                                </span>
                                                <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getStatusColor(task.status)}`}>
                                                    {task.status?.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                                                <span className="text-lg font-bold text-gray-900">{task.progressPercentage || 0}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div 
                                                    className="bg-green-500 h-3 rounded-full transition-all"
                                                    style={{ width: `${task.progressPercentage || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Subtasks Section */}
                                        <div className="border-t border-gray-200 pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                    <Users className="w-5 h-5 text-orange-600" />
                                                    Subtasks ({task.subtasks?.length || 0})
                                                </h4>
                                                <button
                                                    onClick={() => handleAddSubtask(task)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Subtask
                                                </button>
                                            </div>

                                            {task.subtasks && task.subtasks.length > 0 ? (
                                                <div className="space-y-2">
                                                    {task.subtasks.map(subtask => (
                                                        <div key={subtask._id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <div className={`w-3 h-3 rounded-full ${
                                                                    subtask.status === 'completed' ? 'bg-green-500' :
                                                                    subtask.status === 'in_progress' ? 'bg-blue-500' :
                                                                    subtask.status === 'blocked' ? 'bg-red-500' :
                                                                    'bg-gray-400'
                                                                }`}></div>
                                                                <div className="flex-1">
                                                                    <p className="font-semibold text-gray-900">{subtask.title}</p>
                                                                    {subtask.description && (
                                                                        <p className="text-xs text-gray-600 mt-1">{subtask.description}</p>
                                                                    )}
                                                                    <div className="flex items-center gap-3 mt-2">
                                                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                                                            <User className="w-3 h-3" />
                                                                            <span>{subtask.assignedTo?.name || 'Unassigned'}</span>
                                                                        </div>
                                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getStatusColor(subtask.status)}`}>
                                                                            {subtask.status?.replace('_', ' ').toUpperCase()}
                                                                        </span>
                                                                        {subtask.status !== 'completed' && (
                                                                            <button
                                                                                onClick={() => handleSendReminder(subtask)}
                                                                                className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                                                title="Send reminder"
                                                                            >
                                                                                <Bell className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteSubtask(task._id, subtask._id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete subtask"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                                    <Target className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                                    <p className="text-gray-600 mb-3">No subtasks yet</p>
                                                    <button
                                                        onClick={() => handleAddSubtask(task)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold text-sm"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Create First Subtask
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <ClipboardList className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks assigned yet</h3>
                                <p className="text-gray-600">Wait for admin to assign tasks to you.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>

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
