import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
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
    create: (data) => api.post('/teams', data),
    update: (id, data) => api.put(`/teams/${id}`, data),
    addMember: (teamId, userId) => api.post(`/teams/${teamId}/members`, { userId }),
    removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`)
};

// Tasks API
export const tasksAPI = {
    getAll: (params) => api.get('/tasks', { params }),
    getOne: (id) => api.get(`/tasks/${id}`),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    addComment: (id, content) => api.post(`/tasks/${id}/comments`, { content }),
    getStats: () => api.get('/tasks/stats')
};

// Notifications API
export const notificationsAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    createReminder: (data) => api.post('/notifications/reminder', data),
    delete: (id) => api.delete(`/notifications/${id}`)
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

// Reports API
export const reportsAPI = {
    getSummary: () => api.get('/reports/summary'),
    getCompletion: (period) => api.get('/reports/completion', { params: { period } }),
    getPerformance: (userId) => api.get(`/reports/performance/${userId}`),
    getTeamPerformance: () => api.get('/reports/team-performance'),
    getOverdueTrends: () => api.get('/reports/overdue-trends'),
    export: (type) => api.get('/reports/export', { params: { type } })
};

export default api;
