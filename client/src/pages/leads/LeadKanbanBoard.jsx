import React, { useState } from 'react';
import {
    MoreHorizontal,
    Calendar,
    User,
    DollarSign,
    Phone,
    Mail,
    AlertCircle
} from 'lucide-react';
import { leadsAPI } from '../../services/api';

const LeadKanbanBoard = ({ leads, onLeadUpdate, onSelectLead }) => {
    const [draggedLead, setDraggedLead] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [updatingLeadId, setUpdatingLeadId] = useState(null);

    const columns = [
        { id: 'new', title: 'New', color: 'bg-blue-50 border-blue-200 text-blue-700' },
        { id: 'contacted', title: 'Contacted', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
        { id: 'interested', title: 'Interested / Demo', color: 'bg-purple-50 border-purple-200 text-purple-700' },
        { id: 'follow_up', title: 'Follow Up', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
        { id: 'converted', title: 'Converted', color: 'bg-green-50 border-green-200 text-green-700' },
        { id: 'not_interested', title: 'Not Interested', color: 'bg-red-50 border-red-200 text-red-700' }
    ];

    const getPriorityColor = (priority) => {
        const colors = {
            urgent: 'bg-red-500',
            high: 'bg-orange-500',
            medium: 'bg-yellow-500',
            low: 'bg-green-500'
        };
        return colors[priority] || colors.medium;
    };

    const handleDragStart = (e, lead) => {
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = 'move';
        // Make the drag image transparent or custom if needed, 
        // but default browser behavior is usually fine for cards
    };

    const handleDragOver = (e, status) => {
        e.preventDefault();
        setDragOverColumn(status);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (!draggedLead || draggedLead.status === newStatus) return;

        const leadId = draggedLead._id;
        const originalStatus = draggedLead.status;

        // Optimistic update
        // We call the parent's update handler which should update the local state immediately
        // But for API call we handle it here

        try {
            setUpdatingLeadId(leadId);

            // Call API
            await leadsAPI.update(leadId, { status: newStatus });

            // Trigger refresh from parent to ensure sync
            if (onLeadUpdate) {
                onLeadUpdate();
            }
        } catch (error) {
            console.error('Failed to update lead status:', error);
            // Revert would happen automatically if we refresh from server, 
            // or we could show an error toast here
            alert('Failed to update status. Please try again.');
        } finally {
            setUpdatingLeadId(null);
            setDraggedLead(null);
        }
    };

    // Group leads by status
    const getLeadsByStatus = (status) => {
        return leads.filter(lead => (lead.status || 'new') === status);
    };

    return (
        <div className="flex overflow-x-auto pb-4 gap-4 h-[calc(100vh-280px)] min-h-[500px]">
            {columns.map(column => {
                const columnLeads = getLeadsByStatus(column.id);
                const isDragOver = dragOverColumn === column.id;

                return (
                    <div
                        key={column.id}
                        className={`flex-shrink-0 w-80 flex flex-col rounded-xl bg-gray-50 border-2 transition-colors ${isDragOver ? 'border-orange-400 bg-orange-50' : 'border-transparent'
                            }`}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        {/* Column Header */}
                        <div className={`p-3 rounded-t-xl border-b border-gray-100 flex items-center justify-between ${column.color.replace('bg-', 'bg-opacity-20 ')}`}>
                            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                {column.title}
                                <span className={`px-2 py-0.5 rounded-full text-xs bg-white bg-opacity-60 shadow-sm`}>
                                    {columnLeads.length}
                                </span>
                            </h3>
                        </div>

                        {/* Drop Zone / Leads Container */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
                            {columnLeads.map(lead => (
                                <div
                                    key={lead._id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, lead)}
                                    onClick={() => onSelectLead(lead._id)}
                                    className={`
                                        bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-move 
                                        hover:shadow-md hover:border-orange-300 transition-all group relative
                                        ${updatingLeadId === lead._id ? 'opacity-50 pointer-events-none' : ''}
                                    `}
                                >
                                    {/* Priority Line */}
                                    <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${getPriorityColor(lead.priority)}`}></div>

                                    <div className="pl-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                                                {lead.clientName}
                                            </h4>
                                            {updatingLeadId === lead._id && (
                                                <div className="animate-spin h-4 w-4 border-2 border-orange-500 rounded-full border-t-transparent"></div>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 mb-3">
                                            {lead.companyName && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                    <span className="truncate">{lead.companyName}</span>
                                                </div>
                                            )}

                                            {lead.email && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    <span className="truncate">{lead.email}</span>
                                                </div>
                                            )}

                                            {lead.phone && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    <span className="truncate">{lead.phone}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                            {lead.estimatedValue > 0 ? (
                                                <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                                    <DollarSign className="w-3 h-3" />
                                                    <span>{lead.estimatedValue.toLocaleString()}</span>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-400 italic">No value</div>
                                            )}

                                            {lead.assignedTo ? (
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 border border-white shadow-sm" title={lead.assignedTo.name}>
                                                    {lead.assignedTo.name?.charAt(0) || <User className="w-3 h-3" />}
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center border border-dashed border-gray-300">
                                                    <User className="w-3 h-3 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {columnLeads.length === 0 && (
                                <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                    Drop here
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default LeadKanbanBoard;
