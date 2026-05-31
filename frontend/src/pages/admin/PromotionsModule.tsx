/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, CheckCircle, XCircle, Search, Percent, IndianRupee, Copy, TrendingUp, Calendar, AlertCircle, Clock, History, Award } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../utils/apiClient';
import toast from 'react-hot-toast';

interface Promotion {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minBookingAmount: number | null;
  maxDiscount: number | null;
  firstBookingOnly: boolean;
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
  validFrom: string | null;
  validUntil: string | null;
  priority: number;
  createdAt?: string;
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user: { name: string; email: string };
}

export function PromotionsModule() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      const [promosRes, analyticsRes] = await Promise.all([
        apiClient.get<Promotion[]>('/admin/promotions'),
        apiClient.get<any>('/admin/promotions/analytics')
      ]);
      setPromotions(promosRes || []);
      setAnalytics(analyticsRes || null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch promotions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await apiClient.get<AuditLog[]>('/admin/audit-logs?entityType=PROMOTION');
      if (res && Array.isArray(res)) {
        setAuditLogs(res.slice(0, 5)); // Keep lightweight
      }
    } catch (e) {
      // Gracefully ignore if audit logs aren't fully integrated for promotions yet
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchAuditLogs();
  }, []);

  const handleSave = async () => {
    if (!editingPromo.name || !editingPromo.discountType || !editingPromo.discountValue) {
      toast.error("Please fill required fields (Name, Type, Value)");
      return;
    }

    try {
      if (editingPromo.id) {
        await apiClient.patch(`/admin/promotions/${editingPromo.id}`, editingPromo);
        toast.success("Promotion updated successfully");
      } else {
        await apiClient.post('/admin/promotions', editingPromo);
        toast.success("Promotion created successfully");
      }
      setIsEditing(false);
      setEditingPromo({});
      fetchPromotions();
      fetchAuditLogs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save promotion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    try {
      await apiClient.delete(`/admin/promotions/${id}`);
      toast.success("Promotion deleted");
      fetchPromotions();
      fetchAuditLogs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete promotion');
    }
  };

  const toggleActive = async (promo: Promotion) => {
    try {
      await apiClient.patch(`/admin/promotions/${promo.id}`, { active: !promo.active });
      toast.success(`Promotion ${promo.active ? 'disabled' : 'enabled'}`);
      fetchPromotions();
      fetchAuditLogs();
    } catch (err: any) {
      toast.error("Failed to toggle status");
    }
  };

  const openCreate = () => {
    setEditingPromo({
      discountType: 'percentage',
      discountValue: 10,
      active: true,
      priority: 1,
      firstBookingOnly: false,
      usageCount: 0
    });
    setIsEditing(true);
  };

  const handleClone = (promo: Promotion) => {
    setEditingPromo({
      ...promo,
      id: undefined,
      name: `${promo.name} (Copy)`,
      code: promo.code ? `${promo.code}_COPY` : '',
      usageCount: 0
    });
    setIsEditing(true);
  };

  const getStatusBadge = (promo: Promotion) => {
    if (!promo.active) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-zinc-100 text-zinc-600 border border-zinc-200"><XCircle className="w-3 h-3"/> Disabled</span>;
    }
    
    const now = new Date();
    if (promo.validUntil && new Date(promo.validUntil) < now) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-rose-50 text-rose-600 border border-rose-200"><AlertCircle className="w-3 h-3"/> Expired</span>;
    }
    if (promo.validFrom && new Date(promo.validFrom) > now) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-50 text-amber-600 border border-amber-200"><Clock className="w-3 h-3"/> Scheduled</span>;
    }
    
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-50 text-emerald-600 border border-emerald-200"><CheckCircle className="w-3 h-3"/> Active</span>;
  };

  const filteredPromotions = promotions.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const usageData = analytics?.usageData || [];
  const revenueData = analytics?.revenueData || [];
  const historicalData = analytics?.historicalUsage || [];
  const leaderboard = [...revenueData].sort((a,b) => b.revenue - a.revenue).slice(0, 5);

  const netRevenue = (analytics?.totalRevenueGenerated || 0) - (analytics?.totalDiscounts || 0);
  const roi = analytics?.totalDiscounts > 0 ? ((netRevenue / analytics.totalDiscounts) * 100).toFixed(1) : '∞';

  if (!isLoading && promotions.length === 0 && !isEditing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-sand-200 shadow-sm text-center">
        <div className="w-20 h-20 bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6">
          <Tag className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-serif text-navy-950 font-bold mb-2">No active promotions</h3>
        <p className="text-slate-500 mb-8 max-w-md">Launch your first promotional campaign to boost bookings and drive more revenue.</p>
        <Button onClick={openCreate} className="bg-navy-950 text-white rounded-xl shadow-luxury h-12 px-8 font-bold tracking-wide">
          <Plus className="w-5 h-5 mr-2"/> Create First Promotion
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. REPLACE GENERIC KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Active Promos</span>
          </div>
          <p className="text-2xl font-bold text-navy-950">{analytics?.activePromotions || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gold-600" />
            <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Promo Revenue</span>
          </div>
          <p className="text-2xl font-bold text-navy-950">₹{(analytics?.totalRevenueGenerated || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-rose-600" />
            <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Total Discounts</span>
          </div>
          <p className="text-2xl font-bold text-navy-950">₹{(analytics?.totalDiscounts || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Conversion Rate</span>
          </div>
          <p className="text-2xl font-bold text-navy-950">{(analytics?.conversionRate || 0).toFixed(1)}%</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Most Used</span>
          </div>
          <p className="text-xl font-bold text-navy-950 truncate">{analytics?.mostUsedPromo || 'None'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-navy-950 font-bold">Revenue Operations Center</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Campaigns & Promotions</p>
        </div>
        <Button onClick={openCreate} className="bg-navy-950 text-white gap-2 rounded-xl h-12 px-6 font-bold shadow-luxury hover:-translate-y-0.5 transition-transform">
          <Plus className="w-5 h-5" />
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 6. REVENUE INSIGHTS */}
        <div className="bg-navy-950 p-8 rounded-[2rem] text-white shadow-luxury relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3"></div>
          <h3 className="text-xl font-serif font-bold mb-8 flex items-center gap-2 relative z-10"><TrendingUp className="text-gold-400"/> Revenue Insights</h3>
          
          <div className="space-y-6 relative z-10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Gross Revenue Generated</span>
              <p className="text-3xl font-bold text-white">₹{(analytics?.totalRevenueGenerated || 0).toLocaleString()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Net Revenue</span>
                <p className="text-xl font-bold text-emerald-400">₹{netRevenue.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Discount Given</span>
                <p className="text-xl font-bold text-rose-400">₹{(analytics?.totalDiscounts || 0).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Campaign ROI</span>
              <p className="text-lg font-bold text-gold-400">{roi}% Return on Discount</p>
            </div>
          </div>
        </div>

        {/* 4. PERFORMANCE LEADERBOARD */}
        <div className="bg-white p-8 rounded-[2rem] border border-sand-200 shadow-sm lg:col-span-2">
          <h3 className="text-xl font-serif font-bold text-navy-950 mb-6 flex items-center gap-2"><Award className="text-gold-500"/> Top Performing Campaigns</h3>
          <div className="space-y-4">
            {leaderboard.length > 0 ? leaderboard.map((item, idx) => {
              const usageMatch = usageData.find(u => u.name === item.name);
              return (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-sand-50 border border-sand-100 hover:border-gold-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-sand-200 flex items-center justify-center font-bold text-navy-950 shadow-sm">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-navy-950">{item.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{usageMatch?.usage || 0} Total Uses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">₹{item.revenue.toLocaleString()}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Generated</p>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-10 text-slate-400 text-sm">No revenue data available yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* 5. USAGE TREND CHART */}
      <div className="bg-white p-8 rounded-[2rem] border border-sand-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-serif font-bold text-navy-950">Daily Usage Trends</h3>
          <div className="flex gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-1 bg-sand-100 rounded-md">Last 30 Days</span>
          </div>
        </div>
        <div className="h-48 flex items-end gap-2 overflow-x-auto hide-scrollbar pb-2">
          {historicalData.length > 0 ? historicalData.slice(-30).map((day: any, i: number) => {
            const totalUses = Object.values(day).reduce((acc: any, val: any) => typeof val === 'number' ? acc + val : acc, 0) as number;
            const maxUses = Math.max(...historicalData.map((d: any) => Object.values(d).reduce((acc: any, val: any) => typeof val === 'number' ? acc + val : acc, 0) as number)) || 1;
            
            return (
              <div key={i} className="flex-1 min-w-[30px] flex flex-col justify-end items-center h-full group relative">
                <div 
                  className="w-full bg-navy-950/20 hover:bg-gold-500 rounded-t-sm transition-all"
                  style={{ height: `${Math.max((totalUses / maxUses) * 100, 5)}%` }}
                ></div>
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-navy-950 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-10 transition-opacity">
                  {day.date}: {totalUses} uses
                </div>
              </div>
            );
          }) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No historical usage data available.</div>
          )}
        </div>
      </div>

      {/* 2 & 3. ACTIVE PROMOTIONS TABLE WITH STATUS SYSTEM & 7. CLONE ACTION */}
      <div className="bg-white rounded-[2rem] border border-sand-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-sand-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-sand-50/50">
          <h3 className="text-xl font-serif font-bold text-navy-950">Campaign Management</h3>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search campaigns by name or code..." 
              className="w-full pl-10 pr-4 py-2 border border-sand-200 rounded-xl focus:outline-none focus:border-navy-950 text-sm font-medium placeholder:text-slate-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-sand-200">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Campaign Name</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type & Value</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Performance</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Schedule</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100 bg-white">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredPromotions.map(promo => {
                const revenueMatch = revenueData.find(r => r.name === promo.code || r.name === promo.name);
                const revenueAmount = revenueMatch?.revenue || 0;
                let discountAmount = 0;
                if (promo.usageCount > 0) {
                   const avg = revenueAmount / promo.usageCount;
                   discountAmount = promo.discountType === 'percentage' 
                     ? (avg * (promo.discountValue/100)) * promo.usageCount
                     : promo.discountValue * promo.usageCount;
                }

                return (
                  <tr key={promo.id} className="hover:bg-sand-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy-950">{promo.name}</div>
                      <div className="text-xs font-mono font-medium text-slate-500 flex items-center gap-1.5 mt-1 bg-sand-100 w-max px-2 py-0.5 rounded-md">
                        <Tag className="w-3 h-3" />
                        {promo.code || 'AUTO-APPLIED'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-navy-950">
                        {promo.discountType === 'percentage' ? <Percent className="w-3.5 h-3.5 text-emerald-600"/> : <IndianRupee className="w-3.5 h-3.5 text-emerald-600"/>}
                        {promo.discountValue}{promo.discountType === 'percentage' ? '%' : ''} OFF
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                        {promo.minBookingAmount ? `Min: ₹${promo.minBookingAmount}` : 'No Minimum'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(promo)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy-950">{promo.usageCount} <span className="text-slate-400 font-medium text-xs">Uses</span></div>
                      <div className="text-xs text-emerald-600 font-bold mt-1">₹{revenueAmount.toLocaleString()} Rev</div>
                      {promo.usageCount > 0 && (
                        <div className="mt-1.5">
                          {revenueAmount > 20000 && promo.usageCount > 3 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-emerald-600"><CheckCircle className="w-3 h-3"/> High Performing</span>
                          ) : revenueAmount < 5000 && promo.usageCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-rose-600"><XCircle className="w-3 h-3"/> Underperforming</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-amber-600"><CheckCircle className="w-3 h-3"/> Average</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-navy-950 flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3 h-3 text-slate-400"/>
                        {promo.validUntil ? new Date(promo.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No expiry'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleActive(promo)} className="p-2 text-slate-400 hover:text-navy-950 transition-colors" title="Toggle Status">
                          {promo.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleClone(promo)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Clone Campaign">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingPromo(promo); setIsEditing(true); }} className="p-2 text-slate-400 hover:text-gold-600 transition-colors" title="Edit Campaign">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(promo.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Delete Campaign">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. PROMOTION AUDIT HISTORY */}
      <div className="bg-white rounded-[2rem] border border-sand-200 shadow-sm overflow-hidden p-6">
        <h3 className="text-lg font-serif font-bold text-navy-950 mb-6 flex items-center gap-2"><History className="w-5 h-5 text-slate-400"/> Campaign Audit Log</h3>
        {auditLogs.length > 0 ? (
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 pb-4 border-b border-sand-100 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-navy-950">{log.user?.name?.charAt(0) || 'A'}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-950">
                    <span className="font-bold">{log.user?.name || 'Administrator'}</span> {log.action.toLowerCase().replace(/_/g, ' ')} a promotion.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(log.createdAt).toLocaleString()} • {log.details}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500 flex items-center gap-2 bg-sand-50 p-4 rounded-xl">
            <AlertCircle className="w-4 h-4"/> No recent audit logs found for promotional activities.
          </div>
        )}
      </div>

      {/* 8. SCHEDULED CAMPAIGNS & CREATION MODAL & 10. REVENUE IMPACT PREVIEW */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-6xl m-auto my-8 border border-sand-200">
            <h3 className="text-2xl font-serif font-bold text-navy-950 mb-8">{editingPromo.id ? 'Edit Campaign Configuration' : 'Launch New Campaign'}</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-sand-200 pb-2">Core Settings</h4>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-navy-950 mb-2">Campaign Name *</label>
                  <input type="text" className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-gold-500 font-medium" 
                    value={editingPromo.name || ''} 
                    onChange={e => setEditingPromo({...editingPromo, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-navy-950 mb-2">Promo Code</label>
                  <input type="text" className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-gold-500 font-mono font-bold text-sm uppercase placeholder:font-sans placeholder:font-normal placeholder:normal-case" 
                    placeholder="Leave blank for auto-apply"
                    value={editingPromo.code || ''} 
                    onChange={e => setEditingPromo({...editingPromo, code: e.target.value.toUpperCase()})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-navy-950 mb-2">Discount Type *</label>
                    <select className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-gold-500 font-medium"
                      value={editingPromo.discountType || 'percentage'}
                      onChange={e => setEditingPromo({...editingPromo, discountType: e.target.value as 'percentage'|'flat'})}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-navy-950 mb-2">Value *</label>
                    <input type="number" className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-gold-500 font-medium" 
                      value={editingPromo.discountValue || ''} 
                      onChange={e => setEditingPromo({...editingPromo, discountValue: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-sand-200 pb-2">Constraints & Scheduling</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-navy-950 mb-2">Min. Booking (₹)</label>
                    <input type="number" className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-gold-500 font-medium" 
                      placeholder="None"
                      value={editingPromo.minBookingAmount || ''} 
                      onChange={e => setEditingPromo({...editingPromo, minBookingAmount: Number(e.target.value) || null})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-navy-950 mb-2">Max Discount (₹)</label>
                    <input type="number" className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-gold-500 font-medium" 
                      placeholder="None"
                      value={editingPromo.maxDiscount || ''} 
                      onChange={e => setEditingPromo({...editingPromo, maxDiscount: Number(e.target.value) || null})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-navy-950 mb-2">Valid From</label>
                    <input type="datetime-local" className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-gold-500 text-sm font-medium" 
                      value={editingPromo.validFrom ? new Date(editingPromo.validFrom).toISOString().slice(0, 16) : ''} 
                      onChange={e => setEditingPromo({...editingPromo, validFrom: e.target.value ? new Date(e.target.value).toISOString() : null})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-navy-950 mb-2">Valid Until</label>
                    <input type="datetime-local" className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-gold-500 text-sm font-medium" 
                      value={editingPromo.validUntil ? new Date(editingPromo.validUntil).toISOString().slice(0, 16) : ''} 
                      onChange={e => setEditingPromo({...editingPromo, validUntil: e.target.value ? new Date(e.target.value).toISOString() : null})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-navy-950 mb-2">Usage Limit</label>
                    <input type="number" className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-gold-500 font-medium" 
                      placeholder="Unlimited"
                      value={editingPromo.usageLimit || ''} 
                      onChange={e => setEditingPromo({...editingPromo, usageLimit: Number(e.target.value) || null})} />
                  </div>
                  <div className="flex items-center space-x-3 pt-8">
                    <input type="checkbox" id="firstBookingOnly" className="w-5 h-5 text-gold-600 rounded focus:ring-gold-500"
                      checked={editingPromo.firstBookingOnly || false} 
                      onChange={e => setEditingPromo({...editingPromo, firstBookingOnly: e.target.checked})} />
                    <label htmlFor="firstBookingOnly" className="text-sm font-bold text-navy-950">First Booking Only</label>
                  </div>
                </div>
              </div>
              
              {/* REVENUE IMPACT PREVIEW PANEL */}
              <div className="lg:col-span-1 bg-navy-950 rounded-[2rem] p-6 text-white shadow-luxury relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3"></div>
                <h4 className="text-sm font-serif font-bold mb-6 flex items-center gap-2 relative z-10"><TrendingUp className="text-gold-400 w-4 h-4"/> Revenue Impact Preview</h4>
                
                <div className="space-y-4 relative z-10">
                  {[3000, 5000, 10000, 20000].map(amount => {
                    // Check Min Booking
                    if (editingPromo.minBookingAmount && amount < editingPromo.minBookingAmount) {
                      return (
                        <div key={amount} className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-300">Booking ₹{amount.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Below Min</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-white/10">
                            <span className="text-xs text-slate-400">Final Total</span>
                            <span className="font-bold">₹{amount.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }

                    // Calculate Discount
                    let discount = 0;
                    let isMaxCapped = false;
                    
                    if (editingPromo.discountType === 'percentage') {
                      discount = amount * ((editingPromo.discountValue || 0) / 100);
                      if (editingPromo.maxDiscount && discount > editingPromo.maxDiscount) {
                        discount = editingPromo.maxDiscount;
                        isMaxCapped = true;
                      }
                    } else {
                      discount = editingPromo.discountValue || 0;
                      if (discount > amount) discount = amount;
                    }

                    const finalTotal = amount - discount;

                    return (
                      <div key={amount} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-300">Booking ₹{amount.toLocaleString()}</span>
                          <span className="text-xs font-bold text-gold-400">-₹{discount.toLocaleString()} {isMaxCapped && <span className="text-[9px] text-rose-300 ml-1">(Max Cap)</span>}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/10">
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Final Total</span>
                          <span className="text-lg font-bold text-emerald-400">₹{finalTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
            </div>
            
            <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-sand-200">
              <Button variant="outline" className="h-12 px-6 rounded-xl border-sand-200" onClick={() => setIsEditing(false)}>Discard</Button>
              <Button className="bg-navy-950 text-white h-12 px-8 rounded-xl shadow-luxury font-bold tracking-wide" onClick={handleSave}>Save Campaign</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
