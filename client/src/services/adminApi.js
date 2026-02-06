import api from './api';

// Admin Analytics API
export const adminAnalyticsAPI = {
    getTeamPerformance: (params) => api.get('/admin/analytics/team-performance', { params }),
    getBestTeams: (params) => api.get('/admin/analytics/best-teams', { params }),
    getTeamLeadEffectiveness: (leadId, params) => api.get(`/admin/analytics/team-lead-effectiveness/${leadId}`, { params }),
    getDashboardStats: (params) => api.get('/admin/analytics/dashboard-stats', { params })
};

// Admin User Management API
export const adminUsersAPI = {
    getAll: () => api.get('/admin/users'),
    getDetails: (id) => api.get(`/admin/users/${id}/details`),
    create: (data) => api.post('/admin/users', data),
    update: (id, data) => api.put(`/admin/users/${id}`, data),
    delete: (id, permanent = false) => api.delete(`/admin/users/${id}${permanent ? '?permanent=true' : ''}`),
    resetPassword: (id, newPassword, forceChange = false) => api.put(`/admin/users/${id}/reset-password`, { newPassword, forceChange })
};

// Admin Team Management API
export const adminTeamsAPI = {
    getAll: () => api.get('/admin/teams'),
    getDetails: (id) => api.get(`/admin/teams/${id}/details`),
    create: (data) => api.post('/admin/teams', data),
    update: (id, data) => api.put(`/admin/teams/${id}`, data),
    delete: (id) => api.delete(`/admin/teams/${id}`),
    assignMembers: (teamId, memberIds) => api.put(`/admin/teams/${teamId}/assign-members`, { memberIds }),
    removeMember: (teamId, memberId) => api.put(`/admin/teams/${teamId}/remove-member`, { memberId }),
    getPerformance: (teamId) => api.get(`/admin/teams/${teamId}/performance`)
};

// Admin Task Management API
export const adminTasksAPI = {
    getAll: () => api.get('/admin/tasks'),
    assignToTeamLead: (data) => api.post('/admin/assign-task', data),
    getTeamLeads: () => api.get('/admin/team-leads'),
    updateTask: (id, data) => api.put(`/admin/tasks/${id}`, data),
    deleteTask: (id) => api.delete(`/admin/tasks/${id}`),
    uploadAttachment: (taskId, data) => api.post(`/admin/tasks/${taskId}/attachments`, data),
    deleteAttachment: (taskId, attachmentId) => api.delete(`/admin/tasks/${taskId}/attachments/${attachmentId}`)
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
