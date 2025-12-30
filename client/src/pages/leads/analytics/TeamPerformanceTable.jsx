import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../../services/api';
import { Users, Award, Trophy } from 'lucide-react';

const TeamPerformanceTable = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await analyticsAPI.getTeamPerformance();
                setData(response.data.data);
            } catch (error) {
                console.error('Error fetching team performance:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Team Leaderboard</h3>
                    <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-1">Agent Performance</p>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-purple-500">
                    <Trophy size={20} />
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">No data available</div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {data.map((member, index) => {
                        const conversionRate = member.totalLeads > 0 
                            ? ((member.convertedLeads / member.totalLeads) * 100).toFixed(1)
                            : 0;
                            
                        return (
                            <div key={member._id} className="group bg-gray-800/30 hover:bg-gray-800 rounded-2xl p-4 transition-all border border-transparent hover:border-purple-500/30">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                            index === 0 ? 'bg-yellow-500 text-black' : 
                                            index === 1 ? 'bg-gray-400 text-black' :
                                            index === 2 ? 'bg-orange-700 text-white' : 'bg-gray-700 text-gray-400'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{member?.name || 'Unknown'}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">{member?.totalLeads || 0} Leads</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-purple-400">{conversionRate}%</div>
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Win Rate</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 flex-1 bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-purple-500 rounded-full"
                                            style={{ width: `${conversionRate}%` }}
                                        />
                                    </div>
                                    <div className="text-[10px] font-bold text-emerald-400">
                                        ${(member.totalPipelineValue || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TeamPerformanceTable;
