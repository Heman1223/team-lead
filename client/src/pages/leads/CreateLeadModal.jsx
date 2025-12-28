import React, { useState } from 'react';
import {
    X,
    Save,
    AlertCircle,
    Check
} from 'lucide-react';
import { leadsAPI } from '../../services/api';

const CreateLeadModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        clientName: '',
        email: '',
        phone: '',
        category: 'web_development',
        description: '',
        priority: 'medium',
        estimatedValue: 0,
        expectedCloseDate: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            console.log('Creating lead with data:', formData);
            const response = await leadsAPI.create(formData);
            console.log('Lead created successfully:', response.data);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error creating lead:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);

            let errorMessage = 'Failed to create lead';
            if (err.response?.status === 404) {
                errorMessage = 'API endpoint not found. Please ensure the backend server is running.';
            } else if (err.response?.data?.message) {
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
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600" />

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
                            <label className="text-xs font-semibold text-orange-500">Client Name</label>
                            <input
                                required
                                name="clientName"
                                value={formData.clientName}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-600"
                                placeholder="Enter client name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-orange-500">Email</label>
                            <input
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-600"
                                placeholder="client@domain.com"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-orange-500">Phone</label>
                            <input
                                required
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-600"
                                placeholder="+1 (000) 000-0000"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-orange-500">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer"
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
                            <label className="text-xs font-semibold text-orange-500">Estimated Value ($)</label>
                            <input
                                type="number"
                                name="estimatedValue"
                                value={formData.estimatedValue}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-orange-500">Expected Close Date</label>
                            <input
                                type="date"
                                name="expectedCloseDate"
                                value={formData.expectedCloseDate}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-orange-500">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none placeholder:text-gray-600"
                            placeholder="Enter lead description and requirements..."
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
                            className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
