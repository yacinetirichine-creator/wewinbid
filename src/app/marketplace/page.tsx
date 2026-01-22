'use client';

import { useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Card, 
  CardContent,
  Button, 
  Input, 
  Badge 
} from '@/components/ui';
import { NewAppLayout as AppLayout, PageHeader } from '@/components/layout/NewAppLayout';
import {
  Search,
  Filter,
  Star,
  MapPin,
  Building2,
  Shield,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  Users,
  Briefcase,
  Award,
  Clock,
  Heart,
  Send,
} from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

// Types
interface Partner {
  id: string;
  company_name: string;
  logo_url?: string;
  description: string;
  sectors: string[];
  services: string[];
  certifications: string[];
  location: {
    city: string;
    region: string;
    country: string;
  };
  rating: number;
  reviews_count: number;
  completed_projects: number;
  response_time: string; // "< 24h", "24-48h", etc.
  verified: boolean;
  premium: boolean;
  contact_email: string;
  website?: string;
  min_budget?: number;
  max_budget?: number;
}

// Données de démonstration
const DEMO_PARTNERS: Partner[] = [
  {
    id: '1',
    company_name: 'SecuriTech Solutions',
    description: 'Expert en sécurité électronique depuis 15 ans. Vidéosurveillance, contrôle d\'accès, alarmes intrusion. Certification APSAD.',
    sectors: ['Sécurité électronique', 'Vidéosurveillance', 'Contrôle d\'accès'],
    services: ['Installation', 'Maintenance', 'Audit', 'Formation'],
    certifications: ['APSAD', 'ISO 9001', 'Qualifelec'],
    location: { city: 'Lyon', region: 'Auvergne-Rhône-Alpes', country: 'France' },
    rating: 4.8,
    reviews_count: 47,
    completed_projects: 234,
    response_time: '< 24h',
    verified: true,
    premium: true,
    contact_email: 'contact@securitech.fr',
    website: 'https://securitech.fr',
    min_budget: 5000,
    max_budget: 500000,
  },
  {
    id: '2',
    company_name: 'BTP Conseil & Ingénierie',
    description: 'Bureau d\'études techniques spécialisé en marchés publics de travaux. Accompagnement de la conception à la réception.',
    sectors: ['BTP', 'Génie civil', 'VRD'],
    services: ['Études techniques', 'Maîtrise d\'œuvre', 'OPC', 'Conseil'],
    certifications: ['OPQIBI', 'RGE'],
    location: { city: 'Paris', region: 'Île-de-France', country: 'France' },
    rating: 4.6,
    reviews_count: 32,
    completed_projects: 156,
    response_time: '24-48h',
    verified: true,
    premium: false,
    contact_email: 'contact@btpconseil.fr',
    min_budget: 10000,
    max_budget: 2000000,
  },
  {
    id: '3',
    company_name: 'CleanPro Services',
    description: 'Services de propreté et multiservices pour collectivités et entreprises. Certifié Qualipropre.',
    sectors: ['Propreté', 'Multiservices', 'Espaces verts'],
    services: ['Nettoyage', 'Vitrerie', 'Espaces verts', 'Logistique'],
    certifications: ['Qualipropre', 'ISO 14001', 'Ecocert'],
    location: { city: 'Bordeaux', region: 'Nouvelle-Aquitaine', country: 'France' },
    rating: 4.5,
    reviews_count: 89,
    completed_projects: 412,
    response_time: '< 24h',
    verified: true,
    premium: true,
    contact_email: 'marches@cleanpro.fr',
    website: 'https://cleanpro-services.fr',
    min_budget: 1000,
    max_budget: 100000,
  },
  {
    id: '4',
    company_name: 'Digital Factory',
    description: 'Développement logiciel et transformation digitale. Expertise en applications métier et portails citoyens.',
    sectors: ['Informatique', 'Développement', 'Transformation digitale'],
    services: ['Développement', 'Intégration', 'Maintenance', 'Hébergement'],
    certifications: ['ISO 27001', 'SecNumCloud'],
    location: { city: 'Nantes', region: 'Pays de la Loire', country: 'France' },
    rating: 4.9,
    reviews_count: 28,
    completed_projects: 87,
    response_time: '< 24h',
    verified: true,
    premium: true,
    contact_email: 'commercial@digitalfactory.fr',
    website: 'https://digitalfactory.fr',
    min_budget: 20000,
    max_budget: 1000000,
  },
  {
    id: '5',
    company_name: 'Gardiennage Plus',
    description: 'Sécurité humaine et surveillance. Agents de sécurité qualifiés SSIAP. Intervention 24/7.',
    sectors: ['Sécurité privée', 'Gardiennage', 'Surveillance'],
    services: ['Gardiennage', 'Rondes', 'Intervention', 'Événementiel'],
    certifications: ['CNAPS', 'SSIAP', 'ISO 9001'],
    location: { city: 'Marseille', region: 'Provence-Alpes-Côte d\'Azur', country: 'France' },
    rating: 4.4,
    reviews_count: 56,
    completed_projects: 198,
    response_time: '< 24h',
    verified: true,
    premium: false,
    contact_email: 'devis@gardiennageplus.fr',
    min_budget: 2000,
    max_budget: 300000,
  },
  {
    id: '6',
    company_name: 'Formation Excellence',
    description: 'Organisme de formation professionnelle. Formations réglementaires, management, bureautique.',
    sectors: ['Formation', 'Conseil RH', 'Coaching'],
    services: ['Formation présentielle', 'E-learning', 'Coaching', 'Bilan de compétences'],
    certifications: ['Qualiopi', 'Datadock'],
    location: { city: 'Toulouse', region: 'Occitanie', country: 'France' },
    rating: 4.7,
    reviews_count: 124,
    completed_projects: 567,
    response_time: '24-48h',
    verified: true,
    premium: false,
    contact_email: 'contact@formation-excellence.fr',
    website: 'https://formation-excellence.fr',
    min_budget: 500,
    max_budget: 50000,
  },
];

