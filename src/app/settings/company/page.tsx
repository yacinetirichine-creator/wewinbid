'use client';

import { useState, useEffect, useCallback } from 'react';
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
  { value: 'SAS', label: 'SAS - Société par Actions Simplifiée' },
  { value: 'SARL', label: 'SARL - Société à Responsabilité Limitée' },
  { value: 'SA', label: 'SA - Société Anonyme' },
  { value: 'EURL', label: 'EURL - Entreprise Unipersonnelle à Responsabilité Limitée' },
  { value: 'EI', label: 'EI - Entreprise Individuelle' },
  { value: 'SASU', label: 'SASU - Société par Actions Simplifiée Unipersonnelle' },
  { value: 'SNC', label: 'SNC - Société en Nom Collectif' },
  { value: 'OTHER', label: 'Autre' },
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
  options: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredOptions = options.filter(
    opt => !values.includes(opt) && opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  const addTag = (tag: string) => {
    if (!values.includes(tag)) {
      onChange([...values, tag]);
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
                key={opt}
                type="button"
                onClick={() => addTag(opt)}
                className="w-full px-4 py-2 text-left hover:bg-surface-50 text-sm"
              >
                {opt}
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
}: {
  reference: Reference;
  onUpdate: (ref: Reference) => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary-500" />
          <h4 className="font-semibold text-surface-900">Référence</h4>
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
          label="Nom du client"
          value={reference.client_name}
          onChange={(e) => onUpdate({ ...reference, client_name: e.target.value })}
          placeholder="Mairie de Paris"
        />
        <Input
          label="Intitulé du projet"
          value={reference.project_title}
          onChange={(e) => onUpdate({ ...reference, project_title: e.target.value })}
          placeholder="Maintenance espaces verts"
        />
        <Input
          label="Année"
          type="number"
          value={reference.year || ''}
          onChange={(e) => onUpdate({ ...reference, year: parseInt(e.target.value) })}
          placeholder="2024"
        />
        <Input
          label="Montant (€)"
          type="number"
          value={reference.value || ''}
          onChange={(e) => onUpdate({ ...reference, value: parseInt(e.target.value) })}
          placeholder="150000"
        />
        <div className="md:col-span-2">
          <Textarea
            label="Description"
            value={reference.description}
            onChange={(e) => onUpdate({ ...reference, description: e.target.value })}
            placeholder="Décrivez brièvement la mission réalisée..."
            rows={2}
          />
        </div>
        <Input
          label="Contact référent"
          value={reference.contact_name || ''}
          onChange={(e) => onUpdate({ ...reference, contact_name: e.target.value })}
          placeholder="M. Dupont"
        />
        <Input
          label="Email du contact"
          type="email"
          value={reference.contact_email || ''}
          onChange={(e) => onUpdate({ ...reference, contact_email: e.target.value })}
          placeholder="contact@exemple.fr"
        />
      </div>
    </Card>
  );
}

export default function CompanyProfilePage() {
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
  const [activeTab, setActiveTab] = useState<'general' | 'qualifications' | 'documents' | 'references' | 'preferences'>('general');

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
          setProfile({
            ...profile,
            ...data,
            sectors: data.sectors || [],
            certifications: data.certifications || [],
            qualifications: data.qualifications || [],
            preferred_regions: data.preferred_regions || [],
            company_references: data.company_references || [],
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
      
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('company_profiles')
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
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
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
    { id: 'general', label: 'Informations générales', icon: Building2 },
    { id: 'qualifications', label: 'Qualifications', icon: Award },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'references', label: 'Références', icon: Briefcase },
    { id: 'preferences', label: 'Préférences', icon: Target },
  ];

  return (
    <NewAppLayout>
      <PageHeader
        title="Profil entreprise"
        description="Configurez votre profil pour améliorer la compatibilité avec les AO"
        actions={
          <div className="flex items-center gap-3">
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-green-600"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Sauvegardé</span>
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
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Barre de progression */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-surface-700">Profil complété à</span>
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
            Complétez votre profil pour améliorer le score de compatibilité avec les AO
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
                Informations de l'entreprise
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Raison sociale"
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  placeholder="Ma Société SAS"
                  leftIcon={<Building2 className="w-4 h-4" />}
                />
                
                <Input
                  label="SIRET"
                  value={profile.siret}
                  onChange={(e) => setProfile({ ...profile, siret: e.target.value })}
                  placeholder="123 456 789 00012"
                />
                
                <Select
                  label="Forme juridique"
                  value={profile.legal_form}
                  onChange={(e) => setProfile({ ...profile, legal_form: e.target.value })}
                  options={LEGAL_FORMS}
                />
                
                <Input
                  label="Site web"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://www.exemple.fr"
                  leftIcon={<Globe className="w-4 h-4" />}
                />
                
                <div className="md:col-span-2">
                  <Input
                    label="Adresse"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="123 rue de la Paix"
                    leftIcon={<MapPin className="w-4 h-4" />}
                  />
                </div>
                
                <Input
                  label="Code postal"
                  value={profile.postal_code}
                  onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                  placeholder="75001"
                />
                
                <Input
                  label="Ville"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="Paris"
                />
                
                <Input
                  label="Email de contact"
                  type="email"
                  value={profile.contact_email}
                  onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
                  placeholder="contact@exemple.fr"
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                
                <Input
                  label="Téléphone"
                  value={profile.contact_phone}
                  onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })}
                  placeholder="01 23 45 67 89"
                  leftIcon={<Phone className="w-4 h-4" />}
                />
                
                <Input
                  label="Chiffre d'affaires annuel (€)"
                  type="number"
                  value={profile.annual_revenue || ''}
                  onChange={(e) => setProfile({ ...profile, annual_revenue: parseFloat(e.target.value) || null })}
                  placeholder="1000000"
                  leftIcon={<Euro className="w-4 h-4" />}
                />
                
                <Input
                  label="Nombre de salariés"
                  type="number"
                  value={profile.employee_count || ''}
                  onChange={(e) => setProfile({ ...profile, employee_count: parseInt(e.target.value) || null })}
                  placeholder="50"
                  leftIcon={<Users className="w-4 h-4" />}
                />
                
                <Input
                  label="Années d'expérience"
                  type="number"
                  value={profile.years_experience || ''}
                  onChange={(e) => setProfile({ ...profile, years_experience: parseInt(e.target.value) || null })}
                  placeholder="10"
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </Card>
          )}

          {activeTab === 'qualifications' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-surface-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-500" />
                Qualifications et compétences
              </h3>
              
              <div className="space-y-6">
                <TagInput
                  label="Secteurs d'activité"
                  values={profile.sectors}
                  options={SECTORS}
                  onChange={(sectors) => setProfile({ ...profile, sectors })}
                  placeholder="Ajouter un secteur..."
                />
                
                <TagInput
                  label="Certifications"
                  values={profile.certifications}
                  options={CERTIFICATIONS}
                  onChange={(certifications) => setProfile({ ...profile, certifications })}
                  placeholder="Ajouter une certification..."
                />
                
                <TagInput
                  label="Qualifications métier"
                  values={profile.qualifications}
                  options={[
                    'Maître d\'œuvre',
                    'Bureau d\'études',
                    'Entreprise générale',
                    'Artisan',
                    'PME',
                    'ETI',
                    'Grand compte',
                  ]}
                  onChange={(qualifications) => setProfile({ ...profile, qualifications })}
                  placeholder="Ajouter une qualification..."
                />
              </div>
            </Card>
          )}

          {activeTab === 'documents' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-surface-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                Documents administratifs
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-dashed border-surface-300 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">Extrait KBIS</p>
                      <p className="text-sm text-surface-500">Moins de 3 mois</p>
                    </div>
                  </div>
                  <Input
                    label="Date de validité"
                    type="date"
                    value={profile.kbis_valid_until}
                    onChange={(e) => setProfile({ ...profile, kbis_valid_until: e.target.value })}
                  />
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader le KBIS
                  </Button>
                </div>
                
                <div className="p-4 border border-dashed border-surface-300 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">Assurance RC Pro</p>
                      <p className="text-sm text-surface-500">Attestation en cours</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader l'attestation
                  </Button>
                </div>
                
                <div className="p-4 border border-dashed border-surface-300 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">Assurance décennale</p>
                      <p className="text-sm text-surface-500">Si applicable</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader l'attestation
                  </Button>
                </div>
                
                <div className="p-4 border border-dashed border-surface-300 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Euro className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">Attestation fiscale</p>
                      <p className="text-sm text-surface-500">À jour des impôts</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader l'attestation
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
                  Références clients ({profile.company_references.length})
                </h3>
                <Button variant="primary" size="sm" onClick={addReference}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une référence
                </Button>
              </div>
              
              {profile.company_references.length === 0 ? (
                <Card className="p-8 text-center">
                  <Briefcase className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                  <h4 className="font-medium text-surface-900 mb-2">Aucune référence</h4>
                  <p className="text-sm text-surface-500 mb-4">
                    Ajoutez vos références clients pour renforcer votre candidature
                  </p>
                  <Button variant="primary" size="sm" onClick={addReference}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter ma première référence
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
                Préférences de recherche
              </h3>
              
              <div className="space-y-6">
                <TagInput
                  label="Régions préférées"
                  values={profile.preferred_regions}
                  options={REGIONS}
                  onChange={(preferred_regions) => setProfile({ ...profile, preferred_regions })}
                  placeholder="Ajouter une région..."
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Montant minimum des marchés (€)"
                    type="number"
                    value={profile.min_contract_value || ''}
                    onChange={(e) => setProfile({ ...profile, min_contract_value: parseFloat(e.target.value) || null })}
                    placeholder="10000"
                    leftIcon={<Euro className="w-4 h-4" />}
                  />
                  
                  <Input
                    label="Montant maximum des marchés (€)"
                    type="number"
                    value={profile.max_contract_value || ''}
                    onChange={(e) => setProfile({ ...profile, max_contract_value: parseFloat(e.target.value) || null })}
                    placeholder="500000"
                    leftIcon={<Euro className="w-4 h-4" />}
                  />
                </div>
                
                <div className="p-4 bg-primary-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    <p className="font-medium text-primary-900">Astuce</p>
                  </div>
                  <p className="text-sm text-primary-700">
                    Plus votre profil est complet, plus le score de compatibilité sera précis.
                    Les informations sont utilisées pour l'analyse IA et la génération automatique de documents.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </NewAppLayout>
  );
}
