import crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '../utils/prisma.js';
import { validateCouponCode } from '../utils/couponEngine.js';

let razorpayInstance = null;
const getRazorpay = () => {
  if (razorpayInstance) return razorpayInstance;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("WARNING: Razorpay keys are not configured in the environment.");
    return null;
  }
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  return razorpayInstance;
};

export const createOrder = async (req, res, next) => {
  try {
    const { 
      resortId, 
      roomId, 
      checkIn, 
      checkOut, 
      guests, 
      addInsurance, 
      airportPickup,
      selectedMeals,
      specialRequests,
      couponCode
    } = req.body;
    
    // 1. RECALCULATE PRICE ON BACKEND (Security: Never trust frontend price)
    const resort = await prisma.resort.findUnique({ 
      where: { id: resortId },
      include: { roomTypes: true }
    });
    
    if (!resort) return res.status(404).json({ error: 'Resort not found' });
    
    const room = resort.roomTypes.find(r => r.id === roomId);
    if (!room) return res.status(404).json({ error: 'Room type not found' });

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return res.status(400).json({ error: 'Invalid dates' });

    // Precise matching with frontend logic in CheckoutPage.tsx
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
    
    const totalPrice = nightsTotal + taxes + insuranceCost + airportPickupCost + mealTotal + mealTaxes;

    // Secure Coupon Discount Calculation on Backend
    let discountAmount = 0;
    let finalAmount = totalPrice;
    if (couponCode) {
      const couponResult = await validateCouponCode(prisma, {
        code: couponCode,
        userId: req.user.userId,
        resortId,
        originalAmount: totalPrice
      });

      if (!couponResult.valid) {
        return res.status(400).json({ error: couponResult.error });
      }

      discountAmount = couponResult.discountAmount;
      finalAmount = couponResult.finalAmount;
    }

    const referenceNumber = `HS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Format special requests to store selected meals in DB
    let formattedSpecialRequests = specialRequests || "";
    if (validatedMealDescriptions.length > 0) {
      const prefix = `[Selected Meals: ${validatedMealDescriptions.join("; ")}]`;
      formattedSpecialRequests = formattedSpecialRequests ? `${prefix} ${formattedSpecialRequests}` : prefix;
    }

    // 2. Create Razorpay Order
    const options = {
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      receipt: referenceNumber,
    };
    
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(500).json({ error: 'Razorpay integration is not configured on this server.' });
    }
    const order = await razorpay.orders.create(options);

    // 3. Create Pending Booking
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.userId,
        resortId,
        roomId,
        checkIn: startDate,
        checkOut: endDate,
        guests: Number(guests),
        totalPrice: finalAmount,
        originalAmount: totalPrice,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
        referenceNumber,
        commissionRate: resort.commissionRate,
        status: 'PENDING',
        specialRequests: formattedSpecialRequests
      }
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      referenceNumber,
      bookingId: booking.id,
      discountAmount,
      finalAmount,
      originalAmount: totalPrice
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, referenceNumber } = req.body;

    // 1. Strict Signature Verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // 2. Update Booking
    const booking = await prisma.booking.update({
      where: { referenceNumber },
      data: { status: 'CONFIRMED' },
      include: { resort: true }
    });

    // 3. Increment coupon usage count securely
    if (booking.couponCode) {
      await prisma.coupon.update({
        where: { code: booking.couponCode },
        data: { usedCount: { increment: 1 } }
      }).catch(err => {
        console.error("Failed to increment coupon used count:", err);
      });
    }

    // 4. Notify User
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Confirmed!',
        message: `Your booking at ${booking.resort.name} is confirmed. Ref: ${referenceNumber}`,
        type: 'booking'
      }
    });

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};
