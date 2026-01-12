import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Document templates
const DOCUMENT_TEMPLATES = {
  // Mémoire Technique Template
  MEMOIRE_TECHNIQUE: {
    sections: [
      'presentation_entreprise',
      'comprehension_besoin',
      'methodologie',
      'moyens_humains',
      'moyens_materiels',
      'planning',
      'engagement_qualite',
      'references',
    ],
    prompts: {
      presentation_entreprise: `Rédigez une présentation d'entreprise professionnelle incluant:
- Historique et valeurs
- Domaines d'expertise
- Certifications et agréments
- Chiffres clés`,
      comprehension_besoin: `Analysez et reformulez le besoin du client en démontrant:
- Compréhension des enjeux
- Identification des points critiques
- Valeur ajoutée proposée`,
      methodologie: `Décrivez la méthodologie de travail:
- Phases du projet
- Livrables attendus
- Points de contrôle
- Gestion des risques`,
      moyens_humains: `Présentez l'équipe projet:
- Organigramme
- Profils et compétences
- Responsabilités`,
      moyens_materiels: `Détaillez les ressources matérielles:
- Équipements
- Outils et logiciels
- Infrastructure`,
      planning: `Proposez un planning réaliste:
- Macro-planning
- Jalons clés
- Délais de livraison`,
      engagement_qualite: `Décrivez les engagements qualité:
- Processus qualité
- Indicateurs de performance
- Plan d'amélioration continue`,
      references: `Présentez vos références pertinentes:
- Projets similaires
- Clients et secteurs
- Résultats obtenus`,
    },
  },
  
  // Lettre de candidature
  LETTRE_CANDIDATURE: {
    sections: ['header', 'introduction', 'motivation', 'conclusion'],
    prompts: {
      introduction: `Rédigez une introduction percutante mentionnant:
- L'objet du marché
- La référence de l'appel d'offres
- L'entité candidate`,
      motivation: `Expliquez pourquoi votre entreprise est le meilleur choix:
- Points forts
- Expérience pertinente
- Avantages concurrentiels`,
      conclusion: `Concluez avec:
- Réitération de l'intérêt
- Disponibilité pour échanger
- Formule de politesse professionnelle`,
    },
  },
  
  // Proposition commerciale (privé)
  PROPOSITION_COMMERCIALE: {
    sections: ['executive_summary', 'contexte', 'solution', 'tarification', 'next_steps'],
    prompts: {
      executive_summary: `Rédigez un résumé exécutif en 3-4 phrases:
- Problème identifié
- Solution proposée
- Bénéfices clés`,
      contexte: `Décrivez le contexte et les enjeux du client`,
      solution: `Présentez votre solution de manière structurée:
- Approche
- Livrables
- Différenciateurs`,
      tarification: `Présentez la structure tarifaire de manière transparente`,
      next_steps: `Proposez les prochaines étapes de collaboration`,
    },
  },
  
  // Social Media Post
  SOCIAL_POST: {
    sections: ['hook', 'content', 'cta'],
    prompts: {
      hook: `Créez une accroche percutante pour attirer l'attention`,
      content: `Développez le message principal de manière engageante`,
      cta: `Terminez par un appel à l'action clair`,
    },
  },
};

// AI Provider helpers
async function generateWithOpenAI(prompt: string, context: any): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Vous êtes un expert en rédaction d'appels d'offres et de documents commerciaux professionnels en français. 
Vous rédigez des contenus clairs, structurés et persuasifs.
Contexte de l'entreprise: ${JSON.stringify(context.company)}
Contexte du marché: ${JSON.stringify(context.tender)}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) {
    throw new Error('OpenAI API error');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateWithAnthropic(prompt: string, context: any): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      system: `Vous êtes un expert en rédaction d'appels d'offres et de documents commerciaux professionnels en français. 
Vous rédigez des contenus clairs, structurés et persuasifs.
Contexte de l'entreprise: ${JSON.stringify(context.company)}
Contexte du marché: ${JSON.stringify(context.tender)}`,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });
  
  if (!response.ok) {
    throw new Error('Anthropic API error');
  }
  
  const data = await response.json();
  return data.content[0].text;
}

