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

  // Stable, deterministic 32-byte development key matching .env for seamless local/cloud sync
  keyCache = Buffer.from('15193fa55735bb1bae85abf1eba39e815e6c5fd4ba2fbc633b438738faf0511f', 'hex');
  return keyCache;
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
    console.error('Decryption failed:', error.message);
    return encryptedText; // Fallback to original text if decryption fails
  }
}
