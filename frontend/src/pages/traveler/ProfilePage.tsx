import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ShieldCheck, Check, Upload, AlertCircle, Loader2, X, ChevronLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../utils/cn";
import { apiClient } from "../../utils/apiClient";
import { KycUploadSection } from "../../components/shared/KycUploadSection";
import { useSystem } from "../../context/SystemContext";
import { API_BASE_URL } from "../../config/api";
import { sanitizePhoneNumber } from "../../utils/phone";

// Upload file via direct Cloudinary signed upload
async function uploadFile(file: File): Promise<string> {
  const token = localStorage.getItem('hampi-token');
  
  // 1. Get Signature from Backend
  const sigRes = await fetch(`${API_BASE_URL}/upload/signature`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!sigRes.ok) {
    const errText = await sigRes.text();
    console.error("Signature fetch error:", errText);
    throw new Error('Failed to get upload signature: ' + errText);
  }
  const sigData = await sigRes.json();
  
  // 2. Upload directly to Cloudinary
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', sigData.api_key);
  fd.append('timestamp', sigData.timestamp);
  fd.append('signature', sigData.signature);
  fd.append('folder', sigData.folder);
  if (sigData.eager) {
    fd.append('eager', sigData.eager);
  }

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  
  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error("Cloudinary upload error:", errText);
    throw new Error('Cloudinary upload failed: ' + errText);
  }
  const uploadData = await uploadRes.json();
  if (!uploadData.secure_url) throw new Error('No URL returned from upload');
  
  return uploadData.secure_url;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || "H";
};

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  location: string;
  idType: string;
  idNumber: string;
  idImage: string;
  kycStatus: string;
}

