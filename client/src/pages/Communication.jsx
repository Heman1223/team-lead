import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { usersAPI, callsAPI } from '../services/api';
import './Communication.css';

const Communication = () => {
    const [members, setMembers] = useState([]);
    const [callHistory, setCallHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [availability, setAvailability] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [membersRes, callsRes] = await Promise.all([
                usersAPI.getAll(),
                callsAPI.getHistory({ limit: 20 })
            ]);
            setMembers(membersRes.data.data);
            setCallHistory(callsRes.data.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkAvailability = async (member) => {
        try {
            const response = await callsAPI.checkAvailability(member._id);
            setAvailability(response.data.data);
            setSelectedMember(member);
        } catch (err) {
            console.error('Failed to check availability:', err);
        }
    };

    const initiateCall = async () => {
        if (!selectedMember) return;
        try {
            await callsAPI.initiate({ receiverId: selectedMember._id });
            setSelectedMember(null);
            setAvailability(null);
            fetchData();
            alert('Call initiated! (This is a simulated call log)');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to initiate call');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            online: { class: 'badge-success', label: 'Online' },
            busy: { class: 'badge-warning', label: 'Busy' },
            offline: { class: 'badge-neutral', label: 'Offline' }
        };
        return badges[status] || badges.offline;
    };

    const getCallStatusBadge = (status) => {
        const badges = {
            initiated: 'badge-info',
            answered: 'badge-success',
            missed: 'badge-error',
            busy: 'badge-warning',
            offline: 'badge-neutral'
        };
        return badges[status] || 'badge-neutral';
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '—';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Layout title="Communication">
            <div className="communication-page">
                <div className="comm-grid">
                    {/* Team Members */}
                    <div className="comm-section">
                        <h3 className="section-title">Team Members</h3>
                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner" />
                            </div>
                        ) : (
                            <div className="members-list">
                                {members.map(member => {
                                    const statusInfo = getStatusBadge(member.status);
                                    return (
                                        <div key={member._id} className="member-item">
                                            <div className="member-info">
                                                <div className="member-avatar">
                                                    {member.name.charAt(0).toUpperCase()}
                                                    <span className={`status-indicator ${member.status}`} />
                                                </div>
                                                <div className="member-details">
                                                    <span className="member-name">{member.name}</span>
                                                    <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => checkAvailability(member)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                                </svg>
                                                Call
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Call History */}
                    <div className="comm-section">
                        <h3 className="section-title">Call History</h3>
                        {callHistory.length === 0 ? (
                            <div className="empty-state-sm">
                                <p>No call history</p>
                            </div>
                        ) : (
                            <div className="call-history">
                                {callHistory.map(call => (
                                    <div key={call._id} className="call-item">
                                        <div className="call-info">
                                            <div className="call-participants">
                                                <span className="caller">{call.callerId?.name}</span>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                    <polyline points="12 5 19 12 12 19" />
                                                </svg>
                                                <span className="receiver">{call.receiverId?.name}</span>
                                            </div>
                                            <div className="call-meta">
                                                <span className={`badge ${getCallStatusBadge(call.status)}`}>
                                                    {call.status}
                                                </span>
                                                <span className="call-time">
                                                    {new Date(call.createdAt).toLocaleString()}
                                                </span>
                                                <span className="call-duration">
                                                    {formatDuration(call.duration)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Availability Modal */}
                {selectedMember && (
                    <div className="modal-overlay" onClick={() => { setSelectedMember(null); setAvailability(null); }}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Call {selectedMember.name}</h3>
                                <button className="btn btn-ghost btn-icon" onClick={() => { setSelectedMember(null); setAvailability(null); }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="availability-check">
                                    <div className="member-avatar avatar-lg">
                                        {selectedMember.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h4>{selectedMember.name}</h4>

                                    {availability && (
                                        <div className="availability-status">
                                            <span className={`badge ${getStatusBadge(availability.status).class}`}>
                                                {availability.status}
                                            </span>
                                            {availability.canCall ? (
                                                <p className="status-message success">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                        <polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
                                                    Available to call
                                                </p>
                                            ) : (
                                                <p className="status-message warning">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="12" y1="8" x2="12" y2="12" />
                                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                                    </svg>
                                                    {availability.status === 'busy' ? 'Currently busy' : 'Currently offline'}
                                                </p>
                                            )}
                                            <p className="last-active">
                                                Last active: {new Date(availability.lastActive).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => { setSelectedMember(null); setAvailability(null); }}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={initiateCall}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                    Initiate Call
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Communication;
