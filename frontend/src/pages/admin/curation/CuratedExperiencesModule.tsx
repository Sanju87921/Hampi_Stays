import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Map, Star, Clock, IndianRupee, MapPin } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';

const CuratedExperiencesModule = () => {
 const [experiences, setExperiences] = useState<any[]>([]);
 const [isEditing, setIsEditing] = useState(false);
 const [editingItem, setEditingItem] = useState<any>(null);

 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [imageUrl, setImageUrl] = useState('');
 const [price, setPrice] = useState(0);
 const [duration, setDuration] = useState('');
 const [location, setLocation] = useState('');
 const [isFeatured, setIsFeatured] = useState(false);
 const [isActive, setIsActive] = useState(true);

 useEffect(() => {
 fetchExperiences();
 }, []);

 const fetchExperiences = async () => {
 try {
 const data = await apiClient.get<any[]>('/curation/experiences');
 setExperiences(data || []);
 } catch (err) {
 toast.error('Failed to load experiences');
 }
 };

 const handleOpenEditor = (item: any = null) => {
 if (item) {
 setEditingItem(item);
 setTitle(item.title);
 setDescription(item.description);
 setImageUrl(item.imageUrl || '');
 setPrice(item.price);
 setDuration(item.duration);
 setLocation(item.location);
 setIsFeatured(item.isFeatured);
 setIsActive(item.isActive);
 } else {
 setEditingItem(null);
 setTitle('');
 setDescription('');
 setImageUrl('');
 setPrice(0);
 setDuration('');
 setLocation('');
 setIsFeatured(false);
 setIsActive(true);
 }
 setIsEditing(true);
 };

 const handleSave = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 const payload = {
 title,
 description,
 imageUrl,
 price,
 duration,
 location,
 isFeatured,
 isActive
 };
 
 if (editingItem) {
 await apiClient.put(`/curation/experiences/${editingItem.id}`, payload);
 toast.success('Experience updated');
 } else {
 await apiClient.post('/curation/experiences', payload);
 toast.success('Experience created');
 }
 setIsEditing(false);
 fetchExperiences();
 } catch (err) {
 toast.error('Failed to save experience');
 }
 };

 const handleDelete = async (id: string) => {
 if (!window.confirm('Are you sure?')) return;
 try {
 await apiClient.delete(`/curation/experiences/${id}`);
 fetchExperiences();
 toast.success('Experience deleted');
 } catch (err) {
 toast.error('Failed to delete experience');
 }
 };

 if (isEditing) {
 return (
 <div className="bg-sand-50 p-6 rounded-2xl border border-sand-200 ">
 <h3 className="text-xl font-bold text-navy-950 mb-6">{editingItem ? 'Edit Experience' : 'New Curated Experience'}</h3>
 <form onSubmit={handleSave} className="space-y-4">
 <div>
 <label className="text-xs font-bold text-navy-950 uppercase">Experience Title</label>
 <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
 </div>
 <div>
 <label className="text-xs font-bold text-navy-950 uppercase">Description</label>
 <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full h-24 bg-white border border-sand-200 rounded-xl px-4 py-3 resize-none" />
 </div>
 <div>
 <label className="text-xs font-bold text-navy-950 uppercase">Image URL</label>
 <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div>
 <label className="text-xs font-bold text-navy-950 uppercase">Price (₹)</label>
 <input required type="number" value={price} onChange={e => setPrice(parseFloat(e.target.value))} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
 </div>
 <div>
 <label className="text-xs font-bold text-navy-950 uppercase">Duration (e.g., 2 Hours)</label>
 <input required type="text" value={duration} onChange={e => setDuration(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
 </div>
 <div>
 <label className="text-xs font-bold text-navy-950 uppercase">Location</label>
 <input required type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4" />
 </div>
 </div>
 <div className="flex items-center gap-6 mt-6">
 <div className="flex items-center gap-2">
 <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="w-5 h-5" />
 <label className="font-bold text-navy-950 ">Featured Collection</label>
 </div>
 <div className="flex items-center gap-2">
 <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-5 h-5" />
 <label className="font-bold text-navy-950 ">Active & Bookable</label>
 </div>
 </div>
 <div className="flex gap-4 pt-4">
 <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
 <Button type="submit" className="bg-navy-950 text-white">Save Experience</Button>
 </div>
 </form>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <div>
 <h3 className="font-bold text-navy-950 text-lg">Hampi Experiences</h3>
 <p className="text-sm text-navy-950 ">Manage heritage walks, coracle rides, and tours.</p>
 </div>
 <Button onClick={() => handleOpenEditor()} className="bg-navy-950 text-white gap-2">
 <Plus className="w-4 h-4" /> Create Experience
 </Button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {experiences.map(exp => (
 <div key={exp.id} className="bg-white rounded-2xl border border-sand-200 overflow-hidden flex flex-col group">
 <div className="h-48 bg-sand-200 relative">
 {exp.imageUrl ? (
 <img src={exp.imageUrl} alt={exp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-navy-950 ">
 <Map className="w-12 h-12" />
 </div>
 )}
 {exp.isFeatured && (
 <div className="absolute top-3 left-3 bg-gold-400 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
 <Star className="w-3 h-3 fill-white" /> Featured
 </div>
 )}
 </div>
 <div className="p-5 flex-1 flex flex-col">
 <h4 className="font-bold text-navy-950 text-xl mb-2">{exp.title}</h4>
 <p className="text-sm text-navy-950 mb-4 line-clamp-2">{exp.description}</p>
 
 <div className="grid grid-cols-2 gap-3 mb-6 bg-sand-50 p-3 rounded-xl">
 <div className="flex items-center gap-2 text-xs font-semibold text-navy-950 ">
 <Clock className="w-4 h-4 text-gold-600" /> {exp.duration}
 </div>
 <div className="flex items-center gap-2 text-xs font-semibold text-navy-950 ">
 <IndianRupee className="w-4 h-4 text-emerald-600" /> {exp.price} / person
 </div>
 <div className="flex items-center gap-2 text-xs font-semibold text-navy-950 col-span-2">
 <MapPin className="w-4 h-4 text-navy-400" /> {exp.location}
 </div>
 </div>

 <div className="mt-auto flex gap-2">
 <Button variant="outline" onClick={() => handleOpenEditor(exp)} className="flex-1 text-xs h-10">Edit</Button>
 <Button variant="outline" onClick={() => handleDelete(exp.id)} className="border-red-200 text-red-600 hover:bg-red-50 h-10 px-3">
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

export default CuratedExperiencesModule;
