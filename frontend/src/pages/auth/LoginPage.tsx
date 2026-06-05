import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowLeft, Sparkles, Mail, Smartphone, ShieldCheck, RefreshCw, KeyRound } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import { GoogleAuthButton } from "../../components/auth/GoogleAuthButton";
import { AppleAuthButton } from "../../components/auth/AppleAuthButton";
import { CinematicLogo } from "../../components/ui/CinematicLogo";
import { apiClient } from "../../utils/apiClient";
import { toast } from "react-hot-toast";

// GOOGLE_CLIENT_ID is handled by the GoogleLogin component internally

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email");
  const rememberedEmail = typeof window !== 'undefined' ? localStorage.getItem('rememberedEmail') : null;
  const [email, setEmail] = useState(emailParam || rememberedEmail || "");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingEmail, setOnboardingEmail] = useState("");
  const { login, loginWithOtp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const premiumMessage = searchParams.get("message");
  
  const hampiImages = [
    "/images/hampi-1.png", // Stone Chariot
    "/images/hampi-2.png", // Virupaksha Temple
    "/images/hampi-3.png", // Boulders
    "/images/hampi-4.png", // Lotus Mahal
    "/images/auth-bg.png"  // Serene Dawn Landscape
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % hampiImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [otpMethod, setOtpMethod] = useState<"email" | "sms">("email");
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
    setCountdown(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setIsSendingOtp(true);
    setDevOtp(null);
    try {
      if (otpMethod === "email") {
        if (!email) throw new Error("Email address is required.");
        const res = await apiClient.post<any>("/auth/send-email-otp", { email });
        if (res.devOtp) {
          setDevOtp(res.devOtp);
          toast.success(`[Test Mode] OTP: ${res.devOtp}`, { duration: 8000 });
        } else {
          toast.success("Verification code sent successfully!");
        }
      } else {
        if (!phone) throw new Error("Mobile number is required.");
        const res = await apiClient.post<any>("/auth/send-mobile-otp", { phone });
        if (res.devOtp) {
          setDevOtp(res.devOtp);
          toast.success(`[Test Mode] OTP: ${res.devOtp}`, { duration: 8000 });
        } else {
          toast.success("Verification code sent successfully!");
        }
      }
      setOtpStep(2);
      startCountdown();
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      setIsLoading(false);
      return;
    }
    try {
      await loginWithOtp({
        otp: code,
        email: otpMethod === "email" ? email : undefined,
        phone: otpMethod === "sms" ? phone : undefined,
        otpType: otpMethod === "email" ? "email" : "mobile"
      });
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        navigate(decodeURIComponent(redirectUrl));
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split("");
      const newOtp = [...otp];
      pastedData.forEach((char, idx) => {
        if (index + idx < 6) newOtp[index + idx] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedData.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    // Remember the user's ID for next time
    if (email) localStorage.setItem('rememberedEmail', email);

    try {
      await login(email, password);
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        navigate(decodeURIComponent(redirectUrl));
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      if (err.status === 404 || err.data?.code === 'USER_NOT_FOUND') {
        setOnboardingEmail(email);
        setShowOnboarding(true);
      } else if (err.status === 500 || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError("Our servers are currently resting. Please verify your connection or try again in a moment. ⏳");
      } else {
        setError(err.message || "Incorrect password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleSuccess = async (response: any) => {
    setIsLoading(true);
    setError("");
    try {
      await loginWithGoogle(response.credential);
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        navigate(decodeURIComponent(redirectUrl));
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleError = () => {
    setError("Google authentication was unsuccessful. Try again later.");
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariant: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 p-4 md:p-6 lg:p-8 overflow-x-hidden">
      <div className="w-full max-w-[1400px] md:h-[800px] flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
        {/* Left Panel: Cinematic Image */}
        <div className="relative w-full md:w-1/2 h-[40vh] md:h-full overflow-hidden rounded-[3rem] shadow-2xl">
        <AnimatePresence>
          <motion.img
            key={currentImageIndex}
            src={hampiImages[currentImageIndex]}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            alt="Scenic Hampi"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
        <div className="absolute inset-0 bg-navy-950/20" />
        
        {/* Carousel Indicators */}
        <div className="absolute top-8 left-10 flex gap-2 z-20">
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

        <div className="absolute bottom-12 left-10 right-10 text-white z-10 hidden md:block">
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
              Return to your <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-300 via-gold-100 to-gold-500 italic drop-shadow-sm">Sanctuary</span>
            </h2>

            {/* Stats row */}
            <div className="flex gap-6 mt-6">
              {[
                { value: "200+", label: "Resorts" },
                { value: "10k+", label: "Guests" },
                { value: "4.9★", label: "Rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-sand-200 font-medium mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel: Glassmorphism Form */}
      <div className="relative w-full md:w-1/2 min-h-[60vh] h-auto md:h-full flex flex-col items-center p-4 md:p-8 lg:p-12 z-10 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/20 overflow-y-auto">
        {/* Ambient warm orbs */}
        <div className="absolute top-1/4 right-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-gold-200/30 rounded-full blur-[80px] md:blur-[120px] pointer-events-none animate-float-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-sand-300/30 rounded-full blur-[70px] md:blur-[100px] pointer-events-none animate-float" />

        <div className="w-full max-w-md my-auto">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="w-full bg-sand-100/90 backdrop-blur-2xl p-6 md:p-10 rounded-[3rem] shadow-luxury border border-sand-200/50 relative"
          >
            {/* Back button */}
            <Link to="/" className="absolute top-6 left-6 text-navy-800/40 hover:text-navy-950 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>

            <motion.div variants={itemVariant} className="flex flex-col items-center mb-4 mt-2">
              <Link to="/" className="inline-block mb-6">
                <CinematicLogo size="md" />
              </Link>
              
              {premiumMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/10 border border-gold-500/20 rounded-full mb-2 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-gold-600 animate-pulse" />
                  <span className="text-[10px] font-black text-gold-700 uppercase tracking-[0.2em]">{premiumMessage}</span>
                </motion.div>
              )}
            </motion.div>

            <motion.div variants={itemVariant} className="text-center mb-6">
              <h1 className="text-xl md:text-2xl font-serif font-bold text-navy-950 mb-2 capitalize">{getGreeting()}</h1>
              <p className="text-[10px] md:text-xs text-navy-800/60 font-medium">Welcome back to your exclusive retreat.</p>
              {error && (
                <p className={cn(
                  "text-xs font-bold mt-3 p-3 rounded-xl border animate-in fade-in slide-in-from-top-2",
                  error.includes("New to HampiStays") 
                    ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm" 
                    : "bg-red-50 text-red-500 border-red-100"
                )}>
                  {error}
                </p>
              )}
            </motion.div>

            <motion.form variants={itemVariant} className="space-y-3" onSubmit={handleLogin}>
              <Input 
                label="Email Address" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
              <Input 
                label="Password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />

              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-3 h-3 rounded border-sand-300 text-gold-500 focus:ring-gold-400 transition-colors" />
                  <span className="text-[10px] font-medium text-navy-800/60 group-hover:text-navy-950 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-[10px] font-bold text-gold-600 hover:text-sunset-500 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <div className="flex justify-center pt-2">
                <Button 
                  type="submit" 
                  className="w-[85%] h-12 text-sm shadow-luxury rounded-2xl mx-auto block" 
                  isLoading={isLoading}
                >
                  Sign In
                </Button>
              </div>
            </motion.form>

            <motion.div variants={itemVariant} className="mt-8">
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-sand-200/60"></div>
                <span className="flex-shrink-0 mx-4 text-navy-800/30 text-[9px] font-black uppercase tracking-[0.2em]">Or continue with</span>
                <div className="flex-grow border-t border-sand-200/60"></div>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <GoogleAuthButton 
                  onSuccess={(cred) => onGoogleSuccess({ credential: cred })}
                  isLoading={isLoading}
                />
                <AppleAuthButton 
                  isLoading={isLoading}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariant} className="text-center mt-6">
              <p className="text-xs text-navy-800/60 font-medium">
                Don't have an account?{" "}
                <Link to={searchParams.get("redirect") ? `/register?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : "/register"} className="text-gold-600 font-bold hover:text-sunset-500 transition-colors">
                  Sign up
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
        </div>
      </div>
      </div>
      
      {/* Premium Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowOnboarding(false);
                navigate(`/register?email=${encodeURIComponent(onboardingEmail)}`);
              }}
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-md"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="relative bg-sand-50/95 backdrop-blur-2xl w-full max-w-md rounded-[3rem] border border-sand-200/80 overflow-hidden shadow-2xl p-8 md:p-10 text-center z-10"
            >
              {/* Gold luxury accents */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-gold-400 via-gold-600 to-gold-400" />
              
              <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold-500/20">
                <Sparkles className="w-8 h-8 text-gold-600 animate-pulse" />
              </div>

              <h3 className="text-2xl font-serif font-bold text-navy-950 mb-3 leading-tight">
                We couldn’t find an account for this email.
              </h3>
              <p className="text-sm text-navy-950/60 mb-6 font-medium">
                It looks like you’re new to HampiStays.
              </p>

              <div className="bg-white/40 border border-sand-200/50 rounded-2xl p-5 mb-8 italic text-gold-700 font-serif text-sm">
                “Begin your luxury heritage journey with us.”
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => {
                    setShowOnboarding(false);
                    navigate(`/register?email=${encodeURIComponent(onboardingEmail)}`);
                  }}
                  className="w-full h-12 text-sm shadow-gold hover:scale-[1.02] transition-all duration-300 font-bold uppercase tracking-wider rounded-xl bg-navy-950 text-white hover:bg-gold-500 hover:text-navy-950 flex items-center justify-center gap-2"
                >
                  Create Your Account
                </Button>
                
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="text-xs text-navy-950/40 hover:text-navy-950 font-bold uppercase tracking-widest transition-colors"
                >
                  Back to Login
                </button>
              </div>

              {/* Progress bar representing auto-redirect */}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-sand-200">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 6, ease: "linear" }}
                  onAnimationComplete={() => {
                    if (showOnboarding) {
                      setShowOnboarding(false);
                      navigate(`/register?email=${encodeURIComponent(onboardingEmail)}`);
                    }
                  }}
                  className="h-full bg-gold-500"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
