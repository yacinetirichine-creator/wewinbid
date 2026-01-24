'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileSearch,
  Calendar,
  MapPin,
  Euro,
  Clock,
  Tag,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Users,
  Briefcase,
  Target,
  ListChecks,
  TrendingUp,
} from 'lucide-react';
import { Button, Card, Badge, Progress } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

export interface TenderAnalysisResult {
  // Informations générales
  title: string;
  reference: string;
  buyer: {
    name: string;
    type: string;
    address?: string;
    contact?: string;
  };
  
  // Résumé IA
  summary: string;
  
  // Dates importantes
  dates: {
    publicationDate?: string;
    submissionDeadline: string;
    visitDate?: string;
    questionsDeadline?: string;
    startDate?: string;
    endDate?: string;
    duration?: string;
  };
  
  // Montant et budget
  financials: {
    estimatedValue?: string;
    budgetRange?: string;
    paymentTerms?: string;
    guarantees?: string[];
  };
  
  // Mots-clés et catégories
  keywords: string[];
  sectors: string[];
  
  // Exigences
  requirements: {
    technical: string[];
    administrative: string[];
    financial: string[];
    certifications?: string[];
  };
  
  // Lots
  lots?: {
    number: string;
    title: string;
    description: string;
    estimatedValue?: string;
  }[];
  
  // Critères d'attribution
  awardCriteria: {
    name: string;
    weight: number;
    description?: string;
  }[];
  
  // Risques et opportunités
  risks: {
    level: 'low' | 'medium' | 'high';
    items: string[];
  };
  
  opportunities: string[];
  
  // Score de compatibilité (basé sur le profil de l'entreprise)
  matchScore?: number;
  matchDetails?: string[];
  
  // Documents analysés
  analyzedDocuments: string[];
  
  // Confiance de l'analyse
  confidence: number;
}

