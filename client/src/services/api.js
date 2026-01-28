import axios from 'axios';

/**
 * Axios instance กลางของทั้งระบบ
 * - รองรับ JWT
 * - รองรับ deploy
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 🔐 Request Interceptor
 * แนบ JWT Token ไปทุก request อัตโนมัติ
 */
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

/**
 * 🚨 Response Interceptor
 * ถ้า token หมดอายุ / ไม่ถูกต้อง → logout อัตโนมัติ
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token หมดอายุ หรือโดนลบจาก backend
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // กันกรณี loop
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
