import axios from 'axios';

const api = axios.create({
  // ✅ แก้ไขตรงนี้: ให้ไปดึงค่าจาก .env ถ้าไม่มีให้ใช้ค่าเดิมเป็นตัวสำรอง (Fallback)
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;