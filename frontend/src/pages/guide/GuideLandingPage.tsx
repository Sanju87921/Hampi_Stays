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
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1590766940554-63cf3a66fbc0?q=80&w=2000&auto=format&fit=crop" 
            alt="Hampi Heritage" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-500 text-xs font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-md"
          >
            <Award className="w-4 h-4" /> Official Hampi Expert
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight"
          >
            Welcome to your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 italic">Expert Command Center</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-sand-200 max-w-2xl mx-auto mb-10 font-medium"
          >
            Hello {user?.name?.split(' ')[0] || 'Guide'}, your expertise brings Hampi's rich history to life. Manage your tours, review bookings, and track your impact directly from your dashboard.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/dashboard">
              <Button className="rounded-xl shadow-luxury h-14 px-8 bg-gold-500 text-navy-950 hover:bg-gold-400 border-none transition-all text-lg uppercase tracking-wider font-bold">
                Enter Dashboard <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
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
