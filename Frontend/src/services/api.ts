import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Faculty APIs
export const facultyAPI = {
  getAll: () => axiosInstance.get('/faculty'),
  getById: (id: number) => axiosInstance.get(`/faculty/${id}`),
  create: (data: any) => axiosInstance.post('/faculty', data),
  update: (id: number, data: any) => axiosInstance.put(`/faculty/${id}`, data),
  delete: (id: number) => axiosInstance.delete(`/faculty/${id}`),
}

// Subject APIs
export const subjectAPI = {
  getAll: () => axiosInstance.get('/subjects'),
  getById: (id: number) => axiosInstance.get(`/subjects/${id}`),
  create: (data: any) => axiosInstance.post('/subjects', data),
  update: (id: number, data: any) => axiosInstance.put(`/subjects/${id}`, data),
  delete: (id: number) => axiosInstance.delete(`/subjects/${id}`),
}

// Classroom APIs
export const classroomAPI = {
  getAll: () => axiosInstance.get('/classrooms'),
  getById: (id: number) => axiosInstance.get(`/classrooms/${id}`),
  create: (data: any) => axiosInstance.post('/classrooms', data),
  update: (id: number, data: any) => axiosInstance.put(`/classrooms/${id}`, data),
  delete: (id: number) => axiosInstance.delete(`/classrooms/${id}`),
}

// Timetable APIs
export const timetableAPI = {
  generate: (data: any) => axiosInstance.post('/generate-timetable', data),
  getById: (id: number) => axiosInstance.get(`/timetable/${id}`),
}

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) => axiosInstance.post('/auth/login', { email, password }),
  register: (data: any) => axiosInstance.post('/auth/register', data),
  logout: () => axiosInstance.post('/auth/logout'),
}

export default axiosInstance
