'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card, Badge } from '@/components/ui';
import { 
  User, Building2, Bell, Shield, CreditCard, Globe, Palette,
  Save, Camera, Trash2, CheckCircle, AlertTriangle, Key, Mail,
  Smartphone, LogOut, Download, Eye, EyeOff, ChevronRight
} from 'lucide-react';

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

interface BillingInfo {
  plan: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  billing_email: string;
  next_billing_date?: string;
  payment_method?: string;
  invoices: { id: string; date: string; amount: number; status: string }[];
}

type TabType = 'profile' | 'company' | 'notifications' | 'security' | 'billing' | 'preferences';

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

  const supabase = createClient();

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
    showMessage('success', 'Profil mis à jour avec succès');
    setSaving(false);
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    showMessage('success', 'Informations entreprise mises à jour');
    setSaving(false);
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    showMessage('success', 'Préférences de notifications enregistrées');
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      showMessage('error', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordForm.new.length < 8) {
      showMessage('error', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    showMessage('success', 'Mot de passe modifié avec succès');
    setPasswordForm({ current: '', new: '', confirm: '' });
    setSaving(false);
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Mon profil', icon: User },
    { id: 'company' as TabType, label: 'Entreprise', icon: Building2 },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
    { id: 'security' as TabType, label: 'Sécurité', icon: Shield },
    { id: 'billing' as TabType, label: 'Facturation', icon: CreditCard },
    { id: 'preferences' as TabType, label: 'Préférences', icon: Palette },
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
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 mt-1">Gérez votre compte et vos préférences</p>
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

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
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
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Mon profil</h2>
              
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
                    {profile.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </Badge>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <Input
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <Input
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
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
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </Card>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations entreprise</h2>
              
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
                    Changer le logo
                  </Button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale</label>
                    <Input
                      value={company.name}
                      onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
                    <Input
                      value={company.siret}
                      onChange={(e) => setCompany({ ...company, siret: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <Input
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                    <Input
                      value={company.postal_code}
                      onChange={(e) => setCompany({ ...company, postal_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                    <Input
                      value={company.city}
                      onChange={(e) => setCompany({ ...company, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                    <select
                      value={company.country}
                      onChange={(e) => setCompany({ ...company, country: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="FR">France</option>
                      <option value="BE">Belgique</option>
                      <option value="CH">Suisse</option>
                      <option value="DE">Allemagne</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                    <Input
                      type="url"
                      value={company.website || ''}
                      onChange={(e) => setCompany({ ...company, website: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <Input
                      type="tel"
                      value={company.phone || ''}
                      onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={company.description || ''}
                    onChange={(e) => setCompany({ ...company, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secteurs d'activité</label>
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
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Préférences de notifications</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Notifications par email</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">Nouveaux appels d'offres</p>
                        <p className="text-sm text-gray-500">Recevez un email quand un AO correspond à vos critères</p>
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
                        <p className="font-medium text-gray-700">Rappels de deadline</p>
                        <p className="text-sm text-gray-500">Soyez alerté avant la date limite de dépôt</p>
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
                        <p className="font-medium text-gray-700">Résultats d'attribution</p>
                        <p className="text-sm text-gray-500">Notification des résultats de vos candidatures</p>
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
                        <p className="font-medium text-gray-700">Newsletter</p>
                        <p className="text-sm text-gray-500">Conseils et actualités sur les marchés publics</p>
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
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Paramètres de rappel</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rappeler avant la deadline (jours)
                    </label>
                    <select
                      value={notifications.reminder_days}
                      onChange={(e) => setNotifications({ ...notifications, reminder_days: Number(e.target.value) })}
                      className="px-3 py-2 border rounded-lg"
                    >
                      <option value={3}>3 jours</option>
                      <option value={5}>5 jours</option>
                      <option value={7}>7 jours</option>
                      <option value={14}>14 jours</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">Notifications push</p>
                      <p className="text-sm text-gray-500">Notifications dans le navigateur</p>
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
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Changer le mot de passe</h2>
                
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe actuel
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
                      Nouveau mot de passe
                    </label>
                    <Input
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmer le mot de passe
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
                    {saving ? 'Modification...' : 'Modifier le mot de passe'}
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sessions actives</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">Chrome sur MacOS</p>
                        <p className="text-sm text-gray-500">Paris, France • Session actuelle</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
                <button className="mt-4 text-red-600 text-sm font-medium flex items-center gap-2 hover:text-red-700">
                  <LogOut className="w-4 h-4" />
                  Déconnecter toutes les autres sessions
                </button>
              </Card>

              <Card className="p-6 border-red-200">
                <h2 className="text-lg font-semibold text-red-600 mb-4">Zone de danger</h2>
                <p className="text-gray-600 mb-4">
                  La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.
                </p>
                <Button variant="danger">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer mon compte
                </Button>
              </Card>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Plan actuel</h2>
                  <Badge className={PLAN_DETAILS[billing.plan].color}>
                    {PLAN_DETAILS[billing.plan].name}
                  </Badge>
                </div>
                
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {PLAN_DETAILS[billing.plan].price}€
                  </span>
                  <span className="text-gray-500">/mois</span>
                </div>

                {billing.next_billing_date && (
                  <p className="text-sm text-gray-500 mb-6">
                    Prochain prélèvement le {new Date(billing.next_billing_date).toLocaleDateString('fr-FR')}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button>Changer de plan</Button>
                  <Button variant="secondary">Annuler l'abonnement</Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Moyen de paiement</h2>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Visa se terminant par 4242</p>
                      <p className="text-sm text-gray-500">Expire 12/2026</p>
                    </div>
                  </div>
                  <Button variant="secondary" className="text-sm">Modifier</Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de facturation
                  </label>
                  <Input
                    type="email"
                    value={billing.billing_email}
                    onChange={(e) => setBilling({ ...billing, billing_email: e.target.value })}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Historique des factures</h2>
                
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
                          {invoice.status === 'paid' ? 'Payée' : 'En attente'}
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
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Préférences d'affichage</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
                  <select className="px-3 py-2 border rounded-lg">
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="es">Español</option>
                    <option value="it">Italiano</option>
                    <option value="pt">Português</option>
                    <option value="nl">Nederlands</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuseau horaire</label>
                  <select className="px-3 py-2 border rounded-lg">
                    <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                    <option value="Europe/London">Europe/London (UTC+0)</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format de date</label>
                  <select className="px-3 py-2 border rounded-lg">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <select className="px-3 py-2 border rounded-lg">
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Export de données</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Téléchargez une copie de toutes vos données personnelles au format JSON.
                  </p>
                  <Button variant="secondary">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter mes données
                  </Button>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t">
                <Button disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
