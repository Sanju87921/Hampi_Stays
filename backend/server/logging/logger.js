import { maskPhoneNumber, maskEmail } from './validation.js';

/**
 * Enterprise Secure Logger for HampiStays
 * Masks PII to prevent leaks in server/edge logs.
 */

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};
  const clean = { ...metadata };

  if (clean.phone) clean.phone = maskPhoneNumber(clean.phone);
  if (clean.email) clean.email = maskEmail(clean.email);
  if (clean.password) clean.password = '[MASKED]';
  if (clean.passwordHash) clean.passwordHash = '[MASKED]';
  
  if (clean.payload && typeof clean.payload === 'object') {
    const cleanPayload = { ...clean.payload };
    if (cleanPayload.phone) cleanPayload.phone = maskPhoneNumber(cleanPayload.phone);
    if (cleanPayload.email) cleanPayload.email = maskEmail(cleanPayload.email);
    if (cleanPayload.password) cleanPayload.password = '[MASKED]';
    if (cleanPayload.passwordHash) cleanPayload.passwordHash = '[MASKED]';
    clean.payload = cleanPayload;
  }

  // Handle errors
  if (clean.error instanceof Error) {
    clean.errorMessage = clean.error.message;
    clean.errorStack = clean.error.stack ? '[REDACTED STACK TRACE]' : undefined;
    delete clean.error;
  }

  return clean;
}

export function logSecureError(type, message, metadata = {}) {
  const cleanMeta = sanitizeMetadata(metadata);
  console.error(`[SECURE_LOG:${type}] ${message}`, JSON.stringify(cleanMeta));
}

export function logSecureWarn(type, message, metadata = {}) {
  const cleanMeta = sanitizeMetadata(metadata);
  console.warn(`[SECURE_LOG:${type}] ${message}`, JSON.stringify(cleanMeta));
}

export function logSecureInfo(type, message, metadata = {}) {
  const cleanMeta = sanitizeMetadata(metadata);
  console.info(`[SECURE_LOG:${type}] ${message}`, JSON.stringify(cleanMeta));
}
