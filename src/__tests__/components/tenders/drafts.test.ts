/**
 * Tests for Drafts/Ongoing Tenders functionality
 *
 * Tests the draft tender management including:
 * - Status filtering
 * - Progress calculation
 * - Deadline urgency
 * - Search functionality
 */

describe('Draft Tender Status', () => {
  const DRAFT_STATUSES = ['DRAFT', 'ANALYSIS', 'IN_PROGRESS', 'REVIEW'];

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Brouillon', color: 'text-slate-600' },
    ANALYSIS: { label: 'En analyse', color: 'text-blue-600' },
    IN_PROGRESS: { label: 'En cours', color: 'text-amber-600' },
    REVIEW: { label: 'En révision', color: 'text-purple-600' },
  };

  it('should define all draft statuses', () => {
    DRAFT_STATUSES.forEach(status => {
      expect(STATUS_CONFIG).toHaveProperty(status);
    });
  });

  it('should have French labels for all statuses', () => {
    expect(STATUS_CONFIG.DRAFT.label).toBe('Brouillon');
    expect(STATUS_CONFIG.ANALYSIS.label).toBe('En analyse');
    expect(STATUS_CONFIG.IN_PROGRESS.label).toBe('En cours');
    expect(STATUS_CONFIG.REVIEW.label).toBe('En révision');
  });

  it('should filter tenders by status correctly', () => {
    const mockTenders = [
      { id: '1', status: 'DRAFT', title: 'Tender 1' },
      { id: '2', status: 'ANALYSIS', title: 'Tender 2' },
      { id: '3', status: 'IN_PROGRESS', title: 'Tender 3' },
      { id: '4', status: 'SUBMITTED', title: 'Tender 4' },
      { id: '5', status: 'WON', title: 'Tender 5' },
    ];

    const drafts = mockTenders.filter(t => DRAFT_STATUSES.includes(t.status));
    expect(drafts).toHaveLength(3);
    expect(drafts.map(d => d.id)).toEqual(['1', '2', '3']);
  });
});

describe('Progress Calculation', () => {
  it('should calculate completion percentage correctly', () => {
    const mockResponse = {
      total_steps: 5,
      completed_steps: 3,
    };

    const completion = Math.round((mockResponse.completed_steps / mockResponse.total_steps) * 100);
    expect(completion).toBe(60);
  });

  it('should handle 0% completion', () => {
    const completion = Math.round((0 / 5) * 100);
    expect(completion).toBe(0);
  });

  it('should handle 100% completion', () => {
    const completion = Math.round((5 / 5) * 100);
    expect(completion).toBe(100);
  });

  it('should categorize progress correctly', () => {
    const getProgressCategory = (percentage: number): string => {
      if (percentage >= 80) return 'high';
      if (percentage >= 50) return 'medium';
      return 'low';
    };

    expect(getProgressCategory(90)).toBe('high');
    expect(getProgressCategory(80)).toBe('high');
    expect(getProgressCategory(60)).toBe('medium');
    expect(getProgressCategory(50)).toBe('medium');
    expect(getProgressCategory(30)).toBe('low');
    expect(getProgressCategory(0)).toBe('low');
  });

  it('should return correct color class for progress', () => {
    const getProgressColor = (percentage: number): string => {
      if (percentage >= 80) return 'bg-green-500';
      if (percentage >= 50) return 'bg-blue-500';
      return 'bg-amber-500';
    };

    expect(getProgressColor(85)).toBe('bg-green-500');
    expect(getProgressColor(65)).toBe('bg-blue-500');
    expect(getProgressColor(30)).toBe('bg-amber-500');
  });
});

