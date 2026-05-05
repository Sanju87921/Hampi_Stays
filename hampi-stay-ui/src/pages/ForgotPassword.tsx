import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function ForgotPassword() {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-sand-50 relative overflow-x-hidden">
      {/* Left Panel: Cinematic Image */}
      <div className="relative w-full md:w-1/2 h-[40vh] md:h-screen overflow-hidden">
        <img
          src="/hampi-dawn.png"
          alt="Ethereal Hampi Landscape at Dawn"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
        <div className="absolute inset-0 bg-navy-950/20" />
        
        <div className="absolute bottom-10 left-10 right-10 text-white z-10 hidden md:block">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <h2 className="text-4xl font-serif font-bold mb-4 leading-tight text-shadow-lg">
              Regain Access to your <br />
              <span className="text-gold-400 italic">Sanctuary</span>
            </h2>
            <p className="text-sand-100/90 max-w-md leading-relaxed text-shadow-md">
              Reset your password to continue managing your luxury experiences and exclusive member benefits.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel: Glassmorphism Form */}
      <div className="relative w-full md:w-1/2 h-screen overflow-y-auto flex flex-col items-center p-6 py-12 md:p-12 lg:p-24 z-10">
        {/* Ambient warm orbs */}
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gold-200/30 rounded-full blur-[120px] pointer-events-none animate-float-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-sand-300/30 rounded-full blur-[100px] pointer-events-none animate-float" />

        <div className="w-full max-w-md my-auto">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="w-full bg-sand-100/90 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-luxury border border-sand-200/50 relative"
          >
            {/* Back button */}
            <Link to="/login" className="absolute top-8 left-8 text-navy-800/40 hover:text-navy-950 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>

            <motion.div variants={itemVariant} className="flex justify-center mb-8 mt-4">
              <Link to="/" className="inline-block transition-transform hover:scale-105 duration-300">
                <img src="/logo-full.png" alt="HampiStays" className="h-14 w-auto object-contain drop-shadow-md" />
              </Link>
            </motion.div>

            {!submitted ? (
              <>
                <motion.div variants={itemVariant} className="text-center mb-10">
                  <h1 className="text-3xl font-serif font-bold text-navy-950 mb-3">Reset Password</h1>
                  <p className="text-navy-800/60 font-medium text-sm">
                    Enter your registered email or phone number to receive a reset link.
                  </p>
                </motion.div>

                <motion.div variants={itemVariant} className="flex p-1 bg-sand-200/50 rounded-xl mb-8">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod("email");
                      setValue("");
                    }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
                      method === "email" 
                        ? "bg-white text-navy-950 shadow-sm" 
                        : "text-navy-800/60 hover:text-navy-900"
                    }`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMethod("phone");
                      setValue("");
                    }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
                      method === "phone" 
                        ? "bg-white text-navy-950 shadow-sm" 
                        : "text-navy-800/60 hover:text-navy-900"
                    }`}
                  >
                    Phone
                  </button>
                </motion.div>

                <motion.form variants={itemVariant} className="space-y-6" onSubmit={handleSubmit}>
                  <Input 
                    label={method === "email" ? "Email Address" : "Phone Number"} 
                    type={method === "email" ? "email" : "tel"} 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={method === "email" ? "name@example.com" : "+91 98765 43210"}
                    required 
                  />

                  <Button type="submit" className="w-full h-14 text-lg mt-2">
                    Send Reset Link
                  </Button>
                </motion.form>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-gold-600" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-navy-950 mb-3">Check your {method}</h2>
                <p className="text-navy-800/70 font-medium text-sm leading-relaxed mb-8">
                  We have sent a password reset link to <br/>
                  <span className="font-bold text-navy-950">{value}</span>
                </p>
                <Button 
                  onClick={() => setSubmitted(false)} 
                  variant="outline"
                  className="w-full h-12"
                >
                  Try another {method}
                </Button>
              </motion.div>
            )}

            <motion.div variants={itemVariant} className="text-center mt-10">
              <p className="text-navy-800/60 font-medium">
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
  );
}
