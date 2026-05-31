export const getPromotions = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { priority: 'desc' }
    });
    return c.json(promotions);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
};

export const createPromotion = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  try {
    const body = await c.req.json();
    const promotion = await prisma.promotion.create({
      data: {
        name: body.name,
        code: body.code?.toUpperCase() || null,
        description: body.description,
        discountType: body.discountType,
        discountValue: parseFloat(body.discountValue),
        minBookingAmount: body.minBookingAmount ? parseFloat(body.minBookingAmount) : null,
        maxDiscount: body.maxDiscount ? parseFloat(body.maxDiscount) : null,
        firstBookingOnly: Boolean(body.firstBookingOnly),
        usageLimit: body.usageLimit ? parseInt(body.usageLimit) : null,
        active: Boolean(body.active),
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        priority: body.priority ? parseInt(body.priority) : 1,
        maxUsesPerUser: body.maxUsesPerUser ? parseInt(body.maxUsesPerUser) : null,
        targetType: body.targetType || 'PLATFORM',
        targetId: body.targetId || null,
        autoApply: body.autoApply !== undefined ? Boolean(body.autoApply) : true,
      }
    });

    const user = c.get('user');
    if (user && user.userId) {
      await prisma.auditLog.create({
        data: {
          adminId: user.userId,
          action: 'PROMOTION_CREATED',
          details: { promotionId: promotion.id, name: promotion.name },
          ipAddress: c.req.header('x-forwarded-for') || '',
          userAgent: c.req.header('user-agent') || ''
        }
      });
    }

    return c.json(promotion);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
};

export const updatePromotion = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    
    const updateData = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.code !== undefined) updateData.code = body.code?.toUpperCase() || null;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.discountValue !== undefined) updateData.discountValue = parseFloat(body.discountValue);
    if (body.minBookingAmount !== undefined) updateData.minBookingAmount = body.minBookingAmount ? parseFloat(body.minBookingAmount) : null;
    if (body.maxDiscount !== undefined) updateData.maxDiscount = body.maxDiscount ? parseFloat(body.maxDiscount) : null;
    if (body.firstBookingOnly !== undefined) updateData.firstBookingOnly = Boolean(body.firstBookingOnly);
    if (body.usageLimit !== undefined) updateData.usageLimit = body.usageLimit ? parseInt(body.usageLimit) : null;
    if (body.active !== undefined) updateData.active = Boolean(body.active);
    if (body.validFrom !== undefined) updateData.validFrom = body.validFrom ? new Date(body.validFrom) : null;
    if (body.validUntil !== undefined) updateData.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (body.priority !== undefined) updateData.priority = parseInt(body.priority);
    if (body.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = body.maxUsesPerUser ? parseInt(body.maxUsesPerUser) : null;
    if (body.targetType !== undefined) updateData.targetType = body.targetType;
    if (body.targetId !== undefined) updateData.targetId = body.targetId || null;
    if (body.autoApply !== undefined) updateData.autoApply = Boolean(body.autoApply);

    const promotion = await prisma.promotion.update({
      where: { id },
      data: updateData
    });

    const user = c.get('user');
    if (user && user.userId) {
      let action = 'PROMOTION_EDITED';
      if (body.active !== undefined && Object.keys(body).length === 1) {
         action = body.active ? 'PROMOTION_ENABLED' : 'PROMOTION_DISABLED';
      }
      
      await prisma.auditLog.create({
        data: {
          adminId: user.userId,
          action,
          details: { promotionId: promotion.id, name: promotion.name },
          ipAddress: c.req.header('x-forwarded-for') || '',
          userAgent: c.req.header('user-agent') || ''
        }
      });
    }

    return c.json(promotion);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
};

export const deletePromotion = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  try {
    const promotion = await prisma.promotion.findUnique({ where: { id } });
    if (promotion) {
      await prisma.promotion.delete({ where: { id } });
      const user = c.get('user');
      if (user && user.userId) {
        await prisma.auditLog.create({
          data: {
            adminId: user.userId,
            action: 'PROMOTION_DELETED',
            details: { promotionId: id, name: promotion.name },
            ipAddress: c.req.header('x-forwarded-for') || '',
            userAgent: c.req.header('user-agent') || ''
          }
        });
      }
    }
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
};

