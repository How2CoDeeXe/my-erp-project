import api from './api';

export const authService = {
  // ฟังก์ชันยิง Login
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    
    // ถ้าสำเร็จ ให้เก็บ Token ลงเครื่อง
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // ฟังก์ชัน Logout (ลบ Token)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // ฟังก์ชันดึง User ปัจจุบัน
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  }
};