// Configuration des méthodes d'appels d'offres par pays
// Chaque pays a ses propres réglementations, documents requis et plateformes

import type { DocumentType } from '@/types/database';

export type CountryCode = 
  | 'FR' | 'DE' | 'BE' | 'NL' | 'LU' | 'AT' | 'CH'  // Europe de l'Ouest
  | 'ES' | 'IT' | 'PT' | 'GR'                        // Europe du Sud
  | 'GB' | 'IE'                                       // UK & Ireland
  | 'US' | 'CA'                                       // Amérique du Nord
  | 'MX' | 'BR' | 'AR' | 'CO' | 'CL' | 'PE'          // Amérique Latine
  | 'MA' | 'TN' | 'DZ' | 'AE' | 'SA' | 'QA' | 'KW' | 'EG'; // MENA

export interface TenderPlatform {
  name: string;
  url: string;
  type: 'public' | 'private' | 'both';
  description: string;
}

export interface RequiredDocument {
  type: DocumentType;
  name: string;
  description: string;
  mandatory: boolean;
  publicOnly: boolean;  // Requis uniquement pour marchés publics
  validityDays?: number; // Durée de validité en jours
}

export interface CountryTenderConfig {
  code: CountryCode;
  name: string;
  flag: string;
  currency: string;
  // Réglementation
  publicProcurementLaw: string;
  thresholds: {
    supplies: number;      // Seuil fournitures (en devise locale)
    services: number;      // Seuil services
    works: number;         // Seuil travaux
    concessions?: number;  // Seuil concessions
  };
  // Plateformes officielles
  platforms: TenderPlatform[];
  // Documents requis pour marchés PUBLICS
  publicDocuments: RequiredDocument[];
  // Documents requis pour marchés PRIVÉS
  privateDocuments: RequiredDocument[];
  // Délais légaux
  minResponseDays: {
    openProcedure: number;
    restrictedProcedure: number;
    negotiatedProcedure: number;
    urgentProcedure: number;
  };
  // Spécificités locales
  specificities: string[];
  // Identifiant entreprise
  businessIdName: string;    // Nom de l'identifiant (SIRET, VAT, etc.)
  businessIdFormat: string;  // Format regex
  businessIdExample: string; // Exemple
}

// ===========================================
// CONFIGURATIONS PAR PAYS
// ===========================================

