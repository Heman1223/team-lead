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
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Subtasks</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{tasks.length}</p>
                            </div>
                            <div className="p-4 bg-blue-100 rounded-xl">
                                <Target className="w-8 h-8 text-blue-600" />
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
                </div>

                {/* Filter */}
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
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
                    </select>
                </div>

                {/* Subtasks List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Subtasks ({filteredTasks.length})</h2>
                        {filteredTasks.length > 0 ? (
                            <div className="space-y-4">
                                {filteredTasks.map(subtask => (
                                    <div key={subtask._id} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                                        {/* Parent Task Info */}
                                        <div className="mb-4 pb-4 border-b border-gray-200">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                <span className="text-xl">{getCategoryIcon(subtask.parentTask.category)}</span>
                                                <span className="font-medium">Parent Task:</span>
                                                <span className="font-bold text-gray-900">{subtask.parentTask.title}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>Due: {new Date(subtask.parentTask.dueDate).toLocaleDateString()}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                    subtask.parentTask.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                                    subtask.parentTask.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                    subtask.parentTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                    {subtask.parentTask.priority?.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Subtask Details */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">{subtask.title}</h3>
                                                {subtask.description && (
                                                    <p className="text-sm text-gray-600 mb-3">{subtask.description}</p>
                                                )}
                                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>Created: {new Date(subtask.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {subtask.completedAt && (
                                                        <div className="flex items-center gap-1 text-green-600">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span>Completed: {new Date(subtask.completedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <select
                                                    value={subtask.status}
                                                    onChange={(e) => handleStatusChange(subtask.parentTask._id, subtask._id, e.target.value)}
                                                    className={`px-4 py-2 text-sm font-semibold rounded-lg border cursor-pointer ${getStatusColor(subtask.status)}`}
                                                >
                                                    <option value="not_started">Not Started</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="blocked">Blocked</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Target className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No subtasks found</h3>
                                <p className="text-gray-600">
                                    {filterStatus === 'all' 
                                        ? 'No subtasks have been assigned to you yet.' 
                                        : `No subtasks with status "${filterStatus.replace('_', ' ')}".`}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default MemberSubtasks;
