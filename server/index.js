const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { auth, adminOnly } = require('./middleware/auth');
const cors = require('cors');
const prisma = require('./db');
const cron = require('node-cron'); 
const dashboardController = require('./controllers/dashboardController');

// --- ตั้งค่าอัปโหลดรูปภาพ ---
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ตั้งค่าที่เก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.use('/uploads', express.static('uploads'));

// ----------------------------------------------------
// 🔥 ส่วนระบบลบประวัติอัตโนมัติ (Auto Delete History) 🔥
// ----------------------------------------------------

const clearHistory = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        // 1. ลบรายการสินค้าในบิลเก่า
        await prisma.orderItem.deleteMany({
            where: {
                order: { createdAt: { lt: today } }
            }
        });

        // 2. ลบบิลเก่า
        const deleted = await prisma.order.deleteMany({
            where: { createdAt: { lt: today } }
        });

        if (deleted.count > 0) {
            console.log(`🧹 Auto-Clean: ลบประวัติเก่าทิ้งไป ${deleted.count} รายการ`);
        }
    } catch (err) {
        console.error("Auto-Clean Error:", err);
    }
};

// ทำงานทุกเที่ยงคืน
cron.schedule('0 0 * * *', () => {
    console.log('⏰ Midnight! Clearing old history...');
    clearHistory();
});

// ทำงานทันทีตอนเปิด Server
//clearHistory();

// ----------------------------------------------------
// 🔐 ส่วนระบบสมาชิก (Login / Register) - เพิ่มส่วนนี้เข้ามา
// ----------------------------------------------------

// 1. สมัครสมาชิก



// 2. เข้าสู่ระบบ
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const { password: _, ...userData } = user;

    res.json({
      message: "Login success",
      token,
      user: userData
    });

  } catch (err) {
    res.status(500).json({ error: "System Error" });
  }
});



// ----------------------------------------------------
// 📦 ส่วนจัดการสินค้า และ ออเดอร์ (เหมือนเดิม)
// ----------------------------------------------------

app.get('/products', auth, adminOnly, async (req, res) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(products);
});

app.post('/products', upload.single('imageFile'), async (req, res) => {
  try {
    const { name, price, stock, category, image } = req.body;
    let imagePath = image || ''; 
    if (req.file) imagePath = `/uploads/${req.file.filename}`;

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category || 'general',
        image: imagePath
      }
    });
    res.json(newProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/products/:id', auth, adminOnly, upload.single('imageFile'), async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, category, image } = req.body;
    
    let updateData = {
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category || 'general'
    };

    if (req.file) {
        updateData.image = `/uploads/${req.file.filename}`;
    } else if (image) {
        updateData.image = image;
    }

    try {
        const updated = await prisma.product.update({
            where: { id: parseInt(id) },
            data: updateData
        });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/products/:id',auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  await prisma.product.delete({ where: { id: parseInt(id) } });
  res.json({ message: "Deleted" });
});

app.post('/orders', auth, adminOnly, async (req, res) => {
  const { items, total } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: { total: parseFloat(total) }
      });

      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.id,
            quantity: item.qty,
            price: parseFloat(item.price)
          }
        });
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.qty } }
        });
      }
      return order;
    });
    res.json({ message: "Success", order: result });
  } catch (err) {
    res.status(400).json({ error: "Stock ไม่พอ หรือมีข้อผิดพลาด" });
  }
});

// ใน server/index.js (เพิ่ม API สำหรับตรวจสอบสถานะ - Optional)
app.get('/auth/me', async (req, res) => {
  // ในอนาคตเราจะใช้ Token (JWT) ตรงนี้ แต่ตอนนี้ใช้การเช็คพื้นฐานก่อน
  res.json({ message: "Authenticated" });
});



// Dashboard API
app.get('/dashboard', auth, adminOnly, dashboardController.getDashboardData);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
