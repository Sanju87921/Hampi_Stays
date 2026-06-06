import { motion } from "framer-motion";
import { Compass, ShieldCheck, MapPin, Sparkles } from "lucide-react";

export function LocalExpertise() {
  return (
    <section className="py-24 bg-navy-950 relative overflow-hidden text-sand-50">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sand-100/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Story Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="flex items-center gap-2 text-gold-500 font-bold tracking-[0.2em] uppercase text-xs mb-6">
              <MapPin className="w-4 h-4" />
              Your Local Curator
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-8 leading-[1.1] text-white">
              Based in Hampi, <br />
              <span className="text-gold-400">Not Silicon Valley.</span>
            </h2>
            
            <p className="text-lg text-sand-200/80 mb-8 leading-relaxed font-light max-w-xl">
              Unlike generic global booking platforms, HampiStays is built by locals living just 10km from the Vijayanagara ruins. We personally visit, vet, and verify every single luxury resort on this platform. 
            </p>
            <p className="text-lg text-sand-200/80 mb-12 leading-relaxed font-light max-w-xl">
              When you book with us, you aren't just getting a room. You get insider access to secret sunset spots, the finest local guides, and the absolute best rates because we work directly with the property owners—our neighbors.
            </p>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0 border border-gold-500/20">
                  <ShieldCheck className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-2 tracking-wide">Personally Audited</h4>
                  <p className="text-sm text-sand-300/70 leading-relaxed">No misleading photos. If it's on HampiStays, we've walked the grounds.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0 border border-gold-500/20">
                  <Sparkles className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-2 tracking-wide">Tailored Experiences</h4>
                  <p className="text-sm text-sand-300/70 leading-relaxed">We pair your stay with exclusive heritage walks and private coracle rides.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Visual Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden relative shadow-2xl shadow-gold-900/20">
              <div className="absolute inset-0 bg-navy-900/20 z-10 mix-blend-overlay"></div>
              <img 
                src="/hampi-chariot.png" 
                alt="Local Hampi Curator" 
                className="w-full h-full object-cover"
              />
              {/* Floating Badge */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl z-20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center shrink-0">
                    <Compass className="w-6 h-6 text-navy-950" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg mb-1">Local Support 24/7</p>
                    <p className="text-sand-200/80 text-sm">We're always just a few minutes away.</p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Decorative image border */}
            <div className="absolute -inset-4 border border-gold-500/20 rounded-[3rem] -z-10 hidden md:block"></div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
