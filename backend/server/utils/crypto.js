import crypto from 'crypto';
import dotenv from 'dotenv';

if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
  try {
    dotenv.config();
  } catch (e) {
    // Ignore dotenv load errors in browser/worker environments
  }
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

let keyCache = null;

function getKey(customKey) {
  if (customKey) {
    return Buffer.isBuffer(customKey) ? customKey : Buffer.from(customKey, 'hex');
  }
  if (keyCache) return keyCache;

  const envKey = (typeof process !== 'undefined' && process.env && process.env.ENCRYPTION_KEY) 
    ? process.env.ENCRYPTION_KEY 
    : null;

  if (envKey) {
    keyCache = Buffer.from(envKey, 'hex');
    return keyCache;
  }

  const isProduction = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
  if (isProduction) {
    throw new Error('ENCRYPTION_KEY must be set in production');
  }

  // Fallback requires env key
  throw new Error('ENCRYPTION_KEY must be set in environment variables');
}

/**
 * Dynamically configures the encryption key cache. Useful for serverless/Worker environments.
 * @param {string|Buffer} key - The hex key or Buffer
 */
export function setEncryptionKey(key) {
  if (key) {
    keyCache = Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex');
  }
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param {string} text - The plaintext to encrypt
 * @param {string|Buffer} [customKey] - Optional custom key
 * @returns {string} - The encrypted string in format iv:authTag:encryptedContent
 */
export function encrypt(text, customKey) {
  if (!text) return null;
  
  try {
    const key = getKey(customKey);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error.message);
    throw error;
  }
}

/**
 * Decrypts data encrypted with AES-256-GCM
 * @param {string} encryptedText - The encrypted string in format iv:authTag:encryptedContent
 * @param {string|Buffer} [customKey] - Optional custom key
 * @returns {string} - The decrypted plaintext
 */
export function decrypt(encryptedText, customKey) {
  if (!encryptedText) return null;
  
  try {
    const [ivHex, authTagHex, encryptedContent] = encryptedText.split(':');
    
    if (!ivHex || !authTagHex || !encryptedContent) {
      if (encryptedText.includes(':')) {
        return ''; // Discard malformed/partial encrypted values
      }
      return encryptedText; // Probably not encrypted or legacy data
    }
    
    const key = getKey(customKey);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    const parts = encryptedText.split(':');
    const masked = parts[2] ? parts[2].slice(0, 8) + '...' : '***';
    console.error(`[SECURE_LOG:DECRYPTION_FAILURE] Decryption failed for payload starting with: ${masked}. Error: ${error.message}`);
    if (encryptedText && encryptedText.includes(':')) {
      return ''; // Never expose raw ciphertext/iv string if decryption fails
    }
    return encryptedText; // Fallback to original text if decryption fails for legacy plaintext
  }
}

/**
 * Sanitizes phone numbers, filtering out encrypted/malformed strings.
 * @param {string} phone 
 * @returns {string}
 */
export function sanitizePhoneNumber(phone) {
  if (!phone) return '';
  const str = String(phone).trim();
  
  // 1. If it contains colons, discard
  if (str.includes(':')) return '';
  
  // 2. Remove all non-numeric characters except single leading '+'
  const hasPlus = str.startsWith('+');
  let cleaned = str.replace(/[^\d]/g, '');
  if (hasPlus) {
    cleaned = '+' + cleaned;
  }
  
  // 3. Length check (must not exceed 15 characters)
  if (cleaned.length > 15) return '';
  
  // 4. Must be numeric (with optional leading +)
  const numericPart = hasPlus ? cleaned.slice(1) : cleaned;
  if (!numericPart || !/^\d+$/.test(numericPart)) {
    return '';
  }
  
  // 5. Min length check
  if (numericPart.length < 7) {
    return '';
  }
  
  return cleaned;
}

/**
 * Generate a signed temporary proxy URL for KYC documents
 */
export function generateSignedKycUrl(guideId) {
  const expires = Math.floor(Date.now() / 1000) + 300; // 5 minutes validity
  const secret = process.env.JWT_SECRET || (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' ? 'dev_jwt_secret_fallback' : null);
  if (!secret) throw new Error('JWT_SECRET is missing');
  const dataToSign = `${guideId}:${expires}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataToSign);
  const token = hmac.digest('hex');
  return `/api/admin/kyc-image/${guideId}?expires=${expires}&token=${token}`;
}

/**
 * Verify the signature and expiration of a signed KYC URL
 */
export function verifySignedKycUrl(guideId, expires, token) {
  if (Math.floor(Date.now() / 1000) > parseInt(expires)) {
    return false;
  }
  const secret = process.env.JWT_SECRET || (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' ? 'dev_jwt_secret_fallback' : null);
  if (!secret) throw new Error('JWT_SECRET is missing');
  const dataToSign = `${guideId}:${expires}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataToSign);
  const expectedToken = hmac.digest('hex');
  return token === expectedToken;
}
