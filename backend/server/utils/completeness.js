import { validateAndCleanPhone, validateAndCleanEmail, validateAndCleanName, validateAndCleanLocation } from './validation.js';

/**
 * Computes profile completeness status based on validation rules
 * States: INCOMPLETE | PARTIAL | COMPLETE | VERIFIED
 */
export function computeProfileCompleteness(user) {
  if (!user) return 'INCOMPLETE';

  const hasName = !!validateAndCleanName(user.name);
  const hasEmail = !!validateAndCleanEmail(user.email);
  const hasPhone = !!validateAndCleanPhone(user.phone);
  const hasLocation = !!validateAndCleanLocation(user.location);
  const hasAvatar = !!user.avatar && String(user.avatar).trim().startsWith('http');
  
  // Verification flags
  const emailVerified = !!user.verifiedEmail || !!user.isEmailVerified;
  const mobileVerified = !!user.verifiedPhone || !!user.isMobileVerified;

  const hasCriticalData = hasName && hasEmail;
  const hasAllData = hasName && hasEmail && hasPhone && hasLocation && hasAvatar;
  const isFullyVerified = emailVerified && mobileVerified;

  if (hasAllData && isFullyVerified) {
    return 'VERIFIED';
  } else if (hasAllData) {
    return 'COMPLETE';
  } else if (hasCriticalData || hasPhone || hasLocation || hasAvatar) {
    return 'PARTIAL';
  } else {
    return 'INCOMPLETE';
  }
}
