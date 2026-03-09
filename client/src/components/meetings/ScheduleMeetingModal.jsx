import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, MapPin, Users, Loader2, Search, AlertCircle, Plus } from 'lucide-react';
import { meetingsAPI, leadsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ScheduleMeetingModal = ({ isOpen, onClose, onSuccess, initialDate, initialData }) => {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Lead Selection States
    const [searchLead, setSearchLead] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
    const [isNewLead, setIsNewLead] = useState(false);
    const [leadEmail, setLeadEmail] = useState('');
    const [showLeadDropdown, setShowLeadDropdown] = useState(false);

    // Member Selection States
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);

    const formatForInput = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const getDefaultTime = (offsetHours = 0) => {
        const d = new Date();
        d.setHours(d.getHours() + offsetHours);
        d.setMinutes(0);
        return formatForInput(d);
    };

    const [formData, setFormData] = useState({
        title: '',
        leadId: '',
        startTime: initialDate ? formatForInput(initialDate) : getDefaultTime(1),
        endTime: initialDate ? formatForInput(new Date(initialDate).getTime() + 60 * 60 * 1000) : getDefaultTime(2),
        type: 'online',
        meetingLink: '',
        location: '',
        description: '',
        participants: [],
        reminderTime: 30
    });

    useEffect(() => {
        if (initialData?.leadId) {
            const lead = initialData.leadId;
            setSearchLead(lead.clientName || '');
            setLeadEmail(lead.email || '');
            setSelectedLead(lead);
            setFormData(prev => ({
                ...prev,
                leadId: lead._id || lead,
                type: initialData.type || 'online',
                meetingLink: initialData.meetingLink || '',
                location: initialData.location || ''
            }));
        }
    }, [initialData]);

    useEffect(() => {
        fetchLeads();
        fetchTeamMembers();
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await leadsAPI.getAll();
            console.log('Meeting Modal fetched leads:', response.data);
            const leadsData = response.data?.data || response.data || [];
            setLeads(Array.isArray(leadsData) ? leadsData : []);
        } catch (error) {
            console.error('Error fetching leads for meeting schedule:', error);
            setError('Failed to load clients/leads for scheduling. Refresh and try again.');
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const response = await usersAPI.getAll({ roleFiltered: true });
            setTeamMembers(response.data.data);
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    };

    // Auto-assign self if team member
    useEffect(() => {
        if (user && user.role === 'team_member' && !formData.participants.includes(user._id)) {
            setFormData(prev => ({
                ...prev,
                participants: [user._id]
            }));
        }
    }, [user, formData.participants]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.startTime || !formData.endTime) {
            setError('Please fill in all required fields.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const payload = { ...formData };
            if (isNewLead) {
                payload.leadId = null;
                payload.newLead = {
                    clientName: searchLead,
                    email: leadEmail
                };
            }

            const response = await meetingsAPI.create(payload);
            
            // Log email status to browser console
            console.log('✅ Meeting Created Successfully!');
            console.log('📧 EMAIL STATUS:', response.data?.emailStatus);
            console.log('Full Response:', response.data);
            
            onSuccess();
        } catch (error) {
            console.error('Error creating meeting:', error);
            console.error('Error Response:', error.response?.data);
            setError(error.response?.data?.message || 'Failed to schedule meeting. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filteredLeads = leads.filter(lead =>
        (lead.clientName || '').toLowerCase().includes(searchLead.toLowerCase())
    );

    const toggleParticipant = (memberId) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.includes(memberId)
                ? prev.participants.filter(id => id !== memberId)
                : [...prev.participants, memberId]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => {
            setShowLeadDropdown(false);
            setShowMemberDropdown(false);
        }}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="text-[#3E2723]" />
                        Schedule New Meeting
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6">
                    {/* Meeting Title */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Meeting Title *</label>
                        <div className="relative">
                            <input
                                required
                                type="text"
                                placeholder="e.g. Discovery Call with Avani Enterprises"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] outline-none transition-all placeholder:text-gray-300"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Lead / Client Dropdown */}
                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lead / Client *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search lead..."
                                    className="w-full px-4 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] outline-none transition-all placeholder:text-gray-300"
                                    value={searchLead}
                                    onFocus={() => setShowLeadDropdown(true)}
                                    onChange={(e) => {
                                        setSearchLead(e.target.value);
                                        setShowLeadDropdown(true);
                                        if (selectedLead && e.target.value !== selectedLead.clientName) {
                                            setSelectedLead(null);
                                            setFormData(prev => ({ ...prev, leadId: '' }));
                                        }
                                    }}
                                />
                                {searchLead && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearchLead(''); setSelectedLead(null); setLeadEmail(''); setIsNewLead(false); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                                    >
                                        <X size={14} />
                                    </button>
                                )}

                                {showLeadDropdown && (
                                    <div className="absolute z-[70] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="max-h-48 overflow-y-auto scrollbar-thin">
                                            {filteredLeads.map(lead => (
                                                <button
                                                    key={lead._id}
                                                    type="button"
                                                    className="w-full px-4 py-3 hover:bg-[#FAF7F2] text-left transition-colors flex flex-col gap-0.5"
                                                    onClick={() => {
                                                        setSelectedLead(lead);
                                                        setSearchLead(lead.clientName);
                                                        setLeadEmail(lead.email || '');
                                                        setFormData(prev => ({ ...prev, leadId: lead._id }));
                                                        setIsNewLead(false);
                                                        setShowLeadDropdown(false);
                                                    }}
                                                >
                                                    <span className="text-sm font-bold text-gray-700">{lead.clientName}</span>
                                                    <span className="text-xs text-gray-400">{lead.email || 'No email provided'}</span>
                                                </button>
                                            ))}

                                            {searchLead.length > 0 && !filteredLeads.some(l => (l.clientName || '').toLowerCase() === searchLead.toLowerCase()) && (
                                                <button
                                                    type="button"
                                                    className="w-full px-4 py-4 bg-[#FAF7F2] hover:bg-[#F3EFE9] text-left transition-colors border-t border-orange-50 flex items-center gap-3 group"
                                                    onClick={() => {
                                                        setIsNewLead(true);
                                                        setSelectedLead(null);
                                                        setFormData(prev => ({ ...prev, leadId: '' }));
                                                        setShowLeadDropdown(false);
                                                    }}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#3E2723] shadow-sm group-hover:scale-110 transition-transform">
                                                        <Plus size={16} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-[#3E2723] uppercase tracking-wider">Create New Lead</span>
                                                        <span className="text-sm text-[#3E2723]/70 font-medium">"{searchLead}"</span>
                                                    </div>
                                                </button>
                                            )}

                                            {filteredLeads.length === 0 && searchLead.length > 0 && !isNewLead && (
                                                <div className="p-4 text-center text-gray-400 text-sm">
                                                    No matches found for "{searchLead}". Create a new lead above.
                                                </div>
                                            )}

                                            {filteredLeads.length === 0 && searchLead.length === 0 && (
                                                <div className="p-8 text-center text-gray-400 text-sm italic">
                                                    {leads.length === 0 ? "No leads available yet." : "Loading leads..."}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lead Email - Auto-filled or Manual for new leads */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Client Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="client@email.com"
                                    disabled={!isNewLead && selectedLead}
                                    className={`w-full px-4 py-3 border rounded-xl outline-none transition-all ${!isNewLead && selectedLead
                                        ? 'bg-gray-100 border-gray-100 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-50 border-gray-100 focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] text-gray-700'
                                        }`}
                                    value={leadEmail}
                                    onChange={(e) => setLeadEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Start Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={14} /> Start Time *
                            </label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] outline-none transition-all"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>

                        {/* End Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={14} /> End Time *
                            </label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] outline-none transition-all"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Meeting Type */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Meeting Type</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] outline-none transition-all"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="online">Online (Meet/Zoom)</option>
                                <option value="offline">Offline (In-person)</option>
                            </select>
                        </div>

                        {/* Meeting Link or Location */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                {formData.type === 'online' ? <Video size={14} /> : <MapPin size={14} />}
                                {formData.type === 'online' ? 'Meeting Link' : 'Location'}
                            </label>
                            <div className="relative">
                                {formData.type === 'online' ? (
                                    <input
                                        type="url"
                                        placeholder="https://meet.google.com/..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] outline-none transition-all placeholder:text-gray-300"
                                        value={formData.meetingLink}
                                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="e.g. Office Conference Room"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] outline-none transition-all placeholder:text-gray-300"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Team Members Dropdown */}
                    {user?.role !== 'team_member' && (
                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Users size={14} /> Assign Team Members
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] outline-none transition-all text-left flex items-center justify-between"
                                >
                                    <div className="flex flex-wrap gap-1.5 overflow-hidden">
                                        {formData.participants.length > 0 ? (
                                            formData.participants.map(pid => {
                                                const member = teamMembers.find(m => m._id === pid);
                                                return member ? (
                                                    <span key={pid} className="px-2 py-0.5 bg-[#3E2723] text-white rounded-lg text-[10px] font-bold">
                                                        {member.name}
                                                    </span>
                                                ) : null;
                                            })
                                        ) : (
                                            <span className="text-gray-300 text-sm">Select participants...</span>
                                        )}
                                    </div>
                                    <Plus size={16} className={`text-gray-400 transition-transform ${showMemberDropdown ? 'rotate-45' : ''}`} />
                                </button>

                                {showMemberDropdown && (
                                    <div className="absolute z-[65] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="max-h-48 overflow-y-auto p-2 grid grid-cols-2 gap-1 scrollbar-thin">
                                            {teamMembers.map(member => (
                                                <button
                                                    key={member._id}
                                                    type="button"
                                                    onClick={() => toggleParticipant(member._id)}
                                                    className={`px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${formData.participants.includes(member._id)
                                                        ? 'bg-[#3E2723] text-white shadow-md'
                                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {member.name}
                                                    <div className={`text-[9px] uppercase tracking-wider ${formData.participants.includes(member._id) ? 'text-white/70' : 'text-gray-400'}`}>
                                                        {member.role.replace('_', ' ')}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Agenda / Description</label>
                        <textarea
                            rows="3"
                            placeholder="What is this meeting about?"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] outline-none transition-all placeholder:text-gray-300 resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-in shake-in">
                            <AlertCircle size={18} />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white z-20">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl border border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition-all text-sm uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading}
                            type="submit"
                            className="px-8 py-3 rounded-xl bg-[#3E2723] text-white font-bold hover:bg-[#2D1C1B] transition-all disabled:opacity-50 flex items-center gap-2 text-sm shadow-lg shadow-[#3E2723]/20 uppercase tracking-widest"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleMeetingModal;
