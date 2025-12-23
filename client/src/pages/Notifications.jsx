import { useState, useEffect } from 'react';
import { 
    Bell, 
    CheckCircle, 
    Trash2, 
    AlertTriangle, 
    Info, 
    Search, 
    Filter,
    Send,
    X,
    Clock,
    User,
    Check
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI, teamsAPI, usersAPI, tasksAPI } from '../services/api';

const Notifications = () => {
    const { user, isTeamLead } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'sent'
    const [members, setMembers] = useState([]);
    const [tasks, setTasks] = useState([]);
    
    // UI State
    const [filter, setFilter] = useState('all'); // all, unread, important
    const [searchQuery, setSearchQuery] = useState('');
    const [showReminderModal, setShowReminderModal] = useState(false);
    
    // Form State
    const [reminderForm, setReminderForm] = useState({
        userId: '',
        taskId: '',
        title: '',
        message: '',
        priority: 'medium'
    });

    useEffect(() => {
        fetchData();
    }, [user, activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch Notifications
            const notifParams = { limit: 50 };
            if (activeTab === 'sent') {
                notifParams.filter = 'sent';
            }
            
            const notifRes = await notificationsAPI.getAll(notifParams);
            setNotifications(notifRes.data.data || []);

            // 2. Fetch Tasks (for linking reminders)
            const tasksRes = await tasksAPI.getAll();
            setTasks(tasksRes.data.data || []);
            
            // 3. Fetch Members (if not already fetched or logic requires refresh)
            if (members.length === 0) {
                 let membersList = [];
                if (isTeamLead && user?.teamId) {
                    const teamId = user.teamId._id || user.teamId;
                    const teamRes = await teamsAPI.getOne(teamId);
                    membersList = (teamRes.data.data.members || []).filter(m => m._id !== user._id);
                } else {
                    const usersRes = await usersAPI.getAll();
                    membersList = usersRes.data.data || [];
                }
                setMembers(membersList);
            }

        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => 
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Delete this notification?")) return;
        try {
            await notificationsAPI.delete(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const handleSendReminder = async (e) => {
        e.preventDefault();
        try {
            await notificationsAPI.createReminder(reminderForm);
            setShowReminderModal(false);
            setReminderForm({ userId: '', taskId: '', title: '', message: '', priority: 'medium' });
            alert('✅ Reminder sent successfully!');
            setActiveTab('sent'); // Switch to sent view to see it
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send reminder');
        }
    };

    // --- Helpers ---
    const getIcon = (type) => {
        switch (type) {
            case 'task_assigned': return <CheckCircle className="w-5 h-5" />;
            case 'deadline_reminder': return <Clock className="w-5 h-5" />;
            case 'overdue_alert': return <AlertTriangle className="w-5 h-5" />;
            case 'manual_reminder': return <Bell className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'task_assigned': return 'bg-green-100 text-green-600 border-green-200';
            case 'deadline_reminder': return 'bg-orange-100 text-orange-600 border-orange-200';
            case 'overdue_alert': return 'bg-red-100 text-red-600 border-red-200';
            case 'manual_reminder': return 'bg-blue-100 text-blue-600 border-blue-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              n.message.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;

        if (filter === 'unread') return !n.isRead;
        if (filter === 'important') return ['deadline_reminder', 'overdue_alert'].includes(n.type);
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <Layout title="Notifications">
             <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header & Controls */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Activity & Alerts</h2>
                            <p className="text-gray-500 mt-1">Stay updated with your team's progress</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && activeTab === 'inbox' && (
                                <button 
                                    onClick={handleMarkAllAsRead}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Mark all read
                                </button>
                            )}
                            {isTeamLead && (
                                <button 
                                    onClick={() => setShowReminderModal(true)}
                                    className="px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-lg shadow-orange-200 transition-all flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Send Reminder
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Tabs */}
                        <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveTab('inbox')}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    activeTab === 'inbox' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Inbox
                            </button>
                            <button
                                onClick={() => setActiveTab('sent')}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    activeTab === 'sent' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Sent
                            </button>
                        </div>

                        {/* Filters & Search */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder={activeTab === 'inbox' ? "Search inbox..." : "Search sent items..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                            </div>
                            
                            {activeTab === 'inbox' && (
                                <div className="flex p-1 bg-gray-100 rounded-xl">
                                    {['all', 'unread', 'important'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-6 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                                                filter === f 
                                                ? 'bg-white text-gray-900 shadow-sm' 
                                                : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {loading ? (
                         <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading...</p>
                         </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Bell className="w-8 h-8 text-gray-300" />
                             </div>
                             <h3 className="text-lg font-bold text-gray-900">No notifications found</h3>
                             <p className="text-gray-500">
                                {activeTab === 'inbox' ? "You're all caught up!" : "No sent messages yet."}
                             </p>
                        </div>
                    ) : (
                        filteredNotifications.map(notif => (
                            <div 
                                key={notif._id}
                                className={`group relative bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md ${
                                    !notif.isRead && activeTab === 'inbox' ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl border ${getTypeColor(notif.type)}`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h4 className={`text-base ${!notif.isRead && activeTab === 'inbox' ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-gray-600 mt-1 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                            </div>
                                            <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
                                                {new Date(notif.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 mt-3">
                                            {activeTab === 'inbox' ? (
                                                notif.senderId && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <User className="w-3.5 h-3.5" />
                                                        <span>From: <span className="font-semibold text-gray-700">{notif.senderId.name}</span></span>
                                                    </div>
                                                )
                                            ) : (
                                                notif.userId && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Send className="w-3.5 h-3.5" />
                                                        <span>To: <span className="font-semibold text-gray-700">{notif.userId.name}</span></span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notif.isRead && activeTab === 'inbox' && (
                                            <button 
                                                onClick={() => handleMarkAsRead(notif._id)}
                                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                title="Mark as read"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(notif._id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>

             {/* Reminder Modal */}
             {showReminderModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Send New Reminder</h3>
                                <p className="text-sm text-gray-500">Notify a team member about a task</p>
                            </div>
                            <button 
                                onClick={() => setShowReminderModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSendReminder} className="p-6 space-y-5 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Team Member *</label>
                                    <select
                                        required
                                        value={reminderForm.userId}
                                        onChange={e => setReminderForm({ ...reminderForm, userId: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    >
                                        <option value="">Select member</option>
                                        {members.map(m => (
                                            <option key={m._id} value={m._id}>{m.name} ({m.designation || 'Member'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Priority</label>
                                    <select
                                        value={reminderForm.priority}
                                        onChange={e => setReminderForm({ ...reminderForm, priority: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Related Task (Optional)</label>
                                <select
                                    value={reminderForm.taskId}
                                    onChange={e => setReminderForm({ ...reminderForm, taskId: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                >
                                    <option value="">Select task context...</option>
                                    {tasks.map(t => (
                                        <option key={t._id} value={t._id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Subject</label>
                                <input
                                    type="text"
                                    placeholder="Brief subject..."
                                    value={reminderForm.title}
                                    onChange={e => setReminderForm({ ...reminderForm, title: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Message *</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Write your reminder message here..."
                                    value={reminderForm.message}
                                    onChange={e => setReminderForm({ ...reminderForm, message: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowReminderModal(false)}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all transform hover:scale-[1.02]"
                                >
                                    Send Reminder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Notifications;
