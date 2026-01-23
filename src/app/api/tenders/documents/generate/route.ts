import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Types de documents supportés
const DOCUMENT_TEMPLATES: Record<string, {
  name: string;
  prompt: string;
  category: string;
}> = {
  dc1: {
    name: 'Formulaire DC1 (Lettre de candidature)',
    category: 'administrative',
    prompt: `Génère une lettre de candidature DC1 pour un appel d'offres public français.
La lettre doit contenir:
- Identification de la procédure (référence, objet)
- Identification du candidat (entreprise, SIRET, adresse)
- Déclarations obligatoires (non-exclusion, capacités)
- Engagement du candidat
Format: Document formel avec mise en page professionnelle.`,
  },
  dc2: {
    name: 'Formulaire DC2 (Déclaration du candidat)',
    category: 'administrative',
    prompt: `Génère une déclaration de candidature DC2 pour un appel d'offres public français.
Le document doit contenir:
- Renseignements sur le candidat
- Capacités économiques et financières
- Capacités techniques et professionnelles
- Références similaires
Format: Formulaire structuré avec sections claires.`,
  },
  memoire_technique: {
    name: 'Mémoire technique',
    category: 'technical',
    prompt: `Génère un mémoire technique professionnel pour répondre à cet appel d'offres.
Structure recommandée:
1. Présentation de l'entreprise et de ses compétences
2. Compréhension du besoin et des enjeux
3. Méthodologie et organisation proposée
4. Moyens humains et matériels dédiés
5. Planning prévisionnel détaillé
6. Gestion de la qualité et des risques
7. Démarche environnementale et RSE
8. Références similaires
Le document doit être argumenté, précis et adapté aux critères d'attribution.`,
  },
  note_methodologique: {
    name: 'Note méthodologique',
    category: 'technical',
    prompt: `Génère une note méthodologique détaillée pour cet appel d'offres.
La note doit présenter:
- Approche générale et philosophie d'intervention
- Organisation du projet (équipe, rôles, responsabilités)
- Processus et méthodes de travail
- Outils et moyens techniques
- Gestion de la communication avec le client
- Processus de validation et de recette
- Gestion des aléas et des modifications`,
  },
  planning: {
    name: 'Planning prévisionnel',
    category: 'technical',
    prompt: `Génère une description de planning prévisionnel pour ce projet.
Le planning doit inclure:
- Phases principales du projet
- Jalons et livrables
- Durées estimées
- Dépendances entre les tâches
- Points de contrôle et réunions
Format: Description textuelle du planning avec dates clés.`,
  },
  references: {
    name: 'Liste des références',
    category: 'technical',
    prompt: `Génère un modèle de liste de références pour ce type de marché.
Pour chaque référence:
- Nom du client et secteur
- Objet de la prestation
- Montant et durée
- Rôle et responsabilités
- Résultats obtenus
- Contact de référence`,
  },
  cv_responsable: {
    name: 'CV du responsable de projet',
    category: 'team',
    prompt: `Génère un modèle de CV professionnel pour un responsable de projet.
Le CV doit contenir:
- Informations personnelles (à compléter)
- Formation et diplômes
- Expérience professionnelle
- Compétences techniques
- Certifications
- Langues
- Références de projets similaires
Format: CV moderne et professionnel.`,
  },
  moyens_humains: {
    name: 'Tableau des moyens humains',
    category: 'team',
    prompt: `Génère un tableau descriptif des moyens humains pour ce projet.
Le document doit présenter:
- Composition de l'équipe projet
- Rôles et responsabilités de chaque membre
- Temps alloué par profil
- Qualifications et expérience
- Organisation hiérarchique
- Processus de remplacement`,
  },
  acte_engagement: {
    name: "Acte d'engagement",
    category: 'administrative',
    prompt: `Génère un modèle d'acte d'engagement pour un marché public.
Le document doit contenir:
- Objet du marché
- Prix et conditions financières
- Durée et délais d'exécution
- Clauses particulières
- Engagements du titulaire
- Signature et date`,
  },
  sous_traitance: {
    name: 'Déclaration de sous-traitance (DC4)',
    category: 'financial',
    prompt: `Génère un modèle de déclaration de sous-traitance DC4.
Le document doit contenir:
- Identification du sous-traitant
- Nature des prestations sous-traitées
- Montant et modalités de paiement
- Conditions de la sous-traitance`,
  },
  organigramme: {
    name: 'Organigramme projet',
    category: 'technical',
    prompt: `Génère une description textuelle d'organigramme projet.
L'organigramme doit présenter:
- Structure hiérarchique du projet
- Équipe dédiée et rôles
- Interfaces avec le client
- Relations avec les sous-traitants éventuels`,
  },
};

