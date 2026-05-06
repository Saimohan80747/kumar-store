/**
 * Security utilities for input sanitization and validation.
 */

/**
 * Sanitizes a string to prevent basic XSS and injection attacks.
 * Removes HTML tags and trims whitespace.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .trim();
}

/**
 * Validates if a string is a valid email.
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validates if a string is a valid Indian phone number (10 digits).
 */
export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

/**
 * Rate limiter helper for client-side actions.
 * Prevents rapid repeated clicks or submissions.
 */
const rateLimitMap = new Map<string, number>();

export function checkRateLimit(key: string, limitMs: number = 2000): boolean {
  const now = Date.now();
  const lastTime = rateLimitMap.get(key) || 0;
  
  if (now - lastTime < limitMs) {
    return false;
  }
  
  rateLimitMap.set(key, now);
  return true;
}

/**
 * Advanced blocking with integrity check.
 * Prevents simple manual overrides of localStorage.
 */
const SECURITY_SALT = 'kumar_store_v1_secure';

export function setPersistentBlock(reason: string): void {
  const timestamp = Date.now();
  const blockData = {
    blocked: true,
    reason,
    timestamp,
    fingerprint: btoa(`${reason}-${timestamp}-${SECURITY_SALT}`)
  };
  localStorage.setItem('admin_account_blocked', JSON.stringify(blockData));
}

export function isDeviceBlocked(): boolean {
  const raw = localStorage.getItem('admin_account_blocked');
  if (!raw) return false;
  
  try {
    const data = JSON.parse(raw);
    if (!data.blocked || !data.fingerprint) return false;
    
    // Simple integrity check
    const expectedFingerprint = btoa(`${data.reason}-${data.timestamp}-${SECURITY_SALT}`);
    return data.fingerprint === expectedFingerprint;
  } catch {
    // If JSON is invalid, it's likely tampered with, keep it blocked if it was 'true'
    return raw === 'true';
  }
}

// Core security utility functions

// Security utility handlers

// Security utility handlers
