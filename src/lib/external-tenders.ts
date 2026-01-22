/**
 * Service d'intégration avec les sources externes d'appels d'offres
 * Permet d'agréger les résultats de plusieurs plateformes
 */

// Types
export interface ExternalTender {
  id: string;
  source: TenderSource;
  reference: string;
  title: string;
  description: string;
  buyer: string;
  location: string;
  country: string;
  estimatedValue?: number;
  currency?: string;
  deadline: string;
  publicationDate: string;
  cpvCodes?: string[];
  type: 'supply' | 'service' | 'works' | 'mixed';
  url: string;
  status: 'open' | 'closed' | 'awarded';
}

export type TenderSource = 
  | 'boamp'         // Bulletin Officiel des Annonces de Marchés Publics
  | 'ted'           // Tenders Electronic Daily (EU)
  | 'place_marche'  // Place de Marché Interministérielle
  | 'aws'           // Achat-Public AWS
  | 'e_marchespublics'
  | 'megalis'
  | 'klekoon'
  | 'internal';     // Base interne WeWinBid

export interface SearchParams {
  query?: string;
  cpvCodes?: string[];
  countries?: string[];
  regions?: string[];
  minValue?: number;
  maxValue?: number;
  deadlineFrom?: string;
  deadlineTo?: string;
  types?: Array<'supply' | 'service' | 'works' | 'mixed'>;
  sources?: TenderSource[];
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  tenders: ExternalTender[];
  total: number;
  sources: Record<TenderSource, { count: number; available: boolean }>;
  executionTime: number;
}

// Configurations des sources
const SOURCE_CONFIGS: Record<TenderSource, {
  name: string;
  baseUrl: string;
  apiKey?: string;
  enabled: boolean;
  rateLimit: number; // requêtes par minute
}> = {
  boamp: {
    name: 'BOAMP',
    baseUrl: 'https://api.boamp.fr/api/v1',
    enabled: true,
    rateLimit: 60,
  },
  ted: {
    name: 'TED Europa',
    baseUrl: 'https://api.ted.europa.eu/v3',
    enabled: true,
    rateLimit: 100,
  },
  place_marche: {
    name: 'PLACE',
    baseUrl: 'https://www.marches-publics.gouv.fr/api',
    enabled: true,
    rateLimit: 30,
  },
  aws: {
    name: 'AWS Achat-Public',
    baseUrl: 'https://www.achatpublic.com/api',
    enabled: false,
    rateLimit: 30,
  },
  e_marchespublics: {
    name: 'e-marchespublics',
    baseUrl: 'https://www.e-marchespublics.com/api',
    enabled: false,
    rateLimit: 30,
  },
  megalis: {
    name: 'Mégalis Bretagne',
    baseUrl: 'https://marches.megalis.bretagne.bzh/api',
    enabled: false,
    rateLimit: 30,
  },
  klekoon: {
    name: 'Klekoon',
    baseUrl: 'https://www.klekoon.com/api',
    enabled: false,
    rateLimit: 30,
  },
  internal: {
    name: 'WeWinBid',
    baseUrl: '/api/tenders',
    enabled: true,
    rateLimit: 1000,
  },
};

/**
 * Recherche BOAMP (France)
 */
async function searchBOAMP(params: SearchParams): Promise<ExternalTender[]> {
  try {
    // Note: API réelle nécessite une clé
    // Simulation pour démonstration
    const mockResults: ExternalTender[] = [];
    
    if (process.env.BOAMP_API_KEY) {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.set('q', params.query);
      if (params.cpvCodes?.length) queryParams.set('cpv', params.cpvCodes.join(','));
      if (params.regions?.length) queryParams.set('region', params.regions.join(','));
      if (params.deadlineFrom) queryParams.set('date_from', params.deadlineFrom);
      if (params.deadlineTo) queryParams.set('date_to', params.deadlineTo);
      queryParams.set('limit', String(params.limit || 20));
      queryParams.set('offset', String(params.offset || 0));

      const response = await fetch(`${SOURCE_CONFIGS.boamp.baseUrl}/publications?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${process.env.BOAMP_API_KEY}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.publications?.map((pub: any) => transformBOAMP(pub)) || [];
      }
    }

    return mockResults;
  } catch (error) {
    console.error('BOAMP search error:', error);
    return [];
  }
}

/**
 * Recherche TED (Europe)
 */
async function searchTED(params: SearchParams): Promise<ExternalTender[]> {
  try {
    if (process.env.TED_API_KEY) {
      const body = {
        query: params.query,
        fields: ['title', 'description', 'cpv_codes', 'buyer_name'],
        page: Math.floor((params.offset || 0) / (params.limit || 20)) + 1,
        pageSize: params.limit || 20,
        filters: {
          countries: params.countries || ['FRA'],
          cpvCodes: params.cpvCodes,
          publicationDateRange: {
            from: params.deadlineFrom,
            to: params.deadlineTo,
          },
          valueRange: {
            min: params.minValue,
            max: params.maxValue,
          },
        },
      };

      const response = await fetch(`${SOURCE_CONFIGS.ted.baseUrl}/notices/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TED_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        return data.notices?.map((notice: any) => transformTED(notice)) || [];
      }
    }

    return [];
  } catch (error) {
    console.error('TED search error:', error);
    return [];
  }
}

