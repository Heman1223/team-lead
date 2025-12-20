import api from './api';

// Admin Analytics API
export const adminAnalyticsAPI = {
    getTeamPerformance: () => api.get('/admin/analytics/team-performance'),
    getBestTeams: () => api.get('/admin/analytics/best-teams'),
    getTeamLeadEffectiveness: (leadId) => api.get(`/admin/analytics/team-lead-effectiveness/${leadId}`),
    getDashboardStats: () => api.get('/admin/analytics/dashboard-stats')
};

// Admin User Management API
export const adminUsersAPI = {
    getAll: () => api.get('/admin/users'),
    create: (data) => api.post('/admin/users', data),
    update: (id, data) => api.put(`/admin/users/${id}`, data),
    delete: (id) => api.delete(`/admin/users/${id}`),
    toggleActive: (id) => api.put(`/admin/users/${id}/toggle-active`),
    resetPassword: (id, newPassword) => api.put(`/admin/users/${id}/reset-password`, { newPassword })
};

// Admin Team Management API
export const adminTeamsAPI = {
    getAll: () => api.get('/admin/teams'),
    create: (data) => api.post('/admin/teams', data),
    assignMembers: (teamId, memberIds) => api.put(`/admin/teams/${teamId}/assign-members`, { memberIds })
};

// Admin Task Management API
export const adminTasksAPI = {
    getAll: () => api.get('/admin/tasks'),
    assignToTeamLead: (data) => api.post('/admin/assign-task', data),
    getTeamLeads: () => api.get('/admin/team-leads')
};

// Admin Activities API
export const adminActivitiesAPI = {
    getAll: () => api.get('/admin/activities')
};

export default {
    analytics: adminAnalyticsAPI,
    users: adminUsersAPI,
    teams: adminTeamsAPI,
    tasks: adminTasksAPI,
    activities: adminActivitiesAPI
};
