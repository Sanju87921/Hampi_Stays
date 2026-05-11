import { useState, useMemo } from "react";
import { useSearchParams, Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, CreditCard, ShieldCheck, 
  User, Mail, Phone, MessageSquare, 
  Calendar as CalIcon, Users, Building, 
  ChevronRight, CheckCircle, Info, MapPin
} from "lucide-react";
import { getResortById } from "../data/resorts";
import { Button } from "../components/ui/Button";
import { format, parseISO, differenceInDays } from "date-fns";

import { useAuth } from "../context/AuthContext";

export function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refNumber, setRefNumber] = useState("");
  


  const [formData, setFormData] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ")[1] || "",
    email: user?.email || "",
    phone: "",
    specialRequests: ""
  });

  const resortId = searchParams.get("resortId");
  const roomId = searchParams.get("roomId");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adults = Number(searchParams.get("adults") || 2);

  const resort = useMemo(() => resortId ? getResortById(resortId) : null, [resortId]);
  const room = useMemo(() => {
    if (!resort || !roomId) return null;
    return resort.roomTypes.find(r => r.id === roomId);
  }, [resort, roomId]);

  if (!resort || !room || !checkIn || !checkOut) {
    return <Navigate to="/resorts" replace />;
  }

  const nights = Math.max(1, differenceInDays(parseISO(checkOut), parseISO(checkIn)));
  const subtotal = room.pricePerNight * nights;
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please sign in to complete your booking.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Create Booking & Get Payment Session
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          resortId: resort.id,
          roomId: room.id,
          checkIn,
          checkOut,
          guests: adults,
          totalPrice: total,
          specialRequests: formData.specialRequests,
          phone: formData.phone,
          customerName: `${formData.firstName} ${formData.lastName}`
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Booking failed. Please try again.");
      }
      
      const data = await response.json();
      
      // 2. Launch Razorpay Checkout
      if (data.razorpayOrderId) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder", // Use env variable
          amount: Math.round(total * 100),
          currency: "INR",
          name: "HampiStays Luxury",
          description: `Booking for ${resort.name}`,
          image: "https://hampistays.com/logo.png",
          order_id: data.razorpayOrderId,
          handler: async function (response: any) {
            // Verify Payment
            const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/bookings/${data.referenceNumber}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (verifyRes.ok) {
              setRefNumber(data.referenceNumber);
              setIsSuccess(true);
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: "#0c0a09"
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Fallback for testing
        setRefNumber(data.referenceNumber);
        setIsSuccess(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center pt-20 pb-12 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[3rem] p-8 md:p-12 shadow-luxury text-center border border-sand-100"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy-950 mb-4">Booking Confirmed!</h1>
          <p className="text-navy-950/60 mb-8 leading-relaxed">
            Your stay at <span className="font-bold text-navy-950">{resort.name}</span> has been successfully booked. 
            A confirmation email has been sent to your inbox.
          </p>
          <div className="bg-sand-50 rounded-2xl p-6 mb-8 text-left border border-sand-100">
            <p className="text-[10px] font-bold text-navy-800/40 uppercase tracking-widest mb-3">Booking Reference</p>
            <p className="text-lg font-mono font-bold text-navy-950">{refNumber}</p>
          </div>
          <Button 
            className="w-full py-4 rounded-2xl"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 pt-28 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link 
              to={`/resorts/${resort.slug}`}
              className="inline-flex items-center gap-2 text-navy-950/50 hover:text-navy-950 font-semibold text-sm mb-4 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Modify Selection
            </Link>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-950 leading-tight">
              Complete Your <span className="italic text-gold-600">Booking</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-3 text-navy-950/40 text-sm font-bold uppercase tracking-widest">
            <span className="text-gold-600">Details</span>
            <ChevronRight className="w-4 h-4" />
            <span>Payment</span>
            <ChevronRight className="w-4 h-4" />
            <span>Confirm</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Guest Details Form */}
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white rounded-[2.5rem] border border-sand-100 shadow-sm p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gold-50 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-gold-600" />
                </div>
                <h2 className="text-2xl font-bold font-serif text-navy-950">Guest Details</h2>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <Info className="w-4 h-4" />
                  {error}
                </div>
              )}

              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy-800/40 uppercase tracking-widest ml-1">First Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Rahul"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-sand-50/50 border border-sand-200 rounded-2xl p-4 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy-800/40 uppercase tracking-widest ml-1">Last Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Sharma"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-sand-50/50 border border-sand-200 rounded-2xl p-4 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy-800/40 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-950/20" />
                      <input 
                        required
                        type="email" 
                        placeholder="rahul@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-sand-50/50 border border-sand-200 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy-800/40 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-950/20" />
                      <input 
                        required
                        type="tel" 
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-sand-50/50 border border-sand-200 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy-800/40 uppercase tracking-widest ml-1">Special Requests (Optional)</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-navy-950/20" />
                    <textarea 
                      rows={3}
                      placeholder="e.g. Dietary requirements, late check-in, anniversary setup..."
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      className="w-full bg-sand-50/50 border border-sand-200 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </form>
            </section>

            <section className="bg-white rounded-[2.5rem] border border-sand-100 shadow-sm p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gold-50 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gold-600" />
                </div>
                <h2 className="text-2xl font-bold font-serif text-navy-950">Payment Method</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-5 rounded-2xl border-2 border-gold-500 bg-gold-50/30 flex items-center gap-4 cursor-pointer">
                  <div className="w-6 h-6 rounded-full border-4 border-gold-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-navy-950">Instant Payout</p>
                    <p className="text-xs text-navy-950/50">Via Razorpay / UPI</p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl border-2 border-sand-200 opacity-40 grayscale flex items-center gap-4 cursor-not-allowed">
                  <div className="w-6 h-6 rounded-full border-2 border-sand-300 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-navy-950">International Card</p>
                    <p className="text-xs text-navy-950/50">Coming Soon</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-navy-50 rounded-2xl border border-navy-100">
                <Info className="w-5 h-5 text-navy-700 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-navy-900 leading-relaxed">
                  By clicking "Confirm Booking", you agree to the <Link to="/terms" className="text-gold-600 font-bold hover:underline">Terms of Service</Link> and the resort's cancellation policy. Your payment is secured via 256-bit SSL encryption.
                </p>
              </div>
            </section>
          </div>

          {/* Right: Booking Summary */}
          <aside className="lg:col-span-5 sticky top-28">
            <div className="bg-white rounded-[2.5rem] border border-sand-100 shadow-luxury overflow-hidden">
              {/* Resort Thumbnail */}
              <div className="h-48 relative overflow-hidden">
                <img src={resort.images[0]} alt={resort.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-xl font-bold text-white font-serif">{resort.name}</h3>
                  <div className="flex items-center gap-1.5 text-white/80 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-gold-400" />
                    <span>{resort.location.area}, Hampi</span>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Stay Info */}
                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-sand-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-navy-800/40 uppercase tracking-widest">Check-in</p>
                    <div className="flex items-center gap-2 text-navy-950">
                      <CalIcon className="w-4 h-4 text-gold-500" />
                      <span className="font-bold">{format(parseISO(checkIn), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-navy-800/40 uppercase tracking-widest">Check-out</p>
                    <div className="flex items-center gap-2 text-navy-950">
                      <CalIcon className="w-4 h-4 text-gold-500" />
                      <span className="font-bold">{format(parseISO(checkOut), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-navy-800/40 uppercase tracking-widest">Guests</p>
                    <div className="flex items-center gap-2 text-navy-950">
                      <Users className="w-4 h-4 text-gold-500" />
                      <span className="font-bold">{adults} Adult{adults !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-navy-800/40 uppercase tracking-widest">Duration</p>
                    <div className="flex items-center gap-2 text-navy-950">
                      <Building className="w-4 h-4 text-gold-500" />
                      <span className="font-bold">{nights} Night{nights !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>

                {/* Selected Room */}
                <div className="p-4 rounded-2xl bg-sand-50/50 border border-sand-100">
                  <p className="text-[10px] font-bold text-navy-800/40 uppercase tracking-widest mb-1">Selected Room</p>
                  <p className="font-bold text-navy-950">{room.name}</p>
                  <p className="text-xs text-navy-950/60 mt-1">{room.description}</p>
                </div>

                {/* Price Table */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-navy-950/70">
                    <span>₹{room.pricePerNight.toLocaleString("en-IN")} × {nights} night{nights !== 1 ? "s" : ""}</span>
                    <span className="font-bold text-navy-950">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm text-navy-950/70">
                    <span>Luxury Tax & Fees (12%)</span>
                    <span className="font-bold text-navy-950">₹{taxes.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="pt-4 border-t border-sand-100 flex justify-between items-center">
                    <span className="text-lg font-bold text-navy-950">Total Amount</span>
                    <span className="text-3xl font-serif font-bold text-navy-950">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4 space-y-4">
                  <Button 
                    form="checkout-form"
                    type="submit"
                    size="lg" 
                    className="w-full py-4 rounded-2xl text-lg shadow-gold"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Confirm & Pay
                  </Button>
                  <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-green-600 uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    Secure Checkout
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

