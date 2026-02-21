import { useState } from 'react';
import { Plus, X, Trash2, Check, Clock, User, Calendar } from 'lucide-react';
import { tasksAPI } from '../services/api';

const SubtaskManager = ({ task, teamMembers = [], onUpdate }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        deadline: ''
    });

    const handleAddSubtask = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.assignedTo) {
            alert('Please provide title and assign to a team member');
            return;
        }

        try {
            setLoading(true);
            await tasksAPI.addSubtask(task._id, formData);
            setShowAddModal(false);
            setFormData({ title: '', description: '', assignedTo: '', deadline: '' });
            if (onUpdate) onUpdate();
            alert('✅ Subtask created successfully!');
        } catch (error) {
            console.error('Error creating subtask:', error);
            alert(error.response?.data?.message || 'Failed to create subtask');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (subtaskId, newStatus) => {
        try {
            await tasksAPI.updateSubtask(task._id, subtaskId, { status: newStatus });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error updating subtask:', error);
            alert('Failed to update subtask status');
        }
    };

    const handleDeleteSubtask = async (subtaskId, subtaskTitle) => {
        if (!window.confirm(`Delete subtask "${subtaskTitle}"?`)) return;

        try {
            await tasksAPI.deleteSubtask(task._id, subtaskId);
            if (onUpdate) onUpdate();
            alert('✅ Subtask deleted successfully!');
        } catch (error) {
            console.error('Error deleting subtask:', error);
            alert('Failed to delete subtask');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'in_progress': return 'bg-blue-500';
            case 'not_started': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'in_progress': return 'In Progress';
            case 'not_started': return 'Not Started';
            default: return status;
        }
    };

    const subtasks = task.subtasks || [];
    const completedCount = subtasks.filter(st => st.status === 'completed').length;
    const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* Header with Progress */}
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">Subtasks</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                            {completedCount}/{subtasks.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{progress}%</span>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="ml-4 px-4 py-2 bg-[#3E2723] text-white rounded-xl hover:bg-[#3E2723] transition-all font-semibold text-sm flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Subtask
                </button>
            </div>

            {/* Subtasks List */}
            {subtasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No subtasks yet</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-[#3E2723] text-white rounded-xl hover:bg-[#3E2723] transition-all font-semibold text-sm"
                    >
                        Create First Subtask
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {subtasks.map((subtask) => (
                        <div
                            key={subtask._id}
                            className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-3">
                                {/* Status Indicator */}
                                <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(subtask.status)}`}></div>

                                {/* Content */}
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">{subtask.title}</h4>
                                    {subtask.description && (
                                        <p className="text-sm text-gray-600 mb-3">{subtask.description}</p>
                                    )}

                                    {/* Metadata */}
                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span>{subtask.assignedTo?.name || 'Unassigned'}</span>
                                        </div>
                                        {subtask.deadline && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(subtask.deadline).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Buttons */}
                                    <div className="flex items-center gap-2 mt-3">
                                        <select
                                            value={subtask.status}
                                            onChange={(e) => handleUpdateStatus(subtask._id, e.target.value)}
                                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#3E2723] focus:border-transparent"
                                        >
                                            <option value="not_started">Not Started</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>

                                        <button
                                            onClick={() => handleDeleteSubtask(subtask._id, subtask.title)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete subtask"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Completion Badge */}
                                {subtask.status === 'completed' && (
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Check className="w-5 h-5 text-green-600" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Subtask Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                        <div className="bg-gradient-to-r from-[#3E2723] to-[#3E2723] px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Plus className="w-5 h-5" />
                                    Add Subtask
                                </h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAddSubtask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Subtask Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent"
                                    placeholder="e.g., Design database schema"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent"
                                    placeholder="Brief description of the subtask"
                                    rows="3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Assign To <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.assignedTo}
                                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent bg-white"
                                    required
                                >
                                    <option value="">Select team member</option>
                                    {teamMembers.map((member) => (
                                        <option key={member._id} value={member._id}>
                                            {member.name} - {member.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Deadline (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#3E2723] to-[#3E2723] text-white font-semibold rounded-xl hover:from-[#3E2723] hover:to-[#3E2723] shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Subtask'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubtaskManager;
