import React, { useState } from 'react';
import {
    X,
    Save,
    AlertCircle,
    Check,
    DollarSign
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
            await leadsAPI.create(formData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-white/10 rounded-[3rem] w-full max-w-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600" />

                <div className="flex items-center justify-between p-10 border-b border-white/5 bg-gray-900/50">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Initialize Lead</h2>
                        <p className="text-gray-500 text-sm font-bold tracking-widest uppercase mt-1">Manual Prospect Entry</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-gray-800 text-gray-400 hover:text-white rounded-2xl transition-all border border-white/5">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2rem] flex items-center gap-4 text-rose-400 font-bold animate-in slide-in-from-top-4">
                            <AlertCircle size={24} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] ml-1">Client Name</label>
                            <input
                                required
                                name="clientName"
                                value={formData.clientName}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-600 uppercase text-sm"
                                placeholder="PROSPECT NAME"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] ml-1">Email Protocol</label>
                            <input
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-600 text-sm"
                                placeholder="client@domain.com"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] ml-1">Direct Contact</label>
                            <input
                                required
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-600 text-sm"
                                placeholder="+1 (000) 000-0000"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] ml-1">Sector / Type</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer uppercase text-sm"
                            >
                                <option value="web_development">Web Systems</option>
                                <option value="mobile_app">Native Apps</option>
                                <option value="ui_ux_design">UI/UX Strategy</option>
                                <option value="digital_marketing">Marketing Tech</option>
                                <option value="seo">Search Opt</option>
                                <option value="consulting">Consulting</option>
                                <option value="other">General</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] ml-1">Valuation ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                                <input
                                    type="number"
                                    name="estimatedValue"
                                    value={formData.estimatedValue}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl pl-14 pr-6 py-4 text-white font-black text-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] ml-1">Target Close</label>
                            <input
                                type="date"
                                name="expectedCloseDate"
                                value={formData.expectedCloseDate}
                                onChange={handleChange}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] ml-1">Strategic Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-[2rem] px-8 py-6 text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none placeholder:text-gray-600"
                            placeholder="Detail the lead's core requirements and potential impact..."
                        />
                    </div>

                    <div className="flex gap-6 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-10 py-5 bg-gray-900 text-gray-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition-all border border-gray-800"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-[0_20px_40px_rgba(249,115,22,0.2)] hover:shadow-[0_25px_50px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} />
                                    Commit Lead
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
