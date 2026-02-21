import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    AlertCircle,
    Check,
    UserPlus
} from 'lucide-react';
import { leadsAPI, usersAPI, teamsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CreateLeadModal = ({ onClose, onSuccess }) => {
    const { isAdmin, isTeamLead, user } = useAuth();
    const [formData, setFormData] = useState({
        clientName: '',
        email: '',
        phone: '',
        category: 'web_development',
        description: '',
        inquiryMessage: '',
        source: 'manual',
        priority: 'medium',
        estimatedValue: 0,
        expectedCloseDate: '',
        assignedTo: '',
        assignedTeam: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        const fetchAssignmentOptions = async () => {
            if (!isAdmin && !isTeamLead) return;

            try {
                // Fetch Teams
                // If admin, fetch all teams. If team lead, fetch their led team.
                // For simplicity, we'll just fetch all teams for admin, and filtered for team lead if API supports
                // But specifically for 'teams', let's just get all and filter client-side or assume API handles it
                const teamsRes = await teamsAPI.getAll(); 
                // Note: teamsAPI.getAll might return all teams. 
                // If Team Lead, we should probably use teamsAPI.getLedTeams() or similar if available, 
                // but for now let's assume getAll and filter.
                
                let relevantTeams = teamsRes.data.data;
                if (isTeamLead) {
                    // Filter to only teams led by this user
                    relevantTeams = relevantTeams.filter(t => t.leadId?._id === user._id || t.leadId === user._id);
                }
                setTeams(relevantTeams);

                // Fetch Users
                // Ideally we filter users by the selected team, but initially we might show all or none.
                // Let's fetch all users for Admin, and team members for Team Lead
                const usersRes = await usersAPI.getAll({ limit: 100 });
                let relevantUsers = usersRes.data.data;
                
                if (isTeamLead && relevantTeams.length > 0) {
                     // Get members of the led team(s)
                     const teamMemberIds = relevantTeams.flatMap(t => t.members.map(m => m._id || m));
                     relevantUsers = relevantUsers.filter(u => teamMemberIds.includes(u._id));
                }
                setUsers(relevantUsers);

            } catch (err) {
                console.error("Error fetching assignment options", err);
            }
        };

        fetchAssignmentOptions();
    }, [isAdmin, isTeamLead, user._id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Remove empty assignment fields to avoid validation errors if optional
            const submitData = { ...formData };
            if (!submitData.assignedTo) delete submitData.assignedTo;
            if (!submitData.assignedTeam) delete submitData.assignedTeam;

            console.log('Creating lead with data:', submitData);
            const response = await leadsAPI.create(submitData);
            console.log('Lead created successfully:', response.data);
            
            // If assignedTo is present, we might need to call assign API separately if create doesn't handle it
            // checking leadController.createLead... it just does Lead.create(req.body). 
            // Lead schema has assignedTo/assignedTeam, so it should work directly if passed.
            
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error creating lead:', err);
            let errorMessage = 'Failed to create lead';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3E2723] to-[#3E2723]" />

                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gray-900/50">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Create New Lead</h2>
                        <p className="text-gray-500 text-xs font-medium mt-0.5">Manual entry</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-all border border-white/5">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-3 text-rose-400 text-sm font-semibold animate-in slide-in-from-top-4">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#3E2723]">Client Name</label>
                            <input
                                required
                                name="clientName"
                                value={formData.clientName}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#3E2723] outline-none transition-all placeholder:text-gray-600"
                                placeholder="Enter client name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#3E2723]">Email</label>
                            <input
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#3E2723] outline-none transition-all placeholder:text-gray-600"
                                placeholder="client@domain.com"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#3E2723]">Phone</label>
                            <input
                                required
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#3E2723] outline-none transition-all placeholder:text-gray-600"
                                placeholder="+1 (000) 000-0000"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#3E2723]">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#3E2723] outline-none appearance-none cursor-pointer"
                            >
                                <option value="web_development">Web Development</option>
                                <option value="mobile_app">Mobile App</option>
                                <option value="ui_ux_design">UI/UX Design</option>
                                <option value="digital_marketing">Digital Marketing</option>
                                <option value="seo">SEO</option>
                                <option value="consulting">Consulting</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#3E2723]">Estimated Value ($)</label>
                            <input
                                type="number"
                                name="estimatedValue"
                                value={formData.estimatedValue}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#3E2723] outline-none transition-all"
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#3E2723]">Expected Close Date</label>
                            <input
                                type="date"
                                name="expectedCloseDate"
                                value={formData.expectedCloseDate}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#3E2723] outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#3E2723]">Source</label>
                            <select
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#3E2723] outline-none appearance-none cursor-pointer"
                            >
                                <option value="manual">Manual Entry</option>
                                <option value="website">Website Form</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="referral">Referral</option>
                                <option value="cold_call">Cold Call</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#3E2723]">Priority</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#3E2723] outline-none appearance-none cursor-pointer"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    {(isAdmin || isTeamLead) && (
                        <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800 space-y-3">
                            <div className="flex items-center gap-2 text-[#5D4037] text-xs font-bold uppercase tracking-wider">
                                <UserPlus size={14} />
                                Immediate Assignment
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400">Assign to Team</label>
                                    <select
                                        name="assignedTeam"
                                        value={formData.assignedTeam}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#3E2723] outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">-- No Team --</option>
                                        {teams.map(team => (
                                            <option key={team._id} value={team._id}>{team.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400">Assign to User</label>
                                    <select
                                        name="assignedTo"
                                        value={formData.assignedTo}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#3E2723] outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">-- No User --</option>
                                        {users.map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#3E2723]">Inquiry Message</label>
                        <textarea
                            name="inquiryMessage"
                            value={formData.inquiryMessage}
                            onChange={handleChange}
                            rows="2"
                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#3E2723] outline-none transition-all resize-none placeholder:text-gray-600"
                            placeholder="Paste the initial inquiry message or notes here..."
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#3E2723]">Internal Description / Notes</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#3E2723] outline-none transition-all resize-none placeholder:text-gray-600"
                            placeholder="Enter any internal notes or additional requirements..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-800 text-gray-400 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-all border border-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-gradient-to-r from-[#3E2723] to-[#3E2723] text-white rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={16} />
                                    Create Lead
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateLeadModal;
