import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Map, ArrowRight, Compass, Sparkles, Play, Pause, Headphones, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { MediaImage } from "../ui/MediaImage";

export function DestinationDiscovery() {
  const [isPlaying, setIsPlaying] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    mouseX.set((clientX - left - width / 2) / width);
    mouseY.set((clientY - top - height / 2) / height);
  };

  const springConfig = { damping: 30, stiffness: 100, mass: 1 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const bgX = useTransform(springX, [-0.5, 0.5], ["-5%", "5%"]);
  const bgY = useTransform(springY, [-0.5, 0.5], ["-5%", "5%"]);
  
  const card1X = useTransform(springX, [-0.5, 0.5], ["-20px", "20px"]);
  const card1Y = useTransform(springY, [-0.5, 0.5], ["-20px", "20px"]);
  
  const card2X = useTransform(springX, [-0.5, 0.5], ["20px", "-20px"]);
  const card2Y = useTransform(springY, [-0.5, 0.5], ["20px", "-20px"]);

  return (
    <section className="py-24 md:py-32 bg-navy-950 text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sunset-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Content Left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400 mb-8">
              <Compass className="w-3.5 h-3.5" /> Dynamic Cartography
            </span>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-[1.1]">
              Navigate the <span className="text-gold-400 italic">Ruins</span>
            </h2>
            
            <p className="text-sand-100/70 text-lg leading-relaxed mb-10">
              Immerse yourself in our interactive cartographic grid. Seamlessly discover nearby temples, historical landmarks, and nature trails, and connect them with luxury accommodations curated exclusively for you.
            </p>

            <ul className="space-y-6 mb-12">
              {[
                { title: "Real-time Proximity", desc: "Instantly locate the finest resorts near iconic heritage sites." },
                { title: "Hybrid Satellite View", desc: "Toggle between ancient cartography and high-res satellite mapping." },
                { title: "Curated Trails", desc: "Access recommended excursions mapped directly to your stay." },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20 shrink-0">
                    <Sparkles className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-sand-100/50 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link to="/discovery">
              <Button size="lg" className="h-16 px-10 rounded-2xl bg-gold-500 text-navy-950 hover:bg-gold-400 border-none font-bold group shadow-[0_0_40px_rgba(197,160,89,0.3)] hover:shadow-[0_0_60px_rgba(197,160,89,0.5)] transition-all">
                Launch Explorer Map
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Image/Map Preview Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div 
              className="relative rounded-[2.5rem] overflow-hidden border border-gold-500/20 shadow-2xl group h-[500px]"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
            >
              <motion.div 
                style={{ x: bgX, y: bgY, scale: 1.15 }}
                className="absolute inset-0 w-full h-full"
              >
                <MediaImage 
                  src="/hampi-temple.png" 
                  alt="Interactive Map Preview" 
                  className="w-full h-full object-cover opacity-60"
                />
              </motion.div>
              
              {/* Fake UI Overlay */}
              <div className="absolute inset-0 bg-navy-950/20 pointer-events-none" />
              
              {/* Center Map Element */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="relative flex items-center justify-center">
                  <div className="absolute -inset-8 bg-gold-500/20 rounded-full animate-ping opacity-60 duration-[3000ms]" />
                  <div className="w-20 h-20 rounded-full bg-navy-950/90 border border-gold-500/50 shadow-gold backdrop-blur-md flex items-center justify-center z-10 text-gold-400">
                    <Map className="w-8 h-8" />
                  </div>
                </div>
              </div>

              {/* Audio Snippet Floating Card */}
              <motion.div 
                style={{ x: card1X, y: card1Y }}
                className="absolute top-12 left-12 bg-navy-950/80 backdrop-blur-md border border-gold-500/30 p-4 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] hidden sm:block w-64 z-20 pointer-events-auto"
              >
                <div className="flex items-start gap-4 mb-3">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-gold-500/20">
                    <MediaImage src="/stone-chariot.jpg" alt="Stone Chariot" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-navy-950/20" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Headphones className="w-3 h-3 text-gold-400" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gold-400">Audio Guide</span>
                    </div>
                    <h4 className="text-sm font-bold text-white leading-tight">The Stone Chariot</h4>
                    <p className="text-[10px] text-white/50 mt-1">Vijaya Vittala Temple</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-gold-500 text-navy-950 flex items-center justify-center hover:bg-gold-400 transition-colors shadow-gold shrink-0"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                    <AnimatePresence>
                      {isPlaying && (
                        <motion.div 
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
                          className="absolute top-0 left-0 h-full bg-gold-500"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <Volume2 className="w-3 h-3 text-white/40 shrink-0" />
                </div>
              </motion.div>

              <motion.div 
                style={{ x: card2X, y: card2Y }}
                className="absolute bottom-12 right-12 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl hidden sm:block pointer-events-none z-10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/50 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <div className="h-2 w-20 bg-white/60 rounded-full mb-2" />
                    <div className="h-2 w-12 bg-white/30 rounded-full" />
                  </div>
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
