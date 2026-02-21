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
        department: '',
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
            department: '',
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
            department: user.department || '',
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
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.designation?.toLowerCase().includes(searchLower) ||
            user.department?.toLowerCase().includes(searchLower) ||
            user.coreField?.toLowerCase().includes(searchLower);

        let matchesFilter = true;
        if (filterRole !== 'all') {
            if (['admin', 'team_lead', 'team_member'].includes(filterRole)) {
                matchesFilter = user.role === filterRole;
            } else if (filterRole === 'intern') {
                matchesFilter = user.designation?.toLowerCase().includes('intern') || 
                               user.coreField?.toLowerCase().includes('intern');
            } else if (filterRole === 'web_dev') {
                matchesFilter = user.department?.toLowerCase().includes('web') || 
                               user.coreField?.toLowerCase().includes('web');
            }
        }

        return matchesSearch && matchesFilter;
    });

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-[#D7CCC8]/30 text-[#3E2723] border border-[#D7CCC8]/50';
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
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3E2723] mx-auto"></div>
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full sm:w-72 lg:w-96">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] transition-all shadow-sm"
                                />
                            </div>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] transition-all outline-none min-w-[140px] shadow-sm"
                            >
                                <option value="all">All Users</option>
                                <option value="admin">Administrators</option>
                                <option value="team_lead">Team Leads</option>
                                <option value="team_member">Team Members</option>
                                <option value="intern">Interns</option>
                                <option value="web_dev">Web Developers</option>
                            </select>
                        </div>
                        <button
                            onClick={handleCreateUser}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#3E2723] text-white rounded-xl hover:bg-[#5D4037] transition-all shadow-md hover:shadow-lg font-bold text-sm whitespace-nowrap"
                        >
                            <UserPlus className="w-4 h-4" />
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
                                <div className="p-4 bg-[#D7CCC8]/30 rounded-xl">
                                    <Users className="w-8 h-8 text-[#3E2723]" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600">Team Leads</p>
                                    <p className="text-3xl font-bold text-[#3E2723] mt-2">
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
                                    <p className="text-3xl font-bold text-[#3E2723] mt-2">
                                        {users.filter(u => u.isActive).length}
                                    </p>
                                </div>
                                <div className="p-4 bg-[#D7CCC8]/30 rounded-xl">
                                    <Power className="w-8 h-8 text-[#3E2723]" />
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Users Table */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-tight">User</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-tight">Role</th>
                                        <th className="hidden xl:table-cell px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-tight">Designation</th>
                                        <th className="hidden xl:table-cell px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-tight">Department</th>
                                        <th className="hidden lg:table-cell px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-tight">Contact</th>
                                        <th className="hidden md:table-cell px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-tight">Status</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-tight">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-[#D7CCC8]/10 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-[#3E2723] to-[#5D4037] rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-semibold text-gray-900 truncate">{user.name}</div>
                                                        <div className="text-[10px] text-gray-400 flex items-center gap-1 truncate">
                                                            <Mail className="w-2.5 h-2.5" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold rounded-md ${getRoleBadgeColor(user.role)}`}>
                                                    {getRoleLabel(user.role)}
                                                </span>
                                            </td>
                                            <td className="hidden xl:table-cell px-4 py-3">
                                                <div className="text-xs font-medium text-gray-700 truncate">{user.designation || '-'}</div>
                                            </td>
                                            <td className="hidden xl:table-cell px-4 py-3">
                                                <div className="text-xs font-medium text-gray-700 truncate">{user.department || user.coreField || '-'}</div>
                                            </td>
                                            <td className="hidden lg:table-cell px-4 py-3">
                                                <div className="text-xs text-gray-600">
                                                    {user.phone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-2.5 h-2.5 text-gray-400" />
                                                            <span className="text-[10px]">{user.phone}</span>
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                                                        {user.teamId?.name || 'No Team'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell px-4 py-3">
                                                <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold rounded-md ${user.isActive
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-red-100 text-red-700 border border-red-200'
                                                    }`}>
                                                     {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end">
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                                                        className="p-1.5 text-gray-400 hover:text-[#3E2723] hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Actions"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
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
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#D7CCC8]/10 flex items-center gap-3 transition-colors"
                                                            >
                                                                <Edit2 className="w-4 h-4 text-[#3E2723]" />
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
                                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#3E2723] text-white rounded-xl hover:bg-[#5D4037] transition-colors font-semibold"
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
                        <div className="bg-gradient-to-r from-[#3E2723] to-[#5D4037] px-6 py-5 rounded-t-2xl">
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
                                            <User className="w-4 h-4 text-[#3E2723]" />
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent transition-all"
                                            placeholder="Enter full name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-[#3E2723]" />
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent transition-all"
                                            placeholder="user@example.com"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Award className="w-4 h-4 text-[#3E2723]" />
                                            Role <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent transition-all bg-white"
                                            required
                                        >
                                            <option value="team_lead">Team Lead</option>
                                            <option value="team_member">Team Member</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-[#3E2723]" />
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent transition-all"
                                            placeholder="+1234567890"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-[#3E2723]" />
                                                Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.designation}
                                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent transition-all text-sm"
                                                placeholder="e.g., Senior Developer"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-[#3E2723]" />
                                                Department
                                            </label>
                                            <select
                                                value={formData.department}
                                                onChange={(e) => setFormData({ ...formData, department: e.target.value, coreField: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent transition-all bg-white text-sm"
                                            >
                                                <option value="">Select Department</option>
                                                <option value="Web Development">Web Development</option>
                                                <option value="Mobile App Development">Mobile App Development</option>
                                                <option value="Graphic Design">Graphic Design</option>
                                                <option value="Digital Marketing">Digital Marketing</option>
                                                <option value="Content Writing">Content Writing</option>
                                                <option value="Social Media Management">Social Media Management</option>
                                                <option value="Sales & Business Development">Sales & Business Development</option>
                                                <option value="Customer Support">Customer Support</option>
                                                <option value="Operations & Delivery">Operations & Delivery</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            {(modalMode === 'create' || modalMode === 'reset') && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <KeyRound className="w-4 h-4 text-[#3E2723]" />
                                        {modalMode === 'reset' ? 'New Password' : 'Password'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3E2723] focus:border-transparent transition-all"
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
                                                className="w-4 h-4 text-[#3E2723] border-gray-300 rounded focus:ring-[#3E2723]"
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
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#3E2723] to-[#3E2723] text-white font-semibold rounded-xl hover:from-[#3E2723] hover:to-[#3E2723] transition-all shadow-lg hover:shadow-xl"
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
                    <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#3E2723] to-[#5D4037] px-8 py-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Eye className="w-7 h-7" /> User Profile Details
                                </h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-white hover:bg-white/20 rounded-xl p-2 transition-all"
                                >
                                    <X className="w-7 h-7" />
                                </button>
                            </div>
                        </div>

                        <div className="p-10">
                            {loadingDetails ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3E2723]"></div>
                                </div>
                            ) : userDetails ? (
                                <div className="space-y-10">
                                    {/* User Info Header */}
                                    <div className="flex items-center gap-8 pb-8 border-b border-[#D7CCC8]/30">
                                        <div className="flex-shrink-0 h-28 w-28 bg-gradient-to-br from-[#3E2723] to-[#5D4037] rounded-full flex items-center justify-center text-white font-bold text-5xl shadow-xl border-4 border-[#D7CCC8]/20">
                                            {userDetails.user.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-4xl font-black text-gray-900 tracking-tight">{userDetails.user.name}</h4>
                                            <div className="mt-2">
                                                <span className="text-[#3E2723] font-bold text-xl uppercase tracking-widest bg-[#D7CCC8]/20 px-4 py-1 rounded-full border border-[#D7CCC8]/40">
                                                    {getRoleLabel(userDetails.user.role)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-[#5D4037] uppercase tracking-[0.2em] mb-2 block opacity-60">Email Address</label>
                                            <div className="flex items-center gap-4 text-gray-800 text-lg font-bold">
                                                <div className="p-3 bg-[#D7CCC8]/30 rounded-2xl text-[#3E2723] shadow-inner">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                {userDetails.user.email}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-[#5D4037] uppercase tracking-[0.2em] mb-2 block opacity-60">Phone Number</label>
                                            <div className="flex items-center gap-4 text-gray-800 text-lg font-bold">
                                                <div className="p-3 bg-[#D7CCC8]/30 rounded-2xl text-[#3E2723] shadow-inner">
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                {userDetails.user.phone || 'Not provided'}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-[#5D4037] uppercase tracking-[0.2em] mb-2 block opacity-60">Designation</label>
                                            <div className="flex items-center gap-4 text-gray-800 text-lg font-bold">
                                                <div className="p-3 bg-[#D7CCC8]/30 rounded-2xl text-[#3E2723] shadow-inner">
                                                    <Briefcase className="w-5 h-5" />
                                                </div>
                                                {userDetails.user.designation || 'Not set'}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-[#5D4037] uppercase tracking-[0.2em] mb-2 block opacity-60">Department</label>
                                            <div className="flex items-center gap-4 text-gray-800 text-lg font-bold">
                                                <div className="p-3 bg-[#D7CCC8]/30 rounded-2xl text-[#3E2723] shadow-inner">
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                {userDetails.user.department || userDetails.user.coreField || 'Not specified'}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-[#5D4037] uppercase tracking-[0.2em] mb-2 block opacity-60">Current Team</label>
                                            <div className="flex items-center gap-4 text-gray-800 text-lg font-bold">
                                                <div className="p-3 bg-[#D7CCC8]/30 rounded-2xl text-[#3E2723] shadow-inner">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                {userDetails.user.teamId?.name || 'No Team Assigned'}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-[#5D4037] uppercase tracking-[0.2em] mb-2 block opacity-60">Account Status</label>
                                            <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl text-sm font-black border-2 shadow-sm ${
                                                userDetails.user.isActive 
                                                    ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#2E7D32]/20'
                                                    : 'bg-[#FFEBEE] text-[#B71C1C] border-[#C62828]/20'
                                            }`}>
                                                <div className={`w-3 h-3 rounded-full animate-pulse ${userDetails.user.isActive ? 'bg-[#2E7D32]' : 'bg-[#C62828]'}`}></div>
                                                {userDetails.user.isActive ? 'ACTIVE MEMBER' : 'INACTIVE'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-12 text-xl font-medium">Failed to load user details</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminUserManagement;