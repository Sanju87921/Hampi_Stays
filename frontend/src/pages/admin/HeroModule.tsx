import { useModal } from "../../components/shared/ModalProvider";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Pencil, Check, X, Monitor, ChevronUp, ChevronDown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient as api } from '../../utils/apiClient';

export interface HomepageHero {
 id: string;
 title: string;
 subtitle?: string;
 imageUrl: string;
 mobileImageUrl?: string;
 ctaText?: string;
 ctaLink?: string;
 isActive: boolean;
 sortOrder: number;
 startsAt?: string;
 endsAt?: string;
}

const HeroModule = () => {
 const { confirm } = useModal();
 const [slides, setSlides] = useState<HomepageHero[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [rotationSpeed, setRotationSpeed] = useState(3);
 const [previewIdx, setPreviewIdx] = useState(0);
 const [previewPlaying, setPreviewPlaying] = useState(false);
 const [editingId, setEditingId] = useState<string | null>(null);
 const [editForm, setEditForm] = useState<Partial<HomepageHero>>({});
 
 // File upload state
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [isUploading, setIsUploading] = useState(false);

 const fetchSlides = async () => {
 setLoadError(null);
 try {
 const data = await api.get<HomepageHero[]>('/hero-slides?all=true');
 // API returns array always — even empty
 if (Array.isArray(data)) {
 setSlides(data);
 console.log('[HeroModule] Loaded', data.length, 'slides');
 } else {
 console.warn('[HeroModule] Unexpected API response:', data);
 setSlides([]);
 }
 } catch (err: any) {
 console.error('[HeroModule] fetchSlides error:', err?.message, err?.status);
 // Only show error state for actual network/server failures (not empty db)
 if (err?.status >= 500) {
 setLoadError('Backend error. The hero slides table may not be set up yet. Contact support or run: prisma db push');
 } else if (err?.status === 404) {
 setLoadError('Hero slides endpoint not found. Check worker deployment.');
 } else {
 setLoadError(err?.message || 'Failed to connect to the API.');
 }
 setSlides([]);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchSlides();
 const config = localStorage.getItem('hampi_hero_config');
 if (config) {
 try {
 setRotationSpeed(JSON.parse(config).rotationSpeed || 3);
 } catch (e) {}
 }
 }, []);

 const activeSlides = slides.filter(s => s.isActive);

 useEffect(() => {
 if (!previewPlaying || activeSlides.length === 0) return;
 const t = setInterval(() => setPreviewIdx(i => (i + 1) % activeSlides.length), rotationSpeed * 1000);
 return () => clearInterval(t);
 }, [previewPlaying, activeSlides.length, rotationSpeed]);

 const toggle = async (slide: HomepageHero) => {
 if (slide.isActive && activeSlides.length <= 2) { 
 toast.error('Minimum 2 slides required'); 
 return; 
 }
 const updated = { ...slide, isActive: !slide.isActive };
 setSlides(slides.map(x => x.id === slide.id ? updated : x));
 try {
 await api.put(`/hero-slides/${slide.id}`, { isActive: !slide.isActive });
 toast.success(slide.isActive ? 'Slide deactivated' : 'Slide activated');
 } catch (err) {
 toast.error('Failed to update slide status');
 fetchSlides(); // revert
 }
 };

 const move = async (idx: number, dir: -1 | 1) => {
 const t = idx + dir;
 if (t < 0 || t >= slides.length) return;
 const n = [...slides]; 
 [n[idx], n[t]] = [n[t], n[idx]];
 
 // Update local sort orders
 n.forEach((s, i) => s.sortOrder = i);
 setSlides(n);

 try {
 await api.post('/hero-slides/reorder', { ids: n.map(s => s.id) });
 } catch (err) {
 toast.error('Failed to reorder slides');
 fetchSlides();
 }
 };

 const startEdit = (s: HomepageHero) => { 
 setEditingId(s.id); 
 setEditForm({ title: s.title, subtitle: s.subtitle || '' }); 
 };

 const saveEdit = async (id: string) => {
 if (!editForm.title?.trim()) {
 toast.error('Title is required');
 return;
 }
 
 const updated = { ...editForm, title: editForm.title.trim() };
 setSlides(slides.map(x => x.id === id ? { ...x, ...updated } : x));
 setEditingId(null);
 
 try {
 await api.put(`/hero-slides/${id}`, updated);
 toast.success('Slide updated');
 } catch (err) {
 toast.error('Failed to update slide');
 fetchSlides();
 }
 };

 const deleteSlide = async (id: string) => {
 if (!(await confirm({ title: "Delete Slide", message: 'Are you sure you want to delete this slide?', confirmText: 'Delete', cancelText: 'Cancel' }))) return;
 
 if (slides.find(s => s.id === id)?.isActive && activeSlides.length <= 2) {
 toast.error('Cannot delete slide. Minimum 2 active slides required.');
 return;
 }

 setSlides(slides.filter(x => x.id !== id));
 try {
 await api.delete(`/hero-slides/${id}`);
 toast.success('Slide deleted');
 } catch (err) {
 toast.error('Failed to delete slide');
 fetchSlides();
 }
 };

 const handleSaveConfig = () => {
 localStorage.setItem('hampi_hero_config', JSON.stringify({ rotationSpeed }));
 toast.success('Hero configuration saved');
 };

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (!file.type.startsWith('image/')) {
 toast.error('Please upload an image file');
 return;
 }

 setIsUploading(true);
 const toastId = toast.loading('Uploading image...');

 try {
 // Get signature
 const { signature, timestamp, cloud_name, api_key, folder, eager } = await api.get('/upload/signature?type=resort');
 
 // Upload to Cloudinary
 const formData = new FormData();
 formData.append('file', file);
 formData.append('api_key', api_key);
 formData.append('timestamp', timestamp.toString());
 formData.append('signature', signature);
 formData.append('folder', folder);
 if (eager) formData.append('eager', eager);

 const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
 method: 'POST',
 body: formData,
 });

 const data = await response.json();
 
 if (!response.ok) throw new Error(data.error?.message || 'Upload failed');

 const imageUrl = data.secure_url;
 
 // Create new slide
 const newSlideData = {
 title: 'New Hero Slide',
 imageUrl,
 isActive: false,
 sortOrder: slides.length
 };

 const newSlide = await api.post('/hero-slides', newSlideData);
 setSlides([...slides, newSlide]);
 
 toast.success('Slide created successfully', { id: toastId });
 startEdit(newSlide);
 
 } catch (error: any) {
 toast.error(error.message || 'Failed to upload image', { id: toastId });
 } finally {
 setIsUploading(false);
 if (fileInputRef.current) fileInputRef.current.value = '';
 }
 };

 if (isLoading) {
 return (
 <div className="py-16 flex flex-col items-center justify-center gap-4">
 <div className="w-10 h-10 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
 <p className="text-sm text-navy-950 font-medium">Loading hero slides...</p>
 </div>
 );
 }

 // API/backend error state — show informative admin message
 if (loadError) {
 return (
 <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto gap-6">
 <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
 <span className="text-2xl">⚠️</span>
 </div>
 <div>
 <h3 className="font-bold text-navy-950 text-lg mb-2">Hero Slides Unavailable</h3>
 <p className="text-sm text-navy-950 leading-relaxed">{loadError}</p>
 </div>
 <div className="flex gap-3">
 <button
 onClick={() => { setIsLoading(true); fetchSlides(); }}
 className="bg-navy-950 hover:bg-gold-600 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-lg"
 >
 Retry
 </button>
 </div>
 <div className="text-[10px] text-navy-950 font-mono bg-sand-50 px-3 py-2 rounded-xl border border-sand-200 text-left max-w-full break-all">
 {loadError}
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-8">
 {/* Live Preview */}
 <div className="rounded-2xl overflow-hidden border border-sand-200 bg-navy-950 relative h-[260px] md:h-[320px]">
 <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
 <Monitor className="w-4 h-4 text-gold-400" />
 <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Live Preview</span>
 </div>
 <div className="absolute top-4 right-4 z-20 flex gap-2">
 <button onClick={() => { setPreviewPlaying(!previewPlaying); if (!previewPlaying) setPreviewIdx(0); }}
 title={previewPlaying ? "Pause preview" : "Play preview"}
 className="bg-white/20 backdrop-blur-md border border-white/20 text-white p-2 rounded-xl hover:bg-white/30 transition-colors">
 {previewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
 </button>
 </div>
 {activeSlides.length > 0 ? (
 <AnimatePresence mode="wait">
 <motion.div key={previewIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0">
 <img src={activeSlides[previewIdx % activeSlides.length]?.imageUrl} alt="" className="w-full h-full object-cover opacity-80" />
 <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/20 to-navy-950/40" />
 <div className="absolute bottom-6 left-6 z-10">
 <p className="text-[10px] font-bold text-gold-400 uppercase tracking-widest mb-1">{activeSlides[previewIdx % activeSlides.length]?.subtitle || 'Discover'}</p>
 <p className="text-white font-serif italic text-lg">{activeSlides[previewIdx % activeSlides.length]?.title}</p>
 </div>
 </motion.div>
 </AnimatePresence>
 ) : (
 <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">No active slides</div>
 )}
 
 {/* Dots */}
 {activeSlides.length > 0 && (
 <div className="absolute bottom-6 right-6 z-10 flex gap-1.5">
 {activeSlides.map((_, i) => (
 <button key={i} onClick={() => { setPreviewIdx(i); setPreviewPlaying(false); }}
 className={`w-2 h-2 rounded-full transition-all ${i === previewIdx % activeSlides.length ? 'bg-gold-400 w-6' : 'bg-white '}`} />
 ))}
 </div>
 )}
 </div>

 {/* Rotation Speed */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-sand-50 rounded-2xl p-5 border border-sand-200 ">
 <div>
 <p className="text-sm font-bold text-navy-950 ">Rotation Speed</p>
 <p className="text-xs text-navy-950 ">Time each slide is displayed before transitioning</p>
 </div>
 <div className="flex items-center gap-3">
 {[2, 3, 4, 5, 7].map(s => (
 <button key={s} onClick={() => setRotationSpeed(s)}
 className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${rotationSpeed === s ? 'bg-navy-950 text-white shadow-md' : 'bg-white text-navy-950 border border-sand-200 hover:bg-sand-100 :bg-sand-200'}`}>
 {s}s
 </button>
 ))}
 </div>
 </div>

 {/* Slide Manager */}
 <div>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
 <p className="text-sm font-bold text-navy-950 ">{slides.length} Slides · {activeSlides.length} Active</p>
 <div className="flex items-center gap-3">
 <input 
 type="file" 
 ref={fileInputRef} 
 onChange={handleFileUpload} 
 accept="image/*" 
 className="hidden" 
 />
 <button 
 onClick={() => fileInputRef.current?.click()} 
 disabled={isUploading}
 className="bg-white hover:bg-sand-50 :bg-sand-100 text-navy-950 border border-sand-200 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
 >
 {isUploading ? <div className="w-3.5 h-3.5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
 Add Slide
 </button>
 <button onClick={handleSaveConfig} className="bg-navy-950 hover:bg-gold-600 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-lg">
 Save Config
 </button>
 </div>
 </div>
 
 <div className="space-y-3">
 {slides.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 text-center bg-sand-50 rounded-2xl border-2 border-dashed border-sand-200 gap-6">
 <div className="w-20 h-20 rounded-full bg-white shadow-lg border border-sand-200 flex items-center justify-center">
 <Monitor className="w-8 h-8 text-navy-950 " />
 </div>
 <div>
 <h3 className="font-bold text-navy-950 text-lg mb-2">No Hero Slides Yet</h3>
 <p className="text-sm text-navy-950 max-w-xs mx-auto leading-relaxed">
 Your homepage carousel is empty. Upload a stunning image of Hampi to create your first hero slide.
 </p>
 </div>
 <button
 onClick={() => fileInputRef.current?.click()}
 disabled={isUploading}
 className="bg-navy-950 hover:bg-gold-600 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50"
 >
 <Plus className="w-4 h-4" />
 Upload First Slide
 </button>
 </div>
 ) : (
 slides.map((slide, idx) => (
 <motion.div key={slide.id} layout className={`flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-2xl border transition-all ${slide.isActive ? 'bg-white border-sand-200 ' : 'bg-sand-50 border-sand-100 opacity-70'}`}>
 {/* Thumbnail */}
 <div className="w-full sm:w-32 h-32 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-sand-200 relative">
 <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
 <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-navy-950/70 backdrop-blur text-gold-400 text-[8px] font-bold rounded-md">#{idx + 1}</div>
 {!slide.isActive && (
 <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-red-500/90 text-white text-[8px] font-bold rounded-md uppercase tracking-wider">Draft</div>
 )}
 </div>
 
 {/* Label */}
 <div className="flex-1 min-w-0 py-1">
 {editingId === slide.id ? (
 <div className="space-y-2">
 <input 
 value={editForm.title || ''} 
 onChange={e => setEditForm({...editForm, title: e.target.value})} 
 placeholder="Slide Title"
 className="w-full text-sm font-medium text-navy-950 bg-sand-50 border border-sand-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400" 
 autoFocus 
 />
 <div className="flex items-center gap-2">
 <input 
 value={editForm.subtitle || ''} 
 onChange={e => setEditForm({...editForm, subtitle: e.target.value})} 
 placeholder="Subtitle (e.g. Discover)"
 className="flex-1 text-xs text-navy-950 bg-sand-50 border border-sand-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400" 
 />
 <button onClick={() => saveEdit(slide.id)} className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"><Check className="w-4 h-4" /></button>
 <button onClick={() => setEditingId(null)} className="p-1.5 bg-sand-200 hover:bg-sand-300 text-navy-950 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
 </div>
 </div>
 ) : (
 <div>
 <div className="flex items-start justify-between gap-2">
 <div>
 <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest mb-0.5">{slide.subtitle || 'Discover'}</p>
 <p className="text-sm font-semibold text-navy-950 truncate">{slide.title}</p>
 </div>
 <button onClick={() => startEdit(slide)} className="p-1.5 text-navy-950 hover:text-gold-600 bg-sand-50 hover:bg-sand-100 :bg-sand-200 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
 </div>
 <p className="text-[10px] text-navy-950 mt-2 truncate font-mono bg-sand-50 px-1.5 py-0.5 rounded inline-block max-w-full">{slide.imageUrl}</p>
 </div>
 )}
 </div>
 
 {/* Controls */}
 <div className="flex items-center gap-1.5 shrink-0 sm:flex-col pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-sand-100 sm:pl-3">
 <div className="flex gap-1 bg-sand-50 p-1 rounded-xl">
 <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"><ChevronUp className="w-4 h-4 text-navy-950 " /></button>
 <button onClick={() => move(idx, 1)} disabled={idx === slides.length - 1} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"><ChevronDown className="w-4 h-4 text-navy-950 " /></button>
 </div>
 <div className="flex gap-1">
 <button onClick={() => toggle(slide)}
 disabled={slide.isActive && activeSlides.length <= 2}
 title={slide.isActive && activeSlides.length <= 2 ? "Minimum 2 active slides required" : slide.isActive ? "Deactivate (Set as Draft)" : "Activate (Publish)"}
 className={`p-2 rounded-xl transition-all shadow-sm ${slide.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-white border border-sand-200 text-navy-950 hover:bg-sand-50 :bg-sand-100'} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-50`}>
 {slide.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
 </button>
 <button onClick={() => deleteSlide(slide.id)} 
 disabled={slide.isActive && activeSlides.length <= 2}
 title={slide.isActive && activeSlides.length <= 2 ? "Minimum 2 active slides required" : "Delete Slide"} 
 className="p-2 bg-white border border-sand-200 text-red-500/70 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-red-500/70">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 </motion.div>
 ))
 )}
 </div>
 </div>
 </div>
 );
};

export default HeroModule;
