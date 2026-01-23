'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  MapPin,
  Briefcase,
  Target,
  FileText,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  Award,
  Loader2,
  LogOut,
  Clock,
  Eye,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card, CardContent, Badge, Alert } from '@/components/ui';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

// Secteurs d'activité
const SECTORS = [
  { value: 'security', labelKey: 'onboarding.sectors.security', icon: '🛡️' },
  { value: 'electronic_security', labelKey: 'onboarding.sectors.electronicSecurity', icon: '📹' },
  { value: 'construction', labelKey: 'onboarding.sectors.construction', icon: '🏗️' },
  { value: 'cleaning', labelKey: 'onboarding.sectors.cleaning', icon: '🧹' },
  { value: 'it_services', labelKey: 'onboarding.sectors.itServices', icon: '💻' },
  { value: 'software', labelKey: 'onboarding.sectors.software', icon: '👨‍💻' },
  { value: 'consulting', labelKey: 'onboarding.sectors.consulting', icon: '📊' },
  { value: 'logistics', labelKey: 'onboarding.sectors.logistics', icon: '🚚' },
  { value: 'maintenance', labelKey: 'onboarding.sectors.maintenance', icon: '🔧' },
  { value: 'energy', labelKey: 'onboarding.sectors.energy', icon: '⚡' },
  { value: 'healthcare', labelKey: 'onboarding.sectors.healthcare', icon: '🏥' },
  { value: 'food', labelKey: 'onboarding.sectors.food', icon: '🍽️' },
  { value: 'training', labelKey: 'onboarding.sectors.training', icon: '📚' },
  { value: 'communication', labelKey: 'onboarding.sectors.communication', icon: '📣' },
  { value: 'engineering', labelKey: 'onboarding.sectors.engineering', icon: '📐' },
  { value: 'other', labelKey: 'onboarding.sectors.other', icon: '📦' },
];

// Tailles d'entreprise
const COMPANY_SIZES = [
  { value: '1', labelKey: 'onboarding.companySize.selfEmployed', employeesKey: 'onboarding.companySize.selfEmployed.employees' },
  { value: '2-10', labelKey: 'onboarding.companySize.tpe', employeesKey: 'onboarding.companySize.tpe.employees' },
  { value: '11-50', labelKey: 'onboarding.companySize.pme', employeesKey: 'onboarding.companySize.pme.employees' },
  { value: '51-250', labelKey: 'onboarding.companySize.eti', employeesKey: 'onboarding.companySize.eti.employees' },
  { value: '251-1000', labelKey: 'onboarding.companySize.large', employeesKey: 'onboarding.companySize.large.employees' },
  { value: '1000+', labelKey: 'onboarding.companySize.group', employeesKey: 'onboarding.companySize.group.employees' },
];

// Zones géographiques
const GEOGRAPHIC_ZONES = [
  { value: 'local', labelKey: 'onboarding.zones.local', descriptionKey: 'onboarding.zones.local.desc' },
  { value: 'regional', labelKey: 'onboarding.zones.regional', descriptionKey: 'onboarding.zones.regional.desc' },
  { value: 'national', labelKey: 'onboarding.zones.national', descriptionKey: 'onboarding.zones.national.desc' },
  { value: 'european', labelKey: 'onboarding.zones.european', descriptionKey: 'onboarding.zones.european.desc' },
  { value: 'international', labelKey: 'onboarding.zones.international', descriptionKey: 'onboarding.zones.international.desc' },
];

// Types de marchés
const MARKET_TYPES = [
  { value: 'public', labelKey: 'onboarding.marketTypes.public', descriptionKey: 'onboarding.marketTypes.public.desc' },
  { value: 'private', labelKey: 'onboarding.marketTypes.private', descriptionKey: 'onboarding.marketTypes.private.desc' },
  { value: 'both', labelKey: 'onboarding.marketTypes.both', descriptionKey: 'onboarding.marketTypes.both.desc' },
];

