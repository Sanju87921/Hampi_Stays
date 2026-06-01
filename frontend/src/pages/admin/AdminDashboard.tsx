import { useModal } from '../../components/shared/ModalProvider';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
 ShieldCheck, ShieldOff, CheckCircle, XCircle, ExternalLink, MapPin, 
 User, Mail, LayoutDashboard, Building2, Users, CalendarDays, 
 TrendingUp, Star, AlertCircle, Search, Filter, Sparkles, Download, Award,
 Eye, EyeOff, Loader2, KeyRound, Smartphone, BadgeCheck, ShieldAlert, History, UserX, FileText, Tag, QrCode
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { cn } from "../../utils/cn";
import { apiClient } from "../../utils/apiClient";
import { useSystem } from "../../context/SystemContext";
import { API_BASE_URL } from "../../config/api";
import { BlogModule } from "./BlogModule";
import { PromotionsModule } from "./PromotionsModule";
import { UserManagement } from "./components/UserManagement";
import { KycOperationsCenter } from "./components/KycOperationsCenter";
import { ErrorBoundary } from "../../components/shared/ErrorBoundary";

type AdminTab = "overview" | "properties" | "guides" | "users" | "bookings" | "payouts" | "newsletter" | "security" | "reviews" | "otp-logs" | "commissions" | "audit-logs" | "content" | "promotions" | "kyc" | "qr-scanner";

const getKycImageUrl = (idImage: string, transform: string) => {
 if (!idImage) return "";
 const token = localStorage.getItem('hampi-token') || "";
 let fullUrl = idImage;
 
 if (fullUrl.startsWith('/api/')) {
 const stripped = fullUrl.substring(4);
 fullUrl = `${API_BASE_URL}${stripped}`;
 }
 
 const connector = fullUrl.includes('?') ? '&' : '?';
 return `${fullUrl}${connector}transform=${transform}&auth_token=${token}`;
};

const KycImage = ({ src, alt, transform, className }: { src: string; alt: string; transform: string; className?: string }) => {
 const [loaded, setLoaded] = useState(false);
 const [error, setError] = useState(false);

 const imageUrl = getKycImageUrl(src, transform);

 return (
 <div className={cn("relative overflow-hidden bg-sand-100 ", className)}>
 {!loaded && !error && (
 <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-sand-100 via-sand-200 to-sand-100" />
 )}
 {error ? (
 <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-[10px] font-bold text-red-500 uppercase">
 <AlertCircle className="w-5 h-5 mb-1" /> Load Error
 </div>
 ) : (
 <img
 src={imageUrl}
 alt={alt}
 loading="lazy"
 onLoad={() => setLoaded(true)}
 onError={() => setError(true)}
 className={cn(
 "w-full h-full object-cover transition-all duration-500",
 loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
 )}
 />
 )}
 </div>
 );
};

const normalizeArray = (d: any) => {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  if (d && Array.isArray(d.logs)) return d.logs;
  return [];
};

