import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { logSecureError, logSecureWarn, logSecureInfo } from '../../logging/logger.js';

export const getUserBookings = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: payload.userId },
      include: {
        resort: {
          select: {
            id: true,
            name: true,
            slug: true,
            tagline: true,
            type: true,
            locationArea: true,
            locationLat: true,
            locationLng: true,
            images: true,
            rating: true,
            reviewCount: true,
            pricePerNight: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            pricePerNight: true
          }
        }
      },
      orderBy: { checkIn: 'asc' }
    });
    return c.json(bookings);
  } catch (err) { return c.json({ error: err.message }, 500); }
};

export const getAllBookingsAdmin = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));
  const skip = (page - 1) * limit;

  try {
    const [totalCount, bookings] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          guests: true,
          totalPrice: true,
          status: true,
          specialRequests: true,
          referenceNumber: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          resortId: true,
          roomId: true,
          commissionRate: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          resort: {
            select: {
              id: true,
              name: true
            }
          },
          room: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return c.json({
      data: bookings,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
};

export const createBooking = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const data = await c.req.json();
  const { resortId, roomId, checkIn, checkOut, guests, specialRequests, addInsurance, airportPickup, selectedMeals, couponCode } = data;
  const payload = c.get('user');
  
  try {
    // We run the concurrency check and booking creation in a transaction
    const { booking, totalPrice, referenceNumber } = await prisma.$transaction(async (tx) => {
      // 1. RECALCULATE PRICE & FETCH ROOM DETAILS
      const resort = await tx.resort.findUnique({ 
        where: { id: resortId },
        include: { roomTypes: true }
      });
      
      if (!resort) throw new Error('Resort not found');
      
      const room = resort.roomTypes.find(r => r.id === roomId);
      if (!room) throw new Error('Room type not found');

      // Parse dates safely
      const parseDate = (d) => {
        const s = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
        const [y, m, day] = s.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, day));
      };
      const startDate = parseDate(checkIn);
      const endDate = parseDate(checkOut);
      
      // 2. CONCURRENCY CHECK: OVERLAP VALIDATION
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const overlappingBookings = await tx.booking.count({
        where: {
          roomId: roomId,
          checkIn: { lt: endDate },
          checkOut: { gt: startDate },
          OR: [
            { status: { in: ['PAID', 'CONFIRMED', 'CHECKED_IN'] } },
            { status: 'PENDING', createdAt: { gt: fifteenMinsAgo } }
          ]
        }
      });

      // If all available units for this room type are taken, abort!
      if (overlappingBookings >= room.availableCount) {
        throw new Error('ROOM_UNAVAILABLE');
      }

      // 3. PRICE CALCULATION
      const nights = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const nightsTotal = room.pricePerNight * nights;
      const taxes = Math.round(nightsTotal * 0.12);
      const insuranceCost = addInsurance ? Math.round(nightsTotal * 0.02) : 0;
      const airportPickupCost = airportPickup ? 1500 : 0;

      // Meal Packages calculation (with 5% GST for F&B)
      let mealTotal = 0;
      const validatedMealDescriptions = [];
      const resortMealPackages = resort.mealPackages || [];
      if (Array.isArray(selectedMeals) && selectedMeals.length > 0) {
        for (const mealName of selectedMeals) {
          const pkg = resortMealPackages.find(p => p.name === mealName);
          if (pkg) {
            const guestCount = Number(guests) || 1;
            const cost = pkg.price * guestCount * nights;
            mealTotal += cost;
            validatedMealDescriptions.push(`${pkg.name} (₹${pkg.price} x ${guestCount} guests x ${nights} nights = ₹${cost})`);
          }
        }
      }
      const mealTaxes = Math.round(mealTotal * 0.05);
      
      const computedTotal = nightsTotal + taxes + insuranceCost + airportPickupCost + mealTotal + mealTaxes;

      // Secure Promotion Discount Calculation on Backend
      let discountAmount = 0;
      let finalAmount = computedTotal;
      let promotionId = null;
      let promotionName = null;
      
      if (couponCode) {
        const promotion = await tx.promotion.findFirst({
          where: { code: { equals: couponCode.trim(), mode: 'insensitive' } }
        });

        if (!promotion) throw new Error("COUPON_INVALID:Invalid promotion code");
        if (!promotion.active) throw new Error("COUPON_INVALID:Promotion is disabled");
        
        const now = new Date();
        if (promotion.validFrom && new Date(promotion.validFrom) > now) throw new Error("COUPON_INVALID:Promotion not yet active");
        if (promotion.validUntil && new Date(promotion.validUntil) < now) throw new Error("COUPON_INVALID:Promotion expired");
        if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) throw new Error("COUPON_INVALID:Promotion usage limit reached");
        if (promotion.minBookingAmount && computedTotal < promotion.minBookingAmount) throw new Error(`COUPON_INVALID:Minimum booking amount is ₹${promotion.minBookingAmount}`);
        
        if (promotion.firstBookingOnly && payload.userId) {
          const userBookingsCount = await tx.booking.count({ where: { userId: payload.userId } });
          if (userBookingsCount > 0) throw new Error("COUPON_INVALID:Promotion valid for first booking only");
        }

        if (promotion.discountType?.toUpperCase() === 'PERCENTAGE') {
          discountAmount = computedTotal * (promotion.discountValue / 100);
          if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
            discountAmount = promotion.maxDiscount;
          }
        } else {
          discountAmount = promotion.discountValue;
        }

        if (discountAmount > computedTotal) discountAmount = computedTotal;
        finalAmount = computedTotal - discountAmount;
        
        promotionId = promotion.id;
        promotionName = promotion.name;

        // Increment usage count safely
        await tx.promotion.update({
          where: { id: promotion.id },
          data: { usageCount: { increment: 1 } }
        });
      }

      const refNum = `HST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Format special requests to store selected meals in DB
      let formattedSpecialRequests = specialRequests || "";
      if (validatedMealDescriptions.length > 0) {
        const prefix = `[Selected Meals: ${validatedMealDescriptions.join("; ")}]`;
        formattedSpecialRequests = formattedSpecialRequests ? `${prefix} ${formattedSpecialRequests}` : prefix;
      }

      // 4. CREATE PENDING RESERVATION (LOCK)
      // Note: coupon fields (originalAmount, discountAmount, couponCode) are NOT in the
      // Prisma Booking model. They are tracked via the couponDb fallback layer.
      // totalPrice stores the final (post-discount) amount that matches the Razorpay order.
      let finalSpecialRequests = formattedSpecialRequests;
      if (couponCode && discountAmount > 0) {
        const couponNote = `[Coupon: ${couponCode.trim().toUpperCase()}, Discount: ₹${discountAmount}, Original: ₹${computedTotal}]`;
        finalSpecialRequests = finalSpecialRequests ? `${couponNote} ${finalSpecialRequests}` : couponNote;
      }

      const newBooking = await tx.booking.create({
        data: {
          userId: payload.userId,
          resortId,
          roomId,
          checkIn: startDate,
          checkOut: endDate,
          guests: parseInt(guests) || 1,
          totalPrice: finalAmount,
          specialRequests: finalSpecialRequests,
          referenceNumber: refNum,
          commissionRate: resort.commissionRate || 7.0,
          status: 'PENDING',
          promotionId: promotionId,
          promotionName: promotionName,
          discountAmount: discountAmount > 0 ? discountAmount : null
        }
      });

      return {
        booking: newBooking,
        totalPrice: finalAmount,
        referenceNumber: refNum,
        couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
        discountAmount,
        originalAmount: computedTotal
      };
    }, {
      isolationLevel: 'Serializable', // Use strictest isolation for concurrency safety
      maxWait: 5000,
      timeout: 10000
    });

    // 5. CREATE RAZORPAY ORDER (OUTSIDE TRANSACTION TO AVOID HOLDING LOCKS)
    try {
      const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${c.env.RAZORPAY_KEY_ID}:${c.env.RAZORPAY_KEY_SECRET}`)}`
        },
        body: JSON.stringify({
          amount: Math.round(totalPrice * 100),
          currency: 'INR',
          receipt: referenceNumber
        })
      });
      
      const order = await rzpResponse.json();
      if (!order.id) {
        console.error("Razorpay Error:", order);
        throw new Error(order.error?.description || 'Razorpay order creation failed');
      }

      return c.json({ ...booking, orderId: order.id });
    } catch (rzpErr) {
      // If Razorpay fails, immediately release the held room reservation
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'FAILED' }
      });
      throw rzpErr;
    }

  } catch (err) { 
    if (err.message === 'ROOM_UNAVAILABLE') {
      return c.json({ error: 'This sanctuary was just reserved by another traveler. Please select different dates or another room.' }, 409);
    }
    return c.json({ error: err.message }, 500); 
  }
};

export const getBookingByRef = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const ref = c.req.param('ref');
  try {
    const booking = await prisma.booking.findUnique({
      where: { referenceNumber: ref },
      include: {
        resort: {
          select: {
            id: true,
            name: true,
            slug: true,
            tagline: true,
            type: true,
            locationArea: true,
            locationLat: true,
            locationLng: true,
            images: true,
            rating: true,
            reviewCount: true,
            pricePerNight: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            pricePerNight: true
          }
        }
      }
    });
    if (!booking) return c.json({ error: 'Booking not found' }, 404);
    return c.json(booking);
  } catch (err) { return c.json({ error: err.message }, 500); }
};

export const cancelBooking = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { resort: true }
    });

    c.executionCtx.waitUntil(
      prisma.notification.create({
        data: {
          userId: booking.userId,
          title: 'Booking Cancelled 😔',
          message: `Your booking at ${booking.resort.name} has been cancelled successfully.`,
          type: 'booking'
        }
      }).catch(err => console.error("Async cancel notification failed:", err))
    );

    return c.json(booking);
  } catch (err) { 
    return c.json({ error: err.message }, 500); 
  }
};

export const updateBookingStatus = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  const { status, paymentStatus } = await c.req.json();
  try {
    const dataToUpdate = {};
    if (status) dataToUpdate.status = status;
    if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;

    const booking = await prisma.booking.update({
      where: { id },
      data: dataToUpdate,
      include: { resort: true }
    });

    c.executionCtx.waitUntil(
      prisma.notification.create({
        data: {
          userId: booking.userId,
          title: `Booking Status Update!`,
          message: `Your booking at ${booking.resort.name} is now ${status}.`,
          type: 'booking'
        }
      }).catch(err => console.error("Async status notification failed:", err))
    );

    return c.json(booking);
  } catch (err) { 
    return c.json({ error: err.message }, 500); 
  }
};

export const getGuideBookings = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const guideId = c.req.param('id');
  try {
    const bookings = await prisma.guideBooking.findMany({
      where: { guideId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });
    return c.json(bookings);
  } catch (err) { return c.json({ error: err.message }, 500); }
};




export const getBookingQR = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  const bookingId = c.req.param('id');
  const JWT_SECRET = c.env.JWT_SECRET || 'hampistays_secure_jwt_secret_2026';

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { resort: true, user: true }
    });

    if (!booking) return c.json({ error: 'Booking not found' }, 404);
    if (booking.userId !== payload.userId && payload.role !== 'ADMIN' && payload.role !== 'RESORT_OWNER') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const now = new Date();
    // Assuming checkIn time is at 14:00 (2:00 PM) on the checkIn date if not specified
    // Prisma checkIn might be midnight if it's just a Date. Let's adjust for a standard check-in time of 14:00
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(14, 0, 0, 0); // 2:00 PM
    
    const unlockTime = new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
    const checkOutDate = new Date(booking.checkOut);
    checkOutDate.setHours(11, 0, 0, 0); // 11:00 AM checkout

    if (booking.status === 'CANCELLED') {
      return c.json({ error: 'Booking cancelled. QR no longer valid.' }, 400);
    }

    if (now > checkOutDate) {
      return c.json({ error: 'Booking expired. QR no longer valid.' }, 400);
    }

    if (now < unlockTime) {
      return c.json({ 
        locked: true, 
        message: 'Contactless Check-In will be available 24 hours before your arrival.',
        unlockTime: unlockTime.toISOString(),
        checkInTime: checkInDate.toISOString()
      }, 200);
    }

    // Generate secure QR payload
    const qrPayload = {
      bookingId: booking.id,
      userId: booking.userId,
      resortId: booking.resortId,
      exp: Math.floor(checkOutDate.getTime() / 1000)
    };

    const token = jwt.sign(qrPayload, JWT_SECRET);

    await prisma.auditLog.create({
      data: {
        action: 'QR_GENERATED',
        entityType: 'BOOKING',
        entityId: booking.id,
        userId: payload.userId,
        details: 'QR pass generated for booking'
      }
    });

    return c.json({ 
      locked: false, 
      token, 
      checkInTime: checkInDate.toISOString(),
      checkOutTime: checkOutDate.toISOString()
    });

  } catch (err) {
    logSecureError('Failed to generate QR', err);
    return c.json({ error: 'Failed to generate QR' }, 500);
  }
};

export const scanBookingQR = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  const JWT_SECRET = c.env.JWT_SECRET || 'hampistays_secure_jwt_secret_2026';

  try {
    const { token } = await c.req.json();
    if (!token) return c.json({ error: 'Missing QR token' }, 400);

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return c.json({ error: 'This Stay Pass is no longer valid or has been tampered with.' }, 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: decoded.bookingId },
      include: { resort: true, user: true }
    });

    if (!booking) return c.json({ error: 'Booking not found' }, 404);

    if (booking.status === 'CANCELLED') {
      await prisma.auditLog.create({
        data: { action: 'QR_SCAN_FAILED', entityType: 'BOOKING', entityId: booking.id, userId: payload.userId, details: 'Cancelled booking scan attempt' }
      });
      return c.json({ error: 'This Stay Pass is no longer valid.' }, 400);
    }

    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(14, 0, 0, 0);
    const validFrom = new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
    const checkOutDate = new Date(booking.checkOut);
    checkOutDate.setHours(11, 0, 0, 0);

    if (now > checkOutDate) {
      await prisma.auditLog.create({
        data: { action: 'QR_SCAN_FAILED', entityType: 'BOOKING', entityId: booking.id, userId: payload.userId, details: 'Expired booking scan attempt' }
      });
      return c.json({ error: 'This Stay Pass is no longer valid.' }, 400);
    }

    if (now < validFrom) {
      await prisma.auditLog.create({
        data: { action: 'QR_SCAN_FAILED', entityType: 'BOOKING', entityId: booking.id, userId: payload.userId, details: 'Early scan attempt blocked' }
      });
      return c.json({ 
        error: 'Check-In not yet available.',
        validFrom: validFrom.toISOString()
      }, 400);
    }

    if (booking.status === 'CHECKED_IN') {
      await prisma.auditLog.create({
        data: { action: 'QR_SCAN_FAILED', entityType: 'BOOKING', entityId: booking.id, userId: payload.userId, details: 'Duplicate scan attempt' }
      });
      return c.json({ error: 'Guest is already checked in.' }, 400);
    }

    // Mark as checked in
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CHECKED_IN' }
    });

    await prisma.auditLog.create({
      data: { action: 'CHECK_IN_COMPLETED', entityType: 'BOOKING', entityId: booking.id, userId: payload.userId, details: 'QR Check-In successful' }
    });

    return c.json({
      message: 'Contactless Check-In Complete',
      bookingId: booking.id,
      guestName: booking.user.name,
      resortName: booking.resort.name,
      checkInTime: new Date().toISOString(),
      verifiedBy: payload.name || payload.email
    });

  } catch (err) {
    logSecureError('Failed to scan QR', err);
    return c.json({ error: 'Failed to process QR scan' }, 500);
  }
};
