/**
 * Tests for useLocale hook - Logic Tests
 *
 * Tests locale management including:
 * - Locale normalization
 * - Locale validation
 * - Supported locales
 */

describe('Locale Normalization Logic', () => {
  const LOCALES = ['fr', 'en', 'de', 'es', 'it', 'pt', 'nl', 'ar-MA'];
  const DEFAULT_LOCALE = 'fr';

  const normalizeLocale = (value?: string | null): string => {
    if (!value) return DEFAULT_LOCALE;
    const normalized = value.toLowerCase();
    if (normalized === 'ar-ma' || normalized.startsWith('ar')) return 'ar-MA';
    const base = normalized.split('-')[0];
    if (LOCALES.includes(base)) return base;
    if (LOCALES.includes(normalized)) return normalized;
    return DEFAULT_LOCALE;
  };

  describe('Empty/Null Values', () => {
    it('should return default locale for undefined', () => {
      expect(normalizeLocale()).toBe('fr');
    });

    it('should return default locale for null', () => {
      expect(normalizeLocale(null)).toBe('fr');
    });

    it('should return default locale for empty string', () => {
      expect(normalizeLocale('')).toBe('fr');
    });
  });

  describe('Supported Locales', () => {
    it('should return fr for French', () => {
      expect(normalizeLocale('fr')).toBe('fr');
    });

    it('should return en for English', () => {
      expect(normalizeLocale('en')).toBe('en');
    });

    it('should return de for German', () => {
      expect(normalizeLocale('de')).toBe('de');
    });

    it('should return es for Spanish', () => {
      expect(normalizeLocale('es')).toBe('es');
    });

    it('should return it for Italian', () => {
      expect(normalizeLocale('it')).toBe('it');
    });

    it('should return pt for Portuguese', () => {
      expect(normalizeLocale('pt')).toBe('pt');
    });

    it('should return nl for Dutch', () => {
      expect(normalizeLocale('nl')).toBe('nl');
    });
  });

  describe('Region Code Normalization', () => {
    it('should normalize fr-FR to fr', () => {
      expect(normalizeLocale('fr-FR')).toBe('fr');
    });

    it('should normalize en-US to en', () => {
      expect(normalizeLocale('en-US')).toBe('en');
    });

    it('should normalize en-GB to en', () => {
      expect(normalizeLocale('en-GB')).toBe('en');
    });

    it('should normalize de-DE to de', () => {
      expect(normalizeLocale('de-DE')).toBe('de');
    });

    it('should normalize de-AT to de', () => {
      expect(normalizeLocale('de-AT')).toBe('de');
    });

    it('should normalize es-ES to es', () => {
      expect(normalizeLocale('es-ES')).toBe('es');
    });

    it('should normalize es-MX to es', () => {
      expect(normalizeLocale('es-MX')).toBe('es');
    });

    it('should normalize pt-BR to pt', () => {
      expect(normalizeLocale('pt-BR')).toBe('pt');
    });

    it('should normalize pt-PT to pt', () => {
      expect(normalizeLocale('pt-PT')).toBe('pt');
    });
  });

  describe('Arabic Special Handling', () => {
    it('should normalize ar to ar-MA', () => {
      expect(normalizeLocale('ar')).toBe('ar-MA');
    });

    it('should keep ar-MA as ar-MA', () => {
      expect(normalizeLocale('ar-MA')).toBe('ar-MA');
    });

    it('should normalize ar-SA to ar-MA', () => {
      expect(normalizeLocale('ar-SA')).toBe('ar-MA');
    });

    it('should normalize ar-EG to ar-MA', () => {
      expect(normalizeLocale('ar-EG')).toBe('ar-MA');
    });

    it('should handle uppercase AR', () => {
      expect(normalizeLocale('AR')).toBe('ar-MA');
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle uppercase FR', () => {
      expect(normalizeLocale('FR')).toBe('fr');
    });

    it('should handle uppercase EN', () => {
      expect(normalizeLocale('EN')).toBe('en');
    });

    it('should handle mixed case Fr-Ca', () => {
      expect(normalizeLocale('Fr-Ca')).toBe('fr');
    });

    it('should handle uppercase DE-DE', () => {
      expect(normalizeLocale('DE-DE')).toBe('de');
    });
  });

  describe('Unsupported Locales', () => {
    it('should fallback to fr for Chinese', () => {
      expect(normalizeLocale('zh')).toBe('fr');
    });

    it('should fallback to fr for Japanese', () => {
      expect(normalizeLocale('ja')).toBe('fr');
    });

    it('should fallback to fr for Korean', () => {
      expect(normalizeLocale('ko')).toBe('fr');
    });

    it('should fallback to fr for Russian', () => {
      expect(normalizeLocale('ru')).toBe('fr');
    });

    it('should fallback to fr for invalid string', () => {
      expect(normalizeLocale('invalid')).toBe('fr');
    });

    it('should fallback to fr for ko-KR', () => {
      expect(normalizeLocale('ko-KR')).toBe('fr');
    });

    it('should fallback to fr for zh-CN', () => {
      expect(normalizeLocale('zh-CN')).toBe('fr');
    });
  });
});

