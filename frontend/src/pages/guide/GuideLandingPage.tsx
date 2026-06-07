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
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Compass, label: "Tours Hosted", value: "Premium" },
              { icon: Users, label: "Global Travelers", value: "VIP Access" },
              { icon: MapPin, label: "Heritage Sites", value: "Verified" }
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-sand-50 rounded-[2rem] p-10 text-center border border-sand-100 hover:shadow-luxury transition-all duration-500 group"
              >
                <div className="w-16 h-16 mx-auto bg-navy-950 rounded-2xl flex items-center justify-center mb-6 text-gold-500 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <stat.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-navy-950 mb-2">{stat.value}</h3>
                <p className="text-navy-950/60 uppercase tracking-widest text-xs font-bold">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
