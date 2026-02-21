import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Mail,
    Phone,
    Tag,
    User,
    Users as TeamIcon,
    Briefcase,
    Clock,
    History,
    MessageSquare,
    Save,
    CheckCircle2,
    Trash2,
    Send,
    Edit3,
    TrendingUp,
    AlertTriangle,
    AlertOctagon,
    Plus,
    Bell
} from 'lucide-react';
import { leadsAPI, usersAPI, teamsAPI, followUpsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const statusColors = {
    new: 'bg-blue-600 text-white',
    contacted: 'bg-indigo-600 text-white',
    interested: 'bg-purple-600 text-white',
    follow_up_required: 'bg-yellow-500 text-slate-900',
    converted: 'bg-emerald-600 text-white',
    lost: 'bg-rose-600 text-white'
};

const LeadDetail = ({ leadId, onClose, onUpdate }) => {
    const { user, isAdmin, isTeamLead } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [note, setNote] = useState('');
    const [showLostReason, setShowLostReason] = useState(false);
    const [lostReason, setLostReason] = useState('');
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [escalationReason, setEscalationReason] = useState('');
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [followUpData, setFollowUpData] = useState({
        title: '',
        scheduledDate: '',
        notes: '',
        priority: 'medium'
    });
    const [statusNote, setStatusNote] = useState('');

    useEffect(() => {
        if (leadId) {
            fetchLeadDetails();
            fetchBasics();
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

    const fetchBasics = async () => {
        try {
            const [uRes, tRes] = await Promise.all([
                usersAPI.getAll(),
                teamsAPI.getAll()
            ]);
            setAllUsers(uRes.data.data);
            setAllTeams(tRes.data.data);
        } catch (error) {
            console.error('Error fetching basics:', error);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (newStatus === 'lost' && !lostReason) {
            setShowLostReason(true);
            return;
        }

        setUpdating(true);
        try {
            await leadsAPI.update(leadId, {
                status: newStatus,
                lostReason: newStatus === 'lost' ? lostReason : '',
                statusNote: statusNote.trim() || undefined
            });
            await fetchLeadDetails();
            onUpdate();
            setShowLostReason(false);
            setStatusNote(''); // Clear note after update
        } catch (error) {
            alert(error.response?.data?.message || 'Update failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleAssign = async (userId, teamId) => {
        setUpdating(true);
        try {
            await leadsAPI.assign(leadId, { assignedTo: userId, assignedTeam: teamId });
            await fetchLeadDetails();
            onUpdate();
        } catch (error) {
            alert(error.response?.data?.message || 'Assignment failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleConvertToProject = async () => {
        if (!window.confirm('Convert this lead to an active project?')) return;
        setUpdating(true);
        try {
            await leadsAPI.convertToProject(leadId);
            alert('Lead converted to project successfully!');
            onClose();
            onUpdate();
        } catch (error) {
            alert(error.response?.data?.message || 'Conversion failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;
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

    const handleEscalate = async () => {
        if (!escalationReason.trim()) {
            alert('Please provide a reason for escalation');
            return;
        }
        setUpdating(true);
        try {
            await leadsAPI.escalate(leadId, escalationReason);
            alert('Lead escalated to Admin successfully!');
            setShowEscalateModal(false);
            setEscalationReason('');
            await fetchLeadDetails();
            onUpdate();
        } catch (error) {
            alert(error.response?.data?.message || 'Escalation failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleScheduleFollowUp = async () => {
        if (!followUpData.title || !followUpData.scheduledDate) {
            alert('Please provide title and date');
            return;
        }
        setUpdating(true);
        try {
            await followUpsAPI.create({
                leadId: leadId,
                assignedTo: data.lead.assignedTo?._id || user._id,
                ...followUpData
            });
            alert('Follow-up scheduled successfully!');
            setShowFollowUpModal(false);
            setFollowUpData({ title: '', scheduledDate: '', notes: '', priority: 'medium' });
            await fetchLeadDetails();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to schedule follow-up');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return null;

    const lead = data.lead;
    const activities = data.activities;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-4xl h-full bg-gray-900 border-l border-gray-700/50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                {/* Header */}
                <div className="flex items-center justify-between p-10 border-b border-white/5 bg-gray-950 p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#3E2723]/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="flex items-center gap-8 relative z-10">
                        <div className={`w-20 h-20 rounded-[2rem] ${statusColors[lead.status]} shadow-2xl flex items-center justify-center border border-white/10 group hover:scale-110 transition-transform duration-500`}>
                            <Briefcase size={36} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{lead.clientName}</h2>
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-lg text-xs font-black uppercase tracking-widest border border-white/5 flex items-center gap-2">
                                    <Mail size={12} className="text-[#3E2723]" /> {lead.email}
                                </span>
                                <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-lg text-xs font-black uppercase tracking-widest border border-white/5 flex items-center gap-2">
                                    <Phone size={12} className="text-[#3E2723]" /> {lead.phone}
                                </span>
                                {lead.escalatedToAdmin && (
                                    <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-xs font-black uppercase tracking-widest border border-rose-500/30 flex items-center gap-2">
                                        <AlertOctagon size={12} /> ESCALATED
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-14 h-14 flex items-center justify-center bg-gray-800 text-gray-500 hover:text-white rounded-[1.5rem] transition-all border border-white/5 hover:bg-rose-500 group relative z-10">
                        <X size={28} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-[radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.03),transparent_40%)]">
                    {/* Action Bar */}
                    <div className="flex flex-wrap gap-4">
                        {/* Status Update */}
                        <select
                            className="flex-1 min-w-[200px] bg-gray-900 border border-gray-700 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-[#3E2723] appearance-none cursor-pointer"
                            value={lead.status}
                            onChange={(e) => handleUpdateStatus(e.target.value)}
                            disabled={updating}
                        >
                            {Object.keys(statusColors).map(s => (
                                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                            ))}
                        </select>

                        {/* Schedule Follow-up */}
                        <button
                            onClick={() => setShowFollowUpModal(true)}
                            className="flex items-center gap-2 px-6 py-4 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50"
                            disabled={updating}
                        >
                            <Bell size={16} />
                            Follow-Up
                        </button>

                        {/* Team Lead: Escalate */}
                        {isTeamLead && !lead.escalatedToAdmin && (
                            <button
                                onClick={() => setShowEscalateModal(true)}
                                className="flex items-center gap-2 px-6 py-4 bg-yellow-500 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-600 transition-all shadow-xl disabled:opacity-50"
                                disabled={updating}
                            >
                                <AlertOctagon size={16} />
                                Escalate
                            </button>
                        )}

                        {/* Convert to Project */}
                        {lead.status === 'converted' && (
                            <button
                                onClick={handleConvertToProject}
                                disabled={updating}
                                className="flex items-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-50"
                            >
                                <TrendingUp size={16} />
                                Convert
                            </button>
                        )}

                        {/* Admin Only: Delete */}
                        {isAdmin && (
                            <button
                                onClick={handleDelete}
                                disabled={updating}
                                className="flex items-center gap-2 px-6 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl disabled:opacity-50"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        )}
                    </div>

                    {/* Note Input for Status Change */}
                    <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                        <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                            <MessageSquare size={16} className="text-[#3E2723]" />
                            Add Note (Optional)
                        </label>
                        <textarea
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-gray-200 focus:ring-2 focus:ring-[#3E2723] outline-none resize-none"
                            placeholder="Add a note about this lead or status change..."
                            rows="3"
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            This note will be saved when you change the status or can be saved separately
                        </p>
                    </div>

                    {/* Assignment Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            className="bg-gray-900 border border-gray-700 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-[#3E2723] appearance-none cursor-pointer"
                            value={lead.assignedTo?._id || ''}
                            onChange={(e) => handleAssign(e.target.value, lead.assignedTeam?._id)}
                            disabled={updating}
                        >
                            <option value="">Assign: User</option>
                            {allUsers.map(u => <option key={u._id} value={u._id}>{u.name.toUpperCase()}</option>)}
                        </select>
                        <select
                            className="bg-gray-900 border border-gray-700 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-[#3E2723] appearance-none cursor-pointer"
                            value={lead.assignedTeam?._id || ''}
                            onChange={(e) => handleAssign(lead.assignedTo?._id, e.target.value)}
                            disabled={updating}
                        >
                            <option value="">Assign: Team</option>
                            {allTeams.map(t => <option key={t._id} value={t._id}>{t.name.toUpperCase()}</option>)}
                        </select>
                    </div>

                    {showLostReason && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-2 text-rose-400 font-bold">
                                <AlertTriangle size={20} />
                                <span>Reason for losing this lead?</span>
                            </div>
                            <textarea
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-gray-200 focus:ring-2 focus:ring-rose-500 outline-none"
                                placeholder="Enter reason..."
                                value={lostReason}
                                onChange={(e) => setLostReason(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button onClick={() => handleUpdateStatus('lost')} className="px-4 py-2 bg-rose-500 text-white rounded-lg font-bold text-sm">Submit</button>
                                <button onClick={() => setShowLostReason(false)} className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm">Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Status History Timeline */}
                    {lead.statusHistory && lead.statusHistory.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <History className="text-purple-500" size={18} />
                                Status History
                            </h3>
                            <div className="space-y-3 pl-4 border-l-2 border-gray-700/50">
                                {lead.statusHistory.slice().reverse().map((history, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                                        <div className="bg-gray-800/30 p-4 rounded-xl space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[history.status]}`}>
                                                    {history.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(history.changedAt).toLocaleString()}
                                                </span>
                                            </div>
                                            {history.notes && <p className="text-sm text-gray-400">{history.notes}</p>}
                                            {history.changedBy && (
                                                <div className="flex items-center gap-2">
                                                    <User size={12} className="text-gray-500" />
                                                    <span className="text-xs text-gray-500">{history.changedBy.name || 'System'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Tag className="text-[#3E2723]" size={18} />
                                Lead Information
                            </h3>
                            <div className="space-y-4 bg-gray-800/20 p-6 rounded-3xl border border-gray-700/30">
                                <div className="flex justify-between items-center text-sm border-b border-gray-700/30 pb-3">
                                    <span className="text-gray-400">Category</span>
                                    <span className="text-white font-medium capitalize">{lead.category.replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-gray-700/30 pb-3">
                                    <span className="text-gray-400">Estimated Value</span>
                                    <span className="text-white font-bold text-lg">${lead.estimatedValue?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-gray-700/30 pb-3">
                                    <span className="text-gray-400">Priority</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lead.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                                        lead.priority === 'high' ? 'bg-[#3E2723]/20 text-[#5D4037]' :
                                            'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {lead.priority?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Expected Close</span>
                                    <span className="text-white font-medium">
                                        {lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toLocaleDateString() : 'Not set'}
                                    </span>
                                </div>
                            </div>

                            {lead.inquiryMessage && (
                                <>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-8">
                                        <MessageSquare className="text-blue-500" size={18} />
                                        Inquiry Message
                                    </h3>
                                    <div className="bg-gray-800/20 p-6 rounded-3xl border border-gray-700/30 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                        {lead.inquiryMessage}
                                    </div>
                                </>
                            )}

                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-8">
                                <MessageSquare className="text-blue-500" size={18} />
                                Description
                            </h3>
                            <div className="bg-gray-800/20 p-6 rounded-3xl border border-gray-700/30 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {lead.description || 'No description provided.'}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <History className="text-purple-500" size={18} />
                                Timeline & Activity
                            </h3>
                            <div className="space-y-6 pl-4 border-l border-gray-700/50">
                                {activities.map((activity) => (
                                    <div key={activity._id} className="relative">
                                        <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#3E2723] shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-200 capitalize">{activity.action.replace('lead_', '').replace('_', ' ')}</span>
                                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {new Date(activity.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">{activity.details}</p>
                                            <div className="flex items-center gap-1.5 pt-1">
                                                <div className="w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center text-[8px] text-white">
                                                    {activity.userId?.name.charAt(0)}
                                                </div>
                                                <span className="text-[10px] text-gray-500">{activity.userId?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Escalation Modal */}
            {showEscalateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full mx-4 space-y-6">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <AlertOctagon className="text-yellow-500" size={28} />
                            Escalate to Admin
                        </h3>
                        <p className="text-gray-400">Provide a detailed reason for escalating this lead to administrators.</p>
                        <textarea
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-gray-200 focus:ring-2 focus:ring-yellow-500 outline-none min-h-[120px]"
                            placeholder="Explain why this lead needs admin attention..."
                            value={escalationReason}
                            onChange={(e) => setEscalationReason(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleEscalate}
                                disabled={updating}
                                className="flex-1 px-6 py-3 bg-yellow-500 text-slate-900 rounded-xl font-bold hover:bg-yellow-600 transition-all disabled:opacity-50"
                            >
                                Escalate Lead
                            </button>
                            <button
                                onClick={() => setShowEscalateModal(false)}
                                className="px-6 py-3 bg-gray-800 text-gray-400 rounded-xl font-bold hover:bg-gray-700 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Follow-Up Modal */}
            {showFollowUpModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full mx-4 space-y-6">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Bell className="text-blue-500" size={28} />
                            Schedule Follow-Up
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Call to discuss pricing..."
                                    value={followUpData.title}
                                    onChange={(e) => setFollowUpData({ ...followUpData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={followUpData.scheduledDate}
                                    onChange={(e) => setFollowUpData({ ...followUpData, scheduledDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Priority</label>
                                <select
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={followUpData.priority}
                                    onChange={(e) => setFollowUpData({ ...followUpData, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Notes (Optional)</label>
                                <textarea
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Additional notes..."
                                    rows="3"
                                    value={followUpData.notes}
                                    onChange={(e) => setFollowUpData({ ...followUpData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleScheduleFollowUp}
                                disabled={updating}
                                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
                            >
                                Schedule
                            </button>
                            <button
                                onClick={() => setShowFollowUpModal(false)}
                                className="px-6 py-3 bg-gray-800 text-gray-400 rounded-xl font-bold hover:bg-gray-700 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadDetail;
