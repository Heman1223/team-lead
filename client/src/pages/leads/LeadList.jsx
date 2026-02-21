import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    User,
    Calendar,
    Mail,
    Phone,
    ChevronRight,
    Plus,
    Download,
    Eye,
    History,
    RefreshCcw,
    AlertCircle,
    Target
} from 'lucide-react';
import { leadsAPI } from '../../services/api';

const statusColors = {
    new: 'bg-blue-600 text-white',
    contacted: 'bg-indigo-600 text-white',
    interested: 'bg-purple-600 text-white',
    follow_up_required: 'bg-yellow-500 text-slate-900',
    converted: 'bg-emerald-600 text-white',
    lost: 'bg-rose-600 text-white'
};

const LeadList = ({ onSelectLead }) => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await leadsAPI.getAll();
            console.log('Leads response:', response.data);
            setLeads(response.data.data || []);
        } catch (error) {
            console.error('Error fetching leads:', error);
            setError(error.response?.data?.message || 'Failed to fetch leads. Please try again.');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E2723] mx-auto"></div>
                    <p className="text-gray-400 font-medium">Loading leads...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Error Loading Leads</h3>
                    <p className="text-gray-400">{error}</p>
                    <button
                        onClick={fetchLeads}
                        className="px-6 py-3 bg-[#3E2723] text-white rounded-xl hover:bg-[#3E2723] transition-all font-semibold"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search leads by name or email..."
                        className="w-full bg-gray-900/50 border border-gray-700 text-gray-200 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E2723]/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={fetchLeads}
                        className="p-2.5 bg-gray-900/50 border border-gray-700 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-all"
                        title="Refresh Leads"
                    >
                        <History size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <select
                        className="bg-gray-900/50 border border-gray-700 text-gray-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E2723]/50 transition-all flex-1 md:flex-none"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        {Object.keys(statusColors).map(status => (
                            <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-800/50 border-b border-gray-700/50">
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-widest">Client Profile</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-widest">Status / Journey</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-widest">Team Assignment</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Potentail Value</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-widest"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {filteredLeads.map((lead) => (
                                <tr
                                    key={lead._id}
                                    className="group hover:bg-[#3E2723]/[0.02] transition-all duration-300 cursor-pointer"
                                    onClick={() => onSelectLead(lead._id)}
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black text-white group-hover:text-[#3E2723] transition-colors uppercase tracking-tighter">{lead.clientName || 'Unknown'}</span>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-widest border border-white/5">{(lead.category || 'uncategorized').replace('_', ' ')}</span>
                                                <span className="text-xs text-gray-500 font-medium">{lead.email || 'No email'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2">
                                            <span className={`w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[lead.status] || statusColors.new}`}>
                                                {(lead.status || 'new').replace('_', ' ')}
                                            </span>
                                            {lead.source === 'csv_import' && (
                                                <span className="text-[10px] text-gray-600 font-bold ml-1 uppercase">Imported Data</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {lead.assignedTo ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#3E2723] text-white rounded-2xl flex items-center justify-center text-sm font-black shadow-lg shadow-[#3E2723]/20">
                                                    {lead.assignedTo?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-white uppercase">{lead.assignedTo?.name || 'Unknown'}</span>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Active Rep</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 opacity-40">
                                                <div className="w-10 h-10 bg-gray-800 text-gray-600 rounded-2xl flex items-center justify-center border border-dashed border-gray-600">
                                                    <User size={18} />
                                                </div>
                                                <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Unassigned</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-2xl font-black text-white tracking-tighter">
                                                ${(lead.estimatedValue || 0).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-[#3E2723]/50 font-black uppercase tracking-widest">Estimated Revenue</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-white bg-gray-800/50 hover:bg-[#3E2723] rounded-2xl transition-all shadow-xl group-hover:scale-110">
                                            <ChevronRight size={24} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center border border-dashed border-gray-700">
                                                <Target className="text-gray-700 w-12 h-12" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xl font-black text-white uppercase tracking-widest">No Leads Identified</p>
                                                <p className="text-gray-500 font-medium">Your current filter parameters yielded zero results.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeadList;