// Fallback generation (mock for demo)
function generateMock(documentType: string, section: string, context: any): string {
  const company = context.company;
  const tender = context.tender;
  
  const templates: Record<string, Record<string, string>> = {
    MEMOIRE_TECHNIQUE: {
      presentation_entreprise: `
## Présentation de ${company?.name || 'Notre Entreprise'}

${company?.name || 'Notre entreprise'} est un acteur reconnu dans le secteur ${tender?.sector || 'concerné'}, fort d'une expertise de plusieurs années.

### Nos valeurs
- Excellence opérationnelle
- Innovation continue
- Satisfaction client

### Nos certifications
- ISO 9001:2015
- Certification professionnelle du secteur

### Chiffres clés
- ${company?.employees || 'XX'} collaborateurs
- ${company?.turnover || 'X M€'} de chiffre d'affaires
- ${company?.years_experience || 'XX'} années d'expérience
`,
      comprehension_besoin: `
## Compréhension du besoin

Nous avons analysé avec attention votre cahier des charges concernant "${tender?.title || 'ce marché'}".

### Enjeux identifiés
1. Qualité de service attendue
2. Respect des délais
3. Optimisation des coûts
4. Conformité réglementaire

### Notre compréhension
Votre besoin s'inscrit dans une démarche de professionnalisation et d'optimisation de vos processus. Notre réponse a été construite pour répondre précisément à ces attentes.
`,
      methodologie: `
## Méthodologie proposée

### Phase 1 : Cadrage (Semaine 1-2)
- Réunion de lancement
- Analyse détaillée des besoins
- Validation du planning

### Phase 2 : Mise en œuvre (Semaines 3-X)
- Déploiement progressif
- Points d'avancement hebdomadaires
- Ajustements si nécessaire

### Phase 3 : Clôture
- Recette et validation
- Formation des utilisateurs
- Documentation finale
`,
    },
    LETTRE_CANDIDATURE: {
      introduction: `
Madame, Monsieur,

Suite à la publication de votre appel d'offres "${tender?.reference || 'Réf. XXX'}" concernant "${tender?.title || 'le marché'}", nous avons l'honneur de vous présenter notre candidature.

${company?.name || 'Notre société'}, spécialisée dans ${tender?.sector || 'notre domaine d\'expertise'}, souhaite vous accompagner dans ce projet.
`,
      motivation: `
Notre entreprise présente les atouts suivants pour ce marché :

✓ Une expertise reconnue dans le secteur ${tender?.sector || 'concerné'}
✓ Des références clients similaires et vérifiables
✓ Une équipe qualifiée et disponible
✓ Des moyens techniques adaptés à vos exigences
✓ Un engagement qualité fort

Nous sommes convaincus que notre approche répondra parfaitement à vos attentes.
`,
      conclusion: `
Nous restons à votre entière disposition pour tout complément d'information et serions honorés de pouvoir vous présenter notre offre de vive voix.

Dans l'attente de votre retour, nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

${company?.name || 'La Direction'}
`,
    },
    PROPOSITION_COMMERCIALE: {
      executive_summary: `
## Résumé exécutif

${company?.name || 'Nous'} proposons une solution complète pour "${tender?.title || 'votre projet'}" qui vous permettra d'atteindre vos objectifs tout en optimisant vos ressources.

Notre approche combinant expertise métier et innovation technologique garantit des résultats mesurables et durables.
`,
      solution: `
## Notre solution

### Approche globale
Notre proposition s'articule autour de 3 piliers :
1. **Analyse** : Compréhension approfondie de vos enjeux
2. **Déploiement** : Mise en œuvre agile et maîtrisée
3. **Accompagnement** : Support continu et évolution

### Livrables
- Documentation complète
- Formation des équipes
- Support technique
`,
    },
  };
  
  return templates[documentType]?.[section] || `Contenu de la section "${section}" à personnaliser selon vos besoins.`;
}

// POST /api/ai/generate - Generate document content
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      tender_id,
      document_type,
      section,
      custom_prompt,
      provider = 'mock', // 'openai', 'anthropic', or 'mock'
    } = body;

    if (!document_type) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
    }

    // Get user's profile and company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    // Get tender if provided
    let tender = null;
    if (tender_id) {
      const { data } = await supabase
        .from('tenders')
        .select('*')
        .eq('id', tender_id)
        .eq('company_id', profile.company_id)
        .single();
      tender = data;
    }

    const context = { company, tender };
    
    // Get template
    const template = DOCUMENT_TEMPLATES[document_type as keyof typeof DOCUMENT_TEMPLATES];
    if (!template && !custom_prompt) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    let result: any;

    if (section) {
      // Generate single section
      const prompt = custom_prompt || template?.prompts[section as keyof typeof template.prompts];
      if (!prompt) {
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
      }

      let content: string;
      try {
        switch (provider) {
          case 'openai':
            content = await generateWithOpenAI(prompt, context);
            break;
          case 'anthropic':
            content = await generateWithAnthropic(prompt, context);
            break;
          default:
            content = generateMock(document_type, section, context);
        }
      } catch (error) {
        console.error('AI generation error:', error);
        // Fallback to mock
        content = generateMock(document_type, section, context);
      }

      result = {
        section,
        content,
        provider: provider === 'mock' ? 'template' : provider,
      };
    } else {
      // Generate full document
      const sections: Record<string, string> = {};
      
      for (const sectionKey of template?.sections || []) {
        const prompt = template?.prompts[sectionKey as keyof typeof template.prompts];
        if (prompt) {
          try {
            switch (provider) {
              case 'openai':
                sections[sectionKey] = await generateWithOpenAI(prompt, context);
                break;
              case 'anthropic':
                sections[sectionKey] = await generateWithAnthropic(prompt, context);
                break;
              default:
                sections[sectionKey] = generateMock(document_type, sectionKey, context);
            }
          } catch (error) {
            sections[sectionKey] = generateMock(document_type, sectionKey, context);
          }
        }
      }

      result = {
        document_type,
        sections,
        provider: provider === 'mock' ? 'template' : provider,
      };
    }

    // Log generation for analytics
    await supabase.from('ai_generations').insert({
      user_id: user.id,
      company_id: profile.company_id,
      tender_id,
      document_type,
      section,
      provider,
      created_at: new Date().toISOString(),
    }).catch(() => {}); // Ignore if table doesn't exist

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/ai/generate/templates - Get available templates
export async function GET() {
  const templates = Object.entries(DOCUMENT_TEMPLATES).map(([key, value]) => ({
    id: key,
    name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    sections: value.sections,
  }));

  return NextResponse.json({ templates });
}
