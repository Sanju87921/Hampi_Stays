/**
 * Sanitizes phone numbers, filtering out encrypted/malformed strings.
 * Returns an empty string if the input contains a colon, is non-numeric,
 * or fails length checks.
 */
export function sanitizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  const str = String(phone).trim();
  
  // 1. If it contains colons (e.g. iv:authTag:content), discard
  if (str.includes(":")) return "";
  
  // 2. Remove all non-numeric characters except a single leading '+'
  const hasPlus = str.startsWith("+");
  let cleaned = str.replace(/[^\d]/g, "");
  if (hasPlus) {
    cleaned = "+" + cleaned;
  }
  
  // 3. Length check (must not exceed 15 characters)
  if (cleaned.length > 15) return "";
  
  // 4. Must be numeric (with optional leading +)
  const numericPart = hasPlus ? cleaned.slice(1) : cleaned;
  if (!numericPart || !/^\d+$/.test(numericPart)) {
    return "";
  }
  
  // 5. Min length check
  if (numericPart.length < 7) {
    return "";
  }
  
  return cleaned;
}
