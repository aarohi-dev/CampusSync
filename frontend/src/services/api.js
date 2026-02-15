import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle response errors
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

// Auth API calls
export const authAPI = {
  register: (name, email, password, confirmPassword) =>
    api.post('/auth/register', { name, email, password, confirmPassword }),
  
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  getProfile: () =>
    api.get('/auth/profile'),
};

// Resources API calls
export const resourcesAPI = {
  getAll: (page = 1, type = null) => {
    let url = `/resources?page=${page}`;
    if (type) url += `&type=${type}`;
    return api.get(url);
  },
  
  getById: (id) =>
    api.get(`/resources/${id}`),
  
  getByType: (type) =>
    api.get(`/resources/type/${type}`),
  
  create: (name, type, location, capacity) =>
    api.post('/resources', { name, type, location, capacity }),
  
  update: (id, data) =>
    api.put(`/resources/${id}`, data),
  
  delete: (id) =>
    api.delete(`/resources/${id}`),
};

// Bookings API calls
export const bookingsAPI = {
  create: (resourceId, bookingDate, startTime, endTime) =>
    api.post('/bookings', { resourceId, bookingDate, startTime, endTime }),
  
  getUserBookings: (page = 1) =>
    api.get(`/bookings/my-bookings?page=${page}`),
  
  getAllBookings: (page = 1, status = null) => {
    let url = `/bookings/admin/all?page=${page}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
  },
  
  getAvailability: (resourceId, date) =>
    api.get(`/bookings/availability?resourceId=${resourceId}&date=${date}`),
  
  approve: (id) =>
    api.put(`/bookings/${id}/approve`),
  
  reject: (id, reason) =>
    api.put(`/bookings/${id}/reject`, { reason }),
  
  cancel: (id) =>
    api.delete(`/bookings/${id}/cancel`),
};

// Admin API calls
export const adminAPI = {
  getAuditLogs: (page = 1) =>
    api.get(`/admin/logs?page=${page}`),
  
  getDashboardStats: () =>
    api.get('/admin/stats'),
  
  getAllUsers: (page = 1) =>
    api.get(`/admin/users?page=${page}`),
  
  getPendingBookings: (page = 1) =>
    api.get(`/admin/bookings/pending?page=${page}`),
  
  getSystemOverview: () =>
    api.get('/admin/overview'),
};

export default api;
