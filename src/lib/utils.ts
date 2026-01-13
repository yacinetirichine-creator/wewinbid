import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines Tailwind CSS class names with intelligent merging and deduplication.
 * Handles conditional classes, removes duplicates, and resolves conflicts.
 * 
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged and deduplicated class string
 * 
 * @example
 * ```ts
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', someCondition && 'text-blue-500') // => conditional
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency with localization support.
 * 
 * @param amount - The numeric amount to format
 * @param currency - ISO 4217 currency code (default: 'EUR')
 * @param locale - BCP 47 locale identifier (default: 'fr-FR')
 * @returns Formatted currency string without decimals
 * 
 * @example
 * ```ts
 * formatCurrency(150000) // => '150 000 €'
 * formatCurrency(1500, 'USD', 'en-US') // => '$1,500'
 * formatCurrency(2500, 'GBP', 'en-GB') // => '£2,500'
 * ```
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats large numbers in compact notation (e.g., 1.2M, 850K).
 * Useful for displaying analytics, budgets, and statistics.
 * 
 * @param value - The number to format
 * @param locale - BCP 47 locale identifier (default: 'fr-FR')
 * @returns Compact formatted string
 * 
 * @example
 * ```ts
 * formatCompact(1500000) // => '1,5 M'
 * formatCompact(850000) // => '850 k'
 * formatCompact(1200, 'en-US') // => '1.2K'
 * ```
 */
export function formatCompact(value: number, locale: string = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Formats a date according to locale-specific conventions.
 * 
 * @param date - Date string (ISO 8601) or Date object
 * @param options - Intl.DateTimeFormat options (default: long format)
 * @param locale - BCP 47 locale identifier (default: 'fr-FR')
 * @returns Formatted date string
 * 
 * @example
 * ```ts
 * formatDate('2024-12-25') // => '25 décembre 2024'
 * formatDate(new Date(), { dateStyle: 'short' }) // => '15/01/2024'
 * formatDate('2024-12-25', {}, 'en-US') // => 'December 25, 2024'
 * ```
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
/**
 * Formats file size in bytes to human-readable format (B, KB, MB, GB).
 * 
 * @param bytes - File size in bytes
 * @returns Formatted size string with appropriate unit
 * 
 * @example
 * ```ts
 * formatFileSize(0) // => '0 B'
 * formatFileSize(1536) // => '1.5 KB'
 * formatFileSize(1048576) // => '1 MB'
 * formatFileSize(5368709120) // => '5 GB'
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Generates a consistent HSL color from any string.
 * Useful for user avatars, tags, and visual identifiers.
 * 
 * @param str - Input string to hash
 * @returns HSL color string (e.g., 'hsl(210, 65%, 50%)')
 * 
 * @example
 * ```ts
 * stringToColor('John Doe') // => 'hsl(145, 65%, 50%)'
 * stringToColor('Construction') // => 'hsl(280, 65%, 50%)'
 * // Same input always produces same color
 * ```
