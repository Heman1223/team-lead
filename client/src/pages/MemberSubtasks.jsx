import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Calendar, User, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';

const MemberSubtasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchSubtasks();
    }, []);

    const fetchSubtasks = async () => {
        try {
            setLoading(true);
            // Get all tasks and filter for subtasks assigned to this member
            const response = await api.get('/tasks');
            const allTasks = response.data.data;

            // Extract subtasks assigned to this user
            const mySubtasks = [];
            allTasks.forEach(task => {
                if (task.subtasks && task.subtasks.length > 0) {
                    task.subtasks.forEach(subtask => {
                        if (subtask.assignedTo?._id === user._id || subtask.assignedTo === user._id) {
                            mySubtasks.push({
                                ...subtask,
                                parentTask: {
                                    _id: task._id,
                                    title: task.title,
                                    category: task.category,
                                    priority: task.priority,
                                    dueDate: task.dueDate
                                }
                            });
                        }
                    });
                }
            });

            setTasks(mySubtasks);
        } catch (error) {
            console.error('Error fetching subtasks:', error);
            alert('Failed to fetch subtasks');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (parentTaskId, subtaskId, newStatus) => {
        try {
            await api.put(`/tasks/${parentTaskId}/subtasks/${subtaskId}`, { status: newStatus });
            alert('✅ Status updated successfully!');
            fetchSubtasks();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filterStatus === 'all') return true;
        return task.status === filterStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'blocked': return 'bg-red-100 text-red-700 border-red-200';
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
            <Layout title="My Subtasks">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading subtasks...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="My Subtasks">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 mt-1">Manage your assigned subtasks</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="stat-card stat-card-blue rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold opacity-90">Total Subtasks</p>
                                <p className="text-3xl font-bold mt-2">{tasks.length}</p>
                            </div>
                            <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Target className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card stat-card-orange rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold opacity-90">In Progress</p>
                                <p className="text-3xl font-bold mt-2">
                                    {tasks.filter(t => t.status === 'in_progress').length}
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
                                    {tasks.filter(t => t.status === 'completed').length}
                                </p>
                            </div>
                            <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card stat-card-purple rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold opacity-90">Not Started</p>
                                <p className="text-3xl font-bold mt-2">
                                    {tasks.filter(t => t.status === 'not_started').length}
                                </p>
                            </div>
                            <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Clock className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Professional Filter Tabs */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-xl">
                                <Target className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Filter Subtasks</h3>
                                <p className="text-sm text-gray-500">View tasks by status</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-xl">
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'not_started', label: 'Not Started' },
                                { value: 'in_progress', label: 'In Progress' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'blocked', label: 'Blocked' }
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

                {/* Subtasks List */}
                {/* Subtasks Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                            Your Subtasks
                            <span className="text-sm font-medium text-gray-500 ml-2">({filteredTasks.length})</span>
                        </h2>
                    </div>

                    {filteredTasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTasks.map(subtask => (
                                <div
                                    key={subtask._id}
                                    className="task-card group"
                                >
                                    {/* Priority Ribbon */}
                                    {subtask.parentTask.priority === 'critical' && (
                                        <div className="priority-ribbon priority-ribbon-critical">Critical</div>
                                    )}
                                    {subtask.parentTask.priority === 'high' && (
                                        <div className="priority-ribbon priority-ribbon-high">High</div>
                                    )}

                                    {/* Parent Task Header */}
                                    <div className="mb-4 pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">{getCategoryIcon(subtask.parentTask.category)}</span>
                                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">From Task</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700 line-clamp-1">
                                            {subtask.parentTask.title}
                                        </p>
                                    </div>

                                    {/* Subtask Content */}
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                                            {subtask.title}
                                        </h3>
                                        {subtask.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2">{subtask.description}</p>
                                        )}
                                    </div>

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(subtask.parentTask.dueDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded-md text-xs font-semibold ${subtask.parentTask.priority === 'critical' ? 'bg-red-50 text-red-600' :
                                            subtask.parentTask.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                                                subtask.parentTask.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                                                    'bg-green-50 text-green-600'
                                            }`}>
                                            {subtask.parentTask.priority?.charAt(0).toUpperCase() + subtask.parentTask.priority?.slice(1)}
                                        </div>
                                    </div>

                                    {/* Status Selector */}
                                    <div className="pt-3 border-t border-gray-100">
                                        <label className="text-xs font-semibold text-gray-500 mb-2 block">Update Status</label>
                                        <select
                                            value={subtask.status}
                                            onChange={(e) => handleStatusChange(subtask.parentTask._id, subtask._id, e.target.value)}
                                            className={`w-full px-4 py-2.5 text-sm font-semibold rounded-xl border-2 cursor-pointer transition-all ${subtask.status === 'completed'
                                                ? 'bg-green-50 border-green-200 text-green-700'
                                                : subtask.status === 'in_progress'
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                    : subtask.status === 'blocked'
                                                        ? 'bg-red-50 border-red-200 text-red-700'
                                                        : 'bg-gray-50 border-gray-200 text-gray-700'
                                                } hover:border-orange-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                                        >
                                            <option value="not_started">Not Started</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="blocked">Blocked</option>
                                        </select>
                                    </div>

                                    {/* Completion Badge */}
                                    {subtask.status === 'completed' && subtask.completedAt && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Completed {new Date(subtask.completedAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state bg-white rounded-2xl border border-gray-200">
                            <div className="empty-state-icon">
                                <Target className="w-10 h-10" />
                            </div>
                            <h3 className="empty-state-title">No subtasks found</h3>
                            <p className="empty-state-text">
                                {filterStatus === 'all'
                                    ? 'No subtasks have been assigned to you yet.'
                                    : `No subtasks with status "${filterStatus.replace('_', ' ')}".`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default MemberSubtasks;