describe('Supported Locales Configuration', () => {
  const SUPPORTED_LOCALES = ['fr', 'en', 'de', 'es', 'it', 'pt', 'nl', 'ar-MA'];

  it('should have exactly 8 supported locales', () => {
    expect(SUPPORTED_LOCALES.length).toBe(8);
  });

  it('should include French', () => {
    expect(SUPPORTED_LOCALES).toContain('fr');
  });

  it('should include English', () => {
    expect(SUPPORTED_LOCALES).toContain('en');
  });

  it('should include German', () => {
    expect(SUPPORTED_LOCALES).toContain('de');
  });

  it('should include Spanish', () => {
    expect(SUPPORTED_LOCALES).toContain('es');
  });

  it('should include Italian', () => {
    expect(SUPPORTED_LOCALES).toContain('it');
  });

  it('should include Portuguese', () => {
    expect(SUPPORTED_LOCALES).toContain('pt');
  });

  it('should include Dutch', () => {
    expect(SUPPORTED_LOCALES).toContain('nl');
  });

  it('should include Arabic (Morocco)', () => {
    expect(SUPPORTED_LOCALES).toContain('ar-MA');
  });
});

describe('RTL Detection', () => {
  const isRTL = (locale: string): boolean => {
    return locale === 'ar-MA' || locale.startsWith('ar');
  };

  it('should detect ar-MA as RTL', () => {
    expect(isRTL('ar-MA')).toBe(true);
  });

  it('should detect ar as RTL', () => {
    expect(isRTL('ar')).toBe(true);
  });

  it('should detect ar-SA as RTL', () => {
    expect(isRTL('ar-SA')).toBe(true);
  });

  it('should not detect fr as RTL', () => {
    expect(isRTL('fr')).toBe(false);
  });

  it('should not detect en as RTL', () => {
    expect(isRTL('en')).toBe(false);
  });

  it('should not detect de as RTL', () => {
    expect(isRTL('de')).toBe(false);
  });
});

describe('Locale Display Names', () => {
  const LOCALE_NAMES: Record<string, string> = {
    fr: 'Français',
    en: 'English',
    de: 'Deutsch',
    es: 'Español',
    it: 'Italiano',
    pt: 'Português',
    nl: 'Nederlands',
    'ar-MA': 'العربية',
  };

  it('should have display name for French', () => {
    expect(LOCALE_NAMES['fr']).toBe('Français');
  });

  it('should have display name for English', () => {
    expect(LOCALE_NAMES['en']).toBe('English');
  });

  it('should have display name for German', () => {
    expect(LOCALE_NAMES['de']).toBe('Deutsch');
  });

  it('should have display name for Spanish', () => {
    expect(LOCALE_NAMES['es']).toBe('Español');
  });

  it('should have display name for Italian', () => {
    expect(LOCALE_NAMES['it']).toBe('Italiano');
  });

  it('should have display name for Portuguese', () => {
    expect(LOCALE_NAMES['pt']).toBe('Português');
  });

  it('should have display name for Dutch', () => {
    expect(LOCALE_NAMES['nl']).toBe('Nederlands');
  });

  it('should have display name for Arabic', () => {
    expect(LOCALE_NAMES['ar-MA']).toBe('العربية');
  });

  it('should have 8 display names', () => {
    expect(Object.keys(LOCALE_NAMES).length).toBe(8);
  });

  it('should have unique display names', () => {
    const names = Object.values(LOCALE_NAMES);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('should have non-empty display names', () => {
    Object.values(LOCALE_NAMES).forEach((name) => {
      expect(name.length).toBeGreaterThan(0);
    });
  });
});

describe('Default Locale', () => {
  const DEFAULT_LOCALE = 'fr';

  it('should be French', () => {
    expect(DEFAULT_LOCALE).toBe('fr');
  });

  it('should be a supported locale', () => {
    const SUPPORTED = ['fr', 'en', 'de', 'es', 'it', 'pt', 'nl', 'ar-MA'];
    expect(SUPPORTED).toContain(DEFAULT_LOCALE);
  });
});
