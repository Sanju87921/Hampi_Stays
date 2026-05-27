/**
 * Enterprise Validation & Sanitization System for HampiStays
 */

/**
 * Checks if a string looks like an encrypted blob (contains colons)
 */
export function isEncryptedOrMalformed(val) {
  if (!val) return false;
  const str = String(val).trim();
  return str.includes(':');
}

/**
 * Checks if a string looks like a database ObjectId (24-hex characters)
 */
export function isObjectId(val) {
  if (!val) return false;
  const str = String(val).trim();
  return /^[0-9a-fA-F]{24}$/.test(str);
}

/**
 * Reject invalid Unicode corruption or control characters
 */
export function hasUnicodeCorruption(val) {
  if (!val) return false;
  const str = String(val);
  // Matches control characters (except tab/newline) or replacement character U+FFFD
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/.test(str);
}

/**
 * Clean and validate Name
 */
export function validateAndCleanName(name) {
  if (!name) return '';
  let str = String(name).trim();

  // Reject malformed strings
  if (isEncryptedOrMalformed(str) || isObjectId(str) || hasUnicodeCorruption(str)) {
    return '';
  }

  // Names should only contain letters, spaces, hyphens, periods, apostrophes
  // Reject hashes, symbols, brackets, etc.
  const nameRegex = /^[a-zA-Z\s.\-'\u00C0-\u017F]+$/;
  if (!nameRegex.test(str)) {
    // If it contains invalid symbols, strip them or reject
    str = str.replace(/[^a-zA-Z\s.\-'\u00C0-\u017F]/g, '');
  }

  // Capitalize name parts
  return str
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .trim();
}

/**
 * Clean and validate Email
 */
export function validateAndCleanEmail(email) {
  if (!email) return '';
  const str = String(email).trim().toLowerCase();

  if (isEncryptedOrMalformed(str) || isObjectId(str) || hasUnicodeCorruption(str)) {
    return '';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(str)) {
    return '';
  }

  return str;
}

/**
 * Clean and validate Phone Number
 */
export function validateAndCleanPhone(phone) {
  if (!phone) return '';
  let str = String(phone).trim();

  if (isEncryptedOrMalformed(str) || isObjectId(str) || hasUnicodeCorruption(str)) {
    return '';
  }

  // Remove all non-numeric characters except leading +
  const hasPlus = str.startsWith('+');
  let cleaned = str.replace(/[^\d]/g, '');
  if (hasPlus) {
    cleaned = '+' + cleaned;
  }

  const numericPart = hasPlus ? cleaned.slice(1) : cleaned;
  
  // Length and numeric checks
  if (cleaned.length > 15 || numericPart.length < 7 || !/^\d+$/.test(numericPart)) {
    return '';
  }

  return cleaned;
}

/**
 * Clean and validate Location fields
 */
export function validateAndCleanLocation(location) {
  if (!location) return '';
  let str = String(location).trim();

  if (isEncryptedOrMalformed(str) || isObjectId(str) || hasUnicodeCorruption(str)) {
    return '';
  }

  // Strip dangerous SQL/HTML characters or hashes
  str = str.replace(/[<>{}[\];\\|~`]/g, '');

  return str.trim();
}

/**
 * Clean and validate Guest Details (object validator)
 */
export function validateAndCleanGuestDetails(guest) {
  if (!guest || typeof guest !== 'object') {
    return { name: '', email: '', phone: '', nationality: 'Indian' };
  }

  return {
    name: validateAndCleanName(guest.name),
    email: validateAndCleanEmail(guest.email),
    phone: validateAndCleanPhone(guest.phone),
    nationality: validateAndCleanLocation(guest.nationality) || 'Indian'
  };
}

/**
 * MASKING FOR OBSERVABILITY (Zero PII Leaks in Logs)
 */
export function maskPhoneNumber(phone) {
  if (!phone) return '***';
  const str = String(phone).trim();
  if (str.length <= 5) return '*****';
  // Keep first 5 digits, replace the rest with * (e.g. 73535******)
  return str.slice(0, 5) + '*'.repeat(Math.max(3, str.length - 5));
}

export function maskEmail(email) {
  if (!email) return '***';
  const str = String(email).trim();
  const parts = str.split('@');
  if (parts.length !== 2) return '******';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return '**@' + domain;
  }
  return name.slice(0, 2) + '*'.repeat(name.length - 2) + '@' + domain;
}
