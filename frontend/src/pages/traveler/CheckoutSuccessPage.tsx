import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, XCircle, Loader2, Calendar, 
  MapPin, ArrowRight, Download 
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { apiClient } from "../../utils/apiClient";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as QRCode from "qrcode";
import { useAuth } from "../../context/AuthContext";
import type { Booking } from "../../types/booking";

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

export function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!orderId) {
        setStatus("failed");
        return;
      }

      try {
        const data = await apiClient.get<Booking>(`/bookings/reference/${orderId}`);
        if (data) {
          setBooking(data);
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setStatus("failed");
      }
    };

    fetchBookingDetails();
  }, [orderId]);

  const handleDownloadConfirmation = async () => {
    if (!booking) return;
    setIsDownloading(true);
    try {
      const doc = new jsPDF();
      const safeRef = booking.referenceNumber || orderId;
      const issueDate = new Date().toLocaleDateString("en-GB");
      
      const navy: [number, number, number] = [10, 15, 30];
      const gold: [number, number, number] = [184, 134, 11];
      const sand: [number, number, number] = [245, 245, 240];
      
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

      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.setLineWidth(0.5);
      doc.line(15, 50, 195, 50);

      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.setFont("times", "bolditalic");
      doc.setFontSize(18);
      doc.text("Your Royal Retreat is Confirmed", 105, 62, { align: 'center' });

      let currentY = 75;
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
      
      const qrUrl = `${window.location.origin}/dashboard/bookings`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, { 
        margin: 1, 
        width: 200, 
        color: { dark: '#0A0F1E', light: '#FFFFFF' },
        errorCorrectionLevel: 'H'
      });
      doc.addImage(qrCodeDataUrl, 'PNG', 150, currentY + 13, 30, 30);

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

      downloadPdf(doc, `HampiStays_Confirmation_${safeRef}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF. Please download from your dashboard.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold-600 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-serif font-bold text-navy-950">Verifying Payment...</h1>
          <p className="text-navy-950/40 mt-2 text-sm uppercase tracking-widest font-bold">Please do not refresh the page</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-luxury border border-sand-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <XCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy-950 mb-4">Payment Failed</h1>
          <p className="text-navy-950/60 mb-8 leading-relaxed">
            We couldn't verify your payment. If money was deducted, it will be refunded within 5-7 business days.
          </p>
          <div className="space-y-4">
            <Button className="w-full rounded-2xl h-14 bg-navy-950 text-white" onClick={() => navigate("/checkout")}>
              Try Again
            </Button>
            <Button variant="outline" className="w-full rounded-2xl h-14" onClick={() => navigate("/contact")}>
              Contact Support
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 pt-32 pb-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[4rem] overflow-hidden shadow-luxury border border-sand-100">
          <div className="bg-navy-950 p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
            <div className="w-24 h-24 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-gold">
              <CheckCircle2 className="w-12 h-12 text-navy-950" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Booking Confirmed!</h1>
            <p className="text-white/60 uppercase tracking-[0.2em] text-xs font-bold">Reference: {orderId}</p>
          </div>

          <div className="p-12 md:p-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h3 className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest mb-4">Resort Details</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-sm">
                      <img src={booking?.resort?.images?.[0] || "https://images.unsplash.com/photo-1548013146-72479768bbaa"} alt="Resort" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xl font-serif font-bold text-navy-950">{booking?.resort?.name}</h4>
                      <p className="text-sm text-navy-950/50 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gold-500" /> Hampi, Karnataka
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest mb-2">Check-In</h3>
                    <p className="font-bold text-navy-950 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gold-500" /> {new Date(booking?.checkIn).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest mb-2">Check-Out</h3>
                    <p className="font-bold text-navy-950 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gold-500" /> {new Date(booking?.checkOut).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-sand-50 rounded-[3rem] p-10 space-y-6">
                <div className="flex justify-between items-center pb-6 border-b border-sand-200">
                  <span className="text-navy-950/40 text-sm font-medium">Payment Status</span>
                  <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Paid Successfully
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-navy-950/40 text-sm font-medium">Total Paid</span>
                  <span className="text-2xl font-bold text-navy-950">₹{booking?.totalPrice?.toLocaleString()}</span>
                </div>
                <div className="pt-6 space-y-4">
                  <Button className="w-full rounded-2xl h-14 bg-navy-950 text-white group" onClick={() => navigate("/dashboard/bookings")}>
                    Manage My Bookings
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button variant="outline" className="w-full rounded-2xl h-14 border-gold-200 text-gold-700 gap-2" onClick={handleDownloadConfirmation} isLoading={isDownloading}>
                    <Download className="w-4 h-4" />
                    Download Invoice PDF
                  </Button>

                  <p className="text-[10px] text-navy-950/30 italic text-center leading-relaxed">
                    A confirmation email with the itinerary has been sent to your registered address.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
