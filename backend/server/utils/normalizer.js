import { validateAndCleanPhone, validateAndCleanEmail, validateAndCleanName, validateAndCleanLocation } from './validation.js';
import { computeProfileCompleteness } from './completeness.js';
import { decrypt } from './crypto.js';

/**
 * Enterprise Secure Response Normalizer (DTO Layer)
 * Sanitizes all output payload to prevent raw db/encryption leak.
 */
export function normalizeUserResponse(user) {
  if (!user) return null;

  // 1. Ensure PII fields are decrypted first (safely handling failure)
  let decryptedPhone = '';
  let decryptedLocation = '';
  let decryptedIdNumber = '';
  let decryptedIdImage = '';

  try {
    decryptedPhone = user.phone ? decrypt(user.phone) : '';
  } catch (e) {
    decryptedPhone = '';
  }

  try {
    decryptedLocation = user.location ? decrypt(user.location) : '';
  } catch (e) {
    decryptedLocation = '';
  }

  try {
    decryptedIdNumber = user.idNumber ? decrypt(user.idNumber) : '';
  } catch (e) {
    decryptedIdNumber = '';
  }

  try {
    decryptedIdImage = user.idImage ? decrypt(user.idImage) : '';
  } catch (e) {
    decryptedIdImage = '';
  }

  // 2. Perform field-level validation and cleaning
  const name = validateAndCleanName(user.name);
  const email = validateAndCleanEmail(user.email);
  const phone = validateAndCleanPhone(decryptedPhone);
  const location = validateAndCleanLocation(decryptedLocation);
  
  // Normalize avatar
  let avatar = '';
  if (user.avatar && typeof user.avatar === 'string' && user.avatar.trim().startsWith('http')) {
    avatar = user.avatar.trim();
  }

  // 3. KYC Fields validation
  const kycStatus = user.kycStatus || 'NOT_SUBMITTED';
  const idType = user.idType || '';
  
  // If KYC ID number fails basic formatting or has colons, blank it out
  let idNumber = decryptedIdNumber;
  if (idNumber.includes(':')) {
    idNumber = '';
  }

  // 4. Calculate Profile Completeness
  const profileCompletionStatus = computeProfileCompleteness({
    ...user,
    name,
    email,
    phone,
    location,
    avatar
  });

  // Return a secure DTO (Data Transfer Object)
  return {
    id: user.id,
    name,
    email,
    role: user.role,
    phone,
    location,
    avatar,
    kycStatus,
    idType,
    idNumber: idNumber ? `${idNumber.slice(0, 4)}******` : '', // Mask sensitive ID numbers
    idImage: decryptedIdImage, 
    isEmailVerified: !!user.isEmailVerified || !!user.verifiedEmail,
    isMobileVerified: !!user.isMobileVerified || !!user.verifiedPhone,
    profileCompletionStatus,
    theme: user.theme || 'light',
    language: user.language || 'en-US'
  };
}
