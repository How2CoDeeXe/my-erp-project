const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ กำลังล้างข้อมูลเก่า...');
  // ลบข้อมูลเก่าทิ้งให้หมด (เรียงลำดับสำคัญมาก: ลบลูกก่อนลบแม่)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 กำลังสร้าง User (บอส)...');
  const hashedPassword = await bcrypt.hash('123', 10);
  await prisma.user.create({
    data: {
      email: 'boss@erp.com',
      password: hashedPassword,
      name: 'Big Boss',
      role: 'ADMIN'
    }
  });

  console.log('🌱 กำลังสร้างเมนูร้านกาแฟ...');
  
  // 🟡 ปรับปรุง: ตั้งค่า image เป็น null เพื่อให้ Frontend แสดง Emoji อัตโนมัติ
  const products = [
    // --- หมวดกาแฟ & น้ำ (drink) ---
    { name: 'เอสเพรสโซ่ (Espresso)', price: 45.00, stock: 100, image: null, category: 'drink' },
    { name: 'อเมริกาโน่ (Americano)', price: 50.00, stock: 100, image: null, category: 'drink' },
    { name: 'ลาเต้ (Latte)', price: 55.00, stock: 80, image: null, category: 'drink' },
    { name: 'คาปูชิโน่ (Cappuccino)', price: 60.00, stock: 80, image: null, category: 'drink' },
    { name: 'มอคค่า (Mocha)', price: 65.00, stock: 60, image: null, category: 'drink' },
    { name: 'คาราเมลมัคคิอาโต้', price: 70.00, stock: 50, image: null, category: 'drink' },
    { name: 'น้ำแร่ธรรมชาติ', price: 20.00, stock: 200, image: null, category: 'drink' },

    // --- หมวดของหวาน (dessert) ---
    { name: 'ครัวซองต์เนยสด', price: 65.00, stock: 30, image: null, category: 'dessert' },
    { name: 'อัลมอนด์ครัวซองต์', price: 85.00, stock: 20, image: null, category: 'dessert' },
    { name: 'ชีสเค้กหน้าไหม้', price: 120.00, stock: 15, image: null, category: 'dessert' },
    { name: 'ช็อกโกแลตฟัดจ์เค้ก', price: 110.00, stock: 15, image: null, category: 'dessert' },
    { name: 'บราวนี่ดาร์กช็อก', price: 60.00, stock: 40, image: null, category: 'dessert' },
    { name: 'ซอฟต์คุกกี้', price: 45.00, stock: 50, image: null, category: 'dessert' },
    { name: 'วาฟเฟิลเบลเยี่ยม', price: 50.00, stock: 30, image: null, category: 'dessert' },
  ];

  await prisma.product.createMany({ data: products });

  console.log('✅ เสร็จเรียบร้อย! User พร้อม เมนูพร้อม!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });