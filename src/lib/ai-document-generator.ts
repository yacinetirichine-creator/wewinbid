/**
 * AI Document Generator Service
 * Connects the TenderResponseWizard to the AI generation API
 */

import type { TenderAnalysisResult } from '@/components/tenders/TenderAIAnalysis';

// Types pour la génération de documents
export interface GenerationContext {
  tender: {
    id: string;
    reference: string;
    title: string;
    summary: string;
    buyer: string;
    deadline: string;
    requirements: {
      technical: string[];
      administrative: string[];
      financial: string[];
      certifications: string[];
    };
  };
  company: {
    name: string;
    siret: string;
    address: string;
    email: string;
    phone: string;
    sector: string;
    description?: string;
    references?: CompanyReference[];
    certifications?: string[];
    teamSize?: number;
  };
  branding?: BrandingOptions;
}

export interface CompanyReference {
  clientName: string;
  projectTitle: string;
  year: number;
  value?: number;
  description: string;
}

export interface BrandingOptions {
  logoUrl?: string;
  logoPosition: 'header' | 'footer' | 'both' | 'none';
  companyNameInHeader: boolean;
  companyNameInFooter: boolean;
  primaryColor?: string;
  pageNumberFormat: 'arabic' | 'roman' | 'none';
  pageNumberPosition: 'bottom-center' | 'bottom-right' | 'top-right';
}

export interface GeneratedDocument {
  id: string;
  type: DocumentType;
  title: string;
  content: string; // Markdown content
  sections: DocumentSection[];
  generatedAt: string;
  provider: 'openai' | 'anthropic' | 'template';
  status: 'draft' | 'approved' | 'rejected';
  version: number;
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  order: number;
  isEdited: boolean;
}

export type DocumentType =
  | 'MEMOIRE_TECHNIQUE'
  | 'LETTRE_CANDIDATURE'
  | 'NOTE_METHODOLOGIQUE'
  | 'DC1'
  | 'DC2'
  | 'PLANNING'
  | 'REFERENCES'
  | 'ORGANIGRAMME'
  | 'CV_RESPONSABLE'
  | 'CV_EQUIPE'
  | 'MOYENS_HUMAINS'
  | 'ACTE_ENGAGEMENT'
  | 'PROPOSITION_COMMERCIALE';

// Mapping des documents à leurs types API
const DOCUMENT_TYPE_MAP: Record<string, DocumentType> = {
  'memoire_technique': 'MEMOIRE_TECHNIQUE',
  'note_methodologique': 'NOTE_METHODOLOGIQUE',
  'dc1': 'DC1',
  'dc2': 'DC2',
  'planning': 'PLANNING',
  'references': 'REFERENCES',
  'organigramme': 'ORGANIGRAMME',
  'cv_responsable': 'CV_RESPONSABLE',
  'cv_equipe': 'CV_EQUIPE',
  'moyens_humains': 'MOYENS_HUMAINS',
  'acte_engagement': 'ACTE_ENGAGEMENT',
  'lettre_candidature': 'LETTRE_CANDIDATURE',
};

/**
 * Generate a document using the AI API
 */
export async function generateDocument(
  documentId: string,
  context: GenerationContext,
  onProgress?: (progress: number, message: string) => void
): Promise<GeneratedDocument> {
  const documentType = DOCUMENT_TYPE_MAP[documentId];

  if (!documentType) {
    throw new Error(`Unknown document type: ${documentId}`);
  }

  onProgress?.(10, 'Préparation du contexte...');

  // Build the custom prompt based on tender analysis
  const customPrompt = buildContextualPrompt(documentType, context);

  onProgress?.(30, 'Génération du contenu IA...');

  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tender_id: context.tender.id,
        document_type: documentType,
        custom_prompt: customPrompt,
        company_context: {
          name: context.company.name,
          sector: context.company.sector,
          description: context.company.description,
          references: context.company.references,
          certifications: context.company.certifications,
        },
        tender_context: {
          title: context.tender.title,
          summary: context.tender.summary,
          buyer: context.tender.buyer,
          requirements: context.tender.requirements,
        },
      }),
    });

    onProgress?.(70, 'Traitement de la réponse...');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la génération');
    }

    const data = await response.json();

    onProgress?.(90, 'Finalisation...');

    // Parse the generated content into sections
    const sections = parseContentIntoSections(data.content, documentType);

    const generatedDoc: GeneratedDocument = {
      id: `${documentId}_${Date.now()}`,
      type: documentType,
      title: getDocumentTitle(documentType),
      content: data.content,
      sections,
      generatedAt: new Date().toISOString(),
      provider: data.provider || 'openai',
      status: 'draft',
      version: 1,
    };

    onProgress?.(100, 'Terminé');

    return generatedDoc;
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}

