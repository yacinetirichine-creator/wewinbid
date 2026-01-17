'use client';

import { useMemo, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card, Badge } from '@/components/ui';
import { 
  User, Building2, Bell, Shield, CreditCard, Globe, Palette,
  Save, Camera, Trash2, CheckCircle, AlertTriangle, Key, Mail,
  Smartphone, LogOut, Download, Eye, EyeOff, ChevronRight, Target, TrendingUp
} from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import { LOCALES, LOCALE_FLAGS, LOCALE_NAMES, type Locale } from '@/lib/i18n';

// Types
interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  siret: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  website?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  description?: string;
  sectors: string[];
}

interface NotificationSettings {
  email_new_tender: boolean;
  email_deadline_reminder: boolean;
  email_result_notification: boolean;
  email_newsletter: boolean;
  push_enabled: boolean;
  reminder_days: number;
}

interface MatchingPreferences {
  preferred_sectors: string[];
  keywords: string[];
  target_countries: string[];
  languages: string[];
  min_match_score: number;
  deadline_alert_days: number;
  auto_match_enabled: boolean;
  notify_new_matches: boolean;
}

interface BillingInfo {
  plan: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  billing_email: string;
  next_billing_date?: string;
  payment_method?: string;
  invoices: { id: string; date: string; amount: number; status: string }[];
}

type TabType = 'profile' | 'company' | 'notifications' | 'security' | 'billing' | 'matching' | 'preferences';

const SECTORS = [
  'Sécurité privée',
  'Sécurité électronique',
  'BTP / Construction',
  'Informatique / Développement',
  'Consulting',
  'Maintenance',
  'Nettoyage',
  'Transport',
  'Formation',
  'Santé',
  'Autre',
];

