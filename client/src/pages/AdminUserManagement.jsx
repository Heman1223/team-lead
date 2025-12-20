import { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, Trash2, Lock, Power, Search, X, Mail, User, KeyRound, Briefcase, Phone, Award, Target } from 'lucide-react';
import { adminUsersAPI, adminTeamsAPI } from '../services/adminApi';
import Layout from '../components/Layout';

const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'team_member',
        phone: '',
        designation: '',
        coreField: '',
        teamId: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchTeams();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await adminUsersAPI.getAll();
            setUsers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Failed to fetch users: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await adminTeamsAPI.getAll();
            setTeams(response.data.data || []);
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const handleCreateUser = () => {
        setModalMode('create');
        setSelectedUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'team_member',
            phone: '',
            designation: '',
            coreField: '',
            teamId: ''
        });
        setShowModal(true);
    };

    const handleEditUser = (user) => {
        setModalMode('edit');
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            phone: user.phone || '',
            designation: user.designation || '',
            coreField: user.coreField || '',
            teamId: user.teamId?._id || ''
        });
        setShowModal(true);
    };

    const handleResetPassword = (user) => {
        setModalMode('reset');
        setSelectedUser(user);
        setFormData({ ...formData, password: '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (modalMode === 'create') {
                if (!formData.name || !formData.email || !formData.password) {
                    alert('Please fill in all required fields: Name, Email, and Password');
                    return;
                }
                if (formData.password.length < 6) {
                    alert('Password must be at least 6 characters');
                    return;
                }
                
                await adminUsersAPI.create(formData);
                alert('✅ User created successfully!');
                
            } else if (modalMode === 'edit') {
                const updateData = { ...formData };
                delete updateData.password;
                await adminUsersAPI.update(selectedUser._id, updateData);
                alert('✅ User updated successfully!');
                
            } else if (modalMode === 'reset') {
                if (!formData.password || formData.password.length < 6) {
                    alert('Password must be at least 6 characters');
                    return;
                }
                await adminUsersAPI.resetPassword(selectedUser._id, formData.password);
                alert('✅ Password reset successfully!');
            }
            
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('❌ ' + (error.response?.data?.message || 'Operation failed'));
        }
    };

    const handleToggleActive = async (userId) => {
        try {
            await adminUsersAPI.toggleActive(userId);
            alert('✅ User status updated!');
            fetchUsers();
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('❌ Failed to update status');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('⚠️ Delete this user? This cannot be undone.')) {
            try {
                await adminUsersAPI.delete(userId);
                alert('✅ User deleted successfully!');
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('❌ ' + (error.response?.data?.message || 'Delete failed'));
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-orange-100 text-orange-700 border border-orange-200';
            case 'team_lead': return 'bg-gray-100 text-gray-700 border border-gray-200';
            case 'team_member': return 'bg-green-100 text-green-700 border border-green-200';
            default: return 'bg-gray-100 text-gray-700 border border-gray-200';
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'admin': return 'Administrator';
            case 'team_lead': return 'Team Lead';
            case 'team_member': return 'Team Member';
            default: return role;
        }
    };

    if (loading) {
        return (
            <Layout title="User Management">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading users...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <>
        <Layout title="User Management">
            <div className="space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 mt-1">Manage team leads and team members</p>
                    </div>
                    <button
                        onClick={handleCreateUser}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                    >
                        <UserPlus className="w-5 h-5" />
                        Add New User
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Users</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
                            </div>
                            <div className="p-4 bg-orange-100 rounded-xl">
                                <Users className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Team Leads</p>
                                <p className="text-3xl font-bold text-orange-600 mt-2">
                                    {users.filter(u => u.role === 'team_lead').length}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-100 rounded-xl">
                                <Award className="w-8 h-8 text-gray-700" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Team Members</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {users.filter(u => u.role === 'team_member').length}
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl">
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Active Users</p>
                                <p className="text-3xl font-bold text-orange-600 mt-2">
                                    {users.filter(u => u.isActive).length}
                                </p>
                            </div>
                            <div className="p-4 bg-orange-100 rounded-xl">
                                <Power className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="px-6 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white font-medium"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="team_lead">Team Lead</option>
                            <option value="team_member">Team Member</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Team</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-orange-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-lg ${getRoleBadgeColor(user.role)}`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600">
                                                {user.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {user.phone}
                                                    </div>
                                                )}
                                                {user.designation && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Briefcase className="w-3 h-3" />
                                                        {user.designation}
                                                    </div>
                                                )}
                                                {user.coreField && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Target className="w-3 h-3" />
                                                        {user.coreField}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-lg ${
                                                user.isActive 
                                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                                    : 'bg-red-100 text-red-700 border border-red-200'
                                            }`}>
                                                {user.isActive ? '● Active' : '○ Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                            {user.teamId?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Reset Password"
                                                >
                                                    <Lock className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(user._id)}
                                                    className={`p-2 ${user.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'} rounded-lg transition-colors`}
                                                    title={user.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    <Power className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-16">
                            <Users className="mx-auto h-16 w-16 text-gray-300" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">No users found</h3>
                            <p className="mt-2 text-sm text-gray-500">Get started by creating a new user.</p>
                            <button
                                onClick={handleCreateUser}
                                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-semibold"
                            >
                                <UserPlus className="w-5 h-5" />
                                Add First User
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>

        {/* Modal */}
        {showModal && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm z-[9999]"
                onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
            >
                <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {modalMode === 'create' && <><UserPlus className="w-6 h-6" /> Create New User</>}
                                {modalMode === 'edit' && <><Edit2 className="w-6 h-6" /> Edit User</>}
                                {modalMode === 'reset' && <><Lock className="w-6 h-6" /> Reset Password</>}
                            </h3>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {modalMode !== 'reset' && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <User className="w-4 h-4 text-orange-600" />
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-orange-600" />
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                        placeholder="user@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Award className="w-4 h-4 text-orange-600" />
                                        Role <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                                        required
                                    >
                                        <option value="team_lead">Team Lead</option>
                                        <option value="team_member">Team Member</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-orange-600" />
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                        placeholder="+1234567890"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-orange-600" />
                                        Designation
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                        placeholder="e.g., Senior Developer"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Target className="w-4 h-4 text-orange-600" />
                                        Core Field
                                    </label>
                                    <select
                                        value={formData.coreField}
                                        onChange={(e) => setFormData({ ...formData, coreField: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                                    >
                                        <option value="">Select Core Field</option>
                                        <option value="Web Intern">Web Intern</option>
                                        <option value="Delivery Boy">Delivery Boy</option>
                                        <option value="Social Media Intern">Social Media Intern</option>
                                        <option value="Content Writer">Content Writer</option>
                                        <option value="Graphic Designer">Graphic Designer</option>
                                        <option value="Marketing Intern">Marketing Intern</option>
                                        <option value="Sales Executive">Sales Executive</option>
                                        <option value="Customer Support">Customer Support</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {(modalMode === 'create' || modalMode === 'reset') && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <KeyRound className="w-4 h-4 text-orange-600" />
                                    {modalMode === 'reset' ? 'New Password' : 'Password'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                    placeholder="Minimum 6 characters"
                                    required
                                    minLength={6}
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    {modalMode === 'create' 
                                        ? 'User will login with this password' 
                                        : 'User will need to use this new password to login'}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                            >
                                {modalMode === 'create' ? 'Create User' : modalMode === 'edit' ? 'Update User' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
};

export default AdminUserManagement;