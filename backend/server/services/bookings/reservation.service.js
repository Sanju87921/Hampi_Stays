export const createPendingReservation = async (tx, payload) => {
  return await tx.booking.create({
    data: {
      userId: payload.userId,
      resortId: payload.resortId,
      roomId: payload.roomId,
      checkIn: payload.startDate,
      checkOut: payload.endDate,
      guests: payload.guests,
      totalPrice: payload.finalAmount,
      specialRequests: payload.finalSpecialRequests,
      referenceNumber: payload.refNum,
      commissionRate: payload.commissionRate,
      status: 'PENDING'
    }
  });
};
