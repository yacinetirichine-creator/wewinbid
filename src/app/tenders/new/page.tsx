'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  SparklesIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, Input, Textarea, Select, Badge, Alert } from '@/components/ui';
import { AppLayout, PageHeader } from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase/client';
import { getCountryConfig, getRequiredDocuments, type CountryCode } from '@/lib/countries';
import type { TenderType, Sector, BuyerType } from '@/types/database';
import toast from 'react-hot-toast';

// Types des étapes
interface TenderFormData {
  // Étape 1 - Type et base
  type: TenderType;
  country: CountryCode;
  title: string;
  description: string;
  sector: Sector | '';
  
  // Étape 2 - Acheteur
  buyer_name: string;
  buyer_type: BuyerType | '';
  buyer_contact: string;
  buyer_email: string;
  buyer_phone: string;
  
  // Étape 3 - Montants et dates
  estimated_value: string;
  deadline: string;
  publication_date: string;
  
  // Étape 4 - Détails
  source_url: string;
  platform: string;
  region: string;
  department: string;
  notes: string;
}

const INITIAL_DATA: TenderFormData = {
  type: 'PUBLIC',
  country: 'FR',
  title: '',
  description: '',
  sector: '',
  buyer_name: '',
  buyer_type: '',
  buyer_contact: '',
  buyer_email: '',
  buyer_phone: '',
  estimated_value: '',
  deadline: '',
  publication_date: '',
  source_url: '',
  platform: '',
  region: '',
  department: '',
  notes: '',
};

const STEPS = [
  { id: 1, title: 'Type & Informations', icon: DocumentTextIcon },
  { id: 2, title: 'Acheteur', icon: BuildingOfficeIcon },
  { id: 3, title: 'Budget & Dates', icon: CalendarIcon },
  { id: 4, title: 'Détails', icon: SparklesIcon },
];

const SECTORS: { value: Sector; label: string }[] = [
  { value: 'SECURITY_PRIVATE', label: 'Sécurité privée' },
  { value: 'SECURITY_ELECTRONIC', label: 'Sécurité électronique' },
  { value: 'CONSTRUCTION', label: 'BTP / Construction' },
  { value: 'LOGISTICS', label: 'Logistique' },
  { value: 'IT_SOFTWARE', label: 'IT / Logiciels' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'CONSULTING', label: 'Conseil' },
  { value: 'CLEANING', label: 'Nettoyage' },
  { value: 'CATERING', label: 'Restauration' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'ENERGY', label: 'Énergie' },
  { value: 'HEALTHCARE', label: 'Santé' },
  { value: 'EDUCATION', label: 'Éducation' },
  { value: 'OTHER', label: 'Autre' },
];

const BUYER_TYPES: { value: BuyerType; label: string }[] = [
  { value: 'STATE', label: 'État' },
  { value: 'REGION', label: 'Région' },
  { value: 'DEPARTMENT', label: 'Département' },
  { value: 'MUNICIPALITY', label: 'Commune' },
  { value: 'PUBLIC_ESTABLISHMENT', label: 'Établissement public' },
  { value: 'HOSPITAL', label: 'Hôpital / CHU' },
  { value: 'PRIVATE_COMPANY', label: 'Entreprise privée' },
  { value: 'ASSOCIATION', label: 'Association' },
  { value: 'OTHER', label: 'Autre' },
];

const COUNTRIES: { value: CountryCode; label: string; flag: string }[] = [
  { value: 'FR', label: 'France', flag: '🇫🇷' },
  { value: 'DE', label: 'Allemagne', flag: '🇩🇪' },
  { value: 'BE', label: 'Belgique', flag: '🇧🇪' },
  { value: 'ES', label: 'Espagne', flag: '🇪🇸' },
  { value: 'IT', label: 'Italie', flag: '🇮🇹' },
  { value: 'NL', label: 'Pays-Bas', flag: '🇳🇱' },
  { value: 'GB', label: 'Royaume-Uni', flag: '🇬🇧' },
  { value: 'CH', label: 'Suisse', flag: '🇨🇭' },
  { value: 'US', label: 'États-Unis', flag: '🇺🇸' },
  { value: 'MA', label: 'Maroc', flag: '🇲🇦' },
];

