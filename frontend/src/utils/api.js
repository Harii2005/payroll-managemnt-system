import axios from 'axios';
import useAuthStore from '../stores/authStore';

const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getAllUsers: () => api.get('/users'),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Expenses API
export const expensesAPI = {
  getMyExpenses: () => api.get('/expenses/my'),
  getAllExpenses: () => api.get('/expenses'),
  createExpense: (data) => api.post('/expenses', data),
  updateExpenseStatus: (id, status) => api.put(`/expenses/${id}/status`, { status }),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  uploadReceipt: (id, file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return api.post(`/expenses/${id}/receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Salary Slips API
export const salarySlipsAPI = {
  getMySalarySlips: () => api.get('/salary-slips/my'),
  getAllSalarySlips: () => api.get('/salary-slips'),
  createSalarySlip: (data) => api.post('/salary-slips', data),
  downloadSalarySlip: (id) => api.get(`/salary-slips/${id}/download`, { responseType: 'blob' }),
  updateSalarySlip: (id, data) => api.put(`/salary-slips/${id}`, data),
  deleteSalarySlip: (id) => api.delete(`/salary-slips/${id}`),
};

// Notifications API
export const notificationsAPI = {
  getMyNotifications: () => api.get('/notifications/my'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
};

export default api;
