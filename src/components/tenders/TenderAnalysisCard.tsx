'use client';

import { motion } from 'framer-motion';
import {
  Sparkles,
  Calendar,
  Euro,
  Building2,
  ArrowRight,
  Clock,
  Tag,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { TenderAnalysisResult } from './TenderAIAnalysis';

interface TenderAnalysisCardProps {
  analysis: TenderAnalysisResult;
  tenderId?: string;
  onRespond?: () => void;
  compact?: boolean;
  className?: string;
}

export function TenderAnalysisCard({
  analysis,
  tenderId,
  onRespond,
  compact = false,
  className,
}: TenderAnalysisCardProps) {
  const getDaysRemaining = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const daysToDeadline = getDaysRemaining(analysis.dates.submissionDeadline);
  const isUrgent = daysToDeadline !== null && daysToDeadline <= 7 && daysToDeadline > 0;
  const isOverdue = daysToDeadline !== null && daysToDeadline <= 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (compact) {
    return (
      <Card className={cn('p-4 hover:shadow-lg transition-shadow', className)}>
        <div className="flex items-start gap-4">
          {/* Score */}
          {analysis.matchScore !== undefined && (
            <div className={cn(
              'flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center',
              getScoreColor(analysis.matchScore)
            )}>
              <span className="text-lg font-bold">{analysis.matchScore}%</span>
            </div>
          )}

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="primary" size="sm">{analysis.reference}</Badge>
              {isUrgent && (
                <Badge variant="warning" size="sm" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  J-{daysToDeadline}
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="danger" size="sm">Expiré</Badge>
              )}
            </div>
            
            <h4 className="font-semibold text-surface-900 line-clamp-1 mb-1">
              {analysis.title}
            </h4>
            
            <div className="flex items-center gap-4 text-sm text-surface-500">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {analysis.buyer.name}
              </span>
              {analysis.financials.estimatedValue && (
                <span className="flex items-center gap-1">
                  <Euro className="w-3.5 h-3.5" />
                  {analysis.financials.estimatedValue}
                </span>
              )}
            </div>
          </div>

          {/* Action */}
          {tenderId ? (
            <Link href={`/tenders/${tenderId}`}>
              <Button variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : onRespond && (
            <Button variant="primary" size="sm" onClick={onRespond}>
              Répondre
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-shadow">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" size="sm" className="bg-white/20 text-white border-white/30">
                  {analysis.reference}
                </Badge>
                <Badge variant="secondary" size="sm" className="bg-white/20 text-white border-white/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Analysé par IA
                </Badge>
              </div>
              <h3 className="font-bold text-lg line-clamp-2">{analysis.title}</h3>
            </div>
            
            {analysis.matchScore !== undefined && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-1">
                  <span className="text-2xl font-bold">{analysis.matchScore}%</span>
                </div>
                <p className="text-xs text-white/80">Compatibilité</p>
              </div>
            )}
          </div>
        </div>

        {/* Corps */}
        <div className="p-4 space-y-4">
          {/* Infos principales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-surface-400" />
              <span className="text-surface-600">{analysis.buyer.name}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Euro className="w-4 h-4 text-surface-400" />
              <span className="text-surface-600">
                {analysis.financials.estimatedValue || 'Non spécifié'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-surface-400" />
              <span className={cn(
                'text-surface-600',
                isUrgent && 'text-orange-600 font-medium',
                isOverdue && 'text-red-600 font-medium'
              )}>
                {new Date(analysis.dates.submissionDeadline).toLocaleDateString('fr-FR')}
                {daysToDeadline !== null && daysToDeadline > 0 && ` (J-${daysToDeadline})`}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-surface-400" />
              <span className="text-surface-600">
                {analysis.risks.level === 'low' && 'Risque faible'}
                {analysis.risks.level === 'medium' && 'Risque modéré'}
                {analysis.risks.level === 'high' && 'Risque élevé'}
              </span>
            </div>
          </div>

          {/* Résumé */}
          <p className="text-sm text-surface-600 line-clamp-2">
            {analysis.summary}
          </p>

          {/* Mots-clés */}
          <div className="flex flex-wrap gap-1.5">
            {analysis.keywords.slice(0, 5).map((keyword, idx) => (
              <Badge key={idx} variant="secondary" size="sm">
                {keyword}
              </Badge>
            ))}
            {analysis.keywords.length > 5 && (
              <Badge variant="secondary" size="sm">
                +{analysis.keywords.length - 5}
              </Badge>
            )}
          </div>

          {/* Critères d'attribution */}
          <div className="flex items-center gap-2">
            {analysis.awardCriteria.slice(0, 3).map((criteria, idx) => (
              <div key={idx} className="flex-1 text-center p-2 bg-surface-50 rounded-lg">
                <p className="text-xs text-surface-500">{criteria.name}</p>
                <p className="font-semibold text-primary-600">{criteria.weight}%</p>
              </div>
            ))}
          </div>

          {/* Points forts */}
          {analysis.matchDetails && analysis.matchDetails.length > 0 && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Points forts de votre profil
              </p>
              <ul className="space-y-1">
                {analysis.matchDetails.slice(0, 2).map((detail, idx) => (
                  <li key={idx} className="text-xs text-green-600 flex items-start gap-1">
                    <span className="text-green-500">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-surface-200">
            {tenderId ? (
              <>
                <Link href={`/tenders/${tenderId}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Voir les détails
                  </Button>
                </Link>
                <Link href={`/tenders/${tenderId}/respond`} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full">
                    Répondre
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </>
            ) : onRespond && (
              <Button variant="primary" size="sm" className="w-full" onClick={onRespond}>
                Répondre à cet appel d'offres
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default TenderAnalysisCard;
