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

// Integration for Automated Payouts (RazorpayX Fund Accounts)
export const createRazorpayPayout = async (c, { accountName, accountNumber, ifsc, amount, reference, purpose = 'payout' }) => {
  // To initiate a payout, first we'd typically create a contact, then a fund account, then issue the payout.
  // This function simulates the API payload for RazorpayX Payouts using the environment variables
  // Documentation: https://razorpay.com/docs/api/razorpayx/payouts/
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa(`${c.env.RAZORPAY_KEY_ID}:${c.env.RAZORPAY_KEY_SECRET}`)}`
  };

  // 1. Create Contact
  const contactRes = await fetch('https://api.razorpay.com/v1/contacts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: accountName,
      type: 'vendor',
      reference_id: reference
    })
  });
  const contact = await contactRes.json();
  if (!contact.id) throw new Error('Razorpay Payout Error: Failed to create contact');

  // 2. Create Fund Account
  const fundAccRes = await fetch('https://api.razorpay.com/v1/fund_accounts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contact_id: contact.id,
      account_type: 'bank_account',
      bank_account: {
        name: accountName,
        ifsc: ifsc,
        account_number: accountNumber
      }
    })
  });
  const fundAccount = await fundAccRes.json();
  if (!fundAccount.id) throw new Error('Razorpay Payout Error: Failed to create fund account');

  // 3. Initiate Payout
  const payoutRes = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      account_number: c.env.RAZORPAY_X_ACCOUNT_NUMBER || '7878780080316316',
      fund_account_id: fundAccount.id,
      amount: Math.round(amount * 100),
      currency: 'INR',
      mode: 'IMPS',
      purpose: purpose,
      queue_if_low_balance: true,
      reference_id: reference
    })
  });

  const payout = await payoutRes.json();
  if (!payout.id) throw new Error(payout.error?.description || 'Razorpay Payout Error: Failed to initiate payout');
  
  return payout;
};
