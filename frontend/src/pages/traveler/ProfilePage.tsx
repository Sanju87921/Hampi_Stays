import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Camera, ShieldCheck, Check, Upload, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../utils/cn";
import { apiClient } from "../../utils/apiClient";
import { API_BASE_URL } from "../../config/api";

// Upload file using raw fetch (not apiClient which JSON-stringifies body)
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('image', file);
  const token = localStorage.getItem('hampi-token');
  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  if (!data.url) throw new Error('No URL returned from upload');
  return data.url;
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
    phone: u?.phone || "",
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(buildFormData(user));
  const [savedData, setSavedData] = useState<ProfileFormData>(buildFormData(user));
  const [showSuccess, setShowSuccess] = useState(false);

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
      toast.success("✓ Your profile has been updated successfully.");
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      console.error("Profile update failed:", err);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setFormData(savedData);
    setIsEditing(false);
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

            {/* KYC Verification Section */}
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
                    Identity Verification (KYC)
                  </h2>
                  <p className="text-sm text-navy-950/40 mt-1">
                    {user?.role === "RESORT_OWNER"
                      ? "Verify your identity to unlock payouts and featured listings."
                      : "Verify your identity for a trusted, secure booking experience."}
                  </p>
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

              {formData.kycStatus === "VERIFIED" ? (
                <div className="p-6 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-4">
                  <Check className="w-8 h-8 text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-green-900">Identity Verified</p>
                    <p className="text-xs text-green-700/70 mt-1">Your account has been fully verified by our team.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Document Type</label>
                      <select
                        disabled={formData.kycStatus === "PENDING"}
                        value={formData.idType}
                        onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      disabled={formData.kycStatus === "PENDING"}
                      placeholder="e.g. XXXX-XXXX-XXXX"
                    />

                    {(formData.idType && formData.idNumber && formData.idImage) && formData.kycStatus === "NOT_SUBMITTED" && (
                      <Button
                        onClick={async () => {
                          if (!user) return;
                          setIsUpdating(true);
                          try {
                            const updated = await apiClient.patch<any>(`/users/${user.id}`, {
                              idType: formData.idType,
                              idNumber: formData.idNumber,
                              idImage: formData.idImage,
                            });
                            updateUser({ ...user, ...updated });
                            const fresh = buildFormData(updated);
                            setFormData(fresh);
                            setSavedData(fresh);
                            toast.success("✓ Documents submitted for verification!");
                          } catch {
                            toast.error("Failed to submit documents.");
                          } finally {
                            setIsUpdating(false);
                          }
                        }}
                        isLoading={isUpdating}
                        className="w-full rounded-xl h-12 bg-navy-950 text-white"
                        type="button"
                      >
                        Submit for Verification
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">ID Photo (Front)</label>
                    <div className="relative group">
                      {formData.kycStatus !== "PENDING" && (
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleIdImageUpload(file);
                          }}
                        />
                      )}
                      <div className={cn(
                        "h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden",
                        formData.idImage ? "border-gold-500 bg-white" : "border-sand-200 bg-sand-50/50 group-hover:border-gold-400"
                      )}>
                        {isUploadingId ? (
                          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                        ) : formData.idImage ? (
                          <img src={formData.idImage} className="w-full h-full object-cover" alt="ID document" />
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
              )}

              {formData.kycStatus === "NOT_SUBMITTED" && (
                <div className="mt-8 p-4 rounded-2xl bg-gold-50/50 border border-gold-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gold-600 mt-0.5" />
                  <p className="text-xs text-navy-950/60 leading-relaxed font-medium">
                    Verification usually takes 24-48 hours. Upload your ID document and click "Submit for Verification" to start the process.
                  </p>
                </div>
              )}

              {formData.kycStatus === "PENDING" && (
                <div className="mt-8 p-4 rounded-2xl bg-gold-50/50 border border-gold-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gold-600 mt-0.5" />
                  <p className="text-xs text-navy-950/60 leading-relaxed font-medium">
                    Your documents are under review. Our team typically completes verification within 24-48 hours.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
