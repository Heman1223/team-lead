import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Calendar, Clock, AlertCircle, CheckCircle, X, Search, Target, User, Briefcase, TrendingUp, Filter, Eye } from 'lucide-react';
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
    const [formData, setFormData] = useState({
        // Basic Info
        title: '',
        description: '',
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
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title || !formData.dueDate || !formData.teamLeadId) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await adminTasksAPI.assignToTeamLead(formData);
            alert('✅ Task assigned successfully!');
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error creating task:', error);
            alert('❌ ' + (error.response?.data?.message || 'Failed to create task'));
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
                            <option value="blocked">Blocked</option>
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
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Assigned Tasks ({filteredTasks.length})</h2>
                        {filteredTasks.length > 0 ? (
                            <div className="space-y-3">
                                {filteredTasks.map(task => (
                                    <div key={task._id} className="p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                                                    <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
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
                                                        <User className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-700">
                                                            <span className="font-medium">{task.assignedTo?.name}</span>
                                                            {task.teamId && <span className="text-gray-500"> ({task.teamId.name})</span>}
                                                        </span>
                                                    </div>
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
                                                        <TrendingUp className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-700">
                                                            Progress: <span className="font-medium">{task.progressPercentage || 0}%</span>
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
                                        {task.subtasks && task.subtasks.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-xs text-gray-600 mb-2">
                                                    Subtasks: {task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length} completed
                                                </p>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-green-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${task.progressPercentage || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
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
