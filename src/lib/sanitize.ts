/**
 * @fileoverview Input Sanitization & XSS Protection Utilities
 * Protège contre les attaques XSS, injection SQL, et autres vecteurs d'attaque
 * Enterprise-grade security module
 */

import DOMPurify from 'isomorphic-dompurify';

// ============================================
// CONFIGURATION
// ============================================

// Patterns dangereux à détecter
const DANGEROUS_PATTERNS = {
  xss: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:\s*text\/html/gi,
    /vbscript:/gi,
  ],
  sqlInjection: [
    /(\b(select|insert|update|delete|drop|union|create|alter|exec|execute)\b.*\b(from|into|table|database|where)\b)/gi,
    /(--)|(\/\*.*\*\/)/g,
    /(\b(or|and)\b\s*\d+\s*=\s*\d+)/gi,
    /(;\s*(drop|delete|truncate|update|insert))/gi,
  ],
  pathTraversal: [
    /\.\.\//g,
    /\.\.\\+/g,
    /%2e%2e/gi,
    /%252e/gi,
  ],
  commandInjection: [
    /[;&|`$(){}[\]<>]/g,
    /\b(cat|ls|rm|mv|cp|chmod|chown|wget|curl|bash|sh|python|perl|ruby|php)\b/gi,
  ],
  templateInjection: [
    /\{\{.*\}\}/g,
    /\$\{.*\}/g,
    /<%.*%>/g,
  ],
};

// Extensions de fichiers autorisées par catégorie
const ALLOWED_FILE_EXTENSIONS = {
  documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'txt', 'rtf'],
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'],
  archives: ['zip', 'rar', '7z', 'tar', 'gz'],
};

// ============================================
// SANITIZATION FUNCTIONS
// ============================================

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - HTML potentially containing malicious code
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['rel'], // Force rel="noopener noreferrer" for links
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}

/**
 * Sanitize for rich text editor output
 */
export function sanitizeRichText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 's', 'a', 'p', 'br', 'ul', 'ol', 'li', 
                   'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 
                   'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'hr', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'form', 'input', 'object', 'embed', 'meta', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'],
  });
}

/**
 * Sanitize plain text input (removes all HTML tags)
 * @param input - User input text
 * @returns Plain text without HTML
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Supprimer les tags HTML
  let clean = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  
  // Supprimer les caractères de contrôle (sauf newlines et tabs)
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normaliser les espaces multiples
  clean = clean.replace(/\s+/g, ' ').trim();
  
  return clean;
}

/**
 * Sanitize for database storage (strict mode)
 */
export function sanitizeForDb(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  let clean = sanitizeText(input);
  
  // Échapper les caractères SQL dangereux
  clean = clean
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\');
    
  return clean;
}

/**
 * Deep security scan for malicious content
 */
export function detectMaliciousContent(input: string): { safe: boolean; threats: string[] } {
  const threats: string[] = [];
  
  if (!input || typeof input !== 'string') {
    return { safe: true, threats: [] };
  }
  
  // Vérifier tous les patterns dangereux
  for (const [category, patterns] of Object.entries(DANGEROUS_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        threats.push(category);
        break;
      }
    }
  }
  
  return {
    safe: threats.length === 0,
    threats: [...new Set(threats)], // Dédupliquer
  };
}

/**
 * Validate and sanitize file names to prevent directory traversal
 * @param fileName - Original file name
 * @returns Safe file name
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') return 'unnamed_file';
  
  // Remove path traversal attempts
  let safe = fileName
    .replace(/\.\./g, '')
    .replace(/\.\//g, '')
    .replace(/\.\\+/g, '')
    .replace(/%2e/gi, '')
    .replace(/%252e/gi, '');
  
  // Remove or replace dangerous characters
  safe = safe.replace(/[^\w\s.\-_]/g, '_');
  
  // Remove leading/trailing dots and spaces
  safe = safe.replace(/^[\s.]+|[\s.]+$/g, '');
  
  // Prevent hidden files (starting with dot)
  if (safe.startsWith('.')) {
    safe = '_' + safe.substring(1);
  }
  
  // Limit length
  if (safe.length > 200) {
    const ext = safe.split('.').pop() || '';
    const baseName = safe.substring(0, 200 - ext.length - 1);
    safe = baseName + '.' + ext;
  }
  
  // Fallback if empty
  if (!safe || safe === '.') {
    safe = 'unnamed_file';
  }
  
  return safe;
}

/**
 * Validate file extension with MIME type verification
 */
export function validateFileType(
  fileName: string, 
  mimeType: string | null,
  category: keyof typeof ALLOWED_FILE_EXTENSIONS = 'documents'
): { valid: boolean; reason?: string } {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const allowedExts = ALLOWED_FILE_EXTENSIONS[category];
  
  if (!allowedExts.includes(ext)) {
    return { 
      valid: false, 
      reason: `Extension .${ext} non autorisée. Extensions acceptées: ${allowedExts.join(', ')}` 
    };
  }
  
  // Vérification MIME type si fourni
  if (mimeType) {
    const mimeExtMap: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
      'application/vnd.ms-excel': ['xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'image/svg+xml': ['svg'],
    };
    
    const expectedExts = mimeExtMap[mimeType];
    if (expectedExts && !expectedExts.includes(ext)) {
      return {
        valid: false,
        reason: `Type MIME ${mimeType} ne correspond pas à l'extension .${ext}`,
      };
    }
  }
  
  return { valid: true };
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
