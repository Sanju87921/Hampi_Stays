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
import { applyPdfWatermark } from "../../utils/pdfWatermark";

const downloadPdf = (doc: any, filename: string) => {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function BookingConfirmationPage() {
  const location = useLocation();
  const state = location.state;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  if (!state?.booking) return <Navigate to="/resorts" replace />;

  const { booking, resortName, roomName, image, nights, grandTotal, guestName } = state;

  const handleDownloadConfirmation = async () => {
    const doc = new jsPDF();
    const safeRef = booking.referenceNumber || "HS-STAY";
    const issueDate = new Date().toLocaleDateString("en-GB");
    
    // Brand Colors
    const navy: [number, number, number] = [10, 15, 30];   // #0A0F1E
    const gold: [number, number, number] = [184, 134, 11]; // #B8860B
    const sand: [number, number, number] = [245, 245, 240]; // #F5F5F0

    // --- 1. PREMIUM HEADER ---
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(28);
    doc.text("HAMPISTAYS", 15, 22);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text("LUXURY ECO-HOSPITALITY | HAMPI, INDIA", 15, 28);

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
    
    // Column 1: Guest Info
    doc.setFillColor(sand[0], sand[1], sand[2]);
    doc.rect(15, currentY, 85, 35, 'F');
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("GUEST & BOOKING", 20, currentY + 8);
    
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const cleanGuestName = (guestName || "Valued Guest").replace(/_/g, ' ');
    doc.text(cleanGuestName, 20, currentY + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Status: CONFIRMED`, 20, currentY + 22);
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
    doc.text(resortName, 115, currentY + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(roomName, 115, currentY + 22);
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
        `INR ${grandTotal?.toLocaleString("en-IN")}`
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
      const qrCode = await QRCode.toDataURL(qrUrl, { 
        margin: 1, 
        width: 200,
        color: { dark: '#0A0F1E', light: '#FFFFFF' },
        errorCorrectionLevel: 'H'
      });
      doc.addImage(qrCode, 'PNG', 150, currentY + 13, 30, 30);
    } catch (e) { console.error(e); }

    // --- 6. LUXURY FOOTER ---
    const footerY = 270;
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.1);
    doc.line(40, footerY, 170, footerY);
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.text("We look forward to welcoming you to the heart of Hampi's heritage.", 105, footerY + 8, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Main Road, Hampi, Karnataka 583239 | +91 99000 88000 | help@hampistays.com", 105, footerY + 14, { align: 'center' });

    // --- 7. APPLY LUXURY WATERMARK SYSTEM ---
    applyPdfWatermark(doc, { referenceNumber: safeRef });

    downloadPdf(doc, `HampiStays_Confirmation_${safeRef}.pdf`);
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