// Certifications courantes
const CERTIFICATIONS = [
  { value: 'iso9001', labelKey: 'onboarding.certifications.iso9001' },
  { value: 'iso14001', labelKey: 'onboarding.certifications.iso14001' },
  { value: 'iso45001', labelKey: 'onboarding.certifications.iso45001' },
  { value: 'mase', labelKey: 'onboarding.certifications.mase' },
  { value: 'qualibat', labelKey: 'onboarding.certifications.qualibat' },
  { value: 'qualifelec', labelKey: 'onboarding.certifications.qualifelec' },
  { value: 'rge', labelKey: 'onboarding.certifications.rge' },
  { value: 'apsad', labelKey: 'onboarding.certifications.apsad' },
  { value: 'cnaps', labelKey: 'onboarding.certifications.cnaps' },
  { value: 'cnil', labelKey: 'onboarding.certifications.rgpd' },
  { value: 'other', labelKey: 'onboarding.certifications.other' },
];

const STEPS = [
  { id: 1, titleKey: 'onboarding.steps.company', icon: Building2 },
  { id: 2, titleKey: 'onboarding.steps.activity', icon: Briefcase },
  { id: 3, titleKey: 'onboarding.steps.targets', icon: Target },
  { id: 4, titleKey: 'onboarding.steps.keywords', icon: Sparkles },
];

