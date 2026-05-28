import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wifi, Coffee, Utensils, Waves, 
  Shield, CheckCircle2, ArrowRight, ArrowLeft,
  Clock, Plus, Trash2, Info, Camera, FileText, UploadCloud, X, IndianRupee
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import { apiClient } from "../../utils/apiClient";
import { toast } from "react-hot-toast";
import imageCompression from "browser-image-compression";

export function ResortSetupPage() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPublishing, setIsPublishing] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState("");

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("hampi-resort-setup-draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          // Normalize categories to always be a clean array of strings
          if (!Array.isArray(parsed.categories)) {
            if (typeof parsed.categories === "string" && parsed.categories) {
              parsed.categories = [parsed.categories];
            } else if (parsed.category && typeof parsed.category === "string") {
              parsed.categories = [parsed.category];
            } else {
              parsed.categories = ["Heritage"];
            }
          }
          // Filter out any single-character garbage that could have been saved from previous string-spread bugs
          parsed.categories = parsed.categories.filter((cat: any) => typeof cat === 'string' && cat.length > 1);
          if (parsed.categories.length === 0) {
            parsed.categories = ["Heritage"];
          }
          if (parsed.category) {
            delete parsed.category;
          }
          return parsed;
        }
      } catch (e) {
        // Fallback below
      }
    }
    return {
      name: "",
      tagline: "",
      description: "",
      area: "",
      price: "",
      type: "luxury",
      categories: ["Heritage"],
      amenities: [] as string[],
      customAmenities: [] as { id: string, name: string, type: 'CUSTOM', icon?: string, description?: string }[],
      houseRules: [] as string[],
      mealPackages: [] as { name: string, price: number, description: string }[],
      roomTypes: [] as { name: string, description: string, pricePerNight: number, capacity: number, availableCount: number }[],
      images: [] as string[],
      documents: [] as { type: string, url: string }[],
      checkInTime: "1:00 PM",
      checkOutTime: "11:00 AM"
    };
  });

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem("hampi-resort-setup-draft", JSON.stringify(formData));
  }, [formData]);

  const [showCustomAmenityModal, setShowCustomAmenityModal] = useState(false);
  const [editingAmenityId, setEditingAmenityId] = useState<string | null>(null);
  const [amenityForm, setAmenityForm] = useState({ name: "", icon: "", description: "" });

  const amenitiesList = [
    { id: "Wifi", icon: Wifi },
    { id: "Pool", icon: Waves },
    { id: "Restaurant", icon: Utensils },
    { id: "Spa", icon: Shield },
    { id: "Gym", icon: CheckCircle2 },
    { id: "Cafe", icon: Coffee },
    { id: "Parking", icon: CheckCircle2 },
    { id: "AC", icon: CheckCircle2 },
    { id: "Room Service", icon: Coffee },
    { id: "Bar", icon: Utensils },
    { id: "Bonfire", icon: Shield },
    { id: "Pet Friendly", icon: CheckCircle2 },
  ];

  const categories = ["Heritage", "Nature", "Riverside", "Temple View", "Boutique"];

  const handleSaveCustomAmenity = () => {
    if (!amenityForm.name.trim()) {
      toast.error("Amenity name is required");
      return;
    }
    if (amenityForm.name.length > 30) {
      toast.error("Amenity name is too long");
      return;
    }
    const currentCustom = formData.customAmenities || [];
    if (editingAmenityId) {
      setFormData(prev => ({
        ...prev,
        customAmenities: (prev.customAmenities || []).map(a => 
          a.id === editingAmenityId ? { ...a, name: amenityForm.name, icon: amenityForm.icon, description: amenityForm.description } : a
        )
      }));
    } else {
      if (currentCustom.length >= 30) {
        toast.error("Maximum 30 custom amenities allowed");
        return;
      }
      if (currentCustom.some(a => a.name.toLowerCase() === amenityForm.name.toLowerCase())) {
        toast.error("Amenity already exists");
        return;
      }
      const newId = `custom_${Date.now()}`;
      setFormData(prev => ({
        ...prev,
        customAmenities: [...(prev.customAmenities || []), { id: newId, name: amenityForm.name, type: 'CUSTOM', icon: amenityForm.icon, description: amenityForm.description }],
        amenities: [...prev.amenities, newId]
      }));
    }
    setShowCustomAmenityModal(false);
    setAmenityForm({ name: "", icon: "", description: "" });
    setEditingAmenityId(null);
  };


  const handleAddCustomCategory = () => {
    const trimmed = customCategoryText.trim();
    if (!trimmed) return;

    // Capitalize first letter of each word to preserve capitalization nicely
    const formatted = trimmed
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    if (formatted.length > 30) {
      toast.error("Category name should be 30 characters or less");
      return;
    }

    const currentCats = Array.isArray(formData.categories) ? formData.categories : [];
    if (currentCats.some(c => typeof c === 'string' && c.toLowerCase() === formatted.toLowerCase())) {
      toast.error("This category already exists");
      return;
    }

    setFormData(prev => ({
      ...prev,
      categories: [...(Array.isArray(prev.categories) ? prev.categories : []), formatted]
    }));
    setCustomCategoryText("");
  };

  const handleToggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id) 
        ? prev.amenities.filter(a => a !== id)
        : [...prev.amenities, id]
    }));
  };

  const addRoomType = () => {
    setFormData(p => ({
      ...p,
      roomTypes: [...p.roomTypes, { name: "", description: "", pricePerNight: 0, capacity: 2, availableCount: 5 }]
    }));
  };

  const removeRoomType = (idx: number) => {
    setFormData(p => ({ ...p, roomTypes: p.roomTypes.filter((_, i) => i !== idx) }));
  };

  const updateRoomType = (idx: number, field: string, value: string | number) => {
    const updated = [...formData.roomTypes];
    updated[idx] = { ...updated[idx], [field]: value } as any;
    setFormData(p => ({ ...p, roomTypes: updated }));
  };

  const addMealPackage = () => {
    setFormData(prev => ({
      ...prev,
      mealPackages: [...prev.mealPackages, { name: "", price: 0, description: "" }]
    }));
  };

  const removeMealPackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mealPackages: prev.mealPackages.filter((_, i) => i !== index)
    }));
  };

  const updateMealPackage = (index: number, field: string, value: string | number) => {
    const updated = [...formData.mealPackages];
    updated[index] = { ...updated[index], [field]: value } as any;
    setFormData(prev => ({ ...prev, mealPackages: updated }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name.trim() !== "" && 
               formData.tagline.trim() !== "" && 
               formData.description.trim() !== "";
      case 2:
        return formData.area.trim() !== "" && 
               formData.price !== "" && Number(formData.price) > 0;
      case 3:
        return formData.amenities.length > 0;
      case 4:
        return formData.houseRules.length > 0 && 
               formData.checkInTime.trim() !== "" && 
               formData.checkOutTime.trim() !== "";
      case 5:
        return formData.roomTypes.length > 0 && 
               formData.roomTypes.every(r => 
                 r.name.trim() !== "" && 
                 r.description.trim() !== "" && 
                 r.pricePerNight > 0 && 
                 r.capacity > 0 && 
                 r.availableCount > 0
               );
      case 6:
        return formData.mealPackages.length > 0 && 
               formData.mealPackages.every(p => 
                 p.name.trim() !== "" && 
                 p.price > 0 && 
                 p.description.trim() !== ""
               );
      case 7: {
        const hasAllDocs = ["id_proof", "gst_cert", "property_tax"].every(type => 
          formData.documents.some(d => d.type === type)
        );
        return formData.images.length >= 3 && hasAllDocs;
      }
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      let msg = "Please fill all required fields in this section.";
      if (step === 5 && formData.roomTypes.length === 0) msg = "Please add at least one room type.";
      if (step === 7) {
        if (formData.images.length < 3) msg = "Please upload at least 3 resort photos.";
        else msg = "Please upload all three mandatory documents (ID, GST, and Property Tax).";
      }
      toast.error(msg);
    }
  };
  const handleBack = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handlePublish = async () => {
    if (!user) {
      toast.error("Please login to submit a property");
      return;
    }
    if (!isStepValid()) {
      toast.error("Verification pending: Please ensure 3+ photos and all 3 documents are uploaded.");
      return;
    }

    // Payload size check removed for testing mode
    const payload = { ...formData, ownerId: user?.id };

    setIsPublishing(true);
    const toastId = toast.loading("Launching your sanctuary in Hampi...");
    
    try {
      await apiClient.post('/resorts', payload);
      localStorage.removeItem("hampi-resort-setup-draft");
      toast.success("HampiStays Sanctuary Launched Successfully!", { id: toastId });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Publish error:", error);
      toast.error(error.message || "Failed to publish resort", { id: toastId });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 pt-24 pb-24">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Step Indicator */}
        <div className="mb-12">
          <div className="flex justify-between items-center px-4">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2 relative">
                <div className={cn("w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all relative z-10",
                  step >= s ? "bg-gold-500 text-navy-950 shadow-gold" : "bg-sand-200 text-navy-800/40")}>
                  {step > s ? <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7" /> : s}
                </div>
                {s < 7 && (
                  <div className={cn("absolute top-4 md:top-6 left-10 md:left-14 w-[calc(100vw/8)] h-0.5 z-0 hidden lg:block",
                    step > s ? "bg-gold-500" : "bg-sand-200")} />
                )}
                <span className={cn("text-[7px] md:text-[9px] uppercase tracking-widest font-bold hidden md:block",
                  step >= s ? "text-navy-950" : "text-navy-800/40")}>
                  {s === 1 ? "Identity" : s === 2 ? "Location" : s === 3 ? "Amenities" : s === 4 ? "Policies" : s === 5 ? "Rooms" : s === 6 ? "Dining" : "Launch"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 shadow-luxury border border-sand-100 min-h-[600px] flex flex-col">
            
            <div className="flex-grow">
              {step === 1 && (
                <div className="space-y-8 max-w-2xl">
                  <div>
                    <h2 className="text-4xl font-serif font-bold text-navy-950 mb-3">Resort Identity</h2>
                    <p className="text-navy-950/60 text-lg">Define the soul of your Hampi sanctuary.</p>
                  </div>
                  <div className="space-y-6">
                    <Input label="Resort Name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} placeholder="e.g. The Kishkindha Heritage" />
                    <Input label="Tagline" value={formData.tagline} onChange={e => setFormData(p => ({...p, tagline: e.target.value}))} placeholder="e.g. Luxury in the lap of ruins" />
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-navy-800/40 uppercase tracking-widest ml-1">Narrative Description</label>
                      <textarea rows={5} className="w-full bg-sand-50 border border-sand-200 rounded-3xl p-6 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all resize-none text-navy-950"
                        placeholder="Share the history and experience of your property..." value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-navy-800/40 uppercase tracking-widest ml-1">Resort Categories (Select one or more)</label>
                      <div className="flex flex-wrap gap-3">
                        {categories.map(c => {
                          const isSelected = (Array.isArray(formData.categories) ? formData.categories : []).includes(c);
                          return (
                            <button 
                              key={c}
                              type="button"
                              onClick={() => {
                                setFormData(prev => {
                                  const current = Array.isArray(prev.categories) ? prev.categories : [];
                                  const updated = current.includes(c)
                                    ? current.filter(x => x !== c)
                                    : [...current, c];
                                  return {
                                    ...prev,
                                    categories: updated.length > 0 ? updated : [c]
                                  };
                                });
                              }}
                              className={cn("px-8 py-3 rounded-2xl border-2 font-bold transition-all hover:scale-[1.02]",
                                isSelected ? "border-gold-500 bg-gold-50 text-gold-700 shadow-sm" : "border-sand-100 text-navy-950/40 hover:border-gold-200")}
                            >
                              {c}
                            </button>
                          );
                        })}
                        {/* Custom categories */}
                        <AnimatePresence>
                          {(Array.isArray(formData.categories) ? formData.categories : [])
                            .filter(c => !categories.includes(c))
                            .map(c => (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                key={c}
                                className="px-8 py-3 rounded-2xl border-2 border-gold-500 bg-gold-50 text-gold-700 shadow-sm flex items-center gap-2 font-bold select-none"
                              >
                                <span>{c}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      categories: (Array.isArray(prev.categories) ? prev.categories : []).filter(x => x !== c)
                                    }));
                                  }}
                                  className="text-gold-500 hover:text-gold-800 transition-colors focus:outline-none ml-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </motion.div>
                            ))}
                        </AnimatePresence>
                      </div>

                      {/* Add Custom Category System */}
                      <div className="pt-2">
                        {!showCustomInput ? (
                          <button
                            type="button"
                            onClick={() => setShowCustomInput(true)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-600 hover:text-gold-700 transition-colors uppercase tracking-widest"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Custom Category</span>
                          </button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 max-w-sm mt-1"
                          >
                            <input
                              type="text"
                              value={customCategoryText}
                              onChange={e => setCustomCategoryText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddCustomCategory();
                                }
                              }}
                              placeholder="e.g. Yoga Sanctuary"
                              className="flex-grow bg-sand-50 border border-sand-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all text-navy-950 placeholder-navy-950/30"
                              maxLength={30}
                            />
                            <Button
                              type="button"
                              onClick={handleAddCustomCategory}
                              className="bg-navy-950 text-white hover:bg-gold-500 hover:text-navy-950 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 shadow-sm"
                            >
                              Add
                            </Button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomInput(false);
                                setCustomCategoryText("");
                              }}
                              className="text-navy-950/40 hover:text-navy-950 p-2 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10 max-w-2xl">
                  <div>
                    <h2 className="text-4xl font-serif font-bold text-navy-950 mb-3">Location & Base Pricing</h2>
                    <p className="text-navy-950/60 text-lg">Set the foundation for your presence in Hampi.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input label="Area / Neighborhood" value={formData.area} onChange={e => setFormData(p => ({...p, area: e.target.value}))} placeholder="e.g. Anegundi" />
                    <Input label="Starting Rate (₹ / Night)" type="number" value={formData.price} onChange={e => setFormData(p => ({...p, price: e.target.value}))} placeholder="e.g. 18000" />
                  </div>
                  <div className="p-8 bg-sand-50 rounded-[2.5rem] border border-sand-100 flex gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-sand-200">
                      <Info className="w-6 h-6 text-gold-600" />
                    </div>
                    <div>
                      <p className="font-bold text-navy-950 mb-1">Standard Hampi Coordinates</p>
                      <p className="text-sm text-navy-950/50 leading-relaxed italic">By default, your property will be pinned at the center of Hampi Heritage Site. You can refine the exact GPS coordinates in your dashboard after registration.</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-4xl font-serif font-bold text-navy-950 mb-3">Amenities & Services</h2>
                      <p className="text-navy-950/60 text-lg">What makes your property exceptional?</p>
                    </div>
                    <Button variant="outline" className="rounded-2xl gap-2 border-gold-200 text-gold-700" onClick={() => { setEditingAmenityId(null); setAmenityForm({ name: "", icon: "", description: "" }); setShowCustomAmenityModal(true); }}>
                      <Plus className="w-4 h-4" /> Add Custom Amenity
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {amenitiesList.map(item => (
                      <button key={item.id} onClick={() => handleToggleAmenity(item.id)}
                        className={cn("p-10 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all group",
                          formData.amenities.includes(item.id) ? "border-gold-500 bg-gold-50 text-gold-700 shadow-luxury" : "border-sand-100 text-navy-950/40 hover:border-gold-200")}>
                        <item.icon className={cn("w-10 h-10 transition-transform", formData.amenities.includes(item.id) ? "scale-110" : "group-hover:scale-110")} />
                        <span className="font-bold text-xs uppercase tracking-[0.2em] text-center">{item.id}</span>
                      </button>
                    ))}
                    {(formData.customAmenities || []).map(item => (
                      <div key={item.id} className="relative group cursor-pointer" onClick={() => handleToggleAmenity(item.id)}>
                        <div className={cn("h-full p-10 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all",
                          formData.amenities.includes(item.id) ? "border-gold-500 bg-gold-50 text-gold-700 shadow-luxury" : "border-sand-100 text-navy-950/40 group-hover:border-gold-200")}>
                          
                          <svg className={cn("w-10 h-10 transition-transform", formData.amenities.includes(item.id) ? "scale-110" : "group-hover:scale-110")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                          <span className="font-bold text-xs uppercase tracking-[0.2em] text-center">{item.name}</span>
                        </div>
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setEditingAmenityId(item.id); setAmenityForm({name: item.name, icon: item.icon || "", description: item.description || ""}); setShowCustomAmenityModal(true); }} className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-gold-600 hover:text-gold-700 border border-gold-200 hover:scale-110 transition-transform">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setFormData(p => ({...p, customAmenities: (p.customAmenities || []).filter(a => a.id !== item.id), amenities: p.amenities.filter(id => id !== item.id)})); }} className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-red-500 hover:text-red-600 border border-red-100 hover:scale-110 transition-transform">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-10">
                  <div>
                    <h2 className="text-4xl font-serif font-bold text-navy-950 mb-3">House Rules & Policies</h2>
                    <p className="text-navy-950/60 text-lg">Define the lifestyle within your resort walls.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6 p-8 bg-sand-50 rounded-[3rem] border border-sand-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-gold-600" />
                        <h4 className="font-bold text-navy-950 uppercase tracking-[0.2em] text-xs">Standard Timing</h4>
                      </div>
                      <Input label="Check-in Time" value={formData.checkInTime} onChange={e => setFormData(p => ({...p, checkInTime: e.target.value}))} placeholder="e.g. 1:00 PM" />
                      <Input label="Check-out Time" value={formData.checkOutTime} onChange={e => setFormData(p => ({...p, checkOutTime: e.target.value}))} placeholder="e.g. 11:00 AM" />
                    </div>
                    <div className="space-y-6">
                      <h4 className="font-bold text-navy-950 uppercase tracking-[0.2em] text-xs ml-2">Guest Expectations</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {["No smoking in rooms", "Pets strictly not allowed", "No outside food", "Silent hours after 10 PM", "Eco-friendly practices only"].map(rule => (
                          <button key={rule} onClick={() => {
                            setFormData(p => ({
                              ...p,
                              houseRules: p.houseRules.includes(rule) ? p.houseRules.filter(r => r !== rule) : [...p.houseRules, rule]
                            }));
                          }} className={cn("w-full p-5 rounded-2xl border text-sm font-bold transition-all text-left flex items-center justify-between",
                            formData.houseRules.includes(rule) ? "border-gold-500 bg-gold-500 text-white" : "bg-white border-sand-200 text-navy-950/40")}>
                            {rule}
                            {formData.houseRules.includes(rule) && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-4xl font-serif font-bold text-navy-950 mb-3">Room Inventory</h2>
                      <p className="text-navy-950/60 text-lg">Add the unique room types available in your resort.</p>
                    </div>
                    <Button variant="outline" className="rounded-2xl gap-2 border-gold-200 text-gold-700" onClick={addRoomType}>
                      <Plus className="w-4 h-4" /> Add Room Type
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {formData.roomTypes.map((room, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="p-8 bg-white rounded-[2.5rem] border-2 border-sand-100 relative group hover:border-gold-300 transition-all">
                        <button onClick={() => removeRoomType(idx)} className="absolute top-8 right-8 text-red-400 hover:text-red-600">
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="lg:col-span-2">
                            <Input label="Room Name" value={room.name} onChange={e => updateRoomType(idx, "name", e.target.value)} placeholder="e.g. Tungabhadra River Suite" />
                          </div>
                          <Input label="Max Guests" type="number" value={room.capacity} onChange={e => updateRoomType(idx, "capacity", parseInt(e.target.value))} />
                          <Input label="Total Rooms" type="number" value={room.availableCount} onChange={e => updateRoomType(idx, "availableCount", parseInt(e.target.value))} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                          <div className="md:col-span-2">
                            <Input label="Description" value={room.description} onChange={e => updateRoomType(idx, "description", e.target.value)} placeholder="Balcony with river view, King size bed..." />
                          </div>
                          <Input label="Price / Night (₹)" type="number" value={room.pricePerNight} onChange={e => updateRoomType(idx, "pricePerNight", parseFloat(e.target.value))} />
                        </div>
                      </motion.div>
                    ))}
                    {formData.roomTypes.length === 0 && (
                      <div className="text-center py-20 border-2 border-dashed border-sand-200 rounded-[3rem] text-navy-950/20 italic">
                        No room types added yet. Please add at least one to continue.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-4xl font-serif font-bold text-navy-950 mb-3">Meal Packages</h2>
                      <p className="text-navy-950/60 text-lg">Define dining experiences for your guests.</p>
                    </div>
                    <Button variant="outline" className="rounded-2xl gap-2 border-gold-200 text-gold-700" onClick={addMealPackage}>
                      <Plus className="w-4 h-4" /> Add Package
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formData.mealPackages.map((pkg, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="p-8 bg-sand-50 rounded-[2.5rem] border border-sand-100 relative">
                        <button onClick={() => removeMealPackage(idx)} className="absolute top-6 right-6 text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <Input label="Package Name" value={pkg.name} onChange={e => updateMealPackage(idx, "name", e.target.value)} placeholder="e.g. Royal Breakfast" />
                          <Input label="Price (₹)" type="number" value={pkg.price} onChange={e => updateMealPackage(idx, "price", parseFloat(e.target.value))} className="w-32" />
                        </div>
                        <Input label="Description" value={pkg.description} onChange={e => updateMealPackage(idx, "description", e.target.value)} placeholder="Buffet breakfast + evening tea..." />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {step === 7 && (
                <div className="space-y-12">
                  <div>
                    <h2 className="text-4xl font-serif font-bold text-navy-950 mb-3">Verification & Assets</h2>
                    <p className="text-navy-950/60 text-lg">Upload your property photos and business documents.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Photos */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-navy-950 uppercase tracking-widest text-xs">Resort Photos</h4>
                        <span className="text-xs text-navy-950/40">{formData.images.length} / 10 images</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {formData.images.map((img, i) => (
                          <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button onClick={() => setFormData(p => ({...p, images: p.images.filter((_, idx) => idx !== i)}))}
                              className="absolute inset-0 bg-red-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-6 h-6 text-white" />
                            </button>
                          </div>
                        ))}

                        {formData.images.length < 10 && (
                          <label className="aspect-square rounded-2xl border-2 border-dashed border-sand-200 flex flex-col items-center justify-center gap-2 text-navy-950/20 hover:border-gold-300 hover:text-gold-500 transition-all cursor-pointer">
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple 
                              className="hidden" 
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                
                                try {
                                  const base64Promises = files.map(file => {
                                    return new Promise<string>((resolve) => {
                                      const reader = new FileReader();
                                      reader.onloadend = () => resolve(reader.result as string);
                                      reader.readAsDataURL(file);
                                    });
                                  });
                                  const base64Images = await Promise.all(base64Promises);
                                  
                                  setFormData(p => ({
                                    ...p,
                                    images: [...p.images, ...base64Images].slice(0, 10)
                                  }));
                                  toast.success("Photos added!");
                                } catch (err) {
                                  toast.error("Upload failed");
                                }
                              }}
                            />
                            <Camera className="w-6 h-6" />
                            <span className="text-[8px] font-bold uppercase">Add Photo</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-6">
                      <h4 className="font-bold text-navy-950 uppercase tracking-widest text-xs">Verification Documents</h4>
                      <div className="space-y-3">
                        {[
                          { id: "id_proof", label: "Owner's ID Proof (Aadhar/PAN)", icon: Shield },
                          { id: "gst_cert", label: "GST Registration Certificate", icon: FileText },
                          { id: "property_tax", label: "Property Tax Receipt / Deed", icon: FileText }
                        ].map(doc => {
                          const isUploaded = formData.documents.some(d => d.type === doc.id);
                          return (
                            <div key={doc.id} className="p-5 rounded-2xl bg-sand-50 border border-sand-100 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl border border-sand-200">
                                  <doc.icon className="w-5 h-5 text-gold-600" />
                                </div>
                                <span className="text-sm font-bold text-navy-950">
                                  {isUploaded ? `${doc.label} (Uploaded)` : doc.label}
                                </span>
                              </div>
                              <label className="flex items-center gap-2 text-gold-600 hover:text-gold-700 cursor-pointer">
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    toast.loading("Optimizing document...", { id: "doc-compress" });
                                    try {
                                      const compressed = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 1200 });
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setFormData(p => {
                                          const existing = p.documents.filter(d => d.type !== doc.id);
                                          return { ...p, documents: [...existing, { type: doc.id, url: reader.result as string }] };
                                        });
                                        toast.success("Document optimized!", { id: "doc-compress" });
                                      };
                                      reader.readAsDataURL(compressed);
                                    } catch (err) {
                                      toast.error("Upload failed", { id: "doc-compress" });
                                    }
                                  }}
                                />
                                {isUploaded ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <UploadCloud className="w-5 h-5" />}
                                <span className={cn("text-[10px] font-bold uppercase tracking-widest", isUploaded && "text-green-600")}>
                                  {isUploaded ? "Change" : "Upload"}
                                </span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="p-10 bg-gold-950 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-8">
                    <div className="w-20 h-20 bg-gold-500 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                      <CheckCircle2 className="w-10 h-10 text-gold-950" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Ready for Verification</h4>
                      <p className="text-gold-100/60 leading-relaxed text-sm">Once submitted, our Hampi Experts will review your property within 24-48 hours. You'll receive a notification and a verified badge upon approval.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-16 pt-10 border-t border-sand-100">
              {step > 1 ? (
                <Button variant="outline" size="lg" className="rounded-3xl gap-3 px-12 h-16 text-lg border-sand-200" onClick={handleBack}>
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </Button>
              ) : <div />}
              
              <div className="flex flex-col items-end gap-2">
                {step < 7 ? (
                  <Button 
                    size="lg" 
                    className="rounded-3xl gap-3 px-12 h-16 text-lg shadow-gold"
                    onClick={handleNext}
                  >
                    Next Step
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="rounded-3xl gap-3 px-16 h-16 text-xl font-bold shadow-gold"
                    onClick={handlePublish} 
                    isLoading={isPublishing}
                  >
                    Submit Property
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Custom Amenity Modal */}
        <AnimatePresence>
          {showCustomAmenityModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm"
                onClick={() => setShowCustomAmenityModal(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[3rem] p-8 md:p-10 shadow-2xl border border-white/50 flex flex-col gap-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-navy-950 mb-1">{editingAmenityId ? "Edit Amenity" : "Add Custom Amenity"}</h3>
                    <p className="text-sm text-navy-950/60">Create a unique experience offering for your guests.</p>
                  </div>
                  <button onClick={() => setShowCustomAmenityModal(false)} className="p-2 bg-sand-100 hover:bg-sand-200 rounded-full text-navy-950 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <Input 
                    label="Amenity Name" 
                    placeholder="e.g. Temple Sunrise View" 
                    value={amenityForm.name} 
                    onChange={e => setAmenityForm(p => ({...p, name: e.target.value}))} 
                    maxLength={30}
                  />
                  <Input 
                    label="Description (Optional)" 
                    placeholder="Short description of the experience..." 
                    value={amenityForm.description} 
                    onChange={e => setAmenityForm(p => ({...p, description: e.target.value}))} 
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="outline" className="rounded-2xl" onClick={() => setShowCustomAmenityModal(false)}>Cancel</Button>
                  <Button className="rounded-2xl shadow-gold" onClick={handleSaveCustomAmenity}>
                    {editingAmenityId ? "Save Changes" : "Add Amenity"}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

