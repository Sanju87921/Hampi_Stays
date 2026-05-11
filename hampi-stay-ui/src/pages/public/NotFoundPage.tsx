import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <main className="min-h-screen bg-navy-950 flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Cinematic background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gold-400 rounded-full blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sunset-500 rounded-full blur-[100px] animate-float" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596018382916-56d2e341d784?auto=format&fit=crop&q=40&w=2000')] bg-cover bg-center mix-blend-overlay grayscale" />
      </div>

      <div className="relative z-10 text-center max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <Compass className="w-10 h-10 text-gold-400 animate-pulse" />
          </div>
          
          <h1 className="text-[120px] md:text-[180px] font-serif font-bold text-white leading-none opacity-10 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
            404
          </h1>
          
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">
            Lost in the <span className="text-gold-400 italic">Ruins</span>
          </h2>
          
          <p className="text-sand-100/60 text-lg md:text-xl font-light mb-12 leading-relaxed">
            The path you are seeking has been reclaimed by history. <br className="hidden md:block" /> 
            Let us guide you back to the sanctuary.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link to="/">
            <Button size="lg" className="w-full sm:w-auto h-16 px-10 rounded-2xl flex items-center gap-3 shadow-gold">
              <ArrowLeft className="w-5 h-5" />
              Back to Safety
            </Button>
          </Link>
          <Link to="/resorts">
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-10 rounded-2xl border-white/20 text-white hover:bg-white/10">
              Explore Resorts
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Decorative architectural elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-950 to-transparent z-20" />
    </main>
  );
}
