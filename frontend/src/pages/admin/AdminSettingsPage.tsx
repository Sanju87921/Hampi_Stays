import React from 'react';
import { motion } from 'framer-motion';
import { Settings2, Globe, Moon, Bell, ShieldAlert, Sliders, Check } from 'lucide-react';

export function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-sand-50 pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-navy-950 mb-2">Platform Settings</h1>
          <p className="text-navy-950/60 font-medium">Configure global preferences and operational toggles.</p>
        </div>

        <div className="space-y-6">
          
          {/* Global Preferences */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200"
          >
            <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
              <Sliders className="w-5 h-5 mr-3 text-gold-500" />
              Global Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-navy-950 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-navy-950/50" />
                  Primary Language
                </label>
                <select className="w-full p-3 bg-sand-50 border border-sand-200 rounded-xl text-navy-950 font-medium focus:outline-none focus:border-gold-400">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Hindi</option>
                  <option>Kannada</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-bold text-navy-950 flex items-center">
                  <Moon className="w-4 h-4 mr-2 text-navy-950/50" />
                  Dashboard Theme
                </label>
                <div className="flex bg-sand-50 p-1 rounded-xl border border-sand-200">
                  <button className="flex-1 py-2 text-sm font-bold bg-white text-navy-950 rounded-lg shadow-sm">Light</button>
                  <button className="flex-1 py-2 text-sm font-bold text-navy-950/50 hover:text-navy-950 transition-colors">Dark</button>
                  <button className="flex-1 py-2 text-sm font-bold text-navy-950/50 hover:text-navy-950 transition-colors">System</button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notification Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200"
          >
            <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
              <Bell className="w-5 h-5 mr-3 text-gold-500" />
              Notification Controls
            </h3>
            
            <div className="space-y-4">
              {[
                { title: 'New User Registrations', desc: 'Receive alerts when new owners or guides register.' },
                { title: 'High-Value Bookings', desc: 'Alerts for bookings exceeding $1000.' },
                { title: 'System Alerts', desc: 'Critical system performance and security alerts.' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-sand-100 rounded-xl hover:bg-sand-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-navy-950 text-sm">{item.title}</h4>
                    <p className="text-xs text-navy-950/60 mt-0.5">{item.desc}</p>
                  </div>
                  <button className={`w-12 h-6 rounded-full transition-colors relative ${i !== 1 ? 'bg-gold-500' : 'bg-sand-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${i !== 1 ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Operational & Audit */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200 border-l-4 border-l-red-500"
          >
            <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-3 text-red-500" />
              Operational & Audit Toggles
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-red-50/50 rounded-xl border border-red-100">
                <div className="mb-4 sm:mb-0">
                  <h4 className="font-bold text-red-900 mb-1">Maintenance Mode</h4>
                  <p className="text-xs text-red-800/70">Temporarily disable public access to the platform.</p>
                </div>
                <button className="px-5 py-2 bg-red-100 text-red-700 text-sm font-bold rounded-lg hover:bg-red-200 transition-colors">
                  Enable
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-sand-50 rounded-xl border border-sand-200">
                <div className="mb-4 sm:mb-0">
                  <h4 className="font-bold text-navy-950 mb-1">Detailed Audit Logging</h4>
                  <p className="text-xs text-navy-950/60">Log all read/write operations for compliance.</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-navy-950 text-white text-sm font-bold rounded-lg hover:bg-navy-800 transition-colors">
                  <Check className="w-4 h-4 mr-2 text-gold-400" />
                  Active
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