// Fonction pour générer un document avec l'IA
async function generateDocumentContent(
  documentKey: string,
  tenderContext: any,
  companyProfile: any
): Promise<string> {
  const template = DOCUMENT_TEMPLATES[documentKey];
  if (!template) {
    throw new Error(`Template de document inconnu: ${documentKey}`);
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    // Mode démo sans API
    return generateDemoDocument(documentKey, template, tenderContext, companyProfile);
  }

  try {
    const systemPrompt = `Tu es un expert en rédaction de réponses aux appels d'offres français. 
Tu génères des documents professionnels, complets et adaptés au contexte du marché.
Utilise un style formel et professionnel.
Les documents doivent être prêts à être imprimés ou convertis en PDF.`;

    const contextPrompt = `
CONTEXTE DE L'APPEL D'OFFRES:
- Référence: ${tenderContext.reference || 'N/A'}
- Titre: ${tenderContext.title || 'N/A'}
- Acheteur: ${tenderContext.buyer?.name || 'N/A'}
- Montant estimé: ${tenderContext.financials?.estimatedValue || 'N/A'}
- Secteur: ${tenderContext.sectors?.join(', ') || 'N/A'}
- Exigences techniques: ${tenderContext.requirements?.technical?.join(', ') || 'N/A'}
- Exigences administratives: ${tenderContext.requirements?.administrative?.join(', ') || 'N/A'}

PROFIL DE L'ENTREPRISE:
- Nom: ${companyProfile?.company_name || '[Nom de l\'entreprise]'}
- SIRET: ${companyProfile?.siret || '[SIRET]'}
- Adresse: ${companyProfile?.address || '[Adresse]'}
- Secteurs: ${companyProfile?.sectors?.join(', ') || 'N/A'}
- Certifications: ${companyProfile?.certifications?.join(', ') || 'N/A'}
- Effectif: ${companyProfile?.employee_count || 'N/A'} personnes
- Expérience: ${companyProfile?.years_experience || 'N/A'} ans

DOCUMENT À GÉNÉRER: ${template.name}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${contextPrompt}\n\n${template.prompt}` },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erreur génération document:', error);
    return generateDemoDocument(documentKey, template, tenderContext, companyProfile);
  }
}

