import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
    updateStatus: (status) => api.put('/auth/status', { status })
};

// Users API
export const usersAPI = {
    getAll: (params) => api.get('/users', { params }),
    getOne: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    getStatusSummary: () => api.get('/users/status-summary')
};

// Teams API
export const teamsAPI = {
    getAll: () => api.get('/teams'),
    getOne: (id) => api.get(`/teams/${id}`),
    getMyTeam: () => api.get('/teams/my-team'),
    getLedTeams: () => api.get('/teams/my-led-teams'),
    create: (data) => api.post('/teams', data),
    update: (id, data) => api.put(`/teams/${id}`, data),
    addMember: (teamId, userId) => api.post(`/teams/${teamId}/members`, { userId }),
    removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`)
};

// Tasks API
export const tasksAPI = {
    getAll: (params) => api.get('/tasks', { params }),
    getOne: (id) => api.get(`/tasks/${id}`),
    getMyTasks: () => api.get('/tasks/my-tasks'),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    addComment: (id, content) => api.post(`/tasks/${id}/comments`, { content }),
    getStats: () => api.get('/tasks/stats'),
    addSubtask: (taskId, data) => api.post(`/tasks/${taskId}/subtasks`, data),
    updateSubtask: (taskId, subtaskId, data) => api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, data),
    deleteSubtask: (taskId, subtaskId) => api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),
    uploadAttachment: (taskId, data) => api.post(`/tasks/${taskId}/attachments`, data),
    deleteAttachment: (taskId, attachmentId) => api.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
    submitEODReport: (taskId, subtaskId, data) => api.post(`/tasks/${taskId}/subtasks/${subtaskId}/eod-report`, data)
};

// Notifications API
export const notificationsAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    createReminder: (data) => api.post('/notifications/reminder', data),
    delete: (id) => api.delete(`/notifications/${id}`),
    getUnreadCount: () => api.get('/notifications/unread-count')
};

// Calls API
export const callsAPI = {
    getHistory: (params) => api.get('/calls', { params }),
    initiate: (data) => api.post('/calls', data),
    update: (id, data) => api.put(`/calls/${id}`, data),
    end: (id) => api.put(`/calls/${id}/end`),
    checkAvailability: (userId) => api.get(`/calls/availability/${userId}`)
};

// Activities API
export const activitiesAPI = {
    getAll: (params) => api.get('/activities', { params }),
    getForTask: (taskId) => api.get(`/activities/task/${taskId}`),
    getForUser: (userId) => api.get(`/activities/user/${userId}`)
};

// Messages API
export const messagesAPI = {
    getConversations: () => api.get('/messages/conversations'),
    getMessages: (userId, params) => api.get(`/messages/${userId}`, { params }),
    sendMessage: (data) => api.post('/messages', data),
    markAsRead: (id) => api.put(`/messages/${id}/read`),
    getUnreadCount: () => api.get('/messages/unread-count')
};

// Reports API
export const reportsAPI = {
    getSummary: () => api.get('/reports/summary'),
    getCompletion: (period) => api.get('/reports/completion', { params: { period } }),
    getPerformance: (userId) => api.get(`/reports/performance/${userId}`),
    getTeamPerformance: () => api.get('/reports/team-performance'),
    getOverdueTrends: () => api.get('/reports/overdue-trends'),
    export: (type) => api.get('/reports/export', { params: { type } })
};

// Settings API
export const settingsAPI = {
    getSettings: () => api.get('/settings'),
    updateProfile: (data) => api.put('/settings/profile', data),
    changePassword: (data) => api.put('/settings/password', data),
    updateNotifications: (data) => api.put('/settings/notifications', data),
    updatePreferences: (data) => api.put('/settings/preferences', data),
    updateAvailability: (data) => api.put('/settings/availability', data),
    updateCallSettings: (data) => api.put('/settings/call-settings', data),
    updateWorkPreferences: (data) => api.put('/settings/work-preferences', data),
    updateSystemSettings: (data) => api.put('/settings/system', data),
    updateAuditSettings: (data) => api.put('/settings/audit', data),
    updateAccessSettings: (data) => api.put('/settings/access', data)
};

// Leads API
export const leadsAPI = {
    getAll: (params) => api.get('/leads', { params }),
    getOne: (id) => api.get(`/leads/${id}`),
    create: (data) => api.post('/leads', data),
    update: (id, data) => api.put(`/leads/${id}`, data),
    delete: (id) => api.delete(`/leads/${id}`),
    assign: (id, data) => api.put(`/leads/${id}/assign`, data),
    convertToProject: (id) => api.post(`/leads/${id}/convert`),
    escalate: (id, reason) => api.post(`/leads/${id}/escalate`, { reason }),
    previewLeads: (formData) => api.post('/leads/preview', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),
    importLeads: (leads) => api.post('/leads/import', { leads }),
    getStats: (params) => api.get('/leads/stats', { params }),
    getActivities: () => api.get('/leads/activities'),
    addNote: (id, content, type) => api.post(`/leads/${id}/notes`, { content, type })
};

// Follow-ups API
export const followUpsAPI = {
    getAll: (params) => api.get('/follow-ups', { params }),
    create: (data) => api.post('/follow-ups', data),
    update: (id, data) => api.put(`/follow-ups/${id}`, data),
    complete: (id, notes) => api.put(`/follow-ups/${id}/complete`, { notes }),
    reschedule: (id, newDate, notes) => api.put(`/follow-ups/${id}/reschedule`, { newDate, notes }),
    cancel: (id) => api.delete(`/follow-ups/${id}`),
    getOverdue: () => api.get('/follow-ups/status/overdue'),
    getUpcoming: () => api.get('/follow-ups/status/upcoming')
};

// Analytics API
export const analyticsAPI = {
    getLeadInflow: (range) => api.get('/analytics/leads/inflow', { params: { range } }),
    getSourceDistribution: () => api.get('/analytics/leads/sources'),
    getConversionMetrics: () => api.get('/analytics/leads/conversion'),
    getTeamPerformance: () => api.get('/analytics/performance/team')
};

export default api;