export const getActivePromotions = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  try {
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: {
        active: true,
        OR: [
          { validFrom: null },
          { validFrom: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { validUntil: null },
              { validUntil: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { priority: 'desc' }
    });
    return c.json(promotions);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
};

export const validatePromotion = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  try {
    const { code, bookingAmount, userId } = await c.req.json();
    if (!code) return c.json({ error: "No code provided" }, 400);

    const now = new Date();
    const promotion = await prisma.promotion.findUnique({ where: { code: code.toUpperCase() } });
    
    if (!promotion) return c.json({ error: "Invalid promotion code" }, 404);
    if (!promotion.active) return c.json({ error: "Promotion is disabled" }, 400);
    if (promotion.validFrom && new Date(promotion.validFrom) > now) return c.json({ error: "Promotion not yet active" }, 400);
    if (promotion.validUntil && new Date(promotion.validUntil) < now) return c.json({ error: "Promotion expired" }, 400);
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) return c.json({ error: "Promotion usage limit reached" }, 400);
    if (promotion.minBookingAmount && bookingAmount < promotion.minBookingAmount) return c.json({ error: `Minimum booking amount is ₹${promotion.minBookingAmount}` }, 400);
    
    if (promotion.firstBookingOnly && userId) {
      const userBookingsCount = await prisma.booking.count({ where: { userId } });
      if (userBookingsCount > 0) {
         return c.json({ error: "Promotion valid for first booking only" }, 400);
      }
    }

    let discountAmount = 0;
    if (promotion.discountType === 'PERCENTAGE') {
      discountAmount = bookingAmount * (promotion.discountValue / 100);
      if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
        discountAmount = promotion.maxDiscount;
      }
    } else {
      discountAmount = promotion.discountValue;
    }

    // prevent negative totals
    if (discountAmount > bookingAmount) discountAmount = bookingAmount;

    return c.json({ ...promotion, discountAmount });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
};


export const getPromotionAnalytics = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  try {
    const promotions = await prisma.promotion.findMany({
      include: { bookings: { select: { totalPrice: true, createdAt: true } } }
    });

    let totalDiscounts = 0;
    let totalRevenueGenerated = 0;
    let mostUsedPromo = null;
    let maxUsage = -1;
    let activePromotions = 0;

    const usageData = [];
    const revenueData = [];
    const historicalUsageMap = {};
    let totalBookingsAcrossAllPromos = 0;

    for (const promo of promotions) {
      if (promo.active) activePromotions++;
      if (promo.usageCount > maxUsage) {
        maxUsage = promo.usageCount;
        mostUsedPromo = promo.name;
      }
      
      let promoRevenue = 0;
      for (const booking of promo.bookings) {
        promoRevenue += booking.totalPrice || 0;
        totalBookingsAcrossAllPromos++;
        
        // Build Historical Data
        if (booking.createdAt) {
          const dateStr = new Date(booking.createdAt).toISOString().split('T')[0];
          if (!historicalUsageMap[dateStr]) historicalUsageMap[dateStr] = {};
          const pName = promo.code || promo.name;
          historicalUsageMap[dateStr][pName] = (historicalUsageMap[dateStr][pName] || 0) + 1;
        }
      }
      totalRevenueGenerated += promoRevenue;
      
      let pDiscount = 0;
      if (promo.usageCount > 0) {
        const avgBooking = promoRevenue / promo.usageCount;
        if (promo.discountType === 'PERCENTAGE' || promo.discountType === 'percentage') {
          pDiscount = avgBooking * (promo.discountValue / 100);
          if (promo.maxDiscount && pDiscount > promo.maxDiscount) pDiscount = promo.maxDiscount;
        } else {
          pDiscount = promo.discountValue;
        }
      }
      totalDiscounts += (pDiscount * promo.usageCount);

      usageData.push({ name: promo.code || promo.name, usage: promo.usageCount });
      revenueData.push({ name: promo.code || promo.name, revenue: promoRevenue });
    }

    const historicalUsage = Object.keys(historicalUsageMap).sort().map(date => {
      return { date, ...historicalUsageMap[date] };
    });

    // We also need total platform bookings to calculate conversion rate (Promo Bookings / Total Bookings)
    const totalPlatformBookings = await prisma.booking.count();
    const conversionRate = totalPlatformBookings > 0 ? (totalBookingsAcrossAllPromos / totalPlatformBookings) * 100 : 0;

    return c.json({
      usageData,
      revenueData,
      totalDiscounts,
      totalRevenueGenerated,
      mostUsedPromo,
      activePromotions,
      historicalUsage,
      conversionRate
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
};
