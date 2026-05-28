export const createRazorpayOrder = async (c, referenceNumber, amount) => {
  const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${c.env.RAZORPAY_KEY_ID}:${c.env.RAZORPAY_KEY_SECRET}`)}`
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: referenceNumber
    })
  });
  
  const order = await rzpResponse.json();
  if (!order.id) {
    throw new Error(order.error?.description || 'Razorpay order creation failed');
  }
  return order;
};
