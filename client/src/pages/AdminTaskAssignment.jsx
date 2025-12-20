import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Calendar, Clock, AlertCircle, CheckCircle, X, Search, Target, User, Briefcase, TrendingUp } from 'lucide-react';
import { adminTasksAPI } from '../services/adminApi';
import Layout from '../components/Layout';

const AdminTaskAssignment = () => {
    const [tasks, setTasks] = useState([]);
    const [teamLeads, setTeamLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        deadline: '',
        teamLeadId: '',
        isRecurring: false,
        recurrenceType: 'none',
        recurrenceEndDate: ''
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
            alert('Failed to fetch data: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = () => {
        setFormData({
            title: '',
            description: '',
            priority: 'medium',
            deadline: '',
            teamLeadId: '',
            isRecurring: false,
            recurrenceType: 'none',
            recurrenceEndDate: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await adminTasksAPI.assignToTeamLead(formData);
            setShowModal(false);
            fetchData();
            alert('✅ Task assigned successfully!');
        } catch (error) {
            console.error('Error assigning task:', error);
            alert('❌ ' + (error.response?.data?.message || 'Failed to assign task'));
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
            case 'assigned': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'overdue': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
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
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 mt-1">Assign tasks to team leads and track progress</p>
                </div>
                <button
                    onClick={handleCreateTask}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                >
                    <Plus className="w-5 h-5" />
                    Assign Task
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-600">Total Tasks</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{tasks.length}</p>
                        </div>
                        <div className="p-4 bg-orange-100 rounded-xl">
                            <ClipboardList className="w-8 h-8 text-orange-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-600">Completed</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">
                                {tasks.filter(t => t.status === 'completed').length}
                            </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-600">In Progress</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">
                                {tasks.filter(t => t.status === 'in_progress').length}
                            </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl">
                            <TrendingUp className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-600">Overdue</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">
                                {tasks.filter(t => t.status === 'overdue').length}
                            </p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-xl">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-6 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white font-medium"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTasks.map((task) => (
                    <div key={task._id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all p-5 border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                                    {task.isRecurring && (
                                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg font-semibold border border-purple-200">
                                            {task.recurrenceType}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md">
                                        {task.assignedTo?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{task.assignedTo?.name}</p>
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                            <User className="w-3 h-3" />
                                            <span>Team Lead</span>
                                        </div>
                                        {task.assignedTo?.coreField && (
                                            <div className="flex items-center gap-1 text-xs text-orange-600 mt-0.5">
                                                <Target className="w-3 h-3" />
                                                <span className="font-semibold">{task.assignedTo.coreField}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-600 mb-1">Priority</p>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg border inline-block ${getPriorityColor(task.priority)}`}>
                                        {task.priority?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-600 mb-1">Status</p>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 w-fit ${getStatusColor(task.status)}`}>
                                        {getStatusIcon(task.status)}
                                        {task.status?.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span className="font-semibold">Deadline</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{formatDate(task.deadline)}</span>
                                </div>
                            </div>

                            {task.teamId && (
                                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Briefcase className="w-4 h-4 text-purple-600" />
                                        <span className="text-gray-700">Team:</span>
                                        <span className="font-semibold text-gray-900">{task.teamId.name}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Created {formatDate(task.createdAt)}</span>
                                {task.progressPercentage > 0 && (
                                    <span className="font-semibold text-orange-600">{task.progressPercentage}% Complete</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredTasks.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-200">
                    <ClipboardList className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-600 mb-6">Start by assigning tasks to team leads.</p>
                    <button
                        onClick={handleCreateTask}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Assign Task
                    </button>
                </div>
            )}
        </div>
        </Layout>

        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus className="w-6 h-6" />
                                Assign Task to Team Lead
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-orange-600" />
                                Task Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                required
                                placeholder="Enter task title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                rows="4"
                                placeholder="Describe the task in detail..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4 text-orange-600" />
                                    Assign To <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.teamLeadId}
                                    onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                                    required
                                >
                                    <option value="">Select Team Lead</option>
                                    {teamLeads.map(lead => (
                                        <option key={lead._id} value={lead._id}>
                                            {lead.name} {lead.coreField ? `- ${lead.coreField}` : ''} {lead.teamId?.name ? `(${lead.teamId.name})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-orange-600" />
                                    Priority <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                                    required
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-600" />
                                Deadline <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    id="isRecurring"
                                    checked={formData.isRecurring}
                                    onChange={(e) => setFormData({ 
                                        ...formData, 
                                        isRecurring: e.target.checked,
                                        recurrenceType: e.target.checked ? 'daily' : 'none'
                                    })}
                                    className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                                />
                                <label htmlFor="isRecurring" className="text-sm font-semibold text-gray-700">
                                    Make this a recurring task
                                </label>
                            </div>

                            {formData.isRecurring && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7 bg-orange-50 p-4 rounded-xl border border-orange-100">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Recurrence Type</label>
                                        <select
                                            value={formData.recurrenceType}
                                            onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">End Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={formData.recurrenceEndDate}
                                            onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4">
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
