import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  const token = config.url?.startsWith('/admin')
    ? localStorage.getItem('streamearn_admin_token')
    : localStorage.getItem('streamearn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
