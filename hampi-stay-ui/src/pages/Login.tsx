import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    <div className="min-h-screen flex flex-col md:flex-row bg-sand-50 relative overflow-x-hidden">
      {/* Left Panel: Cinematic Image */}
      <div className="relative w-full md:w-1/2 h-[40vh] md:h-screen overflow-hidden">
        <img
          src="/hampi-lotus.png"
          alt="Elegant Lotus Mahal, Hampi"
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
            <Link to="/" className="absolute top-8 left-8 text-navy-800/40 hover:text-navy-950 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>

            <motion.div variants={itemVariant} className="flex justify-center mb-8 mt-4">
              <Link to="/" className="inline-block transition-transform hover:scale-105 duration-300">
                <img src="/logo-full.png" alt="HampiStays" className="h-14 w-auto object-contain drop-shadow-md" />
              </Link>
            </motion.div>

            <motion.div variants={itemVariant} className="text-center mb-10">
              <h1 className="text-3xl font-serif font-bold text-navy-950 mb-3">Welcome Back</h1>
              <p className="text-navy-800/60 font-medium">Please enter your details to sign in.</p>
            </motion.div>

            <motion.form variants={itemVariant} className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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

              <Button type="submit" className="w-full h-14 text-lg mt-4">
                Sign In
              </Button>
            </motion.form>

            <motion.div variants={itemVariant} className="mt-10">
              <div className="relative flex items-center py-5">
                <div className="flex-grow border-t border-sand-200"></div>
                <span className="flex-shrink-0 mx-4 text-navy-800/40 text-sm font-bold uppercase tracking-widest">Or continue with</span>
                <div className="flex-grow border-t border-sand-200"></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <button className="flex items-center justify-center gap-2 h-12 bg-sand-50 border border-sand-200 rounded-xl hover:bg-gold-50 hover:text-gold-700 hover:border-gold-300 hover:shadow-md transition-all duration-300 group">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
                  <span className="text-sm font-bold text-navy-950 group-hover:text-gold-700 transition-colors">Google</span>
                </button>
                <button className="flex items-center justify-center gap-2 h-12 bg-sand-50 border border-sand-200 rounded-xl hover:bg-gold-50 hover:text-gold-700 hover:border-gold-300 hover:shadow-md transition-all duration-300 group">
                  <img src="https://www.svgrepo.com/show/511330/apple-173.svg" className="w-5 h-5 opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all" alt="Apple" />
                  <span className="text-sm font-bold text-navy-950 group-hover:text-gold-700 transition-colors">Apple</span>
                </button>
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
