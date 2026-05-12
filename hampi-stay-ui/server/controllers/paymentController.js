import crypto from 'crypto';
import Razorpay from 'razorpay';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createOrder = async (req, res, next) => {
  try {
    const { 
      resortId, 
      roomId, 
      checkIn, 
      checkOut, 
      guests, 
      addInsurance, 
      airportPickup 
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
    
    const totalPrice = nightsTotal + taxes + insuranceCost + airportPickupCost;
    const referenceNumber = `HS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // 2. Create Razorpay Order
    const options = {
      amount: Math.round(totalPrice * 100),
      currency: "INR",
      receipt: referenceNumber,
    };
    
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
        totalPrice,
        referenceNumber,
        commissionRate: resort.commissionRate,
        status: 'PENDING'
      }
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      referenceNumber,
      bookingId: booking.id
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

    // 3. Notify User
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
