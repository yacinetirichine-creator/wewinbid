'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card, CardContent, Badge, Alert } from '@/components/ui';

// Secteurs d'activité
const SECTORS = [
  { value: 'security', label: 'Sécurité privée', icon: '🛡️' },
  { value: 'electronic_security', label: 'Sécurité électronique', icon: '📹' },
  { value: 'construction', label: 'BTP / Construction', icon: '🏗️' },
  { value: 'cleaning', label: 'Propreté / Nettoyage', icon: '🧹' },
  { value: 'it_services', label: 'Services informatiques', icon: '💻' },
  { value: 'software', label: 'Développement logiciel', icon: '👨‍💻' },
  { value: 'consulting', label: 'Conseil / Consulting', icon: '📊' },
  { value: 'logistics', label: 'Logistique / Transport', icon: '🚚' },
  { value: 'maintenance', label: 'Maintenance industrielle', icon: '🔧' },
  { value: 'energy', label: 'Énergie / Environnement', icon: '⚡' },
  { value: 'healthcare', label: 'Santé / Médical', icon: '🏥' },
  { value: 'food', label: 'Restauration / Traiteur', icon: '🍽️' },
  { value: 'training', label: 'Formation', icon: '📚' },
  { value: 'communication', label: 'Communication / Marketing', icon: '📣' },
  { value: 'engineering', label: 'Ingénierie / Études', icon: '📐' },
  { value: 'other', label: 'Autre', icon: '📦' },
];

// Tailles d'entreprise
const COMPANY_SIZES = [
  { value: '1', label: 'Auto-entrepreneur', employees: '1 personne' },
  { value: '2-10', label: 'TPE', employees: '2-10 salariés' },
  { value: '11-50', label: 'PME', employees: '11-50 salariés' },
  { value: '51-250', label: 'ETI', employees: '51-250 salariés' },
  { value: '251-1000', label: 'Grande entreprise', employees: '251-1000 salariés' },
  { value: '1000+', label: 'Groupe', employees: '1000+ salariés' },
];

// Zones géographiques
const GEOGRAPHIC_ZONES = [
  { value: 'local', label: 'Local', description: 'Département' },
  { value: 'regional', label: 'Régional', description: 'Région' },
  { value: 'national', label: 'National', description: 'France entière' },
  { value: 'european', label: 'Européen', description: 'Union Européenne' },
  { value: 'international', label: 'International', description: 'Monde entier' },
];

// Types de marchés
const MARKET_TYPES = [
  { value: 'public', label: 'Marchés publics', description: 'État, collectivités, hôpitaux...' },
  { value: 'private', label: 'Marchés privés', description: 'Entreprises, groupes...' },
  { value: 'both', label: 'Les deux', description: 'Public et privé' },
];

// Certifications courantes
const CERTIFICATIONS = [
  { value: 'iso9001', label: 'ISO 9001', category: 'Qualité' },
  { value: 'iso14001', label: 'ISO 14001', category: 'Environnement' },
  { value: 'iso45001', label: 'ISO 45001', category: 'Sécurité' },
  { value: 'mase', label: 'MASE', category: 'Sécurité' },
  { value: 'qualibat', label: 'Qualibat', category: 'BTP' },
  { value: 'qualifelec', label: 'Qualifelec', category: 'Électricité' },
  { value: 'rge', label: 'RGE', category: 'Énergie' },
  { value: 'apsad', label: 'APSAD', category: 'Sécurité' },
  { value: 'cnaps', label: 'CNAPS', category: 'Sécurité privée' },
  { value: 'cnil', label: 'Conformité RGPD', category: 'Data' },
  { value: 'other', label: 'Autre certification', category: 'Autre' },
];

const STEPS = [
  { id: 1, title: 'Entreprise', icon: Building2 },
  { id: 2, title: 'Activité', icon: Briefcase },
  { id: 3, title: 'Cibles', icon: Target },
  { id: 4, title: 'Mots-clés', icon: Sparkles },
];

