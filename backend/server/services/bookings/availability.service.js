export const checkRoomAvailability = async (tx, roomId, startDate, endDate, roomCount) => {
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

  if (overlappingBookings >= roomCount) {
    throw new Error('ROOM_UNAVAILABLE');
  }
  return true;
};
