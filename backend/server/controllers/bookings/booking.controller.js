import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { logSecureError, logSecureWarn, logSecureInfo } from '../../logging/logger.js';
import { invalidateAvailabilityCache } from '../../services/bookings/availabilityCache.js';

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
  const { resortId, roomId, checkIn, checkOut, guests, specialRequests, addInsurance, airportPickup, selectedMeals, couponCode, useCredits } = data;
  const payload = c.get('user');
  
  try {
    if (payload?.userId) {
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) return c.json({ error: 'User not found' }, 404);
      // KYC is now optional and non-blocking for booking
    }

    // We run the concurrency check and booking creation in a transaction
    // NOTE: Credit deduction happens OUTSIDE the transaction (after Razorpay succeeds)
    // to prevent credits being permanently lost if the payment gateway fails.
    const { booking, totalPrice, referenceNumber, creditsToDeduct } = await prisma.$transaction(async (tx) => {
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
      
      // 2. CONCURRENCY CHECK: Using Prisma ORM instead of raw SQL
      // Replaced raw SQL to prevent schema mismatch errors (e.g., column "roomId" does not exist)
      // and to ensure type safety through the centralized database access layer.
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const availableCount = room.availableCount;

      const conflictingBookings = await tx.booking.findMany({
        where: {
          roomId: roomId,
          checkIn: { lt: endDate },
          checkOut: { gt: startDate },
          OR: [
            { status: { in: ['PAID', 'CONFIRMED', 'CHECKED_IN'] } },
            { status: 'PENDING', createdAt: { gt: fifteenMinsAgo } }
          ]
        },
        select: { checkIn: true, checkOut: true }
      });

      const blockings = await tx.roomBlocking.findMany({
        where: {
          roomId: roomId,
          date: {
            gte: startDate,
            lt: endDate
          }
        },
        select: { date: true }
      });

      let isOverbooked = false;
      let currentDate = new Date(startDate);
      while (currentDate < endDate) {
        let dailyCount = 0;
        
        for (const b of conflictingBookings) {
          if (b.checkIn <= currentDate && b.checkOut > currentDate) {
            dailyCount++;
          }
        }
        
        for (const blk of blockings) {
          if (blk.date.getTime() === currentDate.getTime()) {
            dailyCount++;
          }
        }
        
        if (dailyCount >= availableCount) {
          isOverbooked = true;
          break;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (isOverbooked) {
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

      if (finalAmount > 50000 && payload?.userId) {
        if (user.kycStatus !== 'VERIFIED') {
          throw new Error('KYC_REQUIRED: High-value bookings (over ₹50,000) require account verification. Please complete KYC in your dashboard.');
        }
      }
      
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

      // Calculate Credits to Apply — DEDUCTION happens OUTSIDE the transaction
      // after Razorpay payment succeeds, to prevent losing credits on gateway failure.
      let creditsUsed = 0;
      if (useCredits && payload?.userId) {
        const credits = await tx.rewardCredit.findMany({ where: { userId: payload.userId } });
        // Sum only positive credits (negative entries are prior deductions)
        const totalPositiveCredits = credits.reduce((sum, c) => sum + (c.amount > 0 ? c.amount : 0), 0);
        const totalUsedCredits = credits.reduce((sum, c) => sum + (c.amount < 0 ? Math.abs(c.amount) : 0), 0);
        const netAvailableCredits = Math.max(0, totalPositiveCredits - totalUsedCredits);
        
        if (netAvailableCredits > 0) {
          // Cap credits at finalAmount to prevent negative total
          creditsUsed = Math.min(netAvailableCredits, finalAmount);
          finalAmount = Math.max(0, finalAmount - creditsUsed);
        }
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
      const auditParts = [];
      if (couponCode && discountAmount > 0) {
        auditParts.push(`Coupon: ${couponCode.trim().toUpperCase()}, Discount: ₹${discountAmount}`);
      }
      if (creditsUsed > 0) {
        auditParts.push(`Credits Applied: ₹${creditsUsed}`);
      }
      if (auditParts.length > 0) {
        const auditNote = `[${auditParts.join(' | ')}, Original: ₹${computedTotal}, Final: ₹${finalAmount}]`;
        finalSpecialRequests = finalSpecialRequests ? `${auditNote} ${finalSpecialRequests}` : auditNote;
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
        totalPrice: finalAmount,   // This is the FINAL amount after all discounts + credits
        referenceNumber: refNum,
        couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
        discountAmount,
        creditsToDeduct: creditsUsed, // Passed out to apply AFTER Razorpay succeeds
        originalAmount: computedTotal
      };
    }, {
      isolationLevel: 'Serializable', // Use strictest isolation for concurrency safety
      maxWait: 5000,
      timeout: 10000
    });

    // 5. CREATE RAZORPAY ORDER (OUTSIDE TRANSACTION TO AVOID HOLDING LOCKS)
    // SECURITY: Use `totalPrice` (= finalAmount after all discounts/credits) for Razorpay.
    // This ensures the customer is never charged more than what the ledger shows.
    try {
      // If the entire amount is covered by credits, skip Razorpay
      if (totalPrice <= 0) {
        // Deduct credits now (payment is fully covered, no Razorpay needed)
        if (creditsToDeduct > 0 && payload?.userId) {
          await prisma.rewardCredit.create({
            data: {
              userId: payload.userId,
              amount: -creditsToDeduct,
              source: 'USED_FOR_BOOKING'
            }
          });
        }
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'CONFIRMED' }
        });
        await invalidateAvailabilityCache(roomId);
        return c.json({ ...booking, orderId: null, paidByCredits: true, referenceNumber });
      }

      const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${c.env.RAZORPAY_KEY_ID}:${c.env.RAZORPAY_KEY_SECRET}`)}`
        },
        body: JSON.stringify({
          amount: Math.round(totalPrice * 100), // totalPrice is already finalAmount (post-discount+credits)
          currency: 'INR',
          receipt: referenceNumber
        })
      });
      
      const order = await rzpResponse.json();
      if (!order.id) {
        console.error("Razorpay Error:", order);
        throw new Error(order.error?.description || 'Razorpay order creation failed');
      }

      // Return orderId AND creditsToDeduct so the verify-payment endpoint
      // can safely deduct credits ONLY after payment signature is confirmed.
      await invalidateAvailabilityCache(roomId);
      return c.json({ ...booking, orderId: order.id, creditsToDeduct, referenceNumber });
    } catch (rzpErr) {
      // If Razorpay fails, release the held room reservation — credits are NOT touched
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
    if (err.message.startsWith('KYC_REQUIRED:')) {
      return c.json({ error: err.message.split(':')[1].trim() }, 403);
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
    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      include: { 
        resort: { include: { owner: { include: { user: true } } } }, 
        user: true 
      }
    });

    if (!currentBooking) {
      return c.json({ error: "Booking not found" }, 404);
    }

    if (currentBooking.status === 'CANCELLED') {
      return c.json({ error: "Booking is already cancelled" }, 400);
    }

    // Automated Refund Calculation based on Cancellation Policy
    let refundAmount = 0;
    const hoursToStay = (new Date(currentBooking.checkIn).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    
    if (hoursToStay >= 168) { // 7 days
      refundAmount = currentBooking.totalPrice; // 100% refund
    } else if (hoursToStay >= 48) { // 48 hours
      refundAmount = currentBooking.totalPrice * 0.5; // 50% refund
    } else {
      refundAmount = 0; // 0% refund
    }

    // Trigger Razorpay Refund API
    let refundId = null;
    if (refundAmount > 0 && currentBooking.razorpayPaymentId) {
      try {
        const { processRefund } = await import('../../services/payments/refund.service.js');
        const refundResult = await processRefund(c, currentBooking.razorpayPaymentId, refundAmount);
        refundId = refundResult.id;
        console.log(`[Refund] Auto-processed Razorpay refund ${refundId} for booking ${id}. Amount: ${refundAmount}`);
      } catch (err) {
        console.error("[Refund] Auto-refund failed:", err);
      }
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      // Invalidate Availability Cache
      // await invalidateAvailabilityCache(currentBooking.roomId);
      include: { resort: { include: { owner: { include: { user: true } } } }, user: true }
    });

    await invalidateAvailabilityCache(booking.roomId);

    c.executionCtx.waitUntil(
      prisma.notification.create({
        data: {
          userId: booking.userId,
          title: 'Booking Cancelled',
          message: `Your booking at ${booking.resort.name} has been cancelled successfully. Refund initiated: ₹${refundAmount}`,
          type: 'booking'
        }
      }).catch(err => console.error("Async cancel notification failed:", err))
    );

    // Notify Owner of Cancellation
    if (booking.resort?.owner?.user) {
      const ownerUser = booking.resort.owner.user;
      const { sendNotification } = await import('../../services/notification.service.js').catch(() => null) || {};
      
      if (sendNotification) {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>⚠ Booking Cancelled</h2>
            <p><strong>Guest Name:</strong> ${booking.user.name}</p>
            <p><strong>Booking ID:</strong> ${booking.referenceNumber}</p>
            <p><strong>Refund Status:</strong> Auto-processed ₹${refundAmount}</p>
            <p>Room inventory has been automatically released.</p>
          </div>
        `;

        c.executionCtx.waitUntil(
          sendNotification(prisma, {
            userId: ownerUser.id,
            userEmail: ownerUser.email,
            title: `⚠ Booking Cancelled - ${booking.referenceNumber}`,
            message: `${booking.user.name} has cancelled their booking. Room inventory has been released.`,
            type: 'BOOKING_CANCELLED',
            sendEmail: true,
            emailSubject: `Booking Cancelled - ${booking.referenceNumber}`,
            emailHtml: htmlContent,
            env: c.env,
            ctx: c.executionCtx
          }).catch(err => console.error("Owner cancel notification failed:", err))
        );
      }
    }

    return c.json({ ...booking, refundAmount, refundId });
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
        adminId: payload.userId || 'system',
        action: 'QR_GENERATED',
        details: { entityType: 'BOOKING', entityId: booking.id, info: 'QR pass generated for booking' }
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

export const validateBookingQR = async (c) => {
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

    if (payload.role !== 'ADMIN') {
      const owner = await prisma.resortOwner.findUnique({ where: { userId: payload.userId } });
      const staff = await prisma.staffMember.findUnique({ where: { userId: payload.userId } });
      
      const isOwner = owner && booking.resort.ownerId === owner.id;
      const isStaff = staff && staff.resortId === booking.resortId;

      if (!isOwner && !isStaff) {
        await prisma.auditLog.create({
          data: {
            adminId: payload.userId || 'system',
            action: 'UNAUTHORIZED_RESORT_SCAN',
            details: { bookingId: booking.id, resortId: booking.resortId, error: 'User attempted to scan QR for a resort they do not own' }
          }
        });
        return c.json({ error: 'Unauthorized check-in attempt.' }, 403);
      }
    }

    if (booking.status === 'CANCELLED') {
      return c.json({ error: 'This Stay Pass is no longer valid.' }, 400);
    }

    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(14, 0, 0, 0);
    const validFrom = new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000);
    const checkOutDate = new Date(booking.checkOut);
    checkOutDate.setHours(11, 0, 0, 0);

    if (now > checkOutDate) {
      return c.json({ error: 'This Stay Pass is no longer valid.' }, 400);
    }

    if (now < validFrom) {
      return c.json({ 
        error: 'Check-In not yet available.',
        validFrom: validFrom.toISOString()
      }, 400);
    }

    if (booking.status === 'CHECKED_IN') {
      return c.json({ error: 'Guest is already checked in.' }, 400);
    }

    return c.json({
      token,
      guestName: booking.user.name,
      bookingId: booking.id,
      resortName: booking.resort.name,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      status: booking.status
    });
  } catch (err) {
    logSecureError('Failed to validate QR', err);
    return c.json({ error: 'Failed to process QR validation' }, 500);
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

    if (payload.role !== 'ADMIN') {
      const owner = await prisma.resortOwner.findUnique({ where: { userId: payload.userId } });
      const staff = await prisma.staffMember.findUnique({ where: { userId: payload.userId } });
      
      const isOwner = owner && booking.resort.ownerId === owner.id;
      const isStaff = staff && staff.resortId === booking.resortId;

      if (!isOwner && !isStaff) {
        await prisma.auditLog.create({
          data: {
            adminId: payload.userId || 'system',
            action: 'UNAUTHORIZED_RESORT_SCAN',
            details: { bookingId: booking.id, resortId: booking.resortId, error: 'User attempted to scan QR for a resort they do not own' }
          }
        });
        return c.json({ error: 'Unauthorized check-in attempt.' }, 403);
      }
    }

    if (booking.status === 'CANCELLED') {
      await prisma.auditLog.create({
        data: { adminId: payload.userId || 'system', action: 'QR_SCAN_FAILED', details: { entityType: 'BOOKING', entityId: booking.id, error: 'Cancelled booking scan attempt' } }
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
        data: { adminId: payload.userId || 'system', action: 'QR_SCAN_FAILED', details: { entityType: 'BOOKING', entityId: booking.id, error: 'Expired booking scan attempt' } }
      });
      return c.json({ error: 'This Stay Pass is no longer valid.' }, 400);
    }

    if (now < validFrom) {
      await prisma.auditLog.create({
        data: { adminId: payload.userId || 'system', action: 'EARLY_SCAN_ATTEMPT', details: { entityType: 'BOOKING', entityId: booking.id, error: 'Early scan attempt blocked' } }
      });
      return c.json({ 
        error: 'Check-In not yet available.',
        validFrom: validFrom.toISOString()
      }, 400);
    }

    if (booking.status === 'CHECKED_IN') {
      await prisma.auditLog.create({
        data: { adminId: payload.userId || 'system', action: 'DUPLICATE_SCAN_ATTEMPT', details: { entityType: 'BOOKING', entityId: booking.id, error: 'Duplicate scan attempt' } }
      });
      return c.json({ error: 'Guest is already checked in.' }, 400);
    }

    // Mark as checked in
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CHECKED_IN' }
    });

    await prisma.auditLog.create({
      data: { adminId: payload.userId || 'system', action: 'CHECK_IN_COMPLETED', details: { entityType: 'BOOKING', entityId: booking.id, info: 'QR Check-In successful' } }
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

export const getQRScanHistory = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const userId = c.get('userId');
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { resortOwner: true } });
    if (!user) return c.json({ error: 'User not found' }, 404);

    let resortIds = [];
    if (user.role === 'ADMIN') {
      const resorts = await prisma.resort.findMany({ select: { id: true } });
      resortIds = resorts.map(r => r.id);
    } else if (user.resortOwner) {
      const resorts = await prisma.resort.findMany({ where: { ownerId: user.resortOwner.id }, select: { id: true } });
      resortIds = resorts.map(r => r.id);
    } else {
      return c.json({ history: [] });
    }

    const recentCheckIns = await prisma.auditLog.findMany({
      where: {
        action: 'CHECK_IN_COMPLETED',
        details: { path: ['resortId'], array_contains: resortIds } // Simplified search for json, wait no, just fetch recent and filter or fetch recent bookings
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    // It's much easier to query the Booking table directly for recently CHECKED_IN bookings for these resorts
    const recentBookings = await prisma.booking.findMany({
      where: { resortId: { in: resortIds }, status: 'CHECKED_IN' },
      include: { user: { select: { name: true } }, resort: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    const history = recentBookings.map(b => ({
      guestName: b.guestName || b.user?.name || 'Guest',
      bookingId: b.referenceNumber || b.id,
      time: b.updatedAt,
      status: b.status,
      resortName: b.resort.name
    }));

    return c.json({ history });
  } catch (err) {
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
};



export const getBookingQR = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  const bookingId = c.req.param('id');
  
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: payload.userId }
    });

    if (!booking) return c.json({ error: "Booking not found" }, 404);
    if (booking.status !== 'CONFIRMED' && booking.status !== 'CHECKED_IN') {
      return c.json({ error: "Booking must be confirmed to generate QR" }, 400);
    }

    const token = jwt.sign(
      { bookingId: booking.id, purpose: 'STAY_PASS' }, 
      c.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return c.json({ token, bookingId });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
};

export const getQRScanHistory = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const payload = c.get('user');

  try {
    const owner = await prisma.resortOwner.findUnique({ where: { userId: payload.userId }});
    if(!owner) return c.json({ error: "Unauthorized" }, 403);

    const recentCheckins = await prisma.booking.findMany({
      where: {
        resort: { ownerId: owner.id },
        status: 'CHECKED_IN'
      },
      include: {
        user: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    const history = recentCheckins.map(b => ({
      guestName: b.user?.name || 'Unknown',
      bookingId: b.referenceNumber || b.id,
      time: b.updatedAt,
      status: 'Checked In'
    }));

    return c.json({ history });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
};

export const validateBookingQR = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  const { token } = await c.req.json();

  try {
    const decoded = jwt.verify(token, c.env.JWT_SECRET);
    if (decoded.purpose !== 'STAY_PASS') throw new Error("Invalid token purpose");

    const owner = await prisma.resortOwner.findUnique({ where: { userId: payload.userId }});
    if(!owner) return c.json({ error: "Unauthorized" }, 403);

    const booking = await prisma.booking.findUnique({
      where: { id: decoded.bookingId },
      include: {
        user: { select: { name: true } },
        resort: { select: { ownerId: true, name: true } },
        room: { select: { name: true } }
      }
    });

    if (!booking) return c.json({ error: "Booking not found" }, 404);
    if (booking.resort.ownerId !== owner.id) return c.json({ error: "Unauthorized Resort Access" }, 403);
    
    if (booking.status === 'CHECKED_IN') return c.json({ error: "Already Checked In" }, 409);
    if (booking.status !== 'CONFIRMED') return c.json({ error: "Booking is not confirmed" }, 400);

    return c.json({
      token,
      guestName: booking.user?.name,
      bookingId: booking.referenceNumber || booking.id,
      resortName: booking.resort.name,
      roomType: booking.room?.name,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      status: booking.status
    });
  } catch (err) {
    return c.json({ error: "Invalid Stay Pass" }, 400);
  }
};

export const scanBookingQR = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  const { token } = await c.req.json();

  try {
    const decoded = jwt.verify(token, c.env.JWT_SECRET);
    
    const owner = await prisma.resortOwner.findUnique({ where: { userId: payload.userId }});
    if(!owner) return c.json({ error: "Unauthorized" }, 403);

    const booking = await prisma.booking.findUnique({
      where: { id: decoded.bookingId },
      include: { resort: { select: { ownerId: true } } }
    });

    if (!booking) return c.json({ error: "Booking not found" }, 404);
    if (booking.resort.ownerId !== owner.id) return c.json({ error: "Unauthorized Resort Access" }, 403);
    if (booking.status === 'CHECKED_IN') return c.json({ error: "Already Checked In" }, 409);

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CHECKED_IN' }
    });

    try {
      await prisma.auditLog.create({
        data: {
          adminId: payload.userId,
          action: 'QR_CHECK_IN',
          details: { bookingId: booking.id, ownerId: owner.id }
        }
      });
    } catch(e) {}

    return c.json({ success: true, bookingId: updated.referenceNumber || updated.id });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
};
