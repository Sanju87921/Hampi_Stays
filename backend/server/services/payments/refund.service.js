export const processRefund = async (c, paymentId, amount) => {
  // Stub for processing a refund via Razorpay
  const rzpResponse = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${c.env.RAZORPAY_KEY_ID}:${c.env.RAZORPAY_KEY_SECRET}`)}`
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100)
    })
  });
  
  const refund = await rzpResponse.json();
  if (refund.error) {
    throw new Error(refund.error.description || 'Refund failed');
  }
  return refund;
};
