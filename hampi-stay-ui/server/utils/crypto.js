import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY = process.env.ENCRYPTION_KEY ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') : crypto.randomBytes(32);

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param {string} text - The plaintext to encrypt
 * @returns {string} - The encrypted string in format iv:authTag:encryptedContent
 */
export function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts data encrypted with AES-256-GCM
 * @param {string} encryptedText - The encrypted string in format iv:authTag:encryptedContent
 * @returns {string} - The decrypted plaintext
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  try {
    const [ivHex, authTagHex, encryptedContent] = encryptedText.split(':');
    
    if (!ivHex || !authTagHex || !encryptedContent) {
      return encryptedText; // Probably not encrypted or legacy data
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return encryptedText; // Fallback to original text if decryption fails (might be unencrypted legacy data)
  }
}
