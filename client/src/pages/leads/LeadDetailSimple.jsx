import React, { useState, useEffect } from 'react';
import {
    X,
    Mail,
    Phone,
    User,
    Calendar,
    DollarSign,
    Tag,
    Clock,
    MessageSquare,
    Bell,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Edit3,
    Save
} from 'lucide-react';
import { leadsAPI, usersAPI, teamsAPI, followUpsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LeadDetail = ({ leadId, onClose, onUpdate }) => {
    const { user, isAdmin, isTeamLead } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [note, setNote] = useState('');
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [followUpData, setFollowUpData] = useState({
        title: '',
        scheduledDate: '',
        scheduledTime: '',
        priority: 'medium',
        type: 'call'  // Add type field with default value
    });

    useEffect(() => {
        if (leadId) {
            fetchLeadDetails();
            fetchUsers();
        }
    }, [leadId]);

    const fetchLeadDetails = async () => {
        try {
            const response = await leadsAPI.getOne(leadId);
            setData(response.data.data);
        } catch (error) {
            console.error('Error fetching lead details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.getAll();
            setAllUsers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        setUpdating(true);
        try {
            await leadsAPI.update(leadId, { status: newStatus });
            await fetchLeadDetails();
            onUpdate();
        } catch (error) {
            alert(error.response?.data?.message || 'Update failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleAssign = async (userId) => {
        setUpdating(true);
        try {
            await leadsAPI.assign(leadId, { assignedTo: userId });
            await fetchLeadDetails();
            onUpdate();
        } catch (error) {
            alert(error.response?.data?.message || 'Assignment failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleScheduleFollowUp = async () => {
        // Validate required fields
        if (!followUpData.title || !followUpData.title.trim()) {
            alert('Please select a title for the follow-up');
            return;
        }
        if (!followUpData.scheduledDate) {
            alert('Please select a date for the follow-up');
            return;
        }
        
        setUpdating(true);
        try {
            const payload = {
                leadId: leadId,
                assignedTo: data.lead.assignedTo?._id || user._id,
                title: followUpData.title.trim(),
                scheduledDate: followUpData.scheduledDate,
                priority: followUpData.priority || 'medium',
                type: 'call'  // HARDCODED to 'call' - valid enum value
            };
            
            // Add optional fields
            if (followUpData.scheduledTime) {
                payload.scheduledTime = followUpData.scheduledTime;
            }
            
            console.log('=== CLIENT: Scheduling follow-up ===');
            console.log('followUpData state:', followUpData);
            console.log('Payload being sent:', JSON.stringify(payload, null, 2));
            
            const response = await followUpsAPI.create(payload);
            console.log('Follow-up created successfully:', response.data);
            
            alert('Follow-up scheduled successfully!');
            setShowFollowUpModal(false);
            setFollowUpData({ title: '', scheduledDate: '', scheduledTime: '', priority: 'medium', type: 'call' });
            await fetchLeadDetails();
        } catch (error) {
            console.error('Follow-up scheduling error:', error);
            console.error('Error response:', error.response?.data);
            
            // Build detailed error message
            let errorMessage = 'Failed to schedule follow-up';
            
            if (error.response?.data) {
                const data = error.response.data;
                
                // Check for validation errors array
                if (data.errors && Array.isArray(data.errors)) {
                    errorMessage = 'Validation Error:\n' + data.errors.join('\n');
                }
                // Check for single message
                else if (data.message) {
                    errorMessage = data.message;
                }
                // Check for error string
                else if (data.error) {
                    errorMessage = data.error;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this lead?')) return;
        setUpdating(true);
        try {
            await leadsAPI.delete(leadId);
            alert('Lead deleted successfully!');
            onClose();
            onUpdate();
        } catch (error) {
            alert(error.response?.data?.message || 'Delete failed');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            new: 'bg-blue-100 text-blue-700 border-blue-200',
            contacted: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            interested: 'bg-purple-100 text-purple-700 border-purple-200',
            follow_up: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            converted: 'bg-green-100 text-green-700 border-green-200',
            not_interested: 'bg-red-100 text-red-700 border-red-200'
        };
        return colors[status] || colors.new;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const lead = data?.lead;
    const activities = data?.activities || [];

    if (!lead) return null;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}></div>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-2">{lead.clientName || 'Unknown'}</h2>
                                <div className="flex flex-wrap gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} />
                                        <span>{lead.email || 'No email'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} />
                                        <span>{lead.phone || 'No phone'}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setShowFollowUpModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                            >
                                <Bell size={16} />
                                Schedule Follow-Up
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={handleDelete}
                                    disabled={updating}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            )}
                        </div>

                        {/* Lead Information */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Lead Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <select
                                        value={lead.status || 'new'}
                                        onChange={(e) => handleUpdateStatus(e.target.value)}
                                        disabled={updating}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                                    >
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="interested">Interested</option>
                                        <option value="follow_up">Follow Up</option>
                                        <option value="converted">Converted</option>
                                        <option value="not_interested">Not Interested</option>
                                    </select>
                                </div>

                                {/* Assigned To */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned To</label>
                                    <select
                                        value={lead.assignedTo?._id || ''}
                                        onChange={(e) => handleAssign(e.target.value)}
                                        disabled={updating}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                                    >
                                        <option value="">Unassigned</option>
                                        {allUsers.map(u => (
                                            <option key={u._id} value={u._id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                    <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 capitalize">
                                        {(lead.category || 'other').replace('_', ' ')}
                                    </div>
                                </div>

                                {/* Estimated Value */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Value</label>
                                    <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold">
                                        ${(lead.estimatedValue || 0).toLocaleString()}
                                    </div>
                                </div>

                                {/* Source */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Source</label>
                                    <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 capitalize">
                                        {(lead.source || 'unknown').replace('_', ' ')}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                                    <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 capitalize">
                                        {lead.priority || 'medium'}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {lead.description && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                    <div className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700">
                                        {lead.description}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Activity Timeline */}
                        <div className="bg-gray-50 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Timeline</h3>
                            
                            {activities.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No activity yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {activities.slice(0, 10).map((activity, index) => (
                                        <div key={index} className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                                    <Clock size={16} className="text-orange-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900">{activity.action?.replace('_', ' ')}</p>
                                                <p className="text-xs text-gray-600">{activity.details}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(activity.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Follow-Up Modal */}
            {showFollowUpModal && (
                <>
                    <div className="fixed inset-0 z-[60] bg-black/50" onClick={() => setShowFollowUpModal(false)}></div>
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md pointer-events-auto">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900">Schedule Follow-Up</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                                    <select
                                        value={followUpData.title}
                                        onChange={(e) => setFollowUpData({ ...followUpData, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">Select follow-up title...</option>
                                        <option value="Follow-up call">Follow-up call</option>
                                        <option value="Send proposal">Send proposal</option>
                                        <option value="Schedule meeting">Schedule meeting</option>
                                        <option value="Send quotation">Send quotation</option>
                                        <option value="Product demo">Product demo</option>
                                        <option value="Check requirements">Check requirements</option>
                                        <option value="Discuss pricing">Discuss pricing</option>
                                        <option value="Send contract">Send contract</option>
                                        <option value="Follow-up email">Follow-up email</option>
                                        <option value="Review feedback">Review feedback</option>
                                        <option value="Close deal">Close deal</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={followUpData.scheduledDate}
                                        onChange={(e) => setFollowUpData({ ...followUpData, scheduledDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                                    <input
                                        type="time"
                                        value={followUpData.scheduledTime}
                                        onChange={(e) => setFollowUpData({ ...followUpData, scheduledTime: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                                    <select
                                        value={followUpData.priority}
                                        onChange={(e) => setFollowUpData({ ...followUpData, priority: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-200 flex gap-3">
                                <button
                                    onClick={() => setShowFollowUpModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleScheduleFollowUp}
                                    disabled={updating}
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50"
                                >
                                    Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default LeadDetail;
