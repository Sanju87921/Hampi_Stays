import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, CheckCircle, XCircle, Search, Percent, IndianRupee } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { apiClient } from '../../../utils/apiClient';
import toast from 'react-hot-toast';
import { useModal } from '../../../components/shared/ModalProvider';

interface Promotion {
  id: string;
  name: string;
  code: string | null;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minBookingAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
  validFrom: string | null;
  validUntil: string | null;
  autoApply: boolean;
  targetType: string;
  targetId: string | null;
}

export function OwnerPromotionsModule({ resortId }: { resortId: string }) {
  const { confirm } = useModal();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion>>({});
  
  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<Promotion[]>(`/owners/promotions?resortId=${resortId}`);
      setPromotions(res || []);
    } catch (err: any) {
      toast.error('Failed to fetch promotions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (resortId) fetchPromotions();
  }, [resortId]);

  const handleSave = async () => {
    if (!editingPromo.name || !editingPromo.discountType || !editingPromo.discountValue) {
      toast.error("Please fill required fields (Name, Type, Value)");
      return;
    }

    try {
      const payload = {
        ...editingPromo,
        targetType: 'RESORT',
        targetId: resortId,
      };

      if (editingPromo.id) {
        await apiClient.patch(`/owners/promotions/${editingPromo.id}`, payload);
        toast.success("Promotion updated");
      } else {
        await apiClient.post('/owners/promotions', payload);
        toast.success("Promotion created");
      }
      setIsEditing(false);
      setEditingPromo({});
      fetchPromotions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save promotion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Confirm", message: "Delete this promotion?" }))) return;
    try {
      await apiClient.delete(`/owners/promotions/${id}`);
      toast.success("Promotion deleted");
      fetchPromotions();
    } catch (err: any) {
      toast.error('Failed to delete promotion');
    }
  };

  const toggleActive = async (promo: Promotion) => {
    try {
      await apiClient.patch(`/owners/promotions/${promo.id}`, { active: !promo.active });
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
      autoApply: true,
      targetType: 'RESORT',
      targetId: resortId
    });
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-sand-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-navy-950">Resort Offers & Promotions</h2>
          <p className="text-sm text-slate-500">Create special deals to attract more bookings to your property.</p>
        </div>
        <Button onClick={openCreate} className="bg-navy-950 text-white gap-2 rounded-xl h-10 px-4 font-bold">
          <Plus className="w-4 h-4" /> Create Offer
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-sand-50 border-b border-sand-200">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Offer Name & Code</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Discount</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status & Usage</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {isLoading ? (
               <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
            ) : promotions.length === 0 ? (
               <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No promotions created yet.</td></tr>
            ) : promotions.map(promo => (
              <tr key={promo.id}>
                <td className="px-6 py-4">
                  <div className="font-bold text-navy-950">{promo.name}</div>
                  {promo.code && <div className="text-xs font-mono font-medium text-slate-500 bg-sand-100 w-max px-2 py-0.5 rounded-md mt-1">{promo.code}</div>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 font-bold text-navy-950">
                    {promo.discountType === 'percentage' ? <Percent className="w-3.5 h-3.5"/> : <IndianRupee className="w-3.5 h-3.5"/>}
                    {promo.discountValue}{promo.discountType === 'percentage' ? '%' : ''} OFF
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="text-xs font-bold uppercase">
                     {promo.active ? <span className="text-emerald-600">Active</span> : <span className="text-rose-600">Disabled</span>}
                   </div>
                   <div className="text-xs text-slate-500 mt-1">{promo.usageCount} Uses</div>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <button onClick={() => toggleActive(promo)} className="text-slate-400 hover:text-navy-950">
                        {promo.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditingPromo(promo); setIsEditing(true); }} className="text-slate-400 hover:text-gold-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(promo.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-serif font-bold text-navy-950 mb-6">{editingPromo.id ? 'Edit Offer' : 'Create Offer'}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-navy-950 mb-2">Offer Name</label>
                <input type="text" className="w-full px-4 py-2 border rounded-xl" value={editingPromo.name || ''} onChange={e => setEditingPromo({...editingPromo, name: e.target.value})} placeholder="e.g. Weekend Special"/>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-navy-950 mb-2">Promo Code (Optional)</label>
                <input type="text" className="w-full px-4 py-2 border rounded-xl" value={editingPromo.code || ''} onChange={e => setEditingPromo({...editingPromo, code: e.target.value})} placeholder="e.g. SUMMER24"/>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-navy-950 mb-2">Auto Apply Mode</label>
                <div className="flex items-center mt-3 gap-2">
                  <input type="checkbox" checked={editingPromo.autoApply ?? true} onChange={e => setEditingPromo({...editingPromo, autoApply: e.target.checked})} />
                  <span className="text-sm">Apply automatically to carts</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-navy-950 mb-2">Discount Type</label>
                <Select value={editingPromo.discountType || 'percentage'} onChange={val => setEditingPromo({...editingPromo, discountType: val as 'percentage'|'flat'})} options={[{value:'percentage',label:'Percentage (%)'},{value:'flat',label:'Flat Amount (₹)'}]} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-navy-950 mb-2">Value</label>
                <input type="number" className="w-full px-4 py-2 border rounded-xl" value={editingPromo.discountValue || ''} onChange={e => setEditingPromo({...editingPromo, discountValue: Number(e.target.value)})} />
              </div>
              <div>
                 <label className="block text-xs font-bold uppercase text-navy-950 mb-2">Valid From</label>
                 <input type="date" className="w-full px-4 py-2 border rounded-xl" value={editingPromo.validFrom ? new Date(editingPromo.validFrom).toISOString().split('T')[0] : ''} onChange={e => setEditingPromo({...editingPromo, validFrom: e.target.value ? new Date(e.target.value).toISOString() : null})} />
              </div>
              <div>
                 <label className="block text-xs font-bold uppercase text-navy-950 mb-2">Valid Until</label>
                 <input type="date" className="w-full px-4 py-2 border rounded-xl" value={editingPromo.validUntil ? new Date(editingPromo.validUntil).toISOString().split('T')[0] : ''} onChange={e => setEditingPromo({...editingPromo, validUntil: e.target.value ? new Date(e.target.value).toISOString() : null})} />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
               <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
               <Button onClick={handleSave} className="bg-navy-950 text-white">Save Offer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
