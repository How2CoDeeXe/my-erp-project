const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

exports.getDashboardData = async (req, res) => {
  try {
    /* ------------------ 1. TODAY STATS (ยอดขายวันนี้) ------------------ */
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // เริ่มต้นเที่ยงคืนวันนี้

    const todayStats = await prisma.order.aggregate({
      where: {
        createdAt: { gte: todayStart }
      },
      _sum: { total: true },
      _count: { id: true }
    });

    /* ------------------ 2. TOP PRODUCTS (สินค้าขายดี 5 อันดับ) ------------------ */
    const topSelling = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // ดึงรายละเอียดสินค้า (ชื่อ, รูป, สต็อก)
    const topProducts = await Promise.all(
      topSelling.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });

        return {
          id: item.productId,
          name: product?.name || 'สินค้าลบแล้ว',
          qty: item._sum.quantity,
          image: product?.image, // อาจเป็น null ได้
          stock: product?.stock || 0,
          price: product?.price || 0
        };
      })
    );

    /* ------------------ 3. WEEKLY SALES (ยอดกราฟ 7 วัน: จันทร์-อาทิตย์) ------------------ */
    const fixedDays = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
    const now = new Date();
    // แปลง 0(Sun) -> 7, 1(Mon) -> 1
    const currentDay = now.getDay() === 0 ? 7 : now.getDay(); 

    // หาจุดเริ่มต้นของสัปดาห์ (วันจันทร์ที่ผ่านมา)
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay - 1));
    monday.setHours(0, 0, 0, 0);

    // หาวันอาทิตย์ที่จะถึง
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    // ดึงออเดอร์ทั้งหมดในสัปดาห์นี้มารอไว้
    const ordersThisWeek = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: monday,
          lt: sunday
        }
      }
    });

    const weeklySales = [];

    // วนลูปสร้างข้อมูล 7 วัน (จ-อา)
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateStr = toLocalDateString(dayDate);

      // กรองออเดอร์ที่วันที่ตรงกัน
      const total = ordersThisWeek
        .filter(o => toLocalDateString(new Date(o.createdAt)) === dateStr)
        .reduce((sum, o) => sum + Number(o.total), 0);

      weeklySales.push({
        dayIndex: i,
        name: fixedDays[i],
        date: dateStr,
        total
      });
    }

    /* ------------------ 4. RECENT ORDERS (ออเดอร์ล่าสุด) ------------------ */
    const recentOrders = await prisma.order.findMany({
      take: 20, // เอาแค่ 20 รายการพอก่อนจะได้ไม่หนัก
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    /* ------------------ RESPONSE ------------------ */
    res.json({
      todayMoney: todayStats._sum.total || 0,
      todayOrders: todayStats._count.id || 0,
      topProducts,
      recentOrders,
      weeklySales
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'System Error' });
  }
};