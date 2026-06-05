import { useModal } from "../../../components/shared/ModalProvider";
import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Calendar, Star, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';

const SeasonalCampaignsModule = () => {
 const [campaigns, setCampaigns] = useState<any[]>([]);
 const [isEditing, setIsEditing] = useState(false);
 const [editingItem, setEditingItem] = useState<any>(null);

 // Form State
 const [title, setTitle] = useState('');
 const [subtitle, setSubtitle] = useState('');
 const [bannerUrl, setBannerUrl] = useState('');
 const [startsAt, setStartsAt] = useState('');
 const [endsAt, setEndsAt] = useState('');
 const [priority, setPriority] = useState(0);
 const [isActive, setIsActive] = useState(true);

 useEffect(() => {
 fetchCampaigns();
 }, []);

 const fetchCampaigns = async () => {
 try {
 const data = await apiClient.get<any[]>('/curation/campaigns');
 setCampaigns(data || []);
 } catch (err) {
 toast.error('Failed to load campaigns');
 }
 };

 const handleOpenEditor = (item: any = null) => {
 if (item) {
 setEditingItem(item);
 setTitle(item.title);
 setSubtitle(item.subtitle || '');
 setBannerUrl(item.bannerUrl || '');
 setStartsAt(new Date(item.startsAt).toISOString().split('T')[0]);
 setEndsAt(new Date(item.endsAt).toISOString().split('T')[0]);
 setPriority(item.priority || 0);
 setIsActive(item.isActive);
 } else {
 setEditingItem(null);
 setTitle('');
 setSubtitle('');
 setBannerUrl('');
 setStartsAt('');
 setEndsAt('');
 setPriority(0);
 setIsActive(true);
 }
 setIsEditing(true);
 };

 const handleSave = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 const payload = {
 title,
 subtitle,
 bannerUrl,
 startsAt: new Date(startsAt).toISOString(),
 endsAt: new Date(endsAt).toISOString(),
 priority,
 isActive
 };
 
 if (editingItem) {
 await apiClient.put(`/curation/campaigns/${editingItem.id}`, payload);
 toast.success('Campaign updated');
 } else {
 await apiClient.post('/curation/campaigns', payload);
 toast.success('Campaign created');
 }
 setIsEditing(false);
 fetchCampaigns();
 } catch (err) {
 toast.error('Failed to save campaign');
 }
 };

 const handleDelete = async (id: string) => {
 if (!(await confirm({ title: "Confirm Action", message: 'Are you sure?' }))) return;
 try {
 await apiClient.delete(`/curation/campaigns/${id}`);
 fetchCampaigns();
 toast.success('Campaign deleted');
 } catch (err) {
 toast.error('Failed to delete campaign');
 }
 };

 if (isEditing) {
 return (
 <div className="bg-sand-50 p-6 rounded-2xl border border-sand-200 ">
 <h3 className="text-xl font-bold text-navy-950 mb-6">{editingItem ? 'Edit Campaign' : 'New Campaign'}</h3>
 <form onSubmit={handleSave} className="space-y-4">
 <div>
 <label className="text-xs font-bold text-navy-950 uppercase">Title</label>
 <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
 </div>
 <div>
 <label className="text-xs font-bold text-navy-950 uppercase">Subtitle</label>
 <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
 </div>
 <div>
 <label className="text-xs font-bold text-navy-950 uppercase">Banner URL</label>
 <input type="url" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-bold text-navy-950 uppercase">Start Date</label>
 <input required type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
 </div>
 <div>
 <label className="text-xs font-bold text-navy-950 uppercase">End Date</label>
 <input required type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
 </div>
 </div>
 <div className="flex gap-4">
 <div className="flex-1">
 <label className="text-xs font-bold text-navy-950 uppercase">Priority (Higher is first)</label>
 <input type="number" value={priority} onChange={e => setPriority(parseInt(e.target.value))} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
 </div>
 <div className="flex items-center gap-2 mt-6">
 <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-5 h-5" />
 <label className="font-bold">Active</label>
 </div>
 </div>
 <div className="flex gap-4 pt-4">
 <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
 <Button type="submit" className="bg-navy-950 text-white">Save Campaign</Button>
 </div>
 </form>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <div className="flex justify-end">
 <Button onClick={() => handleOpenEditor()} className="bg-navy-950 text-white gap-2">
 <Plus className="w-4 h-4" /> Create Campaign
 </Button>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {campaigns.map(camp => (
 <div key={camp.id} className="bg-white rounded-2xl border border-sand-200 overflow-hidden flex flex-col">
 {camp.bannerUrl && (
 <div className="h-32 bg-sand-200 ">
 <img src={camp.bannerUrl} alt={camp.title} className="w-full h-full object-cover" />
 </div>
 )}
 <div className="p-5 flex-1">
 <div className="flex justify-between items-start mb-2">
 <h4 className="font-bold text-navy-950 ">{camp.title}</h4>
 <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${camp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
 {camp.isActive ? 'Active' : 'Inactive'}
 </span>
 </div>
 <p className="text-sm text-navy-950 mb-4">{camp.subtitle}</p>
 <div className="flex items-center gap-2 text-xs font-bold text-navy-950 uppercase mb-4">
 <Calendar className="w-3 h-3" />
 {new Date(camp.startsAt).toLocaleDateString()} - {new Date(camp.endsAt).toLocaleDateString()}
 </div>
 <div className="flex gap-2">
 <Button variant="outline" onClick={() => handleOpenEditor(camp)} className="flex-1 text-xs h-10">Edit</Button>
 <Button variant="outline" onClick={() => handleDelete(camp.id)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-10 px-3">
 <Trash2 className="w-4 h-4" />
 </Button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
};

export default SeasonalCampaignsModule;
