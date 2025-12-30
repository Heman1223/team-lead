import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    CheckCircle2,
    AlertTriangle,
    MoreVertical,
    CalendarDays,
    ArrowRight
} from 'lucide-react';
import { followUpsAPI } from '../../services/api';

const FollowUpList = () => {
    const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, overdue
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFollowUps();
    }, [activeTab]);

    const fetchFollowUps = async () => {
        setLoading(true);
        try {
            const apiCall = activeTab === 'upcoming' 
                ? followUpsAPI.getUpcoming 
                : followUpsAPI.getOverdue;
            
            const response = await apiCall();
            setFollowUps(response.data.data);
        } catch (error) {
            console.error('Error fetching follow-ups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (id) => {
        try {
            await followUpsAPI.complete(id, 'Completed from dashboard');
            fetchFollowUps(); // Refresh list
        } catch (error) {
            console.error('Error completing follow-up:', error);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-[3rem] p-8 shadow-2xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Activity Feed</h3>
                    <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-1">Daily Tasks & Reminders</p>
                </div>
                <div className="flex bg-gray-800 rounded-xl p-1">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'upcoming' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab('overdue')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'overdue' ? 'bg-rose-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Overdue
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : followUps.length === 0 ? (
                    <div className="text-center py-12">
                        <CalendarDays className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No {activeTab} follow-ups</p>
                    </div>
                ) : (
                    followUps.map(item => (
                        <div key={item._id} className="group flex items-start gap-4 p-4 rounded-2xl bg-gray-800/50 hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all">
                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                item.priority === 'urgent' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                                item.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                            }`} />
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-white font-bold truncate">{item.title}</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        activeTab === 'overdue' ? 'bg-rose-500/20 text-rose-400' : 'bg-gray-700 text-gray-400'
                                    }`}>
                                        {new Date(item.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 truncate mt-1">{item.leadId?.clientName}</p>
                                
                                <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                                        {new Date(item.scheduledDate).toLocaleDateString()}
                                    </span>
                                    <button 
                                        onClick={() => handleComplete(item._id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                                    >
                                        <CheckCircle2 size={12} />
                                        Complete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <button className="mt-8 w-full py-4 border border-gray-800 rounded-2xl text-gray-400 font-bold text-sm uppercase tracking-widest hover:bg-gray-800 hover:text-white transition-all flex items-center justify-center gap-2 group">
                View All Activity
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
};

export default FollowUpList;
