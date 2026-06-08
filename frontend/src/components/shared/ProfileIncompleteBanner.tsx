import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, ArrowRight, Sparkles, X, Clock, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../utils/apiClient";
import { useSystem } from "../../context/SystemContext";

type BannerState = 'HIDDEN' | 'NEEDS_DOCS' | 'UNDER_REVIEW';

export function ProfileIncompleteBanner() {
  const { user } = useAuth();
  const { settings } = useSystem();
  const [bannerState, setBannerState] = useState<BannerState>('HIDDEN');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || dismissed) {
      setBannerState('HIDDEN');
      return;
    }

    const hasFullName = !!(user.name && user.name.trim() !== "");
    const hasEmail = !!(user.email && user.email.trim() !== "");
    const hasPhone = !!(user.phone && user.phone.trim() !== "");
    const hasAvatar = !!(user.avatar && user.avatar.trim() !== "");
    const hasKYC = user.kycStatus === 'PENDING' || user.kycStatus === 'VERIFIED';

    const vSettings = settings?.verificationSettings;

    if (user.role === 'GUIDE') {
      const reqs = vSettings?.guideRequirements || [];
      const needsIdDoc = reqs.some(r => !['EMAIL', 'PHONE'].includes(r));

      // If basic profile not filled, prompt for update
      if (!hasFullName || !hasAvatar) {
        setBannerState('NEEDS_DOCS');
        return;
      }
      if (reqs.includes('EMAIL') && !hasEmail) { setBannerState('NEEDS_DOCS'); return; }
      if (reqs.includes('PHONE') && !hasPhone) { setBannerState('NEEDS_DOCS'); return; }

      // If docs are required but already submitted → check guide profile status
      if (needsIdDoc) {
        apiClient.get<any>(`/guides/profile/${user.id}`)
          .then(data => {
            if (!data) { setBannerState('NEEDS_DOCS'); return; }
            if (data.status === 'APPROVED') { setBannerState('HIDDEN'); return; }
            // Check if they have KYC docs submitted
            if (hasKYC || data.idImage) {
              // Docs uploaded, waiting for admin
              setBannerState('UNDER_REVIEW');
            } else {
              setBannerState('NEEDS_DOCS');
            }
          })
          .catch(() => setBannerState('NEEDS_DOCS'));
        return;
      }

      setBannerState('HIDDEN');
      return;
    }

    if (user.role === 'RESORT_OWNER') {
      const reqs = vSettings?.resortOwnerRequirements || [];
      if (reqs.includes('EMAIL') && !hasEmail) { setBannerState('NEEDS_DOCS'); return; }
      if (reqs.includes('PHONE') && !hasPhone) { setBannerState('NEEDS_DOCS'); return; }
      if (reqs.some(r => !['EMAIL', 'PHONE'].includes(r)) && !hasKYC) { setBannerState('NEEDS_DOCS'); return; }
      setBannerState(!(hasFullName && hasAvatar) ? 'NEEDS_DOCS' : 'HIDDEN');
      return;
    }

    // TRAVELLER
    const reqs = vSettings?.travellerRequirements || [];
    if (reqs.includes('EMAIL') && !hasEmail) { setBannerState('NEEDS_DOCS'); return; }
    if (reqs.includes('PHONE') && !hasPhone) { setBannerState('NEEDS_DOCS'); return; }
    if (reqs.some(r => !['EMAIL', 'PHONE'].includes(r)) && !hasKYC) { setBannerState('NEEDS_DOCS'); return; }
    setBannerState(!(hasFullName && hasAvatar) ? 'NEEDS_DOCS' : 'HIDDEN');
  }, [user, dismissed, settings]);

  if (bannerState === 'HIDDEN') return null;

  const isUnderReview = bannerState === 'UNDER_REVIEW';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-10"
      >
        <div className={`rounded-[2.5rem] p-1 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-2xl border ${
          isUnderReview
            ? 'bg-gradient-to-r from-amber-900 to-amber-800 border-amber-700/30'
            : 'bg-gradient-to-r from-navy-950 to-navy-900 border-white/10'
        }`}>
          {/* Animated Background Decor */}
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse ${isUnderReview ? 'bg-amber-400/10' : 'bg-gold-500/10'}`} />
          <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full blur-[50px] -ml-16 -mb-16 ${isUnderReview ? 'bg-amber-400/5' : 'bg-gold-500/5'}`} />

          <div className="flex-grow flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 relative z-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${isUnderReview ? 'bg-amber-400/20 border-amber-400/30' : 'bg-white border-white/10'}`}>
              {isUnderReview
                ? <Clock className="w-8 h-8 text-amber-300" />
                : <UserCircle className="w-8 h-8 text-gold-400" />
              }
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                {isUnderReview
                  ? <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  : <Sparkles className="w-4 h-4 text-gold-400" />
                }
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isUnderReview ? 'text-amber-300' : 'text-gold-400'}`}>
                  {isUnderReview ? 'Under Admin Review' : 'Complete Your Journey'}
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold text-white mb-2">
                {isUnderReview ? (
                  <>Documents <span className={`italic ${isUnderReview ? 'text-amber-300' : 'text-gold-400'}`}>Submitted & Pending</span></>
                ) : user?.role === 'GUIDE' ? (
                  <>Verify Your <span className="text-gold-400 italic">Expert Profile</span></>
                ) : (
                  <>Unlock the <span className="text-gold-400 italic">Full Hampi Experience</span></>
                )}
              </h3>
              <p className="text-white/60 text-sm max-w-xl leading-relaxed">
                {isUnderReview
                  ? "Your identity documents have been uploaded successfully. Our admin team is currently reviewing your profile. You will receive a notification once your account is approved."
                  : user?.role === 'GUIDE'
                    ? "Please upload your identity documents (Aadhar, PAN, or Voter ID) to get your profile verified by our team and start hosting travelers."
                    : "Complete your profile details (Phone, Email, and Photo) to unlock exclusive, personalized experiences across the ruins."
                }
              </p>
            </div>
          </div>

          <div className="p-6 md:pr-12 relative z-10 w-full md:w-auto">
            {isUnderReview ? (
              <div className="w-full md:w-auto bg-amber-400/20 border border-amber-400/30 text-amber-200 px-8 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-pulse" />
                Awaiting Approval
              </div>
            ) : (
              <Link to={user?.role === 'GUIDE' ? "/dashboard/kyc" : user?.role === 'RESORT_OWNER' ? "/dashboard/kyc" : "/dashboard/profile"}>
                <button className="w-full md:w-auto bg-gold-500 hover:bg-gold-400 text-navy-950 px-8 py-4 rounded-2xl font-bold transition-all shadow-gold flex items-center justify-center gap-2 group">
                  {user?.role === 'GUIDE' ? 'Upload Documents' : 'Update Profile'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            )}
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
