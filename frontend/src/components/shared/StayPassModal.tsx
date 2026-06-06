import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, User, Compass, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "../ui/Button";

interface StayPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export function StayPassModal({ isOpen, onClose, booking }: StayPassModalProps) {
  if (!booking) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-md z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[100] px-4"
          >
            <div className="bg-navy-950 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gold-500/20">
              {/* Header */}
              <div className="bg-gradient-to-br from-gold-500 to-gold-400 p-6 text-center relative">
                <button 
                  onClick={onClose}
                  className="absolute top-6 right-6 w-8 h-8 bg-navy-950/10 hover:bg-navy-950/20 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-navy-950" />
                </button>
                <div className="w-16 h-16 mx-auto bg-navy-950 text-gold-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-gold-300/30">
                  <Compass className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-navy-950 mb-1">Digital Stay Pass</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-navy-950/70">Fast-Track Check-in</p>
              </div>

              {/* Body */}
              <div className="p-8 bg-white text-navy-950 relative">
                {/* Torn Ticket Effect Top */}
                <div className="absolute -top-3 left-0 w-full h-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjUiIGZpbGw9IiMwZjE3MmEiLz48L3N2Zz4=')] bg-repeat-x bg-[length:20px_20px]" />

                <div className="text-center mb-6 mt-2">
                  <h3 className="text-xl font-bold">{booking.resort?.name}</h3>
                  <p className="text-xs text-navy-950/50 uppercase tracking-widest font-bold mt-1 flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3 text-gold-500" /> {booking.resort?.locationArea || "Hampi, Karnataka"}
                  </p>
                </div>

                {/* QR Code Placeholder */}
                <div className="w-48 h-48 mx-auto bg-sand-50 rounded-2xl border-2 border-dashed border-sand-200 flex flex-col items-center justify-center mb-6 relative group overflow-hidden">
                  <QrCode className="w-32 h-32 text-navy-950/80 group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-b from-gold-500/20 to-transparent w-full h-1/2 -translate-y-full animate-[scan_2s_ease-in-out_infinite]" />
                </div>

                <div className="bg-sand-50 rounded-2xl p-4 border border-sand-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase font-bold text-navy-950/40">Ref Number</span>
                    <span className="font-mono font-bold text-sm">{booking.referenceNumber || "HAMP-8X92M"}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase font-bold text-navy-950/40">Check-in</span>
                    <span className="font-bold text-sm flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gold-500" /> 
                      {new Date(booking.checkIn).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-navy-950/40">Guests</span>
                    <span className="font-bold text-sm flex items-center gap-1">
                      <User className="w-3 h-3 text-gold-500" /> 
                      {booking.guests} Adults
                    </span>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="bg-navy-950 p-6 text-center border-t border-navy-800">
                <p className="text-xs text-sand-400 flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-gold-500" />
                  Show this pass at the reception desk
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
