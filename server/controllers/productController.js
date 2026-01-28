// server/controllers/productController.js
const prisma = require('../db');

exports.getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { id: 'desc' } });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock, image } = req.body;
    
    // ตรวจสอบ: ถ้ามีการอัปโหลดไฟล์ ให้ใช้ path ของไฟล์
    // ถ้าไม่มีไฟล์ ให้ใช้ text ที่กรอกมา (Link หรือ Emoji)
    let finalImage = image || '📦'; 
    if (req.file) {
      finalImage = '/uploads/' + req.file.filename;
    }

    const product = await prisma.product.create({
      data: { name, price: parseFloat(price), stock: parseInt(stock), image: finalImage }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, image } = req.body;

    let finalImage = image; // ใช้ค่าเดิมถ้าไม่ได้ส่งอะไรมา
    if (req.file) {
      finalImage = '/uploads/' + req.file.filename; // ถ้าอัปไฟล์ใหม่ ให้ใช้ไฟล์ใหม่
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { name, price: parseFloat(price), stock: parseInt(stock), image: finalImage }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(400).json({ error: 'ลบไม่ได้' });
  }
};