function buildFormData(u: any): ProfileFormData {
  return {
    name: u?.name || "",
    email: u?.email || "",
    phone: sanitizePhoneNumber(u?.phone),
    avatar: u?.avatar || "",
    location: u?.location || "Hampi, Karnataka",
    idType: u?.idType || "",
    idNumber: u?.idNumber || "",
    idImage: u?.idImage || "",
    kycStatus: u?.kycStatus || "NOT_SUBMITTED"
  };
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { settings } = useSystem();
  const navigate = useNavigate();
  
  const travellerKycReqs = settings?.verificationSettings?.travellerRequirements || [];
  const hasKycRequirements = travellerKycReqs.some((r: string) => !['EMAIL', 'PHONE'].includes(r));

  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(buildFormData(user));
  const [savedData, setSavedData] = useState<ProfileFormData>(buildFormData(user));
  const [showSuccess, setShowSuccess] = useState(false);

  // Bank Account State
  const [bankData, setBankData] = useState<any>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankFormData, setBankFormData] = useState({ accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "" });
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Fetch fresh data from server on mount to override any stale localStorage
  useEffect(() => {
    const fetchLatestUser = async () => {
      if (!user?.id) return;
      try {
        const freshUser = await apiClient.get<any>(`/users/${user.id}`);
        updateUser({ ...user, ...freshUser });
        const fresh = buildFormData(freshUser);
        setFormData(fresh);
        setSavedData(fresh);
        
        if (user?.role === 'RESORT_OWNER') {
          const bank = await apiClient.get<any>('/owner/bank-account').catch(() => null);
          if (bank) setBankData(bank);
        }
      } catch (err) {
        console.error("Failed to refresh user data:", err);
      }
    };
    fetchLatestUser();
  }, [user?.id]);

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!file || !user) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadFile(file);
      // Immediately persist avatar to DB
      const updated = await apiClient.patch<any>(`/users/${user.id}`, { avatar: url });
      updateUser({ ...user, ...updated });
      setFormData(prev => ({ ...prev, avatar: url }));
      setSavedData(prev => ({ ...prev, avatar: url }));
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [user, updateUser]);

  const handleIdImageUpload = useCallback(async (file: File) => {
    if (!file || !user) return;
    setIsUploadingId(true);
    try {
      const url = await uploadFile(file);
      setFormData(prev => ({ ...prev, idImage: url }));
      toast.success("Document uploaded! Click 'Submit for Verification' to confirm.");
    } catch {
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setIsUploadingId(false);
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdating(true);
    try {
      const payload: Record<string, any> = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        idType: formData.idType,
        idNumber: formData.idNumber,
      };
      // Only include idImage if it changed
      if (formData.idImage !== savedData.idImage) {
        payload.idImage = formData.idImage;
      }

      const updatedUser = await apiClient.patch<any>(`/users/${user.id}`, payload);
      updateUser({ ...user, ...updatedUser });
      const fresh = buildFormData(updatedUser);
      setFormData(fresh);
      setSavedData(fresh);
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBankSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);
    try {
      const updatedBank = await apiClient.patch<any>('/owner/bank-account', bankFormData);
      setBankData(updatedBank);
      toast.success("Bank details updated successfully!");
      setShowBankModal(false);
    } catch {
      toast.error("Failed to update bank details");
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleCancel = () => {
    setFormData(savedData);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-sand-50/50 pt-28 pb-12">
      <div className="container mx-auto px-4 max-w-4xl pt-8 md:pt-12">
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
                  {isUploadingAvatar ? (
                    <div className="absolute inset-0 bg-navy-950/60 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  ) : formData.avatar ? (
                    <img src={formData.avatar} alt={formData.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold tracking-tighter">
                      {getInitials(formData.name)}
                    </span>
                  )}
                </div>

                {/* Avatar upload button — always available, saves immediately */}
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-navy-950 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                  />
                </label>
              </div>
              <h3 className="text-xl font-bold text-navy-950 mb-1">{formData.name}</h3>
              <p className="text-sm text-navy-950/40 mb-6 uppercase tracking-widest font-bold">
                {user?.role === "RESORT_OWNER" ? "Resort Owner" : user?.role === "GUIDE" ? "Local Expert" : "Traveller"}
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  disabled={!isEditing}
                />
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                      disabled={isUpdating}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl px-10 h-12"
                      type="button"
                      onClick={handleCancel}
                      disabled={isUpdating}
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


          </div>
        </div>
      </div>
      {user?.role === 'RESORT_OWNER' && (
        <div className='max-w-4xl mx-auto mt-12 mb-20 px-4 md:px-6 space-y-8'>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className='bg-white rounded-[3rem] p-10 md:p-14 shadow-sm border border-sand-100'>
            <h2 className='text-3xl font-serif text-navy-950 font-bold mb-8'>Bank Account Details</h2>
            <div className='bg-sand-50/50 p-8 rounded-3xl border border-sand-100 space-y-4 max-w-2xl'>
              <Input label='Account Holder' defaultValue={bankData?.accountHolderName || user?.name} disabled />
              <Input label='Bank Name' placeholder='HDFC Bank' value={bankData?.bankName || ''} disabled />
              <Input label='Account Number' type='password' placeholder='**** **** 1234' value={bankData?.accountNumber || ''} disabled />
              <Input label='IFSC Code' placeholder='HDFC0001234' value={bankData?.ifscCode || ''} disabled />
              <div className="pt-4">
                <Button className='w-full' onClick={() => {
                  setBankFormData({
                    accountHolderName: bankData?.accountHolderName || user?.name || "",
                    bankName: bankData?.bankName || "",
                    accountNumber: bankData?.accountNumber || "",
                    ifscCode: bankData?.ifscCode || ""
                  });
                  setShowBankModal(true);
                }}>Update Bank Details</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {user?.role === 'TRAVELLER' && hasKycRequirements && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className='max-w-4xl mx-auto mt-12 mb-20 px-4 md:px-6'>
          <div className='bg-white rounded-[2.5rem] p-10 md:p-14 shadow-sm border border-sand-100'>
             <div className="mb-6">
                <h2 className="text-3xl font-serif font-bold text-navy-950 mb-2">Identity Verification</h2>
                <p className="text-navy-950/60">Upload your government-issued documents to comply with local regulations.</p>
             </div>
             <KycUploadSection userType="traveler" profileId={user?.id || ""} />
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showBankModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={() => setShowBankModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-[2rem] w-full max-w-lg overflow-hidden p-8 border border-sand-100 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-navy-950">Update Bank Details</h3>
                <button onClick={() => setShowBankModal(false)} className="p-2 hover:bg-sand-50 rounded-full transition-colors"><X className="w-6 h-6 text-navy-950/40" /></button>
              </div>
              
              <form onSubmit={handleBankSave} className="space-y-6">
                <Input label="Account Holder Name" value={bankFormData.accountHolderName} onChange={(e) => setBankFormData({ ...bankFormData, accountHolderName: e.target.value })} required />
                <Input label="Bank Name" value={bankFormData.bankName} onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })} required />
                <Input label="Account Number" type="password" value={bankFormData.accountNumber} onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })} required />
                <Input label="IFSC Code" value={bankFormData.ifscCode} onChange={(e) => setBankFormData({ ...bankFormData, ifscCode: e.target.value.toUpperCase() })} required />
                
                <div className="flex justify-end gap-3 pt-6 border-t border-sand-100">
                  <Button type="button" variant="outline" onClick={() => setShowBankModal(false)} className="rounded-xl px-8 border-sand-200">Cancel</Button>
                  <Button type="submit" isLoading={isSavingBank} className="rounded-xl px-8 bg-navy-950 text-white hover:bg-navy-900 shadow-lg">Save Details</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