export default function OnboardingPage() {
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

  // Vérifier l'authentification
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
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        // Entreprise déjà configurée, rediriger vers dashboard
        router.push('/dashboard');
      }
    };
    checkAuth();
  }, [getSupabase, router]);

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
          setError('Le nom de l\'entreprise est requis');
          return false;
        }
        if (siret && (siret.length !== 14 || !/^\d+$/.test(siret))) {
          setError('Le SIRET doit contenir 14 chiffres');
          return false;
        }
        return true;
      case 2:
        if (sectors.length === 0) {
          setError('Sélectionnez au moins un secteur d\'activité');
          return false;
        }
        if (!companySize) {
          setError('Sélectionnez la taille de votre entreprise');
          return false;
        }
        return true;
      case 3:
        if (geographicZones.length === 0) {
          setError('Sélectionnez au moins une zone géographique');
          return false;
        }
        if (marketTypes.length === 0) {
          setError('Sélectionnez au moins un type de marché');
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

      // Créer l'entreprise
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
          // Metadata pour l'IA
          metadata: {
            geographic_zones: geographicZones,
            market_types: marketTypes,
            min_budget: minBudget ? parseInt(minBudget) : null,
            max_budget: maxBudget ? parseInt(maxBudget) : null,
            keywords: keywords,
            competencies: competencies,
            onboarding_completed: true,
            onboarding_date: new Date().toISOString(),
          }
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Lier l'utilisateur à l'entreprise
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({ company_id: company.id })
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
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
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
          <h1 className="text-2xl font-bold text-white mb-2">Configuration de votre entreprise</h1>
          <p className="text-slate-400">Ces informations permettent à notre IA de vous recommander les meilleurs appels d'offres</p>
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
                <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
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
                    <h2 className="text-xl font-bold text-white mb-2">Informations de l'entreprise</h2>
                    <p className="text-slate-400">Renseignez les informations de base</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Nom de l'entreprise *"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ma Société SAS"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <Input
                      label="SIRET"
                      value={siret}
                      onChange={(e) => setSiret(e.target.value.replace(/\s/g, ''))}
                      placeholder="12345678901234"
                      hint="14 chiffres (optionnel)"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                    <Input
                      label="Téléphone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+33 1 23 45 67 89"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                    <Input
                      label="Adresse"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 rue de la Paix"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Code postal"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="75001"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Input
                        label="Ville"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Paris"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <Input
                      label="Site web"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.monsite.fr"
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
                    <h2 className="text-xl font-bold text-white mb-2">Votre activité</h2>
                    <p className="text-slate-400">Secteurs, taille et certifications</p>
                  </div>

                  {/* Secteurs */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">Secteurs d'activité *</label>
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
                          <span className="text-sm">{sector.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Taille */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">Taille de l'entreprise *</label>
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
                          <div className="font-medium">{size.label}</div>
                          <div className="text-xs opacity-70">{size.employees}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">Certifications (optionnel)</label>
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
                          {cert.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Description de l'activité</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez brièvement votre activité, vos spécialités..."
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
                    <h2 className="text-xl font-bold text-white mb-2">Vos cibles</h2>
                    <p className="text-slate-400">Zones et types de marchés recherchés</p>
                  </div>

                  {/* Zones géographiques */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">Zones géographiques *</label>
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
                          <div className="font-medium">{zone.label}</div>
                          <div className="text-xs opacity-70">{zone.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Types de marchés */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">Types de marchés *</label>
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
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm opacity-70">{type.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget cible */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">Budget des marchés ciblés (optionnel)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Budget minimum (€)"
                        type="number"
                        value={minBudget}
                        onChange={(e) => setMinBudget(e.target.value)}
                        placeholder="10000"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Input
                        label="Budget maximum (€)"
                        type="number"
                        value={maxBudget}
                        onChange={(e) => setMaxBudget(e.target.value)}
                        placeholder="500000"
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
                    <h2 className="text-xl font-bold text-white mb-2">Mots-clés et compétences</h2>
                    <p className="text-slate-400">Aidez notre IA à trouver les meilleurs AO pour vous</p>
                  </div>

                  {/* Mots-clés */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      <Sparkles className="w-4 h-4 inline mr-2 text-amber-400" />
                      Mots-clés de recherche
                    </label>
                    <p className="text-sm text-slate-400 mb-3">
                      Ajoutez des mots-clés que l'IA utilisera pour identifier les appels d'offres pertinents
                    </p>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                        placeholder="Ex: vidéosurveillance, React, audit..."
                        className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Button type="button" onClick={addKeyword} variant="primary">
                        Ajouter
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
                        <span className="text-slate-500 text-sm">Aucun mot-clé ajouté</span>
                      )}
                    </div>
                  </div>

                  {/* Compétences spécifiques */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Compétences et références clés</label>
                    <textarea
                      value={competencies}
                      onChange={(e) => setCompetencies(e.target.value)}
                      placeholder="Décrivez vos compétences clés, références importantes, technologies maîtrisées...&#10;&#10;Ex: 10 ans d'expérience en sécurité incendie, références ministères, maîtrise React/Node.js..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Résumé */}
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <h3 className="font-medium text-emerald-400 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Configuration IA
                    </h3>
                    <p className="text-sm text-slate-300">
                      Notre IA utilisera ces informations pour :
                    </p>
                    <ul className="text-sm text-slate-400 mt-2 space-y-1">
                      <li>• Vous recommander les appels d'offres les plus pertinents</li>
                      <li>• Calculer votre score de compatibilité</li>
                      <li>• Générer des documents adaptés à votre profil</li>
                      <li>• Analyser vos chances de succès</li>
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
                  Retour
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button type="button" variant="primary" onClick={handleNext}>
                  Continuer
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
                  {loading ? 'Configuration...' : 'Terminer la configuration'}
                  {!loading && <Check className="w-4 h-4 ml-2" />}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Vous pourrez modifier ces informations plus tard dans les paramètres
        </p>
      </motion.div>
    </div>
  );
}
