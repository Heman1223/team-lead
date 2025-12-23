import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { usersAPI, callsAPI } from '../services/api';
import { 
    Phone, PhoneCall, PhoneIncoming, PhoneMissed, PhoneOff, 
    Clock, Search, RefreshCw, MessageCircle, Send, X,
    CheckCircle, AlertCircle, Users
} from 'lucide-react';

const Communication = () => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [callHistory, setCallHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [callFilter, setCallFilter] = useState('all');
    const [showCallModal, setShowCallModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const [membersRes, callsRes] = await Promise.all([
                usersAPI.getAll(),
                callsAPI.getHistory({ limit: 50 })
            ]);
            // Show all members including current user
            setMembers(membersRes.data.data || []);
            setCallHistory(callsRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const checkAvailability = async (member) => {
        try {
            const response = await callsAPI.checkAvailability(member._id);
            setAvailability(response.data.data);
            setSelectedMember(member);
            setShowCallModal(true);
        } catch (err) {
            console.error('Failed to check availability:', err);
        }
    };

    const initiateCall = async () => {
        if (!selectedMember) return;
        try {
            await callsAPI.initiate({ receiverId: selectedMember._id });
            setShowCallModal(false);
            setSelectedMember(null);
            setAvailability(null);
            fetchData();
            alert('✅ Call initiated successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to initiate call');
        }
    };

    const openMessageModal = (member) => {
        setSelectedMember(member);
        setShowMessageModal(true);
        setMessageText('');
    };

    const sendMessage = async () => {
        if (!selectedMember || !messageText.trim()) return;
        
        setSendingMessage(true);
        try {
            // Simulate sending message (you can integrate with a real messaging API)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            alert(`✅ Message sent to ${selectedMember.name}!`);
            setShowMessageModal(false);
            setSelectedMember(null);
            setMessageText('');
        } catch (err) {
            alert('Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'busy': return 'bg-yellow-500';
            case 'offline': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'online': return 'bg-green-50 text-green-700 border-green-200';
            case 'busy': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'offline': return 'bg-gray-50 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getCallStatusIcon = (status) => {
        switch (status) {
            case 'answered': return <PhoneIncoming className="w-4 h-4 text-green-600" />;
            case 'missed': return <PhoneMissed className="w-4 h-4 text-red-600" />;
            case 'busy': return <PhoneOff className="w-4 h-4 text-yellow-600" />;
            default: return <Phone className="w-4 h-4 text-gray-600" />;
        }
    };

    const getCallStatusBadge = (status) => {
        switch (status) {
            case 'answered': return 'bg-green-50 text-green-700 border-green-200';
            case 'missed': return 'bg-red-50 text-red-700 border-red-200';
            case 'busy': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTime = (date) => {
        const now = new Date();
        const callDate = new Date(date);
        const diffMs = now - callDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return callDate.toLocaleDateString();
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredCalls = callHistory.filter(call => {
        if (callFilter === 'all') return true;
        return call.status === callFilter;
    });

    const statusCounts = {
        online: members.filter(m => m.status === 'online').length,
        busy: members.filter(m => m.status === 'busy').length,
        offline: members.filter(m => m.status === 'offline').length
    };

    const callCounts = {
        answered: callHistory.filter(c => c.status === 'answered').length,
        missed: callHistory.filter(c => c.status === 'missed').length,
        busy: callHistory.filter(c => c.status === 'busy').length
    };

    if (loading) {
        return (
            <Layout title="Communication">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading communication...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Communication">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Communication</h1>
                        <p className="text-gray-600 mt-1">Connect with your team members</p>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={refreshing}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Members</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{members.length}</p>
                            </div>
                            <div className="p-4 bg-blue-100 rounded-xl">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Online</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{statusCounts.online}</p>
                            </div>
                            <div className="p-4 bg-green-100 rounded-xl">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Calls</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{callHistory.length}</p>
                            </div>
                            <div className="p-4 bg-purple-100 rounded-xl">
                                <Phone className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Answered</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{callCounts.answered}</p>
                            </div>
                            <div className="p-4 bg-green-100 rounded-xl">
                                <PhoneIncoming className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Team Members List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setStatusFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            statusFilter === 'all'
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        All ({members.length})
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('online')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            statusFilter === 'online'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        Online ({statusCounts.online})
                                    </button>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search members..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Members Grid */}
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {filteredMembers.map((member) => (
                                    <div
                                        key={member._id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className={`absolute bottom-0 right-0 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{member.name}</p>
                                                <p className="text-sm text-gray-600">{member.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(member.status)}`}>
                                                        {member.status}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{member.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openMessageModal(member)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium"
                                                title="Send Message"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Message
                                            </button>
                                            <button
                                                onClick={() => checkAvailability(member)}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium"
                                                title="Call Member"
                                            >
                                                <Phone className="w-4 h-4" />
                                                Call
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {filteredMembers.length === 0 && (
                                    <div className="text-center py-12">
                                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600">No members found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Call History */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Call History</h2>
                                <select
                                    value={callFilter}
                                    onChange={(e) => setCallFilter(e.target.value)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="all">All Calls</option>
                                    <option value="answered">Answered</option>
                                    <option value="missed">Missed</option>
                                    <option value="busy">Busy</option>
                                </select>
                            </div>

                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {filteredCalls.map((call) => (
                                    <div
                                        key={call._id}
                                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getCallStatusIcon(call.status)}
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getCallStatusBadge(call.status)}`}>
                                                    {call.status}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">{formatTime(call.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm mb-2">
                                            <span className="font-medium text-gray-900">{call.callerId?.name || 'Unknown'}</span>
                                            <span className="text-gray-400">→</span>
                                            <span className="font-medium text-gray-900">{call.receiverId?.name || 'Unknown'}</span>
                                        </div>
                                        {call.duration > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-gray-600">
                                                <Clock className="w-3 h-3" />
                                                <span>{formatDuration(call.duration)}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {filteredCalls.length === 0 && (
                                    <div className="text-center py-12">
                                        <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600">No call history</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call Modal */}
                {showCallModal && selectedMember && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                            <div className="p-6">
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
                                        {selectedMember.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedMember.name}</h3>
                                    <p className="text-gray-600 mb-4">{selectedMember.email}</p>

                                    {availability && (
                                        <div className="mb-6">
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusBadge(availability.status)}`}>
                                                <span className={`w-2 h-2 ${getStatusColor(availability.status)} rounded-full`}></span>
                                                <span className="font-medium capitalize">{availability.status}</span>
                                            </div>
                                            
                                            {availability.canCall ? (
                                                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                                                    <div className="flex items-center justify-center gap-2 text-green-700">
                                                        <CheckCircle className="w-5 h-5" />
                                                        <span className="font-medium">Available to call</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                                    <div className="flex items-center justify-center gap-2 text-yellow-700">
                                                        <AlertCircle className="w-5 h-5" />
                                                        <span className="font-medium">
                                                            {availability.status === 'busy' ? 'Currently busy' : 'Currently offline'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <p className="text-sm text-gray-500 mt-3">
                                                Last active: {new Date(availability.lastActive).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowCallModal(false);
                                            setSelectedMember(null);
                                            setAvailability(null);
                                        }}
                                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={initiateCall}
                                        disabled={!availability?.canCall}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PhoneCall className="w-5 h-5" />
                                        Call Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Message Modal */}
                {showMessageModal && selectedMember && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {selectedMember.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{selectedMember.name}</h3>
                                            <p className="text-sm text-gray-600">{selectedMember.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowMessageModal(false);
                                            setSelectedMember(null);
                                            setMessageText('');
                                        }}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Your Message
                                    </label>
                                    <textarea
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="Type your message here..."
                                        rows={6}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        {messageText.length} characters
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowMessageModal(false);
                                            setSelectedMember(null);
                                            setMessageText('');
                                        }}
                                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={sendMessage}
                                        disabled={!messageText.trim() || sendingMessage}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sendingMessage ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Communication;
