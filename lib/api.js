import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('de_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('de_token');
      localStorage.removeItem('de_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getBySKU: (sku) => api.get(`/products/sku/${sku}`),
  create: (data) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/products/${id}`),
  generateQR: (id) => api.post(`/products/${id}/qrcode`),
  getMovements: (id, params) => api.get(`/products/${id}/movements`, { params }),
  getCategories: () => api.get('/products/categories'),
};

// ─── Stock ────────────────────────────────────────────────────────────────────
export const stockApi = {
  getMovements: (params) => api.get('/stock/movements', { params }),
  getIncoming: (params) => api.get('/stock/incoming', { params }),
  createIncoming: (data) => api.post('/stock/incoming', data),
  getOutgoing: (params) => api.get('/stock/outgoing', { params }),
  createOutgoing: (data) => api.post('/stock/outgoing', data),
  getTransfers: (params) => api.get('/stock/transfers', { params }),
  createTransfer: (data) => api.post('/stock/transfers', data),
  getDamaged: (params) => api.get('/stock/damaged', { params }),
  createDamaged: (data) => api.post('/stock/damaged', data),
  getAdjustments: (params) => api.get('/stock/adjustments', { params }),
  createAdjustment: (data) => api.post('/stock/adjustments', data),
  approveAdjustment: (id, data) => api.put(`/stock/adjustments/${id}/approve`, data),
  rejectAdjustment: (id, data) => api.put(`/stock/adjustments/${id}/reject`, data),
};

// ─── Warehouses ───────────────────────────────────────────────────────────────
export const warehousesApi = {
  getAll: () => api.get('/warehouses'),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
};

// ─── Locations ────────────────────────────────────────────────────────────────
export const locationsApi = {
  getAll: (params) => api.get('/locations', { params }),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`),
};

// ─── Suppliers & Customers ────────────────────────────────────────────────────
export const suppliersApi = {
  getAll: (params) => api.get('/parties/suppliers', { params }),
  getById: (id) => api.get(`/parties/suppliers/${id}`),
  create: (data) => api.post('/parties/suppliers', data),
  update: (id, data) => api.put(`/parties/suppliers/${id}`, data),
  delete: (id) => api.delete(`/parties/suppliers/${id}`),
};

export const customersApi = {
  getAll: (params) => api.get('/parties/customers', { params }),
  getById: (id) => api.get(`/parties/customers/${id}`),
  create: (data) => api.post('/parties/customers', data),
  update: (id, data) => api.put(`/parties/customers/${id}`, data),
  delete: (id) => api.delete(`/parties/customers/${id}`),
};

// ─── Returns ─────────────────────────────────────────────────────────────────
export const returnsApi = {
  getAll: (params) => api.get('/returns', { params }),
  create: (data) => api.post('/returns', data),
};

// ─── Audits ───────────────────────────────────────────────────────────────────
export const auditsApi = {
  getAll: (params) => api.get('/audits', { params }),
  start: (data) => api.post('/audits', data),
  updateItem: (id, productId, data) => api.put(`/audits/${id}/item/${productId}`, data),
  complete: (id) => api.put(`/audits/${id}/complete`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsApi = {
  get: (type, params) => api.get(`/reports/${type}`, { params }),
  exportCSV: (type, params) => api.get(`/reports/${type}`, { params: { ...params, export: 'csv' }, responseType: 'blob' }),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceApi = {
  punchIn: (data) => api.post('/attendance/punch-in', data),
  punchOut: (data) => api.post('/attendance/punch-out', data),
  getMyAttendance: (params) => api.get('/attendance/me', { params }),
  getTeamAttendance: (params) => api.get('/attendance/team', { params }),
  markManual: (data) => api.post('/attendance/manual', data),
};

// ─── Salary ───────────────────────────────────────────────────────────────────
export const salaryApi = {
  getAll: (params) => api.get('/salary-slips', { params }),
  getMine: () => api.get('/salary-slips/me'),
  generate: (data) => api.post('/salary-slips/generate', data),
  bulkGenerate: (data) => api.post('/salary-slips/bulk-generate', data),
  markPaid: (id) => api.put(`/salary-slips/${id}/pay`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleActive: (id) => api.put(`/users/${id}/toggle-active`),
};

// ─── Activity Log ─────────────────────────────────────────────────────────────
export const activityApi = {
  getAll: (params) => api.get('/activity-log', { params }),
};

// ─── Dispatch Goals & Timeline ────────────────────────────────────────────────
export const goalsApi = {
  getAll: (params) => api.get('/goals', { params }),
  getAlerts: () => api.get('/goals/alerts'),
  getById: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  updateStatus: (id, data) => api.put(`/goals/${id}/status`, data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

export default api;
