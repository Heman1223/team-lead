import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Mail,
    Phone,
    Eye,
    RefreshCw,
    AlertCircle,
    User
} from 'lucide-react';
import { leadsAPI } from '../../services/api';

const LeadList = ({ onSelectLead }) => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await leadsAPI.getAll();
            setLeads(response.data.data || []);
        } catch (error) {
            console.error('Error fetching leads:', error);
            setError('Failed to fetch leads. Please try again.');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        const colors = {
            new: 'bg-blue-100 text-blue-700 border-blue-200',
            contacted: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            interested: 'bg-purple-100 text-purple-700 border-purple-200',
            follow_up: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            converted: 'bg-green-100 text-green-700 border-green-200',
            not_interested: 'bg-red-100 text-red-700 border-red-200'
        };
        return colors[status] || colors.new;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            urgent: 'bg-red-500',
            high: 'bg-orange-500',
            medium: 'bg-yellow-500',
            low: 'bg-green-500'
        };
        return colors[priority] || colors.medium;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="text-gray-600 font-medium">Loading leads...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Error Loading Leads</h3>
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={fetchLeads}
                        className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all font-semibold"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="follow_up">Follow Up</option>
                        <option value="converted">Converted</option>
                        <option value="not_interested">Not Interested</option>
                    </select>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={fetchLeads}
                    className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{filteredLeads.length}</span> of <span className="font-semibold text-gray-900">{leads.length}</span> leads
                </p>
            </div>

            {/* Leads List */}
            {filteredLeads.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
                    <p className="text-gray-600">
                        {searchTerm || filterStatus !== 'all' 
                            ? 'Try adjusting your search or filters' 
                            : 'Create your first lead to get started'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredLeads.map((lead) => (
                        <div
                            key={lead._id}
                            onClick={() => onSelectLead(lead._id)}
                            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between">
                                {/* Lead Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        {/* Priority Indicator */}
                                        <div className={`w-1 h-12 rounded-full ${getPriorityColor(lead.priority)}`}></div>
                                        
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                                                {lead.clientName || 'Unknown'}
                                            </h3>
                                            <p className="text-sm text-gray-600 capitalize">
                                                {(lead.category || 'other').replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="flex flex-wrap gap-4 mb-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4" />
                                            <span>{lead.email || 'No email'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            <span>{lead.phone || 'No phone'}</span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {lead.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                            {lead.description}
                                        </p>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Status Badge */}
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(lead.status)}`}>
                                            {(lead.status || 'new').replace('_', ' ').toUpperCase()}
                                        </span>

                                        {/* Assigned To */}
                                        {lead.assignedTo && (
                                            <span className="text-xs text-gray-600">
                                                Assigned to: <span className="font-semibold">{lead.assignedTo?.name || 'Unknown'}</span>
                                            </span>
                                        )}

                                        {/* Value */}
                                        {lead.estimatedValue > 0 && (
                                            <span className="text-xs font-semibold text-green-600">
                                                ${lead.estimatedValue.toLocaleString()}
                                            </span>
                                        )}

                                        {/* Source */}
                                        <span className="text-xs text-gray-500 capitalize">
                                            {(lead.source || 'unknown').replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                {/* View Button */}
                                <button className="ml-4 p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                                    <Eye className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeadList;
