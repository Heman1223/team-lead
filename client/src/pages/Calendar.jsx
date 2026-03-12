import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Plus, Filter, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { meetingsAPI, leadsAPI, usersAPI } from '../services/api';
import ScheduleMeetingModal from '../components/meetings/ScheduleMeetingModal';
import MeetingDetailsModal from '../components/meetings/MeetingDetailsModal';
import MeetingFilter from '../components/meetings/MeetingFilter';
import MeetingSummary from '../components/meetings/MeetingSummary';
import Layout from '../components/Layout';

const CalendarPage = () => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [rescheduleData, setRescheduleData] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Filter state variables
    const [filterMonth, setFilterMonth] = useState(null);
    const [filterLeadId, setFilterLeadId] = useState(null);
    const [filterLeadName, setFilterLeadName] = useState(null);
    const [isFiltered, setIsFiltered] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async (month = null, leadId = null) => {
        try {
            setLoading(true);
            
            // Build query parameters for filtering
            const params = {};
            if (month) {
                params.month = parseInt(month); // Ensure month is sent as number
            }
            if (leadId) {
                params.leadId = leadId;
            }

            // Debug logging
            console.log('📊 Fetching meetings with filters:', { month, leadId, params });

            // Fetch meetings with optional filters
            const response = await meetingsAPI.getAll(params);
            console.log('📊 API Response:', { count: response.data.count, totalMeetings: response.data.data.length });
            const rawMeetings = response.data.data;
            
            const formattedEvents = rawMeetings.map(meeting => ({
                id: meeting._id,
                title: meeting.title,
                start: meeting.startTime,
                end: meeting.endTime,
                backgroundColor: meeting.color,
                borderColor: meeting.color,
                className: ['rescheduled', 'cancelled'].includes(meeting.status) ? 'opacity-50 grayscale-[0.5]' : '',
                extendedProps: {
                    ...meeting
                }
            }));
            setMeetings(formattedEvents);

            // Re-sync selected meeting to update the details modal if it's open
            if (selectedMeeting) {
                const refreshedSelected = rawMeetings.find(m => m._id === selectedMeeting._id);
                if (refreshedSelected) {
                    setSelectedMeeting(refreshedSelected);
                }
            }
        } catch (error) {
            console.error('Error fetching meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (arg) => {
        setSelectedDate(arg.date);
        setIsScheduleModalOpen(true);
    };

    const handleEventClick = (arg) => {
        setSelectedMeeting(arg.event.extendedProps);
        setIsDetailsModalOpen(true);
    };

    const handleEventDrop = async (arg) => {
        try {
            const { id, start, end } = arg.event;
            await meetingsAPI.update(id, {
                startTime: start,
                endTime: end
            });
            // Refresh meetings to get updated colors/info if needed
            fetchMeetings(filterMonth, filterLeadId);
        } catch (error) {
            console.error('Error updating meeting time:', error);
            arg.revert();
        }
    };

    /**
     * Handle filter application from MeetingFilter component
     * Stores filter values and refetches meetings with new filters
     */
    const handleApplyFilter = async (filterData) => {
        const { month, leadId } = filterData;
        
        // Store filter values
        setFilterMonth(month);
        setFilterLeadId(leadId);
        setIsFiltered(true);

        // Get lead name for display if leadId is provided
        if (leadId) {
            try {
                // Try to fetch the lead/user info for display
                const allLeads = await leadsAPI.getAll();
                const allUsers = await usersAPI.getAll();
                
                const allItems = [...(allLeads.data.data || []), ...(allUsers.data.data || [])];
                const foundItem = allItems.find(item => item._id === leadId);
                
                if (foundItem) {
                    setFilterLeadName(foundItem.clientName || foundItem.name);
                }
            } catch (error) {
                console.error('Error fetching lead name:', error);
            }
        }

        // Fetch meetings with the new filters
        fetchMeetings(month, leadId);
    };

    /**
     * Handle filter clear action from MeetingFilter component
     * Resets all filter values and fetches all meetings
     */
    const handleClearFilter = () => {
        setFilterMonth(null);
        setFilterLeadId(null);
        setFilterLeadName(null);
        setIsFiltered(false);
        
        // Fetch all meetings without filters
        fetchMeetings();
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto p-4 md:p-6 min-h-screen">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Meeting Calendar</h1>
                        <p className="text-gray-500 text-xs md:text-sm">Schedule and manage meetings with leads and clients</p>
                    </div>
                    <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="w-full sm:w-auto max-w-xs sm:max-w-none bg-[#3E2723] text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#2D1C1B] transition-all shadow-lg text-sm md:text-base font-semibold"
                    >
                        <Plus size={18} />
                        Schedule Meeting
                    </button>
                </div>

                {/* Meeting Filter Component */}
                <MeetingFilter 
                    onFilter={handleApplyFilter}
                    onClear={handleClearFilter}
                />

                {/* Meeting Summary Statistics */}
                <MeetingSummary 
                    totalCount={meetings.length}
                    isFiltered={isFiltered}
                    filterInfo={{
                        month: filterMonth,
                        leadName: filterLeadName
                    }}
                />

                <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 ${isMobile ? 'p-3 mx-auto max-w-[360px]' : 'p-6'}`}>
                    {loading ? (
                        <div className="h-[600px] flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#3E2723]" />
                        </div>
                    ) : (
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                            initialView={isMobile ? "listWeek" : "dayGridMonth"}
                            headerToolbar={isMobile ? {
                                left: 'prev,next',
                                center: 'title',
                                right: 'listWeek,dayGridMonth'
                            } : {
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                            }}
                            events={meetings}
                            editable={true}
                            selectable={true}
                            selectMirror={true}
                            dayMaxEvents={true}
                            weekends={true}
                            dateClick={handleDateClick}
                            eventClick={handleEventClick}
                            eventDrop={handleEventDrop}
                            height={isMobile ? "auto" : "700px"}
                            eventTimeFormat={{
                                hour: 'numeric',
                                minute: '2-digit',
                                meridiem: 'short'
                            }}
                        />
                    )}
                </div>

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 max-w-[360px] sm:max-w-none mx-auto sm:mx-0">
                    {[
                        { label: 'Upcoming', color: 'bg-[#2563eb]' },
                        { label: 'Ongoing', color: 'bg-[#9333ea]' },
                        { label: 'Completed', color: 'bg-[#16a34a]' },
                        { label: 'Missed', color: 'bg-[#dc2626]' },
                        { label: 'Cancelled', color: 'bg-[#6b7280]' },
                        { label: 'Rescheduled', color: 'bg-[#9ca3af]' }
                    ].map(status => (
                        <div key={status.label} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                            <span className="text-sm font-medium text-gray-700">{status.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {isScheduleModalOpen && (
                <ScheduleMeetingModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => {
                        setIsScheduleModalOpen(false);
                        setSelectedDate(null);
                        setRescheduleData(null);
                    }}
                    onSuccess={() => {
                        setIsScheduleModalOpen(false);
                        setRescheduleData(null);
                        fetchMeetings(filterMonth, filterLeadId);
                    }}
                    initialDate={selectedDate}
                    initialData={rescheduleData}
                />
            )}

            {isDetailsModalOpen && (
                <MeetingDetailsModal
                    isOpen={isDetailsModalOpen}
                    meeting={selectedMeeting}
                    onClose={() => {
                        setIsDetailsModalOpen(false);
                        setSelectedMeeting(null);
                    }}
                    onUpdate={() => {
                        fetchMeetings(filterMonth, filterLeadId);
                    }}
                    onReschedule={(meeting) => {
                        setIsDetailsModalOpen(false);
                        setSelectedMeeting(null);
                        setRescheduleData(meeting);
                        // Using setTimeout to ensure modal state transition is clean
                        setTimeout(() => {
                            setIsScheduleModalOpen(true);
                        }, 100);
                    }}
                />
            )}
        </Layout>
    );
};

export default CalendarPage;
