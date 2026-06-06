import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Clock, CreditCard } from 'lucide-react';

interface TrustPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrustPolicyModal({ isOpen, onClose }: TrustPolicyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-luxury p-8 border border-sand-100 z-10 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-sand-100 text-navy-950/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-2xl font-serif font-bold text-navy-950 mb-6 text-center">
              Trust & Cancellation Policy
            </h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <ShieldCheck className="w-6 h-6 text-gold-600" />
                </div>
                <div>
                  <h4 className="font-bold text-navy-950 mb-1">100% Secure & KYC Verified</h4>
                  <p className="text-sm text-navy-950/70 leading-relaxed">
                    Every property on HampiStays is personally verified by our local experts. Your payment is held securely in escrow until your stay is confirmed.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <Clock className="w-6 h-6 text-gold-600" />
                </div>
                <div>
                  <h4 className="font-bold text-navy-950 mb-1">Flexible Cancellation</h4>
                  <p className="text-sm text-navy-950/70 leading-relaxed">
                    Full refund if cancelled up to 7 days before check-in. 50% refund for cancellations made 3-7 days prior. No refunds within 48 hours of check-in.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <CreditCard className="w-6 h-6 text-gold-600" />
                </div>
                <div>
                  <h4 className="font-bold text-navy-950 mb-1">Instant Refund Guarantee</h4>
                  <p className="text-sm text-navy-950/70 leading-relaxed">
                    In the rare event a property cannot honor your booking, we guarantee an instant 100% refund plus priority assistance in finding an alternative luxury stay.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-sand-100 text-center">
              <button
                onClick={onClose}
                className="w-full px-6 py-4 rounded-xl font-bold text-white bg-navy-900 hover:bg-navy-950 shadow-navy-900/20 transition-all shadow-lg text-sm"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
