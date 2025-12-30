import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { followUpsAPI } from '../../services/api';

const FollowUpList = () => {
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFollowUps();
    }, []);

    const fetchFollowUps = async () => {
        try {
            const response = await followUpsAPI.getUpcoming();
            // Filter out follow-ups with deleted leads or users
            const validFollowUps = (response.data.data || []).filter(followUp => {
                // Keep only if lead exists and is not deleted
                return followUp.leadId && !followUp.leadId.isDeleted;
            });
            setFollowUps(validFollowUps);
        } catch (error) {
            console.error('Error fetching follow-ups:', error);
            setFollowUps([]);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (id) => {
        try {
            await followUpsAPI.complete(id, 'Completed');
            fetchFollowUps();
        } catch (error) {
            console.error('Error completing follow-up:', error);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            urgent: 'bg-red-100 text-red-700 border-red-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            low: 'bg-green-100 text-green-700 border-green-200'
        };
        return colors[priority] || colors.medium;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Upcoming Follow-Ups</h3>
                <Calendar className="text-gray-400" size={20} />
            </div>

            {followUps.length === 0 ? (
                <div className="text-center py-8">
                    <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500">No upcoming follow-ups</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {followUps.map((followUp) => {
                        // Get assigned user name, handle deleted users
                        const assignedUserName = followUp.assignedTo?.name || 'Unassigned';
                        const isUserDeleted = followUp.assignedTo && !followUp.assignedTo.name;
                        
                        return (
                            <div
                                key={followUp._id}
                                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-300 transition-all"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 text-sm mb-1">
                                            {followUp.title || 'Follow-up'}
                                        </h4>
                                        <p className="text-xs text-gray-600 mb-1">
                                            Lead: {followUp.leadId?.clientName || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Assigned to: {isUserDeleted ? (
                                                <span className="text-red-500">(Deleted User)</span>
                                            ) : (
                                                assignedUserName
                                            )}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(followUp.priority)}`}>
                                        {followUp.priority}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Clock size={14} />
                                        <span>
                                            {new Date(followUp.scheduledDate).toLocaleDateString()}
                                            {followUp.scheduledTime && ` at ${followUp.scheduledTime}`}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleComplete(followUp._id)}
                                        className="text-green-600 hover:text-green-700 p-1"
                                        title="Mark as complete"
                                    >
                                        <CheckCircle2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FollowUpList;
