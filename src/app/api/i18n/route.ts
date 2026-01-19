import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'fr';
    const keysParam = searchParams.get('keys');

    if (!keysParam) {
      return NextResponse.json({ error: 'keys are required' }, { status: 400 });
    }

    const keys = keysParam.split(',').map((k) => k.trim()).filter(Boolean);

    const { data, error } = await (supabase as any)
      .from('ui_translations')
      .select('translation_key, translated_text, source_text')
      .eq('locale', locale)
      .in('translation_key', keys);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch translations' }, { status: 500 });
    }

    const translations: Record<string, string> = {};
    const foundKeys = new Set<string>();

    data?.forEach((row: any) => {
      translations[row.translation_key] = row.translated_text;
      foundKeys.add(row.translation_key);
    });

    const missing = keys.filter((k) => !foundKeys.has(k));

    return NextResponse.json({ translations, missing });
  } catch (error) {
    console.error('GET /api/i18n error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { locale = 'fr', entries } = body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'entries are required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const prompt = `Tu es un traducteur UI professionnel.
Traduis chaque "source" vers la langue cible en respectant le ton SaaS B2B.
Si locale = ar-MA, utilise la darija marocaine naturelle.
Réponds en JSON strict: {"key":"translation"}.

Locale cible: ${locale}

Entrées: ${JSON.stringify(entries)}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You translate UI strings into the target locale.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return NextResponse.json({ error: 'AI translation failed', details: errorText }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const jsonText = aiData?.choices?.[0]?.message?.content || '{}';
    const translatedMap = JSON.parse(jsonText);

    const upserts = entries.map((entry: { key: string; source: string; context?: string }) => ({
      translation_key: entry.key,
      locale,
      source_text: entry.source,
      translated_text: translatedMap[entry.key] || entry.source,
      status: 'AI',
      context: entry.context || null,
      created_by: user?.id || null,
      updated_by: user?.id || null,
    }));

    const { data, error } = await (supabase as any)
      .from('ui_translations')
      .upsert(upserts, { onConflict: 'translation_key,locale' })
      .select('translation_key, translated_text');

    if (error) {
      return NextResponse.json({ error: 'Failed to save translations' }, { status: 500 });
    }

    const translations: Record<string, string> = {};
    data?.forEach((row: any) => {
      translations[row.translation_key] = row.translated_text;
    });

    return NextResponse.json({ translations });
  } catch (error) {
    console.error('POST /api/i18n error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { locale, key, translated_text, status = 'HUMAN' } = body;

    if (!locale || !key || !translated_text) {
      return NextResponse.json({ error: 'locale, key and translated_text are required' }, { status: 400 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await (supabase as any)
      .from('ui_translations')
      .update({
        translated_text,
        status,
        updated_by: user?.id || null,
      })
      .eq('translation_key', key)
      .eq('locale', locale)
      .select('translation_key, translated_text')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update translation' }, { status: 500 });
    }

    return NextResponse.json({ translation: data });
  } catch (error) {
    console.error('PATCH /api/i18n error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