export default function NewTenderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TenderFormData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const countryConfig = getCountryConfig(formData.country);
  const requiredDocs = getRequiredDocuments(formData.country, formData.type);

  function updateField<K extends keyof TenderFormData>(field: K, value: TenderFormData[K]) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }

  function validateStep(step: number): boolean {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Le titre est requis';
      if (formData.title.length < 10) newErrors.title = 'Le titre doit faire au moins 10 caractères';
    }

    if (step === 2) {
      if (!formData.buyer_name.trim()) newErrors.buyer_name = 'Le nom de l\'acheteur est requis';
    }

    if (step === 3) {
      if (!formData.deadline) newErrors.deadline = 'La date limite est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  }

  function handlePrevious() {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }

  async function handleSubmit() {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Récupérer la company de l'utilisateur
      const { data: membership } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', userData.user.id)
        .single();

      if (!membership) throw new Error('Aucune entreprise associée');

      const { data, error } = await (supabase as any)
        .from('tenders')
        .insert({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          status: 'DRAFT',
          sector: formData.sector || null,
          buyer_name: formData.buyer_name,
          buyer_type: formData.buyer_type || null,
          buyer_contact: formData.buyer_contact || null,
          buyer_email: formData.buyer_email || null,
          buyer_phone: formData.buyer_phone || null,
          estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
          deadline: formData.deadline || null,
          publication_date: formData.publication_date || null,
          source_url: formData.source_url || null,
          platform: formData.platform || null,
          region: formData.region || null,
          department: formData.department || null,
          notes: formData.notes || null,
          company_id: (membership as any).company_id,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Appel d\'offres créé avec succès !');
      router.push(`/tenders/${data.id}`);
    } catch (error) {
      console.error('Error creating tender:', error);
      toast.error('Erreur lors de la création de l\'AO');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title="Nouvel appel d'offres"
        description="Créez un nouvel AO en quelques étapes"
      />

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-primary-100 text-primary-700'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCurrent
                      ? 'bg-primary-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 text-white'
                  }`}>
                    {isCompleted ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{step.title}</span>
                </button>
                
                {index < STEPS.length - 1 && (
                  <div className={`w-8 md:w-16 h-0.5 mx-2 ${
                    isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card className="max-w-3xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {/* Étape 1: Type et informations de base */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Type de marché</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => updateField('type', 'PUBLIC')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.type === 'PUBLIC'
                        ? 'border-tender-public-500 bg-tender-public-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <GlobeAltIcon className="w-6 h-6 text-tender-public-600" />
                      <span className="font-semibold text-slate-900">Marché Public</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      État, collectivités, établissements publics
                    </p>
                    <Badge variant="info" size="sm" className="mt-2">
                      {requiredDocs.filter(d => d.mandatory).length} docs requis
                    </Badge>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField('type', 'PRIVATE')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.type === 'PRIVATE'
                        ? 'border-tender-private-500 bg-tender-private-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <LockClosedIcon className="w-6 h-6 text-tender-private-600" />
                      <span className="font-semibold text-slate-900">Marché Privé</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Entreprises privées, associations
                    </p>
                    <Badge variant="secondary" size="sm" className="mt-2">
                      Procédure simplifiée
                    </Badge>
                  </button>
                </div>
              </div>

              <div>
                <Select
                  label="Pays"
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value as CountryCode)}
                  options={COUNTRIES.map(c => ({ 
                    value: c.value, 
                    label: `${c.flag} ${c.label}` 
                  }))}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Réglementation: {countryConfig.publicProcurementLaw}
                </p>
              </div>

              <div>
                <Input
                  label="Titre de l'appel d'offres"
                  placeholder="Ex: Fourniture de matériel informatique..."
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  error={errors.title}
                  required
                />
              </div>

              <div>
                <Textarea
                  label="Description"
                  placeholder="Décrivez l'objet du marché..."
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Select
                  label="Secteur d'activité"
                  value={formData.sector}
                  onChange={(e) => updateField('sector', e.target.value as Sector)}
                  options={[
                    { value: '', label: 'Sélectionner un secteur' },
                    ...SECTORS,
                  ]}
                />
              </div>
            </motion.div>
          )}

          {/* Étape 2: Acheteur */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-slate-900">Informations acheteur</h2>

              <div>
                <Input
                  label="Nom de l'acheteur"
                  placeholder="Ex: Mairie de Paris, SNCF..."
                  value={formData.buyer_name}
                  onChange={(e) => updateField('buyer_name', e.target.value)}
                  error={errors.buyer_name}
                  required
                />
              </div>

              <div>
                <Select
                  label="Type d'acheteur"
                  value={formData.buyer_type}
                  onChange={(e) => updateField('buyer_type', e.target.value as BuyerType)}
                  options={[
                    { value: '', label: 'Sélectionner un type' },
                    ...BUYER_TYPES,
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Contact"
                  placeholder="Nom du contact"
                  value={formData.buyer_contact}
                  onChange={(e) => updateField('buyer_contact', e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.buyer_email}
                  onChange={(e) => updateField('buyer_email', e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Téléphone"
                  type="tel"
                  placeholder="+33 1 23 45 67 89"
                  value={formData.buyer_phone}
                  onChange={(e) => updateField('buyer_phone', e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {/* Étape 3: Budget et Dates */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-slate-900">Budget et échéances</h2>

              <div>
                <Input
                  label={`Valeur estimée (${countryConfig.currency})`}
                  type="number"
                  placeholder="Ex: 50000"
                  value={formData.estimated_value}
                  onChange={(e) => updateField('estimated_value', e.target.value)}
                  leftIcon={<CurrencyEuroIcon className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date limite de réponse"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => updateField('deadline', e.target.value)}
                  error={errors.deadline}
                  required
                />
                <Input
                  label="Date de publication"
                  type="date"
                  value={formData.publication_date}
                  onChange={(e) => updateField('publication_date', e.target.value)}
                />
              </div>

              {formData.type === 'PUBLIC' && (
                <Alert type="info">
                  <strong>Délais légaux ({countryConfig.name}):</strong>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>• Procédure ouverte: {countryConfig.minResponseDays.openProcedure} jours min.</li>
                    <li>• Procédure restreinte: {countryConfig.minResponseDays.restrictedProcedure} jours min.</li>
                    <li>• Procédure d'urgence: {countryConfig.minResponseDays.urgentProcedure} jours min.</li>
                  </ul>
                </Alert>
              )}
            </motion.div>
          )}

          {/* Étape 4: Détails */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-slate-900">Détails complémentaires</h2>

              <div>
                <Input
                  label="URL source"
                  type="url"
                  placeholder="https://..."
                  value={formData.source_url}
                  onChange={(e) => updateField('source_url', e.target.value)}
                />
              </div>

              <div>
                <Select
                  label="Plateforme de publication"
                  value={formData.platform}
                  onChange={(e) => updateField('platform', e.target.value)}
                  options={[
                    { value: '', label: 'Sélectionner une plateforme' },
                    ...countryConfig.platforms.map(p => ({
                      value: p.name,
                      label: p.name,
                    })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Région"
                  placeholder="Ex: Île-de-France"
                  value={formData.region}
                  onChange={(e) => updateField('region', e.target.value)}
                />
                <Input
                  label="Département"
                  placeholder="Ex: 75 - Paris"
                  value={formData.department}
                  onChange={(e) => updateField('department', e.target.value)}
                />
              </div>

              <div>
                <Textarea
                  label="Notes internes"
                  placeholder="Informations supplémentaires..."
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Récapitulatif des documents requis */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-medium text-slate-900 mb-3">
                  Documents à préparer ({formData.type === 'PUBLIC' ? 'Marché public' : 'Marché privé'})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {requiredDocs.slice(0, 6).map((doc) => (
                    <div
                      key={doc.type}
                      className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                        doc.mandatory ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      <DocumentTextIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{doc.name}</span>
                      {doc.mandatory && (
                        <Badge variant="warning" size="sm">Requis</Badge>
                      )}
                    </div>
                  ))}
                </div>
                {requiredDocs.length > 6 && (
                  <p className="text-sm text-slate-500 mt-2">
                    +{requiredDocs.length - 6} autres documents
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              Suivant
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              loading={isSubmitting}
              className="bg-gradient-to-r from-primary-600 to-secondary-600"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Créer l'appel d'offres
            </Button>
          )}
        </div>
      </Card>
    </AppLayout>
  );
}
