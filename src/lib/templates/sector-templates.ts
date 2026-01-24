// Bibliothèque de templates sectoriels pour réponses aux appels d'offres
// Supports: AO publics, AO privés, Marchés internationaux

export interface SectorTemplate {
  id: string;
  name: string;
  nameEn: string;
  sector: string;
  sectorEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  color: string;
  documentTypes: DocumentTypeConfig[];
  keywords: string[];
  keywordsEn: string[];
  countries: string[]; // ISO codes, empty = all
  isPrivate: boolean; // Adapté pour AO privés
  isPublic: boolean; // Adapté pour AO publics
}

export interface DocumentTypeConfig {
  type: string;
  name: string;
  nameEn: string;
  sections: SectionTemplate[];
  requiredFor: ('public' | 'private' | 'international')[];
}

export interface SectionTemplate {
  id: string;
  title: string;
  titleEn: string;
  prompt: string;
  promptEn: string;
  order: number;
  isRequired: boolean;
  estimatedWords: number;
}

// =============================================================================
// TEMPLATES PAR SECTEUR (20+ modèles)
// =============================================================================

export const SECTOR_TEMPLATES: SectorTemplate[] = [
  // 1. BTP / Construction
  {
    id: 'btp-construction',
    name: 'BTP & Construction',
    nameEn: 'Construction & Building',
    sector: 'BTP',
    sectorEn: 'Construction',
    description: 'Templates pour marchés de travaux, rénovation, génie civil',
    descriptionEn: 'Templates for construction works, renovation, civil engineering',
    icon: '🏗️',
    color: '#F59E0B',
    keywords: ['construction', 'bâtiment', 'travaux', 'génie civil', 'rénovation', 'chantier'],
    keywordsEn: ['construction', 'building', 'works', 'civil engineering', 'renovation', 'site'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_BTP',
        name: 'Mémoire Technique BTP',
        nameEn: 'Technical Memorandum - Construction',
        requiredFor: ['public', 'private'],
        sections: [
          {
            id: 'presentation-entreprise',
            title: 'Présentation de l\'entreprise',
            titleEn: 'Company Presentation',
            prompt: 'Présenter l\'entreprise avec ses certifications BTP (Qualibat, RGE), son historique, ses moyens humains et matériels pour les chantiers.',
            promptEn: 'Present the company with its construction certifications, history, human resources and equipment for construction sites.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'comprehension-projet',
            title: 'Compréhension du projet',
            titleEn: 'Project Understanding',
            prompt: 'Démontrer la compréhension des enjeux techniques du chantier, des contraintes de site, et des objectifs du maître d\'ouvrage.',
            promptEn: 'Demonstrate understanding of site technical challenges, constraints, and client objectives.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'methodologie-chantier',
            title: 'Méthodologie de chantier',
            titleEn: 'Site Methodology',
            prompt: 'Décrire l\'organisation du chantier, les phases de travaux, le planning prévisionnel, les moyens mis en œuvre.',
            promptEn: 'Describe site organization, work phases, provisional planning, and resources deployed.',
            order: 3,
            isRequired: true,
            estimatedWords: 800
          },
          {
            id: 'securite-environnement',
            title: 'Sécurité et environnement',
            titleEn: 'Safety and Environment',
            prompt: 'Plan de prévention des risques, gestion des déchets de chantier, mesures environnementales, certifications.',
            promptEn: 'Risk prevention plan, construction waste management, environmental measures, certifications.',
            order: 4,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'references-similaires',
            title: 'Références similaires',
            titleEn: 'Similar References',
            prompt: 'Présenter 3-5 chantiers similaires réalisés avec photos, montants, délais respectés, témoignages clients.',
            promptEn: 'Present 3-5 similar completed projects with photos, amounts, met deadlines, client testimonials.',
            order: 5,
            isRequired: true,
            estimatedWords: 600
          }
        ]
      }
    ]
  },

  // 2. Informatique / Digital
  {
    id: 'it-digital',
    name: 'Informatique & Digital',
    nameEn: 'IT & Digital',
    sector: 'IT',
    sectorEn: 'IT',
    description: 'Templates pour projets informatiques, développement, infrastructure',
    descriptionEn: 'Templates for IT projects, development, infrastructure',
    icon: '💻',
    color: '#3B82F6',
    keywords: ['informatique', 'logiciel', 'développement', 'infrastructure', 'cloud', 'digital'],
    keywordsEn: ['IT', 'software', 'development', 'infrastructure', 'cloud', 'digital'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_IT',
        name: 'Mémoire Technique IT',
        nameEn: 'Technical Memorandum - IT',
        requiredFor: ['public', 'private', 'international'],
        sections: [
          {
            id: 'presentation-esn',
            title: 'Présentation de la société',
            titleEn: 'Company Presentation',
            prompt: 'Présenter l\'ESN/éditeur avec certifications (ISO 27001, HDS, SecNumCloud), partenariats technologiques, équipes.',
            promptEn: 'Present the company with certifications (ISO 27001, SOC2), technology partnerships, teams.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'architecture-technique',
            title: 'Architecture technique proposée',
            titleEn: 'Proposed Technical Architecture',
            prompt: 'Décrire l\'architecture technique, les technologies utilisées, l\'hébergement, la sécurité, la scalabilité.',
            promptEn: 'Describe technical architecture, technologies used, hosting, security, scalability.',
            order: 2,
            isRequired: true,
            estimatedWords: 700
          },
          {
            id: 'methodologie-projet',
            title: 'Méthodologie projet',
            titleEn: 'Project Methodology',
            prompt: 'Méthodologie Agile/Scrum, organisation des sprints, outils de gestion de projet, communication avec le client.',
            promptEn: 'Agile/Scrum methodology, sprint organization, project management tools, client communication.',
            order: 3,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'equipe-projet',
            title: 'Équipe projet',
            titleEn: 'Project Team',
            prompt: 'CV des intervenants clés (chef de projet, architecte, développeurs), compétences, disponibilité.',
            promptEn: 'CVs of key contributors (project manager, architect, developers), skills, availability.',
            order: 4,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'maintenance-support',
            title: 'Maintenance et support',
            titleEn: 'Maintenance and Support',
            prompt: 'SLA proposés, niveaux de support, GTI/GTR, processus d\'escalade, outils de ticketing.',
            promptEn: 'Proposed SLAs, support levels, response times, escalation process, ticketing tools.',
            order: 5,
            isRequired: true,
            estimatedWords: 400
          },
          {
            id: 'rgpd-securite',
            title: 'RGPD et sécurité',
            titleEn: 'GDPR and Security',
            prompt: 'Conformité RGPD, mesures de sécurité, audits, certifications, localisation des données.',
            promptEn: 'GDPR compliance, security measures, audits, certifications, data location.',
            order: 6,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 3. Cybersécurité
  {
    id: 'cybersecurity',
    name: 'Cybersécurité',
    nameEn: 'Cybersecurity',
    sector: 'Sécurité',
    sectorEn: 'Security',
    description: 'Templates pour audits de sécurité, pentests, SOC, conformité',
    descriptionEn: 'Templates for security audits, pentests, SOC, compliance',
    icon: '🔒',
    color: '#DC2626',
    keywords: ['cybersécurité', 'sécurité', 'audit', 'pentest', 'SOC', 'SIEM'],
    keywordsEn: ['cybersecurity', 'security', 'audit', 'pentest', 'SOC', 'SIEM'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_CYBER',
        name: 'Mémoire Technique Cybersécurité',
        nameEn: 'Technical Memorandum - Cybersecurity',
        requiredFor: ['public', 'private', 'international'],
        sections: [
          {
            id: 'presentation-cyber',
            title: 'Présentation cabinet cybersécurité',
            titleEn: 'Cybersecurity Firm Presentation',
            prompt: 'Présenter le cabinet avec qualifications PASSI, certifications (CREST, OSCP), agréments ANSSI.',
            promptEn: 'Present the firm with qualifications, certifications (CREST, OSCP, CISSP), government approvals.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'methodologie-audit',
            title: 'Méthodologie d\'audit',
            titleEn: 'Audit Methodology',
            prompt: 'Décrire la méthodologie d\'audit (OWASP, PTES), les outils utilisés, le périmètre, les livrables.',
            promptEn: 'Describe audit methodology (OWASP, PTES), tools used, scope, deliverables.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'equipe-auditeurs',
            title: 'Équipe d\'auditeurs',
            titleEn: 'Auditor Team',
            prompt: 'CV des auditeurs avec certifications (CEH, OSCP, CISSP), expérience, habilitations.',
            promptEn: 'Auditor CVs with certifications (CEH, OSCP, CISSP), experience, clearances.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'confidentialite',
            title: 'Confidentialité et éthique',
            titleEn: 'Confidentiality and Ethics',
            prompt: 'Engagements de confidentialité, code éthique, assurance RC Pro, destruction des données.',
            promptEn: 'Confidentiality commitments, ethical code, professional insurance, data destruction.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 4. Santé / Médical
  {
    id: 'healthcare',
    name: 'Santé & Médical',
    nameEn: 'Healthcare & Medical',
    sector: 'Santé',
    sectorEn: 'Healthcare',
    description: 'Templates pour établissements de santé, dispositifs médicaux, pharma',
    descriptionEn: 'Templates for healthcare facilities, medical devices, pharma',
    icon: '🏥',
    color: '#10B981',
    keywords: ['santé', 'hôpital', 'médical', 'dispositif', 'pharma', 'HDS'],
    keywordsEn: ['healthcare', 'hospital', 'medical', 'device', 'pharma', 'HDS'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_SANTE',
        name: 'Mémoire Technique Santé',
        nameEn: 'Technical Memorandum - Healthcare',
        requiredFor: ['public', 'private'],
        sections: [
          {
            id: 'presentation-sante',
            title: 'Présentation de l\'entreprise',
            titleEn: 'Company Presentation',
            prompt: 'Présenter avec certifications santé (ISO 13485, HDS, marquage CE), agréments, références hospitalières.',
            promptEn: 'Present with healthcare certifications (ISO 13485, FDA, CE marking), approvals, hospital references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'conformite-reglementaire',
            title: 'Conformité réglementaire',
            titleEn: 'Regulatory Compliance',
            prompt: 'Démontrer la conformité aux réglementations (MDR, HDS, RGPD santé), traçabilité, vigilance.',
            promptEn: 'Demonstrate compliance with regulations (MDR, HIPAA, GDPR health), traceability, vigilance.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'integration-si-sante',
            title: 'Intégration SI Santé',
            titleEn: 'Healthcare IT Integration',
            prompt: 'Interopérabilité HL7/FHIR, intégration DPI, connecteurs établissements de santé.',
            promptEn: 'HL7/FHIR interoperability, EHR integration, healthcare facility connectors.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'formation-accompagnement',
            title: 'Formation et accompagnement',
            titleEn: 'Training and Support',
            prompt: 'Plan de formation des équipes soignantes, accompagnement au changement, support 24/7.',
            promptEn: 'Healthcare team training plan, change management, 24/7 support.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 5. Environnement / Énergie
  {
    id: 'environment-energy',
    name: 'Environnement & Énergie',
    nameEn: 'Environment & Energy',
    sector: 'Environnement',
    sectorEn: 'Environment',
    description: 'Templates pour projets environnementaux, énergies renouvelables, RSE',
    descriptionEn: 'Templates for environmental projects, renewable energy, CSR',
    icon: '🌱',
    color: '#22C55E',
    keywords: ['environnement', 'énergie', 'renouvelable', 'RSE', 'développement durable', 'transition'],
    keywordsEn: ['environment', 'energy', 'renewable', 'CSR', 'sustainable development', 'transition'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_ENV',
        name: 'Mémoire Technique Environnement',
        nameEn: 'Technical Memorandum - Environment',
        requiredFor: ['public', 'private', 'international'],
        sections: [
          {
            id: 'presentation-env',
            title: 'Présentation et engagements RSE',
            titleEn: 'Presentation and CSR Commitments',
            prompt: 'Présenter l\'entreprise avec certifications environnementales (ISO 14001, B Corp), bilan carbone, engagements.',
            promptEn: 'Present company with environmental certifications (ISO 14001, B Corp), carbon footprint, commitments.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'analyse-impact',
            title: 'Analyse d\'impact environnemental',
            titleEn: 'Environmental Impact Analysis',
            prompt: 'Méthodologie d\'analyse d\'impact, indicateurs suivis, objectifs de réduction, reporting.',
            promptEn: 'Impact analysis methodology, tracked indicators, reduction targets, reporting.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'solutions-proposees',
            title: 'Solutions proposées',
            titleEn: 'Proposed Solutions',
            prompt: 'Décrire les solutions techniques, technologies vertes, économies d\'énergie, circularité.',
            promptEn: 'Describe technical solutions, green technologies, energy savings, circularity.',
            order: 3,
            isRequired: true,
            estimatedWords: 700
          },
          {
            id: 'mesure-resultats',
            title: 'Mesure des résultats',
            titleEn: 'Results Measurement',
            prompt: 'KPIs environnementaux, outils de mesure, reporting périodique, amélioration continue.',
            promptEn: 'Environmental KPIs, measurement tools, periodic reporting, continuous improvement.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 6. Transport / Logistique
  {
    id: 'transport-logistics',
    name: 'Transport & Logistique',
    nameEn: 'Transport & Logistics',
    sector: 'Transport',
    sectorEn: 'Transport',
    description: 'Templates pour transport, logistique, supply chain',
    descriptionEn: 'Templates for transport, logistics, supply chain',
    icon: '🚚',
    color: '#6366F1',
    keywords: ['transport', 'logistique', 'supply chain', 'livraison', 'flotte', 'entreposage'],
    keywordsEn: ['transport', 'logistics', 'supply chain', 'delivery', 'fleet', 'warehousing'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_TRANSPORT',
        name: 'Mémoire Technique Transport',
        nameEn: 'Technical Memorandum - Transport',
        requiredFor: ['public', 'private', 'international'],
        sections: [
          {
            id: 'presentation-transport',
            title: 'Présentation du transporteur',
            titleEn: 'Carrier Presentation',
            prompt: 'Présenter avec licences de transport, certifications (ISO 9001, OEA), flotte, couverture géographique.',
            promptEn: 'Present with transport licenses, certifications (ISO 9001, AEO), fleet, geographical coverage.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'moyens-logistiques',
            title: 'Moyens logistiques',
            titleEn: 'Logistics Resources',
            prompt: 'Description de la flotte, entrepôts, systèmes de tracking, capacités de stockage.',
            promptEn: 'Fleet description, warehouses, tracking systems, storage capacities.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'organisation-livraisons',
            title: 'Organisation des livraisons',
            titleEn: 'Delivery Organization',
            prompt: 'Planning type, délais garantis, gestion des urgences, traçabilité temps réel.',
            promptEn: 'Typical planning, guaranteed deadlines, emergency management, real-time tracking.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'rse-transport',
            title: 'Engagement RSE transport',
            titleEn: 'Transport CSR Commitment',
            prompt: 'Flotte verte, optimisation des trajets, bilan carbone, compensation CO2.',
            promptEn: 'Green fleet, route optimization, carbon footprint, CO2 compensation.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 7. Formation / Éducation
  {
    id: 'education-training',
    name: 'Formation & Éducation',
    nameEn: 'Education & Training',
    sector: 'Formation',
    sectorEn: 'Training',
    description: 'Templates pour organismes de formation, e-learning, éducation',
    descriptionEn: 'Templates for training organizations, e-learning, education',
    icon: '🎓',
    color: '#8B5CF6',
    keywords: ['formation', 'éducation', 'e-learning', 'pédagogie', 'Qualiopi', 'certification'],
    keywordsEn: ['training', 'education', 'e-learning', 'pedagogy', 'certification', 'accreditation'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_FORMATION',
        name: 'Mémoire Technique Formation',
        nameEn: 'Technical Memorandum - Training',
        requiredFor: ['public', 'private'],
        sections: [
          {
            id: 'presentation-of',
            title: 'Présentation organisme de formation',
            titleEn: 'Training Organization Presentation',
            prompt: 'Présenter avec certification Qualiopi, agréments, NDA, références clients, domaines d\'expertise.',
            promptEn: 'Present with quality certifications, approvals, references, areas of expertise.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'ingenierie-pedagogique',
            title: 'Ingénierie pédagogique',
            titleEn: 'Educational Engineering',
            prompt: 'Approche pédagogique, modalités (présentiel, distanciel, blended), outils LMS, évaluation.',
            promptEn: 'Pedagogical approach, modalities (in-person, remote, blended), LMS tools, assessment.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'equipe-formateurs',
            title: 'Équipe de formateurs',
            titleEn: 'Trainer Team',
            prompt: 'CV des formateurs, certifications, expérience terrain, compétences pédagogiques.',
            promptEn: 'Trainer CVs, certifications, field experience, pedagogical skills.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'suivi-evaluation',
            title: 'Suivi et évaluation',
            titleEn: 'Monitoring and Evaluation',
            prompt: 'Indicateurs de suivi, évaluations à chaud/froid, taux de satisfaction, amélioration continue.',
            promptEn: 'Monitoring indicators, hot/cold evaluations, satisfaction rates, continuous improvement.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 8. Communication / Marketing
  {
    id: 'communication-marketing',
    name: 'Communication & Marketing',
    nameEn: 'Communication & Marketing',
    sector: 'Communication',
    sectorEn: 'Communication',
    description: 'Templates pour agences de communication, marketing digital, événementiel',
    descriptionEn: 'Templates for communication agencies, digital marketing, events',
    icon: '📢',
    color: '#EC4899',
    keywords: ['communication', 'marketing', 'digital', 'publicité', 'événementiel', 'création'],
    keywordsEn: ['communication', 'marketing', 'digital', 'advertising', 'events', 'creative'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_COM',
        name: 'Mémoire Technique Communication',
        nameEn: 'Technical Memorandum - Communication',
        requiredFor: ['public', 'private'],
        sections: [
          {
            id: 'presentation-agence',
            title: 'Présentation de l\'agence',
            titleEn: 'Agency Presentation',
            prompt: 'Présenter l\'agence, son positionnement, ses expertises (branding, digital, events), références clients.',
            promptEn: 'Present the agency, positioning, expertise (branding, digital, events), client references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'comprehension-brief',
            title: 'Compréhension du brief',
            titleEn: 'Brief Understanding',
            prompt: 'Analyse du brief client, enjeux de communication, cibles, messages clés, positionnement.',
            promptEn: 'Client brief analysis, communication challenges, targets, key messages, positioning.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'recommandation-creative',
            title: 'Recommandation créative',
            titleEn: 'Creative Recommendation',
            prompt: 'Concept créatif proposé, déclinaisons, supports, planning de production.',
            promptEn: 'Proposed creative concept, variations, media, production planning.',
            order: 3,
            isRequired: true,
            estimatedWords: 700
          },
          {
            id: 'plan-media',
            title: 'Plan média',
            titleEn: 'Media Plan',
            prompt: 'Stratégie média, canaux recommandés, budget ventilé, KPIs, reporting.',
            promptEn: 'Media strategy, recommended channels, budget breakdown, KPIs, reporting.',
            order: 4,
            isRequired: true,
            estimatedWords: 500
          }
        ]
      }
    ]
  },

  // 9. Conseil / Consulting
  {
    id: 'consulting',
    name: 'Conseil & Consulting',
    nameEn: 'Consulting',
    sector: 'Conseil',
    sectorEn: 'Consulting',
    description: 'Templates pour cabinets de conseil, AMO, expertise',
    descriptionEn: 'Templates for consulting firms, project management assistance, expertise',
    icon: '💼',
    color: '#0EA5E9',
    keywords: ['conseil', 'consulting', 'AMO', 'expertise', 'stratégie', 'transformation'],
    keywordsEn: ['consulting', 'advisory', 'PMO', 'expertise', 'strategy', 'transformation'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_CONSEIL',
        name: 'Mémoire Technique Conseil',
        nameEn: 'Technical Memorandum - Consulting',
        requiredFor: ['public', 'private', 'international'],
        sections: [
          {
            id: 'presentation-cabinet',
            title: 'Présentation du cabinet',
            titleEn: 'Firm Presentation',
            prompt: 'Présenter le cabinet, ses domaines d\'expertise, ses références sectorielles, son équipe.',
            promptEn: 'Present the firm, areas of expertise, sector references, team.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'comprehension-enjeux',
            title: 'Compréhension des enjeux',
            titleEn: 'Understanding Challenges',
            prompt: 'Analyse du contexte client, enjeux identifiés, problématiques à résoudre, opportunités.',
            promptEn: 'Client context analysis, identified challenges, problems to solve, opportunities.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'approche-methodologique',
            title: 'Approche méthodologique',
            titleEn: 'Methodological Approach',
            prompt: 'Méthodologie de mission, phases de travail, livrables, jalons, gouvernance.',
            promptEn: 'Mission methodology, work phases, deliverables, milestones, governance.',
            order: 3,
            isRequired: true,
            estimatedWords: 700
          },
          {
            id: 'equipe-consultants',
            title: 'Équipe de consultants',
            titleEn: 'Consultant Team',
            prompt: 'CV des consultants proposés, expérience sectorielle, disponibilité, complémentarité.',
            promptEn: 'CVs of proposed consultants, sector experience, availability, complementarity.',
            order: 4,
            isRequired: true,
            estimatedWords: 500
          }
        ]
      }
    ]
  },

  // 10. Industrie / Manufacturing
  {
    id: 'industry-manufacturing',
    name: 'Industrie & Manufacturing',
    nameEn: 'Industry & Manufacturing',
    sector: 'Industrie',
    sectorEn: 'Industry',
    description: 'Templates pour industrie, fabrication, production',
    descriptionEn: 'Templates for industry, manufacturing, production',
    icon: '🏭',
    color: '#64748B',
    keywords: ['industrie', 'fabrication', 'production', 'usine', 'manufacturing', 'qualité'],
    keywordsEn: ['industry', 'manufacturing', 'production', 'factory', 'quality', 'lean'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_INDUSTRIE',
        name: 'Mémoire Technique Industrie',
        nameEn: 'Technical Memorandum - Industry',
        requiredFor: ['public', 'private', 'international'],
        sections: [
          {
            id: 'presentation-industriel',
            title: 'Présentation de l\'industriel',
            titleEn: 'Manufacturer Presentation',
            prompt: 'Présenter avec certifications (ISO 9001, IATF 16949), capacités de production, sites, équipements.',
            promptEn: 'Present with certifications (ISO 9001, IATF 16949), production capacities, sites, equipment.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'processus-fabrication',
            title: 'Processus de fabrication',
            titleEn: 'Manufacturing Process',
            prompt: 'Description du processus, contrôle qualité, traçabilité, gestion des non-conformités.',
            promptEn: 'Process description, quality control, traceability, non-conformity management.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'capacite-production',
            title: 'Capacité et délais',
            titleEn: 'Capacity and Lead Times',
            prompt: 'Capacités de production, délais de fabrication, flexibilité, gestion des pics.',
            promptEn: 'Production capacities, manufacturing lead times, flexibility, peak management.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'supply-chain',
            title: 'Supply chain',
            titleEn: 'Supply Chain',
            prompt: 'Gestion des approvisionnements, fournisseurs, stocks, plan de continuité.',
            promptEn: 'Procurement management, suppliers, inventory, continuity plan.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 11. Services Publics
  {
    id: 'public-services',
    name: 'Services Publics',
    nameEn: 'Public Services',
    sector: 'Public',
    sectorEn: 'Public',
    description: 'Templates pour délégations de service public, concessions',
    descriptionEn: 'Templates for public service delegations, concessions',
    icon: '🏛️',
    color: '#1E40AF',
    keywords: ['service public', 'DSP', 'concession', 'délégation', 'collectivité', 'régie'],
    keywordsEn: ['public service', 'concession', 'delegation', 'public authority', 'utility'],
    countries: ['FR', 'BE', 'CH', 'LU'],
    isPrivate: false,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_DSP',
        name: 'Mémoire Technique DSP',
        nameEn: 'Technical Memorandum - Public Service Delegation',
        requiredFor: ['public'],
        sections: [
          {
            id: 'presentation-operateur',
            title: 'Présentation de l\'opérateur',
            titleEn: 'Operator Presentation',
            prompt: 'Présenter le groupe/entreprise, expérience en gestion de services publics, références DSP.',
            promptEn: 'Present the group/company, public service management experience, delegation references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'projet-exploitation',
            title: 'Projet d\'exploitation',
            titleEn: 'Operating Project',
            prompt: 'Vision du service, objectifs de qualité, innovations proposées, engagements.',
            promptEn: 'Service vision, quality objectives, proposed innovations, commitments.',
            order: 2,
            isRequired: true,
            estimatedWords: 700
          },
          {
            id: 'moyens-humains',
            title: 'Moyens humains',
            titleEn: 'Human Resources',
            prompt: 'Organisation, effectifs, politique RH, formation, conditions de reprise du personnel.',
            promptEn: 'Organization, staff, HR policy, training, staff transfer conditions.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'engagements-qualite',
            title: 'Engagements qualité de service',
            titleEn: 'Service Quality Commitments',
            prompt: 'Indicateurs de performance, engagements contractuels, pénalités acceptées, reporting.',
            promptEn: 'Performance indicators, contractual commitments, accepted penalties, reporting.',
            order: 4,
            isRequired: true,
            estimatedWords: 500
          }
        ]
      }
    ]
  },

  // 12. Finance / Banque / Assurance
  {
    id: 'finance-banking',
    name: 'Finance & Banque',
    nameEn: 'Finance & Banking',
    sector: 'Finance',
    sectorEn: 'Finance',
    description: 'Templates pour services financiers, banque, assurance',
    descriptionEn: 'Templates for financial services, banking, insurance',
    icon: '🏦',
    color: '#0F766E',
    keywords: ['finance', 'banque', 'assurance', 'investissement', 'crédit', 'gestion'],
    keywordsEn: ['finance', 'banking', 'insurance', 'investment', 'credit', 'management'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_FINANCE',
        name: 'Mémoire Technique Finance',
        nameEn: 'Technical Memorandum - Finance',
        requiredFor: ['public', 'private'],
        sections: [
          {
            id: 'presentation-etablissement',
            title: 'Présentation de l\'établissement',
            titleEn: 'Institution Presentation',
            prompt: 'Présenter avec agréments (ACPR, AMF), solidité financière, ratings, réseau.',
            promptEn: 'Present with regulatory approvals, financial strength, ratings, network.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'offre-services',
            title: 'Offre de services',
            titleEn: 'Service Offering',
            prompt: 'Détailler les services proposés, conditions tarifaires, avantages compétitifs.',
            promptEn: 'Detail proposed services, pricing conditions, competitive advantages.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'conformite-reglementaire',
            title: 'Conformité réglementaire',
            titleEn: 'Regulatory Compliance',
            prompt: 'Conformité Bâle III/IV, LCB-FT, RGPD, audit interne, contrôle des risques.',
            promptEn: 'Basel III/IV compliance, AML, GDPR, internal audit, risk control.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'accompagnement-client',
            title: 'Accompagnement client',
            titleEn: 'Client Support',
            prompt: 'Équipe dédiée, interlocuteurs, outils digitaux, reporting périodique.',
            promptEn: 'Dedicated team, contacts, digital tools, periodic reporting.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 13. Agriculture / Agroalimentaire
  {
    id: 'agriculture-food',
    name: 'Agriculture & Agroalimentaire',
    nameEn: 'Agriculture & Food',
    sector: 'Agriculture',
    sectorEn: 'Agriculture',
    description: 'Templates pour agriculture, agroalimentaire, restauration collective',
    descriptionEn: 'Templates for agriculture, food industry, catering',
    icon: '🌾',
    color: '#84CC16',
    keywords: ['agriculture', 'agroalimentaire', 'restauration', 'bio', 'local', 'circuit court'],
    keywordsEn: ['agriculture', 'food', 'catering', 'organic', 'local', 'short supply chain'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_AGRO',
        name: 'Mémoire Technique Agroalimentaire',
        nameEn: 'Technical Memorandum - Food Industry',
        requiredFor: ['public', 'private'],
        sections: [
          {
            id: 'presentation-agro',
            title: 'Présentation de l\'entreprise',
            titleEn: 'Company Presentation',
            prompt: 'Présenter avec certifications (IFS, BRC, Bio), agréments sanitaires, références.',
            promptEn: 'Present with certifications (IFS, BRC, Organic), health approvals, references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'approvisionnement',
            title: 'Politique d\'approvisionnement',
            titleEn: 'Sourcing Policy',
            prompt: 'Origine des produits, part bio/local, traçabilité, partenariats producteurs.',
            promptEn: 'Product origin, organic/local share, traceability, producer partnerships.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'securite-alimentaire',
            title: 'Sécurité alimentaire',
            titleEn: 'Food Safety',
            prompt: 'Plan HACCP, contrôles qualité, gestion des allergènes, traçabilité lots.',
            promptEn: 'HACCP plan, quality controls, allergen management, batch traceability.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'developpement-durable',
            title: 'Développement durable',
            titleEn: 'Sustainable Development',
            prompt: 'Lutte contre le gaspillage, emballages éco-responsables, bilan carbone, économie circulaire.',
            promptEn: 'Waste reduction, eco-friendly packaging, carbon footprint, circular economy.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 14. Tourisme / Hôtellerie
  {
    id: 'tourism-hospitality',
    name: 'Tourisme & Hôtellerie',
    nameEn: 'Tourism & Hospitality',
    sector: 'Tourisme',
    sectorEn: 'Tourism',
    description: 'Templates pour tourisme, hôtellerie, événementiel',
    descriptionEn: 'Templates for tourism, hospitality, events',
    icon: '🏨',
    color: '#F472B6',
    keywords: ['tourisme', 'hôtellerie', 'voyage', 'événementiel', 'séminaire', 'congrès'],
    keywordsEn: ['tourism', 'hospitality', 'travel', 'events', 'seminar', 'congress'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_TOURISME',
        name: 'Mémoire Technique Tourisme',
        nameEn: 'Technical Memorandum - Tourism',
        requiredFor: ['public', 'private'],
        sections: [
          {
            id: 'presentation-tourisme',
            title: 'Présentation de l\'entreprise',
            titleEn: 'Company Presentation',
            prompt: 'Présenter avec agréments (Atout France), labels, capacités d\'accueil, références.',
            promptEn: 'Present with tourism approvals, labels, hosting capacities, references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'offre-prestations',
            title: 'Offre de prestations',
            titleEn: 'Service Offering',
            prompt: 'Détailler les prestations, hébergements, restauration, activités, transport.',
            promptEn: 'Detail services, accommodation, catering, activities, transport.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'qualite-accueil',
            title: 'Qualité d\'accueil',
            titleEn: 'Hospitality Quality',
            prompt: 'Standards de qualité, formation du personnel, gestion des réclamations, satisfaction client.',
            promptEn: 'Quality standards, staff training, complaint management, customer satisfaction.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          }
        ]
      }
    ]
  },

  // 15. Retail / Commerce
  {
    id: 'retail-commerce',
    name: 'Retail & Commerce',
    nameEn: 'Retail & Commerce',
    sector: 'Commerce',
    sectorEn: 'Retail',
    description: 'Templates pour grande distribution, commerce, e-commerce',
    descriptionEn: 'Templates for retail, commerce, e-commerce',
    icon: '🛒',
    color: '#EA580C',
    keywords: ['commerce', 'retail', 'distribution', 'e-commerce', 'magasin', 'vente'],
    keywordsEn: ['commerce', 'retail', 'distribution', 'e-commerce', 'store', 'sales'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_RETAIL',
        name: 'Mémoire Technique Retail',
        nameEn: 'Technical Memorandum - Retail',
        requiredFor: ['private'],
        sections: [
          {
            id: 'presentation-enseigne',
            title: 'Présentation de l\'enseigne',
            titleEn: 'Brand Presentation',
            prompt: 'Présenter l\'enseigne, son réseau, son positionnement, ses références grands comptes.',
            promptEn: 'Present the brand, network, positioning, key account references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'offre-commerciale',
            title: 'Offre commerciale',
            titleEn: 'Commercial Offer',
            prompt: 'Gamme de produits/services, conditions tarifaires, remises volumes, SAV.',
            promptEn: 'Product/service range, pricing conditions, volume discounts, after-sales.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'logistique-livraison',
            title: 'Logistique et livraison',
            titleEn: 'Logistics and Delivery',
            prompt: 'Organisation logistique, délais de livraison, gestion des retours, tracking.',
            promptEn: 'Logistics organization, delivery times, returns management, tracking.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          }
        ]
      }
    ]
  },

  // 16. Nettoyage / Propreté
  {
    id: 'cleaning-facility',
    name: 'Nettoyage & Propreté',
    nameEn: 'Cleaning & Facility',
    sector: 'Services',
    sectorEn: 'Services',
    description: 'Templates pour entreprises de nettoyage, facility management',
    descriptionEn: 'Templates for cleaning companies, facility management',
    icon: '🧹',
    color: '#06B6D4',
    keywords: ['nettoyage', 'propreté', 'facility', 'entretien', 'hygiène', 'multiservices'],
    keywordsEn: ['cleaning', 'facility', 'maintenance', 'hygiene', 'multi-services', 'janitorial'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_NETTOYAGE',
        name: 'Mémoire Technique Nettoyage',
        nameEn: 'Technical Memorandum - Cleaning',
        requiredFor: ['public', 'private'],
        sections: [
          {
            id: 'presentation-nettoyage',
            title: 'Présentation de l\'entreprise',
            titleEn: 'Company Presentation',
            prompt: 'Présenter avec certifications (Qualipropre, ISO 14001), effectifs, références similaires.',
            promptEn: 'Present with certifications (ISO 14001), staff, similar references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'organisation-prestations',
            title: 'Organisation des prestations',
            titleEn: 'Service Organization',
            prompt: 'Planning type, fréquences, équipes dédiées, matériel utilisé, produits éco-responsables.',
            promptEn: 'Typical planning, frequencies, dedicated teams, equipment, eco-friendly products.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'controle-qualite',
            title: 'Contrôle qualité',
            titleEn: 'Quality Control',
            prompt: 'Système de contrôle, audits, indicateurs de performance, gestion des réclamations.',
            promptEn: 'Control system, audits, performance indicators, complaint management.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'engagement-social',
            title: 'Engagement social et environnemental',
            titleEn: 'Social and Environmental Commitment',
            prompt: 'Politique RH, insertion, formation, produits écologiques, gestion des déchets.',
            promptEn: 'HR policy, inclusion, training, ecological products, waste management.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 17. Sécurité privée / Gardiennage
  {
    id: 'private-security',
    name: 'Sécurité Privée',
    nameEn: 'Private Security',
    sector: 'Sécurité',
    sectorEn: 'Security',
    description: 'Templates pour gardiennage, surveillance, sûreté',
    descriptionEn: 'Templates for security guarding, surveillance, safety',
    icon: '🛡️',
    color: '#1E3A8A',
    keywords: ['sécurité', 'gardiennage', 'surveillance', 'sûreté', 'agent', 'protection'],
    keywordsEn: ['security', 'guarding', 'surveillance', 'safety', 'agent', 'protection'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_SECURITE',
        name: 'Mémoire Technique Sécurité',
        nameEn: 'Technical Memorandum - Security',
        requiredFor: ['public', 'private'],
        sections: [
          {
            id: 'presentation-securite',
            title: 'Présentation de l\'entreprise',
            titleEn: 'Company Presentation',
            prompt: 'Présenter avec autorisation CNAPS, certifications (APSAD, ISO 18788), références.',
            promptEn: 'Present with security licenses, certifications (ISO 18788), references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'dispositif-securite',
            title: 'Dispositif de sécurité',
            titleEn: 'Security Setup',
            prompt: 'Organisation proposée, effectifs, postes, rondes, moyens techniques (vidéo, contrôle d\'accès).',
            promptEn: 'Proposed organization, staff, posts, patrols, technical means (video, access control).',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'procedures-intervention',
            title: 'Procédures d\'intervention',
            titleEn: 'Intervention Procedures',
            prompt: 'Consignes de sécurité, gestion des incidents, coordination forces de l\'ordre, main courante.',
            promptEn: 'Security instructions, incident management, law enforcement coordination, log book.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'formation-agents',
            title: 'Formation des agents',
            titleEn: 'Agent Training',
            prompt: 'Qualifications requises, formation continue, recyclages, spécialisations.',
            promptEn: 'Required qualifications, continuous training, refresher courses, specializations.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 18. Ingénierie / Bureau d'études
  {
    id: 'engineering',
    name: 'Ingénierie & Bureau d\'études',
    nameEn: 'Engineering & Design Office',
    sector: 'Ingénierie',
    sectorEn: 'Engineering',
    description: 'Templates pour bureaux d\'études, maîtrise d\'œuvre, ingénierie',
    descriptionEn: 'Templates for design offices, project management, engineering',
    icon: '📐',
    color: '#7C3AED',
    keywords: ['ingénierie', 'bureau études', 'MOE', 'conception', 'calcul', 'études'],
    keywordsEn: ['engineering', 'design office', 'project management', 'design', 'calculation', 'studies'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_INGENIERIE',
        name: 'Mémoire Technique Ingénierie',
        nameEn: 'Technical Memorandum - Engineering',
        requiredFor: ['public', 'private', 'international'],
        sections: [
          {
            id: 'presentation-bet',
            title: 'Présentation du bureau d\'études',
            titleEn: 'Design Office Presentation',
            prompt: 'Présenter avec qualifications OPQIBI/OPQTECC, assurances, domaines d\'expertise, références.',
            promptEn: 'Present with engineering qualifications, insurance, areas of expertise, references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'comprehension-programme',
            title: 'Compréhension du programme',
            titleEn: 'Program Understanding',
            prompt: 'Analyse du programme, contraintes techniques, réglementation applicable, enjeux.',
            promptEn: 'Program analysis, technical constraints, applicable regulations, challenges.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'methodologie-etudes',
            title: 'Méthodologie d\'études',
            titleEn: 'Study Methodology',
            prompt: 'Phases d\'études (ESQ, AVP, PRO, EXE), outils BIM/CAO, coordination technique.',
            promptEn: 'Study phases, BIM/CAD tools, technical coordination.',
            order: 3,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'equipe-moe',
            title: 'Équipe de maîtrise d\'œuvre',
            titleEn: 'Project Management Team',
            prompt: 'CV des intervenants clés, expérience projets similaires, disponibilité.',
            promptEn: 'CVs of key contributors, similar project experience, availability.',
            order: 4,
            isRequired: true,
            estimatedWords: 500
          }
        ]
      }
    ]
  },

  // 19. Ressources Humaines / Recrutement
  {
    id: 'hr-recruitment',
    name: 'RH & Recrutement',
    nameEn: 'HR & Recruitment',
    sector: 'RH',
    sectorEn: 'HR',
    description: 'Templates pour cabinets RH, recrutement, intérim',
    descriptionEn: 'Templates for HR firms, recruitment, temporary staffing',
    icon: '👥',
    color: '#DB2777',
    keywords: ['RH', 'recrutement', 'intérim', 'formation', 'paie', 'externalisation'],
    keywordsEn: ['HR', 'recruitment', 'temporary', 'training', 'payroll', 'outsourcing'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_RH',
        name: 'Mémoire Technique RH',
        nameEn: 'Technical Memorandum - HR',
        requiredFor: ['public', 'private'],
        sections: [
          {
            id: 'presentation-cabinet-rh',
            title: 'Présentation du cabinet',
            titleEn: 'Firm Presentation',
            prompt: 'Présenter avec agréments, spécialisations sectorielles, références grands comptes.',
            promptEn: 'Present with approvals, sector specializations, key account references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'processus-recrutement',
            title: 'Processus de recrutement',
            titleEn: 'Recruitment Process',
            prompt: 'Méthodologie de sourcing, outils d\'évaluation, délais moyens, garanties.',
            promptEn: 'Sourcing methodology, assessment tools, average timelines, guarantees.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'vivier-candidats',
            title: 'Vivier de candidats',
            titleEn: 'Candidate Pool',
            prompt: 'Taille et qualité du vivier, partenariats écoles, présence réseaux sociaux.',
            promptEn: 'Pool size and quality, school partnerships, social media presence.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'reporting-kpis',
            title: 'Reporting et KPIs',
            titleEn: 'Reporting and KPIs',
            prompt: 'Indicateurs de performance, tableaux de bord, revues périodiques.',
            promptEn: 'Performance indicators, dashboards, periodic reviews.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 20. Télécommunications
  {
    id: 'telecommunications',
    name: 'Télécommunications',
    nameEn: 'Telecommunications',
    sector: 'Telecom',
    sectorEn: 'Telecom',
    description: 'Templates pour opérateurs télécom, réseaux, fibres',
    descriptionEn: 'Templates for telecom operators, networks, fiber',
    icon: '📡',
    color: '#0891B2',
    keywords: ['télécom', 'réseau', 'fibre', 'mobile', '5G', 'opérateur'],
    keywordsEn: ['telecom', 'network', 'fiber', 'mobile', '5G', 'operator'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_TELECOM',
        name: 'Mémoire Technique Telecom',
        nameEn: 'Technical Memorandum - Telecom',
        requiredFor: ['public', 'private', 'international'],
        sections: [
          {
            id: 'presentation-operateur',
            title: 'Présentation de l\'opérateur',
            titleEn: 'Operator Presentation',
            prompt: 'Présenter avec licences ARCEP, couverture réseau, infrastructure, références.',
            promptEn: 'Present with telecom licenses, network coverage, infrastructure, references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'solution-technique',
            title: 'Solution technique',
            titleEn: 'Technical Solution',
            prompt: 'Architecture réseau proposée, technologies (fibre, 5G), redondance, SLA.',
            promptEn: 'Proposed network architecture, technologies (fiber, 5G), redundancy, SLA.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'deploiement-migration',
            title: 'Déploiement et migration',
            titleEn: 'Deployment and Migration',
            prompt: 'Planning de déploiement, gestion de la migration, continuité de service.',
            promptEn: 'Deployment planning, migration management, service continuity.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'support-supervision',
            title: 'Support et supervision',
            titleEn: 'Support and Monitoring',
            prompt: 'NOC 24/7, outils de supervision, GTI/GTR, processus d\'escalade.',
            promptEn: 'NOC 24/7, monitoring tools, response times, escalation process.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  },

  // 21. Défense / Aéronautique
  {
    id: 'defense-aerospace',
    name: 'Défense & Aéronautique',
    nameEn: 'Defense & Aerospace',
    sector: 'Défense',
    sectorEn: 'Defense',
    description: 'Templates pour industrie de défense, aéronautique, spatial',
    descriptionEn: 'Templates for defense industry, aerospace, space',
    icon: '✈️',
    color: '#1F2937',
    keywords: ['défense', 'aéronautique', 'spatial', 'militaire', 'sécurité', 'export'],
    keywordsEn: ['defense', 'aerospace', 'space', 'military', 'security', 'export'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_DEFENSE',
        name: 'Mémoire Technique Défense',
        nameEn: 'Technical Memorandum - Defense',
        requiredFor: ['public', 'private', 'international'],
        sections: [
          {
            id: 'presentation-defense',
            title: 'Présentation de l\'entreprise',
            titleEn: 'Company Presentation',
            prompt: 'Présenter avec habilitations (Secret Défense), certifications (EN 9100), références DGA/OTAN.',
            promptEn: 'Present with security clearances, certifications (AS9100), defense/NATO references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'solution-technique-defense',
            title: 'Solution technique',
            titleEn: 'Technical Solution',
            prompt: 'Description technique détaillée, conformité aux spécifications, performances.',
            promptEn: 'Detailed technical description, specification compliance, performance.',
            order: 2,
            isRequired: true,
            estimatedWords: 700
          },
          {
            id: 'securite-confidentialite',
            title: 'Sécurité et confidentialité',
            titleEn: 'Security and Confidentiality',
            prompt: 'Mesures de protection du secret, habilitations du personnel, locaux sécurisés.',
            promptEn: 'Secret protection measures, personnel clearances, secure facilities.',
            order: 3,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'maintien-condition',
            title: 'Maintien en condition opérationnelle',
            titleEn: 'Operational Maintenance',
            prompt: 'MCO proposé, disponibilité pièces, formation maintenance, durée de vie.',
            promptEn: 'Proposed maintenance, parts availability, maintenance training, lifecycle.',
            order: 4,
            isRequired: true,
            estimatedWords: 500
          }
        ]
      }
    ]
  },

  // 22. Événementiel / MICE
  {
    id: 'events-mice',
    name: 'Événementiel & MICE',
    nameEn: 'Events & MICE',
    sector: 'Événementiel',
    sectorEn: 'Events',
    description: 'Templates pour organisation d\'événements, salons, congrès',
    descriptionEn: 'Templates for event organization, trade shows, conferences',
    icon: '🎪',
    color: '#A855F7',
    keywords: ['événementiel', 'congrès', 'salon', 'séminaire', 'organisation', 'MICE'],
    keywordsEn: ['events', 'congress', 'trade show', 'seminar', 'organization', 'MICE'],
    countries: [],
    isPrivate: true,
    isPublic: true,
    documentTypes: [
      {
        type: 'MEMOIRE_TECHNIQUE_EVENT',
        name: 'Mémoire Technique Événementiel',
        nameEn: 'Technical Memorandum - Events',
        requiredFor: ['public', 'private'],
        sections: [
          {
            id: 'presentation-agence-event',
            title: 'Présentation de l\'agence',
            titleEn: 'Agency Presentation',
            prompt: 'Présenter l\'agence, ses domaines d\'expertise, références événements similaires.',
            promptEn: 'Present the agency, areas of expertise, similar event references.',
            order: 1,
            isRequired: true,
            estimatedWords: 500
          },
          {
            id: 'concept-evenement',
            title: 'Concept événementiel',
            titleEn: 'Event Concept',
            prompt: 'Proposition créative, thématique, scénographie, parcours participant.',
            promptEn: 'Creative proposal, theme, scenography, participant journey.',
            order: 2,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'production-logistique',
            title: 'Production et logistique',
            titleEn: 'Production and Logistics',
            prompt: 'Organisation technique, prestataires, planning de production, gestion des risques.',
            promptEn: 'Technical organization, suppliers, production planning, risk management.',
            order: 3,
            isRequired: true,
            estimatedWords: 600
          },
          {
            id: 'budget-evenement',
            title: 'Budget prévisionnel',
            titleEn: 'Budget Forecast',
            prompt: 'Ventilation du budget, options d\'optimisation, conditions de règlement.',
            promptEn: 'Budget breakdown, optimization options, payment terms.',
            order: 4,
            isRequired: true,
            estimatedWords: 400
          }
        ]
      }
    ]
  }
];

// =============================================================================
// SUPPORT AO PRIVÉS ET INTERNATIONAUX
// =============================================================================

export interface TenderType {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  isPublic: boolean;
  countries: string[];
}

export const TENDER_TYPES: TenderType[] = [
  // AO Publics français
  {
    id: 'ao-public-fr',
    name: 'Appel d\'offres public (France)',
    nameEn: 'Public Tender (France)',
    description: 'Marchés publics français (État, collectivités, établissements publics)',
    descriptionEn: 'French public contracts (State, local authorities, public institutions)',
    isPublic: true,
    countries: ['FR']
  },
  // AO Publics européens
  {
    id: 'ao-public-eu',
    name: 'Appel d\'offres européen',
    nameEn: 'European Tender',
    description: 'Marchés publiés au JOUE, procédures européennes',
    descriptionEn: 'Contracts published in OJEU, European procedures',
    isPublic: true,
    countries: ['EU']
  },
  // AO Privés France
  {
    id: 'ao-prive-fr',
    name: 'Appel d\'offres privé (France)',
    nameEn: 'Private Tender (France)',
    description: 'Consultations privées d\'entreprises françaises',
    descriptionEn: 'Private consultations from French companies',
    isPublic: false,
    countries: ['FR']
  },
  // AO Privés International
  {
    id: 'ao-prive-intl',
    name: 'Appel d\'offres privé international',
    nameEn: 'International Private Tender',
    description: 'Consultations privées d\'entreprises internationales',
    descriptionEn: 'Private consultations from international companies',
    isPublic: false,
    countries: []
  },
  // RFP/RFQ International
  {
    id: 'rfp-intl',
    name: 'RFP/RFQ International',
    nameEn: 'International RFP/RFQ',
    description: 'Request for Proposal / Request for Quotation',
    descriptionEn: 'Request for Proposal / Request for Quotation',
    isPublic: false,
    countries: []
  },
  // Marchés publics Belgique
  {
    id: 'ao-public-be',
    name: 'Marché public (Belgique)',
    nameEn: 'Public Contract (Belgium)',
    description: 'Marchés publics belges',
    descriptionEn: 'Belgian public contracts',
    isPublic: true,
    countries: ['BE']
  },
  // Marchés publics Suisse
  {
    id: 'ao-public-ch',
    name: 'Marché public (Suisse)',
    nameEn: 'Public Contract (Switzerland)',
    description: 'Marchés publics suisses',
    descriptionEn: 'Swiss public contracts',
    isPublic: true,
    countries: ['CH']
  },
  // Marchés publics Luxembourg
  {
    id: 'ao-public-lu',
    name: 'Marché public (Luxembourg)',
    nameEn: 'Public Contract (Luxembourg)',
    description: 'Marchés publics luxembourgeois',
    descriptionEn: 'Luxembourg public contracts',
    isPublic: true,
    countries: ['LU']
  },
  // Marchés publics Canada
  {
    id: 'ao-public-ca',
    name: 'Marché public (Canada)',
    nameEn: 'Public Contract (Canada)',
    description: 'Marchés publics canadiens (fédéral et provincial)',
    descriptionEn: 'Canadian public contracts (federal and provincial)',
    isPublic: true,
    countries: ['CA']
  },
  // Marchés publics Afrique francophone
  {
    id: 'ao-public-africa',
    name: 'Marché public (Afrique)',
    nameEn: 'Public Contract (Africa)',
    description: 'Marchés publics africains francophones',
    descriptionEn: 'French-speaking African public contracts',
    isPublic: true,
    countries: ['MA', 'TN', 'DZ', 'SN', 'CI', 'CM', 'CD', 'MG']
  },
  // Marchés Banque Mondiale / AFD
  {
    id: 'ao-intl-org',
    name: 'Organisations internationales',
    nameEn: 'International Organizations',
    description: 'Marchés Banque Mondiale, AFD, BID, BAD',
    descriptionEn: 'World Bank, AFD, IDB, AfDB contracts',
    isPublic: true,
    countries: []
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get templates by sector
 */
export function getTemplatesBySector(sectorId: string): SectorTemplate | undefined {
  return SECTOR_TEMPLATES.find(t => t.id === sectorId);
}

/**
 * Get all sectors
 */
export function getAllSectors(): { id: string; name: string; nameEn: string; icon: string; color: string }[] {
  return SECTOR_TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    nameEn: t.nameEn,
    icon: t.icon,
    color: t.color
  }));
}

/**
 * Get templates for a specific tender type
 */
export function getTemplatesForTenderType(
  tenderTypeId: string,
  sectorId?: string
): SectorTemplate[] {
  const tenderType = TENDER_TYPES.find(t => t.id === tenderTypeId);
  if (!tenderType) return SECTOR_TEMPLATES;

  let templates = SECTOR_TEMPLATES.filter(template => {
    // Filter by public/private
    if (tenderType.isPublic && !template.isPublic) return false;
    if (!tenderType.isPublic && !template.isPrivate) return false;

    // Filter by country if specified
    if (tenderType.countries.length > 0 && template.countries.length > 0) {
      const hasMatchingCountry = tenderType.countries.some(c =>
        template.countries.includes(c) || template.countries.length === 0
      );
      if (!hasMatchingCountry) return false;
    }

    return true;
  });

  // Filter by sector if specified
  if (sectorId) {
    templates = templates.filter(t => t.id === sectorId);
  }

  return templates;
}

/**
 * Search templates by keyword
 */
export function searchTemplates(query: string, lang: 'fr' | 'en' = 'fr'): SectorTemplate[] {
  const lowerQuery = query.toLowerCase();

  return SECTOR_TEMPLATES.filter(template => {
    const keywords = lang === 'fr' ? template.keywords : template.keywordsEn;
    const name = lang === 'fr' ? template.name : template.nameEn;
    const description = lang === 'fr' ? template.description : template.descriptionEn;

    return (
      name.toLowerCase().includes(lowerQuery) ||
      description.toLowerCase().includes(lowerQuery) ||
      keywords.some(k => k.toLowerCase().includes(lowerQuery))
    );
  });
}

/**
 * Get document type configuration
 */
export function getDocumentTypeConfig(
  sectorId: string,
  documentType: string
): DocumentTypeConfig | undefined {
  const template = SECTOR_TEMPLATES.find(t => t.id === sectorId);
  if (!template) return undefined;

  return template.documentTypes.find(d => d.type === documentType);
}

/**
 * Generate AI prompt for a specific section
 */
export function generateSectionPrompt(
  section: SectionTemplate,
  tenderContext: {
    tenderTitle: string;
    tenderDescription: string;
    companyName: string;
    companyDescription: string;
    isPrivate: boolean;
    country: string;
  },
  lang: 'fr' | 'en' = 'fr'
): string {
  const basePrompt = lang === 'fr' ? section.prompt : section.promptEn;
  const title = lang === 'fr' ? section.title : section.titleEn;

  const contextFr = `
Contexte de l'appel d'offres:
- Titre: ${tenderContext.tenderTitle}
- Description: ${tenderContext.tenderDescription}
- Type: ${tenderContext.isPrivate ? 'Appel d\'offres privé' : 'Marché public'}
- Pays: ${tenderContext.country}

Informations entreprise:
- Nom: ${tenderContext.companyName}
- Description: ${tenderContext.companyDescription}

Section à rédiger: ${title}
Instructions: ${basePrompt}

Rédigez un texte professionnel d'environ ${section.estimatedWords} mots pour cette section.
Le texte doit être personnalisé pour l'entreprise et adapté au contexte de l'appel d'offres.
`;

  const contextEn = `
Tender Context:
- Title: ${tenderContext.tenderTitle}
- Description: ${tenderContext.tenderDescription}
- Type: ${tenderContext.isPrivate ? 'Private tender' : 'Public contract'}
- Country: ${tenderContext.country}

Company Information:
- Name: ${tenderContext.companyName}
- Description: ${tenderContext.companyDescription}

Section to write: ${title}
Instructions: ${basePrompt}

Write a professional text of approximately ${section.estimatedWords} words for this section.
The text should be personalized for the company and adapted to the tender context.
`;

  return lang === 'fr' ? contextFr : contextEn;
}

export default SECTOR_TEMPLATES;
