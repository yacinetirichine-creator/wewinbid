import { formatCurrency, formatDate, getDaysRemaining, cn } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('formats numbers as EUR currency', () => {
      expect(formatCurrency(1000)).toMatch(/1[\s\u00A0]000/);
      expect(formatCurrency(1000)).toContain('€');
    });

    it('handles zero', () => {
      expect(formatCurrency(0)).toContain('0');
    });

    it('handles large numbers', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('€');
    });

    it('handles decimals', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('€');
    });

    it('handles negative numbers', () => {
      const result = formatCurrency(-500);
      expect(result).toContain('-');
    });
  });

  describe('formatDate', () => {
    it('formats date strings', () => {
      const result = formatDate('2026-01-22');
      expect(result).toBeTruthy();
    });

    it('formats Date objects', () => {
      const date = new Date('2026-01-22');
      const result = formatDate(date.toISOString());
      expect(result).toBeTruthy();
    });

    it('handles invalid dates gracefully', () => {
      const result = formatDate('invalid-date');
      expect(result).toBeTruthy();
    });
  });

  describe('getDaysRemaining', () => {
    it('returns positive days for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const result = getDaysRemaining(futureDate.toISOString());
      expect(result).toBeGreaterThanOrEqual(4);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('returns negative days for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const result = getDaysRemaining(pastDate.toISOString());
      expect(result).toBeLessThan(0);
    });

    it('returns 0 or 1 for today', () => {
      const today = new Date().toISOString();
      const result = getDaysRemaining(today);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('handles null/undefined gracefully', () => {
      const result = getDaysRemaining(null as any);
      expect(result).toBeNull();
    });
  });

  describe('cn (className merge)', () => {
    it('merges class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('handles conditional classes', () => {
      const result = cn('base', true && 'included', false && 'excluded');
      expect(result).toContain('base');
      expect(result).toContain('included');
      expect(result).not.toContain('excluded');
    });

    it('handles undefined and null', () => {
      const result = cn('class1', undefined, null, 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('deduplicates tailwind classes', () => {
      const result = cn('p-4', 'p-6');
      expect(result).not.toContain('p-4');
      expect(result).toContain('p-6');
    });

    it('handles arrays', () => {
      const result = cn(['class1', 'class2']);
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('handles empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });
});
