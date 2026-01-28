// server/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db'); // เรียกตัวเชื่อม DB ที่เราทำไว้

// Secret Key สำหรับสร้าง Token (ของจริงควรซ่อนใน .env)
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me_na_ja';

// 1. ฟังก์ชันสมัครสมาชิก (Register)
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // เช็คว่ามี Email นี้หรือยัง
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email นี้ถูกใช้งานแล้ว' });
    }

    // เข้ารหัส Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้าง User ใหม่
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN' // คนแรกให้เป็น Admin ไปเลย
      }
    });

    res.json({ message: 'สมัครสมาชิกสำเร็จ!', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. ฟังก์ชันเข้าสู่ระบบ (Login)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // หา User จาก Email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email หรือรหัสผ่านไม่ถูกต้อง' });
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email หรือรหัสผ่านไม่ถูกต้อง' });
    }

    // สร้าง Token (บัตรผ่าน)
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '1d' } // อายุ 1 วัน
    );

    res.json({ message: 'Login สำเร็จ!', token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};