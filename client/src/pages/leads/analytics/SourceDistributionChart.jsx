import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../../services/api';
import { Share2, ArrowRight } from 'lucide-react';

const SourceDistributionChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await analyticsAPI.getSourceDistribution();
                setData(response.data.data);
            } catch (error) {
                console.error('Error fetching source data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const maxCount = Math.max(...data.map(d => d?.count || 0), 1);
    const totalLeads = data.reduce((sum, item) => sum + (item?.count || 0), 0);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Source Channels</h3>
                    <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-1">Attribution Data</p>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-blue-500">
                    <Share2 size={20} />
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">No data available</div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
                    {data.map((item) => {
                        const widthPercent = (item.count / totalLeads) * 100;
                        const relativeWidth = (item.count / maxCount) * 100;
                        
                        return (
                            <div key={item._id} className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-300 uppercase tracking-wide group-hover:text-white transition-colors">
                                            {item._id || 'Unknown'}
                                        </span>
                                        <span className="text-xs text-gray-600 font-medium">
                                            {widthPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="text-sm font-black text-white">{item.count}</div>
                                </div>
                                
                                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                        style={{ width: `${relativeWidth}%` }}
                                    />
                                </div>
                                
                                <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="text-[10px] text-gray-500 flex items-center gap-2">
                                        {(item?.wonCount || 0) > 0 && <span className="text-emerald-500 font-bold">{item.wonCount} Won</span>}
                                        <span>${(item?.totalValue || 0).toLocaleString()} Pipeline</span>
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

export default SourceDistributionChart;
