import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../../services/api';
import { TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

const LeadInflowChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [hoveredIndex, setHoveredIndex] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await analyticsAPI.getLeadInflow(timeRange);
                // Fill missing dates if needed, but for now just use what's returned
                setData(response.data.data);
            } catch (error) {
                console.error('Error fetching inflow data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [timeRange]);

    const maxCount = Math.max(...data.map(d => d?.count || 0), 1);
    const totalLeads = data.reduce((sum, item) => sum + (item?.count || 0), 0);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden h-full">
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Lead Inflow</h3>
                    <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-1">Acquisition Velocity</p>
                </div>
                <div className="flex bg-gray-800 rounded-xl p-1">
                    {['7d', '30d', '90d'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                timeRange === range ? 'bg-[#3E2723] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#3E2723] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : data.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
            ) : (
                <div className="relative h-64 flex items-end justify-between gap-1 group">
                    {data.map((item, index) => {
                        const heightPercent = (item.count / maxCount) * 100;
                        return (
                            <div
                                key={item._id}
                                className="relative flex-1 flex flex-col justify-end items-center h-full group/bar"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                <div
                                    className={`w-full max-w-[20px] rounded-t-lg transition-all duration-500 hover:bg-[#5D4037] ${
                                        hoveredIndex === index ? 'bg-[#3E2723] scale-y-110 shadow-[0_0_20px_rgba(249,115,22,0.5)]' : 'bg-gray-800'
                                    }`}
                                    style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                />
                                
                                {/* Tooltip */}
                                <div className={`absolute bottom-full mb-2 bg-gray-800 border border-gray-700 text-white text-xs font-bold rounded-lg px-2 py-1 pointer-events-none transition-all duration-200 z-20 whitespace-nowrap ${
                                    hoveredIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                                }`}>
                                    <div className="text-gray-400 text-[10px] mb-0.5">{new Date(item._id).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#3E2723]">{item.count} Leads</span>
                                        {item.value > 0 && <span className="text-emerald-400">${item.value.toLocaleString()}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-800 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#3E2723]/10 rounded-xl flex items-center justify-center text-[#3E2723]">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-white leading-none">{totalLeads}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Total in Period</div>
                    </div>
                 </div>
                 {data.length > 2 && (
                    <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg">
                        <ArrowUpRight size={14} />
                        <span className="text-xs font-bold">Growing</span>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default LeadInflowChart;