export const COUNTRY_TENDER_CONFIGS: Record<CountryCode, CountryTenderConfig> = {
  // ===========================================
  // FRANCE
  // ===========================================
  FR: {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    publicProcurementLaw: 'Code de la commande publique (CCP)',
    thresholds: {
      supplies: 143000,  // Seuil européen 2024-2025
      services: 143000,
      works: 5538000,
      concessions: 5538000,
    },
    platforms: [
      {
        name: 'BOAMP',
        url: 'https://www.boamp.fr',
        type: 'public',
        description: 'Bulletin Officiel des Annonces des Marchés Publics',
      },
      {
        name: 'JOUE/TED',
        url: 'https://ted.europa.eu',
        type: 'public',
        description: 'Journal Officiel de l\'Union Européenne (> seuils)',
      },
      {
        name: 'PLACE',
        url: 'https://www.marches-publics.gouv.fr',
        type: 'public',
        description: 'Plateforme des achats de l\'État',
      },
      {
        name: 'Maximilien',
        url: 'https://marches.maximilien.fr',
        type: 'public',
        description: 'Plateforme Île-de-France',
      },
      {
        name: 'AWS (Achatpublic)',
        url: 'https://www.achatpublic.com',
        type: 'both',
        description: 'Plateforme privée de dématérialisation',
      },
    ],
    publicDocuments: [
      { type: 'DC1', name: 'DC1 - Lettre de candidature', description: 'Identification du candidat et habilitation du mandataire', mandatory: true, publicOnly: true },
      { type: 'DC2', name: 'DC2 - Déclaration du candidat', description: 'Capacités économiques, financières et techniques', mandatory: true, publicOnly: true },
      { type: 'DC4', name: 'DC4 - Déclaration de sous-traitance', description: 'Déclaration des sous-traitants éventuels', mandatory: false, publicOnly: true },
      { type: 'KBIS', name: 'Extrait Kbis', description: 'Extrait du registre du commerce', mandatory: true, publicOnly: false, validityDays: 90 },
      { type: 'TAX_ATTESTATION', name: 'Attestation fiscale', description: 'Attestation de régularité fiscale', mandatory: true, publicOnly: true, validityDays: 180 },
      { type: 'SOCIAL_ATTESTATION', name: 'Attestation URSSAF', description: 'Attestation de vigilance sociale', mandatory: true, publicOnly: true, validityDays: 180 },
      { type: 'INSURANCE_RC', name: 'RC Professionnelle', description: 'Attestation d\'assurance responsabilité civile', mandatory: true, publicOnly: false, validityDays: 365 },
      { type: 'INSURANCE_DECENNALE', name: 'Décennale', description: 'Attestation d\'assurance décennale (BTP)', mandatory: false, publicOnly: false, validityDays: 365 },
      { type: 'TECHNICAL_MEMO', name: 'Mémoire technique', description: 'Présentation de la méthodologie et des moyens', mandatory: true, publicOnly: true },
      { type: 'DPGF', name: 'DPGF', description: 'Décomposition du Prix Global et Forfaitaire', mandatory: true, publicOnly: true },
      { type: 'BPU', name: 'BPU', description: 'Bordereau des Prix Unitaires', mandatory: false, publicOnly: true },
      { type: 'ACTE_ENGAGEMENT', name: 'Acte d\'engagement', description: 'Document contractuel signé', mandatory: true, publicOnly: true },
      { type: 'RIB', name: 'RIB', description: 'Relevé d\'Identité Bancaire', mandatory: true, publicOnly: false },
    ],
    privateDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Présentation entreprise', description: 'Plaquette de présentation', mandatory: true, publicOnly: false },
      { type: 'COMMERCIAL_PROPOSAL', name: 'Proposition commerciale', description: 'Offre commerciale détaillée', mandatory: true, publicOnly: false },
      { type: 'QUOTE', name: 'Devis', description: 'Devis détaillé', mandatory: true, publicOnly: false },
      { type: 'REFERENCES_LIST', name: 'Liste de références', description: 'Références clients similaires', mandatory: true, publicOnly: false },
      { type: 'INSURANCE_RC', name: 'RC Professionnelle', description: 'Attestation d\'assurance', mandatory: true, publicOnly: false, validityDays: 365 },
    ],
    minResponseDays: {
      openProcedure: 35,
      restrictedProcedure: 30,
      negotiatedProcedure: 0,
      urgentProcedure: 15,
    },
    specificities: [
      'Obligation de dématérialisation depuis 2019',
      'Signature électronique requise',
      'DUME (Document Unique de Marché Européen) accepté',
      'Allotissement obligatoire sauf exception justifiée',
      'Clauses sociales et environnementales obligatoires depuis 2026',
    ],
    businessIdName: 'SIRET',
    businessIdFormat: '^[0-9]{14}$',
    businessIdExample: '12345678901234',
  },

  // ===========================================
  // ALLEMAGNE
  // ===========================================
  DE: {
    code: 'DE',
    name: 'Allemagne',
    flag: '🇩🇪',
    currency: 'EUR',
    publicProcurementLaw: 'Vergaberecht (GWB, VgV, VOB/A, UVgO)',
    thresholds: {
      supplies: 143000,
      services: 143000,
      works: 5538000,
    },
    platforms: [
      {
        name: 'TED',
        url: 'https://ted.europa.eu',
        type: 'public',
        description: 'Tenders Electronic Daily (seuils européens)',
      },
      {
        name: 'Bund.de',
        url: 'https://www.service.bund.de/IMPORTE/Ausschreibungen',
        type: 'public',
        description: 'Portail fédéral des marchés publics',
      },
      {
        name: 'DTAD',
        url: 'https://www.dtad.de',
        type: 'both',
        description: 'Deutscher Auftragsdienst - agrégateur privé',
      },
      {
        name: 'Vergabe24',
        url: 'https://www.vergabe24.de',
        type: 'public',
        description: 'Plateforme de dématérialisation',
      },
    ],
    publicDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Unternehmensprofil', description: 'Profil de l\'entreprise', mandatory: true, publicOnly: false },
      { type: 'TAX_ATTESTATION', name: 'Unbedenklichkeitsbescheinigung', description: 'Attestation fiscale', mandatory: true, publicOnly: true, validityDays: 90 },
      { type: 'SOCIAL_ATTESTATION', name: 'Sozialkassenbescheinigung', description: 'Attestation des caisses sociales', mandatory: true, publicOnly: true, validityDays: 90 },
      { type: 'INSURANCE_RC', name: 'Haftpflichtversicherung', description: 'Assurance responsabilité civile', mandatory: true, publicOnly: false, validityDays: 365 },
      { type: 'TECHNICAL_MEMO', name: 'Technisches Angebot', description: 'Offre technique', mandatory: true, publicOnly: true },
      { type: 'REFERENCES_LIST', name: 'Referenzliste', description: 'Liste des références', mandatory: true, publicOnly: true },
    ],
    privateDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Firmenpräsentation', description: 'Présentation de l\'entreprise', mandatory: true, publicOnly: false },
      { type: 'QUOTE', name: 'Angebot', description: 'Offre commerciale', mandatory: true, publicOnly: false },
      { type: 'REFERENCES_LIST', name: 'Referenzen', description: 'Références clients', mandatory: true, publicOnly: false },
    ],
    minResponseDays: {
      openProcedure: 35,
      restrictedProcedure: 30,
      negotiatedProcedure: 0,
      urgentProcedure: 15,
    },
    specificities: [
      'Structure fédérale : règles varient selon les Länder',
      'VOB/A pour les marchés de travaux',
      'VgV pour les marchés de services et fournitures',
      'Präqualifikation recommandée (PQ-VOB)',
      'e-Vergabe (dématérialisation) obligatoire',
    ],
    businessIdName: 'USt-IdNr',
    businessIdFormat: '^DE[0-9]{9}$',
    businessIdExample: 'DE123456789',
  },

  // ===========================================
  // BELGIQUE
  // ===========================================
  BE: {
    code: 'BE',
    name: 'Belgique',
    flag: '🇧🇪',
    currency: 'EUR',
    publicProcurementLaw: 'Loi du 17 juin 2016 relative aux marchés publics',
    thresholds: {
      supplies: 143000,
      services: 143000,
      works: 5538000,
    },
    platforms: [
      {
        name: 'e-Procurement',
        url: 'https://www.publicprocurement.be',
        type: 'public',
        description: 'Plateforme fédérale belge',
      },
      {
        name: 'e-Notification',
        url: 'https://enot.publicprocurement.be',
        type: 'public',
        description: 'Publication des avis de marchés',
      },
      {
        name: 'TED',
        url: 'https://ted.europa.eu',
        type: 'public',
        description: 'Marchés européens',
      },
    ],
    publicDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Présentation entreprise', description: 'Présentation du candidat', mandatory: true, publicOnly: false },
      { type: 'TAX_ATTESTATION', name: 'Attestation SPF Finances', description: 'Attestation fiscale belge', mandatory: true, publicOnly: true, validityDays: 90 },
      { type: 'SOCIAL_ATTESTATION', name: 'Attestation ONSS', description: 'Attestation sécurité sociale', mandatory: true, publicOnly: true, validityDays: 90 },
      { type: 'INSURANCE_RC', name: 'Assurance RC', description: 'Responsabilité civile professionnelle', mandatory: true, publicOnly: false, validityDays: 365 },
      { type: 'TECHNICAL_MEMO', name: 'Offre technique', description: 'Mémoire technique', mandatory: true, publicOnly: true },
    ],
    privateDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Présentation', description: 'Présentation entreprise', mandatory: true, publicOnly: false },
      { type: 'QUOTE', name: 'Offre de prix', description: 'Proposition commerciale', mandatory: true, publicOnly: false },
    ],
    minResponseDays: {
      openProcedure: 35,
      restrictedProcedure: 30,
      negotiatedProcedure: 0,
      urgentProcedure: 15,
    },
    specificities: [
      'Trois régions avec spécificités : Flandre, Wallonie, Bruxelles',
      'DUME obligatoire pour marchés européens',
      'e-Tendering obligatoire',
      'Délais peuvent varier selon la région',
    ],
    businessIdName: 'BCE/KBO',
    businessIdFormat: '^[0-9]{10}$',
    businessIdExample: '0123456789',
  },

  // ===========================================
  // PAYS-BAS
  // ===========================================
  NL: {
    code: 'NL',
    name: 'Pays-Bas',
    flag: '🇳🇱',
    currency: 'EUR',
    publicProcurementLaw: 'Aanbestedingswet 2012',
    thresholds: {
      supplies: 143000,
      services: 143000,
      works: 5538000,
    },
    platforms: [
      {
        name: 'TenderNed',
        url: 'https://www.tenderned.nl',
        type: 'public',
        description: 'Plateforme nationale néerlandaise',
      },
      {
        name: 'TED',
        url: 'https://ted.europa.eu',
        type: 'public',
        description: 'Marchés européens',
      },
    ],
    publicDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Bedrijfspresentatie', description: 'Présentation entreprise', mandatory: true, publicOnly: false },
      { type: 'TAX_ATTESTATION', name: 'Verklaring Belastingdienst', description: 'Attestation fiscale', mandatory: true, publicOnly: true, validityDays: 90 },
      { type: 'INSURANCE_RC', name: 'Aansprakelijkheidsverzekering', description: 'Assurance responsabilité', mandatory: true, publicOnly: false, validityDays: 365 },
      { type: 'TECHNICAL_MEMO', name: 'Technische offerte', description: 'Offre technique', mandatory: true, publicOnly: true },
    ],
    privateDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Bedrijfspresentatie', description: 'Présentation', mandatory: true, publicOnly: false },
      { type: 'QUOTE', name: 'Offerte', description: 'Devis', mandatory: true, publicOnly: false },
    ],
    minResponseDays: {
      openProcedure: 35,
      restrictedProcedure: 30,
      negotiatedProcedure: 0,
      urgentProcedure: 15,
    },
    specificities: [
      'Proportionnaliteitsbeginsel (principe de proportionnalité)',
      'EMVI (valeur économique la plus avantageuse) par défaut',
      'Eigen verklaring (auto-déclaration) acceptée',
    ],
    businessIdName: 'KVK',
    businessIdFormat: '^[0-9]{8}$',
    businessIdExample: '12345678',
  },

  // ===========================================
  // ESPAGNE
  // ===========================================
  ES: {
    code: 'ES',
    name: 'Espagne',
    flag: '🇪🇸',
    currency: 'EUR',
    publicProcurementLaw: 'Ley 9/2017 de Contratos del Sector Público',
    thresholds: {
      supplies: 143000,
      services: 143000,
      works: 5538000,
    },
    platforms: [
      {
        name: 'PLACSP',
        url: 'https://contrataciondelestado.es',
        type: 'public',
        description: 'Plataforma de Contratación del Sector Público',
      },
      {
        name: 'TED',
        url: 'https://ted.europa.eu',
        type: 'public',
        description: 'Marchés européens',
      },
      {
        name: 'BOE',
        url: 'https://www.boe.es',
        type: 'public',
        description: 'Boletín Oficial del Estado',
      },
    ],
    publicDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Presentación empresa', description: 'Présentation entreprise', mandatory: true, publicOnly: false },
      { type: 'TAX_ATTESTATION', name: 'Certificado AEAT', description: 'Certificat Agence Tributaire', mandatory: true, publicOnly: true, validityDays: 90 },
      { type: 'SOCIAL_ATTESTATION', name: 'Certificado Seguridad Social', description: 'Certificat Sécurité Sociale', mandatory: true, publicOnly: true, validityDays: 90 },
      { type: 'INSURANCE_RC', name: 'Seguro RC', description: 'Assurance responsabilité civile', mandatory: true, publicOnly: false, validityDays: 365 },
      { type: 'TECHNICAL_MEMO', name: 'Memoria técnica', description: 'Mémoire technique', mandatory: true, publicOnly: true },
      { type: 'KBIS', name: 'Escritura de constitución', description: 'Acte de constitution', mandatory: true, publicOnly: false },
    ],
    privateDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Presentación', description: 'Présentation', mandatory: true, publicOnly: false },
      { type: 'QUOTE', name: 'Presupuesto', description: 'Devis', mandatory: true, publicOnly: false },
      { type: 'REFERENCES_LIST', name: 'Referencias', description: 'Références', mandatory: true, publicOnly: false },
    ],
    minResponseDays: {
      openProcedure: 35,
      restrictedProcedure: 30,
      negotiatedProcedure: 0,
      urgentProcedure: 15,
    },
    specificities: [
      'ROLECE (Registro Oficial de Licitadores) recommandé',
      'Comunidades Autónomas ont leurs propres plateformes',
      'Mesa de contratación pour l\'ouverture des plis',
      'Clasificación empresarial obligatoire pour certains marchés',
    ],
    businessIdName: 'CIF/NIF',
    businessIdFormat: '^[A-Z][0-9]{8}$',
    businessIdExample: 'B12345678',
  },

  // ===========================================
  // ITALIE
  // ===========================================
  IT: {
    code: 'IT',
    name: 'Italie',
    flag: '🇮🇹',
    currency: 'EUR',
    publicProcurementLaw: 'Codice dei contratti pubblici (D.Lgs. 36/2023)',
    thresholds: {
      supplies: 143000,
      services: 143000,
      works: 5538000,
    },
    platforms: [
      {
        name: 'ANAC',
        url: 'https://www.anticorruzione.it',
        type: 'public',
        description: 'Autorità Nazionale Anticorruzione',
      },
      {
        name: 'Consip',
        url: 'https://www.acquistinretepa.it',
        type: 'public',
        description: 'Centrale d\'achat de l\'État',
      },
      {
        name: 'TED',
        url: 'https://ted.europa.eu',
        type: 'public',
        description: 'Marchés européens',
      },
      {
        name: 'MePA',
        url: 'https://www.acquistinretepa.it',
        type: 'both',
        description: 'Mercato Elettronico della Pubblica Amministrazione',
      },
    ],
    publicDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Presentazione azienda', description: 'Présentation entreprise', mandatory: true, publicOnly: false },
      { type: 'TAX_ATTESTATION', name: 'DURC fiscale', description: 'Attestation de régularité fiscale', mandatory: true, publicOnly: true, validityDays: 120 },
      { type: 'SOCIAL_ATTESTATION', name: 'DURC', description: 'Documento Unico di Regolarità Contributiva', mandatory: true, publicOnly: true, validityDays: 120 },
      { type: 'INSURANCE_RC', name: 'Polizza RC', description: 'Assurance responsabilité civile', mandatory: true, publicOnly: false, validityDays: 365 },
      { type: 'TECHNICAL_MEMO', name: 'Offerta tecnica', description: 'Offre technique', mandatory: true, publicOnly: true },
    ],
    privateDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Presentazione', description: 'Présentation', mandatory: true, publicOnly: false },
      { type: 'QUOTE', name: 'Preventivo', description: 'Devis', mandatory: true, publicOnly: false },
    ],
    minResponseDays: {
      openProcedure: 35,
      restrictedProcedure: 30,
      negotiatedProcedure: 0,
      urgentProcedure: 10,
    },
    specificities: [
      'PassOE obligatoire (Pass Operatore Economico)',
      'AVCPass pour la vérification des prérequis',
      'Nouveau code des contrats (2023) simplifie les procédures',
      'SOA qualification obligatoire pour travaux > 150.000€',
    ],
    businessIdName: 'Partita IVA',
    businessIdFormat: '^IT[0-9]{11}$',
    businessIdExample: 'IT12345678901',
  },

  // ===========================================
  // PORTUGAL
  // ===========================================
  PT: {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    currency: 'EUR',
    publicProcurementLaw: 'Código dos Contratos Públicos (CCP)',
    thresholds: {
      supplies: 143000,
      services: 143000,
      works: 5538000,
    },
    platforms: [
      {
        name: 'BASE',
        url: 'https://www.base.gov.pt',
        type: 'public',
        description: 'Portal dos Contratos Públicos',
      },
      {
        name: 'TED',
        url: 'https://ted.europa.eu',
        type: 'public',
        description: 'Marchés européens',
      },
    ],
    publicDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Apresentação', description: 'Présentation entreprise', mandatory: true, publicOnly: false },
      { type: 'TAX_ATTESTATION', name: 'Certidão AT', description: 'Certificat fiscal', mandatory: true, publicOnly: true, validityDays: 90 },
      { type: 'SOCIAL_ATTESTATION', name: 'Certidão SS', description: 'Certificat sécurité sociale', mandatory: true, publicOnly: true, validityDays: 90 },
      { type: 'INSURANCE_RC', name: 'Seguro RC', description: 'Assurance RC', mandatory: true, publicOnly: false, validityDays: 365 },
      { type: 'TECHNICAL_MEMO', name: 'Memória técnica', description: 'Mémoire technique', mandatory: true, publicOnly: true },
    ],
    privateDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Apresentação', description: 'Présentation', mandatory: true, publicOnly: false },
      { type: 'QUOTE', name: 'Proposta', description: 'Proposition', mandatory: true, publicOnly: false },
    ],
    minResponseDays: {
      openProcedure: 35,
      restrictedProcedure: 30,
      negotiatedProcedure: 0,
      urgentProcedure: 10,
    },
    specificities: [
      'Plateformes électroniques certifiées obligatoires',
      'DEUCP (DUME portugais) accepté',
      'Ajuste direto pour petits marchés',
    ],
    businessIdName: 'NIF',
    businessIdFormat: '^[0-9]{9}$',
    businessIdExample: '123456789',
  },

  // ===========================================
  // ROYAUME-UNI (post-Brexit)
  // ===========================================
  GB: {
    code: 'GB',
    name: 'Royaume-Uni',
    flag: '🇬🇧',
    currency: 'GBP',
    publicProcurementLaw: 'Procurement Act 2023',
    thresholds: {
      supplies: 139688,  // GBP
      services: 139688,
      works: 5372609,
    },
    platforms: [
      {
        name: 'Find a Tender',
        url: 'https://www.find-tender.service.gov.uk',
        type: 'public',
        description: 'Service officiel UK (remplace OJEU)',
      },
      {
        name: 'Contracts Finder',
        url: 'https://www.gov.uk/contracts-finder',
        type: 'public',
        description: 'Contrats au-dessus de 12.000£',
      },
      {
        name: 'Public Contracts Scotland',
        url: 'https://www.publiccontractsscotland.gov.uk',
        type: 'public',
        description: 'Marchés écossais',
      },
      {
        name: 'Sell2Wales',
        url: 'https://www.sell2wales.gov.wales',
        type: 'public',
        description: 'Marchés gallois',
      },
    ],
    publicDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Company Profile', description: 'Présentation entreprise', mandatory: true, publicOnly: false },
      { type: 'TAX_ATTESTATION', name: 'Tax Compliance', description: 'Conformité fiscale HMRC', mandatory: true, publicOnly: true, validityDays: 90 },
      { type: 'INSURANCE_RC', name: 'Public Liability Insurance', description: 'Assurance responsabilité publique', mandatory: true, publicOnly: false, validityDays: 365 },
      { type: 'TECHNICAL_MEMO', name: 'Technical Submission', description: 'Soumission technique', mandatory: true, publicOnly: true },
      { type: 'REFERENCES_LIST', name: 'Case Studies', description: 'Études de cas / références', mandatory: true, publicOnly: true },
    ],
    privateDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Company Profile', description: 'Présentation', mandatory: true, publicOnly: false },
      { type: 'QUOTE', name: 'Quotation', description: 'Devis', mandatory: true, publicOnly: false },
      { type: 'REFERENCES_LIST', name: 'References', description: 'Références', mandatory: true, publicOnly: false },
    ],
    minResponseDays: {
      openProcedure: 30,
      restrictedProcedure: 25,
      negotiatedProcedure: 0,
      urgentProcedure: 10,
    },
    specificities: [
      'Post-Brexit : nouveau régime Procurement Act 2023',
      'Remplace les directives européennes',
      'Social Value Act pour les achats publics',
      'Devolution : Écosse, Pays de Galles, Irlande du Nord ont des règles spécifiques',
    ],
    businessIdName: 'Company Number',
    businessIdFormat: '^[0-9A-Z]{8}$',
    businessIdExample: '12345678',
  },

  // ===========================================
  // USA
  // ===========================================
  US: {
    code: 'US',
    name: 'États-Unis',
    flag: '🇺🇸',
    currency: 'USD',
    publicProcurementLaw: 'Federal Acquisition Regulation (FAR)',
    thresholds: {
      supplies: 250000,  // Simplified Acquisition Threshold
      services: 250000,
      works: 2000000,
    },
    platforms: [
      {
        name: 'SAM.gov',
        url: 'https://sam.gov',
        type: 'public',
        description: 'System for Award Management',
      },
      {
        name: 'beta.SAM.gov',
        url: 'https://beta.sam.gov',
        type: 'public',
        description: 'Nouveau portail SAM',
      },
      {
        name: 'GSA eBuy',
        url: 'https://www.ebuy.gsa.gov',
        type: 'public',
        description: 'Achats GSA',
      },
      {
        name: 'FPDS',
        url: 'https://www.fpds.gov',
        type: 'public',
        description: 'Federal Procurement Data System',
      },
    ],
    publicDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Company Profile', description: 'Capability Statement', mandatory: true, publicOnly: false },
      { type: 'TAX_ATTESTATION', name: 'Tax ID Certification', description: 'W-9 / Tax ID', mandatory: true, publicOnly: true },
      { type: 'INSURANCE_RC', name: 'Certificate of Insurance', description: 'COI - General Liability', mandatory: true, publicOnly: false, validityDays: 365 },
      { type: 'TECHNICAL_MEMO', name: 'Technical Proposal', description: 'Proposition technique', mandatory: true, publicOnly: true },
      { type: 'REFERENCES_LIST', name: 'Past Performance', description: 'Références et performances passées', mandatory: true, publicOnly: true },
    ],
    privateDocuments: [
      { type: 'COMPANY_PRESENTATION', name: 'Capability Statement', description: 'Présentation capacités', mandatory: true, publicOnly: false },
      { type: 'QUOTE', name: 'Proposal', description: 'Proposition commerciale', mandatory: true, publicOnly: false },
    ],
    minResponseDays: {
      openProcedure: 30,
      restrictedProcedure: 30,
      negotiatedProcedure: 0,
      urgentProcedure: 15,
    },
    specificities: [
      'Inscription SAM.gov obligatoire',
      'DUNS/UEI number requis',
      'Small Business set-asides',
      'NAICS codes pour la classification',
      'State/Local procurement séparé du fédéral',
      'Buy American Act',
    ],
    businessIdName: 'UEI (DUNS)',
    businessIdFormat: '^[A-Z0-9]{12}$',
    businessIdExample: 'ABCD12345678',
  },

  // ... Autres pays (configurations simplifiées)
  
  LU: {
    code: 'LU',
    name: 'Luxembourg',
    flag: '🇱🇺',
    currency: 'EUR',
    publicProcurementLaw: 'Loi du 8 avril 2018',
    thresholds: { supplies: 143000, services: 143000, works: 5538000 },
    platforms: [
      { name: 'Portail MP', url: 'https://pmp.b2g.etat.lu', type: 'public', description: 'Portail des Marchés Publics' },
    ],
    publicDocuments: [],
    privateDocuments: [],
    minResponseDays: { openProcedure: 35, restrictedProcedure: 30, negotiatedProcedure: 0, urgentProcedure: 15 },
    specificities: ['Trilinguisme : FR/DE/LU'],
    businessIdName: 'RCS', businessIdFormat: '^B[0-9]+$', businessIdExample: 'B123456',
  },

  AT: {
    code: 'AT',
    name: 'Autriche',
    flag: '🇦🇹',
    currency: 'EUR',
    publicProcurementLaw: 'Bundesvergabegesetz 2018',
    thresholds: { supplies: 143000, services: 143000, works: 5538000 },
    platforms: [
      { name: 'Auftrag.at', url: 'https://www.auftrag.at', type: 'public', description: 'Portail national' },
    ],
    publicDocuments: [],
    privateDocuments: [],
    minResponseDays: { openProcedure: 35, restrictedProcedure: 30, negotiatedProcedure: 0, urgentProcedure: 15 },
    specificities: [],
    businessIdName: 'UID', businessIdFormat: '^ATU[0-9]{8}$', businessIdExample: 'ATU12345678',
  },

  CH: {
    code: 'CH',
    name: 'Suisse',
    flag: '🇨🇭',
    currency: 'CHF',
    publicProcurementLaw: 'LMP (Loi fédérale sur les marchés publics)',
    thresholds: { supplies: 150000, services: 150000, works: 5000000 },
    platforms: [
      { name: 'simap.ch', url: 'https://www.simap.ch', type: 'public', description: 'Système d\'information sur les marchés publics' },
    ],
    publicDocuments: [],
    privateDocuments: [],
    minResponseDays: { openProcedure: 40, restrictedProcedure: 25, negotiatedProcedure: 0, urgentProcedure: 10 },
    specificities: ['Accords bilatéraux avec l\'UE', 'Cantons autonomes'],
    businessIdName: 'IDE/UID', businessIdFormat: '^CHE-[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}$', businessIdExample: 'CHE-123.456.789',
  },

  GR: {
    code: 'GR',
    name: 'Grèce',
    flag: '🇬🇷',
    currency: 'EUR',
    publicProcurementLaw: 'Nomos 4412/2016',
    thresholds: { supplies: 143000, services: 143000, works: 5538000 },
    platforms: [
      { name: 'ΕΣΗΔΗΣ', url: 'https://www.eprocurement.gov.gr', type: 'public', description: 'Portail national' },
    ],
    publicDocuments: [],
    privateDocuments: [],
    minResponseDays: { openProcedure: 35, restrictedProcedure: 30, negotiatedProcedure: 0, urgentProcedure: 15 },
    specificities: [],
    businessIdName: 'AFM', businessIdFormat: '^[0-9]{9}$', businessIdExample: '123456789',
  },

  IE: {
    code: 'IE',
    name: 'Irlande',
    flag: '🇮🇪',
    currency: 'EUR',
    publicProcurementLaw: 'SI 284/2016 European Union Regulations',
    thresholds: { supplies: 143000, services: 143000, works: 5538000 },
    platforms: [
      { name: 'eTenders', url: 'https://www.etenders.gov.ie', type: 'public', description: 'Portail national irlandais' },
    ],
    publicDocuments: [],
    privateDocuments: [],
    minResponseDays: { openProcedure: 35, restrictedProcedure: 30, negotiatedProcedure: 0, urgentProcedure: 15 },
    specificities: [],
    businessIdName: 'CRO', businessIdFormat: '^[0-9]{6}$', businessIdExample: '123456',
  },

  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    publicProcurementLaw: 'Government Contracts Regulations',
    thresholds: { supplies: 80000, services: 80000, works: 9500000 },
    platforms: [
      { name: 'CanadaBuys', url: 'https://canadabuys.canada.ca', type: 'public', description: 'Portail fédéral' },
      { name: 'SEAO', url: 'https://www.seao.ca', type: 'public', description: 'Système électronique d\'appels d\'offres (Québec)' },
    ],
    publicDocuments: [],
    privateDocuments: [],
    minResponseDays: { openProcedure: 25, restrictedProcedure: 20, negotiatedProcedure: 0, urgentProcedure: 10 },
    specificities: ['Provinces autonomes', 'Bilinguisme FR/EN'],
    businessIdName: 'BN', businessIdFormat: '^[0-9]{9}$', businessIdExample: '123456789',
  },

  // Amérique Latine (configurations de base)
  MX: {
    code: 'MX', name: 'Mexique', flag: '🇲🇽', currency: 'MXN',
    publicProcurementLaw: 'Ley de Adquisiciones',
    thresholds: { supplies: 500000, services: 500000, works: 5000000 },
    platforms: [{ name: 'CompraNet', url: 'https://compranet.hacienda.gob.mx', type: 'public', description: 'Portail national' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 15, restrictedProcedure: 10, negotiatedProcedure: 0, urgentProcedure: 5 },
    specificities: [],
    businessIdName: 'RFC', businessIdFormat: '^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$', businessIdExample: 'XAXX010101AAA',
  },

  BR: {
    code: 'BR', name: 'Brésil', flag: '🇧🇷', currency: 'BRL',
    publicProcurementLaw: 'Lei 14.133/2021',
    thresholds: { supplies: 80000, services: 80000, works: 1500000 },
    platforms: [{ name: 'Comprasnet', url: 'https://www.gov.br/compras', type: 'public', description: 'Portail fédéral' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 15, restrictedProcedure: 10, negotiatedProcedure: 0, urgentProcedure: 8 },
    specificities: ['Pregão électronique très utilisé'],
    businessIdName: 'CNPJ', businessIdFormat: '^[0-9]{14}$', businessIdExample: '12345678000199',
  },

  AR: {
    code: 'AR', name: 'Argentine', flag: '🇦🇷', currency: 'ARS',
    publicProcurementLaw: 'Decreto 1023/2001',
    thresholds: { supplies: 100000, services: 100000, works: 1000000 },
    platforms: [{ name: 'COMPR.AR', url: 'https://comprar.gob.ar', type: 'public', description: 'Portail national' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 20, restrictedProcedure: 15, negotiatedProcedure: 0, urgentProcedure: 7 },
    specificities: [],
    businessIdName: 'CUIT', businessIdFormat: '^[0-9]{11}$', businessIdExample: '20123456789',
  },

  CO: {
    code: 'CO', name: 'Colombie', flag: '🇨🇴', currency: 'COP',
    publicProcurementLaw: 'Ley 80/1993',
    thresholds: { supplies: 100000000, services: 100000000, works: 500000000 },
    platforms: [{ name: 'SECOP II', url: 'https://www.colombiacompra.gov.co', type: 'public', description: 'Portail national' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 10, restrictedProcedure: 5, negotiatedProcedure: 0, urgentProcedure: 3 },
    specificities: [],
    businessIdName: 'NIT', businessIdFormat: '^[0-9]{9}$', businessIdExample: '123456789',
  },

  CL: {
    code: 'CL', name: 'Chili', flag: '🇨🇱', currency: 'CLP',
    publicProcurementLaw: 'Ley 19.886',
    thresholds: { supplies: 50000000, services: 50000000, works: 200000000 },
    platforms: [{ name: 'Mercado Público', url: 'https://www.mercadopublico.cl', type: 'public', description: 'Portail national' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 20, restrictedProcedure: 15, negotiatedProcedure: 0, urgentProcedure: 5 },
    specificities: ['ChileCompra très moderne'],
    businessIdName: 'RUT', businessIdFormat: '^[0-9]{8}-[0-9K]$', businessIdExample: '12345678-9',
  },

  PE: {
    code: 'PE', name: 'Pérou', flag: '🇵🇪', currency: 'PEN',
    publicProcurementLaw: 'Ley de Contrataciones del Estado',
    thresholds: { supplies: 32400, services: 32400, works: 1800000 },
    platforms: [{ name: 'SEACE', url: 'https://www.gob.pe/osce', type: 'public', description: 'Portail national' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 22, restrictedProcedure: 15, negotiatedProcedure: 0, urgentProcedure: 8 },
    specificities: [],
    businessIdName: 'RUC', businessIdFormat: '^[0-9]{11}$', businessIdExample: '12345678901',
  },

  // MENA (configurations de base)
  MA: {
    code: 'MA', name: 'Maroc', flag: '🇲🇦', currency: 'MAD',
    publicProcurementLaw: 'Décret n°2-12-349',
    thresholds: { supplies: 200000, services: 200000, works: 1000000 },
    platforms: [{ name: 'Portail MP', url: 'https://www.marchespublics.gov.ma', type: 'public', description: 'Portail national' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 21, restrictedProcedure: 15, negotiatedProcedure: 0, urgentProcedure: 10 },
    specificities: ['Préférence nationale possible'],
    businessIdName: 'ICE', businessIdFormat: '^[0-9]{15}$', businessIdExample: '123456789012345',
  },

  TN: {
    code: 'TN', name: 'Tunisie', flag: '🇹🇳', currency: 'TND',
    publicProcurementLaw: 'Décret n°2014-1039',
    thresholds: { supplies: 100000, services: 100000, works: 500000 },
    platforms: [{ name: 'TUNEPS', url: 'https://www.tuneps.tn', type: 'public', description: 'Portail national' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 21, restrictedProcedure: 15, negotiatedProcedure: 0, urgentProcedure: 10 },
    specificities: [],
    businessIdName: 'MF', businessIdFormat: '^[0-9]{7}[A-Z]$', businessIdExample: '1234567A',
  },

  DZ: {
    code: 'DZ', name: 'Algérie', flag: '🇩🇿', currency: 'DZD',
    publicProcurementLaw: 'Décret présidentiel 15-247',
    thresholds: { supplies: 4000000, services: 4000000, works: 12000000 },
    platforms: [{ name: 'BAOSEM', url: 'https://www.baosem.com.dz', type: 'public', description: 'Bulletin officiel' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 30, restrictedProcedure: 15, negotiatedProcedure: 0, urgentProcedure: 10 },
    specificities: ['Règle 51/49 pour certains secteurs'],
    businessIdName: 'NIF', businessIdFormat: '^[0-9]{15}$', businessIdExample: '123456789012345',
  },

  AE: {
    code: 'AE', name: 'Émirats Arabes Unis', flag: '🇦🇪', currency: 'AED',
    publicProcurementLaw: 'Federal Law No. 7/2019',
    thresholds: { supplies: 50000, services: 50000, works: 250000 },
    platforms: [{ name: 'Tejari', url: 'https://www.tejari.com', type: 'both', description: 'Plateforme régionale' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 21, restrictedProcedure: 14, negotiatedProcedure: 0, urgentProcedure: 7 },
    specificities: ['Free zones avec règles spécifiques'],
    businessIdName: 'TRN', businessIdFormat: '^[0-9]{15}$', businessIdExample: '100000000000000',
  },

  SA: {
    code: 'SA', name: 'Arabie Saoudite', flag: '🇸🇦', currency: 'SAR',
    publicProcurementLaw: 'Government Tenders and Procurement Law',
    thresholds: { supplies: 100000, services: 100000, works: 500000 },
    platforms: [{ name: 'Etimad', url: 'https://www.etimad.sa', type: 'public', description: 'Portail national' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 30, restrictedProcedure: 21, negotiatedProcedure: 0, urgentProcedure: 14 },
    specificities: ['Vision 2030 : localisation obligatoire'],
    businessIdName: 'CR', businessIdFormat: '^[0-9]{10}$', businessIdExample: '1234567890',
  },

  QA: {
    code: 'QA', name: 'Qatar', flag: '🇶🇦', currency: 'QAR',
    publicProcurementLaw: 'Law No. 24 of 2015',
    thresholds: { supplies: 100000, services: 100000, works: 500000 },
    platforms: [{ name: 'Government Procurement', url: 'https://www.gpc.gov.qa', type: 'public', description: 'Portail officiel' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 21, restrictedProcedure: 14, negotiatedProcedure: 0, urgentProcedure: 7 },
    specificities: [],
    businessIdName: 'CR', businessIdFormat: '^[0-9]{6}$', businessIdExample: '123456',
  },

  KW: {
    code: 'KW', name: 'Koweït', flag: '🇰🇼', currency: 'KWD',
    publicProcurementLaw: 'Law No. 49 of 2016',
    thresholds: { supplies: 30000, services: 30000, works: 100000 },
    platforms: [{ name: 'CAPT', url: 'https://www.capt.gov.kw', type: 'public', description: 'Central Agency for Public Tenders' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 30, restrictedProcedure: 21, negotiatedProcedure: 0, urgentProcedure: 14 },
    specificities: [],
    businessIdName: 'CR', businessIdFormat: '^[0-9]{6}$', businessIdExample: '123456',
  },

  EG: {
    code: 'EG', name: 'Égypte', flag: '🇪🇬', currency: 'EGP',
    publicProcurementLaw: 'Law No. 182 of 2018',
    thresholds: { supplies: 500000, services: 500000, works: 5000000 },
    platforms: [{ name: 'Egypt Tenders', url: 'https://www.etenders.gov.eg', type: 'public', description: 'Portail national' }],
    publicDocuments: [], privateDocuments: [],
    minResponseDays: { openProcedure: 30, restrictedProcedure: 21, negotiatedProcedure: 0, urgentProcedure: 15 },
    specificities: [],
    businessIdName: 'CR', businessIdFormat: '^[0-9]{8}$', businessIdExample: '12345678',
  },
};

// ===========================================
// FONCTIONS UTILITAIRES
// ===========================================

export function getCountryConfig(countryCode: CountryCode): CountryTenderConfig {
  return COUNTRY_TENDER_CONFIGS[countryCode] || COUNTRY_TENDER_CONFIGS.FR;
}

export function getRequiredDocuments(
  countryCode: CountryCode, 
  tenderType: 'PUBLIC' | 'PRIVATE'
): RequiredDocument[] {
  const config = getCountryConfig(countryCode);
  return tenderType === 'PUBLIC' ? config.publicDocuments : config.privateDocuments;
}

export function getMandatoryDocuments(
  countryCode: CountryCode, 
  tenderType: 'PUBLIC' | 'PRIVATE'
): RequiredDocument[] {
  return getRequiredDocuments(countryCode, tenderType).filter(doc => doc.mandatory);
}

export function getPlatforms(
  countryCode: CountryCode, 
  type?: 'public' | 'private' | 'both'
): TenderPlatform[] {
  const config = getCountryConfig(countryCode);
  if (!type) return config.platforms;
  return config.platforms.filter(p => p.type === type || p.type === 'both');
}

export function validateBusinessId(countryCode: CountryCode, id: string): boolean {
  const config = getCountryConfig(countryCode);
  const regex = new RegExp(config.businessIdFormat);
  return regex.test(id);
}

export function getMinResponseDays(
  countryCode: CountryCode, 
  procedureType: 'openProcedure' | 'restrictedProcedure' | 'negotiatedProcedure' | 'urgentProcedure'
): number {
  const config = getCountryConfig(countryCode);
  return config.minResponseDays[procedureType];
}

export function getAllCountries(): CountryTenderConfig[] {
  return Object.values(COUNTRY_TENDER_CONFIGS);
}

export function getCountriesByRegion(): Record<string, CountryTenderConfig[]> {
  return {
    'Europe de l\'Ouest': [
      COUNTRY_TENDER_CONFIGS.FR,
      COUNTRY_TENDER_CONFIGS.DE,
      COUNTRY_TENDER_CONFIGS.BE,
      COUNTRY_TENDER_CONFIGS.NL,
      COUNTRY_TENDER_CONFIGS.LU,
      COUNTRY_TENDER_CONFIGS.AT,
      COUNTRY_TENDER_CONFIGS.CH,
    ],
    'Europe du Sud': [
      COUNTRY_TENDER_CONFIGS.ES,
      COUNTRY_TENDER_CONFIGS.IT,
      COUNTRY_TENDER_CONFIGS.PT,
      COUNTRY_TENDER_CONFIGS.GR,
    ],
    'Royaume-Uni & Irlande': [
      COUNTRY_TENDER_CONFIGS.GB,
      COUNTRY_TENDER_CONFIGS.IE,
    ],
    'Amérique du Nord': [
      COUNTRY_TENDER_CONFIGS.US,
      COUNTRY_TENDER_CONFIGS.CA,
    ],
    'Amérique Latine': [
      COUNTRY_TENDER_CONFIGS.MX,
      COUNTRY_TENDER_CONFIGS.BR,
      COUNTRY_TENDER_CONFIGS.AR,
      COUNTRY_TENDER_CONFIGS.CO,
      COUNTRY_TENDER_CONFIGS.CL,
      COUNTRY_TENDER_CONFIGS.PE,
    ],
    'MENA': [
      COUNTRY_TENDER_CONFIGS.MA,
      COUNTRY_TENDER_CONFIGS.TN,
      COUNTRY_TENDER_CONFIGS.DZ,
      COUNTRY_TENDER_CONFIGS.AE,
      COUNTRY_TENDER_CONFIGS.SA,
      COUNTRY_TENDER_CONFIGS.QA,
      COUNTRY_TENDER_CONFIGS.KW,
      COUNTRY_TENDER_CONFIGS.EG,
    ],
  };
}
