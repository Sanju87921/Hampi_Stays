export const generateInvoice = async (bookingDetails) => {
  // Stub for invoice generation logic
  // Returns a formatted invoice payload or triggers PDF generation
  return {
    invoiceId: `INV-${Date.now()}`,
    amount: bookingDetails.amount,
    date: new Date().toISOString(),
    status: 'GENERATED'
  };
};
