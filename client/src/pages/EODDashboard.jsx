import React, { useState, useEffect } from 'react';
import { 
    Calendar, Clock, CheckCircle2, AlertCircle, 
    FileText, ExternalLink, Paperclip, Search,
    Filter, ChevronRight, Activity, TrendingUp,
    LayoutGrid, List, BarChart3, Image as ImageIcon
} from 'lucide-react';
import { tasksAPI, teamsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const EODDashboard = () => {
    const { user, isTeamLead, isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [eods, setEods] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('all');
    const [teams, setTeams] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

    useEffect(() => {
        fetchEODs();
        fetchTeams();
    }, [selectedDate, selectedTeam]);

    const fetchEODs = async () => {
        try {
            setLoading(true);
            const response = await tasksAPI.getAllEODReports({
                date: selectedDate,
                teamId: selectedTeam === 'all' ? undefined : selectedTeam
            });
            setEods(response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch EODs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const res = isTeamLead ? await teamsAPI.getLedTeams() : await teamsAPI.getAll();
            setTeams(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch teams:', err);
        }
    };

    const filteredEods = eods.filter(eod => 
        eod.submittedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eod.taskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eod.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'blocked': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <Layout title="EOD Monitoring">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-[#3E2723] to-[#3E2723] rounded-2xl shadow-lg ring-4 ring-[#FAF7F2]">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">EOD Reports</h1>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Daily Progress & Contribution Tracking</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="date" 
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#3E2723] outline-none transition-all"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                            />
                        </div>
                        
                        <select 
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#3E2723] outline-none transition-all"
                            value={selectedTeam}
                            onChange={e => setSelectedTeam(e.target.value)}
                        >
                            <option value="all">Global Teams</option>
                            {teams.map(t => (
                                <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                        </select>

                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#3E2723]' : 'text-gray-400'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#3E2723]' : 'text-gray-400'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Dashboard */}
                <div className="bg-white border border-gray-100 rounded-[32px] p-2 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input 
                                type="text"
                                placeholder="Filter by Member, Project, or Task..."
                                className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-bold outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="h-8 w-px bg-gray-100 md:block hidden" />
                        <div className="px-6 md:flex hidden items-center gap-6">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reports</p>
                                <p className="text-sm font-black text-gray-900">{filteredEods.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blockers</p>
                                <p className="text-sm font-black text-red-500">{filteredEods.filter(e => e.blockers).length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EOD Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-dashed border-gray-200">
                        <div className="w-12 h-12 border-4 border-[#3E2723] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest animate-pulse">Gathering Reports...</p>
                    </div>
                ) : filteredEods.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-dashed border-gray-200">
                        <div className="p-6 bg-gray-50 rounded-full mb-6">
                            <FileText className="w-12 h-12 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase">No EODs for this date</h3>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mt-2">Try selecting another date or check back later</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"}>
                        {filteredEods.map((eod, idx) => (
                            <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group border-l-8 border-l-[#3E2723]">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg">
                                            {eod.submittedBy?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{eod.submittedBy?.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] bg-[#FAF7F2] text-[#3E2723] px-2 py-0.5 rounded font-black uppercase tracking-widest">{eod.teamName}</span>
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                                                    {eod.isSubtask ? 'Team Member' : 'Team Lead'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 justify-end mb-1">
                                            <TrendingUp className="w-3 h-3 text-green-500" />
                                            <p className="text-lg font-black text-gray-900 leading-none">{eod.progressUpdate}%</p>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <BarChart3 className="w-3 h-3" /> Project Context
                                            </p>
                                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight line-clamp-1">{eod.projectName}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{eod.taskTitle}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#3E2723] uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <CheckCircle2 className="w-3 h-3" /> Work Completed
                                            </p>
                                            <p className="text-sm text-gray-600 font-medium leading-relaxed">{eod.workCompleted}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {eod.blockers && (
                                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <AlertCircle className="w-3 h-3" /> Blockers
                                                </p>
                                                <p className="text-xs text-red-700 font-bold italic">"{eod.blockers}"</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <TrendingUp className="w-3 h-3" /> Next Day Plan
                                            </p>
                                            <p className="text-sm text-gray-600 font-medium leading-relaxed">{eod.nextDayPlan || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments Section in EOD */}
                                {(eod.links?.length > 0 || eod.images?.length > 0) && (
                                    <div className="pt-6 border-t border-gray-50">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Evidence & Assets</p>
                                        <div className="flex flex-wrap gap-4">
                                            {eod.links?.map((link, lIdx) => (
                                                <a 
                                                    key={lIdx} 
                                                    href={link.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-all group/link"
                                                >
                                                    <ExternalLink className="w-4 h-4 text-indigo-500" />
                                                    <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{link.title}</span>
                                                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover/link:translate-x-1 transition-all" />
                                                </a>
                                            ))}
                                            {eod.images?.map((img, iIdx) => (
                                                <a 
                                                    key={iIdx} 
                                                    href={img} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 hover:ring-2 hover:ring-[#3E2723] transition-all shadow-sm"
                                                >
                                                    <img src={img} alt="EOD Proof" className="w-full h-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default EODDashboard;
