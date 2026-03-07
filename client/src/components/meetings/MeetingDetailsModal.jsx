import React, { useState } from 'react';
import { X, Calendar, Clock, Video, MapPin, Users, Loader2, Trash2, CheckCircle, ExternalLink, MessageSquare, AlertCircle } from 'lucide-react';
import { meetingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MeetingDetailsModal = ({ isOpen, meeting, onClose, onUpdate, onReschedule }) => {
    const { isAdmin, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [showNotes, setShowNotes] = useState(false);
    const [newNote, setNewNote] = useState('');

    if (!meeting) return null;

    const isOrganizer = meeting.organizerId?._id === user?._id;
    const isParticipant = meeting.participants?.some(p => (p._id || p) === user?._id);
    const canManage = isAdmin || isOrganizer;
    const canUpdateStatus = isAdmin || isOrganizer || isParticipant;

    const handleStatusUpdate = async (newStatus) => {
        try {
            setActionLoading(newStatus);
            await meetingsAPI.update(meeting._id, { status: newStatus });
            if (onUpdate) onUpdate();
            return true;
        } catch (error) {
            console.error('Error updating status:', error);
            return false;
        } finally {
            setActionLoading(null);
        }
    };

    const handleReschedule = async () => {
        const success = await handleStatusUpdate('rescheduled');
        if (success && onReschedule) {
            onReschedule(meeting);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this meeting?')) return;
        try {
            setLoading(true);
            await meetingsAPI.delete(meeting._id);
            onClose();
            onUpdate();
        } catch (error) {
            console.error('Error deleting meeting:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        try {
            setLoading(true);
            const updatedNotes = meeting.notes ? `${meeting.notes}\n\n[New Note]: ${newNote}` : newNote;
            await meetingsAPI.update(meeting._id, { notes: updatedNotes });
            setNewNote('');
            setShowNotes(false);
            onUpdate();
        } catch (error) {
            console.error('Error adding note:', error);
        } finally {
            setLoading(false);
        }
    };

    const statusColors = {
        upcoming: 'bg-blue-100 text-blue-700',
        ongoing: 'bg-purple-100 text-purple-700',
        completed: 'bg-green-100 text-green-700',
        missed: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-100 text-gray-700',
        rescheduled: 'bg-orange-100 text-orange-700'
    };

    const startTime = new Date(meeting.startTime);
    const endTime = new Date(meeting.endTime);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Fixed Header */}
                <div className="shrink-0">
                    <div 
                        className="h-2 w-full"
                        style={{ backgroundColor: meeting.color }}
                    ></div>
                    
                    <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <div 
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[meeting.status] || 'bg-gray-100'}`}
                            >
                                {meeting.status}
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate max-w-[180px] sm:max-w-[250px]">
                                {meeting.title}
                            </h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {/* Time and Lead Info */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Clock className="text-gray-400 mt-1" size={20} />
                            <div>
                                <p className="text-sm font-bold text-gray-900">
                                    {startTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        {meeting.leadId && (
                            <div className="flex items-start gap-3">
                                <Users className="text-gray-400 mt-1" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Client / Lead</p>
                                    <p className="text-sm text-blue-600 hover:underline cursor-pointer">
                                        {meeting.leadId.clientName}
                                    </p>
                                    <p className="text-xs text-gray-500">{meeting.leadId.email}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-3">
                            {meeting.type === 'online' ? (
                                <>
                                    <Video className="text-gray-400 mt-1" size={20} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900">Online Meeting</p>
                                        {meeting.meetingLink ? (
                                            <a 
                                                href={meeting.meetingLink} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 flex items-center gap-1 hover:underline"
                                            >
                                                Join Link <ExternalLink size={14} />
                                            </a>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No link provided</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <MapPin className="text-gray-400 mt-1" size={20} />
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Location</p>
                                        <p className="text-sm text-gray-600">{meeting.location || 'Offline'}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {meeting.description && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description / Agenda</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{meeting.description}</p>
                        </div>
                    )}

                    {/* Notes Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <MessageSquare size={16} /> Meeting Notes
                            </h3>
                            {!showNotes && (
                                <button 
                                    onClick={() => setShowNotes(true)}
                                    className="text-xs text-[#3E2723] font-bold hover:underline"
                                >
                                    Add Note
                                </button>
                            )}
                        </div>
                        
                        {meeting.notes && (
                            <div className="bg-[#FAF7F2] p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap italic border border-[#E7D7C1]">
                                {meeting.notes}
                            </div>
                        )}

                        {showNotes && (
                            <div className="space-y-2 animate-in slide-in-from-top-2">
                                <textarea
                                    className="w-full p-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#3E2723] outline-none"
                                    placeholder="Type your notes here..."
                                    rows="3"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                ></textarea>
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => { setShowNotes(false); setNewNote(''); }}
                                        className="px-3 py-1 text-xs font-semibold text-gray-500"
                                    >Cancel</button>
                                    <button 
                                        onClick={handleAddNote}
                                        disabled={loading}
                                        className="px-3 py-1 text-xs font-semibold bg-[#3E2723] text-white rounded-lg flex items-center gap-1"
                                    >
                                        {loading && <Loader2 size={12} className="animate-spin" />}
                                        Save Note
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="shrink-0 p-4 sm:p-6 bg-gray-50 border-t border-gray-100 space-y-4">
                    {canUpdateStatus && (
                        <>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update Meeting Status</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <button
                                    onClick={() => handleStatusUpdate('completed')}
                                    disabled={actionLoading === 'completed' || meeting.status === 'completed' || new Date() < new Date(meeting.startTime)}
                                    title={new Date() < new Date(meeting.startTime) ? "Cannot mark as completed before start time" : ""}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1 ${meeting.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' : (new Date() < new Date(meeting.startTime) ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-600 hover:border-green-200 hover:bg-green-50')}`}
                                >
                                    {actionLoading === 'completed' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={16} />}
                                    <span className="text-[10px] font-bold">Completed</span>
                                </button>

                                <button
                                    onClick={() => handleStatusUpdate('missed')}
                                    disabled={actionLoading === 'missed' || meeting.status === 'missed'}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1 ${meeting.status === 'missed' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50'}`}
                                >
                                    {actionLoading === 'missed' ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={16} />}
                                    <span className="text-[10px] font-bold">Missed</span>
                                </button>

                                <button
                                    onClick={handleReschedule}
                                    disabled={actionLoading === 'rescheduled' || meeting.status === 'rescheduled'}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1 ${meeting.status === 'rescheduled' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:bg-orange-50'}`}
                                >
                                    {actionLoading === 'rescheduled' ? <Loader2 size={14} className="animate-spin" /> : <Clock size={16} />}
                                    <span className="text-[10px] font-bold">Reschedule</span>
                                </button>

                                <button
                                    onClick={() => handleStatusUpdate('cancelled')}
                                    disabled={actionLoading === 'cancelled' || meeting.status === 'cancelled'}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1 ${meeting.status === 'cancelled' ? 'bg-gray-100 border-gray-300 text-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                                >
                                    {actionLoading === 'cancelled' ? <Loader2 size={14} className="animate-spin" /> : <X size={16} />}
                                    <span className="text-[10px] font-bold">Cancelled</span>
                                </button>
                            </div>
                        </>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-gray-200">
                         <div className="flex items-center gap-2">
                            {canManage && (
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            )}
                         </div>
                         <button
                            onClick={onClose}
                            className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1"
                         >
                            Close
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeetingDetailsModal;
