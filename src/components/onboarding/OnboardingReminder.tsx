'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Building2,
  Clock,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  Target,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, Badge, Progress } from '@/components/ui';

interface OnboardingReminderProps {
  /** Callback quand l'utilisateur clique pour compléter */
  onComplete?: () => void;
  /** Afficher en mode compact (sidebar) ou en mode banner (dashboard) */
  variant?: 'banner' | 'compact' | 'sidebar';
}

interface OnboardingStatus {
  isComplete: boolean;
  hasCompany: boolean;
  completionPercentage: number;
  timeRemaining: number | null; // en ms, null si pas de limite
  canSkip: boolean;
  missingSteps: string[];
}

export function OnboardingReminder({ onComplete, variant = 'banner' }: OnboardingReminderProps) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);

  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Vérifier le statut de l'onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Récupérer le profil avec les informations de l'entreprise
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select(`
            company_id,
            first_name,
            last_name,
            phone,
            created_at,
            onboarding_skipped_at,
            onboarding_completed
          `)
          .eq('id', user.id)
          .single();

        // Si l'onboarding est complété, ne rien afficher
        if (profile?.onboarding_completed) {
          setStatus({ 
            isComplete: true, 
            hasCompany: true,
            completionPercentage: 100,
            timeRemaining: null,
            canSkip: true,
            missingSteps: []
          });
          setLoading(false);
          return;
        }

        // Vérifier si l'entreprise existe
        let companyData = null;
        if (profile?.company_id) {
          const { data: company } = await (supabase as any)
            .from('companies')
            .select('name, siret, sectors, geographic_zones, keywords')
            .eq('id', profile.company_id)
            .single();
          companyData = company;
        }

        // Calculer le pourcentage de complétion
        const missingSteps: string[] = [];
        let completedSteps = 0;
        const totalSteps = 5;

        // Étape 1: Nom de l'entreprise
        if (companyData?.name) {
          completedSteps++;
        } else {
          missingSteps.push('Nom de l\'entreprise');
        }

        // Étape 2: SIRET
        if (companyData?.siret) {
          completedSteps++;
        } else {
          missingSteps.push('Numéro SIRET');
        }

        // Étape 3: Secteurs d'activité
        if (companyData?.sectors?.length > 0) {
          completedSteps++;
        } else {
          missingSteps.push('Secteurs d\'activité');
        }

        // Étape 4: Zones géographiques
        if (companyData?.geographic_zones?.length > 0) {
          completedSteps++;
        } else {
          missingSteps.push('Zones géographiques');
        }

        // Étape 5: Mots-clés
        if (companyData?.keywords?.length > 0) {
          completedSteps++;
        } else {
          missingSteps.push('Mots-clés de recherche');
        }

        const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

        // Calculer le temps restant pour l'exploration
        let timeRemaining: number | null = null;
        let canSkip = true;

        if (!profile?.company_id) {
          const skipDate = profile?.onboarding_skipped_at || profile?.created_at;
          if (skipDate) {
            const skipTime = new Date(skipDate).getTime();
            const now = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            const remaining = twentyFourHours - (now - skipTime);
            
            if (remaining > 0) {
              timeRemaining = remaining;
              canSkip = true;
            } else {
              timeRemaining = 0;
              canSkip = false;
            }
          }
        }

        setStatus({
          isComplete: completionPercentage === 100,
          hasCompany: !!profile?.company_id,
          completionPercentage,
          timeRemaining,
          canSkip,
          missingSteps,
        });
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();

    // Actualiser toutes les minutes pour le compte à rebours
    const interval = setInterval(checkOnboardingStatus, 60000);
    return () => clearInterval(interval);
  }, [getSupabase]);

  // Formater le temps restant
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  // Ne rien afficher si loading, complété ou dismissed
  if (loading || status?.isComplete || dismissed) {
    return null;
  }

  // Variant Banner (pour le dashboard)
  if (variant === 'banner') {
    const timeRemaining = status?.timeRemaining;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6"
        >
          <Card className="overflow-hidden border-2 border-primary-200 bg-gradient-to-r from-primary-50 via-white to-secondary-50">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Icon et texte principal */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl shadow-lg shadow-primary-500/25 flex-shrink-0">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-surface-900">
                        Configurez votre profil entreprise
                      </h3>
                      {timeRemaining != null && timeRemaining > 0 && (
                        <Badge variant="warning" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeRemaining(timeRemaining)} restantes
                        </Badge>
                      )}
                      {timeRemaining === 0 && (
                        <Badge variant="danger" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Configuration requise
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-surface-600 text-sm mb-4">
                      Notre IA a besoin de connaître votre entreprise pour vous proposer les meilleurs appels d'offres 
                      et générer des documents parfaitement adaptés à votre activité.
                    </p>

                    {/* Barre de progression */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-surface-500">Progression</span>
                        <span className="font-semibold text-primary-600">{status?.completionPercentage || 0}%</span>
                      </div>
                      <Progress value={status?.completionPercentage || 0} className="h-2" />
                    </div>

                    {/* Éléments manquants */}
                    {status?.missingSteps && status.missingSteps.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {status.missingSteps.slice(0, 3).map((step, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-xs text-surface-500 bg-surface-100 px-2 py-1 rounded-full">
                            <Target className="w-3 h-3" />
                            {step}
                          </span>
                        ))}
                        {status.missingSteps.length > 3 && (
                          <span className="text-xs text-surface-400">
                            +{status.missingSteps.length - 3} autres
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 lg:flex-col">
                  <Link href="/onboarding">
                    <Button 
                      variant="primary" 
                      className="w-full shadow-lg shadow-primary-500/25"
                      onClick={onComplete}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Configurer maintenant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  
                  {status?.canSkip && status?.timeRemaining !== 0 && (
                    <button
                      onClick={() => setDismissed(true)}
                      className="text-sm text-surface-500 hover:text-surface-700 transition-colors"
                    >
                      Plus tard
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Variant Compact (pour les sidebars ou petits espaces)
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-200"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-900 truncate">
              Profil incomplet
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={status?.completionPercentage || 0} className="h-1.5 flex-1" />
              <span className="text-xs font-semibold text-primary-600">
                {status?.completionPercentage || 0}%
              </span>
            </div>
          </div>
        </div>
        
        <Link href="/onboarding" className="block mt-3">
          <Button variant="primary" size="sm" className="w-full">
            Compléter
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </motion.div>
    );
  }

  // Variant Sidebar (pour intégration dans la sidebar)
  if (variant === 'sidebar') {
    const timeRemaining = status?.timeRemaining;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-3 mb-3 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200"
      >
        <div className="flex items-start gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Configurez votre profil
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              L'IA sera plus précise avec vos informations
            </p>
          </div>
        </div>
        
        {timeRemaining != null && timeRemaining > 0 && (
          <div className="flex items-center gap-1 text-xs text-amber-600 mb-2">
            <Clock className="w-3 h-3" />
            <span>{formatTimeRemaining(timeRemaining)} restantes</span>
          </div>
        )}
        
        <Link href="/onboarding">
          <Button variant="primary" size="sm" className="w-full">
            Configurer
          </Button>
        </Link>
      </motion.div>
    );
  }

  return null;
}

export default OnboardingReminder;
