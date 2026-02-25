import React, { useState, useEffect } from 'react';
import {
    Target,
    TrendingUp,
    CheckCircle2,
    XCircle,
    DollarSign,
    Users,
    Clock,
    BarChart3,
    RefreshCw
} from 'lucide-react';
import { leadsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import FollowUpList from './FollowUpListSimple';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200 text-blue-600',
        green: 'bg-green-50 border-green-200 text-green-600',
        red: 'bg-red-50 border-red-200 text-red-600',
        orange: 'bg-[#3E2723]/10 border-[#3E2723]/20 text-[#3E2723]',
        purple: 'bg-purple-50 border-purple-200 text-purple-600'
    };

    return (
        <div className="bg-[#FDF8F3] rounded-lg sm:rounded-xl border border-[#EBD9C1] p-3 sm:p-4 lg:p-6 hover:border-[#3E2723]/30 transition-all">
            <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
                <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">{title}</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1">{value}</p>
            {subtitle && <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>}
        </div>
    );
};

const LeadDashboard = ({ refreshTrigger }) => {
    const { user } = useAuth();
    const { dateRange } = useFilters();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [refreshTrigger, dateRange]); // Re-fetch when refreshTrigger or global date range changes

    const fetchStats = async () => {
        setLoading(true);
        try {
            const params = {
                startDate: dateRange.startDate.toISOString(),
                endDate: dateRange.endDate.toISOString()
            };
            const response = await leadsAPI.getStats(params);
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching lead stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E2723]"></div>
            </div>
        );
    }

    const formattedPipelineValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(stats?.totalPipelineValue || 0);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                <StatCard
                    title="Total Leads"
                    value={stats?.totalLeads || 0}
                    icon={Target}
                    color="blue"
                    subtitle="All active"
                />
                <StatCard
                    title="Converted"
                    value={stats?.convertedLeads || 0}
                    icon={CheckCircle2}
                    color="green"
                    subtitle="Closed"
                />
                <StatCard
                    title="Conv. Rate"
                    value={`${(stats?.conversionRate || 0).toFixed(1)}%`}
                    icon={TrendingUp}
                    color="purple"
                    subtitle="Success"
                />
                <StatCard
                    title="Pipeline"
                    value={formattedPipelineValue}
                    icon={DollarSign}
                    color="orange"
                    subtitle="Est. value"
                />
            </div>

            {/* Status Breakdown & Follow-Ups */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                {/* Lead Status Distribution */}
                <div className="bg-[#FDF8F3] rounded-lg sm:rounded-xl border border-[#EBD9C1] p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Lead Status</h3>
                        <BarChart3 className="text-gray-400" size={16} />
                    </div>
                    {/* Fixed height with scroll */}
                    <div className="space-y-3 sm:space-y-4 max-h-60 sm:max-h-80 overflow-y-auto pr-1 sm:pr-2">
                        {Object.entries(stats?.statusDist || {}).map(([status, count]) => {
                            const percentage = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0;
                            const statusColors = {
                                new: 'bg-blue-500',
                                contacted: 'bg-yellow-500',
                                interested: 'bg-purple-500',
                                follow_up: 'bg-[#3E2723]',
                                converted: 'bg-green-500',
                                not_interested: 'bg-red-500'
                            };
                            
                            return (
                                <div key={status}>
                                    <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                                        <span className="text-xs sm:text-sm font-semibold text-gray-700 capitalize">
                                            {status.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs sm:text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                        <div
                                            className={`h-1.5 sm:h-2 rounded-full ${statusColors[status] || 'bg-gray-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Follow-Up Tasks */}
                <FollowUpList />
            </div>

            {/* Lead Sources */}
            <div className="bg-[#FDF8F3] rounded-xl border border-[#EBD9C1] p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Lead Sources</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(stats?.sourcesDist || {}).map(([source, count]) => (
                        <div key={source} className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-2xl font-bold text-gray-900">{count}</p>
                            <p className="text-sm text-gray-600 capitalize mt-1">{source.replace('_', ' ')}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Employee Performance (Admin & Team Lead only) */}
            {(user?.role === 'admin' || user?.role === 'team_lead') && stats?.employeePerformance?.length > 0 && (
                <div className="bg-[#FDF8F3] rounded-xl border border-[#EBD9C1] p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Team Performance</h3>
                    {/* Fixed height container with scroll - shows 4 rows */}
                    <div className="overflow-x-auto">
                        <div className="max-h-80 overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-white">
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Total Leads</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Converted</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Rate</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Pipeline Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.employeePerformance.map((emp, index) => (
                                        <tr key={emp._id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-[#3E2723]/10 rounded-full flex items-center justify-center text-[#3E2723] font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{emp.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="text-center py-3 px-4 text-gray-900">{emp.totalLeads || 0}</td>
                                            <td className="text-center py-3 px-4 text-green-600 font-semibold">{emp.convertedLeads || 0}</td>
                                            <td className="text-center py-3 px-4">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                                                    {(emp.conversionRate || 0).toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="text-right py-3 px-4 text-gray-900 font-semibold">
                                                ${(emp.totalPipelineValue || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Stats */}
            {stats?.avgConversionTime > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-600 mb-1">Average Conversion Time</h3>
                            <p className="text-3xl font-bold text-gray-900">{stats.avgConversionTime} days</p>
                            <p className="text-sm text-gray-600 mt-1">From lead creation to conversion</p>
                        </div>
                        <Clock className="text-blue-500" size={48} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadDashboard;
