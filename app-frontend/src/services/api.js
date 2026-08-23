import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
};

export const serverService = {
  list: () => api.get('/servers').then((r) => r.data),
  create: (name) => api.post('/servers', { name }).then((r) => r.data),
  join: (id) => api.post(`/servers/${id}/join`).then((r) => r.data),
  members: (id) => api.get(`/servers/${id}/members`).then((r) => r.data),
  leave: (id) => api.post(`/servers/${id}/leave`).then((r) => r.data),
};

export const messageService = {
  history: (channelId, before) =>
    api.get(`/messages/${channelId}`, { params: { before } }).then((r) => r.data),
  send: (channelId, content, imageUrl) =>
    api.post(`/messages/${channelId}`, { content, imageUrl }).then((r) => r.data),
};

export const callService = {
  getToken: (channelId) => api.post(`/calls/${channelId}/token`).then((r) => r.data),
};

export const userService = {
  getProfile: (username) => api.get(`/users/${username}`).then((r) => r.data),
  requestVerification: (reason) =>
    api.post('/users/verification/request', { reason }).then((r) => r.data),
};

export default api;
