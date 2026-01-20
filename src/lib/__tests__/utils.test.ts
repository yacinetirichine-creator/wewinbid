/**
 * @jest-environment node
 */

import {
  cn,
  formatCurrency,
  formatCompact,
  formatDate,
  formatRelativeDate,
  getDaysRemaining,
  formatFileSize,
  stringToColor,
  getInitials,
  truncate,
  isValidEmail,
  isValidSiret,
  formatSiret,
  debounce,
  generateId,
  slugify,
  getScoreColor,
  getScoreBgColor,
  percentage,
} from '../utils';

describe('utils', () => {
  describe('cn - Tailwind class merger', () => {
    it('should merge classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('should handle conditional classes', () => {
      expect(cn('text-red-500', false && 'text-blue-500')).toBe('text-red-500');
      expect(cn('text-red-500', true && 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('formatCurrency', () => {
    it('should format EUR by default', () => {
      expect(formatCurrency(150000)).toBe('150 000 €');
    });

    it('should format USD', () => {
      expect(formatCurrency(1500, 'USD', 'en-US')).toBe('$1,500');
    });

    it('should format GBP', () => {
      expect(formatCurrency(2500, 'GBP', 'en-GB')).toBe('£2,500');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('0 €');
    });
  });

  describe('formatCompact', () => {
    it('should format large numbers', () => {
      const result = formatCompact(1500000, 'fr-FR');
      expect(result).toMatch(/1[.,]5\s*M/);
    });

    it('should format thousands', () => {
      const result = formatCompact(850000, 'fr-FR');
      expect(result).toMatch(/850\s*k/);
    });
  });

  describe('formatDate', () => {
    it('should format date in French', () => {
      const result = formatDate('2024-12-25');
      expect(result).toBe('25 décembre 2024');
    });

    it('should format date in English', () => {
      const result = formatDate('2024-12-25', { day: 'numeric', month: 'long', year: 'numeric' }, 'en-US');
      expect(result).toBe('December 25, 2024');
    });
  });

  describe('formatRelativeDate', () => {
    it('should return "Aujourd\'hui" for today', () => {
      const today = new Date();
      expect(formatRelativeDate(today)).toBe("Aujourd'hui");
    });

    it('should return "Hier" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatRelativeDate(yesterday)).toBe('Hier');
    });

    it('should return days for recent dates', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      expect(formatRelativeDate(fiveDaysAgo)).toBe('Il y a 5 jours');
    });
  });

  describe('getDaysRemaining', () => {
    it('should calculate days remaining correctly', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(getDaysRemaining(tomorrow)).toBe(1);
    });

    it('should return negative for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getDaysRemaining(yesterday)).toBeLessThan(0);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format KB', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format MB', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
    });

    it('should format GB', () => {
      expect(formatFileSize(5368709120)).toBe('5 GB');
    });
  });

  describe('stringToColor', () => {
    it('should generate consistent colors', () => {
      const color1 = stringToColor('John Doe');
      const color2 = stringToColor('John Doe');
      expect(color1).toBe(color2);
    });

    it('should generate different colors for different strings', () => {
      const color1 = stringToColor('Alice');
      const color2 = stringToColor('Bob');
      expect(color1).not.toBe(color2);
    });

    it('should return HSL format', () => {
      const color = stringToColor('Test');
      expect(color).toMatch(/^hsl\(\d+,\s*65%,\s*50%\)$/);
    });
  });

  describe('getInitials', () => {
    it('should extract initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should handle single name', () => {
      expect(getInitials('Marie')).toBe('M');
    });

    it('should handle multiple names', () => {
      expect(getInitials('Jean-Paul Sartre')).toBe('JS');
    });

    it('should return max 2 characters', () => {
      expect(getInitials('First Middle Last')).toBe('FM');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should handle exact length', () => {
      expect(truncate('12345', 5)).toBe('12345');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('isValidSiret', () => {
    it('should validate correct SIRET', () => {
      // Valid SIRET with Luhn check
      expect(isValidSiret('73282932000074')).toBe(true);
      expect(isValidSiret('732 829 320 00074')).toBe(true);
    });

    it('should reject invalid length', () => {
      expect(isValidSiret('123456789')).toBe(false);
    });

    it('should reject non-numeric', () => {
      expect(isValidSiret('ABCD1234567890')).toBe(false);
    });
  });

  describe('formatSiret', () => {
    it('should format SIRET with spaces', () => {
      expect(formatSiret('73282932000074')).toBe('732 829 320 00074');
    });

    it('should handle already formatted SIRET', () => {
      expect(formatSiret('732 829 320 00074')).toBe('732 829 320 00074');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should generate alphanumeric strings', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('slugify', () => {
    it('should convert to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should remove accents', () => {
      expect(slugify('Hôpital Saint-André')).toBe('hopital-saint-andre');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('Appel d\'Offres 2024')).toBe('appel-d-offres-2024');
    });

    it('should remove extra spaces', () => {
      expect(slugify('  Extra   Spaces  ')).toBe('extra-spaces');
    });

    it('should handle special characters', () => {
      expect(slugify('Test@#$%123')).toBe('test-123');
    });
  });

  describe('getScoreColor', () => {
    it('should return emerald for excellent scores', () => {
      expect(getScoreColor(95)).toBe('text-emerald-500');
      expect(getScoreColor(80)).toBe('text-emerald-500');
    });

    it('should return green for good scores', () => {
      expect(getScoreColor(70)).toBe('text-green-500');
      expect(getScoreColor(60)).toBe('text-green-500');
    });

    it('should return amber for medium scores', () => {
      expect(getScoreColor(45)).toBe('text-amber-500');
      expect(getScoreColor(40)).toBe('text-amber-500');
    });

    it('should return orange for low scores', () => {
      expect(getScoreColor(25)).toBe('text-orange-500');
      expect(getScoreColor(20)).toBe('text-orange-500');
    });

    it('should return rose for very low scores', () => {
      expect(getScoreColor(15)).toBe('text-rose-500');
      expect(getScoreColor(0)).toBe('text-rose-500');
    });
  });

  describe('getScoreBgColor', () => {
    it('should return correct background colors', () => {
      expect(getScoreBgColor(85)).toBe('bg-emerald-500');
      expect(getScoreBgColor(65)).toBe('bg-green-500');
      expect(getScoreBgColor(45)).toBe('bg-amber-500');
      expect(getScoreBgColor(25)).toBe('bg-orange-500');
      expect(getScoreBgColor(10)).toBe('bg-rose-500');
    });
  });

  describe('percentage', () => {
    it('should calculate percentage correctly', () => {
      expect(percentage(75, 100)).toBe(75);
      expect(percentage(3, 4)).toBe(75);
      expect(percentage(1, 3)).toBe(33);
    });

    it('should handle zero denominator', () => {
      expect(percentage(5, 0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(percentage(2, 3)).toBe(67);
    });
  });
});
