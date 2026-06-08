import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, ArrowRight, Sparkles, X, Clock, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../utils/apiClient";
import { useSystem } from "../../context/SystemContext";

type BannerState = 'HIDDEN' | 'NEEDS_DOCS' | 'UNDER_REVIEW';

// Poll every 30 seconds to detect admin approval in real-time
const POLL_INTERVAL_MS = 30_000;

export function ProfileIncompleteBanner() {
  const { user } = useAuth();
  const { settings } = useSystem();
  const [bannerState, setBannerState] = useState<BannerState>('HIDDEN');
  const [dismissed, setDismissed] = useState(false);

  const evaluate = useCallback(async () => {
    if (!user || dismissed) {
      setBannerState('HIDDEN');
      return;
    }

    const hasFullName = !!(user.name?.trim());
    const hasEmail = !!(user.email?.trim());
    const hasPhone = !!(user.phone?.trim());
    const hasAvatar = !!(user.avatar?.trim());
    const vSettings = settings?.verificationSettings;

    if (user.role === 'GUIDE') {
      const reqs = vSettings?.guideRequirements || [];
      const needsIdDoc = reqs.some(r => !['EMAIL', 'PHONE'].includes(r));

      if (!hasFullName || !hasAvatar) { setBannerState('NEEDS_DOCS'); return; }
      if (reqs.includes('EMAIL') && !hasEmail) { setBannerState('NEEDS_DOCS'); return; }
      if (reqs.includes('PHONE') && !hasPhone) { setBannerState('NEEDS_DOCS'); return; }

      try {
        const profileData = await apiClient.get<any>(`/guides/profile/${user.id}`);
        if (!profileData) { setBannerState('NEEDS_DOCS'); return; }

        // Admin approved — hide banner immediately
        if (profileData.status === 'APPROVED') {
          setBannerState('HIDDEN');
          return;
        }

        if (needsIdDoc && profileData.id) {
          try {
            const kycDocs = await apiClient.get<any[]>(`/guides/${profileData.id}/kyc`);
            const docs = Array.isArray(kycDocs) ? kycDocs : [];
            setBannerState(docs.length > 0 ? 'UNDER_REVIEW' : 'NEEDS_DOCS');
          } catch {
            setBannerState(profileData.idImage ? 'UNDER_REVIEW' : 'NEEDS_DOCS');
          }
        } else {
          setBannerState('UNDER_REVIEW');
        }
      } catch {
        setBannerState('NEEDS_DOCS');
      }
      return;
    }

    if (user.role === 'RESORT_OWNER') {
      const reqs = vSettings?.resortOwnerRequirements || [];
      if (reqs.includes('EMAIL') && !hasEmail) { setBannerState('NEEDS_DOCS'); return; }
      if (reqs.includes('PHONE') && !hasPhone) { setBannerState('NEEDS_DOCS'); return; }
      const hasKYC = user.kycStatus === 'PENDING' || user.kycStatus === 'VERIFIED';
      if (reqs.some(r => !['EMAIL', 'PHONE'].includes(r)) && !hasKYC) { setBannerState('NEEDS_DOCS'); return; }
      setBannerState(!(hasFullName && hasAvatar) ? 'NEEDS_DOCS' : 'HIDDEN');
      return;
    }

    // TRAVELLER
    const reqs = vSettings?.travellerRequirements || [];
    if (reqs.includes('EMAIL') && !hasEmail) { setBannerState('NEEDS_DOCS'); return; }
    if (reqs.includes('PHONE') && !hasPhone) { setBannerState('NEEDS_DOCS'); return; }
    const hasKYC = user.kycStatus === 'PENDING' || user.kycStatus === 'VERIFIED';
    if (reqs.some(r => !['EMAIL', 'PHONE'].includes(r)) && !hasKYC) { setBannerState('NEEDS_DOCS'); return; }
    setBannerState(!(hasFullName && hasAvatar) ? 'NEEDS_DOCS' : 'HIDDEN');
  }, [user, dismissed, settings]);

  // Run immediately, then poll every 30 seconds
  useEffect(() => {
    evaluate();
    const interval = setInterval(evaluate, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [evaluate]);

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
        <div className="bg-gradient-to-r from-navy-950 to-navy-900 rounded-[2.5rem] p-1 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-2xl border border-white/10">
          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold-500/5 rounded-full blur-[50px] -ml-16 -mb-16" />

          <div className="flex-grow flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 relative z-10">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
              {isUnderReview
                ? <Clock className="w-8 h-8 text-gold-400" />
                : <UserCircle className="w-8 h-8 text-gold-400" />
              }
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                {isUnderReview
                  ? <CheckCircle2 className="w-4 h-4 text-gold-400" />
                  : <Sparkles className="w-4 h-4 text-gold-400" />
                }
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold-400">
                  {isUnderReview ? 'Under Admin Review' : 'Complete Your Journey'}
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold text-white mb-2">
                {isUnderReview ? (
                  <>Documents <span className="text-gold-400 italic">Submitted & Pending Approval</span></>
                ) : user?.role === 'GUIDE' ? (
                  <>Verify Your <span className="text-gold-400 italic">Expert Profile</span></>
                ) : (
                  <>Unlock the <span className="text-gold-400 italic">Full Hampi Experience</span></>
                )}
              </h3>
              <p className="text-white/60 text-sm max-w-xl leading-relaxed">
                {isUnderReview
                  ? "Your identity documents have been uploaded. Our admin team is reviewing your profile — this page will update automatically once approved."
                  : user?.role === 'GUIDE'
                    ? "Please upload your identity documents (Aadhar, PAN, or Voter ID) to get your profile verified by our team and start hosting travelers."
                    : "Complete your profile details (Phone, Email, and Photo) to unlock exclusive, personalized experiences."
                }
              </p>
            </div>
          </div>

          <div className="p-6 md:pr-12 relative z-10 w-full md:w-auto">
            {isUnderReview ? (
              <div className="w-full md:w-auto bg-white/10 border border-white/20 text-white/70 px-8 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-pulse text-gold-400" />
                Awaiting Approval
              </div>
            ) : (
              <Link to={user?.role === 'GUIDE' || user?.role === 'RESORT_OWNER' ? "/dashboard/kyc" : "/dashboard/profile"}>
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