const SECTORS = [
  'Tous les secteurs',
  'Sécurité électronique',
  'Sécurité privée',
  'BTP',
  'Informatique',
  'Propreté',
  'Formation',
  'Maintenance',
  'Transport',
  'Restauration',
];

const REGIONS = [
  'Toutes les régions',
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Provence-Alpes-Côte d\'Azur',
  'Pays de la Loire',
  'Grand Est',
  'Hauts-de-France',
];

// Composant carte partenaire
function PartnerCard({
  partner,
  onContact,
  t,
}: {
  partner: Partner;
  onContact: (p: Partner) => void;
  t: (key: string) => string;
}) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-gray-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-gray-900">{partner.company_name}</h3>
                {partner.verified && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {partner.premium && (
                  <Badge variant="warning" className="text-xs">{t('marketplace.partner.premium')}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{partner.location.city}, {partner.location.region}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 rounded-lg transition-colors ${
              isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{partner.description}</p>

        {/* Secteurs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {partner.sectors.slice(0, 3).map((sector) => (
            <Badge key={sector} variant="default" className="text-xs">
              {sector}
            </Badge>
          ))}
          {partner.sectors.length > 3 && (
            <Badge variant="default" className="text-xs">
              +{partner.sectors.length - 3}
            </Badge>
          )}
        </div>

        {/* Certifications */}
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-blue-500" />
          <div className="flex flex-wrap gap-1">
            {partner.certifications.map((cert) => (
              <span key={cert} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {cert}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-gray-900">{partner.rating}</span>
            </div>
            <span className="text-xs text-gray-500">
              {t('marketplace.partner.reviews').replace('{count}', String(partner.reviews_count))}
            </span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900">{partner.completed_projects}</span>
            </div>
            <span className="text-xs text-gray-500">{t('marketplace.partner.projects')}</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900">{partner.response_time}</span>
            </div>
            <span className="text-xs text-gray-500">{t('marketplace.partner.response')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => onContact(partner)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {t('marketplace.partner.contact')}
          </Button>
          {partner.website && (
            <Button
              variant="outline"
              onClick={() => window.open(partner.website, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Modal de contact
function ContactModal({ 
  partner, 
  onClose,
  onSend,
  t,
}: { 
  partner: Partner; 
  onClose: () => void;
  onSend: (message: string) => void;
  t: (key: string) => string;
}) {
  const [message, setMessage] = useState('');
  const [tenderRef, setTenderRef] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('marketplace.contact.title').replace('{name}', partner.company_name)}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('marketplace.contact.subtitle')}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('marketplace.contact.refLabel')}
            </label>
            <Input
              placeholder={t('marketplace.contact.refPlaceholder')}
              value={tenderRef}
              onChange={(e) => setTenderRef(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('marketplace.contact.messageLabel')}
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={5}
              placeholder={t('marketplace.contact.messagePlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('marketplace.contact.cancel')}
          </Button>
          <Button 
            variant="primary" 
            className="flex-1"
            onClick={() => onSend(message)}
            disabled={!message.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            {t('marketplace.contact.send')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Page principale
export default function MarketplacePage() {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'marketplace.title': 'Marketplace Partenaires',
      'marketplace.subtitle': "Trouvez des sous-traitants et partenaires qualifiés pour vos appels d'offres",
      'marketplace.cta.becomePartner': 'Devenir partenaire',
      'marketplace.stats.partners': 'Partenaires',
      'marketplace.stats.verified': 'Vérifiés',
      'marketplace.stats.premium': 'Premium',
      'marketplace.stats.projects': 'Projets réalisés',
      'marketplace.search.placeholder': 'Rechercher un partenaire, un secteur...',
      'marketplace.filters.verifiedOnly': 'Vérifiés uniquement',
      'marketplace.empty.title': 'Aucun partenaire trouvé',
      'marketplace.empty.subtitle': 'Essayez de modifier vos critères de recherche',
      'marketplace.empty.reset': 'Réinitialiser les filtres',
      'marketplace.partner.verified': 'Vérifié',
      'marketplace.partner.premium': 'Premium',
      'marketplace.partner.reviews': '{count} avis',
      'marketplace.partner.projects': 'projets',
      'marketplace.partner.response': 'réponse',
      'marketplace.partner.contact': 'Contacter',
      'marketplace.contact.title': 'Contacter {name}',
      'marketplace.contact.subtitle': 'Envoyez une demande de collaboration',
      'marketplace.contact.refLabel': 'Référence AO (optionnel)',
      'marketplace.contact.refPlaceholder': 'Ex: AO-2024-0042',
      'marketplace.contact.messageLabel': 'Votre message',
      'marketplace.contact.messagePlaceholder': 'Décrivez votre besoin de sous-traitance ou de partenariat...',
      'marketplace.contact.cancel': 'Annuler',
      'marketplace.contact.send': 'Envoyer',
      'marketplace.filters.allSectors': 'Tous les secteurs',
      'marketplace.filters.allRegions': 'Toutes les régions',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);
  const [partners, setPartners] = useState<Partner[]>(DEMO_PARTNERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('Tous les secteurs');
  const [selectedRegion, setSelectedRegion] = useState('Toutes les régions');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [contactPartner, setContactPartner] = useState<Partner | null>(null);

  // Filtrage des partenaires
  const filteredPartners = partners.filter((partner) => {
    const matchesSearch = !searchQuery || 
      partner.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.sectors.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSector = selectedSector === 'Tous les secteurs' ||
      partner.sectors.some(s => s === selectedSector);
    
    const matchesRegion = selectedRegion === 'Toutes les régions' ||
      partner.location.region === selectedRegion;
    
    const matchesVerified = !showVerifiedOnly || partner.verified;

    return matchesSearch && matchesSector && matchesRegion && matchesVerified;
  });

  const handleContact = (partner: Partner) => {
    setContactPartner(partner);
  };

  const handleSendMessage = (message: string) => {
    // TODO: Envoyer le message via API
    console.log('Message envoyé à', contactPartner?.company_name, ':', message);
    setContactPartner(null);
    // Toast de confirmation
  };

  return (
    <AppLayout>
      <PageHeader
        title={t('marketplace.title')}
        description={t('marketplace.subtitle')}
        actions={
          <Button variant="primary">
            <Building2 className="w-4 h-4 mr-2" />
            {t('marketplace.cta.becomePartner')}
          </Button>
        }
      />

      <div className="px-4 sm:px-6 pb-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-xl">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{partners.length}</p>
                <p className="text-sm text-gray-500">{t('marketplace.stats.partners')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {partners.filter(p => p.verified).length}
                </p>
                <p className="text-sm text-gray-500">{t('marketplace.stats.verified')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {partners.filter(p => p.premium).length}
                </p>
                <p className="text-sm text-gray-500">{t('marketplace.stats.premium')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {partners.reduce((acc, p) => acc + p.completed_projects, 0)}
                </p>
                <p className="text-sm text-gray-500">{t('marketplace.stats.projects')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('marketplace.search.placeholder')}
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <select
                className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                {SECTORS.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector === 'Tous les secteurs' ? t('marketplace.filters.allSectors') : sector}
                  </option>
                ))}
              </select>
              <select
                className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region === 'Toutes les régions' ? t('marketplace.filters.allRegions') : region}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={showVerifiedOnly}
                  onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{t('marketplace.filters.verifiedOnly')}</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Liste des partenaires */}
        {filteredPartners.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('marketplace.empty.title')}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('marketplace.empty.subtitle')}
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setSelectedSector('Tous les secteurs');
                setSelectedRegion('Toutes les régions');
                setShowVerifiedOnly(false);
              }}>
                {t('marketplace.empty.reset')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                onContact={handleContact}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de contact */}
      {contactPartner && (
        <ContactModal
          partner={contactPartner}
          onClose={() => setContactPartner(null)}
          onSend={handleSendMessage}
          t={t}
        />
      )}
    </AppLayout>
  );
}
