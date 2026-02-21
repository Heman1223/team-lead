import { useState, useEffect } from 'react';
import { 
    Users, Briefcase, CheckCircle, TrendingUp, Award, Clock, 
    Target, Activity, Zap, 
    ArrowUpRight, ArrowDownRight, MoreVertical,
    FileText, ClipboardList
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area
} from 'recharts';
import Layout from '../components/Layout';
import { useFilters } from '../context/FilterContext';
import api from '../services/api';
import { adminAnalyticsAPI, adminTasksAPI } from '../services/adminApi';
import { leadsAPI } from '../services/api';

const AdminDashboard = () => {
    const { dateRange } = useFilters();

    const [dashboardStats, setDashboardStats] = useState(null);
    const [bestTeams, setBestTeams] = useState([]);
    const [leadStats, setLeadStats] = useState({ total: 0, converted: 0, conversionRate: 0 });
    const [leadChartData, setLeadChartData] = useState([]);
    const [activities, setActivities] = useState([]);
    const [performanceTrend, setPerformanceTrend] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const startDate = dateRange.startDate;
            const endDate = dateRange.endDate;
            const params = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            };

            // Fetch all data in parallel
            const results = await Promise.allSettled([
                adminAnalyticsAPI.getDashboardStats(params),
                adminAnalyticsAPI.getBestTeams(params),
                adminTasksAPI.getAll(),
                leadsAPI.getStats(params),
                api.get('/admin/activities')
            ]);

            // Extract data safely from settled promises
            const [statsResult, bestTeamsResult, tasksResult, leadsResult, activitiesResult] = results;

            // 1. Dashboard Stats (primary data source)
            if (statsResult.status === 'fulfilled') {
                const d = statsResult.value.data.data;
                setDashboardStats(d);
            }

            // 2. Best Teams
            if (bestTeamsResult.status === 'fulfilled') {
                setBestTeams(bestTeamsResult.value.data.data || []);
            }

            // 3. Build performance trend from tasks
            if (tasksResult.status === 'fulfilled') {
                const allTasks = tasksResult.value.data.data || [];
                const filteredTasks = allTasks.filter(t => {
                    const taskDate = new Date(t.createdAt);
                    return taskDate >= startDate && taskDate <= endDate;
                });

                // Build daily trend
                const trendMap = {};
                filteredTasks.forEach(task => {
                    const d = new Date(task.createdAt);
                    const key = `${d.getMonth() + 1}/${d.getDate()}`;
                    if (!trendMap[key]) trendMap[key] = { name: key, tasks: 0, leads: 0 };
                    trendMap[key].tasks++;
                });
                setPerformanceTrend(Object.values(trendMap).slice(-14));
            }

            // 4. Lead Stats
            if (leadsResult.status === 'fulfilled') {
                const leadData = leadsResult.value.data.data;
                if (leadData) {
                    setLeadStats({
                        total: leadData.totalLeads || 0,
                        converted: leadData.convertedLeads || 0,
                        conversionRate: leadData.conversionRate || 0
                    });

                    const statusDist = leadData.statusDist || {};
                    setLeadChartData([
                        { name: 'New', value: statusDist.new || 0, color: '#3b82f6' },
                        { name: 'Contacted', value: statusDist.contacted || 0, color: '#6366f1' },
                        { name: 'Interested', value: statusDist.interested || 0, color: '#8b5cf6' },
                        { name: 'Follow Up', value: statusDist.follow_up || 0, color: '#f59e0b' },
                        { name: 'Converted', value: statusDist.converted || 0, color: '#10b981' },
                        { name: 'Not Interested', value: statusDist.not_interested || 0, color: '#ef4444' }
                    ].filter(item => item.value > 0));
                }
            }

            // 5. Activities
            if (activitiesResult.status === 'fulfilled') {
                setActivities(activitiesResult.value.data.data?.slice(0, 10) || []);
            }

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // Derive computed values from dashboardStats
    const overview = dashboardStats?.overview || {};
    const taskData = dashboardStats?.tasks || {};
    const leadData = dashboardStats?.leads || {};
    const recentActivity = dashboardStats?.recentActivity || {};

    if (loading) {
        return (
            <Layout title="Admin Dashboard">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3E2723] mx-auto"></div>
                        <p className="mt-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Loading dashboard...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout title="Admin Dashboard">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <p className="text-red-600 font-bold mb-4">{error}</p>
                        <button onClick={fetchDashboardData} className="px-6 py-2 bg-[#3E2723] text-white rounded-xl font-bold text-sm">
                            Retry
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    const KPICard = ({ title, value, icon: Icon, gradient, subtitle, trend, trendValue }) => (
        <div className="bg-[#F3EFE7] rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
            <div className="flex items-center justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-3xl font-black text-[#1D1110] tracking-tighter">
                            {value}
                        </h3>
                        {trend && (
                            <span className={`text-xs font-bold tracking-tighter truncate flex items-center gap-0.5 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {trendValue}
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="text-xs font-medium text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className="shrink-0 p-3 bg-white/50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );

    // Prepare chart data from real stats
    const taskStatusData = [
        { name: 'Completed', value: taskData.completed || 0, color: '#10B981' },
        { name: 'In Progress', value: taskData.inProgress || 0, color: '#F59E0B' },
        { name: 'Overdue', value: taskData.overdue || 0, color: '#EF4444' },
        { name: 'Other', value: Math.max(0, (taskData.total || 0) - (taskData.completed || 0) - (taskData.inProgress || 0) - (taskData.overdue || 0)), color: '#6B7280' }
    ].filter(d => d.value > 0);

    return (
        <Layout title="Admin Dashboard">
            <div className="space-y-5" style={{ background: '#FAF9F8' }}>

                {/* KPI GRID */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <KPICard
                        title="Total Employees"
                        value={overview.totalUsers || 0}
                        icon={Users}
                        subtitle="Active in system"
                        trend={overview.totalUsers > 0 ? "up" : null}
                        trendValue="ACTIVE"
                    />
                    <KPICard
                        title="Active Teams"
                        value={overview.totalTeams || 0}
                        icon={Briefcase}
                        subtitle="Registered teams"
                    />
                    <KPICard
                        title="Total Tasks"
                        value={taskData.total || 0}
                        icon={ClipboardList}
                        subtitle={`${taskData.completed || 0} completed`}
                        trend={taskData.completionRate > 50 ? "up" : taskData.total > 0 ? "down" : null}
                        trendValue={`${taskData.completionRate || 0}%`}
                    />
                    <KPICard
                        title="Total Leads"
                        value={leadData.total || leadStats.total || 0}
                        icon={Target}
                        subtitle={`${leadData.active || 0} active`}
                    />
                    <KPICard
                        title="Lead Conv. Rate"
                        value={`${leadData.conversionRate || leadStats.conversionRate || 0}%`}
                        icon={TrendingUp}
                        subtitle={`${leadData.converted || leadStats.converted || 0} converted`}
                        trend={leadData.conversionRate > 0 ? "up" : null}
                        trendValue="CONV"
                    />
                    <KPICard
                        title="Overdue Tasks"
                        value={taskData.overdue || 0}
                        icon={Clock}
                        subtitle="Need attention"
                        trend={taskData.overdue > 0 ? "down" : null}
                        trendValue="ALERT"
                    />
                </div>

                {/* PERFORMANCE CHART */}
                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-black text-[#1D1110]">Performance Measurement</h3>
                            <p className="text-sm text-gray-400 font-medium mt-0.5">Daily tasks created over the date range</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#3E2723]"></div>
                                <span className="text-xs font-bold text-gray-500">Tasks</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#D7CCC8]"></div>
                                <span className="text-xs font-bold text-gray-500">Leads</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[350px]">
                        {performanceTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={performanceTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '13px'}} />
                                    <Area type="monotone" dataKey="leads" fill="#D7CCC8" fillOpacity={0.3} stroke="#D7CCC8" strokeWidth={2} />
                                    <Bar dataKey="tasks" barSize={16} fill="#3E2723" radius={[4, 4, 0, 0]} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-300">
                                <div className="text-center">
                                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm font-bold text-gray-400">No trend data for selected period</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* TWO COLUMN: Lead Pie + Task Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Lead Status Distribution */}
                    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-black text-[#1D1110] mb-5">Lead Status Distribution</h3>
                        {leadChartData.length > 0 ? (
                            <div className="flex items-center justify-between">
                                <div className="h-[200px] w-1/2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={leadChartData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                                {leadChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-1/2 space-y-2">
                                    {leadChartData.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                                                <span className="text-xs font-bold text-gray-500">{item.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-[#1D1110]">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[200px] text-gray-300">
                                <p className="text-sm font-bold text-gray-400">No lead data available</p>
                            </div>
                        )}
                    </div>

                    {/* Task Status Breakdown */}
                    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-black text-[#1D1110] mb-5">Task Status Breakdown</h3>
                        {taskStatusData.length > 0 ? (
                            <div className="flex items-center justify-between">
                                <div className="h-[200px] w-1/2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={taskStatusData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                                {taskStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-1/2 space-y-2">
                                    {taskStatusData.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                                                <span className="text-xs font-bold text-gray-500">{item.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-[#1D1110]">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[200px] text-gray-300">
                                <p className="text-sm font-bold text-gray-400">No task data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* THREE COLUMN: Activity + Teams + Leaders */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col h-full">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-black text-[#1D1110]">Recent Activity</h3>
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg">
                                {recentActivity.tasksCreated || 0} this week
                            </span>
                        </div>
                        <div className="space-y-4 flex-1">
                            {activities.length > 0 ? activities.slice(0, 5).map((activity, index, arr) => (
                                <div key={index} className="flex gap-3 group">
                                    <div className="relative">
                                        <div className="w-8 h-8 bg-[#F3EFE7] rounded-xl flex items-center justify-center text-[#3E2723] group-hover:scale-110 transition-transform">
                                            {activity.action?.includes('lead') ? <Target size={14} /> : 
                                             activity.action?.includes('task') ? <CheckCircle size={14} /> :
                                             <Activity size={14} />}
                                        </div>
                                        {index !== arr.length - 1 && (
                                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-gray-100"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#1D1110] leading-tight truncate">{activity.details || activity.action}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 font-medium">
                                            {new Date(activity.createdAt).toLocaleDateString()} • {new Date(activity.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300 py-8">
                                    <Activity size={24} className="mb-2 opacity-20" />
                                    <p className="text-sm font-bold text-gray-400">No recent activities</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active Teams */}
                    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col h-full">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-black text-[#1D1110]">Active Teams</h3>
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg">
                                {bestTeams.length} teams
                            </span>
                        </div>
                        <div className="space-y-4 flex-1">
                            {bestTeams.length > 0 ? bestTeams.slice(0, 5).map((team) => (
                                <div key={team.teamId} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-[#F3EFE7] rounded-xl flex items-center justify-center text-[#3E2723] text-xs font-black group-hover:rotate-6 transition-transform">
                                            {team.teamName?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#1D1110]">{team.teamName}</p>
                                            <p className="text-xs text-gray-400 font-medium">{team.leadName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-[#1D1110]">{team.memberCount} members</p>
                                        <div className="w-14 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-[#3E2723] rounded-full" style={{width: `${team.completionRate}%`}}></div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300 py-8">
                                    <Briefcase size={24} className="mb-2 opacity-20" />
                                    <p className="text-sm font-bold text-gray-400">No active teams</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Leaders */}
                    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col h-full">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-black text-[#1D1110]">Top Leaders</h3>
                        </div>
                        <div className="space-y-3 flex-1">
                            {bestTeams.length > 0 ? bestTeams.slice(0, 5).map((team, index) => (
                                <div key={index} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-[#1D1110]">{team.leadName}</span>
                                        <span className="text-xs font-black text-[#3E2723]">{team.completionRate}%</span>
                                    </div>
                                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[#D7CCC8] to-[#3E2723] rounded-full"
                                            style={{width: `${team.completionRate}%`}}
                                        ></div>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300 py-8">
                                    <Award size={24} className="mb-2 opacity-20" />
                                    <p className="text-sm font-bold text-gray-400">No performance data</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-5 p-3 bg-[#1D1110] rounded-2xl flex items-center justify-between text-white">
                            <div>
                                <p className="text-xs font-medium opacity-70">Lead Conversion</p>
                                <p className="text-lg font-black">{leadData.conversionRate || leadStats.conversionRate || 0}%</p>
                            </div>
                            <TrendingUp size={18} className="opacity-50" />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdminDashboard;
