import React, { useState } from 'react';
import { Tag, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { trackFrontendEvent } from '../../utils/analytics';

interface CheckoutCouponProps {
  resortId: string;
  totalAmount: number;
  onValidationSuccess: (discountAmt: number, finalAmount: number, code: string) => void;
}

export const CheckoutCoupon = ({ resortId, totalAmount, onValidationSuccess }: CheckoutCouponProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code, resortId, totalAmount })
      });

      const result = await res.json();

      if (result.success) {
        setSuccessMsg(`Coupon applied! You saved ₹${result.data.discountAmt}`);
        onValidationSuccess(result.data.discountAmt, result.data.finalAmount, result.data.code);
        trackFrontendEvent('coupon_applied_success', { code, discount: result.data.discountAmt });
      } else {
        setError(result.error || 'Invalid coupon code');
        trackFrontendEvent('coupon_applied_error', { code, error: result.error });
      }
    } catch (err) {
      setError('Failed to validate coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white  border border-[#C5A059]/20 p-6 rounded-2xl backdrop-blur-md">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-[#C5A059]" />
        Have a Promo Code?
      </h3>
      
      <div className="flex gap-3">
        <input 
          type="text" 
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code (e.g. LUXESTAY15)"
          className="flex-1 bg-[#0A1128]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] uppercase transition-colors"
          disabled={loading || !!successMsg}
        />
        <button 
          onClick={handleApply}
          disabled={!code || loading || !!successMsg}
          className="bg-[#C5A059] text-[#0A1128] font-bold px-6 py-3 rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply'}
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mt-3 flex items-center gap-2 text-green-400 text-sm bg-green-500/10 p-3 rounded-lg border border-green-500/20">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}
    </div>
  );
};
