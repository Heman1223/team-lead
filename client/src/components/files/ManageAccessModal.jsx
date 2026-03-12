import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Shield, UserX, UserCheck } from 'lucide-react';
import { filesAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ManageAccessModal = ({ isOpen, onClose, file, onSuccess }) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [accessMembers, setAccessMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && file) {
            fetchUsers();
            setAccessMembers(file.access_members || []);
        }
    }, [isOpen, file]);

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.getAll();
            setUsers(response.data.data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        }
    };

    const handleGrantAccess = async (userId) => {
        try {
            setLoading(true);
            setError('');
            await filesAPI.grantAccess(file._id, { user_id: userId });

            // Update local state instantly
            const targetUser = users.find(u => u._id === userId);
            if (targetUser) {
                setAccessMembers([...accessMembers, {
                    user_id: userId,
                    user_name: targetUser.name,
                    user_email: targetUser.email,
                    permission_type: 'view'
                }]);
            }

            // Trigger background refresh for the parent table
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Error granting access');
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeAccess = async (userId) => {
        try {
            setLoading(true);
            setError('');
            await filesAPI.revokeAccess(file._id, userId);

            // Update local state instantly
            setAccessMembers(accessMembers.filter(m => m.user_id !== userId));

            // Trigger background refresh for the parent table
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Error revoking access');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !file) return null;

    // Helper to check if a user currently has access
    const hasAccess = (userId) => {
        return accessMembers?.some(member => member.user_id === userId);
    };

    // Helper to determine if current user CAN revoke this target user
    const canRevokeUser = (targetUser) => {
        if (currentUser.role === 'admin') return true; // Admins can revoke anyone (except other admins, handled below)
        if (targetUser.role === 'admin') return false; // No one revokes admins
        if (targetUser._id === file.uploaded_by?._id) return false; // Can't revoke uploader

        // Hierarchy enforcement
        if (currentUser.role === 'team_lead' && targetUser.role === 'team_lead') return false;
        if (currentUser.role === 'team_member' && targetUser.role === 'team_lead') return false;

        return true;
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Manage Access
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">File: {file.file_name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-sm">
                            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search users to grant or revoke access..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-3">
                        {filteredUsers.map(user => {
                            const isUploader = user._id === file.uploaded_by?._id;
                            const isCurrentUser = user._id === currentUser._id;
                            const userHasAccess = hasAccess(user._id);
                            const revokable = canRevokeUser(user);

                            return (
                                <div key={user._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                                            {user.name}
                                            {isUploader && <span className="text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-bold">UPLOADER</span>}
                                            {user.role === 'admin' && <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-bold">ADMIN</span>}
                                            {isCurrentUser && <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full font-bold">YOU</span>}
                                        </p>
                                        <p className="text-xs text-gray-500">{user.email} • {user.role.replace('_', ' ')}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {userHasAccess ? (
                                            <>
                                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                                                    <UserCheck size={14} /> Has Access
                                                </span>
                                                {revokable && !isCurrentUser && !isUploader && user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleRevokeAccess(user._id)}
                                                        disabled={loading}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Revoke Access"
                                                    >
                                                        <UserX size={16} />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleGrantAccess(user._id)}
                                                disabled={loading}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                            >
                                                Grant Access
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {filteredUsers.length === 0 && (
                            <p className="text-center text-gray-500 text-sm py-8">No users found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageAccessModal;
