/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, CheckCircle, XCircle, Search, Percent, IndianRupee } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../utils/apiClient';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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
}

export function PromotionsModule() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<Promotion[]>('/admin/promotions');
      setPromotions(res || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch promotions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete promotion');
    }
  };

  const toggleActive = async (promo: Promotion) => {
    try {
      await apiClient.patch(`/admin/promotions/${promo.id}`, { active: !promo.active });
      toast.success(`Promotion ${promo.active ? 'disabled' : 'enabled'}`);
      fetchPromotions();
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

  const filteredPromotions = promotions.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const usageData = promotions.map(p => ({
    name: p.code || p.name,
    usage: p.usageCount
  }));

  const revenueData = promotions.map(p => ({
    name: p.code || p.name,
    revenue: p.usageCount * (p.discountType === 'flat' ? p.discountValue * 5 : 10000)
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-navy-950">Promotions & Offers</h2>
          <p className="text-slate-500 mt-1">Manage discount codes and platform offers</p>
        </div>
        <Button onClick={openCreate} className="bg-navy-950 text-white gap-2">
          <Plus className="w-4 h-4" />
          Create Offer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm">
          <h3 className="text-lg font-bold text-navy-950 mb-4">Promotion Usage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="usage" fill="#0A0F1E" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm">
          <h3 className="text-lg font-bold text-navy-950 mb-4">Revenue Generated with Offers</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip cursor={{ stroke: '#9CA3AF' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#B8860B" strokeWidth={3} dot={{ r: 4, fill: '#B8860B', strokeWidth: 2, stroke: '#FFFFFF' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-navy-950 mb-4">{editingPromo.id ? 'Edit Offer' : 'New Offer'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-950 mb-1">Offer Name *</label>
              <input type="text" className="w-full px-4 py-2 border border-sand-200 rounded-lg" 
                value={editingPromo.name || ''} 
                onChange={e => setEditingPromo({...editingPromo, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-950 mb-1">Promo Code</label>
              <input type="text" className="w-full px-4 py-2 border border-sand-200 rounded-lg uppercase" 
                placeholder="Leave blank for auto-apply"
                value={editingPromo.code || ''} 
                onChange={e => setEditingPromo({...editingPromo, code: e.target.value.toUpperCase()})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-950 mb-1">Discount Type *</label>
              <select className="w-full px-4 py-2 border border-sand-200 rounded-lg"
                value={editingPromo.discountType || 'percentage'}
                onChange={e => setEditingPromo({...editingPromo, discountType: e.target.value as 'percentage'|'flat'})}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-950 mb-1">Discount Value *</label>
              <input type="number" className="w-full px-4 py-2 border border-sand-200 rounded-lg" 
                value={editingPromo.discountValue || ''} 
                onChange={e => setEditingPromo({...editingPromo, discountValue: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-950 mb-1">Min. Booking Amount (₹)</label>
              <input type="number" className="w-full px-4 py-2 border border-sand-200 rounded-lg" 
                value={editingPromo.minBookingAmount || ''} 
                onChange={e => setEditingPromo({...editingPromo, minBookingAmount: Number(e.target.value) || null})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-950 mb-1">Max Discount (₹)</label>
              <input type="number" className="w-full px-4 py-2 border border-sand-200 rounded-lg" 
                value={editingPromo.maxDiscount || ''} 
                onChange={e => setEditingPromo({...editingPromo, maxDiscount: Number(e.target.value) || null})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-950 mb-1">Usage Limit</label>
              <input type="number" className="w-full px-4 py-2 border border-sand-200 rounded-lg" 
                placeholder="Leave empty for unlimited"
                value={editingPromo.usageLimit || ''} 
                onChange={e => setEditingPromo({...editingPromo, usageLimit: Number(e.target.value) || null})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-950 mb-1">Priority (Higher wins)</label>
              <input type="number" className="w-full px-4 py-2 border border-sand-200 rounded-lg" 
                value={editingPromo.priority || 1} 
                onChange={e => setEditingPromo({...editingPromo, priority: Number(e.target.value)})} />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input type="checkbox" id="firstBookingOnly" 
                checked={editingPromo.firstBookingOnly || false} 
                onChange={e => setEditingPromo({...editingPromo, firstBookingOnly: e.target.checked})} />
              <label htmlFor="firstBookingOnly" className="text-sm font-medium text-navy-950">First Booking Only</label>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button className="bg-navy-950 text-white" onClick={handleSave}>Save Offer</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-sand-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-sand-200 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search promotions..." 
              className="w-full pl-10 pr-4 py-2 border border-sand-200 rounded-lg focus:outline-none focus:border-navy-950"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-sand-50 border-b border-sand-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-navy-950 uppercase tracking-wider">Offer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-navy-950 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-navy-950 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-navy-950 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-navy-950 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading promotions...</td></tr>
              ) : filteredPromotions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No promotions found.</td></tr>
              ) : (
                filteredPromotions.map(promo => (
                  <tr key={promo.id} className="hover:bg-sand-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-navy-950">{promo.name}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <Tag className="w-3 h-3" />
                        {promo.code || 'Auto-applied'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-medium text-navy-950">
                        {promo.discountType === 'percentage' ? <Percent className="w-3 h-3"/> : <IndianRupee className="w-3 h-3"/>}
                        {promo.discountValue}{promo.discountType === 'percentage' ? '%' : ''}
                      </div>
                      {promo.minBookingAmount && <div className="text-xs text-slate-500 mt-1">Min: ₹{promo.minBookingAmount}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-navy-950">
                        {promo.usageCount} {promo.usageLimit ? `/ ${promo.usageLimit}` : 'used'}
                      </div>
                      {promo.firstBookingOnly && <div className="text-xs text-gold-600 mt-1 font-medium">New users only</div>}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleActive(promo)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          promo.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        }`}
                      >
                        {promo.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {promo.active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingPromo(promo); setIsEditing(true); }} className="p-2 text-slate-400 hover:text-navy-950 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(promo.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