/**
 * Generate a document section by section (for progressive generation)
 */
export async function* generateDocumentProgressive(
  documentId: string,
  context: GenerationContext
): AsyncGenerator<{ section: string; content: string; progress: number }> {
  const documentType = DOCUMENT_TYPE_MAP[documentId];

  if (!documentType) {
    throw new Error(`Unknown document type: ${documentId}`);
  }

  const sections = getSectionsForDocumentType(documentType);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const progress = Math.round(((i + 1) / sections.length) * 100);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tender_id: context.tender.id,
          document_type: documentType,
          section: section.id,
          custom_prompt: buildSectionPrompt(section, context),
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur génération section ${section.name}`);
      }

      const data = await response.json();

      yield {
        section: section.name,
        content: data.content,
        progress,
      };
    } catch (error) {
      console.error(`Error generating section ${section.name}:`, error);
      yield {
        section: section.name,
        content: `[Erreur de génération pour ${section.name}]`,
        progress,
      };
    }
  }
}

/**
 * Build a contextual prompt based on tender analysis
 */
function buildContextualPrompt(documentType: DocumentType, context: GenerationContext): string {
  const { tender, company } = context;

  let basePrompt = `
Contexte de l'appel d'offres:
- Titre: ${tender.title}
- Référence: ${tender.reference}
- Acheteur: ${tender.buyer}
- Résumé: ${tender.summary}
- Date limite: ${tender.deadline}

Exigences techniques:
${tender.requirements.technical.map(r => `- ${r}`).join('\n')}

Exigences administratives:
${tender.requirements.administrative.map(r => `- ${r}`).join('\n')}

Informations entreprise:
- Nom: ${company.name}
- Secteur: ${company.sector}
${company.description ? `- Description: ${company.description}` : ''}
${company.certifications?.length ? `- Certifications: ${company.certifications.join(', ')}` : ''}
${company.teamSize ? `- Effectifs: ${company.teamSize} personnes` : ''}
`;

  // Add document-specific instructions
  switch (documentType) {
    case 'MEMOIRE_TECHNIQUE':
      basePrompt += `
Instructions spécifiques:
- Répondez précisément à chaque exigence technique identifiée
- Mettez en avant les points forts de l'entreprise par rapport aux critères
- Structurez le document de manière claire avec des sections numérotées
- Utilisez un ton professionnel et technique
`;
      break;
    case 'NOTE_METHODOLOGIQUE':
      basePrompt += `
Instructions spécifiques:
- Décrivez la méthodologie de travail proposée
- Incluez les phases du projet, les livrables et les jalons
- Mentionnez les outils et techniques utilisés
- Expliquez la gestion des risques
`;
      break;
    case 'LETTRE_CANDIDATURE':
      basePrompt += `
Instructions spécifiques:
- Rédigez une lettre formelle et professionnelle
- Mentionnez la motivation de l'entreprise pour ce marché
- Résumez les atouts clés de la candidature
- Respectez le format administratif français
`;
      break;
  }

  return basePrompt;
}

function buildSectionPrompt(section: { id: string; name: string }, context: GenerationContext): string {
  return `Générez le contenu pour la section "${section.name}" du document.

Contexte: ${context.tender.title}
Entreprise: ${context.company.name}

Répondez de manière concise et professionnelle.`;
}

function getSectionsForDocumentType(documentType: DocumentType): Array<{ id: string; name: string }> {
  switch (documentType) {
    case 'MEMOIRE_TECHNIQUE':
      return [
        { id: 'presentation', name: 'Présentation de l\'entreprise' },
        { id: 'comprehension', name: 'Compréhension du besoin' },
        { id: 'methodologie', name: 'Méthodologie proposée' },
        { id: 'moyens', name: 'Moyens mis en œuvre' },
        { id: 'planning', name: 'Planning prévisionnel' },
        { id: 'qualite', name: 'Démarche qualité' },
        { id: 'references', name: 'Références similaires' },
        { id: 'engagement', name: 'Engagements' },
      ];
    case 'NOTE_METHODOLOGIQUE':
      return [
        { id: 'approche', name: 'Approche générale' },
        { id: 'phases', name: 'Phases du projet' },
        { id: 'livrables', name: 'Livrables' },
        { id: 'risques', name: 'Gestion des risques' },
      ];
    case 'LETTRE_CANDIDATURE':
      return [
        { id: 'objet', name: 'Objet' },
        { id: 'presentation', name: 'Présentation' },
        { id: 'motivation', name: 'Motivation' },
        { id: 'conclusion', name: 'Conclusion' },
      ];
    default:
      return [{ id: 'content', name: 'Contenu' }];
  }
}

function parseContentIntoSections(content: string, documentType: DocumentType): DocumentSection[] {
  // Simple parsing based on markdown headers
  const sections: DocumentSection[] = [];
  const lines = content.split('\n');
  let currentSection: DocumentSection | null = null;
  let order = 0;

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('# ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      order++;
      currentSection = {
        id: `section_${order}`,
        title: line.replace(/^#+\s*/, ''),
        content: '',
        order,
        isEdited: false,
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // If no sections found, create one with all content
  if (sections.length === 0) {
    sections.push({
      id: 'section_1',
      title: getDocumentTitle(documentType),
      content,
      order: 1,
      isEdited: false,
    });
  }

  return sections;
}

function getDocumentTitle(documentType: DocumentType): string {
  const titles: Record<DocumentType, string> = {
    MEMOIRE_TECHNIQUE: 'Mémoire Technique',
    LETTRE_CANDIDATURE: 'Lettre de Candidature',
    NOTE_METHODOLOGIQUE: 'Note Méthodologique',
    DC1: 'Formulaire DC1',
    DC2: 'Formulaire DC2',
    PLANNING: 'Planning Prévisionnel',
    REFERENCES: 'Liste des Références',
    ORGANIGRAMME: 'Organigramme du Projet',
    CV_RESPONSABLE: 'CV du Responsable de Projet',
    CV_EQUIPE: 'CVs de l\'Équipe',
    MOYENS_HUMAINS: 'Tableau des Moyens Humains',
    ACTE_ENGAGEMENT: 'Acte d\'Engagement',
    PROPOSITION_COMMERCIALE: 'Proposition Commerciale',
  };
  return titles[documentType] || documentType;
}

/**
 * Save generated document to database
 */
export async function saveGeneratedDocument(
  tenderId: string,
  document: GeneratedDocument
): Promise<void> {
  try {
    await fetch('/api/documents/generated', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tender_id: tenderId,
        document_type: document.type,
        title: document.title,
        content: document.content,
        sections: document.sections,
        status: document.status,
        version: document.version,
        provider: document.provider,
      }),
    });
  } catch (error) {
    console.error('Error saving generated document:', error);
    throw error;
  }
}

/**
 * Update document status (approve/reject)
 */
export async function updateDocumentStatus(
  documentId: string,
  status: 'approved' | 'rejected',
  feedback?: string
): Promise<void> {
  try {
    await fetch(`/api/documents/generated/${documentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        feedback,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
}

/**
 * Get default branding options
 */
export function getDefaultBrandingOptions(): BrandingOptions {
  return {
    logoPosition: 'header',
    companyNameInHeader: true,
    companyNameInFooter: false,
    pageNumberFormat: 'arabic',
    pageNumberPosition: 'bottom-center',
  };
}
