import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import { GoogleLogin } from "@react-oauth/google";

// GOOGLE_CLIENT_ID is handled by the GoogleLogin component internally

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const hampiImages = [
    "/images/hampi-2.png", // Virupaksha Temple
    "/images/hampi-1.png", // Stone Chariot
    "/images/hampi-4.png", // Lotus Mahal
    "/images/hampi-3.png"  // Boulders
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % hampiImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      if (err.message === "new_traveler_detected") {
        setError("✨ New to HampiStays? Join us to begin your journey.");
      } else {
        setError(err.message || "Invalid email or password");
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
      navigate("/dashboard");
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-sand-50 p-4 md:p-6 lg:p-8 gap-4 md:gap-6 lg:gap-8 overflow-x-hidden">
      {/* Left Panel: Cinematic Image */}
      <div className="relative w-full md:w-1/2 h-[40vh] md:h-auto md:flex-1 overflow-hidden rounded-[15px] shadow-2xl">
        <AnimatePresence>
          <motion.img
            key={currentImageIndex}
            src={hampiImages[currentImageIndex]}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            alt="Scenic Hampi"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
        <div className="absolute inset-0 bg-navy-950/20" />
        
        <div className="absolute bottom-10 left-10 right-10 text-white z-10 hidden md:block">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <h2 className="text-4xl font-serif font-bold mb-4 leading-tight text-shadow-lg">
              Return to your <br />
              <span className="text-gold-400 italic">Sanctuary</span>
            </h2>
            <p className="text-sand-100/90 max-w-md leading-relaxed text-shadow-md">
              Sign in to manage your luxury experiences, upcoming stays, and exclusive member benefits.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel: Glassmorphism Form */}
      <div className="relative w-full md:w-1/2 h-[60vh] md:h-auto md:flex-1 flex flex-col items-center p-6 md:p-12 lg:p-24 z-10 bg-white/40 backdrop-blur-md rounded-[15px] border border-white/20 overflow-y-auto">
        {/* Ambient warm orbs */}
        <div className="absolute top-1/4 right-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-gold-200/30 rounded-full blur-[80px] md:blur-[120px] pointer-events-none animate-float-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-sand-300/30 rounded-full blur-[70px] md:blur-[100px] pointer-events-none animate-float" />

        <div className="w-full max-w-md my-auto">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="w-full bg-sand-100/90 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-luxury border border-sand-200/50 relative"
          >
            {/* Back button */}
            <Link to="/" className="absolute top-8 left-8 text-navy-800/40 hover:text-navy-950 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>

            <motion.div variants={itemVariant} className="flex justify-center mb-8 mt-4">
              <Link to="/" className="inline-block transition-transform hover:scale-105 duration-300">
                <img src="/logo-full.png" alt="HampiStays" className="h-20 md:h-14 w-auto object-contain drop-shadow-md" />
              </Link>
            </motion.div>

            <motion.div variants={itemVariant} className="text-center mb-10">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-navy-950 mb-3">Welcome Back</h1>
              <p className="text-xs md:text-sm text-navy-800/60 font-medium">Please enter your details to sign in.</p>
              {error && (
                <p className={cn(
                  "text-sm font-bold mt-4 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2",
                  error.includes("New to HampiStays") 
                    ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm" 
                    : "bg-red-50 text-red-500 border-red-100"
                )}>
                  {error}
                </p>
              )}
            </motion.div>

            <motion.form variants={itemVariant} className="space-y-4" onSubmit={handleLogin}>
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

              <div className="flex items-center justify-between py-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-sand-300 text-gold-500 focus:ring-gold-400 transition-colors" />
                  <span className="text-sm font-medium text-navy-800/60 group-hover:text-navy-950 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm font-bold text-gold-600 hover:text-sunset-500 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full h-14 text-lg mt-4 shadow-gold" isLoading={isLoading}>
                Sign In
              </Button>
            </motion.form>

            <motion.div variants={itemVariant} className="mt-10">
              <div className="relative flex items-center py-5">
                <div className="flex-grow border-t border-sand-200"></div>
                <span className="flex-shrink-0 mx-4 text-navy-800/40 text-sm font-bold uppercase tracking-widest">Or continue with</span>
                <div className="flex-grow border-t border-sand-200"></div>
              </div>

              <div className="flex justify-center mt-4">
                <GoogleLogin
                  onSuccess={onGoogleSuccess}
                  onError={onGoogleError}
                  theme="filled_blue"
                  shape="pill"
                  size="large"
                  text="continue_with"
                  width="100%"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariant} className="text-center mt-10">
              <p className="text-navy-800/60 font-medium">
                Don't have an account?{" "}
                <Link to="/register" className="text-gold-600 font-bold hover:text-sunset-500 transition-colors">
                  Sign up
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