export default function OnboardingPage() {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'onboarding.exploreFirst': "Explorer d'abord",
      'onboarding.timeRemaining': '({time} restantes)',
      'onboarding.logout': 'Déconnexion',
      'onboarding.title': 'Configuration de votre entreprise',
      'onboarding.subtitle': "Ces informations permettent à notre IA de vous recommander les meilleurs appels d'offres",
      'onboarding.explorationNotice': 'Vous avez {time} pour explorer avant de configurer votre entreprise',
      'onboarding.explorationEnded': "Votre période d'exploration est terminée. Veuillez configurer votre entreprise pour continuer.",

      'onboarding.steps.company': 'Entreprise',
      'onboarding.steps.activity': 'Activité',
      'onboarding.steps.targets': 'Cibles',
      'onboarding.steps.keywords': 'Mots-clés',

      'onboarding.step1.title': "Informations de l'entreprise",
      'onboarding.step1.subtitle': 'Renseignez les informations de base',
      'onboarding.step1.companyName.label': "Nom de l'entreprise *",
      'onboarding.step1.companyName.placeholder': 'Ma Société SAS',
      'onboarding.step1.siret.label': 'SIRET',
      'onboarding.step1.siret.placeholder': '12345678901234',
      'onboarding.step1.siret.hint': '14 chiffres (optionnel)',
      'onboarding.step1.phone.label': 'Téléphone',
      'onboarding.step1.phone.placeholder': '+33 1 23 45 67 89',
      'onboarding.step1.address.label': 'Adresse',
      'onboarding.step1.address.placeholder': '123 rue de la Paix',
      'onboarding.step1.postalCode.label': 'Code postal',
      'onboarding.step1.postalCode.placeholder': '75001',
      'onboarding.step1.city.label': 'Ville',
      'onboarding.step1.city.placeholder': 'Paris',
      'onboarding.step1.website.label': 'Site web',
      'onboarding.step1.website.placeholder': 'https://www.monsite.fr',

      'onboarding.step2.title': 'Votre activité',
      'onboarding.step2.subtitle': 'Secteurs, taille et certifications',
      'onboarding.step2.sectors.label': "Secteurs d'activité *",
      'onboarding.step2.companySize.label': "Taille de l'entreprise *",
      'onboarding.step2.certifications.label': 'Certifications (optionnel)',
      'onboarding.step2.description.label': "Description de l'activité",
      'onboarding.step2.description.placeholder': 'Décrivez brièvement votre activité, vos spécialités...',

      'onboarding.step3.title': 'Vos cibles',
      'onboarding.step3.subtitle': 'Zones et types de marchés recherchés',
      'onboarding.step3.zones.label': 'Zones géographiques *',
      'onboarding.step3.marketTypes.label': 'Types de marchés *',
      'onboarding.step3.budget.label': 'Budget des marchés ciblés (optionnel)',
      'onboarding.step3.minBudget.label': 'Budget minimum (€)',
      'onboarding.step3.minBudget.placeholder': '10000',
      'onboarding.step3.maxBudget.label': 'Budget maximum (€)',
      'onboarding.step3.maxBudget.placeholder': '500000',

      'onboarding.step4.title': 'Mots-clés et compétences',
      'onboarding.step4.subtitle': 'Aidez notre IA à trouver les meilleurs AO pour vous',
      'onboarding.step4.keywords.label': 'Mots-clés de recherche',
      'onboarding.step4.keywords.help': "Ajoutez des mots-clés que l'IA utilisera pour identifier les appels d'offres pertinents",
      'onboarding.step4.keywordInput.placeholder': 'Ex: vidéosurveillance, React, audit...',
      'onboarding.step4.keywordAdd': 'Ajouter',
      'onboarding.step4.keywordEmpty': 'Aucun mot-clé ajouté',
      'onboarding.step4.competencies.label': 'Compétences et références clés',
      'onboarding.step4.competencies.placeholder':
        "Décrivez vos compétences clés, références importantes, technologies maîtrisées...\n\nEx: 10 ans d'expérience en sécurité incendie, références ministères, maîtrise React/Node.js...",

      'onboarding.ai.title': 'Configuration IA',
      'onboarding.ai.intro': 'Notre IA utilisera ces informations pour :',
      'onboarding.ai.b1': "Vous recommander les appels d'offres les plus pertinents",
      'onboarding.ai.b2': 'Calculer votre score de compatibilité',
      'onboarding.ai.b3': 'Générer des documents adaptés à votre profil',
      'onboarding.ai.b4': 'Analyser vos chances de succès',

      'onboarding.nav.back': 'Retour',
      'onboarding.nav.next': 'Continuer',
      'onboarding.nav.submitting': 'Configuration...',
      'onboarding.nav.submit': 'Terminer la configuration',
      'onboarding.footer.editLater': 'Vous pourrez modifier ces informations plus tard dans les paramètres',

      'onboarding.errors.companyNameRequired': "Le nom de l'entreprise est requis",
      'onboarding.errors.siretInvalid': 'Le SIRET doit contenir 14 chiffres',
      'onboarding.errors.sectorRequired': "Sélectionnez au moins un secteur d'activité",
      'onboarding.errors.companySizeRequired': "Sélectionnez la taille de votre entreprise",
      'onboarding.errors.zoneRequired': 'Sélectionnez au moins une zone géographique',
      'onboarding.errors.marketTypeRequired': 'Sélectionnez au moins un type de marché',
      'onboarding.errors.generic': 'Une erreur est survenue',

      'onboarding.sectors.security': 'Sécurité privée',
      'onboarding.sectors.electronicSecurity': 'Sécurité électronique',
      'onboarding.sectors.construction': 'BTP / Construction',
      'onboarding.sectors.cleaning': 'Propreté / Nettoyage',
      'onboarding.sectors.itServices': 'Services informatiques',
      'onboarding.sectors.software': 'Développement logiciel',
      'onboarding.sectors.consulting': 'Conseil / Consulting',
      'onboarding.sectors.logistics': 'Logistique / Transport',
      'onboarding.sectors.maintenance': 'Maintenance industrielle',
      'onboarding.sectors.energy': 'Énergie / Environnement',
      'onboarding.sectors.healthcare': 'Santé / Médical',
      'onboarding.sectors.food': 'Restauration / Traiteur',
      'onboarding.sectors.training': 'Formation',
      'onboarding.sectors.communication': 'Communication / Marketing',
      'onboarding.sectors.engineering': 'Ingénierie / Études',
      'onboarding.sectors.other': 'Autre',

      'onboarding.companySize.selfEmployed': 'Auto-entrepreneur',
      'onboarding.companySize.selfEmployed.employees': '1 personne',
      'onboarding.companySize.tpe': 'TPE',
      'onboarding.companySize.tpe.employees': '2-10 salariés',
      'onboarding.companySize.pme': 'PME',
      'onboarding.companySize.pme.employees': '11-50 salariés',
      'onboarding.companySize.eti': 'ETI',
      'onboarding.companySize.eti.employees': '51-250 salariés',
      'onboarding.companySize.large': 'Grande entreprise',
      'onboarding.companySize.large.employees': '251-1000 salariés',
      'onboarding.companySize.group': 'Groupe',
      'onboarding.companySize.group.employees': '1000+ salariés',

      'onboarding.zones.local': 'Local',
      'onboarding.zones.local.desc': 'Département',
      'onboarding.zones.regional': 'Régional',
      'onboarding.zones.regional.desc': 'Région',
      'onboarding.zones.national': 'National',
      'onboarding.zones.national.desc': 'France entière',
      'onboarding.zones.european': 'Européen',
      'onboarding.zones.european.desc': 'Union Européenne',
      'onboarding.zones.international': 'International',
      'onboarding.zones.international.desc': 'Monde entier',

      'onboarding.marketTypes.public': 'Marchés publics',
      'onboarding.marketTypes.public.desc': 'État, collectivités, hôpitaux...',
      'onboarding.marketTypes.private': 'Marchés privés',
      'onboarding.marketTypes.private.desc': 'Entreprises, groupes...',
      'onboarding.marketTypes.both': 'Les deux',
      'onboarding.marketTypes.both.desc': 'Public et privé',

      'onboarding.certifications.iso9001': 'ISO 9001',
      'onboarding.certifications.iso14001': 'ISO 14001',
      'onboarding.certifications.iso45001': 'ISO 45001',
      'onboarding.certifications.mase': 'MASE',
      'onboarding.certifications.qualibat': 'Qualibat',
      'onboarding.certifications.qualifelec': 'Qualifelec',
      'onboarding.certifications.rge': 'RGE',
      'onboarding.certifications.apsad': 'APSAD',
      'onboarding.certifications.cnaps': 'CNAPS',
      'onboarding.certifications.rgpd': 'Conformité RGPD',
      'onboarding.certifications.other': 'Autre certification',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [explorationTimeRemaining, setExplorationTimeRemaining] = useState<number | null>(null);
  const [canSkip, setCanSkip] = useState(true);

  // Step 1: Entreprise
  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Step 2: Activité
  const [sectors, setSectors] = useState<string[]>([]);
  const [companySize, setCompanySize] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  // Step 3: Cibles
  const [geographicZones, setGeographicZones] = useState<string[]>([]);
  const [marketTypes, setMarketTypes] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  // Step 4: Mots-clés
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [competencies, setCompetencies] = useState('');

  // Vérifier l'authentification et la période d'exploration
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId(user.id);

      // Vérifier si l'entreprise existe déjà
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('company_id, created_at, onboarding_skipped_at')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        // Entreprise déjà configurée, rediriger vers dashboard
        router.push('/dashboard');
        return;
      }

      // Calculer le temps restant pour l'exploration (24h depuis la création ou le skip)
      const skipDate = profile?.onboarding_skipped_at || profile?.created_at;
      if (skipDate) {
        const skipTime = new Date(skipDate).getTime();
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const remaining = twentyFourHours - (now - skipTime);
        
        if (remaining > 0) {
          setExplorationTimeRemaining(remaining);
          setCanSkip(true);
        } else {
          // Les 24h sont écoulées, l'utilisateur doit compléter l'onboarding
          setCanSkip(false);
          setExplorationTimeRemaining(0);
        }
      } else {
        // Première visite, peut explorer
        setCanSkip(true);
      }
    };
    checkAuth();
  }, [getSupabase, router]);

  // Fonction de déconnexion
  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Fonction pour explorer l'application (skip temporaire)
  const handleExplore = async () => {
    if (!canSkip) return;
    
    setLoading(true);
    try {
      const supabase = getSupabase();
      
      // Enregistrer la date du skip pour le compte à rebours
      await (supabase as any)
        .from('profiles')
        .update({ onboarding_skipped_at: new Date().toISOString() })
        .eq('id', userId);
      
      router.push('/dashboard?explore=true');
    } catch (err) {
      console.error('Error skipping onboarding:', err);
      router.push('/dashboard?explore=true');
    } finally {
      setLoading(false);
    }
  };

  // Formater le temps restant
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} minutes`;
  };

  const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, value: string) => {
    if (array.includes(value)) {
      setArray(array.filter(v => v !== value));
    } else {
      setArray([...array, value]);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const validateStep = (stepNum: number): boolean => {
    setError(null);
    
    switch (stepNum) {
      case 1:
        if (!companyName) {
          setError(t('onboarding.errors.companyNameRequired'));
          return false;
        }
        if (siret && (siret.length !== 14 || !/^\d+$/.test(siret))) {
          setError(t('onboarding.errors.siretInvalid'));
          return false;
        }
        return true;
      case 2:
        if (sectors.length === 0) {
          setError(t('onboarding.errors.sectorRequired'));
          return false;
        }
        if (!companySize) {
          setError(t('onboarding.errors.companySizeRequired'));
          return false;
        }
        return true;
      case 3:
        if (geographicZones.length === 0) {
          setError(t('onboarding.errors.zoneRequired'));
          return false;
        }
        if (marketTypes.length === 0) {
          setError(t('onboarding.errors.marketTypeRequired'));
          return false;
        }
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      // Créer l'entreprise avec toutes les données pour l'IA
      const { data: company, error: companyError } = await (supabase as any)
        .from('companies')
        .insert({
          name: companyName,
          siret: siret || null,
          address: address || null,
          city: city || null,
          postal_code: postalCode || null,
          phone: phone || null,
          website: website || null,
          description: description || null,
          sectors: sectors,
          certifications: certifications,
          employee_count: companySize ? parseInt(companySize.split('-')[0]) : null,
          // Données de ciblage pour l'IA
          geographic_zones: geographicZones,
          market_types: marketTypes,
          keywords: keywords,
          min_budget: minBudget ? parseInt(minBudget) : null,
          max_budget: maxBudget ? parseInt(maxBudget) : null,
          competencies: competencies || null,
          // Métadonnées supplémentaires (fallback si colonnes non créées)
          metadata: {
            geographic_zones: geographicZones,
            market_types: marketTypes,
            min_budget: minBudget ? parseInt(minBudget) : null,
            max_budget: maxBudget ? parseInt(maxBudget) : null,
            keywords: keywords,
            competencies: competencies,
            company_size_category: companySize,
            onboarding_completed: true,
            onboarding_date: new Date().toISOString(),
          }
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Lier l'utilisateur à l'entreprise et marquer l'onboarding comme complété
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({ 
          company_id: company.id,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Ajouter l'utilisateur comme membre de l'entreprise (admin)
      await (supabase as any)
        .from('company_members')
        .insert({
          company_id: company.id,
          user_id: userId,
          role: 'admin',
        });

      // Rediriger vers le dashboard
      router.push('/dashboard?welcome=true');

    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || t('onboarding.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Bouton de déconnexion en haut à droite */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {canSkip && (
          <button
            onClick={handleExplore}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">{t('onboarding.exploreFirst')}</span>
            {explorationTimeRemaining && explorationTimeRemaining > 0 && (
              <span className="text-xs text-amber-400 ml-1">
                {t('onboarding.timeRemaining', { time: formatTimeRemaining(explorationTimeRemaining) })}
              </span>
            )}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t('onboarding.logout')}</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">WeWinBid</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('onboarding.title')}</h1>
          <p className="text-slate-400">{t('onboarding.subtitle')}</p>
          
          {/* Message de période d'exploration */}
          {canSkip && explorationTimeRemaining && explorationTimeRemaining > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-sm">
              <Clock className="w-4 h-4" />
              <span>{t('onboarding.explorationNotice', { time: formatTimeRemaining(explorationTimeRemaining) })}</span>
            </div>
          )}
          
          {/* Message quand les 24h sont écoulées */}
          {!canSkip && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
              <Clock className="w-4 h-4" />
              <span>{t('onboarding.explorationEnded')}</span>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                step === s.id 
                  ? 'bg-indigo-500 text-white' 
                  : step > s.id 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-white/5 text-slate-500'
              }`}>
                {step > s.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium hidden sm:inline">{t(s.titleKey)}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  step > s.id ? 'bg-emerald-500' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-8">
            {error && (
              <Alert type="error" className="mb-6">
                {error}
              </Alert>
            )}

            <AnimatePresence mode="wait">
              {/* Step 1: Entreprise */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">{t('onboarding.step1.title')}</h2>
                    <p className="text-slate-400">{t('onboarding.step1.subtitle')}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label={t('onboarding.step1.companyName.label')}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={t('onboarding.step1.companyName.placeholder')}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <Input
                      label={t('onboarding.step1.siret.label')}
                      value={siret}
                      onChange={(e) => setSiret(e.target.value.replace(/\s/g, ''))}
                      placeholder={t('onboarding.step1.siret.placeholder')}
                      hint={t('onboarding.step1.siret.hint')}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                    <Input
                      label={t('onboarding.step1.phone.label')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('onboarding.step1.phone.placeholder')}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                    <Input
                      label={t('onboarding.step1.address.label')}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('onboarding.step1.address.placeholder')}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label={t('onboarding.step1.postalCode.label')}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder={t('onboarding.step1.postalCode.placeholder')}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Input
                        label={t('onboarding.step1.city.label')}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t('onboarding.step1.city.placeholder')}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <Input
                      label={t('onboarding.step1.website.label')}
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder={t('onboarding.step1.website.placeholder')}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2: Activité */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">{t('onboarding.step2.title')}</h2>
                    <p className="text-slate-400">{t('onboarding.step2.subtitle')}</p>
                  </div>

                  {/* Secteurs */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">{t('onboarding.step2.sectors.label')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {SECTORS.map((sector) => (
                        <button
                          key={sector.value}
                          type="button"
                          onClick={() => toggleArrayItem(sectors, setSectors, sector.value)}
                          className={`p-3 rounded-lg border transition-all text-left ${
                            sectors.includes(sector.value)
                              ? 'bg-indigo-500/20 border-indigo-500 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          <span className="text-lg mr-2">{sector.icon}</span>
                          <span className="text-sm">{t(sector.labelKey)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Taille */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">{t('onboarding.step2.companySize.label')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {COMPANY_SIZES.map((size) => (
                        <button
                          key={size.value}
                          type="button"
                          onClick={() => setCompanySize(size.value)}
                          className={`p-3 rounded-lg border transition-all text-left ${
                            companySize === size.value
                              ? 'bg-indigo-500/20 border-indigo-500 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          <div className="font-medium">{t(size.labelKey)}</div>
                          <div className="text-xs opacity-70">{t(size.employeesKey)}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">{t('onboarding.step2.certifications.label')}</label>
                    <div className="flex flex-wrap gap-2">
                      {CERTIFICATIONS.map((cert) => (
                        <button
                          key={cert.value}
                          type="button"
                          onClick={() => toggleArrayItem(certifications, setCertifications, cert.value)}
                          className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                            certifications.includes(cert.value)
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          {t(cert.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">{t('onboarding.step2.description.label')}</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('onboarding.step2.description.placeholder')}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Cibles */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">{t('onboarding.step3.title')}</h2>
                    <p className="text-slate-400">{t('onboarding.step3.subtitle')}</p>
                  </div>

                  {/* Zones géographiques */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">{t('onboarding.step3.zones.label')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {GEOGRAPHIC_ZONES.map((zone) => (
                        <button
                          key={zone.value}
                          type="button"
                          onClick={() => toggleArrayItem(geographicZones, setGeographicZones, zone.value)}
                          className={`p-3 rounded-lg border transition-all text-center ${
                            geographicZones.includes(zone.value)
                              ? 'bg-indigo-500/20 border-indigo-500 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          <div className="font-medium">{t(zone.labelKey)}</div>
                          <div className="text-xs opacity-70">{t(zone.descriptionKey)}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Types de marchés */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">{t('onboarding.step3.marketTypes.label')}</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {MARKET_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => toggleArrayItem(marketTypes, setMarketTypes, type.value)}
                          className={`p-4 rounded-lg border transition-all text-left ${
                            marketTypes.includes(type.value)
                              ? 'bg-indigo-500/20 border-indigo-500 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          <div className="font-medium">{t(type.labelKey)}</div>
                          <div className="text-sm opacity-70">{t(type.descriptionKey)}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget cible */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">{t('onboarding.step3.budget.label')}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label={t('onboarding.step3.minBudget.label')}
                        type="number"
                        value={minBudget}
                        onChange={(e) => setMinBudget(e.target.value)}
                        placeholder={t('onboarding.step3.minBudget.placeholder')}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Input
                        label={t('onboarding.step3.maxBudget.label')}
                        type="number"
                        value={maxBudget}
                        onChange={(e) => setMaxBudget(e.target.value)}
                        placeholder={t('onboarding.step3.maxBudget.placeholder')}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Mots-clés */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">{t('onboarding.step4.title')}</h2>
                    <p className="text-slate-400">{t('onboarding.step4.subtitle')}</p>
                  </div>

                  {/* Mots-clés */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      <Sparkles className="w-4 h-4 inline mr-2 text-amber-400" />
                      {t('onboarding.step4.keywords.label')}
                    </label>
                    <p className="text-sm text-slate-400 mb-3">
                      {t('onboarding.step4.keywords.help')}
                    </p>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                        placeholder={t('onboarding.step4.keywordInput.placeholder')}
                        className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Button type="button" onClick={addKeyword} variant="primary">
                        {t('onboarding.step4.keywordAdd')}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword) => (
                        <button
                          key={keyword}
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-sm cursor-pointer hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-colors"
                        >
                          {keyword}
                          <span className="ml-2 opacity-60">×</span>
                        </button>
                      ))}
                      {keywords.length === 0 && (
                        <span className="text-slate-500 text-sm">{t('onboarding.step4.keywordEmpty')}</span>
                      )}
                    </div>
                  </div>

                  {/* Compétences spécifiques */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">{t('onboarding.step4.competencies.label')}</label>
                    <textarea
                      value={competencies}
                      onChange={(e) => setCompetencies(e.target.value)}
                      placeholder={t('onboarding.step4.competencies.placeholder')}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Résumé */}
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <h3 className="font-medium text-emerald-400 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {t('onboarding.ai.title')}
                    </h3>
                    <p className="text-sm text-slate-300">
                      {t('onboarding.ai.intro')}
                    </p>
                    <ul className="text-sm text-slate-400 mt-2 space-y-1">
                      <li>• {t('onboarding.ai.b1')}</li>
                      <li>• {t('onboarding.ai.b2')}</li>
                      <li>• {t('onboarding.ai.b3')}</li>
                      <li>• {t('onboarding.ai.b4')}</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack} className="border-white/20 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('onboarding.nav.back')}
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button type="button" variant="primary" onClick={handleNext}>
                  {t('onboarding.nav.next')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500"
                >
                  {loading ? t('onboarding.nav.submitting') : t('onboarding.nav.submit')}
                  {!loading && <Check className="w-4 h-4 ml-2" />}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          {t('onboarding.footer.editLater')}
        </p>
      </motion.div>
    </div>
  );
}