export function AdminDashboard() {
 const { confirm } = useModal();
 const [activeTab, setActiveTab] = useState<AdminTab>("overview");
 const [propertySubTab, setPropertySubTab] = useState<"pending" | "active">("pending");
 const [pendingResorts, setPendingResorts] = useState<any[]>([]);
 const [activeResorts, setActiveResorts] = useState<any[]>([]);
 const [allUsers, setAllUsers] = useState<any[]>([]);
 const [allGuides, setAllGuides] = useState<any[]>([]);
 const [allBookings, setAllBookings] = useState<any[]>([]);
 const [stats, setStats] = useState<any>(null);
 const { settings, updateSettings } = useSystem();
 const guideServiceEnabled = settings?.guideServiceEnabled ?? true;
 const requireOtpForSignup = settings?.requireOtpForSignup ?? true;
 const [showConfirmModal, setShowConfirmModal] = useState(false);
 const [modalData, setModalData] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [processingId, setProcessingId] = useState<string | null>(null);
 const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
 const [securityData, setSecurityData] = useState<{ logs: any[], activeSessions: number }>({ logs: [], activeSessions: 0 });
 const [flaggedReviews, setFlaggedReviews] = useState<any[]>([]);
 const [editingUser, setEditingUser] = useState<any>(null);
 const [isSavingUser, setIsSavingUser] = useState(false);
 const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);
 const [newCommissionRate, setNewCommissionRate] = useState<number>(7.0);
 const [isSavingCommission, setIsSavingCommission] = useState(false);
 const [otpLogs, setOtpLogs] = useState<any[]>([]);
 const [auditLogs, setAuditLogs] = useState<any[]>([]);
 const [bookingTab, setBookingTab] = useState<"all" | "reviews">("all");
 const [reviewReason, setReviewReason] = useState("");

 const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(7.0);
 const [isSavingGlobalCommission, setIsSavingGlobalCommission] = useState(false);

 // Identity verification lightbox & rejection states
 const [selectedIdImage, setSelectedIdImage] = useState<string | null>(null);
 const [selectedIdDetails, setSelectedIdDetails] = useState<{ name: string; type: string; number: string } | null>(null);
 const [rejectingGuideId, setRejectingGuideId] = useState<string | null>(null);
 const [rejectionReasonInput, setRejectionReasonInput] = useState("");

 useEffect(() => {
 fetchInitialData();
 }, []);

 useEffect(() => {
 let interval: ReturnType<typeof setInterval>;
 const pollTabs = ['security', 'otp-logs', 'overview', 'payouts', 'bookings', 'properties', 'users', 'commissions', 'audit-logs', 'guides', 'promotions'];
 
 if (pollTabs.includes(activeTab)) {
 // Pulse: Fast 10s refresh for admin command center
 interval = setInterval(async () => {
 try {
 switch (activeTab) {
 case 'security':
 const secData = await apiClient.get<any>('/admin/security/stats');
 setSecurityData(secData);
 break;
 case 'otp-logs':
 const logs = await apiClient.get<any[]>('/admin/otp-logs');
 setOtpLogs(normalizeArray(logs));
 break;
 case 'overview':
 const st = await apiClient.get<any>('/admin/stats');
 setStats(st);
 break;
 case 'payouts':
 const po = await apiClient.get<any[]>('/admin/payouts');
 setPendingPayouts(po);
 break;
 case 'bookings':
 const bk = await apiClient.get<any[]>('/admin/bookings/all');
 setAllBookings(normalizeArray(bk));
 break;
 case 'properties':
 case 'commissions':
 const pr = await apiClient.get<any[]>('/admin/resorts/pending');
 const ar = await apiClient.get<any[]>('/admin/resorts/active');
 setPendingResorts(pr);
 setActiveResorts(Array.isArray(ar?.data) ? ar.data : (Array.isArray(ar) ? ar : []));
 break;
 case 'users':
 const us = await apiClient.get<any[]>('/admin/users');
 setAllUsers(normalizeArray(us));
 break;
 case 'audit-logs':
 const aLogs = await apiClient.get<any[]>('/admin/audit-logs');
 setAuditLogs(normalizeArray(aLogs));
 break;
 case 'guides':
 const gds = await apiClient.get<any[]>('/admin/guides');
 setAllGuides(normalizeArray(gds));
 break;
 }
 } catch (err) {
 console.error("Admin pulse failed", err);
 }
 }, 10000); // 10s for balanced real-time feel
 }
 return () => clearInterval(interval);
 }, [activeTab]);


 async function fetchInitialData() {
 setIsLoading(true);
 try {
 const statsRes = await apiClient.get<any>('/admin/stats');
 setStats(statsRes);
 setDefaultCommissionRate(settings?.defaultCommissionRate || 7.0);
 } catch (err) {
 console.error(err);
 } finally {
 setIsLoading(false);
 }
 };

 async function fetchTabData(tab: AdminTab) {
 try {
 switch (tab) {
 case 'properties':
 case 'commissions':
 const [pending, active] = await Promise.all([
 apiClient.get<any[]>('/admin/resorts/pending'),
 apiClient.get<any[]>('/admin/resorts/active')
 ]);
 setPendingResorts(pending);
 setActiveResorts(Array.isArray(active?.data) ? active.data : (Array.isArray(active) ? active : []));
 break;
 case 'users':
 const users = await apiClient.get<any[]>('/admin/users');
 setAllUsers(normalizeArray(users));
 break;
 case 'guides':
 const guides = await apiClient.get<any[]>('/admin/guides');
 setAllGuides(normalizeArray(guides));
 break;
 case 'bookings':
 const bookings = await apiClient.get<any[]>('/admin/bookings/all');
 setAllBookings(normalizeArray(bookings));
 break;
 case 'payouts':
 const payouts = await apiClient.get<any[]>('/admin/payouts');
 setPendingPayouts(payouts);
 break;
 case 'security':
 const sec = await apiClient.get<any>('/admin/security/stats');
 setSecurityData(sec);
 break;
 case 'reviews':
 const reviews = await apiClient.get<any[]>('/admin/reviews/flagged');
 setFlaggedReviews(reviews);
 break;
 case 'otp-logs':
 const logs = await apiClient.get<any[]>('/admin/otp-logs');
 setOtpLogs(normalizeArray(logs));
 break;
 case 'audit-logs':
 const audit = await apiClient.get<any[]>('/admin/audit-logs');
 setAuditLogs(normalizeArray(audit));
 break;
 }
 } catch (err) {
 console.error(`Failed to fetch data for tab: ${tab}`, err);
 }
 };

 useEffect(() => {
 if (activeTab !== 'overview') {
 fetchTabData(activeTab);
 }
 }, [activeTab]);

 const handleGuideStatus = async (profileId: string, status: "APPROVED" | "REJECTED" | "UNDER_REVIEW", reason?: string) => {
 if (status === 'REJECTED' && !reason) {
 setRejectingGuideId(profileId);
 setRejectionReasonInput("");
 return;
 }

 setProcessingId(profileId);
 try {
 await apiClient.patch(`/admin/guides/${profileId}/status`, { status, rejectionReason: reason });
 setAllGuides(prev => prev.map(g => g.id === profileId ? { ...g, status, rejectionReason: reason || null } : g));
 toast.success(`Guide KYC successfully updated to ${status.replace('_', ' ').toLowerCase()}!`);
 setRejectingGuideId(null);
 } catch (err: any) {
 toast.error(`Error: ${err.message || 'Failed to update guide status'}`);
 } finally {
 setProcessingId(null);
 }
 };

 const handleBankVerification = async (payoutId: string, profileId: string) => {
 setProcessingId(payoutId);
 try {
 await apiClient.patch(`/admin/guides/bank/${payoutId}/verify`);
 setAllGuides(prev => prev.map(g => {
 if (g.id === profileId) {
 const newPayouts = (g.payouts || []).map((p: any) => p.id === payoutId ? { ...p, status: 'BANK_VERIFIED' } : p);
 return { ...g, payouts: newPayouts };
 }
 return g;
 }));
 toast.success('Bank details verified successfully!');
 } catch (err: any) {
 toast.error(`Error: ${err.message || 'Failed to verify bank details'}`);
 } finally {
 setProcessingId(null);
 }
 };

 const handleStatusUpdate = async (id: string, status: "APPROVED" | "REJECTED") => {
 setProcessingId(id);
 try {
 await apiClient.patch(`/admin/resorts/${id}/status`, { status });
 // Refresh both lists
 const [p, a] = await Promise.all([
 apiClient.get<any[]>('/admin/resorts/pending'),
 apiClient.get<any[]>('/admin/resorts/active')
 ]);
 setPendingResorts(p);
 setActiveResorts(Array.isArray(a?.data) ? a.data : (Array.isArray(a) ? a : []));
 } catch (err) {
 console.error(err);
 } finally {
 setProcessingId(null);
 }
 };

 const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
 setProcessingId(id);
 try {
 await apiClient.patch(`/admin/resorts/${id}/feature`, { isFeatured: !currentStatus });
 setActiveResorts(prev => prev.map(r => r.id === id ? { ...r, isFeatured: !currentStatus } : r));
 } catch (err) {
 console.error(err);
 } finally {
 setProcessingId(null);
 }
 };

 const handleSystemTask = (task: AdminTab) => {
 setActiveTab(task);
 };

 const handleUpdateUser = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!editingUser) return;
 setIsSavingUser(true);
 try {
 const isNew = editingUser.id === 'new';
 
 const response = isNew 
 ? await apiClient.post<any>('/auth/register', { ...editingUser, password: "Hampi123!" })
 : await apiClient.patch<any>(`/users/${editingUser.id}`, editingUser);
 
 if (isNew) {
 toast.success("User created successfully! Default password is: Hampi123!");
 setAllUsers(prev => [response, ...prev]);
 } else {
 setAllUsers(prev => prev.map(u => u.id === response.id ? response : u));
 }
 setEditingUser(null);
 } catch (err) {
 toast.error("Action failed");
 } finally {
 setIsSavingUser(false);
 }
 };

 const handleDeleteUser = async (userId: string, userName: string) => {
 const confirmed = await confirm({ title: "Confirm Delete", message: `CRITICAL: Are you sure you want to delete ${userName}? This will remove all their data, bookings, and platform access permanently. This cannot be undone.` });
 if (!confirmed) return;
 
 setProcessingId(userId);
 try {
 await apiClient.delete(`/admin/users/${userId}`);
 setAllUsers(prev => prev.filter(u => u.id !== userId));
 } catch (err) {
 toast.error("Failed to delete user");
 } finally {
 setProcessingId(null);
 }
 };

 const handleExportCSV = () => {
 if (!allBookings.length) return;
 const headers = ["Reference", "Guest", "Resort", "Check-In", "Check-Out", "Total", "Status"];
 const rows = allBookings.map(b => [
 b.referenceNumber,
 b.user?.name,
 b.resort?.name,
 new Date(b.checkIn).toLocaleDateString(),
 new Date(b.checkOut).toLocaleDateString(),
 b.totalPrice,
 b.status
 ]);
 const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
 const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.setAttribute("href", url);
 link.setAttribute("download", `HampiStays_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 const handleUpdateCommission = async (resortId: string) => {
 setIsSavingCommission(true);
 try {
 await apiClient.patch(`/admin/resorts/${resortId}/commission`, { commissionRate: newCommissionRate });
 setActiveResorts(prev => prev.map(r => r.id === resortId ? { ...r, commissionRate: newCommissionRate } : r));
 setEditingCommissionId(null);
 } catch (err) {
 console.error(err);
 toast.error("Failed to update commission rate");
 } finally {
 setIsSavingCommission(false);
 }
 };

 const handleUpdateGlobalCommission = async () => {
 setIsSavingGlobalCommission(true);
 try {
 await updateSettings({ defaultCommissionRate });
 toast.success("Global default commission rate updated successfully!");
 } catch (err) {
 console.error(err);
 toast.error("Failed to update global commission rate");
 } finally {
 setIsSavingGlobalCommission(false);
 }
 };

 const renderOverview = () => (
 <div className="space-y-8">
 {/* Stats Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {[
 { label: "Net Earnings", value: `₹${stats?.platformEarnings?.toLocaleString() || 0}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
 { label: "Total Bookings", value: stats?.bookingCount || 0, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
 { label: "Total Users", value: stats?.userCount || 0, icon: Users, color: "text-gold-600", bg: "bg-gold-50" },
 { label: "Platform Rating", value: `${stats?.platformRating || 4.8}/5`, icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
 ].map((stat, i) => (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.1 }}
 key={stat.label} 
 className="bg-white p-6 rounded-[2rem] border border-sand-200 shadow-sm"
 >
 <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
 <stat.icon className="w-6 h-6" />
 </div>
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest mb-1">{stat.label}</p>
 <p className="text-2xl font-bold text-navy-950 ">{stat.value}</p>
 </motion.div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* Global Revenue Trends */}
 <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-sand-200 shadow-sm p-10 overflow-hidden relative">
 <div className="flex items-center justify-between mb-10">
 <div>
 <h3 className="text-xl font-bold text-navy-950 ">Platform Revenue Growth</h3>
 <p className="text-[10px] text-navy-950 font-bold uppercase tracking-widest mt-1">Global Marketplace Performance</p>
 </div>
 <div className="flex gap-2">
 <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">
 <TrendingUp className="w-3 h-3" /> +14.2%
 </div>
 </div>
 </div>

 <div className="h-64 flex items-end gap-3 relative">
 {[35, 42, 38, 55, 72, 85, 95].map((val, i) => (
 <div key={i} className="flex-grow group relative flex flex-col justify-end h-full">
 <motion.div 
 initial={{ height: 0 }}
 animate={{ height: `${val}%` }}
 transition={{ delay: i * 0.1, duration: 1 }}
 className="w-full bg-navy-950 rounded-t-xl group-hover:bg-gold-500 transition-colors cursor-pointer"
 />
 <p className="mt-4 text-[8px] font-bold text-navy-950 text-center uppercase">M-{i+1}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Platform Health Metrics */}
 <div className="lg:col-span-4 space-y-6">
 <div className="bg-white p-8 rounded-[2.5rem] border border-sand-200 shadow-sm">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest mb-4">Avg. Booking Value</p>
 <p className="text-3xl font-serif font-bold text-navy-950 italic">₹{(stats?.avgBookingValue || 8450).toLocaleString()}</p>
 <p className="text-[9px] text-green-600 font-bold mt-2 flex items-center gap-1">
 <TrendingUp className="w-3 h-3" /> 8% Higher than last month
 </p>
 </div>
 <div className="bg-white p-8 rounded-[2.5rem] border border-sand-200 shadow-sm">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest mb-4">Cancellation Rate</p>
 <p className="text-3xl font-serif font-bold text-navy-950 italic">{(stats?.cancellationRate || 4.2)}%</p>
 <div className="mt-4 w-full bg-sand-100 h-1.5 rounded-full overflow-hidden">
 <div className="bg-navy-950 h-full w-[4.2%]" />
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Recent Activity */}
 <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-sand-200 shadow-sm p-8">
 <div className="flex items-center justify-between mb-8">
 <h3 className="text-xl font-bold text-navy-950 ">Recent Activity</h3>
 <Button variant="outline" onClick={() => setActiveTab('bookings')} className="text-xs h-8 px-4 rounded-full transition-all hover:bg-navy-950 hover:text-white">View All</Button>
 </div>
 <div className="space-y-6">
 {[1, 2, 3].map((_, i) => (
 <div key={i} className="flex items-center gap-4 p-4 hover:bg-sand-50 :bg-sand-100 rounded-2xl transition-colors">
 <div className="w-10 h-10 bg-sand-100 rounded-full flex items-center justify-center">
 <CheckCircle className="w-5 h-5 text-emerald-500" />
 </div>
 <div className="flex-grow">
 <p className="text-sm font-bold text-navy-950 ">New Booking Confirmed</p>
 <p className="text-xs text-navy-950 ">Traveler booked Heritage Resort Hampi for 3 nights.</p>
 </div>
 <p className="text-[10px] font-bold text-navy-950 uppercase">2h ago</p>
 </div>
 ))}
 </div>
 </div>

 {/* Quick Actions */}
 <div className="bg-navy-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
 <h3 className="text-xl font-bold mb-6 text-gold-400">System Tasks</h3>
 <div className="space-y-4">
 <Button 
 onClick={() => handleSystemTask('payouts')}
 className="w-full bg-white/5 hover:bg-white/10 border-white/10 text-white justify-start gap-3 h-14 rounded-2xl relative"
 >
 <AlertCircle className="w-5 h-5" />
 Verify Payouts
 {pendingPayouts.length > 0 && <span className="absolute right-4 w-2 h-2 bg-gold-500 rounded-full" />}
 </Button>
 
 <Button 
 onClick={() => handleSystemTask('newsletter')}
 className="w-full bg-white/5 hover:bg-white/10 border-white/10 text-white justify-start gap-3 h-14 rounded-2xl"
 >
 <Mail className="w-5 h-5" />
 Send Newsletter
 </Button>

 <Button 
 onClick={() => handleSystemTask('reviews')}
 className="w-full bg-white/5 hover:bg-white/10 border-white/10 text-white justify-start gap-3 h-14 rounded-2xl relative"
 >
 <Star className="w-5 h-5" />
 Moderate Reviews
 {flaggedReviews.length > 0 && <span className="absolute right-4 bg-red-500 text-[8px] font-bold px-1.5 py-0.5 rounded-full">{flaggedReviews.length}</span>}
 </Button>
 
 <Button 
 onClick={() => handleSystemTask('security')}
 className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 justify-start gap-3 h-14 rounded-2xl mt-4"
 >
 <ShieldCheck className="w-5 h-5" />
 Security Audit
 </Button>
 </div>
 </div>
 </div>
 </div>
 );

 const renderResortCard = (resort: any, type: "pending" | "active") => (
 <motion.div
 key={resort.id}
 layout
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, x: -50 }}
 className="bg-white rounded-[2rem] border border-sand-100 shadow-sm overflow-hidden mb-6"
 >
 <div className="flex flex-col lg:flex-row">
 <div className="lg:w-72 h-48 lg:h-auto relative">
 <img 
 src={resort.images?.[0] || "https://images.unsplash.com/photo-1581012771300-224937651c42"} 
 className="w-full h-full object-cover rounded-[2.5rem]" 
 alt={resort.name}
 />
 {resort.isFeatured && (
 <div className="absolute top-4 left-4">
 <span className="bg-gold-500 text-navy-950 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
 <Sparkles className="w-3 h-3" />
 Featured
 </span>
 </div>
 )}
 </div>

 <div className="flex-grow p-8">
 <div className="flex flex-col md:flex-row justify-between gap-6">
 <div className="flex-grow">
 <div className="flex items-center gap-2 text-gold-600 text-[10px] font-bold uppercase tracking-widest mb-2">
 <MapPin className="w-3.5 h-3.5" />
 {resort.locationArea}
 </div>
 <h3 className="text-2xl font-bold text-navy-950 mb-2">{resort.name}</h3>
 <p className="text-sm text-navy-950 mb-6 line-clamp-2 max-w-2xl">{resort.description}</p>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="flex items-center gap-3 p-3 bg-sand-50 rounded-xl">
 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-sand-200 ">
 <User className="w-4 h-4 text-navy-950 " />
 </div>
 <div>
 <p className="text-[10px] font-bold text-navy-950 uppercase">Owner</p>
 <p className="text-sm font-bold text-navy-950 ">{resort.owner?.user?.name}</p>
 </div>
 </div>
 <div className="flex items-center gap-3 p-3 bg-sand-50 rounded-xl">
 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-sand-200 ">
 <Mail className="w-4 h-4 text-navy-950 " />
 </div>
 <div>
 <p className="text-[10px] font-bold text-navy-950 uppercase">Contact</p>
 <p className="text-sm font-bold text-navy-950 text-ellipsis overflow-hidden max-w-[150px]">{resort.owner?.user?.email}</p>
 </div>
 </div>
 <div className="flex items-center gap-3 p-3 bg-navy-950 text-white rounded-xl relative group overflow-hidden">
 <div className="absolute inset-0 bg-gold-500/10 group-hover:bg-gold-500/20 transition-colors" />
 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-white/10 relative z-10">
 <TrendingUp className="w-4 h-4 text-gold-400" />
 </div>
 <div className="relative z-10 flex-grow">
 <p className="text-[10px] font-bold text-white/40 uppercase">Commission</p>
 {editingCommissionId === resort.id ? (
 <div className="flex items-center gap-2 mt-0.5">
 <input 
 type="number" 
 autoFocus
 value={newCommissionRate}
 onChange={(e) => setNewCommissionRate(parseFloat(e.target.value))}
 className="w-14 bg-white border border-white/20 rounded px-1.5 py-0.5 text-xs font-bold outline-none focus:border-gold-400"
 />
 <button onClick={() => handleUpdateCommission(resort.id)} disabled={isSavingCommission} className="text-gold-400 hover:text-gold-300">
 {isSavingCommission ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
 </button>
 </div>
 ) : (
 <div className="flex items-center justify-between w-full">
 <p className="text-sm font-bold text-white">{resort.commissionRate || 7.0}%</p>
 <button 
 onClick={() => {
 setEditingCommissionId(resort.id);
 setNewCommissionRate(resort.commissionRate || 7.0);
 }}
 className="transition-opacity text-[10px] font-bold text-gold-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded hover:bg-white "
 >
 Edit
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 <div className="flex flex-row md:flex-col gap-3 justify-center min-w-[160px]">
 {type === "pending" ? (
 <>
 <Button 
 className="bg-green-600 hover:bg-green-700 text-white gap-2 h-12 px-6"
 onClick={() => handleStatusUpdate(resort.id, "APPROVED")}
 disabled={processingId === resort.id}
 >
 <CheckCircle className="w-4 h-4" />
 Approve
 </Button>
 <Button 
 variant="outline" 
 className="border-red-200 text-red-600 hover:bg-red-50 gap-2 h-12 px-6"
 onClick={() => handleStatusUpdate(resort.id, "REJECTED")}
 disabled={processingId === resort.id}
 >
 <XCircle className="w-4 h-4" />
 Reject
 </Button>
 </>
 ) : (
 <>
 <Button 
 variant={resort.isFeatured ? "primary" : "outline"}
 className={resort.isFeatured ? "bg-gold-500 hover:bg-gold-600 text-navy-950 gap-2 h-12 px-6 border-none" : "border-gold-200 text-gold-700 hover:bg-gold-50 gap-2 h-12 px-6"}
 onClick={() => handleToggleFeatured(resort.id, resort.isFeatured)}
 disabled={processingId === resort.id}
 >
 <Sparkles className="w-4 h-4" />
 {resort.isFeatured ? "Featured" : "Mark Featured"}
 </Button>
 <Button 
 variant="outline" 
 className="border-navy-200 text-navy-950 hover:bg-navy-50 gap-2 h-12 px-6"
 onClick={() => handleStatusUpdate(resort.id, "REJECTED")} // Actually "Suspension" logic
 disabled={processingId === resort.id}
 >
 <XCircle className="w-4 h-4" />
 Suspend
 </Button>
 </>
 )}
 <Button 
 variant="outline" 
 className="gap-2 h-12 px-6"
 onClick={() => window.open(`/resorts/${resort.slug}`, '_blank')}
 >
 <ExternalLink className="w-4 h-4" />
 Preview
 </Button>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 );

 const renderProperties = () => (
 <div className="space-y-6">
 <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
 <div>
 <h3 className="text-2xl font-bold text-navy-950 mb-4">Property Management</h3>
 <div className="flex bg-white p-1 rounded-xl border border-sand-200 w-fit">
 <button 
 onClick={() => setPropertySubTab("pending")}
 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${propertySubTab === 'pending' ? 'bg-navy-950 text-white shadow-md' : 'text-navy-950 hover:text-navy-950 '}`}
 >
 Pending ({pendingResorts.length})
 </button>
 <button 
 onClick={() => setPropertySubTab("active")}
 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${propertySubTab === 'active' ? 'bg-navy-950 text-white shadow-md' : 'text-navy-950 hover:text-navy-950 '}`}
 >
 Active ({activeResorts.length})
 </button>
 </div>
 </div>
 <div className="flex items-center gap-6 mt-4 md:mt-0">
 <div className="flex gap-4 bg-white p-4 rounded-[2rem] border border-sand-200 shadow-sm">
 <div className="text-center px-4">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Total Properties</p>
 <p className="text-xl font-bold text-navy-950 ">{pendingResorts.length + activeResorts.length}</p>
 </div>
 <div className="w-px h-10 bg-sand-200 " />
 <div className="text-center px-4">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Active</p>
 <p className="text-xl font-bold text-emerald-500">{activeResorts.length}</p>
 </div>
 <div className="w-px h-10 bg-sand-200 " />
 <div className="text-center px-4">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Pending</p>
 <p className="text-xl font-bold text-amber-500">{pendingResorts.length}</p>
 </div>
 </div>
 <div className="flex flex-wrap gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-950 " />
 <input 
 type="text" 
 placeholder="Search resorts..." 
 className="pl-10 pr-4 py-2 bg-white border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20"
 />
 </div>
 <Button variant="outline" className="gap-2 rounded-xl whitespace-nowrap">
 <Filter className="w-4 h-4" />
 Filters
 </Button>
 </div>
 </div>
 </div>

 <AnimatePresence mode="wait">
 {(propertySubTab === "pending" ? pendingResorts : activeResorts).length > 0 ? (
 <motion.div
 key={propertySubTab}
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 >
 {(propertySubTab === "pending" ? pendingResorts : activeResorts).map(resort => 
 renderResortCard(resort, propertySubTab)
 )}
 </motion.div>
 ) : (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="bg-white rounded-[3rem] p-20 text-center border border-sand-100 shadow-sm max-w-2xl mx-auto"
 >
 <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
 <CheckCircle className="w-10 h-10 text-green-200" />
 </div>
 <h2 className="text-2xl font-bold font-serif text-navy-950 mb-4">No {propertySubTab} resorts</h2>
 <p className="text-navy-950 ">Everything is up to date.</p>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );

 const handleToggleGuideService = async () => {
 const nextStatus = !guideServiceEnabled;
 
 setModalData({
 title: nextStatus ? "Enable Guide Service" : "SYSTEM SHUTDOWN",
 message: nextStatus 
 ? "This will restore all guide-related features, pages, and registration flows globally. Proceed?"
 : "CRITICAL: This will SHUT DOWN the entire Tour Guide network. It will be hidden from the website, registration, and all public areas. Continue?",
 onConfirm: async () => {
 setProcessingId('system-toggle');
 try {
 await updateSettings({ guideServiceEnabled: nextStatus });
 setShowConfirmModal(false);
 } catch (err: any) {
 toast.error(`Error: ${err.message || 'Could not connect to server'}`);
 } finally {
 setProcessingId(null);
 }
 }
 });
 setShowConfirmModal(true);
 };

 const handleToggleOtpVerification = async () => {
 const nextStatus = !requireOtpForSignup;
 setModalData({
 title: nextStatus ? "Enable OTP Verification" : "Disable OTP Verification",
 message: nextStatus
 ? "OTP verification will be REQUIRED for all new user signups. Users must verify via email or SMS before their account is created."
 : "WARNING: New users will be registered INSTANTLY without any OTP verification. This bypasses the verification step entirely. Only use this in controlled environments.",
 onConfirm: async () => {
 setProcessingId('otp-toggle');
 try {
 await updateSettings({ requireOtpForSignup: nextStatus });
 toast.success(`OTP verification ${nextStatus ? 'enabled' : 'disabled'} successfully.`);
 setShowConfirmModal(false);
 } catch (err: any) {
 toast.error(`Error: ${err.message || 'Could not update setting'}`);
 } finally {
 setProcessingId(null);
 }
 }
 });
 setShowConfirmModal(true);
 };

 const handleGuideActiveToggle = async (profileId: string, currentStatus: boolean) => {
 setProcessingId(profileId);
 try {
 await apiClient.patch(`/admin/guides/${profileId}/toggle-active`, { isActive: !currentStatus });
 setAllGuides(prev => prev.map(g => g.id === profileId ? { ...g, isActive: !currentStatus } : g));
 } catch (err: any) {
 toast.error(`Error: ${err.message || 'Failed to toggle guide visibility'}`);
 } finally {
 setProcessingId(null);
 }
 };

 const handleAllGuidesStatus = (status: boolean) => {
 setModalData({
 title: status ? "Activate All Experts" : "Global Expert Shutdown",
 message: `Are you sure you want to ${status ? 'activate' : 'hide'} ALL expert guides across the entire platform? This action affects all ${allGuides.length} guides.`,
 onConfirm: async () => {
 setProcessingId('system-toggle');
 try {
 await apiClient.patch('/admin/guides/toggle-all', { isActive: status });
 setAllGuides(prev => prev.map(g => ({ ...g, isActive: status })));
 setShowConfirmModal(false);
 } catch (err: any) {
 toast.error(`Error: ${err.message || 'Failed to update experts status'}`);
 } finally {
 setProcessingId(null);
 }
 }
 });
 setShowConfirmModal(true);
 };

 const renderGuides = () => (
 <div className="space-y-6 relative">
 {/* CUSTOM CONFIRMATION MODAL */}
 <AnimatePresence>
 {showConfirmModal && modalData && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setShowConfirmModal(false)}
 className="absolute inset-0 bg-navy-950/60 backdrop-blur-md"
 />
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="relative w-full max-w-md bg-white rounded-[3rem] shadow-luxury p-10 border border-sand-100 overflow-hidden"
 >
 {/* Warning Background Icon */}
 <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none">
 <AlertCircle className="w-64 h-64 text-navy-950 " />
 </div>

 <div className="relative z-10">
 <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 ${
 modalData.title.includes('SHUTDOWN') || modalData.title.includes('Shutdown')
 ? "bg-red-50 text-red-600"
 : "bg-green-50 text-green-600"
 }`}>
 {modalData.title.includes('SHUTDOWN') || modalData.title.includes('Shutdown') 
 ? <AlertCircle className="w-8 h-8" /> 
 : <CheckCircle className="w-8 h-8" />
 }
 </div>
 
 <h3 className="text-3xl font-serif font-bold text-navy-950 mb-4 uppercase tracking-tight">
 {modalData.title}
 </h3>
 
 <p className="text-navy-950 leading-relaxed mb-10 text-sm font-medium">
 {modalData.message}
 </p>

 <div className="flex gap-4">
 <Button 
 variant="outline" 
 onClick={() => setShowConfirmModal(false)}
 className="flex-1 h-14 rounded-2xl border-sand-200 text-navy-950 hover:bg-sand-50 :bg-sand-100"
 >
 Cancel
 </Button>
 <Button 
 onClick={modalData.onConfirm}
 isLoading={processingId === 'system-toggle'}
 className={`flex-1 h-14 rounded-2xl border-none font-bold ${
 modalData.title.includes('SHUTDOWN') || modalData.title.includes('Shutdown')
 ? "bg-red-600 hover:bg-red-700 text-white"
 : "bg-navy-950 hover:bg-gold-500 text-white hover:text-navy-950 shadow-luxury"
 }`}
 >
 Confirm
 </Button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 {/* MASTER SERVICE SWITCH */}
 <div className={`p-8 rounded-[3rem] border-2 transition-all mb-12 ${
 guideServiceEnabled 
 ? "bg-white border-sand-100 shadow-sm" 
 : "bg-red-50/50 border-red-200 shadow-lg shadow-red-500/5"
 }`}>
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
 <div className="flex gap-6 items-start">
 <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 ${
 guideServiceEnabled ? "bg-navy-950 text-white" : "bg-red-600 text-white animate-pulse"
 }`}>
 {guideServiceEnabled ? <Sparkles className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
 </div>
 <div>
 <div className="flex items-center gap-3 mb-2">
 <h3 className="text-2xl font-bold text-navy-950 ">Tour Guide Service</h3>
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
 guideServiceEnabled ? "bg-green-100 text-green-700" : "bg-red-600 text-white"
 }`}>
 {guideServiceEnabled ? "System Active" : "Service Shut Down"}
 </span>
 </div>
 <p className="text-navy-950 text-sm max-w-xl">
 {guideServiceEnabled 
 ? "The expert network is currently operational. All public pages, registration flows, and booking systems are live."
 : "The entire guide service is currently offline. No experts or tours are visible to travellers, and registration is disabled."
 }
 </p>
 </div>
 </div>
 
 <div className="flex flex-col items-end gap-3">
 <div 
 onClick={handleToggleGuideService}
 className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-500 cursor-pointer ${
 guideServiceEnabled ? "bg-navy-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]" : "bg-red-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
 }`}
 >
 <motion.span 
 animate={{ x: guideServiceEnabled ? 52 : 4 }}
 transition={{ type: "spring", stiffness: 500, damping: 30 }}
 className="inline-block h-9 w-9 rounded-full bg-white shadow-xl ring-2 ring-white/10"
 />
 </div>
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-[0.2em]">Master System Switch</p>
 </div>
 </div>
 </div>

 {/* MASTER OTP VERIFICATION CONTROL */}
 <div className={`p-8 rounded-[3rem] border-2 transition-all mb-12 ${
 requireOtpForSignup
 ? "bg-white border-sand-100 shadow-sm"
 : "bg-amber-50/50 border-amber-200 shadow-lg shadow-amber-500/5"
 }`}>
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
 <div className="flex gap-6 items-start">
 <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 ${
 requireOtpForSignup ? "bg-navy-950 text-white" : "bg-amber-500 text-white"
 }`}>
 {requireOtpForSignup ? <ShieldCheck className="w-8 h-8" /> : <ShieldOff className="w-8 h-8" />}
 </div>
 <div>
 <div className="flex items-center gap-3 mb-2">
 <h3 className="text-2xl font-bold text-navy-950 ">OTP Verification for Signup</h3>
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
 requireOtpForSignup ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
 }`}>
 {requireOtpForSignup ? "Required" : "Disabled"}
 </span>
 </div>
 <p className="text-navy-950 text-sm max-w-xl">
 {requireOtpForSignup
 ? "New users must verify their email or phone via a 6-digit OTP before their account is created. Recommended for production."
 : "New users are registered instantly without any verification step. Accounts are created immediately on form submission."
 }
 </p>
 </div>
 </div>

 <div className="flex flex-col items-end gap-3">
 <div
 onClick={handleToggleOtpVerification}
 className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-500 cursor-pointer ${
 requireOtpForSignup ? "bg-navy-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]" : "bg-amber-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
 }`}
 >
 <motion.span
 animate={{ x: requireOtpForSignup ? 52 : 4 }}
 transition={{ type: "spring", stiffness: 500, damping: 30 }}
 className="inline-block h-9 w-9 rounded-full bg-white shadow-xl ring-2 ring-white/10"
 />
 </div>
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-[0.2em]">Auth Control Switch</p>
 </div>
 </div>
 </div>

 <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 bg-white p-8 rounded-[3rem] border border-sand-100 shadow-sm">
 <div>
 <h3 className="text-2xl font-bold text-navy-950 ">Expert Guide Management</h3>
 <p className="text-sm text-navy-950 ">Review, verify, and manage platform visibility for Hampi experts.</p>
 </div>
 <div className="flex items-center gap-6">
 <div className="flex gap-4">
 <div className="text-center">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Total Experts</p>
 <p className="text-xl font-bold text-navy-950 ">{allGuides.length}</p>
 </div>
 <div className="w-px h-10 bg-sand-200 " />
 <div className="text-center">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Pending</p>
 <p className="text-xl font-bold text-amber-500">{allGuides.filter(g => g.status === 'UNDER_REVIEW' || g.status === 'PENDING').length}</p>
 </div>
 <div className="w-px h-10 bg-sand-200 " />
 <div className="text-center">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Approved</p>
 <p className="text-xl font-bold text-emerald-500">{allGuides.filter(g => g.status === 'APPROVED').length}</p>
 </div>
 <div className="w-px h-10 bg-sand-200 " />
 <div className="text-center">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Rejected</p>
 <p className="text-xl font-bold text-red-500">{allGuides.filter(g => g.status === 'REJECTED').length}</p>
 </div>
 <div className="w-px h-10 bg-sand-200 " />
 <div className="text-center">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Suspended</p>
 <p className="text-xl font-bold text-orange-600">{allGuides.filter(g => g.status === 'SUSPENDED').length}</p>
 </div>
 </div>
 <div className="w-px h-10 bg-sand-200 " />
 <Button 
 variant={allGuides.some(g => !g.isActive) ? "primary" : "outline"}
 onClick={() => handleAllGuidesStatus(allGuides.some(g => !g.isActive))}
 className={`rounded-2xl h-12 px-8 font-bold border-2 transition-all ${
 allGuides.some(g => !g.isActive) 
 ? "bg-green-600 border-green-600 text-white hover:bg-green-700" 
 : "border-red-200 text-red-600 hover:bg-red-50"
 }`}
 >
 {allGuides.some(g => !g.isActive) ? (
 <><Eye className="w-4 h-4 mr-2" /> Activate All Experts</>
 ) : (
 <><EyeOff className="w-4 h-4 mr-2" /> Global Shutdown</>
 )}
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6">
 {allGuides.map((guide) => (
 <motion.div
 key={guide.id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className={`bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden relative ${
 !guide.isActive ? 'opacity-70 border-dashed border-sand-300' : 'border-sand-200 shadow-sm'
 }`}
 >
 {/* INDIVIDUAL TOGGLE (Prominent Position) */}
 <div className="absolute top-8 right-8 z-20">
 <button 
 onClick={() => handleGuideActiveToggle(guide.id, guide.isActive)}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm border ${
 guide.isActive 
 ? 'bg-green-50 border-green-100 text-green-700 hover:bg-green-100' 
 : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
 }`}
 >
 {guide.isActive ? (
 <><Eye className="w-4 h-4" /> Live on Site</>
 ) : (
 <><EyeOff className="w-4 h-4" /> Offline</>
 )}
 </button>
 </div>

 <div className="p-8">
 <div className="flex flex-col lg:flex-row justify-between gap-10">
 <div className="flex-grow flex gap-6">
 <div className="w-24 h-24 rounded-[2rem] bg-sand-100 flex items-center justify-center overflow-hidden border border-sand-200 ">
 {guide.user?.avatar ? <img src={guide.user.avatar} className="w-full h-full object-cover rounded-2xl" /> : <User className="w-10 h-10 text-sand-300" />}
 </div>
 <div className="flex-grow">
 <div className="flex items-center gap-3 mb-1">
 <h4 className="text-2xl font-bold text-navy-950 ">{guide.user?.name}</h4>
 </div>
 <p className="text-navy-950 text-sm mb-4">{guide.user?.email}</p>
 <div className="flex flex-wrap gap-2">
 <span className="px-3 py-1 bg-navy-50 text-navy-600 rounded-full text-[10px] font-bold uppercase tracking-widest">{guide.yearsExperience} Years Exp.</span>
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
 guide.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
 guide.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
 guide.status === 'UNDER_REVIEW' ? 'bg-blue-50 text-blue-700 border-blue-200' :
 guide.status === 'RESUBMITTED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
 'bg-amber-50 text-gold-700 border-gold-200'
 }`}>
 {guide.status.replace('_', ' ')}
 </span>
 {guide.user?.profileCompletionStatus && (
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
 guide.user.profileCompletionStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
 guide.user.profileCompletionStatus === 'COMPLETE' ? 'bg-green-100 text-green-800 border-green-300' :
 guide.user.profileCompletionStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800 border-amber-300' :
 'bg-red-100 text-red-800 border-red-300 animate-pulse'
 }`}>
 Profile: {guide.user.profileCompletionStatus}
 </span>
 )}
 </div>

 {/* Anti-Fraud Shield Alert */}
 {guide.fraudScore !== undefined && guide.fraudScore > 0 && (
 <div className={`mt-4 p-4 rounded-2xl border flex items-start gap-3 ${
 guide.fraudScore > 70 
 ? "bg-red-50 border-red-200 text-red-800" 
 : "bg-amber-50/50 border-amber-200 text-amber-800"
 }`}>
 <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${guide.fraudScore > 70 ? "text-red-600 animate-bounce" : "text-amber-600"}`} />
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold uppercase tracking-wider">KYC Fraud Risk: {guide.fraudScore}%</span>
 {guide.fraudScore > 70 && (
 <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[8px] font-bold uppercase tracking-widest animate-pulse">Critical Alert</span>
 )}
 </div>
 {guide.fraudFlags && guide.fraudFlags.length > 0 && (
 <div className="mt-1 flex flex-wrap gap-1.5">
 {guide.fraudFlags.map((flag: string) => (
 <span key={flag} className="px-2 py-0.5 bg-white border border-current/20 rounded text-[9px] font-mono font-bold uppercase">
 {flag.replace(/_/g, ' ')}
 </span>
 ))}
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </div>

 <div className="flex-grow lg:max-w-md bg-sand-50 rounded-3xl p-6 border border-sand-100 ">
 <div className="flex items-center justify-between mb-4">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest flex items-center gap-2">
 <ShieldCheck className="w-3.5 h-3.5" /> Identity Documents
 </p>
 </div>
 {guide.idType ? (
 <div className="space-y-3">
 <div className="flex gap-6">
 <div className="flex-grow space-y-2">
 <p className="text-xs font-bold text-navy-950 ">{guide.idType}</p>
 <p className="font-mono text-xs text-navy-950 blur-[3px] hover:blur-none transition-all duration-300 select-all cursor-pointer" title="Hover to reveal number">
 {guide.idNumber}
 </p>
 </div>
 {guide.idImage ? (
 <button 
 onClick={() => {
 setSelectedIdImage(guide.idImage);
 setSelectedIdDetails({
 name: guide.user?.name || 'Local Expert',
 type: guide.idType || 'Document',
 number: guide.idNumber || 'N/A'
 });
 }}
 className="w-20 h-20 rounded-xl overflow-hidden border border-sand-200 hover:border-gold-500 transition-colors group relative"
 >
 <KycImage 
 src={guide.idImage} 
 alt="Identity Document" 
 transform="w_300,q_auto,f_auto" 
 className="w-full h-full"
 />
 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-navy-950/20 transition-opacity">
 <Eye className="w-4 h-4 text-white" />
 </div>
 </button>
 ) : (
 <div className="w-20 h-20 rounded-xl bg-sand-100 border border-sand-200 flex items-center justify-center text-[10px] font-bold text-navy-950 uppercase tracking-widest text-center px-2">
 No Image
 </div>
 )}
 </div>
 {guide.status === 'REJECTED' && guide.rejectionReason && (
 <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-xl border border-red-100 mt-1">
 <strong>Reason:</strong> {guide.rejectionReason}
 </p>
 )}
 </div>
 ) : (
 <p className="text-sm text-navy-950 italic">No documents uploaded yet.</p>
 )}
 </div>

 {/* BANK DETAILS SECTION */}
 {guide.payouts && guide.payouts.length > 0 && (() => {
 const bankInfo = guide.payouts.find((p: any) => p.status === 'BANK_INFO' || p.status === 'BANK_VERIFIED');
 if (bankInfo) {
 return (
 <div className="flex-grow lg:max-w-md bg-sand-50 rounded-3xl p-6 border border-sand-100 ">
 <div className="flex items-center justify-between mb-4">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest flex items-center gap-2">
 <ShieldCheck className="w-3.5 h-3.5" /> Bank Details
 </p>
 <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
 bankInfo.status === 'BANK_VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
 }`}>
 {bankInfo.status.replace('_', ' ')}
 </span>
 </div>
 <div className="space-y-2">
 <p className="text-xs text-navy-950"><strong>Bank:</strong> {bankInfo.bankName}</p>
 <p className="text-xs text-navy-950"><strong>Name:</strong> {bankInfo.accountName}</p>
 <p className="font-mono text-xs text-navy-950 blur-[3px] hover:blur-none transition-all duration-300 select-all cursor-pointer">
 {bankInfo.accountNumber}
 </p>
 <p className="text-xs text-navy-950"><strong>IFSC:</strong> {bankInfo.ifsc}</p>
 </div>
 {bankInfo.status === 'BANK_INFO' && (
 <div className="mt-4">
 <Button 
 className="w-full bg-navy-950 hover:bg-gold-500 text-white h-10 text-xs gap-2"
 onClick={() => handleBankVerification(bankInfo.id, guide.id)}
 isLoading={processingId === bankInfo.id}
 >
 Verify Bank Details
 </Button>
 </div>
 )}
 </div>
 );
 }
 return null;
 })()}

 <div className="flex flex-row lg:flex-col gap-3 justify-center pr-20 lg:pr-0">
 <Button 
 className="bg-green-600 hover:bg-green-700 text-white gap-2 h-12 px-8"
 onClick={() => handleGuideStatus(guide.id, 'APPROVED')}
 disabled={processingId === guide.id || guide.status === 'APPROVED'}
 >
 <CheckCircle className="w-4 h-4" />
 Approve
 </Button>
 {guide.status !== 'APPROVED' && guide.status !== 'UNDER_REVIEW' && (
 <Button 
 variant="outline"
 className="border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 h-12 px-8"
 onClick={() => handleGuideStatus(guide.id, 'UNDER_REVIEW')}
 disabled={processingId === guide.id}
 >
 <Eye className="w-4 h-4" />
 Under Review
 </Button>
 )}
 <Button 
 variant="outline" 
 className="border-red-200 text-red-600 hover:bg-red-50 gap-2 h-12 px-8"
 onClick={() => handleGuideStatus(guide.id, 'REJECTED')}
 disabled={processingId === guide.id || guide.status === 'REJECTED'}
 >
 <XCircle className="w-4 h-4" />
 Reject
 </Button>
 </div>
 </div>
 </div>
 </motion.div>
 ))}
 {allGuides.length === 0 && (
 <div className="text-center py-20 bg-white rounded-[3rem] border border-sand-100 italic text-navy-950 ">
 No expert guides found on the platform.
 </div>
 )}
 </div>
 </div>
 );

 const renderUsers = () => (
 <div className="bg-white rounded-[2.5rem] border border-sand-200 shadow-sm overflow-hidden">
 <div className="p-8 border-b border-sand-100 flex items-center justify-between">
 <h3 className="text-xl font-bold text-navy-950 ">Platform Users</h3>
 <Button 
 onClick={() => setEditingUser({ name: '', email: '', role: 'TRAVELLER', id: 'new' })}
 className="bg-navy-950 text-white gap-2"
 >
 <Users className="w-4 h-4" />
 Add User
 </Button>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-sand-50 text-[10px] font-bold text-navy-950 uppercase tracking-widest">
 <th className="px-8 py-4">User</th>
 <th className="px-8 py-4">Role</th>
 <th className="px-8 py-4">Joined</th>
 <th className="px-8 py-4">Status</th>
 <th className="px-8 py-4">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-sand-100">
 {(allUsers || []).map((user) => (
 <tr key={user.id} className="hover:bg-sand-50 :bg-sand-100/30 transition-colors">
 <td className="px-8 py-6">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-gold-100 text-gold-700 rounded-full flex items-center justify-center font-bold">
 {user.name ? user.name[0] : '?'}
 </div>
 <div>
 <p className="text-sm font-bold text-navy-950 ">{user.name || 'Unknown User'}</p>
 <p className="text-xs text-navy-950 ">{user.email}</p>
 </div>
 </div>
 </td>
 <td className="px-8 py-6">
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
 user.role === 'ADMIN' ? 'bg-navy-950 text-white' : 
 user.role === 'RESORT_OWNER' ? 'bg-gold-100 text-gold-700' : 
 'bg-sand-100 text-navy-950 '
 }`}>
 {user.role}
 </span>
 </td>
 <td className="px-8 py-6 text-sm text-navy-950 ">{new Date(user.createdAt).toLocaleDateString()}</td>
 <td className="px-8 py-6">
 <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
 ACTIVE
 </span>
 </td>
 <td className="px-8 py-6">
 <div className="flex gap-2">
 <Button 
 variant="outline" 
 className="h-8 px-4 text-xs rounded-full"
 onClick={() => setEditingUser(user)}
 >
 Edit
 </Button>
 <Button 
 variant="outline" 
 className="h-8 px-4 text-xs rounded-full border-red-200 text-red-600 hover:bg-red-50"
 onClick={() => handleDeleteUser(user.id, user.name)}
 isLoading={processingId === user.id}
 >
 Delete
 </Button>
 </div>
 </td>
 </tr>
 ))}
 {(!allUsers || allUsers.length === 0) && (
 <tr>
 <td colSpan={5} className="px-8 py-20 text-center text-navy-950 italic">
 No users found on the platform.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 );  const handlePaymentReview = async (bookingId: string, action: "APPROVE" | "REFUND" | "REJECT") => {
    if (!(await confirm({ title: `Confirm ${action}`, message: `Are you sure you want to ${action.toLowerCase()} this booking's payment?` }))) return;
    
    setProcessingId(bookingId);
    try {
      let newPaymentStatus = "PAID";
      let newStatus = undefined;

      if (action === "APPROVE") {
        newPaymentStatus = "PAID";
        newStatus = "CONFIRMED";
      } else if (action === "REFUND") {
        newPaymentStatus = "REFUNDED";
        newStatus = "CANCELLED";
      } else if (action === "REJECT") {
        newPaymentStatus = "FAILED";
        newStatus = "CANCELLED";
      }

      await apiClient.patch(`/bookings/${bookingId}/status`, {
        paymentStatus: newPaymentStatus,
        ...(newStatus && { status: newStatus })
      });
      toast.success(`Payment ${action.toLowerCase()}ed successfully.`);
      const updated = await apiClient.get<any[]>('/admin/bookings');
      setAllBookings(updated);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to process payment: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const renderBookings = () => {
    const reviewQueue = allBookings.filter((b: any) => b.paymentStatus === "MANUAL_REVIEW_REQUIRED");
    
    return (
      <div className="bg-white rounded-[2.5rem] border border-sand-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-sand-100 flex items-center justify-between">
          <div className="flex gap-6">
            <h3 
              className={cn("text-xl font-bold cursor-pointer transition-colors", bookingTab === "all" ? "text-navy-950" : "text-navy-950/40")} 
              onClick={() => setBookingTab("all")}
            >
              Global Bookings
            </h3>
            <div 
              className={cn("flex items-center gap-2 cursor-pointer transition-colors", bookingTab === "reviews" ? "text-red-600" : "text-navy-950/40")} 
              onClick={() => setBookingTab("reviews")}
            >
              <h3 className="text-xl font-bold">Review Queue</h3>
              {reviewQueue.length > 0 && (
                <span className="px-2.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                  {reviewQueue.length}
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 rounded-xl hover:bg-navy-950 hover:text-white transition-all">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {bookingTab === "reviews" ? (
          <div className="p-8">
            {reviewQueue.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-navy-950 mb-2">No Reviews Pending</h3>
                <p className="text-navy-950/50">All bookings are processed and verified.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviewQueue.map((booking: any) => (
                  <div key={booking.id} className="p-6 bg-red-50/30 border border-red-100 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-bold text-red-700">{booking.referenceNumber}</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-widest rounded">Manual Review</span>
                      </div>
                      <h4 className="font-bold text-navy-950 mb-1">{booking.user?.name} <span className="text-navy-950/50 font-normal">({booking.user?.email})</span></h4>
                      <p className="text-sm text-navy-950/70">{booking.resort?.name} • ₹{booking.totalPrice?.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 flex-1 md:flex-none"
                        onClick={() => handlePaymentReview(booking.id, "APPROVE")}
                        isLoading={processingId === booking.id}
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl gap-2 flex-1 md:flex-none"
                        onClick={() => handlePaymentReview(booking.id, "REFUND")}
                        isLoading={processingId === booking.id}
                      >
                        <History className="w-4 h-4" /> Refund
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl gap-2 flex-1 md:flex-none"
                        onClick={() => handlePaymentReview(booking.id, "REJECT")}
                        isLoading={processingId === booking.id}
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-sand-50 text-[10px] font-bold text-navy-950 uppercase tracking-widest">
                  <th className="px-8 py-4">Reference</th>
                  <th className="px-8 py-4">Guest</th>
                  <th className="px-8 py-4">Resort & Room</th>
                  <th className="px-8 py-4">Dates</th>
                  <th className="px-8 py-4">Amount</th>
                  <th className="px-8 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
 {allBookings.map((booking) => (
 <tr key={booking.id} className="hover:bg-sand-50 :bg-sand-100/30 transition-colors">
 <td className="px-8 py-6">
 <span className="font-mono font-bold text-gold-700">{booking.referenceNumber}</span>
 </td>
 <td className="px-8 py-6">
 <p className="text-sm font-bold text-navy-950 ">{booking.user?.name || "Guest"}</p>
 <p className="text-xs text-navy-950 ">{booking.user?.email}</p>
 </td>
 <td className="px-8 py-6">
 <p className="text-sm font-bold text-navy-950 ">{booking.resort?.name}</p>
 <p className="text-xs text-navy-950 ">{booking.room?.name || booking.roomType?.name || "Standard Stay"}</p>
 </td>
 <td className="px-8 py-6">
 <div className="text-xs">
 <p className="font-bold text-navy-950 ">{new Date(booking.checkIn).toLocaleDateString()}</p>
 <p className="text-navy-950 ">to {new Date(booking.checkOut).toLocaleDateString()}</p>
 </div>
 </td>
 <td className="px-8 py-6 text-sm font-bold text-navy-950 ">
 ₹{booking.totalPrice?.toLocaleString()}
 </td>
 <td className="px-8 py-6">
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
 booking.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
 booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
 'bg-red-100 text-red-700'
 }`}>
 {booking.status}
 </span>
 </td>
 </tr>
 ))}
 {allBookings.length === 0 && (
 <tr>
 <td colSpan={6} className="px-8 py-20 text-center text-navy-950 italic">
 No bookings found on the platform.
 </td>
 </tr>
 )}
        </tbody>
      </table>
    </div>
  )}
 </div>
 );
};

 const renderPayouts = () => (
 <div className="space-y-8">
 <div className="bg-white rounded-[2.5rem] p-8 border border-sand-200 shadow-sm">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-2xl font-bold text-navy-950 ">Verify Resort Payouts</h3>
 <p className="text-sm text-navy-950 ">Audit and release funds to resort owners after guest checkout.</p>
 </div>
 <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl">
 <p className="text-[10px] font-bold uppercase tracking-widest">Total Pending</p>
 <p className="text-xl font-bold">₹{pendingPayouts.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-sand-50 text-[10px] font-bold text-navy-950 uppercase tracking-widest">
 <th className="px-8 py-4">Resort</th>
 <th className="px-8 py-4">Booking Ref</th>
 <th className="px-8 py-4">Amount</th>
 <th className="px-8 py-4">Status</th>
 <th className="px-8 py-4">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-sand-100">
 {pendingPayouts.map((payout) => (
 <tr key={payout.id} className="hover:bg-sand-50 :bg-sand-100/30 transition-colors">
 <td className="px-8 py-6 font-bold text-navy-950 ">{payout.resort}</td>
 <td className="px-8 py-6 font-mono text-gold-700">{payout.ref}</td>
 <td className="px-8 py-6 font-bold text-navy-950 ">₹{payout.amount.toLocaleString()}</td>
 <td className="px-8 py-6">
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
 payout.status === 'READY' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
 }`}>
 {payout.status.replace('_', ' ')}
 </span>
 </td>
 <td className="px-8 py-6">
 <Button 
 variant={payout.status === 'READY' ? "primary" : "outline"}
 disabled={payout.status !== 'READY'}
 className="h-10 px-6 text-xs rounded-xl"
 >
 Verify & Release
 </Button>
 </td>
 </tr>
 ))}
 {pendingPayouts.length === 0 && (
 <tr>
 <td colSpan={5} className="px-8 py-20 text-center text-navy-950 italic">
 No pending payouts found in the system.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );

 const renderNewsletter = () => (
 <div className="max-w-4xl mx-auto space-y-8">
 <div className="bg-navy-950 rounded-[3rem] p-12 text-white shadow-luxury">
 <div className="flex items-center gap-4 mb-8">
 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
 <Mail className="w-8 h-8 text-gold-400" />
 </div>
 <div>
 <h3 className="text-3xl font-serif font-bold">Campaign Manager</h3>
 <p className="text-white/40 text-sm italic">Direct broadcast to {stats?.userCount || 0} registered guests</p>
 </div>
 </div>

 <div className="space-y-6">
 <div>
 <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400 mb-2">Subject Line</label>
 <input 
 type="text" 
 placeholder="e.g. Discover the Secrets of Vijayanagara..."
 className="w-full bg-white border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold-500 transition-colors"
 />
 </div>
 <div>
 <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400 mb-2">Newsletter Content</label>
 <textarea 
 rows={10}
 placeholder="Dear Luxury Traveler, experience Hampi like never before..."
 className="w-full bg-white border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold-500 transition-colors resize-none"
 />
 </div>
 <div className="flex items-center justify-between pt-4">
 <div className="flex gap-4">
 <span className="flex items-center gap-2 text-xs text-white/40">
 <Users className="w-4 h-4" /> {stats?.userCount || 0} Recipients
 </span>
 <span className="flex items-center gap-2 text-xs text-white/40">
 <CalendarDays className="w-4 h-4" /> Scheduled: Instant
 </span>
 </div>
 <Button className="bg-gold-500 hover:bg-gold-400 text-navy-950 h-14 px-12 rounded-2xl font-bold shadow-gold">
 Send Broadcast Now
 </Button>
 </div>
 </div>
 </div>
 </div>
 );

 const renderSecurity = () => (
 <div className="space-y-8">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="bg-white p-8 rounded-[2.5rem] border border-sand-200 shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <ShieldCheck className="w-8 h-8 text-emerald-600" />
 <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Secure</span>
 </div>
 <h4 className="text-sm font-bold text-navy-950 mb-1">System Health</h4>
 <p className="text-2xl font-bold text-navy-950 ">100% Online</p>
 <div className="mt-4 w-full bg-sand-100 h-1 rounded-full overflow-hidden">
 <div className="bg-emerald-500 h-full w-[100%]" />
 </div>
 </div>
 <div className="bg-white p-8 rounded-[2.5rem] border border-sand-200 shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <Users className="w-8 h-8 text-blue-600" />
 <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Active</span>
 </div>
 <h4 className="text-sm font-bold text-navy-950 mb-1">Live Sessions</h4>
 <p className="text-2xl font-bold text-navy-950 ">{securityData.activeSessions} Users</p>
 <p className="text-[10px] text-navy-950 mt-1 uppercase">Across 3 continents</p>
 </div>
 <div className="bg-white p-8 rounded-[2.5rem] border border-sand-200 shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <AlertCircle className="w-8 h-8 text-gold-600" />
 <span className="bg-gold-50 text-gold-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Normal</span>
 </div>
 <h4 className="text-sm font-bold text-navy-950 mb-1">Threat Level</h4>
 <p className="text-2xl font-bold text-navy-950 ">Zero Threats</p>
 <p className="text-[10px] text-navy-950 mt-1 uppercase">Last scan: Just now</p>
 </div>
 </div>

 <div className="bg-navy-950 rounded-[3rem] p-8 text-white">
 <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
 <TrendingUp className="w-5 h-5 text-gold-400" />
 Real-time Security Logs
 </h3>
 <div className="space-y-4 font-mono text-[10px] opacity-60">
 {securityData.logs.map((log, i) => (
 <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3">
 <div className="flex gap-8">
 <span className="text-gold-400">[{log.time}]</span>
 <span>{log.event}</span>
 <span className="opacity-40">IP: {log.ip}</span>
 </div>
 <span className="text-emerald-400">{log.status}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 );

 const renderOtpLogs = () => (
 <div className="space-y-8">
 <div className="bg-white rounded-[2.5rem] p-8 border border-sand-200 shadow-sm">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-2xl font-bold text-navy-950 ">OTP Verification Logs</h3>
 <p className="text-sm text-navy-950 ">Real-time audit trail of all identity verification attempts.</p>
 </div>
 <div className="flex gap-3">
 <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
 {otpLogs.filter(l => l.verified).length} Verified
 </div>
 <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold">
 {otpLogs.filter(l => l.attempts >= 3).length} Suspicious
 </div>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-sand-50 text-[10px] font-bold text-navy-950 uppercase tracking-widest">
 <th className="px-6 py-4">User</th>
 <th className="px-6 py-4">Channel</th>
 <th className="px-6 py-4">Target</th>
 <th className="px-6 py-4">Attempts</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4">Expires</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-sand-100">
 {otpLogs.map((log) => (
 <tr key={log.id} className={`hover:bg-sand-50 :bg-sand-100/30 transition-colors ${
 log.attempts >= 3 ? 'bg-red-50/20' : ''
 }`}>
 <td className="px-6 py-4">
 <div>
 <p className="text-sm font-bold text-navy-950 ">{log.user?.name || 'Unregistered'}</p>
 <p className="text-xs text-navy-950 ">{log.user?.role || '—'}</p>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={`flex items-center gap-1.5 text-xs font-bold ${
 log.otpType === 'email' ? 'text-gold-700' : 'text-navy-600'
 }`}>
 {log.otpType === 'email' ? <Mail className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
 {log.otpType === 'email' ? 'Email' : 'Mobile'}
 </span>
 </td>
 <td className="px-6 py-4">
 <p className="text-xs font-mono text-navy-950 ">{log.email || log.phone || '—'}</p>
 </td>
 <td className="px-6 py-4">
 <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
 log.attempts >= 4 ? 'bg-red-100 text-red-700' :
 log.attempts >= 2 ? 'bg-amber-100 text-amber-700' :
 'bg-sand-100 text-navy-950 '
 }`}>
 {log.attempts}/5
 </span>
 </td>
 <td className="px-6 py-4">
 {log.verified ? (
 <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
 <BadgeCheck className="w-4 h-4" /> Verified
 </span>
 ) : new Date() > new Date(log.expiresAt) ? (
 <span className="text-xs font-bold text-red-500">Expired</span>
 ) : (
 <span className="text-xs font-bold text-amber-600">Pending</span>
 )}
 </td>
 <td className="px-6 py-4 text-xs text-navy-950 ">
 {new Date(log.expiresAt).toLocaleTimeString()}
 </td>
 </tr>
 ))}
 {otpLogs.length === 0 && (
 <tr><td colSpan={6} className="px-6 py-20 text-center text-navy-950 italic">No OTP verification records yet.</td></tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );

 const renderAuditLogs = () => (
 <div className="space-y-8">
 <div className="bg-white rounded-[2.5rem] p-8 border border-sand-200 shadow-sm">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-2xl font-bold text-navy-950 ">Verification Audit Logs</h3>
 <p className="text-sm text-navy-950 ">Immutable log of all user verification changes, document submissions, and admin actions.</p>
 </div>
 <div className="px-4 py-2 bg-navy-50 text-navy-950 rounded-xl text-xs font-bold">
 {auditLogs.length} Records
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-sand-50 text-[10px] font-bold text-navy-950 uppercase tracking-widest">
 <th className="px-6 py-4">Timestamp</th>
 <th className="px-6 py-4">Actor</th>
 <th className="px-6 py-4">Target User</th>
 <th className="px-6 py-4">Action</th>
 <th className="px-6 py-4">Transition</th>
 <th className="px-6 py-4">IP & User Agent</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-sand-100">
 {auditLogs.map((log) => (
 <tr key={log.id} className="hover:bg-sand-50 :bg-sand-100/30 transition-colors">
 <td className="px-6 py-4 text-xs font-mono text-navy-950 ">
 {new Date(log.createdAt).toLocaleString()}
 </td>
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-navy-950 ">
 {log.adminId === 'USER_SELF' ? 'User Self' : log.adminName || 'Admin'}
 </p>
 <p className="text-[10px] text-navy-950 font-mono">{log.adminId}</p>
 </td>
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-navy-950 ">{log.targetName || 'Guide'}</p>
 <p className="text-[10px] text-navy-950 font-mono">{log.targetUserId}</p>
 </td>
 <td className="px-6 py-4">
 <span className={cn(
 "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
 log.action === 'APPROVED' ? 'bg-green-100 text-green-700' :
 log.action === 'REJECTED' ? 'bg-red-100 text-red-700' :
 log.action === 'SUBMITTED' || log.action === 'RESUBMITTED' ? 'bg-purple-100 text-purple-700' :
 'bg-blue-100 text-blue-700'
 )}>
 {log.action}
 </span>
 </td>
 <td className="px-6 py-4 text-xs">
 <div className="flex items-center gap-1.5">
 <span className="text-navy-950 font-bold uppercase">{log.previousStatus || 'NONE'}</span>
 <span className="text-navy-950 ">→</span>
 <span className="text-navy-950 font-bold uppercase">{log.newStatus}</span>
 </div>
 {log.rejectionReason && (
 <p className="text-[10px] text-red-600 italic mt-1 max-w-[200px] truncate" title={log.rejectionReason}>
 Reason: {log.rejectionReason}
 </p>
 )}
 </td>
 <td className="px-6 py-4 text-xs text-navy-950 ">
 <p className="font-mono">{log.ipAddress || 'Unknown IP'}</p>
 <p className="text-[9px] max-w-[150px] truncate" title={log.userAgent}>
 {log.userAgent || 'Unknown Agent'}
 </p>
 </td>
 </tr>
 ))}
 {auditLogs.length === 0 && (
 <tr>
 <td colSpan={6} className="px-6 py-20 text-center text-navy-950 italic">
 No verification audit records found.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );

 const renderReviews = () => (
 <div className="space-y-8">
 <div className="bg-white rounded-[2.5rem] p-8 border border-sand-200 shadow-sm">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-2xl font-bold text-navy-950 ">Review Moderation</h3>
 <p className="text-sm text-navy-950 ">Moderate flagged or inappropriate community reviews.</p>
 </div>
 <div className="px-6 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-bold uppercase tracking-widest">
 {flaggedReviews.length} Flagged
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6">
 {flaggedReviews.length > 0 ? flaggedReviews.map((review: any) => (
 <div key={review.id} className="p-8 rounded-[2rem] border border-sand-100 bg-sand-50 flex flex-col md:flex-row gap-8 items-start">
 <div className="flex-grow">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-navy-950 border border-sand-200 ">
 {review.user?.name[0]}
 </div>
 <div>
 <p className="text-sm font-bold text-navy-950 ">{review.user?.name}</p>
 <div className="flex gap-1 text-gold-500 mt-0.5">
 {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-3 h-3 fill-current", i >= review.rating && "text-sand-200 fill-none")} />)}
 </div>
 </div>
 </div>
 <p className="text-sm text-navy-950 italic leading-relaxed mb-4">"{review.comment}"</p>
 <div className="flex items-center gap-4 text-[10px] font-bold text-navy-950 uppercase tracking-widest">
 <span>Flagged for: {review.flagReason || 'Inappropriate Content'}</span>
 <span>•</span>
 <span>Posted on {review.resort?.name}</span>
 </div>
 </div>
 <div className="flex gap-3">
 <Button className="rounded-xl h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white">Keep Review</Button>
 <Button variant="outline" className="rounded-xl h-12 px-6 border-red-200 text-red-600 hover:bg-red-50">Delete Permanently</Button>
 </div>
 </div>
 )) : (
 <div className="text-center py-20 text-navy-950 italic">No reviews currently flagged for moderation.</div>
 )}
 </div>
 </div>
 </div>
 );

 const renderCommissions = () => (
 <div className="space-y-8">
 <div className="bg-white rounded-[2.5rem] p-10 border border-sand-200 shadow-sm">
 <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
 <div>
 <h3 className="text-2xl font-bold text-navy-950 ">Platform Commissions</h3>
 <p className="text-sm text-navy-950 ">Manage global revenue splits and partner fee structures.</p>
 </div>
 <div className="flex flex-wrap items-center gap-4">
 <div className="bg-navy-950 text-white p-6 rounded-[2rem] flex items-center gap-6 shadow-xl border border-white/10">
 <div>
 <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Global Default Rate</p>
 <div className="flex items-center gap-3">
 <input 
 type="number" 
 value={defaultCommissionRate}
 onChange={(e) => setDefaultCommissionRate(parseFloat(e.target.value))}
 className="w-20 bg-white text-navy-950 border border-white/20 rounded-xl px-3 py-2 text-xl font-bold outline-none focus:border-gold-400"
 />
 <span className="text-xl font-bold text-gold-400">%</span>
 </div>
 </div>
 <Button 
 onClick={handleUpdateGlobalCommission}
 isLoading={isSavingGlobalCommission}
 className="bg-gold-500 hover:bg-gold-400 text-navy-950 h-14 px-6 rounded-2xl font-bold shadow-lg"
 >
 Update Global
 </Button>
 </div>
 
 <div className="bg-sand-50 border border-sand-200 p-6 rounded-[2rem] flex items-center gap-6">
 <div>
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest mb-1">Network Average</p>
 <p className="text-3xl font-bold text-navy-950 ">{(activeResorts.reduce((acc, r) => acc + (r.commissionRate || 7), 0) / (activeResorts.length || 1)).toFixed(1)}%</p>
 </div>
 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-sand-100 shadow-sm">
 <TrendingUp className="w-6 h-6 text-gold-600" />
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-4">
 {activeResorts.map(resort => (
 <div key={resort.id} className="p-6 rounded-2xl border border-sand-100 bg-sand-50 flex items-center justify-between hover:bg-sand-50 :bg-sand-100 transition-colors">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-sand-200 ">
 <img src={resort.images?.[0] || ""} className="w-full h-full object-cover rounded-xl" alt="" />
 </div>
 <div>
 <p className="font-bold text-navy-950 ">{resort.name}</p>
 <p className="text-xs text-navy-950 uppercase font-bold tracking-widest">{resort.locationArea}</p>
 </div>
 </div>
 
 <div className="flex items-center gap-8">
 <div className="text-right">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Current Rate</p>
 {editingCommissionId === resort.id ? (
 <div className="flex items-center gap-2 mt-1">
 <input 
 type="number" 
 autoFocus
 value={newCommissionRate}
 onChange={(e) => setNewCommissionRate(parseFloat(e.target.value))}
 className="w-16 h-10 bg-white border-2 border-gold-500 rounded-lg px-2 text-sm font-bold outline-none"
 />
 <button onClick={() => handleUpdateCommission(resort.id)} className="w-10 h-10 bg-navy-950 text-white rounded-lg flex items-center justify-center">
 {isSavingCommission ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
 </button>
 </div>
 ) : (
 <p className="text-xl font-bold text-navy-950 mt-1">{resort.commissionRate || 7.0}%</p>
 )}
 </div>
 <Button 
 variant="outline" 
 onClick={() => {
 setEditingCommissionId(resort.id);
 setNewCommissionRate(resort.commissionRate || 7.0);
 }}
 className="rounded-xl border-sand-200 text-xs h-10"
 >
 Change Rate
 </Button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );

 return (
 <div className="min-h-screen bg-sand-50 pt-20 pb-12">
 <div className="container mx-auto px-4 max-w-7xl">
 <header className="mb-4">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex flex-col">
 <div className="flex items-center gap-2 text-gold-600 mb-1">
 <ShieldCheck className="w-4 h-4" />
 <span className="text-[10px] font-bold uppercase tracking-widest">Administrator Portal</span>
 </div>
 <div className="flex items-center gap-3">
 <h1 className="text-2xl font-serif font-bold text-navy-950 leading-none">Command Center</h1>
 <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-md">
 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
 <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Live Status Syncing</span>
 </div>
 </div>
 </div>
 <button 
 onClick={fetchInitialData}
 className="text-[10px] font-bold text-navy-950 hover:text-gold-600 uppercase tracking-widest border-b border-transparent hover:border-gold-600 transition-all self-start md:self-auto"
 >
 Sync Now
 </button>
 </div>
 </header>

 {/* Sub Navigation */}
 <nav className="flex items-center bg-white p-1 rounded-xl border border-sand-200 shadow-sm mb-4 overflow-x-auto hide-scrollbar w-full">
 {[
 { id: "overview", label: "Overview", icon: LayoutDashboard },
 { id: "properties", label: "Properties", icon: Building2 },
 { id: "kyc", label: "KYC Center", icon: ShieldCheck },
 { id: "promotions", label: "Promotions", icon: Tag },
 { id: "content", label: "Blog Content", icon: FileText },
 { id: "guides", label: "Guides", icon: Award },
 { id: "users", label: "Users", icon: Users },
 { id: "bookings", label: "Bookings", icon: CalendarDays },
              { id: "qr-scanner", label: "QR Scanner", icon: QrCode },
 { id: "commissions", label: "Commissions", icon: TrendingUp },
 { id: "otp-logs", label: "OTP Logs", icon: KeyRound },
 { id: "audit-logs", label: "Audit Logs", icon: History },
 ].map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as AdminTab)}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${
 activeTab === tab.id 
 ? "bg-navy-950 text-white shadow-md" 
 : "text-navy-950 hover:bg-sand-50"
 }`}
 >
 <tab.icon className="w-4 h-4" />
 {tab.label}
 </button>
 ))}
 </nav>

 {/* KPI Operations Bar */}
 {activeTab !== "promotions" && (
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
 <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
 <div className="flex items-center gap-2 mb-2">
 <Users className="w-4 h-4 text-gold-600" />
 <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Total Users</span>
 </div>
 <p className="text-xl font-bold text-navy-950">{stats?.userCount || 0}</p>
 </div>
 <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
 <div className="flex items-center gap-2 mb-2">
 <Building2 className="w-4 h-4 text-emerald-600" />
 <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Active Resorts</span>
 </div>
 <p className="text-xl font-bold text-navy-950">{activeResorts.length || 0}</p>
 </div>
 <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
 <div className="flex items-center gap-2 mb-2">
 <AlertCircle className="w-4 h-4 text-amber-600" />
 <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Pending Resorts</span>
 </div>
 <p className="text-xl font-bold text-navy-950">{pendingResorts.length || 0}</p>
 </div>
 <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
 <div className="flex items-center gap-2 mb-2">
 <CalendarDays className="w-4 h-4 text-blue-600" />
 <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Total Bookings</span>
 </div>
 <p className="text-xl font-bold text-navy-950">{stats?.bookingCount || 0}</p>
 </div>
 <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
 <div className="flex items-center gap-2 mb-2">
 <TrendingUp className="w-4 h-4 text-emerald-600" />
 <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Total Revenue</span>
 </div>
 <p className="text-xl font-bold text-navy-950">₹{stats?.platformEarnings?.toLocaleString() || 0}</p>
 </div>
 </div>
 )}
 {isLoading ? (
 <div className="flex items-center justify-center py-20">
 <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
 </div>
 ) : (
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.4 }}
 >
 <ErrorBoundary>
 {activeTab === "overview" && renderOverview()}
 {activeTab === "properties" && renderProperties()}
 {activeTab === "kyc" && <KycOperationsCenter />}
 {activeTab === "promotions" && <PromotionsModule />}
 {activeTab === "content" && <BlogModule />}
 {activeTab === "guides" && renderGuides()}
 {activeTab === "users" && <UserManagement />}
 {activeTab === "bookings" && renderBookings()}
 {activeTab === "payouts" && renderPayouts()}
 {activeTab === "newsletter" && renderNewsletter()}
 {activeTab === "security" && renderSecurity()}
 {activeTab === "otp-logs" && renderOtpLogs()}
 {activeTab === "reviews" && renderReviews()}
 {activeTab === "commissions" && renderCommissions()}
 {activeTab === "audit-logs" && renderAuditLogs()}
 </ErrorBoundary>
 </motion.div>
 )}
 </div>

 {/* EDIT USER MODAL */}
 <AnimatePresence>
 {editingUser && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setEditingUser(null)}
 className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm"
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-luxury p-10 border border-sand-100 "
 >
 <h3 className="text-2xl font-serif font-bold text-navy-950 mb-8">Edit Platform User</h3>
 <form onSubmit={handleUpdateUser} className="space-y-6">
 <div className="grid grid-cols-1 gap-6">
 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950 ml-1">Full Name</label>
 <input 
 type="text" 
 value={editingUser.name}
 onChange={e => setEditingUser({...editingUser, name: e.target.value})}
 className="w-full h-14 bg-sand-50 border-2 border-sand-200 rounded-xl px-4 font-bold text-navy-950 outline-none focus:border-gold-500 transition-all"
 />
 </div>
 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950 ml-1">Email Address</label>
 <input 
 type="email" 
 value={editingUser.email}
 onChange={e => setEditingUser({...editingUser, email: e.target.value})}
 className="w-full h-14 bg-sand-50 border-2 border-sand-200 rounded-xl px-4 font-bold text-navy-950 outline-none focus:border-gold-500 transition-all"
 />
 </div>
 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950 ml-1">Platform Role</label>
 <Select 
 value={editingUser.role}
 onChange={(val) => setEditingUser({...editingUser, role: val})}
 options={[
 { value: "TRAVELLER", label: "Traveler" },
 { value: "RESORT_OWNER", label: "Resort Owner" },
 { value: "GUIDE", label: "Local Expert (Guide)" },
 { value: "ADMIN", label: "System Administrator" }
 ]}
 />
 </div>
 </div>

 <div className="flex gap-4 pt-4">
 <Button 
 variant="outline" 
 className="flex-1 h-14 rounded-2xl"
 type="button"
 onClick={() => setEditingUser(null)}
 >
 Cancel
 </Button>
 <Button 
 className="flex-1 h-14 bg-navy-950 text-white rounded-2xl shadow-luxury"
 type="submit"
 isLoading={isSavingUser}
 >
 Save Changes
 </Button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* IDENTITY DOCUMENT PREVIEW LIGHTBOX */}
 <AnimatePresence>
 {selectedIdImage && (
 <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onContextMenu={(e) => e.preventDefault()}>
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => { setSelectedIdImage(null); setSelectedIdDetails(null); }}
 className="absolute inset-0 bg-navy-950/80 backdrop-blur-md"
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-luxury p-8 border border-sand-100 flex flex-col md:flex-row gap-8 overflow-hidden z-10"
 >
 {/* Left Column: Image with interactive controls */}
 <div className="flex-1 flex flex-col justify-center items-center bg-sand-50 rounded-[2rem] p-4 relative min-h-[300px] max-h-[500px] overflow-hidden select-none">
 <KycImage 
 src={selectedIdImage} 
 alt="Identity Document" 
 transform="w_1200,q_auto,f_auto" 
 className="w-full h-full rounded-2xl shadow-sm"
 />
 {/* Watermark Overlay */}
 <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-10">
 <p className="text-2xl md:text-4xl font-bold uppercase tracking-widest text-navy-950 rotate-12 text-center whitespace-nowrap">
 HampiStays Secure Verification
 </p>
 </div>
 </div>

 {/* Right Column: Information & Metadata */}
 <div className="w-full md:w-80 flex flex-col justify-between">
 <div>
 <div className="flex items-center gap-2 mb-4">
 <ShieldCheck className="w-6 h-6 text-gold-500" />
 <h3 className="text-xl font-serif font-bold text-navy-950 ">Document Details</h3>
 </div>

 {selectedIdDetails && (
 <div className="space-y-4 py-4 border-t border-b border-sand-100 ">
 <div>
 <span className="text-[10px] font-bold uppercase tracking-widest text-navy-950 block mb-1">Guide Name</span>
 <p className="font-bold text-navy-950 ">{selectedIdDetails.name}</p>
 </div>
 <div>
 <span className="text-[10px] font-bold uppercase tracking-widest text-navy-950 block mb-1">Document Type</span>
 <span className="px-3 py-1 bg-gold-50 text-gold-700 rounded-full text-xs font-bold uppercase tracking-wider">
 {selectedIdDetails.type}
 </span>
 </div>
 <div>
 <span className="text-[10px] font-bold uppercase tracking-widest text-navy-950 block mb-1">Document Number</span>
 <p className="font-mono text-sm font-bold text-navy-950 bg-sand-50 px-3 py-2 rounded-xl border border-sand-100 inline-block">
 {selectedIdDetails.number}
 </p>
 </div>
 </div>
 )}
 </div>

 <div className="flex flex-col gap-3 pt-6">
 <a 
 href={getKycImageUrl(selectedIdImage, "w_1200,q_auto,f_auto")} 
 target="_blank" 
 rel="noreferrer"
 className="flex items-center justify-center gap-2 w-full h-12 bg-sand-100 text-navy-950 rounded-xl font-bold hover:bg-sand-200 :bg-zinc-600 transition-colors text-xs uppercase tracking-widest"
 >
 <ExternalLink className="w-4 h-4" /> Open Original
 </a>
 <Button 
 className="w-full h-12 bg-navy-950 text-white rounded-xl shadow-luxury"
 onClick={() => { setSelectedIdImage(null); setSelectedIdDetails(null); }}
 >
 Close Inspection
 </Button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* REJECT GUIDE KYC REASON MODAL */}
 <AnimatePresence>
 {rejectingGuideId && (
 <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setRejectingGuideId(null)}
 className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm"
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-luxury p-10 border border-sand-100 z-10"
 >
 <div className="flex items-center gap-3 mb-6">
 <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
 <XCircle className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-xl font-serif font-bold text-navy-950 ">Reject Verification</h3>
 <p className="text-xs text-navy-950 ">Provide a reason for document rejection</p>
 </div>
 </div>

 <div className="space-y-6">
 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950 ml-1 block mb-2">Rejection Reason</label>
 <textarea 
 value={rejectionReasonInput}
 onChange={e => setRejectionReasonInput(e.target.value)}
 placeholder="e.g. The uploaded Aadhar card photo is too blurry or crop is incomplete. Please re-upload a clear image."
 className="w-full h-32 bg-sand-50 border-2 border-sand-200 rounded-xl p-4 font-medium text-navy-950 outline-none focus:border-red-500 transition-all placeholder:text-navy-950 text-sm resize-none"
 />
 </div>

 <div className="flex gap-4">
 <Button 
 variant="outline" 
 className="flex-1 h-12 rounded-xl"
 onClick={() => setRejectingGuideId(null)}
 >
 Cancel
 </Button>
 <Button 
 className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-red-600/10 animate-pulse-slow"
 onClick={() => handleGuideStatus(rejectingGuideId, 'REJECTED', rejectionReasonInput)}
 isLoading={processingId === rejectingGuideId}
 disabled={!rejectionReasonInput.trim()}
 >
 Submit Rejection
 </Button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}





