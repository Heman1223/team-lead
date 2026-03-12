import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { leadsAPI, usersAPI } from '../../services/api';

/**
 * MeetingFilter Component
 * 
 * Provides filtering UI for meetings by month and lead/team member.
 * Allows users to refine calendar view to specific timeframes and participants.
 * 
 * Props:
 * - onFilter: Callback function when filter is applied with { month, leadId }
 * - onClear: Callback function when filter is cleared
 */
const MeetingFilter = ({ onFilter, onClear }) => {
    const [month, setMonth] = useState('');
    const [leadId, setLeadId] = useState('');
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Month names for display
    const monthNames = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    // Fetch leads on component mount
    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            // Fetch both leads and team members
            const [leadsRes, usersRes] = await Promise.all([
                leadsAPI.getAll(),
                usersAPI.getAll()
            ]);

            const leadsData = (leadsRes.data.data || []).map(lead => ({
                _id: lead._id,
                name: lead.clientName || lead.name,
                type: 'lead'
            }));

            const usersData = (usersRes.data.data || []).map(user => ({
                _id: user._id,
                name: user.name,
                type: 'user'
            }));

            // Combine and sort leads and users
            const combined = [...leadsData, ...usersData].sort((a, b) => 
                a.name.localeCompare(b.name)
            );
            setLeads(combined);
        } catch (error) {
            console.error('Error fetching leads and users:', error);
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilter = () => {
        // Validate that at least one filter is selected
        if (!month && !leadId) {
            alert('Please select at least a month or a member');
            return;
        }

        // Call the filter callback with selected values (convert month to number)
        onFilter({
            month: month ? parseInt(month) : null,
            leadId: leadId || null
        });

        // Collapse the filter section after applying
        setIsExpanded(false);
    };

    const handleClearFilter = () => {
        // Reset all filter values
        setMonth('');
        setLeadId('');
        
        // Call the clear callback
        onClear();
        
        // Collapse the filter section
        setIsExpanded(false);
    };

    return (
        <div className="mb-6">
            {/* Filter Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full sm:w-auto flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-medium"
            >
                <Filter size={18} />
                <span>Filters</span>
                {(month || leadId) && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {(month ? 1 : 0) + (leadId ? 1 : 0)}
                    </span>
                )}
            </button>

            {/* Filter Panel - Expandable */}
            {isExpanded && (
                <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Filter Meetings</h3>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Month Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Select Month
                            </label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white cursor-pointer"
                            >
                                <option value="">All Months</option>
                                {monthNames.map(m => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Member/Lead Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Select Team Member
                            </label>
                            <select
                                value={leadId}
                                onChange={(e) => setLeadId(e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">All Members & Leads</option>
                                {leads.length === 0 ? (
                                    <option disabled>
                                        {loading ? 'Loading...' : 'No members available'}
                                    </option>
                                ) : (
                                    leads.map(lead => (
                                        <option key={lead._id} value={lead._id}>
                                            {lead.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleApplyFilter}
                            disabled={loading}
                            className="flex-1 sm:flex-initial bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Loading...' : 'Apply Filter'}
                        </button>
                        
                        {(month || leadId) && (
                            <button
                                onClick={handleClearFilter}
                                className="flex-1 sm:flex-initial bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>

                    {/* Helper Text */}
                    <p className="text-xs text-gray-500 mt-4">
                        💡 Select month and/or member to filter meetings. Leave blank to view all.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MeetingFilter;
