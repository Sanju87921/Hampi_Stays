export const determineRefundPolicy = (booking, currentDate = new Date()) => {
  const checkInDate = new Date(booking.checkIn);
  const diffTime = checkInDate - currentDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays >= 7) return { refundType: 'FULL', amount: booking.totalPrice };
  if (diffDays >= 3) return { refundType: 'PARTIAL', amount: Math.round(booking.totalPrice * 0.5) };
  return { refundType: 'NONE', amount: 0 };
};