/**
 * Recherche base interne
 */
async function searchInternal(params: SearchParams): Promise<ExternalTender[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.set('q', params.query);
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.offset) queryParams.set('offset', String(params.offset));

    const response = await fetch(`/api/search?${queryParams}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.results?.map((tender: any) => ({
        id: tender.tender_id,
        source: 'internal' as TenderSource,
        reference: tender.reference || tender.tender_id,
        title: tender.title,
        description: tender.description || '',
        buyer: tender.organization || '',
        location: tender.location || '',
        country: tender.country || 'France',
        estimatedValue: tender.budget,
        currency: 'EUR',
        deadline: tender.deadline,
        publicationDate: tender.created_at,
        type: 'service' as const,
        url: `/tenders/${tender.tender_id}`,
        status: 'open' as const,
      })) || [];
    }

    return [];
  } catch (error) {
    console.error('Internal search error:', error);
    return [];
  }
}

// Transformers
function transformBOAMP(pub: any): ExternalTender {
  return {
    id: `boamp_${pub.id}`,
    source: 'boamp',
    reference: pub.reference || pub.id,
    title: pub.objet || pub.title,
    description: pub.description || '',
    buyer: pub.acheteur?.nom || pub.buyer_name || '',
    location: pub.lieu_execution || '',
    country: 'France',
    estimatedValue: pub.montant_estime,
    currency: 'EUR',
    deadline: pub.date_limite_reponse,
    publicationDate: pub.date_publication,
    cpvCodes: pub.codes_cpv || [],
    type: mapBOAMPType(pub.type_marche),
    url: pub.url || `https://www.boamp.fr/avis/detail/${pub.id}`,
    status: pub.statut === 'ouvert' ? 'open' : 'closed',
  };
}

function transformTED(notice: any): ExternalTender {
  return {
    id: `ted_${notice.docId}`,
    source: 'ted',
    reference: notice.docId,
    title: notice.title?.fra || notice.title?.eng || notice.title,
    description: notice.description?.fra || notice.description?.eng || '',
    buyer: notice.buyer?.name || '',
    location: notice.placeOfPerformance?.address || '',
    country: notice.countryCode || '',
    estimatedValue: notice.value?.amount,
    currency: notice.value?.currency || 'EUR',
    deadline: notice.tenderDeadline,
    publicationDate: notice.publicationDate,
    cpvCodes: notice.cpvCodes || [],
    type: mapTEDType(notice.noticeType),
    url: `https://ted.europa.eu/udl?uri=TED:NOTICE:${notice.docId}`,
    status: notice.status === 'ACTIVE' ? 'open' : 'closed',
  };
}

function mapBOAMPType(type: string): ExternalTender['type'] {
  const mapping: Record<string, ExternalTender['type']> = {
    'fournitures': 'supply',
    'services': 'service',
    'travaux': 'works',
  };
  return mapping[type?.toLowerCase()] || 'mixed';
}

function mapTEDType(type: string): ExternalTender['type'] {
  const mapping: Record<string, ExternalTender['type']> = {
    'SUPPLIES': 'supply',
    'SERVICES': 'service',
    'WORKS': 'works',
  };
  return mapping[type] || 'mixed';
}

/**
 * Recherche agrégée sur toutes les sources
 */
