import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, usersAPI } from '../services/api';
// import './TaskManagement.css';

const TaskManagement = () => {
    const { isTeamLead, user } = useAuth();
    const [searchParams] = useSearchParams();
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filter, setFilter] = useState({
        status: searchParams.get('status') || 'all',
        priority: 'all'
    });
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        detailedDescription: '',
        clientRequirements: '',
        projectScope: '',
        priority: 'medium',
        deadline: '',
        assignedTo: '',
        notes: ''
    });
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [uploadingFile, setUploadingFile] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const taskId = searchParams.get('id');
        if (taskId && tasks.length > 0) {
            const task = tasks.find(t => t._id === taskId);
            if (task) {
                setSelectedTask(task);
                setShowDetailModal(true);
            }
        }
    }, [searchParams, tasks]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            if (isTeamLead) {
                // Team leads see all tasks
                const [tasksRes, membersRes] = await Promise.all([
                    tasksAPI.getAll(),
                    usersAPI.getAll()
                ]);
                setTasks(tasksRes.data.data);
                setMembers(membersRes.data.data);
            } else {
                // Team members see parent tasks that have subtasks assigned to them
                const tasksRes = await tasksAPI.getMyTasks();
                const allTasks = tasksRes.data.data || [];
                
                setTasks(allTasks);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (selectedTask && !showDetailModal) {
                await tasksAPI.update(selectedTask._id, formData);
            } else {
                await tasksAPI.create(formData);
            }
            setShowModal(false);
            setSelectedTask(null);
            resetForm();
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save task');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await tasksAPI.update(taskId, { status: newStatus });
            fetchData();
            if (selectedTask?._id === taskId) {
                const updated = await tasksAPI.getOne(taskId);
                setSelectedTask(updated.data.data);
            }
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleAddComment = async () => {
        if (!comment.trim()) return;
        try {
            await tasksAPI.addComment(selectedTask._id, comment);
            setComment('');
            const updated = await tasksAPI.getOne(selectedTask._id);
            setSelectedTask(updated.data.data);
        } catch (err) {
            alert('Failed to add comment');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await tasksAPI.delete(id);
            setShowDetailModal(false);
            setSelectedTask(null);
            fetchData();
        } catch (err) {
            alert('Failed to delete task');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setUploadingFile(true);
        try {
            // Convert file to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result;
                
                await tasksAPI.uploadAttachment(selectedTask._id, {
                    fileName: file.name,
                    fileUrl: base64String,
                    fileType: file.type,
                    fileSize: file.size,
                    originalName: file.name
                });

                const updated = await tasksAPI.getOne(selectedTask._id);
                setSelectedTask(updated.data.data);
                alert('File uploaded successfully');
            };
            reader.readAsDataURL(file);
        } catch (err) {
            alert('Failed to upload file');
        } finally {
            setUploadingFile(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!confirm('Are you sure you want to delete this attachment?')) return;
        try {
            await tasksAPI.deleteAttachment(selectedTask._id, attachmentId);
            const updated = await tasksAPI.getOne(selectedTask._id);
            setSelectedTask(updated.data.data);
        } catch (err) {
            alert('Failed to delete attachment');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            detailedDescription: '',
            clientRequirements: '',
            projectScope: '',
            priority: 'medium',
            deadline: '',
            assignedTo: '',
            notes: ''
        });
        setActiveTab('overview');
    };

    const openEditModal = (task) => {
        setSelectedTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            detailedDescription: task.detailedDescription || '',
            clientRequirements: task.clientRequirements || '',
            projectScope: task.projectScope || '',
            priority: task.priority,
            deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
            assignedTo: task.assignedTo?._id || '',
            notes: task.notes || ''
        });
        setShowDetailModal(false);
        setShowModal(true);
        setActiveTab('overview');
    };

    const filteredTasks = tasks.filter(task => {
        if (filter.status !== 'all' && task.status !== filter.status) return false;
        if (filter.priority !== 'all' && task.priority !== filter.priority) return false;
        return true;
    });

    const statusColors = {
        assigned: 'info',
        in_progress: 'primary',
        overdue: 'error',
        completed: 'success'
    };

    const priorityColors = {
        high: 'error',
        medium: 'warning',
        low: 'success'
    };

    return (
        <Layout title="Task Management">
            <div className="space-y-6">
                {/* Professional Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
                            <p className="text-sm text-gray-500">Manage and track all your tasks</p>
                        </div>
                    </div>
                    {isTeamLead && (
                        <button
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                            onClick={() => { resetForm(); setShowModal(true); }}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Create Task
                        </button>
                    )}
                </div>

                {/* Professional Filters */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Filters</h3>
                                <p className="text-xs text-gray-500">Narrow down results</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {/* Status Filter */}
                            <div className="flex flex-wrap gap-1 bg-gray-100 p-1.5 rounded-xl">
                                {[
                                    { value: 'all', label: 'All' },
                                    { value: 'assigned', label: 'Assigned' },
                                    { value: 'in_progress', label: 'In Progress' },
                                    { value: 'completed', label: 'Completed' },
                                    { value: 'overdue', label: 'Overdue' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilter({ ...filter, status: opt.value })}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${filter.status === opt.value
                                            ? 'bg-white text-orange-600 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Priority Filter */}
                            <div className="flex gap-1 bg-gray-100 p-1.5 rounded-xl">
                                {[
                                    { value: 'all', label: 'All Priority' },
                                    { value: 'high', label: 'High' },
                                    { value: 'medium', label: 'Medium' },
                                    { value: 'low', label: 'Low' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilter({ ...filter, priority: opt.value })}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${filter.priority === opt.value
                                            ? 'bg-white shadow-md ' + (opt.value === 'high' ? 'text-red-600' : opt.value === 'medium' ? 'text-yellow-600' : opt.value === 'low' ? 'text-green-600' : 'text-gray-700')
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task Board */}
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        <h3>No tasks found</h3>
                        <p>Create a new task to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTasks.map(task => (
                            <div
                                key={task._id}
                                className="task-card cursor-pointer group"
                                onClick={() => { setSelectedTask(task); setShowDetailModal(true); }}
                            >
                                {/* Priority indicator bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${task.priority === 'high' ? 'bg-red-500' :
                                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}></div>

                                <div className="flex items-start justify-between mb-4">
                                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                task.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                        }`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${task.priority === 'high' ? 'bg-red-50 text-red-600' :
                                            task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                                                'bg-green-50 text-green-600'
                                        }`}>
                                        {task.priority}
                                    </span>
                                </div>

                                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                                    {task.title}
                                </h4>

                                {task.description && (
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                        {task.description}
                                    </p>
                                )}

                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="member-avatar member-avatar-sm">
                                                {task.assignedTo?.name?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm text-gray-600 font-medium">
                                                {task.assignedTo?.name || 'Unassigned'}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-medium ${new Date(task.deadline) < new Date() && task.status !== 'completed'
                                                ? 'text-red-600'
                                                : 'text-gray-500'
                                            }`}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            {new Date(task.deadline).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => { setShowModal(false); setSelectedTask(null); }}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{selectedTask ? 'Edit Task' : 'Create Task'}</h3>
                                <button className="btn btn-ghost btn-icon" onClick={() => { setShowModal(false); setSelectedTask(null); }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            
                            {/* Tabs */}
                            <div className="flex border-b border-gray-200 px-6">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'overview'
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'details'
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Detailed Description
                                </button>
                                <button
                                    onClick={() => setActiveTab('requirements')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'requirements'
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Requirements
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="error-message">{error}</div>}

                                    {/* Overview Tab */}
                                    {activeTab === 'overview' && (
                                        <>
                                            <div className="form-group">
                                                <label>Title *</label>
                                                <input
                                                    type="text"
                                                    value={formData.title}
                                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                    required
                                                    placeholder="Task title"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Brief Description</label>
                                                <textarea
                                                    rows="3"
                                                    value={formData.description}
                                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="Brief task description..."
                                                    maxLength="2000"
                                                />
                                                <small className="text-gray-500">{formData.description?.length || 0}/2000 characters</small>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Priority *</label>
                                                    <select
                                                        value={formData.priority}
                                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label>Deadline *</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={formData.deadline}
                                                        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Assign To *</label>
                                                <select
                                                    value={formData.assignedTo}
                                                    onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                                                    required
                                                >
                                                    <option value="">Select member</option>
                                                    {members.map(m => (
                                                        <option key={m._id} value={m._id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>Notes</label>
                                                <textarea
                                                    rows="2"
                                                    value={formData.notes}
                                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                                    placeholder="Additional notes..."
                                                    maxLength="1000"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Detailed Description Tab */}
                                    {activeTab === 'details' && (
                                        <>
                                            <div className="form-group">
                                                <label>Detailed Project Description</label>
                                                <p className="text-sm text-gray-500 mb-2">
                                                    Provide comprehensive details about what needs to be done, technical specifications, and implementation guidelines.
                                                </p>
                                                <textarea
                                                    rows="10"
                                                    value={formData.detailedDescription}
                                                    onChange={e => setFormData({ ...formData, detailedDescription: e.target.value })}
                                                    placeholder="Enter detailed description of the project, technical requirements, implementation steps, etc..."
                                                    maxLength="10000"
                                                    className="font-mono text-sm"
                                                />
                                                <small className="text-gray-500">{formData.detailedDescription?.length || 0}/10000 characters</small>
                                            </div>

                                            <div className="form-group">
                                                <label>Project Scope</label>
                                                <p className="text-sm text-gray-500 mb-2">
                                                    Define what is included and excluded from this project.
                                                </p>
                                                <textarea
                                                    rows="6"
                                                    value={formData.projectScope}
                                                    onChange={e => setFormData({ ...formData, projectScope: e.target.value })}
                                                    placeholder="Define project scope, deliverables, boundaries..."
                                                    maxLength="5000"
                                                />
                                                <small className="text-gray-500">{formData.projectScope?.length || 0}/5000 characters</small>
                                            </div>
                                        </>
                                    )}

                                    {/* Requirements Tab */}
                                    {activeTab === 'requirements' && (
                                        <div className="form-group">
                                            <label>Client Requirements</label>
                                            <p className="text-sm text-gray-500 mb-2">
                                                Document what the client wants, their expectations, specific features, and any constraints.
                                            </p>
                                            <textarea
                                                rows="12"
                                                value={formData.clientRequirements}
                                                onChange={e => setFormData({ ...formData, clientRequirements: e.target.value })}
                                                placeholder="Enter client requirements, expectations, features needed, constraints, etc..."
                                                maxLength="5000"
                                                className="font-mono text-sm"
                                            />
                                            <small className="text-gray-500">{formData.clientRequirements?.length || 0}/5000 characters</small>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setSelectedTask(null); }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {selectedTask ? 'Save Changes' : 'Create Task'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Task Detail Modal */}
                {showDetailModal && selectedTask && (
                    <div className="modal-overlay" onClick={() => { setShowDetailModal(false); setSelectedTask(null); }}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                            <div className="modal-header">
                                <div className="detail-header-content">
                                    <div className={`priority-indicator priority-${selectedTask.priority}`} />
                                    <h3>{selectedTask.title}</h3>
                                </div>
                                <button className="btn btn-ghost btn-icon" onClick={() => { setShowDetailModal(false); setSelectedTask(null); }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {/* Status & Priority */}
                                <div className="detail-section">
                                    <div className="detail-row">
                                        <span className="detail-label">Status</span>
                                        <select
                                            value={selectedTask.status}
                                            onChange={e => handleStatusChange(selectedTask._id, e.target.value)}
                                            className="status-select"
                                        >
                                            <option value="assigned">Assigned</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Priority</span>
                                        <span className={`badge badge-${priorityColors[selectedTask.priority]}`}>
                                            {selectedTask.priority}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Deadline</span>
                                        <span>{new Date(selectedTask.deadline).toLocaleString()}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Assigned To</span>
                                        <div className="assignee-info">
                                            <div className="avatar avatar-sm">
                                                {selectedTask.assignedTo?.name?.charAt(0) || '?'}
                                            </div>
                                            <span>{selectedTask.assignedTo?.name || 'Unassigned'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedTask.description && (
                                    <div className="detail-section">
                                        <h4>Brief Description</h4>
                                        <p className="whitespace-pre-wrap">{selectedTask.description}</p>
                                    </div>
                                )}

                                {/* Detailed Description */}
                                {selectedTask.detailedDescription && (
                                    <div className="detail-section">
                                        <h4>Detailed Project Description</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="whitespace-pre-wrap font-mono text-sm">{selectedTask.detailedDescription}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Client Requirements */}
                                {selectedTask.clientRequirements && (
                                    <div className="detail-section">
                                        <h4>Client Requirements</h4>
                                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                            <p className="whitespace-pre-wrap font-mono text-sm">{selectedTask.clientRequirements}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Project Scope */}
                                {selectedTask.projectScope && (
                                    <div className="detail-section">
                                        <h4>Project Scope</h4>
                                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                            <p className="whitespace-pre-wrap">{selectedTask.projectScope}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Attachments */}
                                <div className="detail-section">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4>Attachments ({selectedTask.attachments?.length || 0})</h4>
                                        {isTeamLead && (
                                            <label className="btn btn-sm btn-secondary cursor-pointer">
                                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                </svg>
                                                Upload File
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                    disabled={uploadingFile}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    {uploadingFile && (
                                        <div className="text-sm text-gray-500 mb-2">Uploading file...</div>
                                    )}
                                    {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedTask.attachments.map((att, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex items-center gap-3">
                                                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        <div>
                                                            <p className="font-medium text-sm">{att.originalName || att.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {att.fileSize ? `${(att.fileSize / 1024).toFixed(2)} KB` : 'Unknown size'} • 
                                                                {att.uploadedAt ? new Date(att.uploadedAt).toLocaleDateString() : 'Unknown date'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <a
                                                            href={att.url}
                                                            download={att.originalName || att.name}
                                                            className="btn btn-sm btn-ghost"
                                                            title="Download"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                        </a>
                                                        {isTeamLead && (
                                                            <button
                                                                onClick={() => handleDeleteAttachment(att._id)}
                                                                className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
                                                                title="Delete"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No attachments</p>
                                    )}
                                </div>

                                {/* Team Member Subtasks & Progress */}
                                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                                    <div className="detail-section">
                                        <h4 className="flex items-center gap-2 mb-4">
                                            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Team Member Assignments & Progress
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedTask.subtasks.map((subtask, idx) => (
                                                <div key={subtask._id || idx} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-all">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <h5 className="font-bold text-gray-900 mb-1">{subtask.title}</h5>
                                                            {subtask.description && (
                                                                <p className="text-sm text-gray-600 mb-2">{subtask.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
                                                                        {subtask.assignedTo?.name?.charAt(0) || '?'}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-gray-900">{subtask.assignedTo?.name || 'Unassigned'}</p>
                                                                        <p className="text-xs text-gray-500">{subtask.assignedTo?.email || ''}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                                                                subtask.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                                subtask.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                'bg-gray-100 text-gray-700 border-gray-200'
                                                            }`}>
                                                                {subtask.status?.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                            {subtask.eodReports && subtask.eodReports.length > 0 && (
                                                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                    {subtask.eodReports.length} EOD report(s)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mt-3">
                                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                                            <span className="text-gray-600 font-medium">Progress</span>
                                                            <span className="font-bold text-gray-900">{subtask.progressPercentage || 0}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                            <div
                                                                className={`h-2.5 rounded-full transition-all ${
                                                                    subtask.progressPercentage === 100 ? 'bg-green-500' : 'bg-orange-500'
                                                                }`}
                                                                style={{ width: `${subtask.progressPercentage || 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    {/* Latest EOD Report */}
                                                    {subtask.eodReports && subtask.eodReports.length > 0 && (
                                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                            <p className="text-xs font-semibold text-blue-900 mb-1">Latest Update:</p>
                                                            <p className="text-sm text-blue-800">{subtask.eodReports[subtask.eodReports.length - 1].workCompleted}</p>
                                                            <p className="text-xs text-blue-600 mt-1">
                                                                {new Date(subtask.eodReports[subtask.eodReports.length - 1].submittedAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Comments */}
                                <div className="detail-section">
                                    <h4>Comments ({selectedTask.comments?.length || 0})</h4>
                                    <div className="comments-list">
                                        {selectedTask.comments?.map((c, i) => (
                                            <div key={i} className="comment-item">
                                                <div className="avatar avatar-sm">
                                                    {c.userId?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="comment-content">
                                                    <div className="comment-header">
                                                        <span className="comment-author">{c.userId?.name || 'Unknown'}</span>
                                                        <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <p className="comment-text">{c.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="add-comment">
                                        <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                                        />
                                        <button className="btn btn-primary btn-sm" onClick={handleAddComment}>
                                            Post
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                {isTeamLead && (
                                    <>
                                        <button className="btn btn-danger" onClick={() => handleDelete(selectedTask._id)}>
                                            Delete
                                        </button>
                                        <button className="btn btn-secondary" onClick={() => openEditModal(selectedTask)}>
                                            Edit
                                        </button>
                                    </>
                                )}
                                <button className="btn btn-primary" onClick={() => { setShowDetailModal(false); setSelectedTask(null); }}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TaskManagement;
