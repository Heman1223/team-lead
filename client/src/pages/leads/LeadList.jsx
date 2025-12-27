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
    RefreshCcw
} from 'lucide-react';
import { leadsAPI } from '../../services/api';

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

const LeadList = ({ onSelectLead }) => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await leadsAPI.getAll();
            setLeads(response.data.data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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
                        className="w-full bg-gray-900/50 border border-gray-700 text-gray-200 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
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
                        className="bg-gray-900/50 border border-gray-700 text-gray-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all flex-1 md:flex-none"
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
                                    className="group hover:bg-orange-500/[0.02] transition-all duration-300 cursor-pointer"
                                    onClick={() => onSelectLead(lead._id)}
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black text-white group-hover:text-orange-500 transition-colors uppercase tracking-tighter">{lead.clientName}</span>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-widest border border-white/5">{lead.category.replace('_', ' ')}</span>
                                                <span className="text-xs text-gray-500 font-medium">{lead.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2">
                                            <span className={`w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[lead.status]}`}>
                                                {lead.status.replace('_', ' ')}
                                            </span>
                                            {lead.source === 'csv_import' && (
                                                <span className="text-[10px] text-gray-600 font-bold ml-1 uppercase">Imported Data</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {lead.assignedTo ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center text-sm font-black shadow-lg shadow-orange-500/20">
                                                    {lead.assignedTo.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-white uppercase">{lead.assignedTo.name}</span>
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
                                            <span className="text-[10px] text-orange-500/50 font-black uppercase tracking-widest">Estimated Revenue</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-white bg-gray-800/50 hover:bg-orange-600 rounded-2xl transition-all shadow-xl group-hover:scale-110">
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