// Génération de document démo
function generateDemoDocument(
  documentKey: string,
  template: any,
  tenderContext: any,
  companyProfile: any
): string {
  const companyName = companyProfile?.company_name || '[NOM DE L\'ENTREPRISE]';
  const siret = companyProfile?.siret || '[SIRET]';
  const address = companyProfile?.address || '[ADRESSE]';
  const tenderRef = tenderContext.reference || '[RÉFÉRENCE AO]';
  const tenderTitle = tenderContext.title || '[TITRE APPEL D\'OFFRES]';
  const buyerName = tenderContext.buyer?.name || '[NOM ACHETEUR]';

  switch (documentKey) {
    case 'dc1':
      return `
═══════════════════════════════════════════════════════════════════
                    LETTRE DE CANDIDATURE - DC1
═══════════════════════════════════════════════════════════════════

MARCHÉ PUBLIC DE: ${tenderTitle}
Référence: ${tenderRef}

═══════════════════════════════════════════════════════════════════
IDENTIFICATION DU POUVOIR ADJUDICATEUR
═══════════════════════════════════════════════════════════════════
${buyerName}

═══════════════════════════════════════════════════════════════════
OBJET DE LA CONSULTATION
═══════════════════════════════════════════════════════════════════
${tenderTitle}

═══════════════════════════════════════════════════════════════════
IDENTIFICATION DU CANDIDAT
═══════════════════════════════════════════════════════════════════
Dénomination sociale: ${companyName}
N° SIRET: ${siret}
Adresse: ${address}
Forme juridique: [À COMPLÉTER]
Représentant légal: [NOM ET PRÉNOM]
Qualité: [FONCTION]

═══════════════════════════════════════════════════════════════════
DÉCLARATIONS DU CANDIDAT
═══════════════════════════════════════════════════════════════════
Le candidat déclare sur l'honneur:
☑ Ne pas faire l'objet d'une interdiction de soumissionner
☑ Être en règle au regard des articles L. 5212-1 à L. 5212-11 du code du travail
☑ Que les renseignements fournis sont exacts

═══════════════════════════════════════════════════════════════════
ENGAGEMENT
═══════════════════════════════════════════════════════════════════
Le candidat s'engage à produire les certificats et attestations requis.

Fait à [VILLE], le [DATE]
Signature du représentant légal:
[SIGNATURE]
`;

    case 'memoire_technique':
      return `
═══════════════════════════════════════════════════════════════════
                       MÉMOIRE TECHNIQUE
═══════════════════════════════════════════════════════════════════

RÉPONSE À L'APPEL D'OFFRES: ${tenderTitle}
Référence: ${tenderRef}
Candidat: ${companyName}

═══════════════════════════════════════════════════════════════════
TABLE DES MATIÈRES
═══════════════════════════════════════════════════════════════════
1. Présentation de l'entreprise
2. Compréhension du besoin
3. Méthodologie proposée
4. Moyens humains et matériels
5. Planning prévisionnel
6. Gestion de la qualité
7. Engagement environnemental
8. Références similaires

═══════════════════════════════════════════════════════════════════
1. PRÉSENTATION DE L'ENTREPRISE
═══════════════════════════════════════════════════════════════════
${companyName} est une entreprise spécialisée dans [DOMAINE D'ACTIVITÉ].

Notre expertise:
• [Compétence 1]
• [Compétence 2]
• [Compétence 3]

Chiffres clés:
• Création: [ANNÉE]
• Effectif: ${companyProfile?.employee_count || '[X]'} collaborateurs
• Chiffre d'affaires: [X] €

═══════════════════════════════════════════════════════════════════
2. COMPRÉHENSION DU BESOIN
═══════════════════════════════════════════════════════════════════
[Description de la compréhension du besoin et des enjeux]

Les objectifs principaux identifiés:
• [Objectif 1]
• [Objectif 2]
• [Objectif 3]

═══════════════════════════════════════════════════════════════════
3. MÉTHODOLOGIE PROPOSÉE
═══════════════════════════════════════════════════════════════════
Notre approche méthodologique s'articule autour de [X] phases:

Phase 1: [Description]
Phase 2: [Description]
Phase 3: [Description]

═══════════════════════════════════════════════════════════════════
4. MOYENS HUMAINS ET MATÉRIELS
═══════════════════════════════════════════════════════════════════
Équipe dédiée:
• Chef de projet: [NOM]
• [Rôle]: [NOM]
• [Rôle]: [NOM]

Moyens matériels:
• [Équipement 1]
• [Équipement 2]

═══════════════════════════════════════════════════════════════════
5. PLANNING PRÉVISIONNEL
═══════════════════════════════════════════════════════════════════
[Description du planning avec jalons]

═══════════════════════════════════════════════════════════════════
6. GESTION DE LA QUALITÉ
═══════════════════════════════════════════════════════════════════
Notre système qualité repose sur:
• Certifications: ${companyProfile?.certifications?.join(', ') || '[CERTIFICATIONS]'}
• Contrôles qualité réguliers
• Indicateurs de performance

═══════════════════════════════════════════════════════════════════
7. ENGAGEMENT ENVIRONNEMENTAL
═══════════════════════════════════════════════════════════════════
[Description des engagements RSE et environnementaux]

═══════════════════════════════════════════════════════════════════
8. RÉFÉRENCES SIMILAIRES
═══════════════════════════════════════════════════════════════════
Référence 1:
• Client: [NOM]
• Objet: [DESCRIPTION]
• Montant: [X] €
• Résultats: [DESCRIPTION]

Référence 2:
• Client: [NOM]
• Objet: [DESCRIPTION]
• Montant: [X] €
• Résultats: [DESCRIPTION]

═══════════════════════════════════════════════════════════════════
                         FIN DU DOCUMENT
═══════════════════════════════════════════════════════════════════
`;

    default:
      return `
═══════════════════════════════════════════════════════════════════
                    ${template.name.toUpperCase()}
═══════════════════════════════════════════════════════════════════

APPEL D'OFFRES: ${tenderTitle}
Référence: ${tenderRef}
Candidat: ${companyName}

═══════════════════════════════════════════════════════════════════
CONTENU
═══════════════════════════════════════════════════════════════════
[Ce document sera généré automatiquement par notre IA]

Catégorie: ${template.category}

Instructions de génération:
${template.prompt}

═══════════════════════════════════════════════════════════════════
                         À COMPLÉTER
═══════════════════════════════════════════════════════════════════
`;
  }
}

// Handler POST pour générer un document
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { documentKey, tenderContext, responseId } = body;

    if (!documentKey || !tenderContext) {
      return NextResponse.json(
        { error: 'Paramètres manquants (documentKey, tenderContext)' },
        { status: 400 }
      );
    }

    // Récupérer le profil de l'entreprise
    const { data: companyProfile } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Générer le contenu du document
    const content = await generateDocumentContent(
      documentKey,
      tenderContext,
      companyProfile
    );

    // Si un responseId est fourni, sauvegarder le document
    if (responseId) {
      const template = DOCUMENT_TEMPLATES[documentKey];
      await (supabase as any).from('tender_response_documents').upsert({
        response_id: responseId,
        document_key: documentKey,
        document_name: template?.name || documentKey,
        document_category: template?.category || 'other',
        document_type: 'generated',
        is_ai_generated: true,
        generated_content: content,
        status: 'ready',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'response_id,document_key',
      });
    }

    return NextResponse.json({
      success: true,
      documentKey,
      content,
      template: DOCUMENT_TEMPLATES[documentKey],
    });
  } catch (error) {
    console.error('Erreur génération document:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du document' },
      { status: 500 }
    );
  }
}

// Handler GET pour lister les templates disponibles
export async function GET() {
  return NextResponse.json({
    success: true,
    templates: Object.entries(DOCUMENT_TEMPLATES).map(([key, value]) => ({
      key,
      ...value,
    })),
  });
}
