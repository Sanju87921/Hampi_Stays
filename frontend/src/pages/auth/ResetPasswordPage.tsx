import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Check, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { apiClient } from "../../utils/apiClient";
import { CinematicLogo } from "../../components/ui/CinematicLogo";
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const hampiImages = [
    "/images/hampi-3.png", // Boulders
    "/images/hampi-4.png", // Lotus Mahal
    "/images/hampi-1.png", // Stone Chariot
    "/images/hampi-2.png", // Virupaksha Temple
    "/images/auth-bg.png"  // Serene Dawn Landscape
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % hampiImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Validation Rules
  const hasMinLength = password.length >= 9;
  const hasSpecialChar = /^(?=.*[!@#$%^&*(),.?":{}|<>]).*$/.test(password);
  const passwordsMatch = password && password === confirmPassword;
  const isFormValid = hasMinLength && hasSpecialChar && passwordsMatch;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !token || !email) {
      if (!token || !email) {
        setError("Invalid reset link parameters. Please request a new password reset email.");
      }
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await apiClient.post("/auth/reset-password", {
        token,
        email,
        password
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Link might be expired.");
    } finally {
      setIsLoading(false);
    }
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
          <div className="absolute inset-0 bg-navy-950/20" />
          
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
                Secure your <br />
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
        <div className="relative w-full md:w-1/2 h-[60vh] md:h-full flex flex-col items-center p-6 md:p-8 lg:p-12 z-10 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/20 overflow-y-auto">
          {/* Ambient warm orbs */}
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gold-200/30 rounded-full blur-[120px] pointer-events-none animate-float-slow" />
          <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-sand-300/30 rounded-full blur-[100px] pointer-events-none animate-float" />

          <div className="w-full max-w-md my-auto relative z-10">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="w-full bg-sand-100/90 backdrop-blur-2xl p-6 md:p-10 rounded-[3rem] shadow-luxury border border-sand-200/50 relative"
            >
              {/* Back button */}
              <Link to="/login" className="absolute top-6 left-6 text-navy-800/40 hover:text-navy-950 transition-colors z-20">
                <ArrowLeft className="w-6 h-6" />
              </Link>

              <motion.div variants={itemVariant} className="flex justify-center mb-4 mt-2">
                <Link to="/" className="inline-block transition-transform hover:scale-105 duration-300">
                  <CinematicLogo size="md" />
                </Link>
              </motion.div>

              {!submitted ? (
                <>
                  <motion.div variants={itemVariant} className="text-center mb-6">
                    <h1 className="text-xl md:text-2xl font-serif font-bold text-navy-950 mb-2">New Password</h1>
                    <p className="text-navy-800/60 font-medium text-[10px] md:text-xs">
                      Set a secure password for <span className="font-bold text-navy-950">{email || "your account"}</span>
                    </p>
                  </motion.div>

                  <motion.form variants={itemVariant} className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold animate-shake">
                        {error}
                      </div>
                    )}

                    {/* New Password Input */}
                    <div className="relative">
                      <Input 
                        label="New Password" 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="•••••••••"
                        required 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 bottom-3 text-navy-800/40 hover:text-navy-950 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Confirm Password Input */}
                    <div className="relative">
                      <Input 
                        label="Confirm Password" 
                        type={showConfirmPassword ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="•••••••••"
                        required 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 bottom-3 text-navy-800/40 hover:text-navy-950 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Checklist */}
                    <div className="bg-sand-50/80 border border-sand-200/50 p-4 rounded-2xl space-y-2 text-[11px] font-medium text-navy-800/70">
                      <div className="flex items-center gap-2">
                        {hasMinLength ? (
                          <Check className="w-3.5 h-3.5 text-green-600 font-bold" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-red-500 font-bold" />
                        )}
                        <span className={hasMinLength ? "text-green-700" : ""}>Minimum 9 characters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSpecialChar ? (
                          <Check className="w-3.5 h-3.5 text-green-600 font-bold" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-red-500 font-bold" />
                        )}
                        <span className={hasSpecialChar ? "text-green-700" : ""}>At least one special character (!@#$ etc.)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordsMatch ? (
                          <Check className="w-3.5 h-3.5 text-green-600 font-bold" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-red-500 font-bold" />
                        )}
                        <span className={passwordsMatch ? "text-green-700" : ""}>Passwords match exactly</span>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base mt-2 shadow-gold" 
                      isLoading={isLoading}
                      disabled={!isFormValid}
                    >
                      Reset Password
                    </Button>
                  </motion.form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-serif font-bold text-navy-950 mb-2">Password Reset Successful</h2>
                  <p className="text-navy-800/70 font-medium text-xs leading-relaxed mb-6">
                    Your password has been successfully reset. You can now login with your new credentials.
                  </p>
                  <Button 
                    onClick={() => navigate("/login")} 
                    className="w-full h-12 text-sm shadow-gold"
                  >
                    Go to Login
                  </Button>
                </motion.div>
              )}

              <motion.div variants={itemVariant} className="text-center mt-6">
                <p className="text-xs text-navy-800/60 font-medium">
                  Remember your password?{" "}
                  <Link to="/login" className="text-gold-600 font-bold hover:text-sunset-500 transition-colors">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
