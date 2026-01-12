import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      prompt, 
      style = 'professional',
      size = '1024x1024',
      quality = 'hd',
      context = '' 
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Améliorer le prompt selon le style demandé
    const enhancedPrompt = enhancePrompt(prompt, style, context);

    console.log('Generating image with DALL-E 3:', enhancedPrompt);

    // Générer l'image avec DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: quality as 'standard' | 'hd',
      style: 'natural', // ou 'vivid' pour plus de couleurs
    });

    const imageUrl = response.data[0]?.url;
    const revisedPrompt = response.data[0]?.revised_prompt;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    // Optionnel: Sauvegarder l'image dans Supabase Storage
    // Pour l'instant on retourne juste l'URL temporaire d'OpenAI (24h)
    
    return NextResponse.json({
      success: true,
      imageUrl,
      revisedPrompt,
      originalPrompt: prompt,
      metadata: {
        style,
        size,
        quality,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    
    // Gestion des erreurs OpenAI spécifiques
    if (error?.error?.code === 'content_policy_violation') {
      return NextResponse.json({
        error: 'Le contenu demandé viole les règles de contenu. Veuillez reformuler.',
      }, { status: 400 });
    }

    if (error?.error?.code === 'billing_hard_limit_reached') {
      return NextResponse.json({
        error: 'Limite de crédit OpenAI atteinte. Veuillez vérifier votre facturation.',
      }, { status: 402 });
    }

    return NextResponse.json({
      error: 'Failed to generate image',
      details: error.message,
    }, { status: 500 });
  }
}

// Fonction pour améliorer le prompt selon le style
function enhancePrompt(prompt: string, style: string, context: string): string {
  const styleEnhancements: Record<string, string> = {
    professional: 'Professional, clean, modern, corporate style, high-quality business photography, minimal background, well-lit',
    creative: 'Creative, artistic, vibrant colors, modern design, inspiring, innovative concept',
    technical: 'Technical diagram, clean lines, professional infographic style, detailed illustration, technical precision',
    social: 'Eye-catching social media post, modern design, professional photography, engaging visual',
    presentation: 'Professional presentation slide background, clean design, corporate colors, modern gradient',
    linkedin: 'LinkedIn post visual, professional business content, modern corporate design, engaging professional imagery',
    illustration: 'Modern vector illustration, clean design, professional style, minimal color palette',
    photo: 'Professional photography, high-quality, well-composed, natural lighting, sharp focus',
  };

  const enhancement = styleEnhancements[style] || styleEnhancements.professional;
  
  let enhancedPrompt = `${prompt}. ${enhancement}.`;
  
  if (context) {
    enhancedPrompt += ` Context: ${context}.`;
  }

  // Ajouter des contraintes pour assurer la qualité professionnelle
  enhancedPrompt += ' No text overlay, no watermarks, clean composition, suitable for business use.';

  return enhancedPrompt;
}
