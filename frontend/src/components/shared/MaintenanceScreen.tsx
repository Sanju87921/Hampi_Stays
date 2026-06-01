import React from "react";
import { motion } from "framer-motion";

export const MaintenanceScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sand-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-[0.03] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center px-6 max-w-lg mx-auto"
      >
        <img 
          src="/logo.png" 
          alt="HampiStays" 
          onError={(e) => (e.currentTarget.src = "/favicon.svg")}
          className="h-16 w-auto mx-auto mb-10 opacity-80" 
        />
        
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-sand-100">
          <div className="w-16 h-16 bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          <h1 className="font-serif text-3xl font-bold text-navy-950 mb-4">Under Maintenance</h1>
          <p className="text-navy-900/70 text-sm leading-relaxed mb-6">
            HampiStays is currently undergoing scheduled maintenance to improve our platform. We are working diligently to restore full service shortly.
          </p>
          <p className="text-xs text-navy-900/50 uppercase tracking-widest font-bold">
            Please check back later
          </p>
        </div>
      </motion.div>
    </div>
  );
};
