import { useModal } from "../../components/shared/ModalProvider";
import { useModal } from "../../components/shared/ModalProvider";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, MapPin, Download, Clock,
  Star, XCircle, ChevronRight, Sparkles,
  Navigation, CheckCircle2, History, QrCode, Loader2, ChevronLeft, Camera, Image as ImageIcon, X, Wallet, CreditCard
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { apiClient } from "../../utils/apiClient";
import type { Booking } from "../../types/booking";
import { applyPdfWatermark } from "../../utils/pdfWatermark";
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guide Chat Modal */}
      <AnimatePresence>
        {activeGuideChat && (
          <GuideChat 
            bookingId={activeGuideChat.id}
            guideName={activeGuideChat.guide?.user?.name || "Guide"}
            travellerName={user?.name || "Me"}
            onClose={() => setActiveGuideChat(null)}
          />
        )}
      </AnimatePresence>

      {/* Guide Stay Pass Modal */}
      <AnimatePresence>
        {activeGuidePassBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy-950/70 backdrop-blur-md"
              onClick={() => setActiveGuidePassBooking(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative bg-white rounded-[3.5rem] max-w-xl w-full shadow-2xl border border-sand-100 overflow-hidden z-10"
            >
              {/* Premium Header */}
              <div className="bg-navy-950 text-white p-8 relative overflow-hidden rounded-t-[3.5rem] border-b border-gold-500/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl -mr-12 -mt-12" />
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <h3 className="text-xl font-serif font-bold tracking-[0.1em] text-white">HAMPISTAYS</h3>
                    <p className="text-[9px] uppercase tracking-widest text-gold-400 font-bold">Local Guide Pass</p>
                  </div>
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    activeGuidePassBooking.status === "CHECKED_IN"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-gold-500/10 border-gold-500/30 text-gold-400"
                  )}>
                    {activeGuidePassBooking.status === "CHECKED_IN" ? "Checked In" : "Ready for Tour"}
                  </span>
                </div>
              </div>

              {/* Pass details */}
              <div className="p-8 md:p-10 space-y-8 bg-sand-50/20">
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-[2.5rem] border border-sand-100 shadow-inner">
                  {qrCodeUrl ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-white rounded-3xl border-2 border-navy-950/10 relative group"
                    >
                      <div className="absolute -inset-2 rounded-[2rem] bg-gold-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur" />
                      <img src={qrCodeUrl} alt="Contactless Check-In QR" className="w-48 h-48 relative z-10" />
                    </motion.div>
                  ) : (
                    <div className="w-48 h-48 bg-sand-50 rounded-3xl animate-pulse flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                    </div>
                  )}
                  <p className="text-xs font-mono font-bold text-navy-950 mt-4 tracking-wider uppercase">
                    Ref: <span className="text-gold-600">{activeGuidePassBooking.id.substring(0,8).toUpperCase()}</span>
                  </p>
                  <p className="text-[9px] text-navy-950/40 uppercase tracking-widest font-bold mt-1">Guide will scan this QR at rendezvous</p>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-[2.5rem] border border-sand-100">
                  <div>
                    <p className="text-[9px] text-navy-950/40 uppercase tracking-widest font-bold">Lead Traveler</p>
                    <p className="font-bold text-navy-950 text-sm mt-0.5">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-navy-950/40 uppercase tracking-widest font-bold">Local Guide</p>
                    <p className="font-bold text-navy-950 text-sm mt-0.5">{activeGuidePassBooking.guide?.user?.name}</p>
                  </div>
                  <div className="border-t border-sand-100 pt-4 col-span-2">
                    <p className="text-[9px] text-navy-950/40 uppercase tracking-widest font-bold">Meeting Point & Time</p>
                    <p className="font-bold text-navy-950 text-xs mt-0.5">
                      {activeGuidePassBooking.meetingPoint}
                    </p>
                    <p className="font-bold text-navy-950 text-xs mt-0.5">
                      {new Date(activeGuidePassBooking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "numeric" })}
                    </p>
                    <div className="mt-4 rounded-[1.5rem] overflow-hidden border border-sand-100 bg-sand-50 h-40">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        loading="lazy" 
                        allowFullScreen 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(activeGuidePassBooking.meetingPoint)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-sand-50 border-t border-sand-100 flex justify-end">
                <Button variant="outline" className="px-8 rounded-2xl text-xs font-bold" onClick={() => setActiveGuidePassBooking(null)}>
                  Close Guide Pass
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guide Review Modal */}
      <AnimatePresence>
        {activeReviewBooking && (
          <GuideReviewModal
            bookingId={activeReviewBooking.id}
            guideId={activeReviewBooking.guideId}
            guideName={activeReviewBooking.guide?.user?.name || 'Local Guide'}
            onClose={() => setActiveReviewBooking(null)}
            onSuccess={() => {
              setActiveReviewBooking(null);
              // Optimistically update UI or re-fetch
              fetchBookings();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


