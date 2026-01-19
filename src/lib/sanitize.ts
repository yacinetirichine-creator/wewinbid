/**
 * @fileoverview Input Sanitization & XSS Protection Utilities
 * Protège contre les attaques XSS, injection SQL, et autres vecteurs d'attaque
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - HTML potentially containing malicious code
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text input (removes all HTML tags)
 * @param input - User input text
 * @returns Plain text without HTML
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

/**
 * Validate and sanitize file names to prevent directory traversal
 * @param fileName - Original file name
 * @returns Safe file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts
  let safe = fileName.replace(/\.\./g, '');
  
  // Remove or replace dangerous characters
  safe = safe.replace(/[^\w\s.-]/g, '_');
  
  // Limit length
  if (safe.length > 255) {
    const ext = safe.split('.').pop();
    safe = safe.substring(0, 250) + '.' + ext;
  }
  
  return safe;
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format and whitelist domains
 * @param url - URL to validate
 * @param allowedDomains - Optional list of allowed domains
 * @returns True if valid and safe URL
 */
export function isValidUrl(url: string, allowedDomains?: string[]): boolean {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Check domain whitelist if provided
    if (allowedDomains && allowedDomains.length > 0) {
      return allowedDomains.some(domain => parsed.hostname.endsWith(domain));
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize SQL-like inputs (additional layer, use parameterized queries!)
 * @param input - User input that might be used in queries
 * @returns Escaped input
 */
export function escapeSqlInput(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

/**
 * Validate UUID format
 * @param uuid - String to validate as UUID
 * @returns True if valid UUID v4
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize object keys and values recursively
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeText(key) as keyof T;
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeText(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[sanitizedKey] = sanitizeObject(value) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : 
        typeof item === 'object' ? sanitizeObject(item) : item
      ) as T[keyof T];
    } else {
      sanitized[sanitizedKey] = value;
    }
  }
  
  return sanitized;
}

/**
 * Rate limit per IP for file uploads
 */
const uploadRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkUploadRateLimit(ip: string, maxUploads: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = uploadRateLimits.get(ip);
  
  if (!record || now > record.resetTime) {
    uploadRateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxUploads) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Validate file extension against whitelist
 * @param fileName - Name of the file
 * @param allowedExtensions - Allowed file extensions
 * @returns True if extension is allowed
 */
export function isAllowedFileExtension(fileName: string, allowedExtensions: string[]): boolean {
  const ext = fileName.toLowerCase().split('.').pop();
  return ext ? allowedExtensions.includes(ext) : false;
}

/**
 * Check for malicious file content patterns
 * @param content - File content buffer
 * @returns True if potentially malicious patterns detected
 */
export function hasMaliciousPatterns(content: Buffer): boolean {
  const suspicious = [
    /(<script|javascript:|onerror=|onload=)/i, // XSS patterns
    /(eval\(|base64_decode|exec\(|system\()/i, // Code execution
    /(\$_(GET|POST|REQUEST|COOKIE|SERVER))/i, // PHP injection
  ];
  
  const contentStr = content.toString('utf8', 0, Math.min(content.length, 10000)); // Check first 10KB
  return suspicious.some(pattern => pattern.test(contentStr));
}

/**
 * Generate secure random token
 * @param length - Length of token
 * @returns Random token string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i] % chars.length];
  }
  
  return token;
}

/**
 * Mask sensitive data for logging
 * @param data - Sensitive data to mask
 * @param visibleChars - Number of visible characters at start/end
 * @returns Masked string
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(data.length - visibleChars * 2);
  
  return `${start}${masked}${end}`;
}
