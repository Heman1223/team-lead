import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { usersAPI, messagesAPI } from '../services/api';
import {
    Search, RefreshCw, Send, ArrowLeft,
    Users, MessageCircle, Check, CheckCheck
} from 'lucide-react';

const Communication = () => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Chat state
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [activeView, setActiveView] = useState('contacts'); // 'contacts' or 'chat'
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchData();
        fetchConversations();
        const interval = setInterval(() => {
            fetchData();
            if (selectedMember) {
                fetchMessages(selectedMember._id);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const membersRes = await usersAPI.getAll();
            setMembers(membersRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchConversations = async () => {
        try {
            const res = await messagesAPI.getConversations();
            setConversations(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            setLoadingMessages(true);
            const res = await messagesAPI.getMessages(userId);
            setMessages(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const openChat = async (member) => {
        setSelectedMember(member);
        setActiveView('chat');
        await fetchMessages(member._id);
    };

    const closeChat = () => {
        setSelectedMember(null);
        setActiveView('contacts');
        setMessages([]);
        fetchConversations();
    };

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!selectedMember || !messageText.trim() || sendingMessage) return;

        setSendingMessage(true);
        try {
            await messagesAPI.sendMessage({
                receiverId: selectedMember._id,
                content: messageText.trim()
            });
            setMessageText('');
            await fetchMessages(selectedMember._id);
        } catch (err) {
            console.error('Failed to send message:', err);
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

    const formatTime = (date) => {
        const now = new Date();
        const msgDate = new Date(date);
        const diffMs = now - msgDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return msgDate.toLocaleDateString();
    };

    const formatMessageTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        online: members.filter(m => m.status === 'online').length,
        busy: members.filter(m => m.status === 'busy').length,
        offline: members.filter(m => m.status === 'offline').length
    };

    // Get unread count for a member
    const getUnreadCount = (memberId) => {
        const conv = conversations.find(c => c._id.toString() === memberId.toString());
        return conv?.unreadCount || 0;
    };

    // Get last message for a member
    const getLastMessage = (memberId) => {
        const conv = conversations.find(c => c._id.toString() === memberId.toString());
        return conv?.lastMessage || null;
    };

    if (loading) {
        return (
            <Layout title="Communication">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3E2723] mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading communication...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Communication">
            <div className="h-[calc(100vh-120px)]">
                {/* WhatsApp-style Chat Layout */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full overflow-hidden">
                    <div className="flex h-full">
                        {/* Left Panel - Contacts List */}
                        <div className={`w-full md:w-96 border-r border-gray-200 flex flex-col ${activeView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
                            {/* Header */}
                            <div className="p-4 bg-gradient-to-r from-[#3E2723] to-[#3E2723] text-white">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-xl font-bold">Messages</h2>
                                    <button
                                        onClick={fetchData}
                                        disabled={refreshing}
                                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#D7CCC8] w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search contacts..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-[#D7CCC8] focus:outline-none focus:bg-white/30"
                                    />
                                </div>
                            </div>

                            {/* Status Filter Tabs */}
                            <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-200">
                                {[
                                    { key: 'all', label: 'All', count: members.length },
                                    { key: 'online', label: 'Online', count: statusCounts.online }
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setStatusFilter(tab.key)}
                                        className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === tab.key
                                                ? 'bg-[#EFEBE9] text-[#3E2723]'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </div>

                            {/* Contacts List */}
                            <div className="flex-1 overflow-y-auto">
                                {filteredMembers.map((member) => {
                                    const lastMsg = getLastMessage(member._id);
                                    const unread = getUnreadCount(member._id);

                                    return (
                                        <div
                                            key={member._id}
                                            onClick={() => openChat(member)}
                                            className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${selectedMember?._id === member._id ? 'bg-[#FAF7F2]' : ''
                                                }`}
                                        >
                                            {/* Avatar */}
                                            <div className="relative flex-shrink-0">
                                                <div className="w-12 h-12 bg-gradient-to-br from-[#3E2723] to-[#3E2723] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {member.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-gray-900 truncate">{member.name || 'Unknown'}</p>
                                                    {lastMsg && (
                                                        <span className="text-xs text-gray-500">
                                                            {formatTime(lastMsg.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {lastMsg ? lastMsg.content : (member.email || 'No email')}
                                                    </p>
                                                    {unread > 0 && (
                                                        <span className="ml-2 px-2 py-0.5 bg-[#3E2723] text-white text-xs font-bold rounded-full">
                                                            {unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredMembers.length === 0 && (
                                    <div className="text-center py-12">
                                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600">No contacts found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel - Chat Area */}
                        <div className={`flex-1 flex flex-col ${activeView === 'contacts' ? 'hidden md:flex' : 'flex'}`}>
                            {selectedMember ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
                                        <button
                                            onClick={closeChat}
                                            className="md:hidden p-2 hover:bg-gray-200 rounded-full transition-colors"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                                        </button>
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-gradient-to-br from-[#3E2723] to-[#3E2723] rounded-full flex items-center justify-center text-white font-bold">
                                                {selectedMember.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <span className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(selectedMember.status)} rounded-full border-2 border-white`}></span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{selectedMember.name || 'Unknown'}</p>
                                            <p className="text-sm text-gray-600 capitalize">{selectedMember.status || 'offline'}</p>
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <div className="flex-1 overflow-y-auto p-4 bg-[#e5ded8]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                                        {loadingMessages ? (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E2723]"></div>
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                                                <p>No messages yet</p>
                                                <p className="text-sm">Start a conversation with {selectedMember.name || 'this user'}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {messages.map((msg) => {
                                                    const isSent = msg.sender._id === user._id;
                                                    return (
                                                        <div
                                                            key={msg._id}
                                                            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div
                                                                className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${isSent
                                                                        ? 'bg-[#dcf8c6] rounded-tr-sm'
                                                                        : 'bg-white rounded-tl-sm'
                                                                    }`}
                                                            >
                                                                <p className="text-gray-800 break-words">{msg.content}</p>
                                                                <div className={`flex items-center gap-1 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                                                                    <span className="text-xs text-gray-500">
                                                                        {formatMessageTime(msg.createdAt)}
                                                                    </span>
                                                                    {isSent && (
                                                                        msg.read
                                                                            ? <CheckCheck className="w-4 h-4 text-blue-500" />
                                                                            : <Check className="w-4 h-4 text-gray-400" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <form onSubmit={sendMessage} className="p-4 bg-gray-50 border-t border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                value={messageText}
                                                onChange={(e) => setMessageText(e.target.value)}
                                                placeholder="Type a message..."
                                                className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#3E2723] focus:border-transparent"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!messageText.trim() || sendingMessage}
                                                className="p-3 bg-gradient-to-r from-[#3E2723] to-[#3E2723] text-white rounded-full hover:from-[#3E2723] hover:to-[#3E2723] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {sendingMessage ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <Send className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                /* Empty State */
                                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
                                    <div className="w-24 h-24 bg-gradient-to-br from-[#EFEBE9] to-[#D7CCC8] rounded-full flex items-center justify-center mb-6">
                                        <MessageCircle className="w-12 h-12 text-[#3E2723]" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Team Chat</h3>
                                    <p className="text-gray-600 text-center max-w-md">
                                        Select a team member from the list to start chatting.
                                        <br />
                                        Stay connected with your team!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Communication;
