// // app/lib/axios.ts
// import axios from 'axios';
// import Cookies from 'js-cookie';

// export const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
//   headers: { 'Content-Type': 'application/json' },
// });

// // Request Interceptor: Attach JWT Token
// api.interceptors.request.use((config) => {
//   const token = Cookies.get('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // Response Interceptor: Global 401 Session Expiry Handling
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401 && typeof window !== 'undefined') {
//       Cookies.remove('token');
//       localStorage.removeItem('user');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );