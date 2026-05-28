export const verifyRazorpaySignature = async (crypto, body, secret) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`)
  );
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return expectedSignature === razorpay_signature;
};
