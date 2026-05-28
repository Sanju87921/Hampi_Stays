import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Megaphone, Star, ArrowUpRight } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';

const SponsoredAdsModule = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [resortId, setResortId] = useState('');
  const [placement, setPlacement] = useState('HOMEPAGE_HERO');
  const [priority, setPriority] = useState(1);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const data = await apiClient.get<any[]>('/curation/sponsored');
      setAds(data || []);
    } catch (err) {
      toast.error('Failed to load sponsored placements');
    }
  };

  const handleOpenEditor = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setResortId(item.resortId);
      setPlacement(item.placement);
      setPriority(item.priority);
      setStartsAt(new Date(item.startsAt).toISOString().split('T')[0]);
      setEndsAt(new Date(item.endsAt).toISOString().split('T')[0]);
      setIsActive(item.isActive);
    } else {
      setEditingItem(null);
      setResortId('');
      setPlacement('HOMEPAGE_HERO');
      setPriority(1);
      setStartsAt('');
      setEndsAt('');
      setIsActive(true);
    }
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        resortId,
        placement,
        priority,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive
      };
      
      if (editingItem) {
        await apiClient.put(`/curation/sponsored/${editingItem.id}`, payload);
        toast.success('Ad updated');
      } else {
        await apiClient.post('/curation/sponsored', payload);
        toast.success('Ad created');
      }
      setIsEditing(false);
      fetchAds();
    } catch (err) {
      toast.error('Failed to save sponsored placement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await apiClient.delete(`/curation/sponsored/${id}`);
      fetchAds();
      toast.success('Ad deleted');
    } catch (err) {
      toast.error('Failed to delete ad');
    }
  };

  if (isEditing) {
    return (
      <div className="bg-sand-50/50 p-6 rounded-2xl border border-sand-200">
        <h3 className="text-xl font-bold text-navy-950 mb-6">{editingItem ? 'Edit Ad' : 'New Sponsored Ad'}</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-navy-950/60 uppercase">Resort ID (Must exist)</label>
            <input required type="text" value={resortId} onChange={e => setResortId(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
          </div>
          <div>
            <label className="text-xs font-bold text-navy-950/60 uppercase">Placement Strategy</label>
            <select value={placement} onChange={e => setPlacement(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4">
              <option value="HOMEPAGE_HERO">Homepage Hero Banner</option>
              <option value="SEARCH_TOP">Search Top Result Boost</option>
              <option value="LUXURY_FEATURED">Luxury Featured Collection</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-navy-950/60 uppercase">Start Date</label>
              <input required type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
            </div>
            <div>
              <label className="text-xs font-bold text-navy-950/60 uppercase">End Date</label>
              <input required type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-navy-950/60 uppercase">Priority Index</label>
              <input type="number" value={priority} onChange={e => setPriority(parseInt(e.target.value))} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-5 h-5" />
              <label className="font-bold">Active</label>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" className="bg-navy-950 text-white">Save Placement</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gold-50 p-6 rounded-2xl border border-gold-200">
        <div>
          <h3 className="font-bold text-navy-950 text-lg flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-gold-500" /> Sponsored Placements
          </h3>
          <p className="text-sm text-navy-950/60">Boost visibility for partner resorts across the platform.</p>
        </div>
        <Button onClick={() => handleOpenEditor()} className="bg-gold-500 text-white hover:bg-gold-600 gap-2">
          <Plus className="w-4 h-4" /> New Ad
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map(ad => (
          <div key={ad.id} className="bg-white rounded-2xl border border-sand-200 p-5 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${ad.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {ad.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h4 className="font-bold text-navy-950 text-lg mb-1">{ad.resortId}</h4>
            <div className="flex items-center gap-1 text-xs text-gold-600 font-bold uppercase tracking-widest mb-4">
              <Star className="w-3 h-3" /> {ad.placement.replace('_', ' ')}
            </div>
            <p className="text-sm text-navy-950/60 mb-2">Priority: {ad.priority}</p>
            <p className="text-xs text-navy-950/40 mb-6 font-mono">
              {new Date(ad.startsAt).toLocaleDateString()} - {new Date(ad.endsAt).toLocaleDateString()}
            </p>
            <div className="mt-auto flex gap-2">
              <Button variant="outline" onClick={() => handleOpenEditor(ad)} className="flex-1 text-xs h-9">Edit</Button>
              <Button variant="outline" onClick={() => handleDelete(ad.id)} className="border-red-200 text-red-600 hover:bg-red-50 h-9 px-3">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SponsoredAdsModule;
