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
    Tag,
    CreditCard
} from 'lucide-react';
import { leadsAPI, usersAPI, teamsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const defaultPayment = {
    onboardingDate: '',
    totalProjectValue: '',
    advanceReceived: '',
    advanceDate: '',
    finalPayment: '',
    finalPaymentDate: '',
    totalCollected: 0,
    balanceDue: 0
};

// Helper for ₹ prefixed currency inputs - Defined outside to prevent focus loss on re-render
const CurrencyInput = ({ name, value, onChange, readOnly = false, className = '' }) => (
    <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm pointer-events-none">₹</span>
        <input
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            min="0"
            className={`w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723] text-gray-900 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`}
            placeholder="0"
        />
    </div>
);

const CreateLeadModalSimple = ({ onClose, onSuccess, editLead }) => {
    const { isAdmin, isTeamLead, user } = useAuth();
    const isEditMode = !!editLead;

    const parsePayment = (p) => ({
        onboardingDate: p?.onboardingDate ? new Date(p.onboardingDate).toISOString().split('T')[0] : '',
        totalProjectValue: p?.totalProjectValue ?? '',
        advanceReceived: p?.advanceReceived ?? '',
        advanceDate: p?.advanceDate ? new Date(p.advanceDate).toISOString().split('T')[0] : '',
        finalPayment: p?.finalPayment ?? '',
        finalPaymentDate: p?.finalPaymentDate ? new Date(p.finalPaymentDate).toISOString().split('T')[0] : '',
        totalCollected: p?.totalCollected ?? 0,
        balanceDue: p?.balanceDue ?? 0
    });

    const [formData, setFormData] = useState({
        clientName: editLead?.clientName || '',
        email: editLead?.email || '',
        phone: editLead?.phone || '',
        category: editLead?.category || 'web_development',
        description: editLead?.description || '',
        inquiryMessage: editLead?.inquiryMessage || '',
        source: editLead?.source || 'manual',
        priority: editLead?.priority || 'medium',
        estimatedValue: editLead?.estimatedValue || 0,
        expectedCloseDate: editLead?.expectedCloseDate ? new Date(editLead.expectedCloseDate).toISOString().split('T')[0] : '',
        assignedTo: editLead?.assignedTo?._id || editLead?.assignedTo || '',
        assignedTeam: editLead?.assignedTeam?._id || editLead?.assignedTeam || '',
        status: editLead?.status || 'new',
        onboardingPayment: isEditMode ? parsePayment(editLead?.onboardingPayment) : { ...defaultPayment }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);

    // Real-time calculation of totalCollected & balanceDue
    useEffect(() => {
        const advance = parseFloat(formData.onboardingPayment.advanceReceived) || 0;
        const final = parseFloat(formData.onboardingPayment.finalPayment) || 0;
        const project = parseFloat(formData.onboardingPayment.totalProjectValue) || 0;
        const totalCollected = advance + final;
        const balanceDue = project - totalCollected;

        setFormData(prev => ({
            ...prev,
            onboardingPayment: {
                ...prev.onboardingPayment,
                totalCollected,
                balanceDue
            }
        }));
    }, [
        formData.onboardingPayment.advanceReceived,
        formData.onboardingPayment.finalPayment,
        formData.onboardingPayment.totalProjectValue
    ]);

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
                console.error('Error fetching assignment options', err);
            }
        };
        fetchAssignmentOptions();
    }, [isAdmin, isTeamLead, user._id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('onboardingPayment.')) {
            const key = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                onboardingPayment: {
                    ...prev.onboardingPayment,
                    [key]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Date validation — only checked when status is converted
        if (formData.status === 'converted') {
            const { onboardingDate, advanceDate, finalPaymentDate } = formData.onboardingPayment;
            if (onboardingDate && advanceDate && advanceDate < onboardingDate) {
                alert('Advance Date cannot be before Onboarding Date.');
                return;
            }
            if (advanceDate && finalPaymentDate && finalPaymentDate < advanceDate) {
                alert('Final Payment Date cannot be before Advance Date.');
                return;
            }
        }

        setLoading(true);
        setError(null);
        try {
            const submitData = { 
                ...formData,
                estimatedValue: parseFloat(formData.estimatedValue) || 0
            };
            
            if (submitData.onboardingPayment) {
                const p = submitData.onboardingPayment;
                submitData.onboardingPayment = {
                    ...p,
                    totalProjectValue: parseFloat(p.totalProjectValue) || 0,
                    advanceReceived: parseFloat(p.advanceReceived) || 0,
                    finalPayment: parseFloat(p.finalPayment) || 0,
                    onboardingDate: p.onboardingDate || null,
                    advanceDate: p.advanceDate || null,
                    finalPaymentDate: p.finalPaymentDate || null
                };
            }

            if (!submitData.assignedTo) delete submitData.assignedTo;
            if (!submitData.assignedTeam) delete submitData.assignedTeam;

            if (isEditMode) {
                await leadsAPI.update(editLead._id, submitData);
            } else {
                await leadsAPI.create(submitData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} lead:`, err);
            let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} lead`;
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

    const isConverted = formData.status === 'converted';
    const balanceDueValue = formData.onboardingPayment.balanceDue;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}></div>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#3E2723] to-[#3E2723] p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-1 text-white">{isEditMode ? 'Edit Lead' : 'Create New Lead'}</h2>
                                <p className="text-[#EFEBE9] text-sm">{isEditMode ? 'Update lead information' : 'Add a new lead to your pipeline'}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={24} className="text-white" />
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
                                <User size={20} className="text-[#3E2723]" />
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723] text-gray-900"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723] text-gray-900"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
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
                                <Tag size={20} className="text-[#3E2723]" />
                                Lead Details
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Estimated Value (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="estimatedValue"
                                        value={formData.estimatedValue}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723] text-gray-900"
                                        placeholder="5000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Expected Close Date
                                    </label>
                                    <input
                                        type="date"
                                        name="expectedCloseDate"
                                        value={formData.expectedCloseDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723] text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Source
                                    </label>
                                    <select
                                        name="source"
                                        value={formData.source}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Status — always visible (needed to trigger payment section) */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Tag size={20} className="text-[#3E2723]" />
                                Lead Status
                            </h3>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
                            >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="interested">Interested</option>
                                <option value="follow_up">Follow Up</option>
                                <option value="converted">Converted</option>
                                <option value="not_interested">Not Interested</option>
                            </select>
                        </div>

                        {/* Onboarding & Payment Details — only when status === 'converted' */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isConverted ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <CreditCard size={20} className="text-emerald-600" />
                                    Onboarding &amp; Payment Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Row 1: Onboarding Date | Total Project Value */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Onboarding Date</label>
                                        <input
                                            type="date"
                                            name="onboardingPayment.onboardingDate"
                                            value={formData.onboardingPayment.onboardingDate}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Total Project Value (₹)</label>
                                        <CurrencyInput
                                            name="onboardingPayment.totalProjectValue"
                                            value={formData.onboardingPayment.totalProjectValue}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/* Row 2: Advance Received | Advance Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Advance Received (₹)</label>
                                        <CurrencyInput
                                            name="onboardingPayment.advanceReceived"
                                            value={formData.onboardingPayment.advanceReceived}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Advance Date</label>
                                        <input
                                            type="date"
                                            name="onboardingPayment.advanceDate"
                                            value={formData.onboardingPayment.advanceDate}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
                                        />
                                    </div>

                                    {/* Row 3: Final Payment | Final Payment Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Final Payment (₹)</label>
                                        <CurrencyInput
                                            name="onboardingPayment.finalPayment"
                                            value={formData.onboardingPayment.finalPayment}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Final Payment Date</label>
                                        <input
                                            type="date"
                                            name="onboardingPayment.finalPaymentDate"
                                            value={formData.onboardingPayment.finalPaymentDate}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
                                        />
                                    </div>

                                    {/* Row 4: Total Collected (read-only) | Balance Due (read-only, color-coded) */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Total Collected (₹) <span className="text-xs font-normal text-gray-400">auto</span>
                                        </label>
                                        <CurrencyInput
                                            name="onboardingPayment.totalCollected"
                                            value={formData.onboardingPayment.totalCollected}
                                            onChange={handleChange}
                                            readOnly={true}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Balance Due (₹) <span className="text-xs font-normal text-gray-400">auto</span>
                                        </label>
                                        <div className="relative">
                                            <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-sm pointer-events-none ${balanceDueValue > 0 ? 'text-red-500' : 'text-green-600'}`}>₹</span>
                                            <input
                                                type="number"
                                                readOnly
                                                value={formData.onboardingPayment.balanceDue}
                                                className={`w-full pl-7 pr-4 py-2 border-2 rounded-lg bg-gray-100 cursor-not-allowed font-bold ${
                                                    balanceDueValue > 0
                                                        ? 'border-red-400 text-red-600'
                                                        : 'border-green-400 text-green-600'
                                                }`}
                                            />
                                        </div>
                                    </div>
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723] resize-none"
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E2723] resize-none"
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
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#3E2723] text-white rounded-lg hover:bg-[#2E1B17] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {isEditMode ? 'Saving...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        {isEditMode ? 'Save Changes' : 'Create Lead'}
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