const PLAN_DETAILS = {
  FREE: { name: 'Gratuit', color: 'bg-gray-100 text-gray-800', price: 0 },
  PRO: { name: 'Pro', color: 'bg-blue-100 text-blue-800', price: 49 },
  BUSINESS: { name: 'Business', color: 'bg-purple-100 text-purple-800', price: 149 },
  ENTERPRISE: { name: 'Enterprise', color: 'bg-orange-100 text-orange-800', price: 399 },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    email: 'yacine@jarvis-sas.fr',
    first_name: 'Yacine',
    last_name: 'MMAYT',
    phone: '+33 6 12 34 56 78',
    role: 'admin',
    created_at: '2024-01-15T10:00:00Z',
  });

  const [company, setCompany] = useState<Company>({
    id: '1',
    name: 'JARVIS SAS',
    siret: '123 456 789 00012',
    address: '123 Avenue de la République',
    city: 'Paris',
    postal_code: '75011',
    country: 'FR',
    website: 'https://jarvis-sas.fr',
    phone: '+33 1 23 45 67 89',
    email: 'contact@jarvis-sas.fr',
    description: 'Éditeur de solutions SaaS innovantes pour les entreprises',
    sectors: ['Informatique / Développement', 'Consulting'],
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_new_tender: true,
    email_deadline_reminder: true,
    email_result_notification: true,
    email_newsletter: false,
    push_enabled: true,
    reminder_days: 7,
  });

  const [billing, setBilling] = useState<BillingInfo>({
    plan: 'PRO',
    billing_email: 'facturation@jarvis-sas.fr',
    next_billing_date: '2025-02-15',
    payment_method: '**** **** **** 4242',
    invoices: [
      { id: 'INV-2025-001', date: '2025-01-15', amount: 49, status: 'paid' },
      { id: 'INV-2024-012', date: '2024-12-15', amount: 49, status: 'paid' },
      { id: 'INV-2024-011', date: '2024-11-15', amount: 49, status: 'paid' },
    ],
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [matching, setMatching] = useState<MatchingPreferences>({
    preferred_sectors: [],
    keywords: [],
    target_countries: ['FR'],
    languages: ['fr'],
    min_match_score: 70,
    deadline_alert_days: 7,
    auto_match_enabled: true,
    notify_new_matches: true,
  });

  const [newKeyword, setNewKeyword] = useState('');

  const supabase = createClient();
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      'settings.title': 'Paramètres',
      'settings.subtitle': 'Gérez votre compte et vos préférences',
      'settings.tabs.profile': 'Mon profil',
      'settings.tabs.company': 'Entreprise',
      'settings.tabs.matching': 'Matching AO',
      'settings.tabs.notifications': 'Notifications',
      'settings.tabs.security': 'Sécurité',
      'settings.tabs.billing': 'Facturation',
      'settings.tabs.preferences': 'Préférences',
      'settings.message.passwordMismatch': 'Les mots de passe ne correspondent pas',
      'settings.message.passwordTooShort': 'Le mot de passe doit contenir au moins 8 caractères',
      'settings.message.passwordChanged': 'Mot de passe modifié avec succès',
      'settings.message.profileSaved': 'Profil mis à jour avec succès',
      'settings.message.companySaved': 'Informations entreprise mises à jour',
      'settings.message.matchingSaved': 'Préférences de matching enregistrées',
      'settings.message.matchingError': "Erreur lors de l'enregistrement",
      'settings.message.networkError': 'Erreur réseau',
      'settings.profile.title': 'Mon profil',
      'settings.profile.role.admin': 'Administrateur',
      'settings.profile.role.user': 'Utilisateur',
      'settings.profile.firstName': 'Prénom',
      'settings.profile.lastName': 'Nom',
      'settings.profile.email': 'Email',
      'settings.profile.phone': 'Téléphone',
      'settings.actions.saving': 'Enregistrement...',
      'settings.actions.save': 'Enregistrer',
      'settings.company.title': 'Informations entreprise',
      'settings.company.changeLogo': 'Changer le logo',
      'settings.company.name': 'Raison sociale',
      'settings.company.siret': 'SIRET',
      'settings.company.address': 'Adresse',
      'settings.company.postal': 'Code postal',
      'settings.company.city': 'Ville',
      'settings.company.country': 'Pays',
      'settings.company.website': 'Site web',
      'settings.company.description': 'Description',
      'settings.company.sectors': "Secteurs d'activité",
      'settings.company.country.fr': 'France',
      'settings.company.country.be': 'Belgique',
      'settings.company.country.ch': 'Suisse',
      'settings.company.country.de': 'Allemagne',
      'settings.matching.title': "Préférences de Matching des Appels d'Offres",
      'settings.matching.sectors.label': "Secteurs d'activité ciblés",
      'settings.matching.sectors.hint': 'Sélectionnez les secteurs pour lesquels vous souhaitez recevoir des recommandations',
      'settings.matching.sectors.count': '{count} secteur(s) sélectionné(s)',
      'settings.matching.keywords.label': 'Mots-clés de veille',
      'settings.matching.keywords.hint': 'Ajoutez des mots-clés pour affiner les recommandations (ex: vidéosurveillance, gardiennage...)',
      'settings.matching.keywords.placeholder': 'Ajouter un mot-clé...',
      'settings.matching.keywords.add': 'Ajouter',
      'settings.matching.keywords.empty': 'Aucun mot-clé défini',
      'settings.matching.countries.label': 'Pays ciblés',
      'settings.matching.countries.hint': 'Sélectionnez les pays où vous souhaitez répondre aux appels d\'offres',
      'settings.matching.languages.label': 'Langues maîtrisées',
      'settings.matching.languages.hint': 'Pour la traduction automatique et les opportunités internationales',
      'settings.matching.params.title': 'Paramètres de matching',
      'settings.matching.params.scoreLabel': 'Score minimum de pertinence',
      'settings.matching.params.score.low': '50% (Élargi)',
      'settings.matching.params.score.mid': '75% (Équilibré)',
      'settings.matching.params.score.high': '100% (Strict)',
      'settings.matching.params.deadlineLabel': 'Alerte deadline (jours avant échéance)',
      'settings.matching.params.deadline.3': '3 jours',
      'settings.matching.params.deadline.5': '5 jours',
      'settings.matching.params.deadline.7': '7 jours',
      'settings.matching.params.deadline.10': '10 jours',
      'settings.matching.params.deadline.14': '14 jours',
      'settings.matching.auto.title': 'Matching automatique',
      'settings.matching.auto.hint': 'Analyser automatiquement les nouveaux AO',
      'settings.matching.notify.title': 'Notifications de correspondances',
      'settings.matching.notify.hint': 'Recevoir une alerte pour chaque nouveau match',
      'settings.matching.summary.title': 'Résumé de vos préférences',
      'settings.matching.summary.sectors': 'secteurs ciblés',
      'settings.matching.summary.keywords': 'mots-clés',
      'settings.matching.summary.countries': 'pays',
      'settings.matching.summary.languages': 'langues',
      'settings.matching.save': 'Enregistrer les préférences',
      'settings.notifications.title': 'Préférences de notifications',
      'settings.notifications.email.title': 'Notifications par email',
      'settings.notifications.email.newTender.title': "Nouveaux appels d'offres",
      'settings.notifications.email.newTender.hint': 'Recevez un email quand un AO correspond à vos critères',
      'settings.notifications.email.deadline.title': 'Rappels de deadline',
      'settings.notifications.email.deadline.hint': 'Soyez alerté avant la date limite de dépôt',
      'settings.notifications.email.results.title': "Résultats d'attribution",
      'settings.notifications.email.results.hint': 'Notification des résultats de vos candidatures',
      'settings.notifications.email.newsletter.title': 'Newsletter',
      'settings.notifications.email.newsletter.hint': 'Conseils et actualités sur les marchés publics',
      'settings.notifications.reminder.title': 'Paramètres de rappel',
      'settings.notifications.reminder.label': 'Rappeler avant la deadline (jours)',
      'settings.notifications.reminder.3': '3 jours',
      'settings.notifications.reminder.5': '5 jours',
      'settings.notifications.reminder.7': '7 jours',
      'settings.notifications.reminder.14': '14 jours',
      'settings.notifications.push.title': 'Notifications push',
      'settings.notifications.push.hint': 'Notifications dans le navigateur',
      'settings.security.title': 'Changer le mot de passe',
      'settings.security.current': 'Mot de passe actuel',
      'settings.security.new': 'Nouveau mot de passe',
      'settings.security.confirm': 'Confirmer le mot de passe',
      'settings.security.change': 'Modifier le mot de passe',
      'settings.security.changing': 'Modification...',
      'settings.security.sessions': 'Sessions actives',
      'settings.security.session.active': 'Active',
      'settings.security.logoutAll': 'Déconnecter toutes les autres sessions',
      'settings.security.danger.title': 'Zone de danger',
      'settings.security.danger.hint': 'La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.',
      'settings.security.danger.delete': 'Supprimer mon compte',
      'settings.billing.currentPlan': 'Plan actuel',
      'settings.billing.perMonth': '/mois',
      'settings.billing.nextBilling': 'Prochain prélèvement le {date}',
      'settings.billing.changePlan': 'Changer de plan',
      'settings.billing.cancel': "Annuler l'abonnement",
      'settings.billing.paymentMethod': 'Moyen de paiement',
      'settings.billing.card': 'Visa se terminant par 4242',
      'settings.billing.cardExpires': 'Expire 12/2026',
      'settings.billing.edit': 'Modifier',
      'settings.billing.email': 'Email de facturation',
      'settings.billing.invoices': 'Historique des factures',
      'settings.billing.status.paid': 'Payée',
      'settings.billing.status.pending': 'En attente',
      'settings.preferences.title': "Préférences d'affichage",
      'settings.preferences.language': 'Langue',
      'settings.preferences.timezone': 'Fuseau horaire',
      'settings.preferences.dateFormat': 'Format de date',
      'settings.preferences.currency': 'Devise',
      'settings.preferences.export.title': 'Export de données',
      'settings.preferences.export.hint': 'Téléchargez une copie de toutes vos données personnelles au format JSON.',
      'settings.preferences.export.button': 'Exporter mes données',
      'settings.plan.free': 'Gratuit',
      'settings.plan.pro': 'Pro',
      'settings.plan.business': 'Business',
      'settings.plan.enterprise': 'Enterprise',
    }),
    []
  );

  const { t } = useUiTranslations(locale, entries);

  const formatTemplate = (template: string, values: Record<string, string | number>) => {
    return Object.entries(values).reduce((acc, [key, value]) => {
      return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }, template);
  };

  useEffect(() => {
    // Simulate loading
    setLoading(false);
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    showMessage('success', t('settings.message.profileSaved'));
    setSaving(false);
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    showMessage('success', t('settings.message.companySaved'));
    setSaving(false);
  };
  const handleSaveMatching = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matching),
      });
      
      if (response.ok) {
        showMessage('success', t('settings.message.matchingSaved'));
      } else {
        showMessage('error', t('settings.message.matchingError'));
      }
    } catch (error) {
      showMessage('error', t('settings.message.networkError'));
    }
    setSaving(false);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !matching.keywords.includes(newKeyword.trim())) {
      setMatching({ ...matching, keywords: [...matching.keywords, newKeyword.trim()] });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setMatching({ ...matching, keywords: matching.keywords.filter(k => k !== keyword) });
  };

  const toggleSector = (sector: string) => {
    const sectors = matching.preferred_sectors.includes(sector)
      ? matching.preferred_sectors.filter(s => s !== sector)
      : [...matching.preferred_sectors, sector];
    setMatching({ ...matching, preferred_sectors: sectors });
  };

  const toggleCountry = (country: string) => {
    const countries = matching.target_countries.includes(country)
      ? matching.target_countries.filter(c => c !== country)
      : [...matching.target_countries, country];
    setMatching({ ...matching, target_countries: countries });
  };

  const toggleLanguage = (lang: string) => {
    const languages = matching.languages.includes(lang)
      ? matching.languages.filter(l => l !== lang)
      : [...matching.languages, lang];
    setMatching({ ...matching, languages: languages });
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      showMessage('error', t('settings.message.passwordMismatch'));
      return;
    }
    if (passwordForm.new.length < 8) {
      showMessage('error', t('settings.message.passwordTooShort'));
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    showMessage('success', t('settings.message.passwordChanged'));
    setPasswordForm({ current: '', new: '', confirm: '' });
    setSaving(false);
  };

  const tabs = [
    { id: 'profile' as TabType, label: t('settings.tabs.profile'), icon: User },
    { id: 'company' as TabType, label: t('settings.tabs.company'), icon: Building2 },
    { id: 'matching' as TabType, label: t('settings.tabs.matching'), icon: Target },
    { id: 'notifications' as TabType, label: t('settings.tabs.notifications'), icon: Bell },
    { id: 'security' as TabType, label: t('settings.tabs.security'), icon: Shield },
    { id: 'billing' as TabType, label: t('settings.tabs.billing'), icon: CreditCard },
    { id: 'preferences' as TabType, label: t('settings.tabs.preferences'), icon: Palette },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <Card className="p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('settings.profile.title')}</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="relative">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-semibold text-blue-600">
                    {profile.first_name[0]}{profile.last_name[0]}
                  </div>
                  <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg border">
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{profile.first_name} {profile.last_name}</p>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                  <Badge className="mt-1 bg-blue-100 text-blue-800">
                    {profile.role === 'admin' ? t('settings.profile.role.admin') : t('settings.profile.role.user')}
                  </Badge>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.profile.firstName')}</label>
                  <Input
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.profile.lastName')}</label>
                  <Input
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.profile.email')}</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.profile.phone')}</label>
                  <Input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? t('settings.actions.saving') : t('settings.actions.save')}
                </Button>
              </div>
            </Card>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('settings.company.title')}</h2>
              
              {/* Logo */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{company.name}</p>
                  <p className="text-sm text-gray-500">SIRET: {company.siret}</p>
                  <Button variant="secondary" className="mt-2 text-sm">
                    <Camera className="w-4 h-4 mr-1" />
                    {t('settings.company.changeLogo')}
                  </Button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.company.name')}</label>
                    <Input
                      value={company.name}
                      onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.company.siret')}</label>
                    <Input
                      value={company.siret}
                      onChange={(e) => setCompany({ ...company, siret: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.company.address')}</label>
                  <Input
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.company.postal')}</label>
                    <Input
                      value={company.postal_code}
                      onChange={(e) => setCompany({ ...company, postal_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.company.city')}</label>
                    <Input
                      value={company.city}
                      onChange={(e) => setCompany({ ...company, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.company.country')}</label>
                    <select
                      value={company.country}
                      onChange={(e) => setCompany({ ...company, country: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="FR">{t('settings.company.country.fr')}</option>
                      <option value="BE">{t('settings.company.country.be')}</option>
                      <option value="CH">{t('settings.company.country.ch')}</option>
                      <option value="DE">{t('settings.company.country.de')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.company.website')}</label>
                    <Input
                      type="url"
                      value={company.website || ''}
                      onChange={(e) => setCompany({ ...company, website: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.profile.phone')}</label>
                    <Input
                      type="tel"
                      value={company.phone || ''}
                      onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.company.description')}</label>
                  <textarea
                    value={company.description || ''}
                    onChange={(e) => setCompany({ ...company, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.company.sectors')}</label>
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map((sector) => (
                      <button
                        key={sector}
                        onClick={() => {
                          const newSectors = company.sectors.includes(sector)
                            ? company.sectors.filter(s => s !== sector)
                            : [...company.sectors, sector];
                          setCompany({ ...company, sectors: newSectors });
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          company.sectors.includes(sector)
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {sector}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t">
                <Button onClick={handleSaveCompany} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? t('settings.actions.saving') : t('settings.actions.save')}
                </Button>
              </div>
            </Card>
          )}

          {/* Matching Tab */}
          {activeTab === 'matching' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                {t('settings.matching.title')}
              </h2>
              
              <div className="space-y-6">
                {/* Secteurs préférés */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    {t('settings.matching.sectors.label')}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    {t('settings.matching.sectors.hint')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map((sector) => (
                      <button
                        key={sector}
                        onClick={() => toggleSector(sector)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          matching.preferred_sectors.includes(sector)
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {sector}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatTemplate(t('settings.matching.sectors.count'), { count: matching.preferred_sectors.length })}
                  </p>
                </div>

                {/* Mots-clés */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    {t('settings.matching.keywords.label')}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    {t('settings.matching.keywords.hint')}
                  </p>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder={t('settings.matching.keywords.placeholder')}
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button onClick={addKeyword} variant="secondary">
                      {t('settings.matching.keywords.add')}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matching.keywords.map((keyword) => (
                      <Badge key={keyword} variant="primary" className="flex items-center gap-2">
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="hover:text-red-500 ml-1"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {matching.keywords.length === 0 && (
                    <p className="text-sm text-gray-400 italic">{t('settings.matching.keywords.empty')}</p>
                  )}
                </div>

                {/* Pays cibles */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    {t('settings.matching.countries.label')}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    {t('settings.matching.countries.hint')}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { code: 'FR', name: 'France', flag: '🇫🇷' },
                      { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
                      { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
                      { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
                      { code: 'IT', name: 'Italie', flag: '🇮🇹' },
                      { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
                      { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
                      { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
                      { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
                    ].map((country) => (
                      <button
                        key={country.code}
                        onClick={() => toggleCountry(country.code)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          matching.target_countries.includes(country.code)
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {country.flag} {country.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Langues */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    {t('settings.matching.languages.label')}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    {t('settings.matching.languages.hint')}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {[
                      { code: 'fr', name: 'Français', flag: '🇫🇷' },
                      { code: 'en', name: 'Anglais', flag: '🇬🇧' },
                      { code: 'de', name: 'Allemand', flag: '🇩🇪' },
                      { code: 'es', name: 'Espagnol', flag: '🇪🇸' },
                      { code: 'it', name: 'Italien', flag: '🇮🇹' },
                      { code: 'pt', name: 'Portugais', flag: '🇵🇹' },
                      { code: 'nl', name: 'Néerlandais', flag: '🇳🇱' },
                      { code: 'ar-MA', name: 'Darija (Maroc)', flag: '🇲🇦' },
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => toggleLanguage(lang.code)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          matching.languages.includes(lang.code)
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {lang.flag} {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paramètres de matching */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">{t('settings.matching.params.title')}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700">{t('settings.matching.params.scoreLabel')}</span>
                        <span className="text-sm font-semibold text-blue-600">{matching.min_match_score}%</span>
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        value={matching.min_match_score}
                        onChange={(e) => setMatching({ ...matching, min_match_score: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{t('settings.matching.params.score.low')}</span>
                        <span>{t('settings.matching.params.score.mid')}</span>
                        <span>{t('settings.matching.params.score.high')}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        {t('settings.matching.params.deadlineLabel')}
                      </label>
                      <select
                        value={matching.deadline_alert_days}
                        onChange={(e) => setMatching({ ...matching, deadline_alert_days: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="3">{t('settings.matching.params.deadline.3')}</option>
                        <option value="5">{t('settings.matching.params.deadline.5')}</option>
                        <option value="7">{t('settings.matching.params.deadline.7')}</option>
                        <option value="10">{t('settings.matching.params.deadline.10')}</option>
                        <option value="14">{t('settings.matching.params.deadline.14')}</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-700">{t('settings.matching.auto.title')}</p>
                        <p className="text-sm text-gray-500">{t('settings.matching.auto.hint')}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={matching.auto_match_enabled}
                        onChange={(e) => setMatching({ ...matching, auto_match_enabled: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-700">{t('settings.matching.notify.title')}</p>
                        <p className="text-sm text-gray-500">{t('settings.matching.notify.hint')}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={matching.notify_new_matches}
                        onChange={(e) => setMatching({ ...matching, notify_new_matches: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Résumé */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {t('settings.matching.summary.title')}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">{matching.preferred_sectors.length}</span>
                      <span className="text-blue-600"> {t('settings.matching.summary.sectors')}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">{matching.keywords.length}</span>
                      <span className="text-blue-600"> {t('settings.matching.summary.keywords')}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">{matching.target_countries.length}</span>
                      <span className="text-blue-600"> {t('settings.matching.summary.countries')}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">{matching.languages.length}</span>
                      <span className="text-blue-600"> {t('settings.matching.summary.languages')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t">
                <Button onClick={handleSaveMatching} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? t('settings.actions.saving') : t('settings.matching.save')}
                </Button>
              </div>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('settings.notifications.title')}</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">{t('settings.notifications.email.title')}</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">{t('settings.notifications.email.newTender.title')}</p>
                        <p className="text-sm text-gray-500">{t('settings.notifications.email.newTender.hint')}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.email_new_tender}
                        onChange={(e) => setNotifications({ ...notifications, email_new_tender: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">{t('settings.notifications.email.deadline.title')}</p>
                        <p className="text-sm text-gray-500">{t('settings.notifications.email.deadline.hint')}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.email_deadline_reminder}
                        onChange={(e) => setNotifications({ ...notifications, email_deadline_reminder: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">{t('settings.notifications.email.results.title')}</p>
                        <p className="text-sm text-gray-500">{t('settings.notifications.email.results.hint')}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.email_result_notification}
                        onChange={(e) => setNotifications({ ...notifications, email_result_notification: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">{t('settings.notifications.email.newsletter.title')}</p>
                        <p className="text-sm text-gray-500">{t('settings.notifications.email.newsletter.hint')}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.email_newsletter}
                        onChange={(e) => setNotifications({ ...notifications, email_newsletter: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </label>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">{t('settings.notifications.reminder.title')}</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('settings.notifications.reminder.label')}
                    </label>
                    <select
                      value={notifications.reminder_days}
                      onChange={(e) => setNotifications({ ...notifications, reminder_days: Number(e.target.value) })}
                      className="px-3 py-2 border rounded-lg"
                    >
                      <option value={3}>{t('settings.notifications.reminder.3')}</option>
                      <option value={5}>{t('settings.notifications.reminder.5')}</option>
                      <option value={7}>{t('settings.notifications.reminder.7')}</option>
                      <option value={14}>{t('settings.notifications.reminder.14')}</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">{t('settings.notifications.push.title')}</p>
                      <p className="text-sm text-gray-500">{t('settings.notifications.push.hint')}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.push_enabled}
                      onChange={(e) => setNotifications({ ...notifications, push_enabled: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t">
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? t('settings.actions.saving') : t('settings.actions.save')}
                </Button>
              </div>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('settings.security.title')}</h2>
                
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('settings.security.current')}
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('settings.security.new')}
                    </label>
                    <Input
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('settings.security.confirm')}
                    </label>
                    <Input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t">
                  <Button onClick={handleChangePassword} disabled={saving}>
                    <Key className="w-4 h-4 mr-2" />
                    {saving ? t('settings.security.changing') : t('settings.security.change')}
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.security.sessions')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">Chrome sur MacOS</p>
                        <p className="text-sm text-gray-500">Paris, France • Session actuelle</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{t('settings.security.session.active')}</Badge>
                  </div>
                </div>
                <button className="mt-4 text-red-600 text-sm font-medium flex items-center gap-2 hover:text-red-700">
                  <LogOut className="w-4 h-4" />
                  {t('settings.security.logoutAll')}
                </button>
              </Card>

              <Card className="p-6 border-red-200">
                <h2 className="text-lg font-semibold text-red-600 mb-4">{t('settings.security.danger.title')}</h2>
                <p className="text-gray-600 mb-4">
                  {t('settings.security.danger.hint')}
                </p>
                <Button variant="danger">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('settings.security.danger.delete')}
                </Button>
              </Card>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">{t('settings.billing.currentPlan')}</h2>
                  <Badge className={PLAN_DETAILS[billing.plan].color}>
                    {billing.plan === 'FREE'
                      ? t('settings.plan.free')
                      : billing.plan === 'PRO'
                        ? t('settings.plan.pro')
                        : billing.plan === 'BUSINESS'
                          ? t('settings.plan.business')
                          : t('settings.plan.enterprise')}
                  </Badge>
                </div>
                
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {PLAN_DETAILS[billing.plan].price}€
                  </span>
                  <span className="text-gray-500">{t('settings.billing.perMonth')}</span>
                </div>

                {billing.next_billing_date && (
                  <p className="text-sm text-gray-500 mb-6">
                    {formatTemplate(t('settings.billing.nextBilling'), {
                      date: new Date(billing.next_billing_date).toLocaleDateString('fr-FR'),
                    })}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button>{t('settings.billing.changePlan')}</Button>
                  <Button variant="secondary">{t('settings.billing.cancel')}</Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('settings.billing.paymentMethod')}</h2>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{t('settings.billing.card')}</p>
                      <p className="text-sm text-gray-500">{t('settings.billing.cardExpires')}</p>
                    </div>
                  </div>
                  <Button variant="secondary" className="text-sm">{t('settings.billing.edit')}</Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('settings.billing.email')}
                  </label>
                  <Input
                    type="email"
                    value={billing.billing_email}
                    onChange={(e) => setBilling({ ...billing, billing_email: e.target.value })}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('settings.billing.invoices')}</h2>
                
                <div className="space-y-3">
                  {billing.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(invoice.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-900">{invoice.amount}€</span>
                        <Badge className={invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {invoice.status === 'paid'
                            ? t('settings.billing.status.paid')
                            : t('settings.billing.status.pending')}
                        </Badge>
                        <button className="text-blue-600 hover:text-blue-700">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('settings.preferences.title')}</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.preferences.language')}</label>
                  <select
                    className="px-3 py-2 border rounded-lg"
                    value={locale}
                    onChange={(e) => {
                      const next = e.target.value as Locale;
                      window.localStorage.setItem('locale', next);
                      window.location.reload();
                    }}
                  >
                    {LOCALES.map((option) => (
                      <option key={option} value={option}>
                        {LOCALE_FLAGS[option]} {LOCALE_NAMES[option]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.preferences.timezone')}</label>
                  <select className="px-3 py-2 border rounded-lg">
                    <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                    <option value="Europe/London">Europe/London (UTC+0)</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.preferences.dateFormat')}</label>
                  <select className="px-3 py-2 border rounded-lg">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.preferences.currency')}</label>
                  <select className="px-3 py-2 border rounded-lg">
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">{t('settings.preferences.export.title')}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('settings.preferences.export.hint')}
                  </p>
                  <Button variant="secondary">
                    <Download className="w-4 h-4 mr-2" />
                    {t('settings.preferences.export.button')}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t">
                <Button disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {t('settings.actions.save')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
