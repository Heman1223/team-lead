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
    Archive
} from 'lucide-react';
import { leadsAPI, usersAPI, teamsAPI } from '../../services/api';

const statusColors = {
    new: 'bg-blue-600 text-white',
    contacted: 'bg-indigo-600 text-white',
    qualified: 'bg-orange-600 text-white',
    proposal_sent: 'bg-indigo-500 text-white',
    negotiation: 'bg-yellow-500 text-slate-900',
    won: 'bg-emerald-600 text-white',
    lost: 'bg-rose-600 text-white',
    archived: 'bg-slate-600 text-white'
};

const LeadDetail = ({ leadId, onClose, onUpdate }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [note, setNote] = useState('');
    const [showLostReason, setShowLostReason] = useState(false);
    const [lostReason, setLostReason] = useState('');

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
                lostReason: newStatus === 'lost' ? lostReason : ''
            });
            await fetchLeadDetails();
            onUpdate();
            setShowLostReason(false);
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

    if (loading) return null;

    const lead = data.lead;
    const activities = data.activities;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-4xl h-full bg-gray-900 border-l border-gray-700/50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                {/* Header */}
                <div className="flex items-center justify-between p-10 border-b border-white/5 bg-gray-950 p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="flex items-center gap-8 relative z-10">
                        <div className={`w-20 h-20 rounded-[2rem] ${statusColors[lead.status]} shadow-2xl flex items-center justify-center border border-white/10 group hover:scale-110 transition-transform duration-500`}>
                            <Briefcase size={36} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{lead.clientName}</h2>
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-lg text-xs font-black uppercase tracking-widest border border-white/5 flex items-center gap-2">
                                    <Mail size={12} className="text-orange-500" /> {lead.email}
                                </span>
                                <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-lg text-xs font-black uppercase tracking-widest border border-white/5 flex items-center gap-2">
                                    <Phone size={12} className="text-orange-500" /> {lead.phone}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-14 h-14 flex items-center justify-center bg-gray-800 text-gray-500 hover:text-white rounded-[1.5rem] transition-all border border-white/5 hover:bg-rose-500 group relative z-10">
                        <X size={28} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-[radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.03),transparent_40%)]">
                    {/* Action Bar */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 p-6 bg-gray-800/30 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
                        {lead.status === 'won' && (
                            <button
                                onClick={handleConvertToProject}
                                disabled={updating}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                            >
                                <TrendingUp size={18} />
                                Convert to Project
                            </button>
                        )}
                        <div className="relative">
                            <select
                                className="w-full bg-gray-900 border border-gray-700 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                                value={lead.status}
                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                disabled={updating || lead.status === 'archived'}
                            >
                                {Object.keys(statusColors).map(s => (
                                    <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <select
                            className="bg-gray-900 border border-gray-700 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                            value={lead.assignedTo?._id || ''}
                            onChange={(e) => handleAssign(e.target.value, lead.assignedTeam?._id)}
                            disabled={updating || lead.status === 'archived'}
                        >
                            <option value="">All Sign: User</option>
                            {allUsers.map(u => <option key={u._id} value={u._id}>{u.name.toUpperCase()}</option>)}
                        </select>
                        <select
                            className="bg-gray-900 border border-gray-700 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                            value={lead.assignedTeam?._id || ''}
                            onChange={(e) => handleAssign(lead.assignedTo?._id, e.target.value)}
                            disabled={updating || lead.status === 'archived'}
                        >
                            <option value="">All Sign: Team</option>
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

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Tag className="text-orange-500" size={18} />
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
                                        lead.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
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
                                {activities.map((activity, idx) => (
                                    <div key={activity._id} className="relative">
                                        <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
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
        </div>
    );
};

export default LeadDetail;
