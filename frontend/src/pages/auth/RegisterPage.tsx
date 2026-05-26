import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowLeft, Luggage, Key, Check, Users, Mail, Smartphone, ShieldCheck, RefreshCw, CheckCircle2, Compass } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../utils/cn";
import { useAuth } from "../../context/AuthContext";
import { PremiumIcon } from "../../components/ui/PremiumIcon";
import { GoogleAuthButton } from "../../components/auth/GoogleAuthButton";
import { AppleAuthButton } from "../../components/auth/AppleAuthButton";
import { toast } from "react-hot-toast";
import { useSystem } from "../../context/SystemContext";
import { CinematicLogo } from "../../components/ui/CinematicLogo";
import { apiClient } from "../../utils/apiClient";

// GOOGLE_CLIENT_ID is handled by the GoogleLogin component internally

type UserRole = "guest" | "owner" | "guide" | null;

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email");
  const [role, setRole] = useState<UserRole>(emailParam ? "guest" : null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState("");
  const { settings } = useSystem();
  const guideServiceEnabled = settings?.guideServiceEnabled ?? true;
  const { register, loginWithGoogle, loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const premiumMessage = searchParams.get("message");

  
  const hampiImages = [
    "/images/auth-bg.png", // Serene Dawn Landscape
    "/images/hampi-1.png", // Stone Chariot
    "/images/hampi-4.png", // Lotus Mahal
    "/images/hampi-2.png", // Virupaksha
    "/images/hampi-3.png"  // Boulders
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % hampiImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: emailParam || "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false
  });

  const [verificationMethod, setVerificationMethod] = useState<"email" | "sms">("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(30);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  const handleNext = () => {
    if (role) setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{9,}$/;
    if (!passwordRegex.test(formData.password)) {
      return setError("Password must be at least 9 characters and include at least one special character.");
    }
    if (!formData.terms) return setError("You must agree to the terms");
    setError("");
    setStep(3);
  };

  const sendOtp = async (method: "email" | "sms") => {
    setIsSendingOtp(true);
    setError("");
    try {
      if (method === "email") {
        const res = await apiClient.post<any>('/auth/send-email-otp', { email: formData.email });
        if (res?.devOtp) {
          toast.success(`[Test Mode] Verification code: ${res.devOtp}`, { duration: 10000 });
        }
      } else {
        const res = await apiClient.post<any>('/auth/send-mobile-otp', { phone: formData.phone });
        if (res?.devOtp) {
          toast.success(`[Test Mode] Verification code: ${res.devOtp}`, { duration: 10000 });
        }
      }
      startCountdown();
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleStartVerification = async (method: "email" | "sms") => {
    setVerificationMethod(method);
    setOtp(["", "", "", "", "", ""]);
    setStep(4);
    try {
      setIsSendingOtp(true);
      setError("");
      const apiRole = role === "guest" ? "TRAVELLER" : role === "owner" ? "RESORT_OWNER" : "GUIDE";
      const res = await register(
        formData.name,
        formData.email,
        formData.phone,
        formData.password,
        apiRole as any,
        method
      );
      if (res?.devOtp) {
        toast.success(`[Test Mode] Verification code: ${res.devOtp}`, { duration: 10000 });
      }
      startCountdown();
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      setStep(3);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    setError("");
    try {
      const enteredOtp = otp.join("");
      if (enteredOtp.length !== 6) throw new Error("Please enter the complete 6-digit code.");

      await loginWithOtp({
        otp: enteredOtp,
        email: formData.email,
        phone: formData.phone,
        otpType: verificationMethod === "sms" ? "mobile" : "email"
      });

      setVerifiedSuccess(true);
      const redirectUrl = searchParams.get("redirect");
      setTimeout(() => {
        if (redirectUrl) {
          navigate(decodeURIComponent(redirectUrl));
        } else {
          navigate("/dashboard");
        }
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };


  const onGoogleSuccess = async (response: any) => {
    setError("");
    try {
      const apiRole = role === "guest" ? "TRAVELLER" : role === "owner" ? "RESORT_OWNER" : "GUIDE";
      await loginWithGoogle(response.credential, apiRole as any);
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        navigate(decodeURIComponent(redirectUrl));
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Google login failed. Please try again.");
    }
  };

  const itemVariant: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-[1400px] md:h-[800px] flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8 overflow-x-hidden">
      {/* ── LEFT PANEL: Form ── */}
      <div className="relative w-full md:w-1/2 min-h-[60vh] h-auto md:h-full flex flex-col items-center p-4 md:p-8 lg:p-12 z-10 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/20 overflow-y-auto">
        {/* Ambient orbs */}
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-gold-200/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-sand-300/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md my-auto relative z-10">
          {/* Card */}
          <div className="w-full bg-sand-100/90 backdrop-blur-2xl p-6 sm:p-8 md:p-12 rounded-[2.5rem] shadow-luxury border border-sand-200/50 relative">
            
            {/* Back button */}
            <button
              onClick={() => {
                if (step === 4) setStep(3);
                else if (step === 3) setStep(2);
                else if (step === 2) setStep(1);
                else window.history.back();
              }}
              className="absolute top-8 left-8 text-navy-800/40 hover:text-navy-950 transition-colors z-20"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            {/* Logo */}
            <div className="flex flex-col items-center mb-8 mt-4 relative z-20">
              <Link to="/" className="inline-block mb-6">
                <CinematicLogo size="md" />
              </Link>

              {premiumMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/10 border border-gold-500/20 rounded-full mb-2 shadow-sm"
                >
                  <Compass className="w-4 h-4 text-gold-600 animate-pulse" />
                  <span className="text-[10px] font-black text-gold-700 uppercase tracking-[0.2em]">{premiumMessage}</span>
                </motion.div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0, transition: { staggerChildren: 0.1, duration: 0.4 } },
                    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
                  }}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                >
                  <motion.div variants={itemVariant} className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-navy-950 mb-2">
                      Join HampiStays
                    </h1>
                    <p className="text-xs md:text-sm text-navy-800/60 font-medium">
                      How would you like to use our platform?
                    </p>
                  </motion.div>

                  <motion.div variants={itemVariant} className="grid grid-cols-1 gap-4 mb-8">
                    {/* Traveler Card */}
                    <div
                      onClick={() => setRole("guest")}
                      className={cn(
                        "p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group bg-sand-50/50 backdrop-blur-sm",
                        role === "guest"
                          ? "border-gold-500 shadow-gold scale-[1.02]"
                          : "border-sand-200 hover:border-gold-300 hover:bg-sand-100/80"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <PremiumIcon 
                          icon={Luggage} 
                          variant={role === "guest" ? "gold" : "sand"} 
                          size="md" 
                          animate={false} 
                        />
                        <div>
                          <h3
                            className={cn(
                              "font-bold text-base transition-colors",
                              role === "guest" ? "text-gold-700" : "text-navy-950"
                            )}
                          >
                            Traveler
                          </h3>
                          <p className="text-sm text-navy-800/60 leading-snug">
                            I want to book luxury stays and experiences.
                          </p>
                        </div>
                      </div>
                      {role === "guest" && (
                        <motion.div
                          layoutId="check"
                          className="absolute top-4 right-4 text-gold-500"
                        >
                          <Check className="w-5 h-5" />
                        </motion.div>
                      )}
                    </div>

                    {/* Resort Owner Card */}
                    <div
                      onClick={() => setRole("owner")}
                      className={cn(
                        "p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group bg-sand-50/50 backdrop-blur-sm",
                        role === "owner"
                          ? "border-sunset-500 shadow-luxury scale-[1.02]"
                          : "border-sand-200 hover:border-sunset-300 hover:bg-sand-100/80"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <PremiumIcon 
                          icon={Key} 
                          variant={role === "owner" ? "navy" : "sand"} 
                          size="md" 
                          animate={false} 
                        />
                        <div>
                          <h3
                            className={cn(
                              "font-bold text-base transition-colors",
                              role === "owner" ? "text-sunset-700" : "text-navy-950"
                            )}
                          >
                            Resort Owner
                          </h3>
                          <p className="text-sm text-navy-800/60 leading-snug">
                            I want to list my premium property.
                          </p>
                        </div>
                      </div>
                      {role === "owner" && (
                        <motion.div
                          layoutId="check2"
                          className="absolute top-4 right-4 text-sunset-500"
                        >
                          <Check className="w-5 h-5" />
                        </motion.div>
                      )}
                    </div>

                    {/* Local Guide Card */}
                    {guideServiceEnabled && (
                      <div
                        onClick={() => setRole("guide")}
                        className={cn(
                          "p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group bg-sand-50/50 backdrop-blur-sm",
                          role === "guide"
                            ? "border-navy-500 shadow-luxury scale-[1.02]"
                            : "border-sand-200 hover:border-navy-300 hover:bg-sand-100/80"
                        )}
                      >
                        <div className="flex items-center gap-4">
                        <PremiumIcon 
                          icon={Compass} 
                          variant={role === "guide" ? "gold" : "sand"} 
                          size="md" 
                          animate={false} 
                        />
                          <div>
                            <h3
                              className={cn(
                                "font-bold text-base transition-colors",
                                role === "guide" ? "text-navy-700" : "text-navy-950"
                              )}
                            >
                              Local Expert / Guide
                            </h3>
                            <p className="text-sm text-navy-800/60 leading-snug">
                              I want to offer tours and local expertise.
                            </p>
                          </div>
                        </div>
                        {role === "guide" && (
                          <motion.div
                            layoutId="check3"
                            className="absolute top-4 right-4 text-navy-500"
                          >
                            <Check className="w-5 h-5" />
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariant} className="flex justify-center">
                    <Button
                      className={cn(
                        "w-[85%] h-12 text-sm shadow-luxury rounded-2xl transition-all duration-300",
                        role === "guest"
                          ? "bg-gold-500 hover:bg-gold-400 text-navy-950"
                          : role === "owner"
                          ? "bg-navy-950 hover:bg-gold-500 text-white hover:text-navy-950"
                          : role === "guide"
                          ? "bg-navy-900 hover:bg-navy-950 text-white"
                          : "bg-sand-200 pointer-events-none text-navy-800/40 shadow-none"
                      )}
                      onClick={handleNext}
                    >
                      Continue
                    </Button>
                  </motion.div>

                  <motion.div variants={itemVariant} className="text-center mt-6">
                    <p className="text-navy-800/60 font-medium text-sm">
                      Already have an account?{" "}
                      <Link
                        to={searchParams.get("redirect") ? `/login?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : "/login"}
                        className="text-gold-600 font-bold hover:text-sunset-500 transition-colors"
                      >
                        Sign in
                      </Link>
                    </p>
                  </motion.div>
                </motion.div>
              ) : step === 2 ? (
                <motion.div
                  key="step2"
                  variants={{
                    hidden: { opacity: 0, x: 50 },
                    show: { opacity: 1, x: 0, transition: { staggerChildren: 0.1, duration: 0.4 } },
                    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
                  }}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                >
                  <motion.div variants={itemVariant} className="text-center mb-6">
                    <h1 className="text-3xl font-serif font-bold text-navy-950 mb-1">
                      Create Account
                    </h1>
                    <p className="text-navy-800/60 font-medium text-sm">
                      As a {role === "guest" ? "Premium Traveler" : role === "owner" ? "Resort Partner" : "Local Expert"}
                    </p>
                    {error && <p className="text-red-500 text-sm font-bold mt-4 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
                  </motion.div>

                  <motion.form
                    variants={itemVariant}
                    className="space-y-4"
                    onSubmit={handleRegister}
                  >
                    <Input
                      label="Full Name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="Password"
                      type="password"
                      hint="Min. 9 characters + special character"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      hint="Must match the password above"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                    />

                    <div className="pt-1 pb-2">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="mt-1 w-4 h-4 rounded border-sand-300 text-gold-500 focus:ring-gold-400 transition-colors"
                          checked={formData.terms}
                          onChange={(e) =>
                            setFormData({ ...formData, terms: e.target.checked })
                          }
                        />
                        <span className="text-sm font-medium text-navy-800/60 group-hover:text-navy-950 transition-colors leading-relaxed">
                          I agree to the{" "}
                          <Link to="/terms" className="font-bold underline text-gold-600">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link to="/privacy" className="font-bold underline text-gold-600">
                            Privacy Policy
                          </Link>
                        </span>
                      </label>
                    </div>

                    <div className="flex justify-center pt-2">
                      <Button 
                        type="submit" 
                        isLoading={isVerifying}
                        className="w-[85%] h-12 text-sm shadow-luxury rounded-2xl mx-auto block"
                      >
                        Complete Registration
                      </Button>
                    </div>
                  </motion.form>

                  <motion.div variants={itemVariant} className="mt-8">
                    <div className="relative flex items-center py-4">
                      <div className="flex-grow border-t border-sand-200/60"></div>
                      <span className="flex-shrink-0 mx-4 text-navy-800/30 text-[9px] font-black uppercase tracking-[0.2em]">Or join with</span>
                      <div className="flex-grow border-t border-sand-200/60"></div>
                    </div>

                    <div className="flex flex-col gap-4 mt-2">
                      <GoogleAuthButton 
                        onSuccess={(cred) => onGoogleSuccess({ credential: cred })}
                        isLoading={isVerifying}
                      />
                      <AppleAuthButton 
                        isLoading={isVerifying}
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariant} className="text-center mt-6">
                    <p className="text-navy-800/60 font-medium text-sm">
                      Already have an account?{" "}
                      <Link
                        to={searchParams.get("redirect") ? `/login?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : "/login"}
                        className="text-gold-600 font-bold hover:text-sunset-500 transition-colors"
                      >
                        Sign in
                      </Link>
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mt-4 opacity-40">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-[9px] uppercase tracking-[0.2em] font-black">256-bit SSL Encrypted</span>
                    </div>
                  </motion.div>
                </motion.div>
              ) : step === 3 ? (
                <motion.div
                  key="step3"
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    show: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
                    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
                  }}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-serif font-bold text-navy-950 mb-2">Verify Your Account</h2>
                    <p className="text-navy-800/60 text-sm font-medium">Choose a verification method to secure your account.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mb-6">
                    {/* Email Verification Card */}
                    <div
                      onClick={() => handleStartVerification("email")}
                      className="p-5 rounded-2xl border border-sand-200 hover:border-gold-400 hover:bg-sand-100/40 cursor-pointer transition-all duration-300 relative overflow-hidden bg-sand-50/50 backdrop-blur-sm group flex items-center gap-4 hover:shadow-luxury"
                    >
                      <PremiumIcon 
                        icon={Mail} 
                        variant="gold" 
                        size="md" 
                        animate={false} 
                      />
                      <div>
                        <h3 className="font-bold text-base text-navy-950 group-hover:text-gold-700 transition-colors">
                          Verify via Email (Gmail)
                        </h3>
                        <p className="text-sm text-navy-800/60 leading-snug">
                          Send a 6-digit OTP code to {formData.email}.
                        </p>
                      </div>
                    </div>

                    {/* SMS Verification Card */}
                    <div
                      onClick={() => handleStartVerification("sms")}
                      className="p-5 rounded-2xl border border-sand-200 hover:border-sunset-400 hover:bg-sand-100/40 cursor-pointer transition-all duration-300 relative overflow-hidden bg-sand-50/50 backdrop-blur-sm group flex items-center gap-4 hover:shadow-luxury"
                    >
                      <PremiumIcon 
                        icon={Smartphone} 
                        variant="navy" 
                        size="md" 
                        animate={false} 
                      />
                      <div>
                        <h3 className="font-bold text-base text-navy-950 group-hover:text-sunset-700 transition-colors">
                          Verify via SMS (Mobile)
                        </h3>
                        <p className="text-sm text-navy-800/60 leading-snug">
                          Send a 6-digit OTP code to {formData.phone}.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step4"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
                  }}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="space-y-6"
                >
                  <AnimatePresence mode="wait">
                    {verifiedSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </motion.div>
                        <h2 className="text-2xl font-serif font-bold text-navy-950 mb-2">Verified!</h2>
                        <p className="text-navy-800/60 text-sm">Your identity has been confirmed. Redirecting...</p>
                      </motion.div>
                    ) : (
                      <motion.div key="form" className="space-y-6">
                        <div className="text-center">
                          <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
                            verificationMethod === 'email' ? "bg-gold-50 text-gold-600" : "bg-navy-50 text-navy-600"
                          )}>
                            {verificationMethod === 'email' ? <Mail className="w-8 h-8" /> : <Smartphone className="w-8 h-8" />}
                          </div>
                          <h2 className="text-2xl font-serif font-bold text-navy-950 mb-1">
                            Verify your {verificationMethod === 'email' ? 'Email' : 'Mobile'}
                          </h2>
                          <p className="text-navy-800/50 text-sm">
                            Code sent to <span className="font-bold text-navy-950">{verificationMethod === 'email' ? formData.email : formData.phone}</span>
                          </p>
                        </div>

                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 text-sm font-bold bg-red-50 border border-red-100 p-3 rounded-xl text-center"
                          >
                            {error}
                          </motion.p>
                        )}

                        {isSendingOtp ? (
                          <div className="flex items-center justify-center gap-3 py-6">
                            <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-navy-800/60">Sending code...</p>
                          </div>
                        ) : (
                          <div className="flex justify-between gap-2 md:gap-3">
                            {otp.map((digit, index) => (
                              <input
                                key={index}
                                ref={el => { otpRefs.current[index] = el; }}
                                id={`otp-${index}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  const newOtp = [...otp];
                                  newOtp[index] = value;
                                  setOtp(newOtp);
                                  if (value && index < 5) otpRefs.current[index + 1]?.focus();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Backspace" && !otp[index] && index > 0) {
                                    otpRefs.current[index - 1]?.focus();
                                  }
                                }}
                                onPaste={(e) => {
                                  const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                                  if (pasted.length === 6) {
                                    setOtp(pasted.split(''));
                                    otpRefs.current[5]?.focus();
                                    e.preventDefault();
                                  }
                                }}
                                className={cn(
                                  "w-full h-14 md:h-16 text-center text-xl font-bold border-2 rounded-2xl outline-none transition-all text-navy-950",
                                  digit ? "bg-navy-950 text-white border-navy-950 shadow-luxury" : "bg-white border-sand-200 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10"
                                )}
                              />
                            ))}
                          </div>
                        )}

                        <div className="space-y-3">
                          <Button
                            onClick={handleVerifyOtp}
                            isLoading={isVerifying}
                            disabled={otp.join('').length !== 6 || isSendingOtp}
                            className="w-full h-14 rounded-2xl bg-navy-950 text-white shadow-luxury"
                          >
                            <ShieldCheck className="w-5 h-5 mr-2" />
                            Verify & Complete Registration
                          </Button>

                          <div className="flex items-center justify-center gap-2">
                            {countdown > 0 ? (
                              <p className="text-sm text-navy-800/40 text-center">
                                Resend available in
                                <span className="font-bold text-navy-950 ml-1">{countdown}s</span>
                              </p>
                            ) : (
                              <button
                                onClick={() => sendOtp(verificationMethod!)}
                                disabled={isSendingOtp}
                                className="flex items-center gap-2 text-sm font-bold text-gold-600 hover:text-gold-500 transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Resend Code
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => { setStep(3); setOtp(["","","","","",""]); setError(""); }}
                            className="w-full text-center text-xs font-bold text-navy-800/30 hover:text-navy-800/60 transition-colors"
                          >
                            Use a different verification method
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Cinematic Image ── */}
      <div className="hidden md:block relative w-full md:w-1/2 h-[40vh] md:h-full overflow-hidden rounded-[3rem] shadow-2xl">
        <AnimatePresence>
          <motion.img
            key={currentImageIndex}
            src={hampiImages[currentImageIndex]}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            alt="Majestic Hampi"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/50 to-transparent" />
        <div className="absolute inset-0 bg-navy-950/20" />

        {/* Carousel Indicators */}
        <div className="absolute top-8 right-10 flex gap-2 z-20">
          {hampiImages.map((_, idx) => (
            <div key={idx} className="h-[2px] w-8 rounded-full bg-white/20 overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gold-400"
                initial={{ width: "0%" }}
                animate={{ width: currentImageIndex === idx ? "100%" : currentImageIndex > idx ? "100%" : "0%" }}
                transition={{ duration: currentImageIndex === idx ? 3 : 0.3, ease: "linear" }}
              />
            </div>
          ))}
        </div>

        {/* Bottom text */}
        <div className="absolute bottom-12 left-10 right-10 text-white z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
          >
            {/* Decorative pill */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
              <span className="text-sand-100 text-xs font-semibold tracking-widest uppercase">
                Hampi, Karnataka
              </span>
            </div>

            <h2 className="text-5xl font-serif font-bold mb-4 leading-tight">
              Begin your <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-300 via-gold-100 to-gold-500 italic drop-shadow-sm">Journey</span>
            </h2>
            <p className="text-sand-100/80 max-w-sm leading-relaxed text-base">
              Join our exclusive community of luxury travelers and premium resort
              owners in the heart of Hampi.
            </p>

            {/* Stats row */}
            <div className="flex gap-8 mt-8">
              {[
                { value: "200+", label: "Luxury Resorts" },
                { value: "10k+", label: "Happy Guests" },
                { value: "4.9★", label: "Avg Rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-sand-200 font-medium mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      </div>
    </div>
  );
}
