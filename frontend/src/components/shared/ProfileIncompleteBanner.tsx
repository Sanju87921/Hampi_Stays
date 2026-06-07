import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, ArrowRight, Sparkles, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../utils/apiClient";
import { useSystem } from "../../context/SystemContext";

export function ProfileIncompleteBanner() {
  const { user } = useAuth();
  const { settings } = useSystem();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsVisible(false);
      return;
    }

    const checkIncomplete = () => {
      // Use backend-computed profileCompletionStatus if available
      if (user.profileCompletionStatus === 'COMPLETE') return false;

      // 1. Core Profile Requirements
      const hasFullName = !!(user.name && user.name.trim() !== "");
      const hasEmail = !!(user.email && user.email.trim() !== "");
      const hasPhone = !!(user.phone && user.phone.trim() !== "");
      const hasLocation = !!(user.location && user.location.trim() !== "");
      const hasAvatar = !!(user.avatar && user.avatar.trim() !== "");
      const hasKYC = user.kycStatus === 'PENDING' || user.kycStatus === 'VERIFIED';

      const vSettings = settings?.verificationSettings;

      // 2. Role-Specific Dynamic Validation
      if (user.role === 'RESORT_OWNER') {
        const reqs = vSettings?.resortOwnerRequirements || [];
        if (reqs.includes('EMAIL') && !hasEmail) return true;
        if (reqs.includes('PHONE') && !hasPhone) return true;
        if (reqs.some(r => !['EMAIL', 'PHONE'].includes(r)) && !hasKYC) return true;
        return !(hasFullName && hasAvatar);
      }

      if (user.role === 'GUIDE') {
        const reqs = vSettings?.guideRequirements || [];
        if (reqs.includes('EMAIL') && !hasEmail) return true;
        if (reqs.includes('PHONE') && !hasPhone) return true;
        if (reqs.some(r => !['EMAIL', 'PHONE'].includes(r)) && !hasKYC) return true;
        return !(hasFullName && hasAvatar);
      }

      // TRAVELLER Requirements
      const reqs = vSettings?.travellerRequirements || [];
      if (reqs.includes('EMAIL') && !hasEmail) return true;
      if (reqs.includes('PHONE') && !hasPhone) return true;
      if (reqs.some(r => !['EMAIL', 'PHONE'].includes(r)) && !hasKYC) return true;
      return !(hasFullName && hasAvatar);
    };

    const isIncomplete = checkIncomplete();
    setIsVisible(isIncomplete);
    
    // Async check for Guides
    if (user.role === 'GUIDE' && !isIncomplete) {
      apiClient.get<any>(`/guides/profile/${user.id}`)
        .then(data => {
          if (!data || data.status !== 'APPROVED') setIsVisible(true);
        })
        .catch(() => {});
    }
  }, [user]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-10"
      >
        <div className="bg-gradient-to-r from-navy-950 to-navy-900 rounded-[2.5rem] p-1 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-2xl border border-white/10">
          {/* Animated Background Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold-500/5 rounded-full blur-[50px] -ml-16 -mb-16" />

          <div className="flex-grow flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 relative z-10">
            <div className="w-16 h-16 bg-white  rounded-2xl flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-md">
              <UserCircle className="w-8 h-8 text-gold-400" />
            </div>
            
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest">Complete Your Journey</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-white mb-2">
                {user?.role === 'GUIDE' ? (
                  <>Verify Your <span className="text-gold-400 italic">Expert Profile</span></>
                ) : (
                  <>Unlock the <span className="text-gold-400 italic">Full Hampi Experience</span></>
                )}
              </h3>
              <p className="text-white/60 text-sm max-w-xl leading-relaxed">
                {user?.role === 'GUIDE' 
                  ? "Please upload your identity documents (Aadhar, PAN, or Voter ID) to get your profile verified by our team and start hosting travelers."
                  : "Complete your profile details (Phone, Email, and Photo) to get more details about Hampi and unlock exclusive, personalized experiences across the ruins."}
              </p>
            </div>
          </div>

          <div className="p-6 md:pr-12 relative z-10 w-full md:w-auto">
            <Link to={user?.role === 'GUIDE' ? "/dashboard/expert-profile" : "/dashboard/profile"}>
              <button className="w-full md:w-auto bg-gold-500 hover:bg-gold-400 text-navy-950  px-8 py-4 rounded-2xl font-bold transition-all shadow-gold flex items-center justify-center gap-2 group">
                Update Profile
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

