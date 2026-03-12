import React from 'react';
import { Calendar, Users, TrendingUp } from 'lucide-react';

/**
 * MeetingSummary Component
 * 
 * Displays summary statistics about the filtered meetings.
 * Shows total count and visual indicators for meeting status.
 * 
 * Props:
 * - totalCount: Total number of meetings matching the filter
 * - isFiltered: Boolean indicating if filters are currently active
 * - filterInfo: Object with { month, leadName } for display
 */
const MeetingSummary = ({ totalCount = 0, isFiltered = false, filterInfo = {} }) => {
    const getMonthName = (monthNum) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return monthNum ? months[monthNum - 1] : 'Unknown';
    };

    return (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Meetings Card */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">
                                Total Meetings
                            </p>
                            <p className="text-3xl font-bold text-blue-600">
                                {totalCount}
                            </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <Calendar size={24} className="text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Filter Status Card */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">
                                Filter Status
                            </p>
                            <p className="text-sm font-semibold text-gray-800">
                                {isFiltered ? (
                                    <span className="inline-flex items-center">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                        Filtered
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center">
                                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                        No Filter
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="bg-indigo-100 p-3 rounded-lg">
                            <Users size={24} className="text-indigo-600" />
                        </div>
                    </div>
                </div>

                {/* Filter Details Card */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">
                                Applied Filters
                            </p>
                            <div className="text-xs text-gray-800 font-medium">
                                {isFiltered ? (
                                    <div className="space-y-1">
                                        {filterInfo.month && (
                                            <div>📅 {getMonthName(filterInfo.month)}</div>
                                        )}
                                        {filterInfo.leadName && (
                                            <div>👤 {filterInfo.leadName}</div>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-gray-500">None</span>
                                )}
                            </div>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <TrendingUp size={24} className="text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* informational message */}
            {isFiltered && totalCount === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        ⚠️ No meetings found with the selected filters. Try adjusting your search criteria.
                    </p>
                </div>
            )}

            {!isFiltered && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        📊 Showing all meetings. Use the filter above to narrow down results by month or member.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MeetingSummary;
