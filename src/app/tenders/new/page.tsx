'use client';

import { useMemo, useState } from 'react';
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
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
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
  { id: 1, titleKey: 'tenders.new.steps.typeInfo', icon: DocumentTextIcon },
  { id: 2, titleKey: 'tenders.new.steps.buyer', icon: BuildingOfficeIcon },
  { id: 3, titleKey: 'tenders.new.steps.budgetDates', icon: CalendarIcon },
  { id: 4, titleKey: 'tenders.new.steps.details', icon: SparklesIcon },
];

const SECTORS: { value: Sector; labelKey: string }[] = [
  { value: 'SECURITY_PRIVATE', labelKey: 'tenders.new.sector.securityPrivate' },
  { value: 'SECURITY_ELECTRONIC', labelKey: 'tenders.new.sector.securityElectronic' },
  { value: 'CONSTRUCTION', labelKey: 'tenders.new.sector.construction' },
  { value: 'LOGISTICS', labelKey: 'tenders.new.sector.logistics' },
  { value: 'IT_SOFTWARE', labelKey: 'tenders.new.sector.itSoftware' },
  { value: 'MAINTENANCE', labelKey: 'tenders.new.sector.maintenance' },
  { value: 'CONSULTING', labelKey: 'tenders.new.sector.consulting' },
  { value: 'CLEANING', labelKey: 'tenders.new.sector.cleaning' },
  { value: 'CATERING', labelKey: 'tenders.new.sector.catering' },
  { value: 'TRANSPORT', labelKey: 'tenders.new.sector.transport' },
  { value: 'ENERGY', labelKey: 'tenders.new.sector.energy' },
  { value: 'HEALTHCARE', labelKey: 'tenders.new.sector.healthcare' },
  { value: 'EDUCATION', labelKey: 'tenders.new.sector.education' },
  { value: 'OTHER', labelKey: 'tenders.new.sector.other' },
];

const BUYER_TYPES: { value: BuyerType; labelKey: string }[] = [
  { value: 'STATE', labelKey: 'tenders.new.buyerType.state' },
  { value: 'REGION', labelKey: 'tenders.new.buyerType.region' },
  { value: 'DEPARTMENT', labelKey: 'tenders.new.buyerType.department' },
  { value: 'MUNICIPALITY', labelKey: 'tenders.new.buyerType.municipality' },
  { value: 'PUBLIC_ESTABLISHMENT', labelKey: 'tenders.new.buyerType.publicEstablishment' },
  { value: 'HOSPITAL', labelKey: 'tenders.new.buyerType.hospital' },
  { value: 'PRIVATE_COMPANY', labelKey: 'tenders.new.buyerType.privateCompany' },
  { value: 'ASSOCIATION', labelKey: 'tenders.new.buyerType.association' },
  { value: 'OTHER', labelKey: 'tenders.new.buyerType.other' },
];

const COUNTRIES: { value: CountryCode; labelKey: string; flag: string }[] = [
  { value: 'FR', labelKey: 'tenders.new.country.fr', flag: '🇫🇷' },
  { value: 'DE', labelKey: 'tenders.new.country.de', flag: '🇩🇪' },
  { value: 'BE', labelKey: 'tenders.new.country.be', flag: '🇧🇪' },
  { value: 'ES', labelKey: 'tenders.new.country.es', flag: '🇪🇸' },
  { value: 'IT', labelKey: 'tenders.new.country.it', flag: '🇮🇹' },
  { value: 'NL', labelKey: 'tenders.new.country.nl', flag: '🇳🇱' },
  { value: 'GB', labelKey: 'tenders.new.country.gb', flag: '🇬🇧' },
  { value: 'CH', labelKey: 'tenders.new.country.ch', flag: '🇨🇭' },
  { value: 'US', labelKey: 'tenders.new.country.us', flag: '🇺🇸' },
  { value: 'MA', labelKey: 'tenders.new.country.ma', flag: '🇲🇦' },
];

