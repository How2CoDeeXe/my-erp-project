const prisma = require('../db');

/**
 * Helper: แปลง Date -> YYYY-MM-DD (Local Time)
 */
const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

exports.getDashboardData = async (req, res) => {
  try {
    /* ------------------ 1. TODAY STATS ------------------ */
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayStats = await prisma.order.aggregate({
      where: {
        createdAt: { gte: todayStart }
      },
      _sum: { total: true },
      _count: { id: true }
    });

    /* ------------------ 2. TOP PRODUCTS ------------------ */
    const topSelling = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProducts = await Promise.all(
      topSelling.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });

        return {
          name: product?.name || 'สินค้าลบแล้ว',
          qty: item._sum.quantity,
          image: product?.image,
          stock: product?.stock || 0,
          price: product?.price || 0
        };
      })
    );

    /* ------------------ 3. WEEKLY SALES (Mon - Sun) ------------------ */

    const fixedDays = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];

    const now = new Date();
    const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // 1=Mon ... 7=Sun

    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay - 1));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    const ordersThisWeek = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: monday,
          lt: sunday
        }
      }
    });

    const weeklySales = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);

      const dateStr = toLocalDateString(dayDate);

      const total = ordersThisWeek
        .filter(o => toLocalDateString(new Date(o.createdAt)) === dateStr)
        .reduce((sum, o) => sum + Number(o.total), 0);

      weeklySales.push({
        dayIndex: i,               // ⭐ สำคัญมาก
        name: fixedDays[i],
        date: dateStr,
        total
      });
    }

    /* ------------------ 4. RECENT ORDERS ------------------ */
    const recentOrders = await prisma.order.findMany({
      take: 50,
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
