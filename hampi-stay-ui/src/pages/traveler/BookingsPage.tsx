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
import type { Booking } from "../../types/booking";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";


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
      const response = await fetch(`/api/users/${user.id}/bookings`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const now = new Date();
  const upcoming = bookings.filter(b => new Date(b.checkIn) >= now && b.status !== "CANCELLED");
  const completed = bookings.filter(b => new Date(b.checkOut) < now && b.status !== "CANCELLED");
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
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        alert("Booking cancelled successfully.");
        await fetchBookings();
        setActiveTab("cancelled");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to cancel booking");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || "Failed to cancel booking. Please try again."}`);
    } finally {
      setCancellingId(null);
    }
  };

  const handleReview = async (resortId: string) => {
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          resortId,
          rating: reviewData.rating,
          comment: reviewData.comment
        }),
      });
      if (response.ok) {
        setShowReview(null);
        setReviewData({ rating: 5, comment: "" });
        // In a real app, we'd update the booking record to show it's reviewed
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadInvoice = async (booking: Booking) => {
    const doc = new jsPDF();
    const safeRef = booking.referenceNumber || "HS-STAY";

    // Brand Colors
    const navy: [number, number, number] = [10, 15, 30];
    const gold: [number, number, number] = [184, 134, 11];

    // 1. Header
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setFillColor(gold[0], gold[1], gold[2]);
    doc.rect(0, 50, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("serif", "bold");
    doc.setFontSize(26);
    doc.text("HAMPISTAYS", 20, 30);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text("LUXURY ECO-HOSPITALITY", 20, 38);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("BOOKING INVOICE", 140, 25);
    doc.setFont("helvetica", "normal");
    doc.text(`REF: ${safeRef}`, 140, 31);
    doc.text(`ISSUED: ${new Date().toLocaleDateString("en-IN")}`, 140, 37);

    // 2. Main Info
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(14);
    doc.setFont("serif", "bold");
    doc.text("GUEST INFORMATION", 20, 70);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Primary Guest: ${user?.name}`, 20, 78);
    doc.text(`Email: ${user?.email}`, 20, 83);
    doc.text(`Status: ${booking.status}`, 20, 88);

    doc.setFontSize(14);
    doc.setFont("serif", "bold");
    doc.text("STAY DETAILS", 110, 70);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Resort: ${booking.resort?.name}`, 110, 78);
    doc.text(`Location: ${booking.resort?.locationArea}`, 110, 83);
    doc.text(`Date: ${new Date(booking.checkIn).toLocaleDateString("en-IN")} - ${new Date(booking.checkOut).toLocaleDateString("en-IN")}`, 110, 88);

    // 3. Table
    autoTable(doc, {
      startY: 100,
      head: [['Description', 'Amount']],
      body: [
        ['Accommodation Charges', `INR ${booking.totalPrice?.toLocaleString("en-IN")}`],
        ['GST & Service Fee (12%)', 'Included'],
        ['Total Amount Paid', `INR ${booking.totalPrice?.toLocaleString("en-IN")}`],
      ],
      headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold' },
      theme: 'grid',
      margin: { left: 20, right: 20 }
    });

    // 4. QR Code
    const tableFinalY = (doc as any).lastAutoTable.finalY;
    try {
      const qrData = `Ref: ${safeRef} | Guest: ${user?.name}`;
      const qrCode = await QRCode.toDataURL(qrData);
      doc.addImage(qrCode, 'PNG', 140, tableFinalY + 10, 40, 40);
      doc.setFontSize(10);
      doc.text("Scan for Check-in", 140, tableFinalY + 55);
    } catch (e) { console.error(e); }

    // 5. Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for your journey with us. help@hampistays.com", 105, 285, { align: 'center' });

    doc.save(`HampiStays_Invoice_${safeRef}.pdf`);
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
                      <Button variant="outline" className="px-6 rounded-2xl gap-2 border-sand-200 hover:bg-sand-50" onClick={() => handleDownloadInvoice(booking)}>
                        <Download className="w-4 h-4" /> Get Invoice
                      </Button>

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

