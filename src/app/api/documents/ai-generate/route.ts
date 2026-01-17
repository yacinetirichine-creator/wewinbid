import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// POST - Generate AI content for document
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Not a team member' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { 
      generation_type,
      prompt,
      tender_id,
        context,
        language = 'fr'
    } = body;

    if (!generation_type || !prompt) {
      return NextResponse.json(
        { error: 'generation_type and prompt are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const languageNames: Record<string, string> = {
      fr: 'Français',
      en: 'English',
      de: 'Deutsch',
      es: 'Español',
      it: 'Italiano',
      pt: 'Português',
      nl: 'Nederlands',
      'ar-MA': 'Darija marocaine (الدارجة المغربية)',
    };

    const targetLanguage = languageNames[language] || language;

    const docTypeInstructions: Record<string, string> = {
      proposal: 'Proposition technique et financière structurée pour un appel d’offres.',
      cover_letter: 'Lettre de candidature formelle et concise.',
      technical_response: 'Réponse technique détaillée, structurée par sections.',
      cv: 'Présentation/CV professionnel de l’entreprise.',
      other: 'Document professionnel conforme au besoin.',
    };

    const baseInstruction = docTypeInstructions[generation_type] || docTypeInstructions.other;

    const systemPrompt = `Tu es un expert en rédaction de dossiers d'appels d'offres.
Rédige un document professionnel, clair et structuré.
Réponds en ${targetLanguage}.
Si la langue est Darija marocaine, utilise la darija naturelle (pas d’arabe classique).
Respecte le ton formel/professionnel et les conventions locales.`;

    const userPrompt = `Type de document: ${generation_type}
Instruction: ${baseInstruction}
Contexte: ${JSON.stringify(context || {})}
Demande utilisateur: ${prompt}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return NextResponse.json(
        { error: 'AI generation failed', details: errorText },
        { status: 500 }
      );
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData?.choices?.[0]?.message?.content?.trim() || '';

    return NextResponse.json({
      content: generatedContent,
      model: 'gpt-4o-mini',
      language,
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