interface TenderAIAnalysisProps {
  analysis: TenderAnalysisResult;
  onRespond: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

// Composant pour afficher une section repliable
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-surface-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-surface-50 hover:bg-surface-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary-600" />
          <span className="font-semibold text-surface-900">{title}</span>
          {badge && (
            <Badge variant="primary" size="sm">{badge}</Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-surface-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-surface-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 border-t border-surface-200">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Composant pour la jauge de compatibilité
function MatchScoreGauge({ score, t }: { score: number; t: (key: string, params?: Record<string, string | number>) => string }) {
  const getColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getBgColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-surface-200"
          />
          <motion.path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            className={getColor()}
            initial={{ strokeDasharray: '0, 100' }}
            animate={{ strokeDasharray: `${score}, 100` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-xl font-bold', getColor())}>
            {score}%
          </span>
        </div>
      </div>
      <div>
        <p className="font-semibold text-surface-900">{t('tenders.aiAnalysis.matchScore.title')}</p>
        <p className="text-sm text-surface-500">
          {score >= 80 && t('tenders.aiAnalysis.matchScore.level.excellent')}
          {score >= 60 && score < 80 && t('tenders.aiAnalysis.matchScore.level.good')}
          {score >= 40 && score < 60 && t('tenders.aiAnalysis.matchScore.level.review')}
          {score < 40 && t('tenders.aiAnalysis.matchScore.level.low')}
        </p>
      </div>
    </div>
  );
}

export function TenderAIAnalysis({
  analysis,
  onRespond,
  onDecline,
  isLoading = false,
}: TenderAIAnalysisProps) {
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      'tenders.aiAnalysis.header.aiConfidenceLabel': 'AI analysis – Confidence:',
      'tenders.aiAnalysis.header.documentsAnalyzed': '({count} documents analyzed)',

      'tenders.aiAnalysis.matchScore.title': 'Compatibility score',
      'tenders.aiAnalysis.matchScore.level.excellent': 'Excellent match with your profile',
      'tenders.aiAnalysis.matchScore.level.good': 'Strong response potential',
      'tenders.aiAnalysis.matchScore.level.review': 'Review the risks',
      'tenders.aiAnalysis.matchScore.level.low': 'Low match',

      'tenders.aiAnalysis.deadline.overdue': 'Deadline has passed!',
      'tenders.aiAnalysis.deadline.remaining': 'Only {days, plural, one {# day} other {# days}} left to respond',
      'tenders.aiAnalysis.deadline.label': 'Deadline: {date}',
      'tenders.aiAnalysis.badge.daysRemaining': 'D-{days}',

      'tenders.aiAnalysis.summary.title': 'AI summary',
      'tenders.aiAnalysis.summary.more': 'Show more',
      'tenders.aiAnalysis.summary.less': 'Show less',

      'tenders.aiAnalysis.dates.title': 'Important dates',
      'tenders.aiAnalysis.dates.submissionDeadline': 'Submission deadline',
      'tenders.aiAnalysis.dates.mandatoryVisit': 'Mandatory site visit',
      'tenders.aiAnalysis.dates.questionsDeadline': 'Questions deadline',
      'tenders.aiAnalysis.dates.startDate': 'Contract start date',
      'tenders.aiAnalysis.dates.duration': 'Contract duration',

      'tenders.aiAnalysis.keywords.title': 'Keywords & Sectors',
      'tenders.aiAnalysis.keywords.primary': 'Main keywords',
      'tenders.aiAnalysis.keywords.sectors': 'Business sectors',

      'tenders.aiAnalysis.budget.title': 'Budget & Financials',
      'tenders.aiAnalysis.budget.estimated': 'Estimated amount',
      'tenders.aiAnalysis.budget.range': 'Budget range',
      'tenders.aiAnalysis.budget.paymentTerms': 'Payment terms',
      'tenders.aiAnalysis.budget.guarantees': 'Required guarantees',

      'tenders.aiAnalysis.lots.title': 'Lots',
      'tenders.aiAnalysis.lots.badge': '{count} lot(s)',
      'tenders.aiAnalysis.lots.lotNumber': 'Lot {number}',

      'tenders.aiAnalysis.requirements.title': 'Requirements',
      'tenders.aiAnalysis.requirements.technical': 'Technical',
      'tenders.aiAnalysis.requirements.administrative': 'Administrative',
      'tenders.aiAnalysis.requirements.financial': 'Financial',
      'tenders.aiAnalysis.requirements.certifications': 'Required certifications',

      'tenders.aiAnalysis.awardCriteria.title': 'Award criteria',

      'tenders.aiAnalysis.risks.title': 'Identified risks',
      'tenders.aiAnalysis.risks.levelLabel': 'Risk level: {level}',
      'tenders.aiAnalysis.risks.level.high': 'High',
      'tenders.aiAnalysis.risks.level.medium': 'Medium',
      'tenders.aiAnalysis.risks.level.low': 'Low',

      'tenders.aiAnalysis.opportunities.title': 'Opportunities',

      'tenders.aiAnalysis.matchDetails.title': 'Compatibility analysis with your profile',

      'tenders.aiAnalysis.cta.title': 'Do you want to respond to this tender?',
      'tenders.aiAnalysis.cta.subtitle': 'Our assistant will guide you step by step to build your response.',
      'tenders.aiAnalysis.cta.decline': 'No, thanks',
      'tenders.aiAnalysis.cta.respond': 'Yes, I want to respond',
    }),
    []
  );

  const { t } = useUiTranslations(locale, entries);

  const [showFullSummary, setShowFullSummary] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getDaysRemaining = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return null;
    }
  };

  const daysToDeadline = getDaysRemaining(analysis.dates.submissionDeadline);

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et score */}
      <Card className="p-6 bg-gradient-to-br from-primary-50 to-white">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary">{analysis.reference}</Badge>
              <Badge variant="secondary">{analysis.buyer.type}</Badge>
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">
              {analysis.title}
            </h2>
            <div className="flex items-center gap-2 text-surface-600">
              <Building2 className="w-4 h-4" />
              <span>{analysis.buyer.name}</span>
            </div>
          </div>
          
          {analysis.matchScore !== undefined && (
            <MatchScoreGauge score={analysis.matchScore} t={t} />
          )}
        </div>

        {/* Confiance de l'analyse */}
        <div className="mt-4 pt-4 border-t border-surface-200">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <span className="text-surface-600">
              {t('tenders.aiAnalysis.header.aiConfidenceLabel')} <strong>{analysis.confidence}%</strong>
            </span>
            <span className="text-surface-400 ml-2">
              {t('tenders.aiAnalysis.header.documentsAnalyzed', { count: analysis.analyzedDocuments.length })}
            </span>
          </div>
        </div>
      </Card>

      {/* Alerte délai */}
      {daysToDeadline !== null && daysToDeadline <= 7 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-4 rounded-xl flex items-center gap-3',
            daysToDeadline <= 3 ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
          )}
        >
          <AlertTriangle className={cn(
            'w-5 h-5',
            daysToDeadline <= 3 ? 'text-red-500' : 'text-orange-500'
          )} />
          <div>
            <p className={cn(
              'font-semibold',
              daysToDeadline <= 3 ? 'text-red-700' : 'text-orange-700'
            )}>
              {daysToDeadline <= 0 
                ? t('tenders.aiAnalysis.deadline.overdue')
                : t('tenders.aiAnalysis.deadline.remaining', { days: daysToDeadline })
              }
            </p>
            <p className={cn(
              'text-sm',
              daysToDeadline <= 3 ? 'text-red-600' : 'text-orange-600'
            )}>
              {t('tenders.aiAnalysis.deadline.label', { date: formatDate(analysis.dates.submissionDeadline) })}
            </p>
          </div>
        </motion.div>
      )}

      {/* Résumé IA */}
      <CollapsibleSection title={t('tenders.aiAnalysis.summary.title')} icon={FileSearch} defaultOpen>
        <div className="prose prose-sm max-w-none text-surface-700">
          <p className={cn(!showFullSummary && 'line-clamp-4')}>
            {analysis.summary}
          </p>
          {analysis.summary.length > 500 && (
            <button
              onClick={() => setShowFullSummary(!showFullSummary)}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              {showFullSummary ? t('tenders.aiAnalysis.summary.less') : t('tenders.aiAnalysis.summary.more')}
            </button>
          )}
        </div>
      </CollapsibleSection>

      {/* Dates clés */}
      <CollapsibleSection 
        title={t('tenders.aiAnalysis.dates.title')} 
        icon={Calendar} 
        badge={daysToDeadline !== null && daysToDeadline > 0 ? t('tenders.aiAnalysis.badge.daysRemaining', { days: daysToDeadline }) : undefined}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.dates.submissionDeadline && (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
              <Clock className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700">{t('tenders.aiAnalysis.dates.submissionDeadline')}</p>
                <p className="text-sm text-red-600">{formatDate(analysis.dates.submissionDeadline)}</p>
              </div>
            </div>
          )}
          
          {analysis.dates.visitDate && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-700">{t('tenders.aiAnalysis.dates.mandatoryVisit')}</p>
                <p className="text-sm text-blue-600">{formatDate(analysis.dates.visitDate)}</p>
              </div>
            </div>
          )}
          
          {analysis.dates.questionsDeadline && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-700">{t('tenders.aiAnalysis.dates.questionsDeadline')}</p>
                <p className="text-sm text-yellow-600">{formatDate(analysis.dates.questionsDeadline)}</p>
              </div>
            </div>
          )}
          
          {analysis.dates.startDate && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <Calendar className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-semibold text-green-700">{t('tenders.aiAnalysis.dates.startDate')}</p>
                <p className="text-sm text-green-600">{formatDate(analysis.dates.startDate)}</p>
              </div>
            </div>
          )}
          
          {analysis.dates.duration && (
            <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-lg border border-surface-200">
              <Clock className="w-5 h-5 text-surface-500 mt-0.5" />
              <div>
                <p className="font-semibold text-surface-700">{t('tenders.aiAnalysis.dates.duration')}</p>
                <p className="text-sm text-surface-600">{analysis.dates.duration}</p>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Mots-clés */}
      <CollapsibleSection title={t('tenders.aiAnalysis.keywords.title')} icon={Tag} badge={`${analysis.keywords.length}`}>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-surface-600 mb-2">{t('tenders.aiAnalysis.keywords.primary')}</p>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.map((keyword, idx) => (
                <Badge key={idx} variant="primary" size="sm" className="bg-primary-100 text-primary-700">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-surface-600 mb-2">{t('tenders.aiAnalysis.keywords.sectors')}</p>
            <div className="flex flex-wrap gap-2">
              {analysis.sectors.map((sector, idx) => (
                <Badge key={idx} variant="secondary" size="sm">
                  {sector}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Budget */}
      <CollapsibleSection title={t('tenders.aiAnalysis.budget.title')} icon={Euro}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.financials.estimatedValue && (
            <div className="p-4 bg-surface-50 rounded-lg">
              <p className="text-sm text-surface-500">{t('tenders.aiAnalysis.budget.estimated')}</p>
              <p className="text-xl font-bold text-surface-900">{analysis.financials.estimatedValue}</p>
            </div>
          )}
          
          {analysis.financials.budgetRange && (
            <div className="p-4 bg-surface-50 rounded-lg">
              <p className="text-sm text-surface-500">{t('tenders.aiAnalysis.budget.range')}</p>
              <p className="text-xl font-bold text-surface-900">{analysis.financials.budgetRange}</p>
            </div>
          )}
          
          {analysis.financials.paymentTerms && (
            <div className="p-4 bg-surface-50 rounded-lg">
              <p className="text-sm text-surface-500">{t('tenders.aiAnalysis.budget.paymentTerms')}</p>
              <p className="font-medium text-surface-700">{analysis.financials.paymentTerms}</p>
            </div>
          )}
          
          {analysis.financials.guarantees && analysis.financials.guarantees.length > 0 && (
            <div className="p-4 bg-surface-50 rounded-lg">
              <p className="text-sm text-surface-500 mb-2">{t('tenders.aiAnalysis.budget.guarantees')}</p>
              <ul className="space-y-1">
                {analysis.financials.guarantees.map((g, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-surface-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-400" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Lots */}
      {analysis.lots && analysis.lots.length > 0 && (
        <CollapsibleSection title={t('tenders.aiAnalysis.lots.title')} icon={Briefcase} badge={t('tenders.aiAnalysis.lots.badge', { count: analysis.lots.length })}>
          <div className="space-y-3">
            {analysis.lots.map((lot, idx) => (
              <div key={idx} className="p-4 bg-surface-50 rounded-lg border border-surface-200">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" size="sm">{t('tenders.aiAnalysis.lots.lotNumber', { number: lot.number })}</Badge>
                    <h4 className="font-semibold text-surface-900 mt-2">{lot.title}</h4>
                    <p className="text-sm text-surface-600 mt-1">{lot.description}</p>
                  </div>
                  {lot.estimatedValue && (
                    <p className="text-lg font-bold text-primary-600">{lot.estimatedValue}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Exigences */}
      <CollapsibleSection title={t('tenders.aiAnalysis.requirements.title')} icon={ListChecks}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysis.requirements.technical.length > 0 && (
            <div>
              <h4 className="font-semibold text-surface-900 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                {t('tenders.aiAnalysis.requirements.technical')}
              </h4>
              <ul className="space-y-2">
                {analysis.requirements.technical.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-surface-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.requirements.administrative.length > 0 && (
            <div>
              <h4 className="font-semibold text-surface-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                {t('tenders.aiAnalysis.requirements.administrative')}
              </h4>
              <ul className="space-y-2">
                {analysis.requirements.administrative.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-surface-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.requirements.financial.length > 0 && (
            <div>
              <h4 className="font-semibold text-surface-900 mb-2 flex items-center gap-2">
                <Euro className="w-4 h-4 text-yellow-500" />
                {t('tenders.aiAnalysis.requirements.financial')}
              </h4>
              <ul className="space-y-2">
                {analysis.requirements.financial.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-surface-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.requirements.certifications && analysis.requirements.certifications.length > 0 && (
            <div>
              <h4 className="font-semibold text-surface-900 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                {t('tenders.aiAnalysis.requirements.certifications')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.requirements.certifications.map((cert, idx) => (
                  <Badge key={idx} variant="success" size="sm">{cert}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Critères d'attribution */}
      <CollapsibleSection title={t('tenders.aiAnalysis.awardCriteria.title')} icon={TrendingUp}>
        <div className="space-y-3">
          {analysis.awardCriteria.map((criteria, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-surface-900">{criteria.name}</span>
                  <span className="text-sm font-semibold text-primary-600">{criteria.weight}%</span>
                </div>
                {criteria.description && (
                  <p className="text-sm text-surface-500">{criteria.description}</p>
                )}
              </div>
              <div className="w-24 h-2 bg-surface-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${criteria.weight}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="h-full bg-primary-500 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Risques et Opportunités */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CollapsibleSection 
          title={t('tenders.aiAnalysis.risks.title')} 
          icon={AlertTriangle}
          badge={analysis.risks.level.toUpperCase()}
          defaultOpen={false}
        >
          <div className={cn(
            'p-3 rounded-lg mb-3',
            analysis.risks.level === 'high' && 'bg-red-50 border border-red-200',
            analysis.risks.level === 'medium' && 'bg-orange-50 border border-orange-200',
            analysis.risks.level === 'low' && 'bg-green-50 border border-green-200',
          )}>
            <p className={cn(
              'font-semibold',
              analysis.risks.level === 'high' && 'text-red-700',
              analysis.risks.level === 'medium' && 'text-orange-700',
              analysis.risks.level === 'low' && 'text-green-700',
            )}>
              {t('tenders.aiAnalysis.risks.levelLabel', {
                level:
                  analysis.risks.level === 'high'
                    ? t('tenders.aiAnalysis.risks.level.high')
                    : analysis.risks.level === 'medium'
                      ? t('tenders.aiAnalysis.risks.level.medium')
                      : t('tenders.aiAnalysis.risks.level.low'),
              })}
            </p>
          </div>
          <ul className="space-y-2">
            {analysis.risks.items.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-surface-700">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        <CollapsibleSection 
          title={t('tenders.aiAnalysis.opportunities.title')} 
          icon={Target}
          badge={`${analysis.opportunities.length}`}
          defaultOpen={false}
        >
          <ul className="space-y-2">
            {analysis.opportunities.map((opp, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-surface-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {opp}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      </div>

      {/* Détails de compatibilité */}
      {analysis.matchDetails && analysis.matchDetails.length > 0 && (
        <Card className="p-4 bg-primary-50 border-primary-200">
          <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            {t('tenders.aiAnalysis.matchDetails.title')}
          </h4>
          <ul className="space-y-2">
            {analysis.matchDetails.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-primary-800">
                <CheckCircle2 className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                {detail}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Call to action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="sticky bottom-0 p-6 bg-white border-t border-surface-200 -mx-6 -mb-6 mt-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-surface-900">
              {t('tenders.aiAnalysis.cta.title')}
            </h3>
            <p className="text-sm text-surface-500">
              {t('tenders.aiAnalysis.cta.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onDecline}
              disabled={isLoading}
            >
              {t('tenders.aiAnalysis.cta.decline')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={onRespond}
              disabled={isLoading}
              className="shadow-lg shadow-primary-500/25"
            >
              {t('tenders.aiAnalysis.cta.respond')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default TenderAIAnalysis;
