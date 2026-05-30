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
      }
    });
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

    const promotion = await prisma.promotion.update({
      where: { id },
      data: updateData
    });
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
    await prisma.promotion.delete({ where: { id } });
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
