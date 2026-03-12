import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Mail,
    Phone,
    Eye,
    RefreshCw,
    AlertCircle,
    User,
    LayoutGrid,
    List,
    Trash2,
    Pencil
} from 'lucide-react';
import { leadsAPI } from '../../services/api';
import leadStore from '../../utils/leadStore';
import LeadKanbanBoard from './LeadKanbanBoard';
import CreateLeadModalSimple from './CreateLeadModalSimple';

const LeadList = ({ onSelectLead }) => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('list');
    const [forceUpdate, setForceUpdate] = useState(0);
    const [editingLead, setEditingLead] = useState(null);

    useEffect(() => {
        fetchLeads();
    }, [filterStatus]); // Refresh when status filter changes

    // Search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchLeads();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Listen for lead updates using global store
    useEffect(() => {
        const unsubscribe = leadStore.subscribe((version) => {
            console.log('LeadList: Global store update received, version:', version);
            fetchLeads();
            // Force re-render by updating state
            setForceUpdate(prev => prev + 1);
        });
        return unsubscribe;
    }, []);

    // Debug when component mounts or key changes
    useEffect(() => {
        console.log('LeadList component mounted/refreshed');
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                status: filterStatus,
                search: searchTerm
            };
            const response = await leadsAPI.getAll(params);
            const leadsData = response.data.data || [];
            console.log('fetchLeads: fetched', leadsData.length, 'leads');
            setLeads(leadsData);
        } catch (error) {
            console.error('Error fetching leads:', error);
            setError('Failed to fetch leads. Please try again.');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering as fallback or for immediate visual feedback
    const filteredLeads = leads; // Backend already filtered based on our params

    const handleDeleteLead = async (e, leadId, leadName) => {
        e.stopPropagation(); // Prevent triggering the card click
        if (!window.confirm(`Are you sure you want to delete "${leadName}"? This action cannot be undone.`)) return;
        try {
            await leadsAPI.delete(leadId);
            fetchLeads(); // Refresh list
        } catch (err) {
            console.error('Delete lead error:', err);
            alert('Failed to delete lead. ' + (err.response?.data?.message || ''));
        }
    };

    const openEditModal = (e, lead) => {
        e.stopPropagation();
        setEditingLead(lead);
    };

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
            high: 'bg-[#3E2723]',
            medium: 'bg-yellow-500',
            low: 'bg-green-500'
        };
        return colors[priority] || colors.medium;
    };

    return (
        <div key={forceUpdate} className="space-y-4 sm:space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                {/* Search */}
                <div className="relative flex-1 md:max-w-2xl group flex items-center bg-white border border-gray-300 rounded-xl transition-all shadow-sm focus-within:ring-2 focus-within:ring-[#3E2723] focus-within:border-transparent group-hover:border-gray-400">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search 
                            size={20} 
                            className="text-gray-400 transition-colors group-focus-within:text-[#3E2723]" 
                        />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 !pl-12 pr-4 py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E2723] focus:border-transparent bg-white"
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


                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                            ? 'bg-white text-[#3E2723] shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                        title="List View"
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'kanban'
                            ? 'bg-white text-[#3E2723] shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                        title="Kanban View"
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
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

            {/* Leads List / Kanban */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E2723] mx-auto"></div>
                        <p className="text-gray-600 font-medium">Loading leads...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center p-12">
                    <div className="text-center space-y-4 max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Error Loading Leads</h3>
                        <p className="text-gray-600">{error}</p>
                        <button
                            onClick={fetchLeads}
                            className="px-6 py-3 bg-[#3E2723] text-white rounded-xl hover:bg-[#2E1B17] transition-all font-semibold"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
                    <p className="text-gray-600">
                        {searchTerm || filterStatus !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Create your first lead to get started'}
                    </p>
                </div>
            ) : viewMode === 'kanban' ? (
                <LeadKanbanBoard
                    leads={filteredLeads}
                    onLeadUpdate={fetchLeads}
                    onSelectLead={onSelectLead}
                />
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredLeads.map((lead) => (
                        <div
                            key={lead._id}
                            onClick={() => onSelectLead(lead._id)}
                            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#3E2723]/30 hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between">
                                {/* Lead Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        {/* Priority Indicator */}
                                        <div className={`w-1 h-12 rounded-full ${getPriorityColor(lead.priority)}`}></div>

                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#3E2723] transition-colors">
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

                                {/* Actions */}
                                <div className="ml-4 flex flex-col gap-2">
                                    <button className="p-2 text-gray-400 hover:text-[#3E2723] hover:bg-[#3E2723]/5 rounded-lg transition-colors" title="View Lead">
                                        <Eye className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => openEditModal(e, lead)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Lead"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteLead(e, lead._id, lead.clientName)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Lead"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Edit Lead Modal — reuse CreateLeadModalSimple */}
            {editingLead && (
                <CreateLeadModalSimple
                    editLead={editingLead}
                    onClose={() => setEditingLead(null)}
                    onSuccess={fetchLeads}
                />
            )}
        </div>
    );
};

export default LeadList;
