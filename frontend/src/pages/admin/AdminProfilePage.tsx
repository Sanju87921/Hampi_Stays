import React from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Mail, Activity, Lock, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminProfilePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-sand-50 pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold text-navy-950 mb-2">Administrator Profile</h1>
            <p className="text-navy-950/60 font-medium">Manage your identity, security, and session settings.</p>
          </div>
          <div className="hidden sm:flex items-center px-4 py-2 bg-navy-950 rounded-full text-white text-xs font-bold tracking-widest uppercase shadow-lg">
            <Shield className="w-4 h-4 mr-2 text-gold-400" />
            Super Admin
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Identity */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-navy-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-md relative">
                  <User className="w-10 h-10 text-navy-950" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-navy-950 mb-1">{user?.name || 'Admin User'}</h2>
                <p className="text-sm font-medium text-navy-950/50 uppercase tracking-widest mb-6">Operations Console</p>
                
                <div className="w-full space-y-4 text-left">
                  <div className="flex items-center p-3 bg-sand-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gold-500 mr-3" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-navy-950/40">Email Address</p>
                      <p className="text-sm font-semibold text-navy-950">{user?.email || 'admin@hampistays.com'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-sand-50 rounded-xl">
                    <Shield className="w-5 h-5 text-gold-500 mr-3" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-navy-950/40">Role Authorization</p>
                      <p className="text-sm font-semibold text-navy-950">{user?.role || 'ADMIN'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Security & Activity */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200"
            >
              <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
                <Lock className="w-5 h-5 mr-3 text-gold-500" />
                Security & Authentication
              </h3>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-sand-200 rounded-2xl hover:border-gold-300 transition-colors">
                  <div className="mb-4 sm:mb-0">
                    <h4 className="font-bold text-navy-950 mb-1">Password Management</h4>
                    <p className="text-sm text-navy-950/60">Update your password regularly to maintain security.</p>
                  </div>
                  <button className="px-5 py-2.5 bg-navy-950 text-white text-sm font-bold rounded-xl hover:bg-gold-500 hover:text-navy-950 transition-colors">
                    Reset Password
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-sand-200 rounded-2xl hover:border-gold-300 transition-colors">
                  <div className="mb-4 sm:mb-0">
                    <h4 className="font-bold text-navy-950 mb-1">Multi-Factor Authentication (MFA)</h4>
                    <p className="text-sm text-navy-950/60 flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                      Configuration Required
                    </p>
                  </div>
                  <button className="px-5 py-2.5 border border-navy-200 text-navy-950 text-sm font-bold rounded-xl hover:bg-navy-50 transition-colors flex items-center">
                    <Key className="w-4 h-4 mr-2" />
                    Setup MFA
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200"
            >
              <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-3 text-gold-500" />
                Recent Session Activity
              </h3>
              
              <div className="space-y-4">
                {[
                  { action: 'Login Successful', ip: '192.168.1.1', time: 'Just now', status: 'success' },
                  { action: 'Dashboard Access', ip: '192.168.1.1', time: '2 hours ago', status: 'success' },
                  { action: 'Curation Update', ip: '192.168.1.1', time: 'Yesterday', status: 'success' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-sand-50 rounded-xl">
                    <div>
                      <p className="font-bold text-navy-950 text-sm">{log.action}</p>
                      <p className="text-xs text-navy-950/50 mt-1">IP: {log.ip}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-navy-950/60">{log.time}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-md">
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
