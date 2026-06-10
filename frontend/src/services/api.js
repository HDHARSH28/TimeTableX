import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '', // Vite proxy will handle routing /api to http://localhost:5001
  timeout: 30000,
});

// Interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    // If unauthorized, redirect to login (could be handled in router too)
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  login: async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.success && res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
    }
    return res.data;
  },
  register: async (username, email, password, role) => {
    const res = await api.post('/api/auth/register', { username, email, password, role });
    if (res.success && res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
    }
    return res.data;
  },
  me: async () => {
    const res = await api.get('/api/auth/me');
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  }
};

export const dashboardAPI = {
  getAnalytics: async () => {
    const res = await api.get('/api/dashboard/analytics');
    return res.data;
  }
};

export const departmentAPI = {
  getAll: async () => {
    const res = await api.get('/api/departments');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/departments', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/api/departments/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/api/departments/${id}`);
    return res.data;
  }
};

export const facultyAPI = {
  getAll: async () => {
    const res = await api.get('/api/faculty');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/faculty', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/api/faculty/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/api/faculty/${id}`);
    return res.data;
  }
};

export const classroomAPI = {
  getAll: async () => {
    const res = await api.get('/api/classrooms');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/classrooms', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/api/classrooms/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/api/classrooms/${id}`);
    return res.data;
  }
};

export const subjectAPI = {
  getAll: async () => {
    const res = await api.get('/api/subjects');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/subjects', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/api/subjects/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/api/subjects/${id}`);
    return res.data;
  }
};

export const timetableAPI = {
  getAll: async () => {
    const res = await api.get('/api/timetables');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/api/timetables/${id}`);
    return res.data;
  },
  generate: async (data) => {
    const res = await api.post('/api/timetables/generate', data);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.put(`/api/timetables/${id}/status`, { status });
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/api/timetables/${id}`);
    return res.data;
  },
  exportCsvUrl: (id) => {
    // Returns full download URL utilizing the token in query param or client side triggering
    // To download with auth headers we can do a request and make a blob
    return `/api/timetables/${id}/export`;
  },
  downloadCsv: async (id, filename) => {
    const response = await axios.get(`/api/timetables/${id}/export`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `timetable_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
