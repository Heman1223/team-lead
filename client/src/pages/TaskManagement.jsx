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
        priority: 'medium',
        deadline: '',
        assignedTo: '',
        notes: ''
    });
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

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
            const [tasksRes, membersRes] = await Promise.all([
                tasksAPI.getAll(),
                usersAPI.getAll()
            ]);
            setTasks(tasksRes.data.data);
            setMembers(membersRes.data.data);
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

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            priority: 'medium',
            deadline: '',
            assignedTo: '',
            notes: ''
        });
    };

    const openEditModal = (task) => {
        setSelectedTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
            assignedTo: task.assignedTo?._id || '',
            notes: task.notes || ''
        });
        setShowDetailModal(false);
        setShowModal(true);
    };

    const filteredTasks = tasks.filter(task => {
        if (filter.status !== 'all' && task.status !== filter.status) return false;
        if (filter.priority !== 'all' && task.priority !== filter.priority) return false;
        return true;
    });

    const statusColors = {
        assigned: 'info',
        in_progress: 'primary',
        blocked: 'warning',
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
            <div className="task-page">
                {/* Filters */}
                <div className="page-header">
                    <div className="filters">
                        <select
                            value={filter.status}
                            onChange={e => setFilter({ ...filter, status: e.target.value })}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="assigned">Assigned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="blocked">Blocked</option>
                            <option value="overdue">Overdue</option>
                            <option value="completed">Completed</option>
                        </select>
                        <select
                            value={filter.priority}
                            onChange={e => setFilter({ ...filter, priority: e.target.value })}
                            className="filter-select"
                        >
                            <option value="all">All Priority</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    {isTeamLead && (
                        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Create Task
                        </button>
                    )}
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
                    <div className="tasks-grid">
                        {filteredTasks.map(task => (
                            <div
                                key={task._id}
                                className="task-card"
                                onClick={() => { setSelectedTask(task); setShowDetailModal(true); }}
                            >
                                <div className="task-header">
                                    <div className={`priority-indicator priority-${task.priority}`} />
                                    <span className={`badge badge-${statusColors[task.status]}`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <h4 className="task-title">{task.title}</h4>
                                {task.description && (
                                    <p className="task-description">{task.description.substring(0, 100)}...</p>
                                )}
                                <div className="task-meta">
                                    <div className="task-assignee">
                                        <div className="avatar avatar-sm">
                                            {task.assignedTo?.name?.charAt(0) || '?'}
                                        </div>
                                        <span>{task.assignedTo?.name || 'Unassigned'}</span>
                                    </div>
                                    <div className="task-deadline">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        <span className={new Date(task.deadline) < new Date() && task.status !== 'completed' ? 'overdue' : ''}>
                                            {new Date(task.deadline).toLocaleDateString()}
                                        </span>
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
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="error-message">{error}</div>}

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
                                        <label>Description</label>
                                        <textarea
                                            rows="3"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Task description..."
                                        />
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
                                        />
                                    </div>
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
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
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
                            <div className="modal-body">
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
                                            <option value="blocked">Blocked</option>
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
                                        <h4>Description</h4>
                                        <p>{selectedTask.description}</p>
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