describe('Deadline Urgency', () => {
  const getDaysUntilDeadline = (deadline: string): number => {
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyLevel = (days: number): 'critical' | 'urgent' | 'normal' | 'expired' => {
    if (days < 0) return 'expired';
    if (days <= 3) return 'critical';
    if (days <= 7) return 'urgent';
    return 'normal';
  };

  it('should detect expired deadlines', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const days = getDaysUntilDeadline(yesterday.toISOString());

    expect(days).toBeLessThan(0);
    expect(getUrgencyLevel(days)).toBe('expired');
  });

  it('should detect critical urgency (< 3 days)', () => {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const days = getDaysUntilDeadline(twoDaysFromNow.toISOString());

    expect(days).toBeLessThanOrEqual(3);
    expect(getUrgencyLevel(days)).toBe('critical');
  });

  it('should detect urgent level (3-7 days)', () => {
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    const days = getDaysUntilDeadline(fiveDaysFromNow.toISOString());

    expect(days).toBeGreaterThan(3);
    expect(days).toBeLessThanOrEqual(7);
    expect(getUrgencyLevel(days)).toBe('urgent');
  });

  it('should detect normal level (> 7 days)', () => {
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    const days = getDaysUntilDeadline(twoWeeksFromNow.toISOString());

    expect(days).toBeGreaterThan(7);
    expect(getUrgencyLevel(days)).toBe('normal');
  });

  it('should format deadline message correctly', () => {
    const formatDeadlineMessage = (days: number): string => {
      if (days < 0) return 'Échéance dépassée';
      if (days === 0) return "Aujourd'hui";
      if (days === 1) return 'Demain';
      return `${days} jours`;
    };

    expect(formatDeadlineMessage(-1)).toBe('Échéance dépassée');
    expect(formatDeadlineMessage(0)).toBe("Aujourd'hui");
    expect(formatDeadlineMessage(1)).toBe('Demain');
    expect(formatDeadlineMessage(5)).toBe('5 jours');
    expect(formatDeadlineMessage(30)).toBe('30 jours');
  });
});

describe('Search Functionality', () => {
  const mockDrafts = [
    { id: '1', title: 'Marché vidéosurveillance', reference: 'AO-2024-001', buyer_name: 'Ville de Paris' },
    { id: '2', title: 'Travaux de rénovation', reference: 'AO-2024-002', buyer_name: 'Conseil Régional' },
    { id: '3', title: 'Fourniture informatique', reference: 'AO-2024-003', buyer_name: 'Ministère' },
    { id: '4', title: 'Sécurité privée', reference: 'SEC-2024-001', buyer_name: 'Ville de Lyon' },
  ];

  const searchDrafts = (drafts: typeof mockDrafts, query: string) => {
    const lowerQuery = query.toLowerCase();
    return drafts.filter(draft =>
      draft.title.toLowerCase().includes(lowerQuery) ||
      draft.reference?.toLowerCase().includes(lowerQuery) ||
      draft.buyer_name?.toLowerCase().includes(lowerQuery)
    );
  };

  it('should find drafts by title', () => {
    const results = searchDrafts(mockDrafts, 'vidéo');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('should find drafts by reference', () => {
    const results = searchDrafts(mockDrafts, 'AO-2024-002');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('2');
  });

  it('should find drafts by buyer name', () => {
    const results = searchDrafts(mockDrafts, 'Paris');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('should be case insensitive', () => {
    const results1 = searchDrafts(mockDrafts, 'MINISTÈRE');
    const results2 = searchDrafts(mockDrafts, 'ministère');

    expect(results1).toEqual(results2);
    expect(results1).toHaveLength(1);
  });

  it('should return all drafts for empty query', () => {
    const results = searchDrafts(mockDrafts, '');
    expect(results).toHaveLength(mockDrafts.length);
  });

  it('should return empty array for no matches', () => {
    const results = searchDrafts(mockDrafts, 'nonexistent');
    expect(results).toHaveLength(0);
  });

  it('should find multiple matches', () => {
    const results = searchDrafts(mockDrafts, 'Ville');
    expect(results).toHaveLength(2); // Paris and Lyon
  });
});

describe('Status Filter', () => {
  const mockDrafts = [
    { id: '1', status: 'DRAFT' },
    { id: '2', status: 'DRAFT' },
    { id: '3', status: 'ANALYSIS' },
    { id: '4', status: 'IN_PROGRESS' },
    { id: '5', status: 'REVIEW' },
  ];

  const filterByStatus = (drafts: typeof mockDrafts, status: string) => {
    if (status === 'all') return drafts;
    return drafts.filter(d => d.status === status);
  };

  it('should return all drafts when filter is "all"', () => {
    expect(filterByStatus(mockDrafts, 'all')).toHaveLength(5);
  });

  it('should filter by DRAFT status', () => {
    expect(filterByStatus(mockDrafts, 'DRAFT')).toHaveLength(2);
  });

  it('should filter by ANALYSIS status', () => {
    expect(filterByStatus(mockDrafts, 'ANALYSIS')).toHaveLength(1);
  });

  it('should filter by IN_PROGRESS status', () => {
    expect(filterByStatus(mockDrafts, 'IN_PROGRESS')).toHaveLength(1);
  });

  it('should filter by REVIEW status', () => {
    expect(filterByStatus(mockDrafts, 'REVIEW')).toHaveLength(1);
  });

  it('should return empty for unknown status', () => {
    expect(filterByStatus(mockDrafts, 'UNKNOWN')).toHaveLength(0);
  });
});
