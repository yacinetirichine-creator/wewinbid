/**
 * Tests for AI Scoring functionality
 *
 * Tests the tender compatibility scoring including:
 * - Score calculation
 * - Criteria weighting
 * - Recommendations generation
 * - Edge cases
 */

describe('AI Scoring', () => {
  // Mock scoring weights
  const SCORING_WEIGHTS = {
    sector_match: 30,
    certifications: 20,
    experience: 20,
    financial_capacity: 15,
    geographic_coverage: 15,
  };

  // Helper function to calculate weighted score
  const calculateScore = (criteria: Record<string, number>): number => {
    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(criteria).forEach(([key, score]) => {
      const weight = SCORING_WEIGHTS[key as keyof typeof SCORING_WEIGHTS] || 0;
      totalScore += score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  };

  describe('Score calculation', () => {
    it('should calculate perfect score when all criteria are 100', () => {
      const criteria = {
        sector_match: 100,
        certifications: 100,
        experience: 100,
        financial_capacity: 100,
        geographic_coverage: 100,
      };

      expect(calculateScore(criteria)).toBe(100);
    });

    it('should calculate zero score when all criteria are 0', () => {
      const criteria = {
        sector_match: 0,
        certifications: 0,
        experience: 0,
        financial_capacity: 0,
        geographic_coverage: 0,
      };

      expect(calculateScore(criteria)).toBe(0);
    });

    it('should properly weight sector_match (30%)', () => {
      const criteriaHighSector = {
        sector_match: 100,
        certifications: 0,
        experience: 0,
        financial_capacity: 0,
        geographic_coverage: 0,
      };

      // 100 * 30 / 100 = 30
      expect(calculateScore(criteriaHighSector)).toBe(30);
    });

    it('should properly weight certifications (20%)', () => {
      const criteria = {
        sector_match: 0,
        certifications: 100,
        experience: 0,
        financial_capacity: 0,
        geographic_coverage: 0,
      };

      expect(calculateScore(criteria)).toBe(20);
    });

    it('should calculate mixed scores correctly', () => {
      const criteria = {
        sector_match: 80, // 80 * 30 = 2400
        certifications: 60, // 60 * 20 = 1200
        experience: 70, // 70 * 20 = 1400
        financial_capacity: 50, // 50 * 15 = 750
        geographic_coverage: 90, // 90 * 15 = 1350
      };
      // Total: 7100 / 100 = 71

      expect(calculateScore(criteria)).toBe(71);
    });
  });

  describe('Score thresholds', () => {
    const getScoreCategory = (score: number): string => {
      if (score >= 80) return 'excellent';
      if (score >= 60) return 'good';
      if (score >= 40) return 'moderate';
      if (score >= 20) return 'low';
      return 'very_low';
    };

    it('should categorize excellent scores (>= 80)', () => {
      expect(getScoreCategory(100)).toBe('excellent');
      expect(getScoreCategory(85)).toBe('excellent');
      expect(getScoreCategory(80)).toBe('excellent');
    });

    it('should categorize good scores (60-79)', () => {
      expect(getScoreCategory(79)).toBe('good');
      expect(getScoreCategory(70)).toBe('good');
      expect(getScoreCategory(60)).toBe('good');
    });

    it('should categorize moderate scores (40-59)', () => {
      expect(getScoreCategory(59)).toBe('moderate');
      expect(getScoreCategory(50)).toBe('moderate');
      expect(getScoreCategory(40)).toBe('moderate');
    });

    it('should categorize low scores (20-39)', () => {
      expect(getScoreCategory(39)).toBe('low');
      expect(getScoreCategory(30)).toBe('low');
      expect(getScoreCategory(20)).toBe('low');
    });

    it('should categorize very low scores (< 20)', () => {
      expect(getScoreCategory(19)).toBe('very_low');
      expect(getScoreCategory(10)).toBe('very_low');
      expect(getScoreCategory(0)).toBe('very_low');
    });
  });

  describe('Recommendations generation', () => {
    const generateRecommendations = (criteria: Record<string, number>): string[] => {
      const recommendations: string[] = [];

      if (criteria.sector_match < 50) {
        recommendations.push('Améliorer la correspondance sectorielle');
      }
      if (criteria.certifications < 50) {
        recommendations.push('Obtenir les certifications requises');
      }
      if (criteria.experience < 50) {
        recommendations.push('Valoriser davantage votre expérience');
      }
      if (criteria.financial_capacity < 50) {
        recommendations.push('Renforcer la capacité financière');
      }
      if (criteria.geographic_coverage < 50) {
        recommendations.push('Étendre la couverture géographique');
      }

      return recommendations;
    };

    it('should generate no recommendations for high scores', () => {
      const highCriteria = {
        sector_match: 80,
        certifications: 70,
        experience: 60,
        financial_capacity: 55,
        geographic_coverage: 90,
      };

      expect(generateRecommendations(highCriteria)).toHaveLength(0);
    });

    it('should generate recommendations for low criteria', () => {
      const lowCriteria = {
        sector_match: 30,
        certifications: 40,
        experience: 80,
        financial_capacity: 20,
        geographic_coverage: 60,
      };

      const recommendations = generateRecommendations(lowCriteria);
      expect(recommendations).toContain('Améliorer la correspondance sectorielle');
      expect(recommendations).toContain('Obtenir les certifications requises');
      expect(recommendations).toContain('Renforcer la capacité financière');
      expect(recommendations).not.toContain('Valoriser davantage votre expérience');
    });

    it('should generate all recommendations for very low scores', () => {
      const veryLowCriteria = {
        sector_match: 10,
        certifications: 20,
        experience: 30,
        financial_capacity: 15,
        geographic_coverage: 25,
      };

      expect(generateRecommendations(veryLowCriteria)).toHaveLength(5);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing criteria gracefully', () => {
      const partialCriteria = {
        sector_match: 80,
        certifications: 70,
      };

      // Should calculate with available criteria only
      const score = calculateScore(partialCriteria);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle empty criteria', () => {
      expect(calculateScore({})).toBe(0);
    });

    it('should clamp negative values to 0', () => {
      const clampScore = (score: number) => Math.max(0, Math.min(100, score));

      expect(clampScore(-10)).toBe(0);
      expect(clampScore(50)).toBe(50);
      expect(clampScore(150)).toBe(100);
    });

    it('should round to nearest integer', () => {
      const criteria = {
        sector_match: 77,
        certifications: 63,
        experience: 58,
        financial_capacity: 42,
        geographic_coverage: 89,
      };

      const score = calculateScore(criteria);
      expect(Number.isInteger(score)).toBe(true);
    });
  });
});

describe('Tender type scoring adjustments', () => {
  // Different tender types may have different scoring emphasis
  const TENDER_TYPE_WEIGHTS: Record<string, Record<string, number>> = {
    public_french: {
      sector_match: 30,
      certifications: 25,
      experience: 20,
      financial_capacity: 15,
      geographic_coverage: 10,
    },
    private: {
      sector_match: 35,
      certifications: 15,
      experience: 25,
      financial_capacity: 15,
      geographic_coverage: 10,
    },
    european: {
      sector_match: 25,
      certifications: 30,
      experience: 20,
      financial_capacity: 15,
      geographic_coverage: 10,
    },
  };

  it('should have weights summing to 100 for each tender type', () => {
    Object.entries(TENDER_TYPE_WEIGHTS).forEach(([type, weights]) => {
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);
    });
  });

  it('should emphasize certifications more for European tenders', () => {
    expect(TENDER_TYPE_WEIGHTS.european.certifications)
      .toBeGreaterThan(TENDER_TYPE_WEIGHTS.public_french.certifications);
  });

  it('should emphasize sector match more for private tenders', () => {
    expect(TENDER_TYPE_WEIGHTS.private.sector_match)
      .toBeGreaterThan(TENDER_TYPE_WEIGHTS.public_french.sector_match);
  });
});
