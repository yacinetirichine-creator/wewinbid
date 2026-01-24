import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Schema de validation
const StreamRequestSchema = z.object({
  tender_id: z.string().uuid(),
  document_type: z.string(),
  section: z.string().optional(),
  context: z.object({
    tender_title: z.string(),
    tender_summary: z.string().optional(),
    buyer: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    company_name: z.string().optional(),
    company_sector: z.string().optional(),
    company_description: z.string().optional(),
  }).optional(),
  provider: z.enum(['openai', 'anthropic']).default('openai'),
});

/**
 * POST - Stream AI-generated content
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate request
    const body = await request.json();
    const { tender_id, document_type, section, context, provider } = StreamRequestSchema.parse(body);

    // Build the prompt
    const systemPrompt = buildSystemPrompt(document_type, section);
    const userPrompt = buildUserPrompt(document_type, section, context);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (provider === 'openai') {
            await streamOpenAI(systemPrompt, userPrompt, controller, encoder);
          } else {
            await streamAnthropic(systemPrompt, userPrompt, controller, encoder);
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Erreur de génération' })}\n\n`));
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    // Log analytics (non-blocking)
    void (async () => {
      try {
        await supabase.from('ai_generations').insert({
          user_id: user.id,
          tender_id,
          document_type,
          section: section || null,
          provider,
          status: 'streaming',
          created_at: new Date().toISOString(),
        });
      } catch {
        // Ignore analytics errors
      }
    })();

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in stream endpoint:', error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Données invalides', details: error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function streamOpenAI(
  systemPrompt: string,
  userPrompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: true,
    max_tokens: 4000,
    temperature: 0.7,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
    }
  }
}

async function streamAnthropic(
  systemPrompt: string,
  userPrompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const stream = await anthropic.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`));
    }
  }
}

function buildSystemPrompt(documentType: string, section?: string): string {
  const basePrompt = `Tu es un expert en rédaction de documents pour les appels d'offres publics et privés en France. Tu génères du contenu professionnel, structuré et adapté aux exigences des marchés publics.

Règles:
- Utilise un ton professionnel et technique
- Structure le contenu avec des titres en markdown (##, ###)
- Sois précis et concret
- Utilise des listes à puces pour les énumérations
- Inclus des sous-sections pertinentes`;

  if (section) {
    return `${basePrompt}\n\nTu dois générer uniquement la section "${section}" du document.`;
  }

  return basePrompt;
}

function buildUserPrompt(
  documentType: string,
  section: string | undefined,
  context?: {
    tender_title?: string;
    tender_summary?: string;
    buyer?: string;
    requirements?: string[];
    company_name?: string;
    company_sector?: string;
    company_description?: string;
  }
): string {
  let prompt = `Génère ${section ? `la section "${section}" d'` : ''}un ${getDocumentTypeName(documentType)}.`;

  if (context) {
    prompt += `\n\nContexte de l'appel d'offres:`;
    if (context.tender_title) prompt += `\n- Titre: ${context.tender_title}`;
    if (context.tender_summary) prompt += `\n- Résumé: ${context.tender_summary}`;
    if (context.buyer) prompt += `\n- Acheteur: ${context.buyer}`;
    if (context.requirements?.length) {
      prompt += `\n- Exigences: ${context.requirements.slice(0, 10).join(', ')}`;
    }

    if (context.company_name) {
      prompt += `\n\nEntreprise candidate:`;
      prompt += `\n- Nom: ${context.company_name}`;
      if (context.company_sector) prompt += `\n- Secteur: ${context.company_sector}`;
      if (context.company_description) prompt += `\n- Description: ${context.company_description}`;
    }
  }

  prompt += `\n\nRéponds de manière complète et professionnelle.`;

  return prompt;
}

function getDocumentTypeName(type: string): string {
  const names: Record<string, string> = {
    MEMOIRE_TECHNIQUE: 'Mémoire Technique',
    LETTRE_CANDIDATURE: 'Lettre de Candidature',
    NOTE_METHODOLOGIQUE: 'Note Méthodologique',
    DC1: 'Formulaire DC1',
    DC2: 'Formulaire DC2',
    PLANNING: 'Planning Prévisionnel',
    REFERENCES: 'Liste des Références',
    ORGANIGRAMME: 'Organigramme du Projet',
    CV_RESPONSABLE: 'CV du Responsable de Projet',
    CV_EQUIPE: 'CVs de l\'Équipe Proposée',
    MOYENS_HUMAINS: 'Tableau des Moyens Humains',
    ACTE_ENGAGEMENT: 'Acte d\'Engagement',
    PROPOSITION_COMMERCIALE: 'Proposition Commerciale',
  };
  return names[type] || type;
}
