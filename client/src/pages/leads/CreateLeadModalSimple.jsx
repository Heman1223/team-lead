import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    AlertCircle,
    UserPlus,
    Mail,
    Phone,
    User,
    DollarSign,
    Calendar,
    Tag
} from 'lucide-react';
import { leadsAPI, usersAPI, teamsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CreateLeadModalSimple = ({ onClose, onSuccess }) => {
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
                const teamsRes = await teamsAPI.getAll(); 
                let relevantTeams = teamsRes.data.data;
                if (isTeamLead) {
                    relevantTeams = relevantTeams.filter(t => t.leadId?._id === user._id || t.leadId === user._id);
                }
                setTeams(relevantTeams);

                const usersRes = await usersAPI.getAll({ limit: 100 });
                let relevantUsers = usersRes.data.data;
                
                if (isTeamLead && relevantTeams.length > 0) {
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
            const submitData = { ...formData };
            if (!submitData.assignedTo) delete submitData.assignedTo;
            if (!submitData.assignedTeam) delete submitData.assignedTeam;

            await leadsAPI.create(submitData);
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
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}></div>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">Create New Lead</h2>
                                <p className="text-orange-100 text-sm">Add a new lead to your pipeline</p>
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
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700">
                                <AlertCircle size={20} />
                                <span className="text-sm font-semibold">{error}</span>
                            </div>
                        )}

                        {/* Contact Information */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <User size={20} className="text-orange-600" />
                                Contact Information
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Client Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        name="clientName"
                                        value={formData.clientName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            required
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            required
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                            </div>
                        </div>

                        {/* Lead Details */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Tag size={20} className="text-orange-600" />
                                Lead Details
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Estimated Value ($)
                                    </label>
                                    <div className="relative">
                                        <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            name="estimatedValue"
                                            value={formData.estimatedValue}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="5000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Expected Close Date
                                    </label>
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            name="expectedCloseDate"
                                            value={formData.expectedCloseDate}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Source
                                    </label>
                                    <select
                                        name="source"
                                        value={formData.source}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="manual">Manual Entry</option>
                                        <option value="website">Website Form</option>
                                        <option value="linkedin">LinkedIn</option>
                                        <option value="referral">Referral</option>
                                        <option value="cold_call">Cold Call</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Assignment (Admin/Team Lead Only) */}
                        {(isAdmin || isTeamLead) && (
                            <div className="bg-blue-50 rounded-xl p-6 space-y-4 border border-blue-200">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <UserPlus size={20} className="text-blue-600" />
                                    Assignment (Optional)
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Assign to Team
                                        </label>
                                        <select
                                            name="assignedTeam"
                                            value={formData.assignedTeam}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="">-- No Team --</option>
                                            {teams.map(team => (
                                                <option key={team._id} value={team._id}>{team.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Assign to User
                                        </label>
                                        <select
                                            name="assignedTo"
                                            value={formData.assignedTo}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

                        {/* Messages & Notes */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Inquiry Message
                                </label>
                                <textarea
                                    name="inquiryMessage"
                                    value={formData.inquiryMessage}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                    placeholder="Paste the initial inquiry message from the client..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Internal Notes
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                    placeholder="Add any internal notes or requirements..."
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Create Lead
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CreateLeadModalSimple;