export async function searchAllSources(params: SearchParams): Promise<SearchResult> {
  const startTime = Date.now();
  const sources = params.sources || ['internal', 'boamp', 'ted'];
  
  const sourceStatus: Record<TenderSource, { count: number; available: boolean }> = {
    boamp: { count: 0, available: SOURCE_CONFIGS.boamp.enabled },
    ted: { count: 0, available: SOURCE_CONFIGS.ted.enabled },
    place_marche: { count: 0, available: SOURCE_CONFIGS.place_marche.enabled },
    aws: { count: 0, available: SOURCE_CONFIGS.aws.enabled },
    e_marchespublics: { count: 0, available: SOURCE_CONFIGS.e_marchespublics.enabled },
    megalis: { count: 0, available: SOURCE_CONFIGS.megalis.enabled },
    klekoon: { count: 0, available: SOURCE_CONFIGS.klekoon.enabled },
    internal: { count: 0, available: SOURCE_CONFIGS.internal.enabled },
  };

  const searchPromises: Promise<ExternalTender[]>[] = [];

  if (sources.includes('internal') && SOURCE_CONFIGS.internal.enabled) {
    searchPromises.push(searchInternal(params));
  }
  if (sources.includes('boamp') && SOURCE_CONFIGS.boamp.enabled) {
    searchPromises.push(searchBOAMP(params));
  }
  if (sources.includes('ted') && SOURCE_CONFIGS.ted.enabled) {
    searchPromises.push(searchTED(params));
  }

  const results = await Promise.allSettled(searchPromises);
  
  const allTenders: ExternalTender[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const tenders = result.value;
      allTenders.push(...tenders);
      
      // Mettre à jour les stats par source
      tenders.forEach(tender => {
        sourceStatus[tender.source].count++;
      });
    }
  });

  // Dédupliquer par titre similaire
  const uniqueTenders = deduplicateTenders(allTenders);

  // Trier par pertinence puis par date limite
  uniqueTenders.sort((a, b) => {
    const dateA = new Date(a.deadline).getTime();
    const dateB = new Date(b.deadline).getTime();
    return dateA - dateB;
  });

  return {
    tenders: uniqueTenders,
    total: uniqueTenders.length,
    sources: sourceStatus,
    executionTime: Date.now() - startTime,
  };
}

/**
 * Dédupliquer les appels d'offres similaires
 */
function deduplicateTenders(tenders: ExternalTender[]): ExternalTender[] {
  const seen = new Map<string, ExternalTender>();
  
  for (const tender of tenders) {
    // Créer une clé basée sur le titre normalisé
    const normalizedTitle = tender.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);
    
    const key = `${normalizedTitle}_${tender.buyer.toLowerCase().substring(0, 20)}`;
    
    if (!seen.has(key)) {
      seen.set(key, tender);
    } else {
      // Si on a déjà vu cet appel d'offres, garder celui avec le plus d'infos
      const existing = seen.get(key)!;
      if ((tender.estimatedValue && !existing.estimatedValue) ||
          (tender.description.length > existing.description.length)) {
        seen.set(key, tender);
      }
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Obtenir les codes CPV communs
 */
export const CPV_CODES = {
  // Services informatiques
  '72000000': 'Services de TI: conseil, développement de logiciels, Internet et assistance',
  '72200000': 'Services de programmation et de conseil en logiciels',
  '72300000': 'Services de système de données',
  '72400000': 'Services Internet',
  
  // Construction
  '45000000': 'Travaux de construction',
  '45200000': 'Travaux de construction complète ou partielle et travaux de génie civil',
  '45300000': 'Travaux d\'équipement du bâtiment',
  
  // Fournitures de bureau
  '30000000': 'Machines, équipements et fournitures de bureau et d\'informatique',
  '30100000': 'Machines, équipements et fournitures de bureau, excepté ordinateurs',
  '30200000': 'Matériel et fournitures informatiques',
  
  // Services professionnels
  '79000000': 'Services aux entreprises: droit, marketing, conseil, recrutement',
  '79100000': 'Services juridiques',
  '79200000': 'Services de comptabilité, d\'audit et de fiscalité',
  '79400000': 'Conseils en affaires et en gestion et services connexes',
  
  // Formation
  '80000000': 'Services d\'enseignement et de formation',
  '80400000': 'Services d\'enseignement pour adultes et autres services',
  '80500000': 'Services de formation',
};

/**
 * Obtenir les régions françaises
 */
export const FRENCH_REGIONS = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Côte d\'Azur',
  'Guadeloupe',
  'Martinique',
  'Guyane',
  'La Réunion',
  'Mayotte',
];

/**
 * Sauvegarder une recherche
 */
export async function saveSearch(
  name: string,
  params: SearchParams,
  notifyNewResults: boolean = false
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch('/api/search/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        query_text: params.query,
        filters: params,
        notify_new_results: notifyNewResults,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, id: data.id };
    }

    const error = await response.json();
    return { success: false, error: error.message };
  } catch (error) {
    return { success: false, error: 'Erreur de connexion' };
  }
}

/**
 * Charger les recherches sauvegardées
 */
export async function loadSavedSearches(): Promise<Array<{
  id: string;
  name: string;
  params: SearchParams;
  notifyNewResults: boolean;
  createdAt: string;
  lastUsed: string | null;
}>> {
  try {
    const response = await fetch('/api/search/saved');
    
    if (response.ok) {
      const data = await response.json();
      return data.searches || [];
    }

    return [];
  } catch (error) {
    console.error('Load saved searches error:', error);
    return [];
  }
}
