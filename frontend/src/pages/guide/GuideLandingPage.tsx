import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ArrowRight, Compass, Users, MapPin, Award } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function GuideLandingPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-sand-50">
      {/* Expert Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-navy-950">
        <div className="absolute inset-0 pointer-events-none z-0">
          <img 
            src="/images/hero.png" 
            alt="Hampi Heritage" 
            className="absolute inset-0 w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/20 to-transparent" />
          
          {/* Floating Ambient Orbs — warm gold tones */}
          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-gold-400/5 rounded-full blur-[120px] animate-float pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 md:w-[500px] md:h-[500px] bg-sunset-500/5 rounded-full blur-[150px] animate-float-slow pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 py-1.5 px-5 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white text-xs sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-4 cursor-default select-none shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse flex-shrink-0" />
            Official Hampi Expert
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-[1.1] text-shadow-lg"
          >
            Welcome to your <span className="text-gold-400 italic">Command Center</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sand-100/80 mb-8 sm:mb-10 px-2 text-shadow-md text-lg max-w-2xl mx-auto"
          >
            Hello {user?.name?.split(' ')[0] || 'Guide'}, your expertise brings Hampi's rich history to life. Manage your tours, review bookings, and track your impact directly from your dashboard.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full flex justify-center"
          >
            <Link to="/dashboard">
              <button className="h-16 px-10 bg-gold-500 hover:bg-gold-400 text-navy-950 font-black rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-xl shadow-gold-500/30 group text-base tracking-wide">
                Enter Dashboard <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Guide Quick Stats */}
      <section className="py-24 bg-sand-50 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sand-300 to-transparent" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-4 text-center">
            {[
              { value: "50+", label: "Tours Hosted" },
              { value: "4.9", label: "Average Rating" },
              { value: "12", label: "Heritage Sites" },
              { value: "100%", label: "Verified Expert" }
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15, ease: "easeOut" }}
                className="flex flex-col items-center group"
              >
                <div className="text-5xl md:text-6xl font-serif font-bold text-gold-600 mb-3 group-hover:scale-105 transition-transform duration-500">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-navy-950 uppercase tracking-[0.2em]">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
