'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Shield,
  Award,
  Euro,
  Users,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Trash2,
  Plus,
  Briefcase,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button, Card, Input, Textarea, Badge, Progress, Select } from '@/components/ui';
import { NewAppLayout, PageHeader } from '@/components/layout/NewAppLayout';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

// Types
interface CompanyProfile {
  id?: string;
  company_name: string;
  siret: string;
  legal_form: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  annual_revenue: number | null;
  employee_count: number | null;
  years_experience: number | null;
  sectors: string[];
  certifications: string[];
  qualifications: string[];
  preferred_regions: string[];
  min_contract_value: number | null;
  max_contract_value: number | null;
  kbis_url: string;
  kbis_valid_until: string;
  insurance_rc_url: string;
  insurance_decennale_url: string;
  company_references: any[];
}

interface Reference {
  id: string;
  client_name: string;
  project_title: string;
  year: number;
  value: number;
  description: string;
  contact_name?: string;
  contact_email?: string;
}

const LEGAL_FORMS = [
  { value: 'SAS', labelKey: 'companyProfile.legalForms.sas' },
  { value: 'SARL', labelKey: 'companyProfile.legalForms.sarl' },
  { value: 'SA', labelKey: 'companyProfile.legalForms.sa' },
  { value: 'EURL', labelKey: 'companyProfile.legalForms.eurl' },
  { value: 'EI', labelKey: 'companyProfile.legalForms.ei' },
  { value: 'SASU', labelKey: 'companyProfile.legalForms.sasu' },
  { value: 'SNC', labelKey: 'companyProfile.legalForms.snc' },
  { value: 'OTHER', labelKey: 'companyProfile.legalForms.other' },
];

const SECTORS = [
  'BTP - Gros œuvre',
  'BTP - Second œuvre',
  'Informatique & Digital',
  'Conseil',
  'Ingénierie',
  'Environnement',
  'Énergie',
  'Transport & Logistique',
  'Santé',
  'Formation',
  'Communication',
  'Sécurité',
  'Nettoyage & Entretien',
  'Espaces verts',
  'Restauration',
  'Autre',
];

const CERTIFICATIONS = [
  'ISO 9001',
  'ISO 14001',
  'ISO 45001',
  'Qualibat',
  'Qualifelec',
  'Qualipaysage',
  'RGE',
  'MASE',
  'CEFRI',
  'Éco-Artisan',
  'NF Service',
  'Autre',
];

const REGIONS = [
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Hauts-de-France',
  'Provence-Alpes-Côte d\'Azur',
  'Grand Est',
  'Pays de la Loire',
  'Bretagne',
  'Normandie',
  'Bourgogne-Franche-Comté',
  'Centre-Val de Loire',
  'Corse',
  'Outre-mer',
  'France entière',
];

