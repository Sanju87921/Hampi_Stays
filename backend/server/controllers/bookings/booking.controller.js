import crypto from 'crypto';
import { Resend } from 'resend';
import { logSecureError, logSecureWarn, logSecureInfo } from '../../logging/logger.js';
import { validateCouponCode } from '../../utils/couponEngine.js';

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

      // Secure Coupon Discount Calculation on Backend
      let discountAmount = 0;
      let finalAmount = computedTotal;
      if (couponCode) {
        const couponResult = await validateCouponCode(tx, {
          code: couponCode,
          userId: payload.userId,
          resortId,
          originalAmount: computedTotal
        });

        if (!couponResult.valid) {
          throw new Error(`COUPON_INVALID:${couponResult.error}`);
        }

        discountAmount = couponResult.discountAmount;
        finalAmount = couponResult.finalAmount;
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
          status: 'PENDING'
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
  const { status } = await c.req.json();
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
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

