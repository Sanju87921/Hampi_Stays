export const checkRoomAvailability = async (tx, roomId, startDate, endDate, roomCount) => {
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  const overlappingBookings = await tx.booking.findMany({
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

  const overlappingBlockings = await tx.roomBlocking.findMany({
    where: {
      roomId: roomId,
      date: { gte: startDate, lt: endDate }
    },
    select: { date: true }
  });

  let maxDailyUsage = 0;
  let currDate = new Date(startDate);
  while (currDate < endDate) {
    let dailyUsage = 0;
    
    for (const b of overlappingBookings) {
      if (new Date(b.checkIn) <= currDate && new Date(b.checkOut) > currDate) {
        dailyUsage++;
      }
    }
    
    for (const blk of overlappingBlockings) {
      if (new Date(blk.date).getTime() === currDate.getTime()) {
        dailyUsage++;
      }
    }
    
    if (dailyUsage > maxDailyUsage) maxDailyUsage = dailyUsage;
    currDate.setDate(currDate.getDate() + 1);
  }

  if (maxDailyUsage >= roomCount) {
    throw new Error('ROOM_UNAVAILABLE');
  }
  return true;
};
