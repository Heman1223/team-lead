import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { usersAPI, teamsAPI } from '../services/api';
import './TeamManagement.css';

const TeamManagement = () => {
    const { isTeamLead, user } = useAuth();
    const [searchParams] = useSearchParams();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMember, setEditMember] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        designation: '',
        phone: '',
        role: 'team_member'
    });
    const [error, setError] = useState('');
    const [filter, setFilter] = useState(searchParams.get('status') || 'all');

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const response = await usersAPI.getAll();
            setMembers(response.data.data);
        } catch (err) {
            console.error('Failed to fetch members:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (editMember) {
                await usersAPI.update(editMember._id, formData);
            } else {
                await usersAPI.create(formData);
            }
            setShowModal(false);
            setEditMember(null);
            setFormData({ name: '', email: '', password: '', designation: '', phone: '', role: 'team_member' });
            fetchMembers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save member');
        }
    };

    const handleEdit = (member) => {
        setEditMember(member);
        setFormData({
            name: member.name,
            email: member.email,
            password: '',
            designation: member.designation || '',
            phone: member.phone || '',
            role: member.role
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            await usersAPI.delete(id);
            fetchMembers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove member');
        }
    };

    const filteredMembers = members.filter(m =>
        filter === 'all' || m.status === filter
    );

    const getStatusBadge = (status) => {
        const badges = {
            online: 'badge-success',
            busy: 'badge-warning',
            offline: 'badge-neutral'
        };
        return badges[status] || 'badge-neutral';
    };

    return (
        <Layout title="Team Management">
            <div className="team-page">
                {/* Header Actions */}
                <div className="page-header">
                    <div className="filter-tabs">
                        {['all', 'online', 'busy', 'offline'].map(status => (
                            <button
                                key={status}
                                className={`filter-tab ${filter === status ? 'active' : ''}`}
                                onClick={() => setFilter(status)}
                            >
                                {status === 'all' ? 'All Members' : status.charAt(0).toUpperCase() + status.slice(1)}
                                <span className="tab-count">
                                    {status === 'all' ? members.length : members.filter(m => m.status === status).length}
                                </span>
                            </button>
                        ))}
                    </div>
                    {isTeamLead && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Member
                        </button>
                    )}
                </div>

                {/* Members Grid */}
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <h3>No team members found</h3>
                        <p>Add members to your team to get started.</p>
                    </div>
                ) : (
                    <div className="members-grid">
                        {filteredMembers.map(member => (
                            <div key={member._id} className="member-card">
                                <div className="member-header">
                                    <div className="member-avatar">
                                        {member.avatar ? (
                                            <img src={member.avatar} alt={member.name} />
                                        ) : (
                                            member.name.charAt(0).toUpperCase()
                                        )}
                                        <span className={`status-indicator ${member.status}`} />
                                    </div>
                                    {isTeamLead && member._id !== user._id && (
                                        <div className="member-actions">
                                            <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(member)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(member._id)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="member-info">
                                    <h4 className="member-name">{member.name}</h4>
                                    <span className="member-designation">{member.designation || 'Team Member'}</span>
                                    <span className="member-email">{member.email}</span>
                                </div>
                                <div className="member-footer">
                                    <span className={`badge ${getStatusBadge(member.status)}`}>
                                        <span className={`status-dot ${member.status}`} />
                                        {member.status}
                                    </span>
                                    <span className="badge badge-primary">{member.role === 'team_lead' ? 'Lead' : 'Member'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => { setShowModal(false); setEditMember(null); }}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editMember ? 'Edit Member' : 'Add Team Member'}</h3>
                                <button className="btn btn-ghost btn-icon" onClick={() => { setShowModal(false); setEditMember(null); }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="error-message">{error}</div>}

                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {!editMember && (
                                        <div className="form-group">
                                            <label>Password</label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                required={!editMember}
                                                placeholder="Minimum 6 characters"
                                            />
                                        </div>
                                    )}

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Designation</label>
                                            <input
                                                type="text"
                                                value={formData.designation}
                                                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                                placeholder="e.g., Developer"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone</label>
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="team_member">Team Member</option>
                                            <option value="team_lead">Team Lead</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditMember(null); }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editMember ? 'Save Changes' : 'Add Member'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TeamManagement;
