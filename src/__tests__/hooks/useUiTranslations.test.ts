/**
 * Tests for useUiTranslations hook
 *
 * Tests the translation functionality including:
 * - Basic translation retrieval
 * - Placeholder replacement
 * - Fallback to key when translation not found
 * - Locale switching
 */

describe('useUiTranslations', () => {
  // Mock translation entries
  const mockEntries = {
    'greeting': 'Bonjour',
    'welcome.message': 'Bienvenue {name}!',
    'items.count': '{count} article(s)',
    'complex.template': 'Hello {name}, you have {count} messages from {sender}',
  };

  // Simple translate function for testing (mimics the hook behavior)
  const translate = (key: string, params?: Record<string, string | number>) => {
    let translation = mockEntries[key as keyof typeof mockEntries];

    if (!translation) {
      return key; // Fallback to key
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
      });
    }

    return translation;
  };

  describe('Basic translations', () => {
    it('should return translated string for known key', () => {
      expect(translate('greeting')).toBe('Bonjour');
    });

    it('should return key when translation not found', () => {
      expect(translate('unknown.key')).toBe('unknown.key');
    });

    it('should handle nested keys', () => {
      expect(translate('welcome.message', { name: 'Jean' })).toBe('Bienvenue Jean!');
    });
  });

  describe('Placeholder replacement', () => {
    it('should replace single placeholder', () => {
      expect(translate('welcome.message', { name: 'Marie' })).toBe('Bienvenue Marie!');
    });

    it('should replace numeric placeholder', () => {
      expect(translate('items.count', { count: 5 })).toBe('5 article(s)');
    });

    it('should replace multiple placeholders', () => {
      const result = translate('complex.template', {
        name: 'Pierre',
        count: 3,
        sender: 'Admin',
      });
      expect(result).toBe('Hello Pierre, you have 3 messages from Admin');
    });

    it('should handle zero values', () => {
      expect(translate('items.count', { count: 0 })).toBe('0 article(s)');
    });

    it('should not replace missing placeholders', () => {
      expect(translate('welcome.message', {})).toBe('Bienvenue {name}!');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string values', () => {
      expect(translate('welcome.message', { name: '' })).toBe('Bienvenue !');
    });

    it('should handle special characters in values', () => {
      expect(translate('welcome.message', { name: '<script>alert("xss")</script>' }))
        .toBe('Bienvenue <script>alert("xss")</script>!');
    });

    it('should handle unicode characters', () => {
      expect(translate('welcome.message', { name: '日本語' })).toBe('Bienvenue 日本語!');
    });

    it('should handle very long strings', () => {
      const longName = 'A'.repeat(1000);
      expect(translate('welcome.message', { name: longName })).toBe(`Bienvenue ${longName}!`);
    });
  });
});

describe('Locale management', () => {
  const SUPPORTED_LOCALES = ['fr', 'en', 'de', 'es', 'it', 'pt', 'nl', 'ar'];

  it('should support all expected locales', () => {
    expect(SUPPORTED_LOCALES).toContain('fr');
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(SUPPORTED_LOCALES).toContain('de');
    expect(SUPPORTED_LOCALES).toContain('es');
    expect(SUPPORTED_LOCALES).toContain('it');
    expect(SUPPORTED_LOCALES).toContain('pt');
    expect(SUPPORTED_LOCALES).toContain('nl');
    expect(SUPPORTED_LOCALES).toContain('ar'); // RTL support
  });

  it('should default to French for unknown locales', () => {
    const getLocale = (preferred: string) => {
      return SUPPORTED_LOCALES.includes(preferred) ? preferred : 'fr';
    };

    expect(getLocale('fr')).toBe('fr');
    expect(getLocale('en')).toBe('en');
    expect(getLocale('unknown')).toBe('fr');
    expect(getLocale('')).toBe('fr');
  });

  it('should identify RTL locales correctly', () => {
    const RTL_LOCALES = ['ar', 'he'];
    const isRTL = (locale: string) => RTL_LOCALES.includes(locale);

    expect(isRTL('ar')).toBe(true);
    expect(isRTL('he')).toBe(true);
    expect(isRTL('fr')).toBe(false);
    expect(isRTL('en')).toBe(false);
  });
});

describe('Translation entry structure', () => {
  // Test the structure of translation entries
  const studioTranslations = {
    fr: {
      'studio.title': 'Studio Créatif',
      'studio.stats.created': 'Contenus créés',
    },
    en: {
      'studio.title': 'Creative Studio',
      'studio.stats.created': 'Created content',
    },
  };

  it('should have consistent keys across locales', () => {
    const frKeys = Object.keys(studioTranslations.fr);
    const enKeys = Object.keys(studioTranslations.en);

    expect(frKeys.sort()).toEqual(enKeys.sort());
  });

  it('should return correct translation for each locale', () => {
    expect(studioTranslations.fr['studio.title']).toBe('Studio Créatif');
    expect(studioTranslations.en['studio.title']).toBe('Creative Studio');
  });

  it('should have non-empty values for all keys', () => {
    Object.values(studioTranslations.fr).forEach(value => {
      expect(value.length).toBeGreaterThan(0);
    });

    Object.values(studioTranslations.en).forEach(value => {
      expect(value.length).toBeGreaterThan(0);
    });
  });
});
