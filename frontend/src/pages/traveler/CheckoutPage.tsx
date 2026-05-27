import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, CreditCard, Lock,
  ChevronRight, Info, MapPin,
  Calendar as CalIcon, Users, Shield,
  Plane, Utensils, Heart, Clock,
  Globe, CheckCircle2, Wallet
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import { apiClient } from "../../utils/apiClient";
import { sanitizePhoneNumber } from "../../utils/phone";

const USD_RATE = 0.012; // 1 INR ≈ 0.012 USD

const SPECIAL_REQUEST_OPTIONS = [
  { id: "early_checkin", label: "Early Check-in (before 12pm)", icon: Clock },
  { id: "anniversary", label: "Anniversary / Special Occasion Setup", icon: Heart },
  { id: "dietary", label: "Special Dietary Requirements", icon: Utensils },
  { id: "airport_pickup", label: "Airport Pickup (₹1500 extra)", icon: Plane },
];

const PAYMENT_METHODS = [
  { id: "secure", label: "Secure Payment Gateway", sub: "Cards, UPI, NetBanking, Wallets" },
];



export function CheckoutPage() {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [addInsurance, setAddInsurance] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [specialNote, setSpecialNote] = useState("");
  const [guestInfo, setGuestInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: sanitizePhoneNumber(user?.phone),
    nationality: "Indian",
  });

  useEffect(() => {
    if (user) {
      setGuestInfo(prev => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || sanitizePhoneNumber(user.phone) || "",
      }));
    }
  }, [user]);

  const { bookingData, hasBookingData } = useMemo(() => ({
    bookingData: location.state || {},
    hasBookingData: !!location.state
  }), [location.state]);

  // Calculate nights
  const nights = useMemo(() => {
    if (!hasBookingData) return 1;
    const cin = new Date(bookingData.checkIn);
    const cout = new Date(bookingData.checkOut);
    return Math.max(1, Math.ceil((cout.getTime() - cin.getTime()) / (1000 * 60 * 60 * 24)));
  }, [bookingData, hasBookingData]);

  if (!hasBookingData) return <Navigate to="/resorts" replace />;

  const airportPickupCost = selectedRequests.includes("airport_pickup") ? 1500 : 0;
  const basePrice = bookingData.baseNightlyPrice || Math.round((bookingData.totalPrice / 1.12) / nights);
  const nightsTotal = basePrice * nights;
  const taxes = Math.round(nightsTotal * 0.12);
  const insuranceCost = addInsurance ? Math.round(nightsTotal * 0.02) : 0;

  // Meal pricing calculations (with 5% GST for F&B)
  const mealTotal = selectedMeals.reduce((acc, mealName) => {
    const pkg = (bookingData.mealPackages || []).find((p: any) => p.name === mealName);
    if (pkg) {
      return acc + (pkg.price * (bookingData.adults || 1) * nights);
    }
    return acc;
  }, 0);
  const mealTaxes = Math.round(mealTotal * 0.05);

  const grandTotal = nightsTotal + taxes + insuranceCost + airportPickupCost + mealTotal + mealTaxes;

  const fmt = (amount: number) =>
    currency === "INR"
      ? `₹${amount.toLocaleString("en-IN")}`
      : `$${(amount * USD_RATE).toFixed(2)}`;

  const toggleMeal = (name: string) => {
    setSelectedMeals(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const allRequests = [
        ...selectedRequests.map(id => SPECIAL_REQUEST_OPTIONS.find(o => o.id === id)?.label || id),
        specialNote,
      ].filter(Boolean).join("; ");

      // 1. Create Booking on Backend
      const booking = await apiClient.post<any>('/bookings', {
        userId: user?.id,
        resortId: bookingData.resortId,
        roomId: bookingData.roomId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.adults,
        totalPrice: grandTotal,
        specialRequests: allRequests,
        phone: guestInfo.phone,
        customerName: guestInfo.name,
        addInsurance,
        airportPickup: airportPickupCost > 0,
        selectedMeals
      });

      // 2. Load Razorpay Script dynamically if not present
      if (!(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      // 3. Launch Razorpay Checkout
      if (booking.orderId) {
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Snxno5G3tcQKcs';
        
        if (!razorpayKey) {
          throw new Error("Razorpay Key is missing. Please contact support.");
        }

        const options = {
          key: razorpayKey,
          amount: Math.round(grandTotal * 100),
          currency: "INR",
          name: "HampiStays Luxury",
          description: `Booking for ${bookingData.resortName}`,
          image: "https://res.cloudinary.com/dfs6lmdns/image/upload/c_fill,g_center,w_512,h_512/v1779876742/hampi-stays/hampistays-logo.png",
          order_id: booking.orderId,
          modal: {
            ondismiss: function() {
              console.log('Checkout modal closed');
              setIsProcessing(false);
            }
          },
          handler: async function (response: any) {
            try {
              // Verify Payment
              await apiClient.post(`/bookings/${booking.referenceNumber}/verify-payment`, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                referenceNumber: booking.referenceNumber
              });

              navigate(`/checkout/success?order_id=${booking.referenceNumber}`);
            } catch (err: any) {
              console.error("Verification failed", err);
              toast.error("Payment verification failed. Please contact support.");
              setIsProcessing(false);
            }
          },
          prefill: {
            name: guestInfo.name,
            email: guestInfo.email,
            contact: guestInfo.phone
          },
          theme: {
            color: "#0c0a09"
          }
        };

        const rzp = new (window as any).Razorpay(options);
        
        rzp.on('payment.failed', function (response: any) {
          console.error("Payment failed:", response.error);
          toast.error(`Payment Failed: ${response.error.description}`);
          setIsProcessing(false);
        });

        rzp.open();
      } else {
        throw new Error("Payment gateway failed to initialize. Please try again.");
      }

    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRequest = (id: string) =>
    setSelectedRequests(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );

  return (
    <div className="min-h-screen bg-sand-50 pt-28 pb-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-10">
          <h1 className="text-4xl font-serif font-bold text-navy-950 mb-4">Complete Your Booking</h1>
          <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
            {["Guest Details", "Add-ons", "Payment"].map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                {i > 0 && <ChevronRight className="w-4 h-4 text-navy-950/20" />}
                <span className={cn(
                  step === i + 1 ? "text-gold-600" : step > i + 1 ? "text-green-600" : "text-navy-950/20"
                )}>
                  {step > i + 1 ? <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{label}</span> : label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {/* STEP 1: Guest Details */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[2.5rem] border border-sand-100 p-8 md:p-10 shadow-sm space-y-8">
                  <h2 className="text-2xl font-bold font-serif text-navy-950">Guest Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <Input label="Full Name" value={guestInfo.name} onChange={e => setGuestInfo({...guestInfo, name: e.target.value})} placeholder="John Doe" />
                    <Input label="Email Address" value={guestInfo.email} onChange={e => setGuestInfo({...guestInfo, email: e.target.value})} placeholder="john@example.com" />
                    <Input label="Phone Number" value={guestInfo.phone} onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})} placeholder="+91 98765 43210" />
                    <Input label="Nationality" value={guestInfo.nationality} onChange={e => setGuestInfo({...guestInfo, nationality: e.target.value})} placeholder="Indian" />
                  </div>

                  {/* Special Requests */}
                  <div>
                    <h3 className="text-lg font-bold text-navy-950 mb-4">Special Requests</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SPECIAL_REQUEST_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => toggleRequest(opt.id)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                            selectedRequests.includes(opt.id)
                              ? "border-gold-500 bg-gold-50/40 text-navy-950"
                              : "border-sand-100 bg-sand-50 text-navy-950/60 hover:border-gold-200"
                          )}>
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            selectedRequests.includes(opt.id) ? "bg-gold-100 text-gold-700" : "bg-white text-navy-950/30")}>
                            <opt.icon className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-semibold">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Any other requests or notes for the resort..."
                      value={specialNote}
                      onChange={e => setSpecialNote(e.target.value)}
                      rows={3}
                      className="mt-4 w-full p-4 rounded-2xl border border-sand-200 bg-sand-50 text-sm text-navy-950 resize-none outline-none focus:ring-2 focus:ring-gold-400 transition"
                    />
                  </div>

                  <Button size="lg" className="px-12" onClick={() => setStep(2)}>
                    Continue to Add-ons
                  </Button>
                </motion.div>
              )}

              {/* STEP 2: Add-ons */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-[2.5rem] border border-sand-100 p-8 md:p-10 shadow-sm space-y-8">
                  <h2 className="text-2xl font-bold font-serif text-navy-950">Optional Add-ons</h2>

                  {/* Travel Insurance */}
                  <div className={cn("p-6 rounded-3xl border-2 transition-all cursor-pointer",
                    addInsurance ? "border-green-400 bg-green-50/30" : "border-sand-100 hover:border-green-200")}
                    onClick={() => setAddInsurance(!addInsurance)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center",
                          addInsurance ? "bg-green-100 text-green-700" : "bg-sand-50 text-navy-950/30")}>
                          <Shield className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="font-bold text-navy-950 text-lg">Travel Insurance</p>
                          <p className="text-sm text-navy-950/50">Cancel for any reason, medical coverage, trip delay</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          addInsurance ? "border-green-500 bg-green-500" : "border-sand-300")}>
                          {addInsurance && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-sand-100">
                      <p className="text-xs text-navy-950/40 italic">~2% of booking value · Provided by HDFC ERGO</p>
                      <p className="font-bold text-green-700">{fmt(insuranceCost || Math.round(nightsTotal * 0.02))}</p>
                    </div>
                  </div>

                  {/* Meal Packages */}
                  {(bookingData.mealPackages && bookingData.mealPackages.length > 0) && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-navy-950 font-serif">Curated Meal Packages</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {bookingData.mealPackages.map((pkg: any) => {
                          const isSelected = selectedMeals.includes(pkg.name);
                          const totalMealPrice = pkg.price * (bookingData.adults || 1) * nights;
                          return (
                            <div
                              key={pkg.name}
                              className={cn(
                                "p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4",
                                isSelected ? "border-gold-500 bg-gold-50/20" : "border-sand-100 hover:border-gold-200"
                              )}
                              onClick={() => toggleMeal(pkg.name)}
                            >
                              <div className="flex items-start gap-4">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                                  isSelected ? "bg-gold-100 text-gold-700" : "bg-sand-50 text-navy-950/30")}>
                                  <Utensils className="w-7 h-7" />
                                </div>
                                <div>
                                  <p className="font-bold text-navy-950 text-lg">{pkg.name}</p>
                                  <p className="text-sm text-navy-950/50 mt-0.5">{pkg.description || "No description provided."}</p>
                                  <p className="text-xs text-gold-600 font-bold mt-1">₹{pkg.price.toLocaleString("en-IN")} / guest / night</p>
                                </div>
                              </div>
                              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-sand-100">
                                <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all order-2 md:order-1",
                                  isSelected ? "border-gold-500 bg-gold-500" : "border-sand-300")}>
                                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                </div>
                                <div className="text-left md:text-right order-1 md:order-2">
                                  <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Total stay cost</p>
                                  <p className="font-bold text-navy-950">{fmt(totalMealPrice)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Multi-currency toggle */}
                  <div className="p-6 rounded-3xl border border-sand-100 bg-sand-50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gold-600" />
                        <div>
                          <p className="font-bold text-navy-950">Display Currency</p>
                          <p className="text-xs text-navy-950/40">Payment will be charged in INR</p>
                        </div>
                      </div>
                      <div className="flex w-full sm:w-auto rounded-xl overflow-hidden border border-sand-200">
                        {(["INR", "USD"] as const).map(c => (
                          <button key={c} onClick={() => setCurrency(c)}
                            className={cn("flex-1 sm:flex-none px-6 py-2 text-sm font-bold transition-all",
                              currency === c ? "bg-navy-950 text-white" : "bg-white text-navy-950/40 hover:text-navy-950")}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl h-14" onClick={() => setStep(1)}>Back</Button>
                    <Button className="w-full sm:flex-1 px-12 shadow-gold h-14" onClick={() => setStep(3)}>Continue to Payment</Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Payment */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-[2.5rem] border border-sand-100 p-8 md:p-10 shadow-sm space-y-8">
                  <h2 className="text-2xl font-bold font-serif text-navy-950">Secure Payment</h2>

                  {/* Razorpay Integration Info */}
                  <div className="p-6 rounded-3xl bg-sand-50 border border-sand-100 flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                      <CreditCard className="w-6 h-6 text-gold-600" />
                    </div>
                    <div>
                      <p className="font-bold text-navy-950">Razorpay Secure Checkout</p>
                      <p className="text-sm text-navy-950/50">You will be redirected to Razorpay's secure portal to complete your transaction using Cards, UPI, or NetBanking.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                    <Button size="lg" className="w-full sm:w-auto px-12 h-14 shadow-gold" onClick={handlePayment} isLoading={isProcessing}>
                      Pay {fmt(grandTotal)} Securely
                    </Button>
                    <button onClick={() => setStep(2)} className="text-sm font-bold text-navy-950/40 hover:text-navy-950 transition-colors py-2">
                      Back to Add-ons
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-6 pt-2 opacity-60">
                    <ShieldCheck className="w-5 h-5" />
                    <Lock className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">256-bit SSL Secured</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          <aside className="lg:col-span-4">
            <div className="bg-white rounded-[2.5rem] border border-sand-100 overflow-hidden shadow-luxury sticky top-28">
              <div className="h-48 overflow-hidden">
                <img src={bookingData.image} alt={bookingData.resortName} className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold font-serif text-navy-950 mb-1">{bookingData.resortName}</h3>
                <p className="text-sm text-gold-600 font-medium italic mb-6">{bookingData.roomName}</p>

                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex items-center gap-3 text-navy-950/60">
                    <CalIcon className="w-4 h-4 text-gold-500 shrink-0" />
                    <span>{new Date(bookingData.checkIn).toLocaleDateString()} → {new Date(bookingData.checkOut).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-navy-950/60">
                    <Users className="w-4 h-4 text-gold-500 shrink-0" />
                    <span>{bookingData.adults} Adults</span>
                  </div>
                  <div className="flex items-center gap-3 text-navy-950/60">
                    <MapPin className="w-4 h-4 text-gold-500 shrink-0" />
                    <span>Hampi, Karnataka</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-4 border-t border-sand-100 text-sm">
                  <div className="flex justify-between text-navy-950/60">
                    <span>{nights} night{nights > 1 ? "s" : ""} × {fmt(basePrice)}</span>
                    <span className="font-bold text-navy-950">{fmt(nightsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-navy-950/60">
                    <span>GST & Service (12%)</span>
                    <span className="font-bold text-navy-950">{fmt(taxes)}</span>
                  </div>
                  {addInsurance && (
                    <div className="flex justify-between text-green-700">
                      <span>Travel Insurance</span>
                      <span className="font-bold">{fmt(insuranceCost)}</span>
                    </div>
                  )}
                  {selectedRequests.includes("airport_pickup") && (
                    <div className="flex justify-between text-navy-950/60">
                      <span>Airport Pickup</span>
                      <span className="font-bold text-navy-950">{fmt(1500)}</span>
                    </div>
                  )}
                  {mealTotal > 0 && (
                    <>
                      <div className="flex justify-between text-navy-950/60">
                        <span>Selected Meals</span>
                        <span className="font-bold text-navy-950">{fmt(mealTotal)}</span>
                      </div>
                      <div className="flex justify-between text-navy-950/60 text-xs">
                        <span className="text-navy-950/50">Meals GST (5%)</span>
                        <span className="font-bold text-navy-950/70">{fmt(mealTaxes)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-3 border-t border-sand-100">
                    <span className="text-lg font-bold text-navy-950">Total</span>
                    <span className="text-lg font-bold text-navy-950">{fmt(grandTotal)}</span>
                  </div>
                  {currency === "USD" && (
                    <p className="text-[10px] text-navy-950/30 italic text-right">*Approx. rate. Charged in INR</p>
                  )}
                </div>

                <div className="mt-6 p-4 bg-sand-50 rounded-2xl flex gap-3 items-start">
                  <Info className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-navy-950/50 italic">Free cancellation up to 48 hours before check-in.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
