'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Target, Sparkles } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { getDaysRemaining } from '@/lib/utils';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

interface MatchedTender {
  tender_id: string;
  title: string;
  buyer_name: string;
  country: string;
  sector: string;
  deadline: string;
  match_score: number;
  created_at: string;
}

interface MatchedTendersWidgetProps {
  minScore?: number;
  limit?: number;
}

export function MatchedTendersWidget({ minScore = 70, limit = 10 }: MatchedTendersWidgetProps) {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'matchedTenders.title.full': 'Recommended tenders',
      'matchedTenders.title.short': 'Recommended',

      'matchedTenders.empty.title': 'No matching tenders',
      'matchedTenders.empty.subtitle': 'Try lowering the minimum score or update your preferences',
      'matchedTenders.empty.cta': 'Configure my preferences',

      'matchedTenders.deadline': 'Deadline: {date}',
      'matchedTenders.daysRemaining': '({days}d remaining)',

      'matchedTenders.score.excellent': 'Excellent',
      'matchedTenders.score.good': 'Good',
      'matchedTenders.score.average': 'Average',
      'matchedTenders.score.low': 'Low',

      'matchedTenders.reason.sector': 'Sector',
      'matchedTenders.reason.country': 'Country',
      'matchedTenders.reason.keywords': 'Keywords',
      'matchedTenders.reason.partial': 'Partial match',

      'matchedTenders.viewAll': 'View all recommended tenders',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const [tenders, setTenders] = useState<MatchedTender[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScore, setSelectedScore] = useState(minScore);

  const fetchMatchedTenders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/matched-tenders?min_score=${selectedScore}&limit=${limit}`);
      const data = await response.json();
      setTenders(data.tenders || []);
    } catch (error) {
      console.error('Error fetching matched tenders:', error);
    }
    setLoading(false);
  }, [limit, selectedScore]);

  useEffect(() => {
    fetchMatchedTenders();
  }, [fetchMatchedTenders]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return t('matchedTenders.score.excellent');
    if (score >= 75) return t('matchedTenders.score.good');
    if (score >= 60) return t('matchedTenders.score.average');
    return t('matchedTenders.score.low');
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{t('matchedTenders.title.full')}</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{t('matchedTenders.title.short')}</h3>
          <Badge variant="primary">{tenders.length}</Badge>
        </div>
        
        {/* Score filter */}
        <div className="flex gap-2">
          {[70, 80, 90].map((score) => (
            <button
              key={score}
              onClick={() => setSelectedScore(score)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedScore === score
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {score}%+
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {tenders.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('matchedTenders.empty.title')}</p>
            <p className="text-sm text-gray-400 mt-1">
              {t('matchedTenders.empty.subtitle')}
            </p>
            <Link href="/settings?tab=matching">
              <Button variant="secondary" className="mt-3">
                {t('matchedTenders.empty.cta')}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {tenders.map((tender, index) => (
              <motion.div
                key={tender.tender_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/tenders/${tender.tender_id}`}>
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {tender.title}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            {tender.buyer_name}
                          </span>
                          <span>{tender.sector}</span>
                          <span className="font-medium">{tender.country}</span>
                        </div>

                        {tender.deadline && (
                          <div className="text-xs text-gray-400">
                            {t('matchedTenders.deadline', {
                              date: new Date(tender.deadline).toLocaleDateString(locale),
                            })}
                            {(() => {
                              const days = getDaysRemaining(tender.deadline);
                              return days !== null
                                ? ` ${t('matchedTenders.daysRemaining', { days })}`
                                : '';
                            })()}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(tender.match_score)}`}>
                          {tender.match_score}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {getScoreLabel(tender.match_score)}
                        </div>
                      </div>
                    </div>

                    {/* Match reasons (visual) */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      {tender.match_score >= 90 && (
                        <>
                          <Badge variant="success" size="sm">{t('matchedTenders.reason.sector')}</Badge>
                          <Badge variant="success" size="sm">{t('matchedTenders.reason.country')}</Badge>
                          <Badge variant="success" size="sm">{t('matchedTenders.reason.keywords')}</Badge>
                        </>
                      )}
                      {tender.match_score >= 75 && tender.match_score < 90 && (
                        <>
                          <Badge variant="primary" size="sm">{t('matchedTenders.reason.sector')}</Badge>
                          <Badge variant="primary" size="sm">{t('matchedTenders.reason.country')}</Badge>
                        </>
                      )}
                      {tender.match_score < 75 && (
                        <Badge variant="secondary" size="sm">{t('matchedTenders.reason.partial')}</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {tenders.length >= limit && (
              <Link href="/marketplace">
                <Button variant="secondary" className="w-full mt-3">
                  {t('matchedTenders.viewAll')}
                </Button>
              </Link>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
