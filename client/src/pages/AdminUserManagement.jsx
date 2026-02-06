import { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, Edit2, Trash2, Lock, Power, Search, X, Mail, User, KeyRound, Briefcase, Phone, Award, Target, Eye, Activity, Clock, CheckCircle, AlertCircle, TrendingUp, MoreVertical } from 'lucide-react';
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
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [forcePasswordChange, setForcePasswordChange] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);
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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
        setForcePasswordChange(false);
        setShowModal(true);
    };

    const handleViewDetails = async (user) => {
        setSelectedUser(user);
        setShowDetailsModal(true);
        setLoadingDetails(true);
        try {
            const response = await adminUsersAPI.getDetails(user._id);
            setUserDetails(response.data.data);
        } catch (error) {
            console.error('Error fetching user details:', error);
            alert('Failed to load user details');
        } finally {
            setLoadingDetails(false);
        }
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
                await adminUsersAPI.resetPassword(selectedUser._id, formData.password, forcePasswordChange);
                alert('✅ Password reset successfully!');
            }

            setShowModal(false);
            fetchUsers();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('❌ ' + (error.response?.data?.message || 'Operation failed'));
        }
    };


    const handleDeleteUser = async (userId) => {
        const deleteType = window.confirm('⚠️ Choose delete type:\n\nOK = Soft Delete (can be restored)\nCancel = Abort');
        if (deleteType === null) return;

        const confirmDelete = window.confirm(
            deleteType
                ? '⚠️ Soft delete this user? User will be deactivated but data will be preserved.'
                : '⚠️ PERMANENTLY delete this user? This CANNOT be undone!'
        );

        if (confirmDelete) {
            try {
                await adminUsersAPI.delete(userId, !deleteType);
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage team leads and team members</p>
                        </div>
                        <button
                            onClick={handleCreateUser}
                            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base"
                        >
                            <UserPlus className="w-5 h-5" />
                            Add New User
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-200 hover:shadow-lg transition-all">
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
                                     <p className="text-sm font-semibold text-gray-600">Total Users</p>
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
                    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-200">
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
                                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                                        <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Team</th>
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
                                            <td className="hidden sm:table-cell px-6 py-4">
                                                <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-lg ${user.isActive
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-red-100 text-red-700 border border-red-200'
                                                    }`}>
                                                     {user.isActive ? '● Active' : '○ Active'}
                                                </span>
                                            </td>
                                            <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-600 font-medium">
                                                {user.teamId?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end relative">
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Actions"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {openMenuId === user._id && (
                                                        <div
                                                            ref={menuRef}
                                                            className="absolute right-0 top-10 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 py-2"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    handleViewDetails(user);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4 text-blue-600" />
                                                                <span className="font-medium">View Details</span>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    handleEditUser(user);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-orange-50 flex items-center gap-3 transition-colors"
                                                            >
                                                                <Edit2 className="w-4 h-4 text-orange-600" />
                                                                <span className="font-medium">Edit User</span>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    handleResetPassword(user);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                                                            >
                                                                <Lock className="w-4 h-4 text-gray-600" />
                                                                <span className="font-medium">Reset Password</span>
                                                            </button>

                                                            <div className="border-t border-gray-200 my-1"></div>


                                                            <div className="border-t border-gray-200 my-1"></div>

                                                            <button
                                                                onClick={() => {
                                                                    handleDeleteUser(user._id);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                <span className="font-medium">Delete User</span>
                                                            </button>
                                                        </div>
                                                    )}
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
                                    {modalMode === 'reset' && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="forceChange"
                                                checked={forcePasswordChange}
                                                onChange={(e) => setForcePasswordChange(e.target.checked)}
                                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                            />
                                            <label htmlFor="forceChange" className="text-sm text-gray-700 font-medium">
                                                Force password change on next login
                                            </label>
                                        </div>
                                    )}
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

            {/* User Details Modal */}
            {showDetailsModal && selectedUser && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm z-[9999]"
                    onClick={(e) => e.target === e.currentTarget && setShowDetailsModal(false)}
                >
                    <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Eye className="w-6 h-6" /> User Details
                                </h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {loadingDetails ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600"></div>
                                </div>
                            ) : userDetails ? (
                                <div className="space-y-6">
                                    {/* User Info Card */}
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                                        <div className="flex items-start gap-6">
                                            <div className="flex-shrink-0 h-20 w-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                                                {userDetails.user.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-2xl font-bold text-gray-900">{userDetails.user.name}</h4>
                                                <p className="text-gray-600 flex items-center gap-2 mt-1">
                                                    <Mail className="w-4 h-4" />
                                                    {userDetails.user.email}
                                                </p>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-lg ${getRoleBadgeColor(userDetails.user.role)}`}>
                                                        {getRoleLabel(userDetails.user.role)}
                                                    </span>
                                                    <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-lg ${userDetails.user.isActive
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : 'bg-red-100 text-red-700 border border-red-200'
                                                        }`}>
                                                         {userDetails.user.isActive ? '● Active' : '○ Active'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-blue-100 rounded-lg">
                                                    <CheckCircle className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 font-medium">Total Tasks</p>
                                                    <p className="text-2xl font-bold text-gray-900">{userDetails.taskStats.total}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-green-100 rounded-lg">
                                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 font-medium">Completed</p>
                                                    <p className="text-2xl font-bold text-green-600">{userDetails.taskStats.completed}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-orange-100 rounded-lg">
                                                    <Activity className="w-6 h-6 text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 font-medium">In Progress</p>
                                                    <p className="text-2xl font-bold text-orange-600">{userDetails.taskStats.inProgress}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-red-100 rounded-lg">
                                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 font-medium">Overdue</p>
                                                    <p className="text-2xl font-bold text-red-600">{userDetails.taskStats.overdue}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                            <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <User className="w-5 h-5 text-orange-600" />
                                                Contact Information
                                            </h5>
                                            <div className="space-y-2 text-sm">
                                                {userDetails.user.phone && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Phone className="w-4 h-4 text-gray-500" />
                                                        <span>{userDetails.user.phone}</span>
                                                    </div>
                                                )}
                                                {userDetails.user.designation && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Briefcase className="w-4 h-4 text-gray-500" />
                                                        <span>{userDetails.user.designation}</span>
                                                    </div>
                                                )}
                                                {userDetails.user.coreField && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Target className="w-4 h-4 text-gray-500" />
                                                        <span>{userDetails.user.coreField}</span>
                                                    </div>
                                                )}
                                                {userDetails.user.teamId && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Users className="w-4 h-4 text-gray-500" />
                                                        <span>Team: {userDetails.user.teamId.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                            <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-orange-600" />
                                                Activity Level
                                            </h5>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium text-gray-700">Activity Level</span>
                                                        <span className={`text-sm font-bold ${userDetails.activityLevel === 'Very High' ? 'text-green-600' :
                                                                userDetails.activityLevel === 'High' ? 'text-blue-600' :
                                                                    userDetails.activityLevel === 'Medium' ? 'text-orange-600' :
                                                                        'text-gray-600'
                                                            }`}>
                                                            {userDetails.activityLevel}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${userDetails.activityLevel === 'Very High' ? 'bg-green-600 w-full' :
                                                                    userDetails.activityLevel === 'High' ? 'bg-blue-600 w-3/4' :
                                                                        userDetails.activityLevel === 'Medium' ? 'bg-orange-600 w-1/2' :
                                                                            'bg-gray-600 w-1/4'
                                                                }`}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <Clock className="w-4 h-4 inline mr-2" />
                                                    {userDetails.recentActivityCount} activities in last 7 days
                                                </div>
                                                {userDetails.user.lastLogin && (
                                                    <div className="text-sm text-gray-600">
                                                        <Clock className="w-4 h-4 inline mr-2" />
                                                        Last login: {new Date(userDetails.user.lastLogin).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Tasks */}
                                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                        <h5 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-orange-600" />
                                            Recent Tasks ({userDetails.tasks.length})
                                        </h5>
                                        {userDetails.tasks.length > 0 ? (
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {userDetails.tasks.map((task) => (
                                                    <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Due: {new Date(task.deadline).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">No tasks assigned yet</p>
                                        )}
                                    </div>

                                    {/* Recent Activities */}
                                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                        <h5 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-orange-600" />
                                            Recent Activity ({userDetails.activities.length})
                                        </h5>
                                        {userDetails.activities.length > 0 ? (
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {userDetails.activities.slice(0, 10).map((activity) => (
                                                    <div key={activity._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-900">{activity.details}</p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {new Date(activity.createdAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">No recent activity</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">Failed to load user details</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminUserManagement;