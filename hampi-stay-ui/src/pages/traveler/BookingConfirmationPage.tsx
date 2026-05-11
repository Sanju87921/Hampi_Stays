import { useState } from "react";
import { useLocation, Navigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Calendar, Users,
  Download, ArrowRight, Star, Home, MessageCircle, MapPin
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import QRCode from "qrcode";

export function BookingConfirmationPage() {
  const location = useLocation();
  const state = location.state;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  if (!state?.booking) return <Navigate to="/resorts" replace />;

  const { booking, resortName, roomName, image, nights, grandTotal, guestName } = state;

  const handleDownloadConfirmation = async () => {
    const doc = new jsPDF();
    const safeRef = booking.referenceNumber || `HS-${Math.random().toString(36).toUpperCase().substring(2, 10)}`;
    const issueDate = new Date().toLocaleDateString("en-GB");
    
    // Brand Colors
    const navy: [number, number, number] = [10, 15, 30];   // #0A0F1E
    const gold: [number, number, number] = [184, 134, 11]; // #B8860B
    const lightGold: [number, number, number] = [212, 175, 55]; // #D4AF37
    const sand: [number, number, number] = [245, 245, 240]; // #F5F5F0
    
    // Page Dimensions
    const pageWidth = 210;
    const pageHeight = 297;

    // --- 1. FULL PAGE LUXURY FRAME ---
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10); // Main border
    doc.setLineWidth(0.1);
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14); // Inner accent line
    
    // --- 2. HEADER SECTION (COMPACT & MODERN) ---
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(7.1, 7.1, pageWidth - 14.2, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.text("HAMPISTAYS", 15, 22);
    
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text("LUXURY ECO-HOSPITALITY | HAMPI, INDIA", 15, 28);

    doc.setTextColor(lightGold[0], lightGold[1], lightGold[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("BOOKING CONFIRMATION", pageWidth - 15, 20, { align: 'right' });
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`REFERENCE: ${safeRef}`, pageWidth - 15, 26, { align: 'right' });
    doc.text(`ISSUED: ${issueDate}`, pageWidth - 15, 31, { align: 'right' });

    // --- 3. GUEST & RESORT OVERVIEW (SIDE-BY-SIDE) ---
    let currentY = 50;
    
    // Left: Guest Info
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont("times", "bolditalic");
    doc.setFontSize(16);
    doc.text("Welcome to your sanctuary,", 15, currentY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    const cleanGuestName = (guestName || "Valued Guest").replace(/_/g, ' ');
    doc.text(cleanGuestName, 15, currentY + 10);
    
    // Right: Resort Summary Card
    doc.setFillColor(sand[0], sand[1], sand[2]);
    doc.roundedRect(120, currentY - 8, 75, 25, 3, 3, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("YOUR DESTINATION", 125, currentY);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(10);
    doc.text(resortName, 125, currentY + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(roomName, 125, currentY + 12);

    // --- 4. THE STAY DETAILS (THREE-COLUMN GRID) ---
    currentY += 35;
    doc.setDrawColor(240, 240, 240);
    doc.line(15, currentY - 5, 195, currentY - 5);

    const detailCols = [
      { label: "CHECK-IN", val: new Date(booking.checkIn).toLocaleDateString("en-GB"), sub: "From 14:00 PM" },
      { label: "CHECK-OUT", val: new Date(booking.checkOut).toLocaleDateString("en-GB"), sub: "Until 11:00 AM" },
      { label: "ACCOMMODATION", val: `${nights} Night(s)`, sub: `${booking.guests} Adult Guest(s)` }
    ];

    detailCols.forEach((col, i) => {
      const x = 15 + (i * 65);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(gold[0], gold[1], gold[2]);
      doc.text(col.label, x, currentY);
      doc.setFontSize(11);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(col.val, x, currentY + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(col.sub, x, currentY + 12);
    });

    // --- 5. FINANCIAL SUMMARY (MINIMALIST) ---
    currentY += 30;
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(15, currentY, 180, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("TOTAL AMOUNT PAID", 25, currentY + 12);
    doc.setFontSize(14);
    doc.setTextColor(lightGold[0], lightGold[1], lightGold[2]);
    doc.text(`INR ${grandTotal?.toLocaleString("en-IN")}`, 185, currentY + 13, { align: 'right' });

    // --- 6. ESSENTIAL INFO & QR (INTEGRATED) ---
    currentY += 35;
    
    // Vertical separator
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.2);
    doc.line(130, currentY, 130, currentY + 60);

    // Instructions
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("Essential Information", 15, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const infoPoints = [
      "• Present this document & Govt ID (Aadhar/Passport) at check-in.",
      "• Cancellation is free up to 48 hours prior to arrival.",
      "• HampiStays is a plastic-free, sustainable heritage sanctuary.",
      "• Digital Check-in is available via the QR code provided.",
      "• For assistance: +91 99000 88000 | help@hampistays.com"
    ];
    infoPoints.forEach((point, i) => {
      doc.text(point, 15, currentY + 10 + (i * 7));
    });

    // QR Code Section
    try {
      const qrUrl = `${window.location.origin}/dashboard/bookings`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, { 
        margin: 1, 
        width: 200, 
        color: { dark: '#0A0F1E', light: '#FFFFFF' },
        errorCorrectionLevel: 'H'
      });
      doc.addImage(qrCodeDataUrl, 'PNG', 145, currentY + 5, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(gold[0], gold[1], gold[2]);
      doc.text("SCAN TO VERIFY STAY", 165, currentY + 52, { align: 'center' });
    } catch (err) { console.error(err); }

    // --- 7. LUXURY FOOTER (PINNED) ---
    const footerY = 275;
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.3);
    doc.line(60, footerY, 150, footerY);

    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.text("Timeless Heritage. Sustainable Luxury.", 105, footerY + 8, { align: 'center' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("HampiStays Luxury Collection | Main Road, Hampi, Karnataka 583239", 105, footerY + 14, { align: 'center' });

    doc.save(`HampiStays_Confirmation_${safeRef}.pdf`);
  };

  const handleWhatsAppShare = () => {
    const message = `*HampiStays Booking Confirmation*%0A%0A` +
      `*Reference:* ${booking.referenceNumber}%0A` +
      `*Resort:* ${resortName}%0A` +
      `*Room:* ${roomName}%0A` +
      `*Dates:* ${new Date(booking.checkIn).toLocaleDateString("en-IN")} to ${new Date(booking.checkOut).toLocaleDateString("en-IN")}%0A` +
      `*Total Paid:* ₹${grandTotal.toLocaleString("en-IN")}%0A%0A` +
      `Looking forward to hosting you!`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-sand-50 to-gold-50/30 pt-28 pb-24">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="text-center mb-12"
        >
          <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-green-200 shadow-xl">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-5xl font-serif font-bold text-navy-950 mb-4">
            You're All Set!
          </h1>
          <p className="text-xl text-navy-950/60 max-w-lg mx-auto leading-relaxed">
            Your stay at <span className="font-bold text-navy-950">{resortName}</span> is confirmed. 
            Get ready for an unforgettable Hampi experience.
          </p>
        </motion.div>

        {/* Booking Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[3rem] border border-sand-100 overflow-hidden shadow-luxury mb-8"
        >
          {/* Resort Image Banner */}
          <div className="relative h-48 overflow-hidden">
            <img src={image} alt={resortName} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 to-transparent" />
            <div className="absolute bottom-6 left-8">
              <span className="px-4 py-2 bg-green-500 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">
                ✓ Confirmed
              </span>
            </div>
          </div>

          <div className="p-10">
            {/* Reference */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-8 border-b border-sand-100">
              <div>
                <p className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest mb-1">Booking Reference</p>
                <p className="text-3xl font-bold font-mono text-gold-700 tracking-wider">{booking.referenceNumber}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest mb-1">Total Paid</p>
                <p className="text-3xl font-bold text-navy-950">₹{grandTotal.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { icon: Home, label: "Resort", value: resortName, sub: roomName },
                {
                  icon: Calendar,
                  label: "Check-in",
                  value: new Date(booking.checkIn).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
                  sub: "From 2:00 PM"
                },
                {
                  icon: Calendar,
                  label: "Check-out",
                  value: new Date(booking.checkOut).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
                  sub: "By 11:00 AM"
                },
                { icon: Users, label: "Guests", value: `${booking.guests} Adults`, sub: `${nights} Night${nights > 1 ? "s" : ""}` },
              ].map(item => (
                <div key={item.label} className="p-5 bg-sand-50 rounded-2xl border border-sand-100">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-4 h-4 text-gold-500" />
                    <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">{item.label}</p>
                  </div>
                  <p className="font-bold text-navy-950 text-sm">{item.value}</p>
                  <p className="text-xs text-navy-950/40 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* What's Next */}
            <div className="p-6 bg-navy-950 text-white rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">What happens next?</p>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-3"><span className="w-5 h-5 rounded-full bg-gold-500 text-navy-950 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>A confirmation is saved to your bookings dashboard.</li>
                <li className="flex items-start gap-3"><span className="w-5 h-5 rounded-full bg-gold-500 text-navy-950 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>The resort team will prepare your personalized welcome.</li>
                <li className="flex items-start gap-3"><span className="w-5 h-5 rounded-full bg-gold-500 text-navy-950 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>After your stay, share your experience with a review.</li>
              </ol>
            </div>
          </div>
        </motion.div>

        {/* Local Expert Suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-navy-950 rounded-[3rem] p-8 md:p-12 mb-8 relative overflow-hidden group shadow-2xl border border-white/5"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-gold-500/20 border border-gold-500/30 rounded-full text-[10px] font-bold text-gold-400 uppercase tracking-widest">Hampi Expert Network</span>
            </div>
            <h3 className="text-3xl font-serif font-bold text-white mb-4">
              Unlock Hampi's <span className="text-gold-400 italic">Architectural Secrets</span>
            </h3>
            <p className="text-sand-100/60 mb-8 max-w-lg leading-relaxed">
              Experience Hampi through the eyes of a master storyteller. Our certified guides specialize in Vijayanagara history, ancient architecture, and hidden sunset spots.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/experiences" className="flex-1">
                <Button className="w-full rounded-2xl bg-gold-500 hover:bg-gold-400 text-navy-950 h-14 group/btn font-bold border-none">
                  Hire a Certified Guide
                  <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" className="flex-1 rounded-2xl border-white/20 text-white hover:bg-white/10 h-14 font-bold">
                Maybe Later
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <Button size="lg" className="flex-1 rounded-2xl shadow-gold gap-2" onClick={handleDownloadConfirmation}>
            <Download className="w-5 h-5" />
            Download Confirmation
          </Button>
          <Button variant="outline" size="lg" className="flex-1 rounded-2xl gap-2 border-green-500 text-green-600 hover:bg-green-50" onClick={handleWhatsAppShare}>
            <MessageCircle className="w-5 h-5" />
            Share to WhatsApp
          </Button>
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${booking.resort?.locationLat},${booking.resort?.locationLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" size="lg" className="w-full rounded-2xl gap-2 border-gold-500 text-gold-700 hover:bg-gold-50">
              <MapPin className="w-5 h-5" />
              Get Directions
            </Button>
          </a>
          <Link to="/dashboard/bookings" className="flex-1">
            <Button variant="outline" size="lg" className="w-full rounded-2xl gap-2">
              <Calendar className="w-5 h-5" />
              View My Bookings
            </Button>
          </Link>
          <Link to="/resorts">
            <Button variant="outline" size="lg" className="w-full rounded-2xl gap-2">
              Explore More
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Review Prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 p-10 bg-white border border-sand-100 rounded-[3rem] shadow-sm text-center"
        >
          <p className="text-[10px] font-bold text-navy-950/30 uppercase tracking-[0.2em] mb-6">Rate your booking experience</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(i)}
                className="transition-colors duration-200"
              >
                <Star 
                  className={cn(
                    "w-10 h-10 transition-all duration-300",
                    (hoverRating || rating) >= i 
                      ? "fill-gold-500 text-gold-500 scale-110 drop-shadow-md" 
                      : "text-sand-200 fill-sand-100"
                  )} 
                />
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {rating > 0 ? (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-gold-700 font-serif italic text-lg"
              >
                {rating === 5 ? "✨ You're wonderful! Thank you for the 5 stars." : "Thank you for your feedback!"}
              </motion.p>
            ) : (
              <p className="text-sm text-navy-950/60 leading-relaxed max-w-sm mx-auto">
                How easy was it to secure your stay? <br />
                Your feedback helps us refine the HampiStays experience.
              </p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
