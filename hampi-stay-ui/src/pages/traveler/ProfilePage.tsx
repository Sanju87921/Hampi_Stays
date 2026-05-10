import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, ShieldCheck, Check, Upload, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../utils/cn";

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || "H";
};

export function ProfilePage() {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
    location: "Hampi, Karnataka",
    idType: user?.idType || "",
    idNumber: user?.idNumber || "",
    idImage: user?.idImage || "",
    kycStatus: user?.kycStatus || "NOT_SUBMITTED"
  });
  const { updateUser } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    // Automatically set status to PENDING if documents are uploaded
    const submissionData = {
      ...formData,
      kycStatus: (formData.idImage && formData.kycStatus === "NOT_SUBMITTED") ? "PENDING" : formData.kycStatus
    };

    try {
      const response = await fetch(`http://localhost:5000/api/users/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData)
      });
      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.user || { ...user, ...submissionData };
        updateUser(updatedUser);
        setFormData(prev => ({ ...prev, kycStatus: updatedUser.kycStatus }));
        setShowSuccess(true);
        setIsEditing(false);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50/50 pt-28 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="mb-10">
          <h1 className="text-4xl font-serif font-bold text-navy-950 mb-2">My Profile</h1>
          <p className="text-navy-950/50">Manage your personal information and preferences.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] p-8 border border-sand-100 shadow-sm text-center">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-navy-950 to-navy-800 flex items-center justify-center text-white font-serif overflow-hidden border-4 border-white shadow-xl relative group">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt={formData.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold tracking-tighter">
                      {getInitials(formData.name)}
                    </span>
                  )}
                  
                  {/* Overlay for editing - always visible when isEditing is true */}
                  {isEditing && (
                    <div className="absolute inset-0 bg-navy-950/40 transition-opacity flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white/70" />
                    </div>
                  )}
                </div>

                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-navy-950 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer">
                    <Camera className="w-5 h-5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const uploadData = new FormData();
                        uploadData.append('image', file);
                        try {
                          const res = await fetch('http://localhost:5000/api/upload', { 
                            method: 'POST', 
                            body: uploadData 
                          });
                          const data = await res.json();
                          setFormData(prev => ({...prev, avatar: data.url}));
                        } catch (err) {
                          alert("Failed to upload image. Please try again.");
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <h3 className="text-xl font-bold text-navy-950 mb-1">{formData.name}</h3>
              <p className="text-sm text-navy-950/40 mb-6 uppercase tracking-widest font-bold">
                {user?.role === "RESORT_OWNER" ? "Resort Owner" : "Traveller"}
              </p>
              
              <div className="pt-6 border-t border-sand-50 flex items-center justify-center gap-2 text-xs font-bold text-green-700 bg-green-50 rounded-2xl py-2">
                <ShieldCheck className="w-4 h-4" />
                Verified Account
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-2">
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleUpdate}
              className="bg-white rounded-[2.5rem] p-10 border border-sand-100 shadow-sm space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={!isEditing}
                  autoFocus={isEditing}
                />
                <Input 
                  label="Email Address"
                  value={formData.email}
                  disabled={true}
                  className="opacity-60"
                />
                <Input 
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 98765 43210"
                  disabled={!isEditing}
                />
                <Input 
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Bangalore, India"
                  disabled={!isEditing}
                />
              </div>


              <div className="pt-6 border-t border-sand-50">
                {showSuccess ? (
                  <Button 
                    className="rounded-xl px-10 h-12 bg-green-600 hover:bg-green-700 shadow-green-600/20 text-white"
                    disabled
                  >
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" /> Saved Successfully
                    </span>
                  </Button>
                ) : isEditing ? (
                  <div className="flex gap-4">
                    <Button 
                      className="rounded-xl px-10 h-12 bg-navy-950 text-white shadow-luxury"
                      type="submit"
                      isLoading={isUpdating}
                    >
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline"
                      className="rounded-xl px-10 h-12"
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user?.name || "",
                          email: user?.email || "",
                          phone: user?.phone || "",
                          avatar: user?.avatar || "",
                          location: user?.location || "Hampi, Karnataka",
                          idType: user?.idType || "",
                          idNumber: user?.idNumber || "",
                          idImage: user?.idImage || "",
                          kycStatus: user?.kycStatus || "NOT_SUBMITTED"
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="rounded-xl px-10 h-12 bg-gold-500 text-navy-950 hover:bg-gold-400 shadow-gold"
                    type="button"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </motion.form>

            {/* KYC Verification Section (Only for Resort Owners) */}
            {user?.role === "RESORT_OWNER" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 bg-white rounded-[2.5rem] p-10 border border-sand-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-navy-950 flex items-center gap-3">
                      <ShieldCheck className="w-7 h-7 text-gold-600" />
                      Professional Verification (KYC)
                    </h2>
                    <p className="text-sm text-navy-950/40 mt-1">Verify your identity to unlock payouts and featured listings.</p>
                  </div>
                  
                  <div className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border flex items-center gap-2",
                    formData.kycStatus === "VERIFIED" ? "bg-green-50 text-green-700 border-green-100" :
                    formData.kycStatus === "PENDING" ? "bg-gold-50 text-gold-700 border-gold-100" :
                    "bg-sand-50 text-navy-950/40 border-sand-100"
                  )}>
                    {formData.kycStatus === "VERIFIED" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {formData.kycStatus.replace('_', ' ')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Document Type</label>
                      <select 
                        disabled={!isEditing || formData.kycStatus === "VERIFIED"}
                        value={formData.idType}
                        onChange={(e) => setFormData({...formData, idType: e.target.value})}
                        className="w-full h-14 bg-sand-50 border-2 border-sand-200 rounded-xl px-4 font-bold text-navy-950 outline-none focus:border-gold-500 disabled:opacity-60 transition-all"
                      >
                        <option value="">Select ID Type</option>
                        <option value="AADHAAR">Aadhaar Card</option>
                        <option value="PAN">PAN Card</option>
                        <option value="VOTER_ID">Voter ID</option>
                        <option value="PASSPORT">Passport</option>
                      </select>
                    </div>

                    <Input 
                      label="ID Document Number"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                      disabled={!isEditing || formData.kycStatus === "VERIFIED"}
                      placeholder="e.g. XXXX-XXXX-XXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">ID Photo (Front)</label>
                    <div className="relative group">
                      {isEditing && formData.kycStatus !== "VERIFIED" && (
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const uploadData = new FormData();
                            uploadData.append('image', file);
                            try {
                              const res = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: uploadData });
                              const data = await res.json();
                              setFormData(prev => ({...prev, idImage: data.url}));
                            } catch (err) { alert("Failed to upload document."); }
                          }}
                        />
                      )}
                      <div className={cn(
                        "h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden",
                        formData.idImage ? "border-gold-500 bg-white" : "border-sand-200 bg-sand-50/50 group-hover:border-gold-400"
                      )}>
                        {formData.idImage ? (
                          <img src={formData.idImage} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-sand-300 mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-sand-400">Click to upload ID photo</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {formData.kycStatus === "NOT_SUBMITTED" && (
                  <div className="mt-8 p-4 rounded-2xl bg-gold-50/50 border border-gold-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gold-600 mt-0.5" />
                    <p className="text-xs text-navy-950/60 leading-relaxed font-medium">
                      Verification usually takes 24-48 hours. Please ensure your document details match your profile name for faster approval.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