export default function NewTenderPage() {
  const { locale } = useLocale();

  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TenderFormData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const entries = useMemo(
    () => ({
      'tenders.new.pageTitle': 'New tender',
      'tenders.new.pageDescription': 'Create a new tender in a few steps',

      'tenders.new.steps.typeInfo': 'Type & Info',
      'tenders.new.steps.buyer': 'Buyer',
      'tenders.new.steps.budgetDates': 'Budget & Dates',
      'tenders.new.steps.details': 'Details',

      'tenders.new.section.tenderType': 'Tender type',
      'tenders.new.type.public': 'Public tender',
      'tenders.new.type.public.desc': 'Government, local authorities, public bodies',
      'tenders.new.type.private': 'Private tender',
      'tenders.new.type.private.desc': 'Private companies, associations',
      'tenders.new.badge.requiredDocs': '{count} required docs',
      'tenders.new.badge.simplifiedProcedure': 'Simplified procedure',

      'tenders.new.label.country': 'Country',
      'tenders.new.hint.regulation': 'Regulation: {law}',

      'tenders.new.label.title': 'Tender title',
      'tenders.new.placeholder.title': 'e.g. IT equipment supply...',
      'tenders.new.label.description': 'Description',
      'tenders.new.placeholder.description': 'Describe the scope of the tender...',

      'tenders.new.label.sector': 'Business sector',
      'tenders.new.placeholder.sector': 'Select a sector',

      'tenders.new.section.buyerInfo': 'Buyer information',
      'tenders.new.label.buyerName': 'Buyer name',
      'tenders.new.placeholder.buyerName': 'e.g. City of Paris, SNCF...',
      'tenders.new.label.buyerType': 'Buyer type',
      'tenders.new.placeholder.buyerType': 'Select a type',
      'tenders.new.label.contact': 'Contact',
      'tenders.new.placeholder.contact': 'Contact name',
      'tenders.new.label.email': 'Email',
      'tenders.new.label.phone': 'Phone',

      'tenders.new.section.budgetDates': 'Budget and deadlines',
      'tenders.new.label.estimatedValue': 'Estimated value ({currency})',
      'tenders.new.placeholder.estimatedValue': 'e.g. 50000',
      'tenders.new.label.deadline': 'Response deadline',
      'tenders.new.label.publicationDate': 'Publication date',

      'tenders.new.alert.legalDeadlines': 'Legal deadlines ({country}):',
      'tenders.new.alert.openProcedure': 'Open procedure: {days} days min.',
      'tenders.new.alert.restrictedProcedure': 'Restricted procedure: {days} days min.',
      'tenders.new.alert.urgentProcedure': 'Urgent procedure: {days} days min.',

      'tenders.new.section.details': 'Additional details',
      'tenders.new.label.sourceUrl': 'Source URL',
      'tenders.new.label.platform': 'Publishing platform',
      'tenders.new.placeholder.platform': 'Select a platform',
      'tenders.new.label.region': 'Region',
      'tenders.new.placeholder.region': 'e.g. Île-de-France',
      'tenders.new.label.department': 'Department',
      'tenders.new.placeholder.department': 'e.g. 75 - Paris',
      'tenders.new.label.notes': 'Internal notes',
      'tenders.new.placeholder.notes': 'Additional information...',

      'tenders.new.docsToPrepare': 'Documents to prepare ({type})',
      'tenders.new.typeLabel.public': 'Public tender',
      'tenders.new.typeLabel.private': 'Private tender',
      'tenders.new.badge.required': 'Required',
      'tenders.new.moreDocs': '+{count} more documents',

      'tenders.new.nav.previous': 'Previous',
      'tenders.new.nav.next': 'Next',
      'tenders.new.nav.create': 'Create tender',

      'tenders.new.validation.titleRequired': 'Title is required',
      'tenders.new.validation.titleMin': 'Title must be at least 10 characters',
      'tenders.new.validation.buyerRequired': 'Buyer name is required',
      'tenders.new.validation.deadlineRequired': 'Deadline is required',

      'tenders.new.error.unauthenticated': 'Not authenticated',
      'tenders.new.error.noCompany': 'No associated company',
      'tenders.new.toast.created': 'Tender created successfully!',
      'tenders.new.toast.createError': 'Error while creating the tender',

      'tenders.new.sector.securityPrivate': 'Private security',
      'tenders.new.sector.securityElectronic': 'Electronic security',
      'tenders.new.sector.construction': 'Construction',
      'tenders.new.sector.logistics': 'Logistics',
      'tenders.new.sector.itSoftware': 'IT / Software',
      'tenders.new.sector.maintenance': 'Maintenance',
      'tenders.new.sector.consulting': 'Consulting',
      'tenders.new.sector.cleaning': 'Cleaning',
      'tenders.new.sector.catering': 'Catering',
      'tenders.new.sector.transport': 'Transport',
      'tenders.new.sector.energy': 'Energy',
      'tenders.new.sector.healthcare': 'Healthcare',
      'tenders.new.sector.education': 'Education',
      'tenders.new.sector.other': 'Other',

      'tenders.new.buyerType.state': 'State',
      'tenders.new.buyerType.region': 'Region',
      'tenders.new.buyerType.department': 'Department',
      'tenders.new.buyerType.municipality': 'Municipality',
      'tenders.new.buyerType.publicEstablishment': 'Public establishment',
      'tenders.new.buyerType.hospital': 'Hospital / University hospital',
      'tenders.new.buyerType.privateCompany': 'Private company',
      'tenders.new.buyerType.association': 'Association',
      'tenders.new.buyerType.other': 'Other',

      'tenders.new.country.fr': 'France',
      'tenders.new.country.de': 'Germany',
      'tenders.new.country.be': 'Belgium',
      'tenders.new.country.es': 'Spain',
      'tenders.new.country.it': 'Italy',
      'tenders.new.country.nl': 'Netherlands',
      'tenders.new.country.gb': 'United Kingdom',
      'tenders.new.country.ch': 'Switzerland',
      'tenders.new.country.us': 'United States',
      'tenders.new.country.ma': 'Morocco',
    }),
    []
  );

  const { t } = useUiTranslations(locale, entries);

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
      if (!formData.title.trim()) newErrors.title = t('tenders.new.validation.titleRequired');
      if (formData.title.length < 10) newErrors.title = t('tenders.new.validation.titleMin');
    }

    if (step === 2) {
      if (!formData.buyer_name.trim()) newErrors.buyer_name = t('tenders.new.validation.buyerRequired');
    }

    if (step === 3) {
      if (!formData.deadline) newErrors.deadline = t('tenders.new.validation.deadlineRequired');
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
      if (!userData.user) throw new Error(t('tenders.new.error.unauthenticated'));

      // Récupérer la company de l'utilisateur
      const { data: membership } = await (supabase
        .from('company_members') as any)
        .select('company_id')
        .eq('user_id', userData.user.id)
        .single();

      if (!membership?.company_id) throw new Error(t('tenders.new.error.noCompany'));

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

      toast.success(t('tenders.new.toast.created'));
      router.push(`/tenders/${data.id}`);
    } catch (error) {
      console.error('Error creating tender:', error);
      toast.error(t('tenders.new.toast.createError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title={t('tenders.new.pageTitle')}
        description={t('tenders.new.pageDescription')}
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
                  <span className="hidden sm:block text-sm font-medium">{t(step.titleKey)}</span>
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
                <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('tenders.new.section.tenderType')}</h2>
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
                      <span className="font-semibold text-slate-900">{t('tenders.new.type.public')}</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {t('tenders.new.type.public.desc')}
                    </p>
                    <Badge variant="info" size="sm" className="mt-2">
                      {t('tenders.new.badge.requiredDocs', {
                        count: requiredDocs.filter(d => d.mandatory).length,
                      })}
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
                      <span className="font-semibold text-slate-900">{t('tenders.new.type.private')}</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {t('tenders.new.type.private.desc')}
                    </p>
                    <Badge variant="secondary" size="sm" className="mt-2">
                      {t('tenders.new.badge.simplifiedProcedure')}
                    </Badge>
                  </button>
                </div>
              </div>

              <div>
                <Select
                  label={t('tenders.new.label.country')}
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value as CountryCode)}
                  options={COUNTRIES.map(c => ({ 
                    value: c.value, 
                    label: `${c.flag} ${t(c.labelKey)}` 
                  }))}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {t('tenders.new.hint.regulation', { law: countryConfig.publicProcurementLaw })}
                </p>
              </div>

              <div>
                <Input
                  label={t('tenders.new.label.title')}
                  placeholder={t('tenders.new.placeholder.title')}
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  error={errors.title}
                  required
                />
              </div>

              <div>
                <Textarea
                  label={t('tenders.new.label.description')}
                  placeholder={t('tenders.new.placeholder.description')}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Select
                  label={t('tenders.new.label.sector')}
                  value={formData.sector}
                  onChange={(e) => updateField('sector', e.target.value as Sector)}
                  options={[
                    { value: '', label: t('tenders.new.placeholder.sector') },
                    ...SECTORS.map(s => ({ value: s.value, label: t(s.labelKey) })),
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
              <h2 className="text-lg font-semibold text-slate-900">{t('tenders.new.section.buyerInfo')}</h2>

              <div>
                <Input
                  label={t('tenders.new.label.buyerName')}
                  placeholder={t('tenders.new.placeholder.buyerName')}
                  value={formData.buyer_name}
                  onChange={(e) => updateField('buyer_name', e.target.value)}
                  error={errors.buyer_name}
                  required
                />
              </div>

              <div>
                <Select
                  label={t('tenders.new.label.buyerType')}
                  value={formData.buyer_type}
                  onChange={(e) => updateField('buyer_type', e.target.value as BuyerType)}
                  options={[
                    { value: '', label: t('tenders.new.placeholder.buyerType') },
                    ...BUYER_TYPES.map(bt => ({ value: bt.value, label: t(bt.labelKey) })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('tenders.new.label.contact')}
                  placeholder={t('tenders.new.placeholder.contact')}
                  value={formData.buyer_contact}
                  onChange={(e) => updateField('buyer_contact', e.target.value)}
                />
                <Input
                  label={t('tenders.new.label.email')}
                  type="email"
                  placeholder="email@example.com"
                  value={formData.buyer_email}
                  onChange={(e) => updateField('buyer_email', e.target.value)}
                />
              </div>

              <div>
                <Input
                  label={t('tenders.new.label.phone')}
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
              <h2 className="text-lg font-semibold text-slate-900">{t('tenders.new.section.budgetDates')}</h2>

              <div>
                <Input
                  label={t('tenders.new.label.estimatedValue', { currency: countryConfig.currency })}
                  type="number"
                  placeholder={t('tenders.new.placeholder.estimatedValue')}
                  value={formData.estimated_value}
                  onChange={(e) => updateField('estimated_value', e.target.value)}
                  leftIcon={<CurrencyEuroIcon className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('tenders.new.label.deadline')}
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => updateField('deadline', e.target.value)}
                  error={errors.deadline}
                  required
                />
                <Input
                  label={t('tenders.new.label.publicationDate')}
                  type="date"
                  value={formData.publication_date}
                  onChange={(e) => updateField('publication_date', e.target.value)}
                />
              </div>

              {formData.type === 'PUBLIC' && (
                <Alert type="info">
                  <strong>
                    {t('tenders.new.alert.legalDeadlines', { country: countryConfig.name })}
                  </strong>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>
                      •{' '}
                      {t('tenders.new.alert.openProcedure', {
                        days: countryConfig.minResponseDays.openProcedure,
                      })}
                    </li>
                    <li>
                      •{' '}
                      {t('tenders.new.alert.restrictedProcedure', {
                        days: countryConfig.minResponseDays.restrictedProcedure,
                      })}
                    </li>
                    <li>
                      •{' '}
                      {t('tenders.new.alert.urgentProcedure', {
                        days: countryConfig.minResponseDays.urgentProcedure,
                      })}
                    </li>
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
              <h2 className="text-lg font-semibold text-slate-900">{t('tenders.new.section.details')}</h2>

              <div>
                <Input
                  label={t('tenders.new.label.sourceUrl')}
                  type="url"
                  placeholder="https://..."
                  value={formData.source_url}
                  onChange={(e) => updateField('source_url', e.target.value)}
                />
              </div>

              <div>
                <Select
                  label={t('tenders.new.label.platform')}
                  value={formData.platform}
                  onChange={(e) => updateField('platform', e.target.value)}
                  options={[
                    { value: '', label: t('tenders.new.placeholder.platform') },
                    ...countryConfig.platforms.map(p => ({
                      value: p.name,
                      label: p.name,
                    })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('tenders.new.label.region')}
                  placeholder={t('tenders.new.placeholder.region')}
                  value={formData.region}
                  onChange={(e) => updateField('region', e.target.value)}
                />
                <Input
                  label={t('tenders.new.label.department')}
                  placeholder={t('tenders.new.placeholder.department')}
                  value={formData.department}
                  onChange={(e) => updateField('department', e.target.value)}
                />
              </div>

              <div>
                <Textarea
                  label={t('tenders.new.label.notes')}
                  placeholder={t('tenders.new.placeholder.notes')}
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Récapitulatif des documents requis */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-medium text-slate-900 mb-3">
                  {t('tenders.new.docsToPrepare', {
                    type:
                      formData.type === 'PUBLIC'
                        ? t('tenders.new.typeLabel.public')
                        : t('tenders.new.typeLabel.private'),
                  })}
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
                        <Badge variant="warning" size="sm">{t('tenders.new.badge.required')}</Badge>
                      )}
                    </div>
                  ))}
                </div>
                {requiredDocs.length > 6 && (
                  <p className="text-sm text-slate-500 mt-2">
                    {t('tenders.new.moreDocs', { count: requiredDocs.length - 6 })}
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
            {t('tenders.new.nav.previous')}
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              {t('tenders.new.nav.next')}
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              loading={isSubmitting}
              className="bg-gradient-to-r from-primary-600 to-secondary-600"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              {t('tenders.new.nav.create')}
            </Button>
          )}
        </div>
      </Card>
    </AppLayout>
  );
}