// Composant pour les tags/chips
function TagInput({
  label,
  values,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  options: Array<string | { value: string; label: string }>;
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const filteredOptions = normalizedOptions.filter(
    (opt) =>
      !values.includes(opt.value) &&
      opt.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const addTag = (tagValue: string) => {
    if (!values.includes(tagValue)) {
      onChange([...values, tagValue]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(values.filter(v => v !== tag));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-surface-700">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map(tag => (
          <Badge
            key={tag}
            variant="primary"
            className="flex items-center gap-1 pr-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="p-0.5 hover:bg-primary-700 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-lg border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {showSuggestions && filteredOptions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-surface-200 rounded-lg shadow-lg max-h-48 overflow-auto">
            {filteredOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => addTag(opt.value)}
                className="w-full px-4 py-2 text-left hover:bg-surface-50 text-sm"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour les références
function ReferenceCard({
  reference,
  onUpdate,
  onDelete,
  t,
}: {
  reference: Reference;
  onUpdate: (ref: Reference) => void;
  onDelete: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary-500" />
          <h4 className="font-semibold text-surface-900">{t('companyProfile.references.cardTitle')}</h4>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-surface-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('companyProfile.references.clientName.label')}
          value={reference.client_name}
          onChange={(e) => onUpdate({ ...reference, client_name: e.target.value })}
          placeholder={t('companyProfile.references.clientName.placeholder')}
        />
        <Input
          label={t('companyProfile.references.projectTitle.label')}
          value={reference.project_title}
          onChange={(e) => onUpdate({ ...reference, project_title: e.target.value })}
          placeholder={t('companyProfile.references.projectTitle.placeholder')}
        />
        <Input
          label={t('companyProfile.references.year.label')}
          type="number"
          value={reference.year || ''}
          onChange={(e) => onUpdate({ ...reference, year: parseInt(e.target.value) })}
          placeholder={t('companyProfile.references.year.placeholder')}
        />
        <Input
          label={t('companyProfile.references.amount.label')}
          type="number"
          value={reference.value || ''}
          onChange={(e) => onUpdate({ ...reference, value: parseInt(e.target.value) })}
          placeholder={t('companyProfile.references.amount.placeholder')}
        />
        <div className="md:col-span-2">
          <Textarea
            label={t('companyProfile.references.description.label')}
            value={reference.description}
            onChange={(e) => onUpdate({ ...reference, description: e.target.value })}
            placeholder={t('companyProfile.references.description.placeholder')}
            rows={2}
          />
        </div>
        <Input
          label={t('companyProfile.references.contactName.label')}
          value={reference.contact_name || ''}
          onChange={(e) => onUpdate({ ...reference, contact_name: e.target.value })}
          placeholder={t('companyProfile.references.contactName.placeholder')}
        />
        <Input
          label={t('companyProfile.references.contactEmail.label')}
          type="email"
          value={reference.contact_email || ''}
          onChange={(e) => onUpdate({ ...reference, contact_email: e.target.value })}
          placeholder={t('companyProfile.references.contactEmail.placeholder')}
        />
      </div>
    </Card>
  );
}

export default function CompanyProfilePage() {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'companyProfile.title': 'Profil entreprise',
      'companyProfile.subtitle': 'Configurez votre profil pour améliorer la compatibilité avec les AO',
      'companyProfile.saved': 'Sauvegardé',
      'companyProfile.save': 'Sauvegarder',
      'companyProfile.saving': 'Sauvegarde...',
      'companyProfile.progress.label': 'Profil complété à',
      'companyProfile.progress.help': 'Complétez votre profil pour améliorer le score de compatibilité avec les AO',

      'companyProfile.tabs.general': 'Informations générales',
      'companyProfile.tabs.qualifications': 'Qualifications',
      'companyProfile.tabs.documents': 'Documents administratifs',
      'companyProfile.tabs.library': 'Bibliothèque IA',
      'companyProfile.tabs.references': 'Références',
      'companyProfile.tabs.preferences': 'Préférences',

      'companyProfile.general.title': "Informations de l'entreprise",
      'companyProfile.general.companyName.label': 'Raison sociale',
      'companyProfile.general.companyName.placeholder': 'Ma Société SAS',
      'companyProfile.general.siret.label': 'SIRET',
      'companyProfile.general.siret.placeholder': '123 456 789 00012',
      'companyProfile.general.legalForm.label': 'Forme juridique',
      'companyProfile.general.website.label': 'Site web',
      'companyProfile.general.website.placeholder': 'https://www.exemple.fr',
      'companyProfile.general.address.label': 'Adresse',
      'companyProfile.general.address.placeholder': '123 rue de la Paix',
      'companyProfile.general.postalCode.label': 'Code postal',
      'companyProfile.general.postalCode.placeholder': '75001',
      'companyProfile.general.city.label': 'Ville',
      'companyProfile.general.city.placeholder': 'Paris',
      'companyProfile.general.contactEmail.label': 'Email de contact',
      'companyProfile.general.contactEmail.placeholder': 'contact@exemple.fr',
      'companyProfile.general.phone.label': 'Téléphone',
      'companyProfile.general.phone.placeholder': '01 23 45 67 89',
      'companyProfile.general.annualRevenue.label': "Chiffre d'affaires annuel (€)",
      'companyProfile.general.annualRevenue.placeholder': '1000000',
      'companyProfile.general.employees.label': 'Nombre de salariés',
      'companyProfile.general.employees.placeholder': '50',
      'companyProfile.general.yearsExp.label': "Années d'expérience",
      'companyProfile.general.yearsExp.placeholder': '10',

      'companyProfile.qualifications.title': 'Qualifications et compétences',
      'companyProfile.qualifications.sectors.label': "Secteurs d'activité",
      'companyProfile.qualifications.sectors.placeholder': 'Ajouter un secteur...',
      'companyProfile.qualifications.certifications.label': 'Certifications',
      'companyProfile.qualifications.certifications.placeholder': 'Ajouter une certification...',
      'companyProfile.qualifications.qualifications.label': 'Qualifications métier',
      'companyProfile.qualifications.qualifications.placeholder': 'Ajouter une qualification...',

      'companyProfile.documents.title': 'Documents administratifs',
      'companyProfile.documents.kbis.title': 'Extrait KBIS',
      'companyProfile.documents.kbis.subtitle': 'Moins de 3 mois',
      'companyProfile.documents.kbis.validUntil': 'Date de validité',
      'companyProfile.documents.kbis.upload': 'Uploader le KBIS',
      'companyProfile.documents.rc.title': 'Assurance RC Pro',
      'companyProfile.documents.rc.subtitle': 'Attestation en cours',
      'companyProfile.documents.rc.upload': "Uploader l'attestation",
      'companyProfile.documents.decennale.title': 'Assurance décennale',
      'companyProfile.documents.decennale.subtitle': 'Si applicable',
      'companyProfile.documents.decennale.upload': "Uploader l'attestation",
      'companyProfile.documents.tax.title': 'Attestation fiscale',
      'companyProfile.documents.tax.subtitle': 'À jour des impôts',
      'companyProfile.documents.tax.upload': "Uploader l'attestation",

      'companyProfile.references.title': 'Références clients ({count})',
      'companyProfile.references.add': 'Ajouter une référence',
      'companyProfile.references.empty.title': 'Aucune référence',
      'companyProfile.references.empty.subtitle': 'Ajoutez vos références clients pour renforcer votre candidature',
      'companyProfile.references.empty.cta': 'Ajouter ma première référence',
      'companyProfile.references.cardTitle': 'Référence',
      'companyProfile.references.clientName.label': 'Nom du client',
      'companyProfile.references.clientName.placeholder': 'Mairie de Paris',
      'companyProfile.references.projectTitle.label': 'Intitulé du projet',
      'companyProfile.references.projectTitle.placeholder': 'Maintenance espaces verts',
      'companyProfile.references.year.label': 'Année',
      'companyProfile.references.year.placeholder': '2024',
      'companyProfile.references.amount.label': 'Montant (€)',
      'companyProfile.references.amount.placeholder': '150000',
      'companyProfile.references.description.label': 'Description',
      'companyProfile.references.description.placeholder': 'Décrivez brièvement la mission réalisée...',
      'companyProfile.references.contactName.label': 'Contact référent',
      'companyProfile.references.contactName.placeholder': 'M. Dupont',
      'companyProfile.references.contactEmail.label': 'Email du contact',
      'companyProfile.references.contactEmail.placeholder': 'contact@exemple.fr',

      'companyProfile.preferences.title': 'Préférences de recherche',
      'companyProfile.preferences.regions.label': 'Régions préférées',
      'companyProfile.preferences.regions.placeholder': 'Ajouter une région...',
      'companyProfile.preferences.min.label': 'Montant minimum des marchés (€)',
      'companyProfile.preferences.min.placeholder': '10000',
      'companyProfile.preferences.max.label': 'Montant maximum des marchés (€)',
      'companyProfile.preferences.max.placeholder': '500000',
      'companyProfile.preferences.tip.title': 'Astuce',
      'companyProfile.preferences.tip.body':
        "Plus votre profil est complet, plus le score de compatibilité sera précis. Les informations sont utilisées pour l'analyse IA et la génération automatique de documents.",

      'companyProfile.library.models.title': 'Modèles de réponses aux AO',
      'companyProfile.library.models.subtitle':
        "Uploadez vos anciennes réponses aux appels d'offres réussies. L'IA les analysera pour s'en inspirer lors de la génération de nouvelles réponses.",
      'companyProfile.library.models.memory': 'Mémoire technique',
      'companyProfile.library.models.memory.meta': 'PDF, DOCX - Max 50 Mo',
      'companyProfile.library.models.bpu': 'BPU / DPGF gagnants',
      'companyProfile.library.models.bpu.meta': 'XLS, PDF - Max 20 Mo',
      'companyProfile.library.models.commitments': "Actes d'engagement",
      'companyProfile.library.models.commitments.meta': 'PDF - Max 10 Mo',
      'companyProfile.library.models.other': 'Autres documents modèles',
      'companyProfile.library.models.other.meta': 'Tous formats - Max 50 Mo',
      'companyProfile.library.upload': 'Uploader',

      'companyProfile.library.companyDocs.title': "Documents entreprise pour l'IA",
      'companyProfile.library.companyDocs.subtitle':
        "Ces documents seront analysés par l'IA pour mieux comprendre votre entreprise et personnaliser les réponses.",
      'companyProfile.library.companyDocs.brochure': 'Plaquette commerciale',
      'companyProfile.library.companyDocs.brochure.meta': 'PDF - Max 20 Mo',
      'companyProfile.library.companyDocs.org': 'Organigramme',
      'companyProfile.library.companyDocs.org.meta': 'PDF, PNG, JPG',
      'companyProfile.library.companyDocs.cv': 'CV dirigeants/équipe',
      'companyProfile.library.companyDocs.cv.meta': 'PDF, DOCX',
      'companyProfile.library.companyDocs.qse': 'Politique QSE',
      'companyProfile.library.companyDocs.qse.meta': 'PDF',
      'companyProfile.library.companyDocs.rse': 'Plan RSE',
      'companyProfile.library.companyDocs.rse.meta': 'PDF',
      'companyProfile.library.companyDocs.method': 'Méthodologie type',
      'companyProfile.library.companyDocs.method.meta': 'PDF, DOCX',

      'companyProfile.confidentiality.title': 'Confidentialité garantie',
      'companyProfile.confidentiality.body':
        "Vos documents sont stockés de manière sécurisée et ne sont jamais partagés. L'IA les utilise uniquement pour personnaliser vos réponses aux AO.",

      'companyProfile.errors.notAuthenticated': 'Non authentifié',
      'companyProfile.errors.saveFailed': 'Erreur lors de la sauvegarde',

      'companyProfile.legalForms.sas': 'SAS - Société par Actions Simplifiée',
      'companyProfile.legalForms.sarl': 'SARL - Société à Responsabilité Limitée',
      'companyProfile.legalForms.sa': 'SA - Société Anonyme',
      'companyProfile.legalForms.eurl': 'EURL - Entreprise Unipersonnelle à Responsabilité Limitée',
      'companyProfile.legalForms.ei': 'EI - Entreprise Individuelle',
      'companyProfile.legalForms.sasu': 'SASU - Société par Actions Simplifiée Unipersonnelle',
      'companyProfile.legalForms.snc': 'SNC - Société en Nom Collectif',
      'companyProfile.legalForms.other': 'Autre',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const [profile, setProfile] = useState<CompanyProfile>({
    company_name: '',
    siret: '',
    legal_form: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'France',
    contact_email: '',
    contact_phone: '',
    website: '',
    annual_revenue: null,
    employee_count: null,
    years_experience: null,
    sectors: [],
    certifications: [],
    qualifications: [],
    preferred_regions: [],
    min_contract_value: null,
    max_contract_value: null,
    kbis_url: '',
    kbis_valid_until: '',
    insurance_rc_url: '',
    insurance_decennale_url: '',
    company_references: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'qualifications' | 'documents' | 'references' | 'preferences' | 'library'>('general');

  // Charger le profil
  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setProfile((prev) => {
            const patch = (data as unknown) as Partial<CompanyProfile> & {
              sectors?: string[] | null;
              certifications?: string[] | null;
              qualifications?: string[] | null;
              preferred_regions?: string[] | null;
              company_references?: unknown;
            };

            return {
              ...prev,
              ...patch,
              sectors: patch.sectors || [],
              certifications: patch.certifications || [],
              qualifications: patch.qualifications || [],
              preferred_regions: patch.preferred_regions || [],
              company_references: Array.isArray(patch.company_references)
                ? patch.company_references
                : [],
            };
          });
        }
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // Sauvegarder le profil
  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error(t('companyProfile.errors.notAuthenticated'));

      const { error } = await (supabase
        .from('company_profiles') as any)
        .upsert({
          user_id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError(err instanceof Error ? err.message : t('companyProfile.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Calculer le pourcentage de complétion
  const getCompletionPercentage = () => {
    const fields = [
      profile.company_name,
      profile.siret,
      profile.legal_form,
      profile.address,
      profile.city,
      profile.contact_email,
      profile.contact_phone,
      profile.sectors.length > 0,
      profile.certifications.length > 0,
      profile.annual_revenue,
      profile.employee_count,
    ];
    
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completion = getCompletionPercentage();

  // Ajouter une référence
  const addReference = () => {
    const newRef: Reference = {
      id: `ref_${Date.now()}`,
      client_name: '',
      project_title: '',
      year: new Date().getFullYear(),
      value: 0,
      description: '',
    };
    setProfile({
      ...profile,
      company_references: [...profile.company_references, newRef],
    });
  };

  const updateReference = (index: number, ref: Reference) => {
    const refs = [...profile.company_references];
    refs[index] = ref;
    setProfile({ ...profile, company_references: refs });
  };

  const deleteReference = (index: number) => {
    setProfile({
      ...profile,
      company_references: profile.company_references.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <NewAppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </NewAppLayout>
    );
  }

  const tabs = [
    { id: 'general', label: t('companyProfile.tabs.general'), icon: Building2 },
    { id: 'qualifications', label: t('companyProfile.tabs.qualifications'), icon: Award },
    { id: 'documents', label: t('companyProfile.tabs.documents'), icon: FileText },
    { id: 'library', label: t('companyProfile.tabs.library'), icon: Briefcase },
    { id: 'references', label: t('companyProfile.tabs.references'), icon: Target },
    { id: 'preferences', label: t('companyProfile.tabs.preferences'), icon: TrendingUp },
  ];

  return (
    <NewAppLayout>
      <PageHeader
        title={t('companyProfile.title')}
        description={t('companyProfile.subtitle')}
        actions={
          <div className="flex items-center gap-3">
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-green-600"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('companyProfile.saved')}</span>
              </motion.div>
            )}
            <Button
              variant="primary"
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('companyProfile.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('companyProfile.save')}
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Barre de progression */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-surface-700">{t('companyProfile.progress.label')}</span>
          <span className={cn(
            'text-lg font-bold',
            completion >= 80 ? 'text-green-600' : completion >= 50 ? 'text-yellow-600' : 'text-orange-600'
          )}>
            {completion}%
          </span>
        </div>
        <Progress value={completion} className="h-2" />
        {completion < 80 && (
          <p className="text-sm text-surface-500 mt-2">
            {t('companyProfile.progress.help')}
          </p>
        )}
      </Card>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700'
                : 'text-surface-600 hover:bg-surface-100'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'general' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-surface-900 mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-500" />
                {t('companyProfile.general.title')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('companyProfile.general.companyName.label')}
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  placeholder={t('companyProfile.general.companyName.placeholder')}
                  leftIcon={<Building2 className="w-4 h-4" />}
                />
                
                <Input
                  label={t('companyProfile.general.siret.label')}
                  value={profile.siret}
                  onChange={(e) => setProfile({ ...profile, siret: e.target.value })}
                  placeholder={t('companyProfile.general.siret.placeholder')}
                />
                
                <Select
                  label={t('companyProfile.general.legalForm.label')}
                  value={profile.legal_form}
                  onChange={(e) => setProfile({ ...profile, legal_form: e.target.value })}
                  options={LEGAL_FORMS.map((f) => ({ value: f.value, label: t(f.labelKey) }))}
                />
                
                <Input
                  label={t('companyProfile.general.website.label')}
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder={t('companyProfile.general.website.placeholder')}
                  leftIcon={<Globe className="w-4 h-4" />}
                />
                
                <div className="md:col-span-2">
                  <Input
                    label={t('companyProfile.general.address.label')}
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder={t('companyProfile.general.address.placeholder')}
                    leftIcon={<MapPin className="w-4 h-4" />}
                  />
                </div>
                
                <Input
                  label={t('companyProfile.general.postalCode.label')}
                  value={profile.postal_code}
                  onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                  placeholder={t('companyProfile.general.postalCode.placeholder')}
                />
                
                <Input
                  label={t('companyProfile.general.city.label')}
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder={t('companyProfile.general.city.placeholder')}
                />
                
                <Input
                  label={t('companyProfile.general.contactEmail.label')}
                  type="email"
                  value={profile.contact_email}
                  onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
                  placeholder={t('companyProfile.general.contactEmail.placeholder')}
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                
                <Input
                  label={t('companyProfile.general.phone.label')}
                  value={profile.contact_phone}
                  onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })}
                  placeholder={t('companyProfile.general.phone.placeholder')}
                  leftIcon={<Phone className="w-4 h-4" />}
                />
                
                <Input
                  label={t('companyProfile.general.annualRevenue.label')}
                  type="number"
                  value={profile.annual_revenue || ''}
                  onChange={(e) => setProfile({ ...profile, annual_revenue: parseFloat(e.target.value) || null })}
                  placeholder={t('companyProfile.general.annualRevenue.placeholder')}
                  leftIcon={<Euro className="w-4 h-4" />}
                />
                
                <Input
                  label={t('companyProfile.general.employees.label')}
                  type="number"
                  value={profile.employee_count || ''}
                  onChange={(e) => setProfile({ ...profile, employee_count: parseInt(e.target.value) || null })}
                  placeholder={t('companyProfile.general.employees.placeholder')}
                  leftIcon={<Users className="w-4 h-4" />}
                />
                
                <Input
                  label={t('companyProfile.general.yearsExp.label')}
                  type="number"
                  value={profile.years_experience || ''}
                  onChange={(e) => setProfile({ ...profile, years_experience: parseInt(e.target.value) || null })}
                  placeholder={t('companyProfile.general.yearsExp.placeholder')}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </Card>
          )}

          {activeTab === 'qualifications' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-surface-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-500" />
                {t('companyProfile.qualifications.title')}
              </h3>
              
              <div className="space-y-6">
                <TagInput
                  label={t('companyProfile.qualifications.sectors.label')}
                  values={profile.sectors}
                  options={SECTORS.map((v) => ({ value: v, label: v }))}
                  onChange={(sectors) => setProfile({ ...profile, sectors })}
                  placeholder={t('companyProfile.qualifications.sectors.placeholder')}
                />
                
                <TagInput
                  label={t('companyProfile.qualifications.certifications.label')}
                  values={profile.certifications}
                  options={CERTIFICATIONS.map((v) => ({ value: v, label: v }))}
                  onChange={(certifications) => setProfile({ ...profile, certifications })}
                  placeholder={t('companyProfile.qualifications.certifications.placeholder')}
                />
                
                <TagInput
                  label={t('companyProfile.qualifications.qualifications.label')}
                  values={profile.qualifications}
                  options={[
                    { value: "Maître d'œuvre", label: "Maître d'œuvre" },
                    { value: "Bureau d'études", label: "Bureau d'études" },
                    { value: 'Entreprise générale', label: 'Entreprise générale' },
                    { value: 'Artisan', label: 'Artisan' },
                    { value: 'PME', label: 'PME' },
                    { value: 'ETI', label: 'ETI' },
                    { value: 'Grand compte', label: 'Grand compte' },
                  ]}
                  onChange={(qualifications) => setProfile({ ...profile, qualifications })}
                  placeholder={t('companyProfile.qualifications.qualifications.placeholder')}
                />
              </div>
            </Card>
          )}

          {activeTab === 'documents' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-surface-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                {t('companyProfile.documents.title')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-dashed border-surface-300 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">{t('companyProfile.documents.kbis.title')}</p>
                      <p className="text-sm text-surface-500">{t('companyProfile.documents.kbis.subtitle')}</p>
                    </div>
                  </div>
                  <Input
                    label={t('companyProfile.documents.kbis.validUntil')}
                    type="date"
                    value={profile.kbis_valid_until}
                    onChange={(e) => setProfile({ ...profile, kbis_valid_until: e.target.value })}
                  />
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {t('companyProfile.documents.kbis.upload')}
                  </Button>
                </div>
                
                <div className="p-4 border border-dashed border-surface-300 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">{t('companyProfile.documents.rc.title')}</p>
                      <p className="text-sm text-surface-500">{t('companyProfile.documents.rc.subtitle')}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {t('companyProfile.documents.rc.upload')}
                  </Button>
                </div>
                
                <div className="p-4 border border-dashed border-surface-300 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">{t('companyProfile.documents.decennale.title')}</p>
                      <p className="text-sm text-surface-500">{t('companyProfile.documents.decennale.subtitle')}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {t('companyProfile.documents.decennale.upload')}
                  </Button>
                </div>
                
                <div className="p-4 border border-dashed border-surface-300 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Euro className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">{t('companyProfile.documents.tax.title')}</p>
                      <p className="text-sm text-surface-500">{t('companyProfile.documents.tax.subtitle')}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {t('companyProfile.documents.tax.upload')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'references' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary-500" />
                  {t('companyProfile.references.title', { count: profile.company_references.length })}
                </h3>
                <Button variant="primary" size="sm" onClick={addReference}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('companyProfile.references.add')}
                </Button>
              </div>
              
              {profile.company_references.length === 0 ? (
                <Card className="p-8 text-center">
                  <Briefcase className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                  <h4 className="font-medium text-surface-900 mb-2">{t('companyProfile.references.empty.title')}</h4>
                  <p className="text-sm text-surface-500 mb-4">
                    {t('companyProfile.references.empty.subtitle')}
                  </p>
                  <Button variant="primary" size="sm" onClick={addReference}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('companyProfile.references.empty.cta')}
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {profile.company_references.map((ref, index) => (
                    <ReferenceCard
                      key={ref.id}
                      reference={ref}
                      onUpdate={(updated) => updateReference(index, updated)}
                      onDelete={() => deleteReference(index)}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-surface-900 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-500" />
                {t('companyProfile.preferences.title')}
              </h3>
              
              <div className="space-y-6">
                <TagInput
                  label={t('companyProfile.preferences.regions.label')}
                  values={profile.preferred_regions}
                  options={REGIONS.map((v) => ({ value: v, label: v }))}
                  onChange={(preferred_regions) => setProfile({ ...profile, preferred_regions })}
                  placeholder={t('companyProfile.preferences.regions.placeholder')}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={t('companyProfile.preferences.min.label')}
                    type="number"
                    value={profile.min_contract_value || ''}
                    onChange={(e) => setProfile({ ...profile, min_contract_value: parseFloat(e.target.value) || null })}
                    placeholder={t('companyProfile.preferences.min.placeholder')}
                    leftIcon={<Euro className="w-4 h-4" />}
                  />
                  
                  <Input
                    label={t('companyProfile.preferences.max.label')}
                    type="number"
                    value={profile.max_contract_value || ''}
                    onChange={(e) => setProfile({ ...profile, max_contract_value: parseFloat(e.target.value) || null })}
                    placeholder={t('companyProfile.preferences.max.placeholder')}
                    leftIcon={<Euro className="w-4 h-4" />}
                  />
                </div>
                
                <div className="p-4 bg-primary-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    <p className="font-medium text-primary-900">{t('companyProfile.preferences.tip.title')}</p>
                  </div>
                  <p className="text-sm text-primary-700">
                    {t('companyProfile.preferences.tip.body')}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'library' && (
            <div className="space-y-6">
              {/* Section Modèles de réponses */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-surface-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-500" />
                  {t('companyProfile.library.models.title')}
                </h3>
                <p className="text-sm text-surface-500 mb-6">
                  {t('companyProfile.library.models.subtitle')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border-2 border-dashed border-surface-300 rounded-lg hover:border-primary-400 transition-colors cursor-pointer text-center">
                    <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                    <p className="font-medium text-surface-700">{t('companyProfile.library.models.memory')}</p>
                    <p className="text-xs text-surface-500 mt-1">{t('companyProfile.library.models.memory.meta')}</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-1" />
                      {t('companyProfile.library.upload')}
                    </Button>
                  </div>
                  
                  <div className="p-4 border-2 border-dashed border-surface-300 rounded-lg hover:border-primary-400 transition-colors cursor-pointer text-center">
                    <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                    <p className="font-medium text-surface-700">{t('companyProfile.library.models.bpu')}</p>
                    <p className="text-xs text-surface-500 mt-1">{t('companyProfile.library.models.bpu.meta')}</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-1" />
                      {t('companyProfile.library.upload')}
                    </Button>
                  </div>
                  
                  <div className="p-4 border-2 border-dashed border-surface-300 rounded-lg hover:border-primary-400 transition-colors cursor-pointer text-center">
                    <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                    <p className="font-medium text-surface-700">{t('companyProfile.library.models.commitments')}</p>
                    <p className="text-xs text-surface-500 mt-1">{t('companyProfile.library.models.commitments.meta')}</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-1" />
                      {t('companyProfile.library.upload')}
                    </Button>
                  </div>
                  
                  <div className="p-4 border-2 border-dashed border-surface-300 rounded-lg hover:border-primary-400 transition-colors cursor-pointer text-center">
                    <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                    <p className="font-medium text-surface-700">{t('companyProfile.library.models.other')}</p>
                    <p className="text-xs text-surface-500 mt-1">{t('companyProfile.library.models.other.meta')}</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-1" />
                      {t('companyProfile.library.upload')}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Section Documents entreprise pour l'IA */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-surface-900 mb-2 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-500" />
                  {t('companyProfile.library.companyDocs.title')}
                </h3>
                <p className="text-sm text-surface-500 mb-6">
                  {t('companyProfile.library.companyDocs.subtitle')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border-2 border-dashed border-surface-300 rounded-lg hover:border-primary-400 transition-colors cursor-pointer text-center">
                    <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                    <p className="font-medium text-surface-700">{t('companyProfile.library.companyDocs.brochure')}</p>
                    <p className="text-xs text-surface-500 mt-1">{t('companyProfile.library.companyDocs.brochure.meta')}</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-1" />
                      {t('companyProfile.library.upload')}
                    </Button>
                  </div>
                  
                  <div className="p-4 border-2 border-dashed border-surface-300 rounded-lg hover:border-primary-400 transition-colors cursor-pointer text-center">
                    <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                    <p className="font-medium text-surface-700">{t('companyProfile.library.companyDocs.org')}</p>
                    <p className="text-xs text-surface-500 mt-1">{t('companyProfile.library.companyDocs.org.meta')}</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-1" />
                      {t('companyProfile.library.upload')}
                    </Button>
                  </div>
                  
                  <div className="p-4 border-2 border-dashed border-surface-300 rounded-lg hover:border-primary-400 transition-colors cursor-pointer text-center">
                    <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                    <p className="font-medium text-surface-700">{t('companyProfile.library.companyDocs.cv')}</p>
                    <p className="text-xs text-surface-500 mt-1">{t('companyProfile.library.companyDocs.cv.meta')}</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-1" />
                      {t('companyProfile.library.upload')}
                    </Button>
                  </div>
                  
                  <div className="p-4 border-2 border-dashed border-surface-300 rounded-lg hover:border-primary-400 transition-colors cursor-pointer text-center">
                    <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                    <p className="font-medium text-surface-700">{t('companyProfile.library.companyDocs.qse')}</p>
                    <p className="text-xs text-surface-500 mt-1">{t('companyProfile.library.companyDocs.qse.meta')}</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-1" />
                      {t('companyProfile.library.upload')}
                    </Button>
                  </div>
                  
                  <div className="p-4 border-2 border-dashed border-surface-300 rounded-lg hover:border-primary-400 transition-colors cursor-pointer text-center">
                    <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                    <p className="font-medium text-surface-700">{t('companyProfile.library.companyDocs.rse')}</p>
                    <p className="text-xs text-surface-500 mt-1">{t('companyProfile.library.companyDocs.rse.meta')}</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-1" />
                      {t('companyProfile.library.upload')}
                    </Button>
                  </div>
                  
                  <div className="p-4 border-2 border-dashed border-surface-300 rounded-lg hover:border-primary-400 transition-colors cursor-pointer text-center">
                    <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                    <p className="font-medium text-surface-700">{t('companyProfile.library.companyDocs.method')}</p>
                    <p className="text-xs text-surface-500 mt-1">{t('companyProfile.library.companyDocs.method.meta')}</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-1" />
                      {t('companyProfile.library.upload')}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Info box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">{t('companyProfile.confidentiality.title')}</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {t('companyProfile.confidentiality.body')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </NewAppLayout>
  );
}
