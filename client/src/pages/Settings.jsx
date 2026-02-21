import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../services/api';
import Layout from '../components/Layout';
import { 
    User, Lock, Bell, Globe, Save, Eye, EyeOff, CheckCircle 
} from 'lucide-react';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const [profileData, setProfileData] = useState({ name: '', phone: '' });
    const [passwordData, setPasswordData] = useState({ 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
    });
    const [showPasswords, setShowPasswords] = useState({ 
        current: false, 
        new: false, 
        confirm: false 
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name || '', phone: user.phone || '' });
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            const response = await settingsAPI.getSettings();
            setSettings(response.data.data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await settingsAPI.updateProfile(profileData);
            showMessage('success', 'Profile updated successfully!');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showMessage('error', 'New passwords do not match');
            return;
        }
        
        if (passwordData.newPassword.length < 6) {
            showMessage('error', 'Password must be at least 6 characters');
            return;
        }
        
        setSaving(true);
        try {
            await settingsAPI.changePassword(passwordData);
            showMessage('success', 'Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const handleNotificationUpdate = async (field, value) => {
        try {
            const updated = { ...settings.notifications, [field]: value };
            await settingsAPI.updateNotifications(updated);
            setSettings({ ...settings, notifications: updated });
            showMessage('success', 'Notification settings updated!');
        } catch (error) {
            showMessage('error', 'Failed to update notification settings');
        }
    };

    const handlePreferenceUpdate = async (field, value) => {
        try {
            const updated = { ...settings.preferences, [field]: value };
            await settingsAPI.updatePreferences(updated);
            setSettings({ ...settings, preferences: updated });
            
            // Apply theme immediately if theme is changed
            if (field === 'theme') {
                applyTheme(value);
                localStorage.setItem('theme', value);
            }
            
            // Store other preferences in localStorage for quick access
            if (field === 'language') {
                localStorage.setItem('language', value);
            }
            if (field === 'dateFormat') {
                localStorage.setItem('dateFormat', value);
            }
            if (field === 'timeFormat') {
                localStorage.setItem('timeFormat', value);
            }
            
            showMessage('success', 'Preferences updated successfully!');
        } catch (error) {
            console.error('Preference update error:', error);
            showMessage('error', 'Failed to update preferences');
        }
    };

    const applyTheme = (theme) => {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'light') {
            root.classList.remove('dark');
        } else if (theme === 'auto') {
            // Auto theme based on system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    };

    // Apply theme on component mount
    useEffect(() => {
        if (settings?.preferences?.theme) {
            applyTheme(settings.preferences.theme);
        }
    }, [settings]);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User, roles: ['admin', 'team_lead', 'team_member'] },
        { id: 'security', label: 'Security', icon: Lock, roles: ['admin', 'team_lead', 'team_member'] },
        { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'team_lead', 'team_member'] }
    ];

    const visibleTabs = tabs.filter(tab => tab.roles.includes(user?.role));

    if (loading) {
        return (
            <Layout title="Settings">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3E2723]"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Settings">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${
                        message.type === 'success' 
                            ? 'bg-green-50 border border-green-200 text-green-700' 
                            : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                        {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
                            {visibleTabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-[#3E2723]/10 text-[#3E2723] font-semibold'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h2>
                                <form onSubmit={handleProfileUpdate} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723]/40 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3E2723] to-[#5D4037] text-white rounded-xl hover:from-[#2E1B17] hover:to-[#3E2723] transition-all font-semibold disabled:opacity-50"
                                    >
                                        <Save className="w-5 h-5" />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Password & Security</h2>
                                <form onSubmit={handlePasswordChange} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.current ? 'text' : 'password'}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.new ? 'text' : 'password'}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent"
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3E2723] to-[#5D4037] text-white rounded-xl hover:from-[#2E1B17] hover:to-[#3E2723] transition-all font-semibold disabled:opacity-50"
                                    >
                                        <Lock className="w-5 h-5" />
                                        {saving ? 'Changing...' : 'Change Password'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'notifications' && settings && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Settings</h2>
                                <div className="space-y-4">
                                    {[
                                        { key: 'taskAssignment', label: 'Task Assignment Notifications', desc: 'Get notified when tasks are assigned to you' },
                                        { key: 'deadlineReminders', label: 'Deadline Reminders', desc: 'Receive reminders before task deadlines' },
                                        { key: 'callNotifications', label: 'Call Notifications', desc: 'Get notified about incoming calls' },
                                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                                        { key: 'inAppNotifications', label: 'In-App Notifications', desc: 'Show notifications within the app' }
                                    ].map(item => (
                                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-gray-900">{item.label}</p>
                                                <p className="text-sm text-gray-600">{item.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.notifications[item.key]}
                                                    onChange={(e) => handleNotificationUpdate(item.key, e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#3E2723]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3E2723]"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
