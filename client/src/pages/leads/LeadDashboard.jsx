import React, { useState, useEffect } from 'react';
import {
    Target,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle,
    DollarSign,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    BarChart3,
    Briefcase
} from 'lucide-react';
import { leadsAPI } from '../../services/api';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => {
    const colorMap = {
        orange: 'from-orange-500/20 to-orange-600/5 text-orange-400 border-orange-500/20',
        emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20',
        blue: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20',
        purple: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/20'
    };

    return (
        <div className={`bg-gradient-to-br ${colorMap[color]} backdrop-blur-xl border rounded-[2.5rem] p-8 hover:scale-[1.02] transition-all duration-500 group shadow-2xl shadow-black/20`}>
            <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-gray-900/50 border border-white/5 text-inherit group-hover:scale-110 transition-transform duration-500">
                    <Icon size={28} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{trendValue}%</span>
                    </div>
                )}
            </div>
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">{title}</h3>
            <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
        </div>
    );
};

const LeadDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await leadsAPI.getStats();
                setStats(response.data.data);
            } catch (error) {
                console.error('Error fetching lead stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const formattedPipelineValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(stats?.totalPipelineValue || 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Leads"
                    value={stats?.totalLeads || 0}
                    icon={Target}
                    color="orange"
                    trend="up"
                    trendValue="12"
                />
                <StatCard
                    title="Leads Won"
                    value={stats?.wonLeads || 0}
                    icon={CheckCircle2}
                    color="emerald"
                    trend="up"
                    trendValue="5"
                />
                <StatCard
                    title="Conversion Rate"
                    value={`${(stats?.conversionRate || 0).toFixed(1)}%`}
                    icon={TrendingUp}
                    color="blue"
                    trend="up"
                    trendValue="2.4"
                />
                <StatCard
                    title="Pipeline Value"
                    value={formattedPipelineValue}
                    icon={DollarSign}
                    color="purple"
                    trend="up"
                    trendValue="18"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Distribution */}
                <div className="bg-gray-900 border border-gray-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Status Matrix</h3>
                                <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-1">Lifecycle distribution</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-orange-500 border border-white/5">
                                <Target size={24} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            {Object.entries(stats?.statusDist || {}).map(([status, count]) => (
                                <div key={status} className="space-y-3 group/item">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-black text-gray-400 uppercase tracking-widest group-hover/item:text-white transition-colors">{status.replace('_', ' ')}</span>
                                        <span className="text-2xl font-black text-white tracking-tighter">{count}</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-700 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                                            style={{ width: `${stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-32 -mb-32" />
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Market Segments</h3>
                                <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-1">Lead distribution by sector</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-blue-500 border border-white/5">
                                <Briefcase size={24} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            {Object.entries(stats?.categoryDist || {}).map(([category, count]) => (
                                <div key={category} className="space-y-3 group/item">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-black text-gray-400 uppercase tracking-widest group-hover/item:text-white transition-colors">{category.replace('_', ' ')}</span>
                                        <span className="text-2xl font-black text-white tracking-tighter">{count}</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                            style={{ width: `${stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadDashboard;
