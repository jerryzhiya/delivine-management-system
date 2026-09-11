import axios from 'axios';
import Cookies from 'js-cookie';

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const cleanedUrl = rawBaseUrl.replace(/\/$/, '');
const baseURL = cleanedUrl.endsWith('/api') ? cleanedUrl : `${cleanedUrl}/api`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});