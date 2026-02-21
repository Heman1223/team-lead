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
    Save,
    Plus
} from 'lucide-react';
import { leadsAPI, usersAPI, teamsAPI, followUpsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LeadDetail = ({ leadId, onClose, onUpdate }) => {
    const { user, isAdmin, isTeamLead } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('history');
    const [note, setNote] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [followUpData, setFollowUpData] = useState({
        title: '',
        scheduledDate: '',
        scheduledTime: '',
        priority: 'medium',
        type: 'call'
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
            setSelectedStatus(response.data.data.lead.status); // Set initial status
        } catch (error) {
            console.error('Error fetching lead details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.getAll();
            let users = response.data.data || [];

            if (isTeamLead && !isAdmin) {
                const teamsResponse = await teamsAPI.getAll();
                const myTeam = teamsResponse.data.data?.find(t => t.leadId?._id === user._id || t.leadId === user._id);

                if (myTeam && myTeam.members) {
                    const memberIds = myTeam.members.map(m => m._id || m);
                    users = users.filter(u => memberIds.includes(u._id));
                }
            }

            setAllUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (newStatus === data.lead.status) return;
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

    const handleSaveNote = async () => {
        if (!note.trim()) return;
        setUpdating(true);
        try {
            await leadsAPI.addNote(leadId, { note: note.trim() });
            await fetchLeadDetails();
            setNote('');
            setActiveTab('history'); // Switch to history to see the new note
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add note');
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
                type: followUpData.type || 'call'
            };

            if (followUpData.scheduledTime) {
                payload.scheduledTime = followUpData.scheduledTime;
            }

            console.log('Sending Follow-up Payload:', payload);
            await followUpsAPI.create(payload);
            alert('Follow-up scheduled successfully!');
            setShowFollowUpModal(false);
            setFollowUpData({ title: '', scheduledDate: '', scheduledTime: '', priority: 'medium', type: 'call' });
            await fetchLeadDetails();
        } catch (error) {
            console.error('Follow-up scheduling error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to schedule follow-up';
            const validationErrors = error.response?.data?.errors?.join('\n');
            alert(validationErrors ? `${errorMsg}:\n${validationErrors}` : errorMsg);
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E2723]"></div>
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
                    <div className="bg-gradient-to-r from-[#3E2723] to-[#5D4037] p-6 text-white">
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
                    <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col md:flex-row">
                        {/* Left Column: Lead Info */}
                        <div className="w-full md:w-1/3 border-r border-gray-200 bg-white p-6 overflow-y-auto">
                            <div className="space-y-6">
                                {/* Status Checker */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Status</label>
                                    <select
                                        value={selectedStatus || 'new'}
                                        onChange={(e) => handleUpdateStatus(e.target.value)}
                                        disabled={updating}
                                        className={`w-full px-4 py-3 border-2 rounded-xl font-bold text-sm focus:outline-none transition-all ${selectedStatus === 'converted' ? 'border-green-500 text-green-700 bg-green-50' :
                                            selectedStatus === 'lost' ? 'border-red-300 text-red-700 bg-red-50' :
                                                'border-[#3E2723] text-gray-900'
                                            }`}
                                    >
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="interested">Interested</option>
                                        <option value="follow_up">Follow Up</option>
                                        <option value="converted">Converted</option>
                                        <option value="not_interested">Not Interested</option>
                                    </select>
                                </div>

                                {/* Assignee */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assigned To</label>
                                    {(isAdmin || isTeamLead) ? (
                                        <select
                                            value={lead.assignedTo?._id || ''}
                                            onChange={(e) => handleAssign(e.target.value)}
                                            disabled={updating}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
                                        >
                                            <option value="">Unassigned</option>
                                            {allUsers.map(u => (
                                                <option key={u._id} value={u._id}>{u.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm font-medium flex items-center gap-2">
                                            <User size={16} className="text-gray-400" />
                                            {lead.assignedTo?.name || 'Unassigned'}
                                        </div>
                                    )}
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                                        <div className="text-sm font-medium text-gray-900 capitalize">{(lead.category || 'other').replace('_', ' ')}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estimated Value</label>
                                        <div className="text-sm font-medium text-gray-900">${(lead.estimatedValue || 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Source</label>
                                        <div className="text-sm font-medium text-gray-900 capitalize">{(lead.source || 'unknown').replace('_', ' ')}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Priority</label>
                                        <div className="text-sm font-medium text-gray-900 capitalize">{lead.priority || 'medium'}</div>
                                    </div>
                                </div>

                                {/* Client Inquiry */}
                                {lead.inquiryMessage && (
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                        <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Inquiry Message</label>
                                        <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">{lead.inquiryMessage}</p>
                                    </div>
                                )}

                                {/* Internal Description */}
                                {lead.description && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Original Notes</label>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">{lead.description}</p>
                                    </div>
                                )}

                                {/* Admin Actions */}
                                {isAdmin && (
                                    <button
                                        onClick={handleDelete}
                                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-semibold"
                                    >
                                        <Trash2 size={16} />
                                        Delete Lead
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Activity & Notes */}
                        <div className="w-full md:w-2/3 p-6 flex flex-col h-full overflow-hidden">
                            {/* Activity Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex bg-gray-200 p-1 rounded-lg">
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Activity Log
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('notes')}
                                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'notes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Notes
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowFollowUpModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-bold shadow-sm"
                                >
                                    <Bell size={16} />
                                    Schedule Follow-Up
                                </button>
                            </div>

                            {/* New Note & Timeline Container */}
                            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                                {/* Add Note Input Area */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <Edit3 size={16} className="text-[#3E2723]" />
                                        Add a Note
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Type a note about this lead..."
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723] min-h-[80px] text-sm mb-3 resize-none"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveNote}
                                            disabled={!note.trim() || updating}
                                            className="px-4 py-2 bg-[#3E2723] text-white rounded-lg text-sm font-bold hover:bg-[#2E1B17] disabled:opacity-50 transition-colors"
                                        >
                                            {updating ? 'Saving...' : 'Post Note'}
                                        </button>
                                    </div>
                                </div>

                                {/* Activities Timeline */}
                                <div className="space-y-4">
                                    {activities.length === 0 ? (
                                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">No activity recorded yet</p>
                                            <p className="text-xs text-gray-400 mt-1">Notes and status changes will appear here</p>
                                        </div>
                                    ) : (
                                        activities.filter(a => activeTab === 'notes' ? a.action === 'note_added' || a.action === 'lead_status_changed' : true).map((activity, index) => {
                                            const isNote = activity.action === 'note_added';
                                            const isStatusChange = activity.action === 'lead_status_changed';
                                            const isAssignment = activity.action === 'lead_assigned';

                                            return (
                                                <div key={index} className="flex gap-4 group">
                                                    {/* Icon Column */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-gray-50 shadow-sm z-10 ${isNote ? 'bg-[#3E2723]/10 text-[#3E2723]' :
                                                            isStatusChange ? 'bg-blue-100 text-blue-600' :
                                                                'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            {isNote ? <MessageSquare size={18} /> :
                                                                isStatusChange ? <CheckCircle2 size={18} /> :
                                                                    <Clock size={18} />}
                                                        </div>
                                                        {index < activities.length - 1 && (
                                                            <div className="w-0.5 h-full bg-gray-200 -my-2"></div>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 pb-6">
                                                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative hover:shadow-md transition-shadow">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-gray-900 text-sm">
                                                                        {activity.userId?.name || 'System'}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                                                                        {activity.action?.replace(/_/g, ' ')}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-gray-400 font-medium font-mono">
                                                                    {new Date(activity.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>

                                                            <p className={`text-sm ${isNote ? 'text-gray-800' : 'text-gray-600'}`}>
                                                                {activity.details}
                                                            </p>

                                                            {/* Status Change Metadata */}
                                                            {isStatusChange && activity.metadata?.oldStatus && (
                                                                <div className="mt-3 flex items-center gap-2 text-xs font-semibold bg-gray-50 p-2 rounded-lg inline-flex">
                                                                    <span className="text-gray-500 uppercase">{activity.metadata.oldStatus}</span>
                                                                    <span className="text-gray-400">→</span>
                                                                    <span className={`uppercase ${activity.metadata.newStatus === 'converted' ? 'text-green-600' :
                                                                        activity.metadata.newStatus === 'lost' ? 'text-red-600' :
                                                                            'text-blue-600'
                                                                        }`}>{activity.metadata.newStatus}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                                    <input
                                        type="time"
                                        value={followUpData.scheduledTime}
                                        onChange={(e) => setFollowUpData({ ...followUpData, scheduledTime: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
                                    />
                                </div>
                                <div>
                                    <select
                                        value={followUpData.priority}
                                        onChange={(e) => setFollowUpData({ ...followUpData, priority: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                                    <select
                                        value={followUpData.type}
                                        onChange={(e) => setFollowUpData({ ...followUpData, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
                                    >
                                        <option value="call">Call</option>
                                        <option value="email">Email</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="demo">Demo</option>
                                        <option value="proposal">Proposal</option>
                                        <option value="other">Other</option>
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
                                    disabled={updating || !followUpData.title || !followUpData.scheduledDate}
                                    className="flex-1 px-4 py-2 bg-[#3E2723] text-white rounded-lg hover:bg-[#2E1B17] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
