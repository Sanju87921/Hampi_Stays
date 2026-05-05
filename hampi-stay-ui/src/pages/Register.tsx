import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowLeft, Luggage, Key, Check } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../utils/cn";

type UserRole = "guest" | "owner" | null;

export function Register() {
  const [role, setRole] = useState<UserRole>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const handleNext = () => {
    if (role) setStep(2);
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
    <div className="h-screen flex overflow-hidden bg-sand-50">
      {/* ── LEFT PANEL: Form ── */}
      <div className="relative w-full md:w-1/2 h-screen overflow-y-auto flex flex-col items-center p-6 py-12 md:p-12 lg:p-24 z-10">
        {/* Ambient orbs */}
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-gold-200/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-sand-300/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md my-auto relative z-10">
          {/* Card */}
          <div className="w-full bg-sand-100/90 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-luxury border border-sand-200/50 relative overflow-hidden">
            
            {/* Back button */}
            <button
              onClick={() => step === 2 ? setStep(1) : window.history.back()}
              className="absolute top-8 left-8 text-navy-800/40 hover:text-navy-950 transition-colors z-20"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            {/* Logo */}
            <div className="flex justify-center mb-8 mt-4 relative z-20">
              <Link to="/" className="inline-block transition-transform hover:scale-105 duration-300">
                <img src="/logo-full.png" alt="HampiStays" className="h-14 w-auto object-contain drop-shadow-md" />
              </Link>
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
                    <h1 className="text-3xl font-serif font-bold text-navy-950 mb-2">
                      Join HampiStays
                    </h1>
                    <p className="text-navy-800/60 font-medium">
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
                        <div
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                            role === "guest"
                              ? "bg-gold-100 text-gold-600"
                              : "bg-sand-100 text-navy-800/40 group-hover:bg-gold-50 group-hover:text-gold-500"
                          )}
                        >
                          <Luggage className="w-6 h-6" />
                        </div>
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
                        <div
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                            role === "owner"
                              ? "bg-sunset-100 text-sunset-600"
                              : "bg-sand-100 text-navy-800/40 group-hover:bg-sunset-50 group-hover:text-sunset-500"
                          )}
                        >
                          <Key className="w-6 h-6" />
                        </div>
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
                  </motion.div>

                  <motion.div variants={itemVariant}>
                    <Button
                      className={cn(
                        "w-full h-14 text-lg transition-all duration-300",
                        role === "guest"
                          ? "bg-gold-500 hover:bg-gold-400 text-navy-950"
                          : role === "owner"
                          ? "bg-navy-950 hover:bg-gold-500 text-white hover:text-navy-950"
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
                        to="/login"
                        className="text-gold-600 font-bold hover:text-sunset-500 transition-colors"
                      >
                        Sign in
                      </Link>
                    </p>
                  </motion.div>
                </motion.div>
              ) : (
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
                      As a {role === "guest" ? "Premium Traveler" : "Resort Partner"}
                    </p>
                  </motion.div>

                  <motion.form
                    variants={itemVariant}
                    className="space-y-4"
                    onSubmit={(e) => e.preventDefault()}
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
                      label="Password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
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

                    <Button
                      type="submit"
                      className={cn(
                        "w-full h-14 text-lg mt-4",
                        role === "guest"
                          ? "bg-gold-500 hover:bg-gold-400 text-navy-950"
                          : "bg-navy-950 hover:bg-gold-500 text-white hover:text-navy-950"
                      )}
                    >
                      Create Account
                    </Button>
                  </motion.form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Cinematic Image ── */}
      <div
        className="hidden md:flex relative w-1/2 h-full"
        style={{ background: "linear-gradient(160deg, #1a2340 0%, #0B132B 60%, #0B132B 100%)" }}
      >
        <img
          src="/hampi-temple.png"
          alt="Majestic Virupaksha Temple, Hampi"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080&auto=format&fit=crop";
          }}
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/50 to-transparent" />

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
              <span className="text-gold-400 italic">Journey</span>
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
  );
}
