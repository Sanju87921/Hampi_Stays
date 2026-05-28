import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Mail, Activity, Lock, Key, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../utils/apiClient';
import toast from 'react-hot-toast';

export function AdminProfilePage() {
 const { user, refreshUser } = useAuth();
 
 // Modals state
 const [showPasswordModal, setShowPasswordModal] = useState(false);
 const [showMfaModal, setShowMfaModal] = useState(false);
 
 // Loading states
 const [isResetting, setIsResetting] = useState(false);
 const [isSettingUpMfa, setIsSettingUpMfa] = useState(false);
 const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
 const [isRevoking, setIsRevoking] = useState<string | null>(null);

 // Form states
 const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
 const [mfaData, setMfaData] = useState<{ secret: string, qrCodeUrl: string } | null>(null);
 const [mfaToken, setMfaToken] = useState('');

 // Data states
 const [sessions, setSessions] = useState<any[]>([]);
 const [isLoadingSessions, setIsLoadingSessions] = useState(true);
 const [sessionError, setSessionError] = useState(false);

 useEffect(() => {
 fetchSessions();
 }, []);

 const fetchSessions = async () => {
 setIsLoadingSessions(true);
 setSessionError(false);
 try {
 const data = await apiClient.get<{ success: boolean, sessions: any[] }>('/admin/security/sessions');
 if (data && Array.isArray(data.sessions)) {
 setSessions(data.sessions);
 } else if (Array.isArray(data)) {
 setSessions(data); // Fallback if backend isn't updated yet
 } else {
 setSessions([]);
 }
 } catch (err) {
 setSessionError(true);
 toast.error('Failed to load session activity');
 } finally {
 setIsLoadingSessions(false);
 }
 };

 const handlePasswordReset = async (e: React.FormEvent) => {
 e.preventDefault();
 if (passwordForm.new !== passwordForm.confirm) {
 return toast.error('New passwords do not match');
 }
 
 setIsResetting(true);
 try {
 await apiClient.post('/admin/security/reset-password', {
 currentPassword: passwordForm.current,
 newPassword: passwordForm.new
 });
 toast.success('Password updated successfully');
 setShowPasswordModal(false);
 setPasswordForm({ current: '', new: '', confirm: '' });
 fetchSessions();
 } catch (err: any) {
 toast.error(err.message || 'Failed to reset password');
 } finally {
 setIsResetting(false);
 }
 };

 const handleSetupMfa = async () => {
 setShowMfaModal(true);
 setIsSettingUpMfa(true);
 try {
 const data = await apiClient.post<any>('/admin/security/mfa/setup', {});
 setMfaData(data);
 } catch (err: any) {
 toast.error(err.message || 'Failed to initialize MFA setup');
 setShowMfaModal(false);
 } finally {
 setIsSettingUpMfa(false);
 }
 };

 const handleVerifyMfa = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsVerifyingMfa(true);
 try {
 await apiClient.post('/admin/security/mfa/verify', { token: mfaToken });
 toast.success('MFA enabled successfully');
 setShowMfaModal(false);
 setMfaData(null);
 setMfaToken('');
 refreshUser();
 } catch (err: any) {
 toast.error(err.message || 'Invalid verification code');
 } finally {
 setIsVerifyingMfa(false);
 }
 };

 const handleRevokeSession = async (id: string) => {
 if (id === 'current') return toast.error('Cannot revoke current session');
 setIsRevoking(id);
 try {
 await apiClient.delete(`/admin/security/sessions/${id}`);
 toast.success('Session revoked');
 fetchSessions();
 } catch (err: any) {
 toast.error(err.message || 'Failed to revoke session');
 } finally {
 setIsRevoking(null);
 }
 };

 return (
 <div className="min-h-screen bg-sand-50 pt-32 pb-20">
 <div className="container mx-auto px-4 md:px-8 max-w-5xl">
 
 <div className="flex items-center justify-between mb-12">
 <div>
 <h1 className="text-4xl font-serif font-bold text-navy-950 mb-2">Administrator Profile</h1>
 <p className="text-navy-950 font-medium">Manage your identity, security, and session settings.</p>
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
 className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200 "
 >
 <div className="flex flex-col items-center text-center">
 <div className="w-24 h-24 bg-navy-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-md relative">
 <User className="w-10 h-10 text-navy-950 " />
 <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
 <Shield className="w-3 h-3 text-white" />
 </div>
 </div>
 <h2 className="text-2xl font-bold text-navy-950 mb-1">{user?.name || 'Admin User'}</h2>
 <p className="text-sm font-medium text-navy-950 uppercase tracking-widest mb-6">Operations Console</p>
 
 <div className="w-full space-y-4 text-left">
 <div className="flex items-center p-3 bg-sand-50 rounded-xl">
 <Mail className="w-5 h-5 text-gold-500 mr-3" />
 <div>
 <p className="text-[10px] uppercase font-bold text-navy-950 ">Email Address</p>
 <p className="text-sm font-semibold text-navy-950 ">{user?.email || 'admin@hampistays.com'}</p>
 </div>
 </div>
 <div className="flex items-center p-3 bg-sand-50 rounded-xl">
 <Shield className="w-5 h-5 text-gold-500 mr-3" />
 <div>
 <p className="text-[10px] uppercase font-bold text-navy-950 ">Role Authorization</p>
 <p className="text-sm font-semibold text-navy-950 ">{user?.role || 'ADMIN'}</p>
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
 className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200 "
 >
 <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
 <Lock className="w-5 h-5 mr-3 text-gold-500" />
 Security & Authentication
 </h3>
 
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-sand-200 rounded-2xl hover:border-gold-300 transition-colors">
 <div className="mb-4 sm:mb-0">
 <h4 className="font-bold text-navy-950 mb-1">Password Management</h4>
 <p className="text-sm text-navy-950 ">Update your password regularly to maintain security.</p>
 </div>
 <button 
 onClick={() => setShowPasswordModal(true)}
 className="px-5 py-2.5 bg-navy-950 text-white text-sm font-bold rounded-xl hover:bg-gold-500 hover:text-navy-950 transition-colors"
 >
 Reset Password
 </button>
 </div>

 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-sand-200 rounded-2xl hover:border-gold-300 transition-colors">
 <div className="mb-4 sm:mb-0">
 <h4 className="font-bold text-navy-950 mb-1">Multi-Factor Authentication (MFA)</h4>
 <p className="text-sm text-navy-950 flex items-center">
 <div className={`w-2 h-2 rounded-full mr-2 ${(user as any)?.isMfaEnabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
 {(user as any)?.isMfaEnabled ? 'MFA Enabled' : 'Configuration Required'}
 </p>
 </div>
 {!(user as any)?.isMfaEnabled && (
 <button 
 onClick={handleSetupMfa}
 className="px-5 py-2.5 border border-navy-200 text-navy-950 text-sm font-bold rounded-xl hover:bg-navy-50 transition-colors flex items-center"
 >
 <Key className="w-4 h-4 mr-2" />
 Setup MFA
 </button>
 )}
 </div>
 </div>
 </motion.div>

 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200 "
 >
 <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
 <Activity className="w-5 h-5 mr-3 text-gold-500" />
 Active Sessions
 </h3>
 
 <div className="space-y-4">
 {isLoadingSessions ? (
 <div className="p-4 text-center text-navy-950 flex flex-col items-center">
 <Loader2 className="w-6 h-6 animate-spin text-gold-500 mb-2" />
 Loading sessions...
 </div>
 ) : sessionError ? (
 <div className="p-4 text-center bg-red-50 text-red-600 rounded-xl">
 <p className="mb-2 font-semibold">Failed to load session activity</p>
 <button onClick={fetchSessions} className="px-4 py-2 bg-red-100 rounded-lg font-bold text-xs uppercase hover:bg-red-200">Retry</button>
 </div>
 ) : !Array.isArray(sessions) || sessions.length === 0 ? (
 <div className="p-4 text-center text-navy-950 ">No active sessions found.</div>
 ) : (
 sessions.map((session, i) => (
 <div key={i} className="flex items-center justify-between p-4 bg-sand-50 rounded-xl">
 <div>
 <p className="font-bold text-navy-950 text-sm flex items-center">
 {session.userAgent || 'Unknown Device'}
 {session.id === 'current' && (
 <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase rounded-md">Current</span>
 )}
 </p>
 <p className="text-xs text-navy-950 mt-1">IP: {session.ipAddress}</p>
 </div>
 <div className="flex flex-col items-end">
 <p className="text-xs font-semibold text-navy-950 mb-2">
 {new Date(session.lastSeen).toLocaleString()}
 </p>
 {session.id !== 'current' && (
 <button 
 onClick={() => handleRevokeSession(session.id)}
 disabled={isRevoking === session.id}
 className="text-[10px] uppercase font-bold text-red-500 hover:text-red-700 disabled:opacity-50"
 >
 {isRevoking === session.id ? 'Revoking...' : 'Revoke Session'}
 </button>
 )}
 </div>
 </div>
 ))
 )}
 </div>
 </motion.div>
 </div>
 </div>
 </div>

 {/* Password Reset Modal */}
 <AnimatePresence>
 {showPasswordModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-950/40 backdrop-blur-sm">
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
 >
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-2xl font-bold text-navy-950 ">Reset Password</h3>
 <button onClick={() => setShowPasswordModal(false)} className="text-navy-950 hover:text-navy-950 transition-colors">
 <X className="w-6 h-6" />
 </button>
 </div>
 <form onSubmit={handlePasswordReset} className="space-y-4">
 <div>
 <label className="block text-sm font-bold text-navy-950 mb-1">Current Password</label>
 <input type="password" required className="w-full p-3 bg-sand-50 rounded-xl border border-sand-200 focus:outline-none focus:border-gold-400"
 value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} />
 </div>
 <div>
 <label className="block text-sm font-bold text-navy-950 mb-1">New Password</label>
 <input type="password" required className="w-full p-3 bg-sand-50 rounded-xl border border-sand-200 focus:outline-none focus:border-gold-400"
 value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} />
 </div>
 <div>
 <label className="block text-sm font-bold text-navy-950 mb-1">Confirm New Password</label>
 <input type="password" required className="w-full p-3 bg-sand-50 rounded-xl border border-sand-200 focus:outline-none focus:border-gold-400"
 value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} />
 </div>
 <button type="submit" disabled={isResetting} className="w-full py-3 bg-navy-950 text-white font-bold rounded-xl hover:bg-navy-800 disabled:opacity-50 flex justify-center items-center">
 {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
 </button>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* MFA Setup Modal */}
 <AnimatePresence>
 {showMfaModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-950/40 backdrop-blur-sm">
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
 >
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-2xl font-bold text-navy-950 ">Setup MFA</h3>
 <button onClick={() => setShowMfaModal(false)} className="text-navy-950 hover:text-navy-950 transition-colors">
 <X className="w-6 h-6" />
 </button>
 </div>
 
 {isSettingUpMfa ? (
 <div className="flex flex-col items-center justify-center py-10">
 <Loader2 className="w-10 h-10 animate-spin text-gold-500 mb-4" />
 <p className="text-sm font-medium text-navy-950 ">Generating secure credentials...</p>
 </div>
 ) : mfaData ? (
 <div className="text-center">
 <p className="text-sm font-medium text-navy-950 mb-4">
 Scan this QR code with your authenticator app (Google Authenticator, Authy, etc).
 </p>
 <div className="bg-sand-50 p-4 rounded-2xl inline-block mb-4 border border-sand-200 ">
 <img src={mfaData.qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
 </div>
 <form onSubmit={handleVerifyMfa} className="space-y-4">
 <div>
 <input type="text" required placeholder="Enter 6-digit code" className="w-full text-center p-3 text-xl tracking-widest font-mono bg-sand-50 rounded-xl border border-sand-200 focus:outline-none focus:border-gold-400"
 value={mfaToken} onChange={e => setMfaToken(e.target.value)} maxLength={6} />
 </div>
 <button type="submit" disabled={isVerifyingMfa || mfaToken.length < 6} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 flex justify-center items-center">
 {isVerifyingMfa ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Enable'}
 </button>
 </form>
 </div>
 ) : (
 <div className="text-center text-red-500">Failed to load MFA setup</div>
 )}
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
