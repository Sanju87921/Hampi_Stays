import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, MapPin, Download, Clock,
  Star, XCircle, ChevronRight, Sparkles,
  Navigation, CheckCircle2, History
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { apiClient } from "../../utils/apiClient";
import type { Booking } from "../../types/booking";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as QRCode from "qrcode";


export function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showReview, setShowReview] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiClient.get<Booking[]>(`/users/bookings`);
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
    
    // Pulse: Refresh bookings every 30 seconds for real-time status updates
    const pulse = setInterval(fetchBookings, 30000);
    return () => clearInterval(pulse);
  }, [fetchBookings]);
 
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcoming = bookings.filter(b => {
    const checkInDate = new Date(b.checkIn);
    const checkInStart = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    return checkInStart >= startOfToday && b.status !== "CANCELLED";
  });
  
  const completed = bookings.filter(b => {
    const checkOutDate = new Date(b.checkOut);
    const checkOutStart = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
    return checkOutStart < startOfToday && b.status !== "CANCELLED";
  });

  const cancelled = bookings.filter(b => b.status === "CANCELLED");

  const tabData = { upcoming, completed, cancelled };
  const displayBookings = tabData[activeTab];

  // Helper to calculate days until stay
  const getDaysUntil = (checkIn: string) => {
    const diff = new Date(checkIn).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking? This cannot be undone.")) return;
    setCancellingId(bookingId);
    try {
      await apiClient.patch(`/bookings/${bookingId}/cancel`);
      alert("Booking cancelled successfully.");
      await fetchBookings();
      setActiveTab("cancelled");
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || "Failed to cancel booking. Please try again."}`);
    } finally {
      setCancellingId(null);
    }
  };

  const handleReview = async (resortId: string) => {
    try {
      await apiClient.post('/reviews', {
        userId: user?.id,
        resortId,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      setShowReview(null);
      setReviewData({ rating: 5, comment: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadConfirmation = async (booking: Booking) => {
    const doc = new jsPDF();
    const safeRef = booking.referenceNumber || `HS-${Math.random().toString(36).toUpperCase().substring(2, 10)}`;
    const issueDate = new Date().toLocaleDateString("en-GB");
    
    // Brand Colors
    const navy: [number, number, number] = [10, 15, 30];   // #0A0F1E
    const gold: [number, number, number] = [184, 134, 11]; // #B8860B
    const sand: [number, number, number] = [245, 245, 240]; // #F5F5F0
    
    // --- 1. PREMIUM HEADER ---
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Branding
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(28);
    doc.text("HAMPISTAYS", 15, 22);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text("LUXURY ECO-HOSPITALITY | HAMPI, INDIA", 15, 28);

    // Confirmation Header
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OFFICIAL CONFIRMATION", 195, 18, { align: 'right' });
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Ref: ${safeRef}`, 195, 24, { align: 'right' });
    doc.text(`Date: ${issueDate}`, 195, 29, { align: 'right' });

    // --- 2. LUXURY BORDER & TITLE ---
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 50, 195, 50);

    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont("times", "bolditalic");
    doc.setFontSize(18);
    doc.text("Your Royal Retreat is Confirmed", 105, 62, { align: 'center' });

    // --- 3. TWO-COLUMN DETAILS SECTION ---
    let currentY = 75;
    
    // Column 1: Guest & Booking
    doc.setFillColor(sand[0], sand[1], sand[2]);
    doc.rect(15, currentY, 85, 35, 'F');
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("GUEST & BOOKING", 20, currentY + 8);
    
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(user?.name || 'Guest', 20, currentY + 16);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Status: ${booking.status.toUpperCase()}`, 20, currentY + 22);
    doc.text(`Reference: ${safeRef}`, 20, currentY + 28);

    // Column 2: Accommodation
    doc.setFillColor(sand[0], sand[1], sand[2]);
    doc.rect(110, currentY, 85, 35, 'F');
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("ACCOMMODATION", 115, currentY + 8);
    
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(booking.resort?.name || 'HampiStays Resort', 115, currentY + 16);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24));
    doc.text(booking.room?.name || 'Standard Room', 115, currentY + 22);
    doc.text(`${nights} Night(s) Stay`, 115, currentY + 28);

    // --- 4. STAY SUMMARY TABLE ---
    currentY += 45;
    autoTable(doc, {
      startY: currentY,
      head: [['CHECK-IN', 'CHECK-OUT', 'GUESTS', 'TOTAL PAID']],
      body: [[
        `${new Date(booking.checkIn).toLocaleDateString("en-GB")}\n14:00 PM`,
        `${new Date(booking.checkOut).toLocaleDateString("en-GB")}\n11:00 AM`,
        `${booking.guests} Adult(s)`,
        `INR ${booking.totalPrice?.toLocaleString("en-IN")}`
      ]],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 6, halign: 'center' },
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: navy, 
        fontStyle: 'bold', 
        fontSize: 8,
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      bodyStyles: { textColor: navy, fontStyle: 'bold', fontSize: 11 },
      margin: { left: 15, right: 15 },
    });

    // --- 5. IMPORTANT INFO & QR (SIDE-BY-SIDE) ---
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setDrawColor(230, 230, 230);
    doc.rect(15, currentY, 180, 55);

    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text("Essential Information", 22, currentY + 10);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const infoPoints = [
      "• Present a valid Govt ID (Aadhar/Passport) at check-in.",
      "• Cancellation: Free up to 48 hours prior to arrival.",
      "• HampiStays is a plastic-free sanctuary.",
      "• Standard Check-in 2 PM | Check-out 11 AM."
    ];
    infoPoints.forEach((point, i) => {
      doc.text(point, 22, currentY + 18 + (i * 6));
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("SCAN TO VERIFY", 165, currentY + 10, { align: 'center' });
    
    try {
      const qrUrl = `${window.location.origin}/dashboard/bookings`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, { 
        margin: 1, 
        width: 200, 
        color: { dark: '#0A0F1E', light: '#FFFFFF' },
        errorCorrectionLevel: 'H'
      });
      doc.addImage(qrCodeDataUrl, 'PNG', 150, currentY + 13, 30, 30);
    } catch (err) {
      console.error("QR Generation failed", err);
    }

    // --- 6. LUXURY FOOTER ---
    const footerY = 270;
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.1);
    doc.line(40, footerY, 170, footerY);

    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.text("We look forward to welcoming you to the heart of Hampi's heritage.", 105, footerY + 8, { align: 'center' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("Main Road, Hampi, Karnataka 583239 | +91 99000 88000 | help@hampistays.com", 105, footerY + 14, { align: 'center' });

    doc.save(`HampiStays_Confirmation_${safeRef}.pdf`);
  };

  return (
    <div className="min-h-screen bg-sand-50/30 pt-20 pb-24">
      {/* Cinematic Hero Section */}
      <section className="relative h-[35vh] flex items-center mb-12 overflow-hidden bg-navy-950">
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover"
            alt="Hampi landscape"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-sand-50/30 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-gold-400" />
              <span className="text-xs font-bold text-gold-400 uppercase tracking-[0.3em]">Your Journey Collection</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-white mb-4">
              My <span className="italic text-gold-400 font-normal">Hampi</span> Escapes
            </h1>
            <p className="text-white/60 text-lg max-w-xl font-light">
              Relive your memories and prepare for your next immersive stay in the heart of the ruins.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-sand-100 shadow-sm w-fit">
            {(["upcoming", "completed", "cancelled"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-8 py-3 rounded-xl text-sm font-bold capitalize transition-all flex items-center gap-2",
                  activeTab === tab
                    ? "bg-navy-950 text-white shadow-xl scale-105"
                    : "text-navy-950/40 hover:text-navy-950"
                )}
              >
                {tab === 'upcoming' && <Calendar className="w-4 h-4" />}
                {tab === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                {tab === 'cancelled' && <History className="w-4 h-4" />}
                {tab}
                <span className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-md text-[10px]",
                  activeTab === tab ? "bg-white/20" : "bg-sand-100"
                )}>
                  {tabData[tab].length}
                </span>
              </button>
            ))}
          </div>

          <Link to="/resorts" className="text-sm font-bold text-navy-950 hover:text-gold-600 flex items-center gap-2 group transition-colors">
            Book another stay
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-navy-950/40 font-medium animate-pulse">Retrieving your itineraries...</p>
          </div>
        ) : displayBookings.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {displayBookings.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-white rounded-[3rem] border border-sand-100 overflow-hidden shadow-sm hover:shadow-luxury transition-all duration-500 flex flex-col lg:flex-row"
              >
                {/* Photo Section */}
                <div className="w-full lg:w-96 h-64 lg:h-auto overflow-hidden shrink-0 relative">
                  <img
                    src={booking.resort?.images?.[0] || 'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=1000'}
                    alt={booking.resort?.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent opacity-60" />

                  {/* Status Badge Over Image */}
                  <div className="absolute top-6 left-6">
                    <span className={cn(
                      "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-md border border-white/20 text-white",
                      booking.status === "CONFIRMED" ? "bg-emerald-500/80" :
                        booking.status === "CANCELLED" ? "bg-red-500/80" :
                          "bg-gold-500/80"
                    )}>
                      {booking.status}
                    </span>
                  </div>

                  {activeTab === 'upcoming' && (
                    <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Your journey starts in</p>
                      <p className="text-white text-xl font-serif font-bold">
                        {getDaysUntil(booking.checkIn) <= 0 ? "Today!" : `${getDaysUntil(booking.checkIn)} Days`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="p-8 lg:p-12 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-gold-600">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold uppercase tracking-wider">{booking.resort?.locationArea}, Hampi</span>
                        </div>
                        <h3 className="text-3xl font-serif font-bold text-navy-950 mb-2">{booking.resort?.name}</h3>
                        <p className="text-navy-950/50 text-sm font-medium">Booking Ref: <span className="font-mono text-gold-600 font-bold">{booking.referenceNumber}</span></p>
                      </div>
                      <div className="text-left md:text-right p-6 bg-sand-50 rounded-3xl border border-sand-100 min-w-[160px]">
                        <p className="text-2xl font-serif font-bold text-navy-950">₹{booking.totalPrice?.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest">Total Investment</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-navy-950" />
                        </div>
                        <div>
                          <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Check-in</p>
                          <p className="font-bold text-navy-950">{new Date(booking.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5 text-navy-950" />
                        </div>
                        <div>
                          <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Check-out</p>
                          <p className="font-bold text-navy-950">{new Date(booking.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center shrink-0">
                          <Navigation className="w-5 h-5 text-navy-950" />
                        </div>
                        <div>
                          <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Resort Type</p>
                          <p className="font-bold text-navy-950">{booking.resort?.type || 'Eco-Luxury'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-sand-100">
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" className="px-6 rounded-2xl gap-2 border-sand-200 hover:bg-sand-50" onClick={() => handleDownloadConfirmation(booking)}>
                        <Download className="w-4 h-4" />
                        Download Confirmation
                      </Button>
                      
                      {activeTab === "upcoming" && (
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${booking.resort?.locationLat},${booking.resort?.locationLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" className="px-6 rounded-2xl gap-2 border-gold-200 text-gold-700 hover:bg-gold-50">
                            <MapPin className="w-4 h-4" />
                            Get Directions
                          </Button>
                        </a>
                      )}

                      {activeTab === "upcoming" && (
                        <Button
                          variant="outline"
                          className="px-6 rounded-2xl gap-2 border-red-100 text-red-600 bg-red-50/30 hover:bg-red-50 hover:border-red-200"
                          isLoading={cancellingId === booking.id}
                          onClick={() => handleCancel(booking.id)}
                        >
                          <XCircle className="w-4 h-4" /> Cancel
                        </Button>
                      )}

                      {activeTab === "completed" && (
                        <Button
                          className="px-8 rounded-2xl gap-2 bg-gold-500 text-navy-950 shadow-gold"
                          onClick={() => setShowReview(booking.resortId)}
                        >
                          <Star className="w-4 h-4 fill-current" /> Share Feedback
                        </Button>
                      )}
                    </div>

                    <Link to={`/resorts/${booking.resort?.slug}`} className="text-sm font-bold text-gold-600 hover:text-gold-700 flex items-center gap-2">
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[4rem] p-24 text-center border border-sand-100 shadow-sm max-w-3xl mx-auto overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="w-24 h-24 bg-sand-50 rounded-3xl flex items-center justify-center mx-auto mb-8 transform rotate-12">
              <Calendar className="w-12 h-12 text-navy-950/10" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-navy-950 mb-4">Your journey map is empty</h2>
            <p className="text-navy-950/60 mb-12 text-lg max-w-md mx-auto">
              {activeTab === "upcoming"
                ? "No upcoming escapes found. Every ruins visit begins with a single booking."
                : "Your past travels will be preserved here as memories."}
            </p>
            {activeTab === "upcoming" && (
              <Link to="/resorts">
                <Button size="lg" className="rounded-2xl px-16 py-8 text-lg shadow-gold">Discover Resorts</Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Luxury Review Modal */}
      <AnimatePresence>
        {showReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-md"
              onClick={() => setShowReview(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[3.5rem] p-10 md:p-14 max-w-xl w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />

              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-50 rounded-2xl mb-6">
                  <Star className="w-8 h-8 text-gold-500 fill-current" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-navy-950 mb-3">Rate Your Escape</h2>
                <p className="text-navy-950/50">Your feedback helps us curate the best of Hampi.</p>
              </div>

              <div className="flex justify-center gap-4 mb-10">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewData(p => ({ ...p, rating: star }))}
                    className="group"
                  >
                    <Star
                      className={cn(
                        "w-12 h-12 transition-all duration-300",
                        reviewData.rating >= star
                          ? "fill-gold-400 text-gold-400 scale-125 filter drop-shadow-gold"
                          : "text-sand-200 group-hover:text-gold-200"
                      )}
                    />
                  </button>
                ))}
              </div>

              <div className="space-y-2 mb-10">
                <label className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest ml-1">Your Message</label>
                <textarea
                  rows={4}
                  placeholder="Tell us about the service, the ruins, and your stay..."
                  value={reviewData.comment}
                  onChange={e => setReviewData(p => ({ ...p, comment: e.target.value }))}
                  className="w-full p-6 rounded-[2rem] border border-sand-200 bg-sand-50/50 text-base resize-none outline-none focus:ring-4 focus:ring-gold-500/10 focus:border-gold-400 transition-all"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <Button variant="outline" className="flex-1 h-16 rounded-2xl text-base" onClick={() => setShowReview(null)}>
                  Maybe Later
                </Button>
                <Button className="flex-1 h-16 rounded-2xl text-base shadow-gold" onClick={() => handleReview(showReview)}>
                  Submit Experience
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