/**
 * Validates an email address using RFC-compliant regex.
 * 
 * @param email - Email address to validate
 * @returns True if valid email format
 * 
 * @example
 * ```ts
 * isValidEmail('user@example.com') // => true
 * isValidEmail('invalid.email') // => false
 * isValidEmail('user@domain') // => false
 * ```
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates a French SIRET number (14 digits) using Luhn algorithm.
 * SIRET = Système d'Identification du Répertoire des Établissements.
 * 
 * @param siret - SIRET number (with or without spaces)
 * @returns True if valid SIRET
 * 
 * @example
 * ```ts
 * isValidSiret('732 829 320 00074') // => true
 * isValidSiret('73282932000074') // => true
 * isValidSiret('12345678901234') // => false (invalid checksum)
/**
 * Creates a debounced function that delays invoking func until after wait milliseconds.
 * Useful for search inputs, auto-save, and event handlers.
 * 
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function
 * 
 * @example
 * ```ts
 * const searchTenders = debounce((query: string) => {
 *   api.search(query);
 * }, 300);
 * 
 * // Only calls API after 300ms of inactivity
 * searchTenders('construction'); // waits...
 * searchTenders('construction Paris'); // cancels previous, waits...
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generates a unique ID using timestamp and random string.
 * Not cryptographically secure - use for UI keys, not authentication.
 * 
 * @returns Unique alphanumeric string (e.g., 'k2p9l7m1n5')
 * 
 * @example
 * ```ts
 * generateId() // => 'k2p9l7m1n5q3r8'
 * generateId() // => 's4t6u9v2w7x1y3'
 * // Each call produces a different ID
 * ```
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Converts text to URL-friendly slug (lowercase, hyphenated).
 * Removes accents, special characters, and normalizes spaces.
 * 
 * @param text - Text to slugify
 * @returns URL-safe slug
 * 
 * @example
 * ```ts
 * slugify('Appel d\'Offres 2024') // => 'appel-d-offres-2024'
 * slugify('Hôpital Saint-André') // => 'hopital-saint-andre'
 * slugify('  Extra   Spaces  ') // => 'extra-spaces'
 * ```
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Returns Tailwind text color class based on score (0-100).
 * Used for visual indicators, badges, and progress displays.
 * 
 * @param score - Numeric score (0-100)
 * @returns Tailwind text color class
 * 
 * @example
 * ```ts
 * getScoreColor(95) // => 'text-emerald-500' (excellent)
 * getScoreColor(70) // => 'text-green-500' (good)
 * getScoreColor(45) // => 'text-amber-500' (medium)
 * getScoreColor(15) // => 'text-rose-500' (low)
 * ```
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-green-500';
  if (score >= 40) return 'text-amber-500';
  if (score >= 20) return 'text-orange-500';
  return 'text-rose-500';
}

/**
 * Returns Tailwind background color class based on score (0-100).
 * Used for progress bars, badges, and visual indicators.
 * 
 * @param score - Numeric score (0-100)
 * @returns Tailwind background color class
 * 
 * @example
 * ```ts
 * getScoreBgColor(85) // => 'bg-emerald-500'
 * getScoreBgColor(55) // => 'bg-amber-500'
 * ```
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-green-500';
  if (score >= 40) return 'bg-amber-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-rose-500';
}

/**
 * Calculates percentage with safe division (handles zero denominator).
 * 
 * @param value - Numerator
 * @param total - Denominator
 * @returns Percentage rounded to nearest integer (0-100)
 * 
 * @example
 * ```ts
 * percentage(75, 100) // => 75
 * percentage(3, 4) // => 75
 * percentage(5, 0) // => 0 (safe division)
 * ```
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}* @example
 * ```ts
 * truncate('Hello World', 5) // => 'Hello...'
 * truncate('Short', 10) // => 'Short'
 * truncate('Construction de bâtiment', 20) // => 'Construction de bâti...'
 * ```
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
} return `Il y a ${Math.floor(diffDays / 365)} ans`;
}

/**
 * Calculates the number of days remaining until a deadline.
 * Returns negative values for past deadlines.
 * 
 * @param deadline - Deadline date (ISO 8601 string or Date object)
 * @returns Number of days remaining (positive = future, negative = past)
 * 
 * @example
 * ```ts
 * getDaysRemaining('2024-12-31') // => 350 (if today is Jan 15, 2024)
 * getDaysRemaining('2024-01-10') // => -5 (if today is Jan 15, 2024)
 * ```
 */
export function getDaysRemaining(deadline: string | Date): number {
  const now = new Date();
  const d = new Date(deadline);
  const diffMs = d.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// Formater la taille d'un fichier
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Générer une couleur à partir d'une chaîne
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

// Obtenir les initiales
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Tronquer un texte
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Valider un email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Valider un SIRET
export function isValidSiret(siret: string): boolean {
  const cleaned = siret.replace(/\s/g, '');
  if (!/^\d{14}$/.test(cleaned)) return false;
  
  // Algorithme de Luhn
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// Formater un SIRET (avec espaces)
export function formatSiret(siret: string): string {
  const cleaned = siret.replace(/\s/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4');
}

// Débounce
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Générer un ID unique
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Slugify
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Obtenir le score de couleur (pour la jauge)
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-green-500';
  if (score >= 40) return 'text-amber-500';
  if (score >= 20) return 'text-orange-500';
  return 'text-rose-500';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-green-500';
  if (score >= 40) return 'bg-amber-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-rose-500';
}

// Calculer le pourcentage
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
