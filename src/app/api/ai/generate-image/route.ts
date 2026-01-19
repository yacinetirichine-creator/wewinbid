import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { ImageGenerationSchema } from '@/lib/validation';
import { withErrorHandler, throwAuthError } from '@/lib/errors';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/ai/generate-image
 * 
 * Génère une image professionnelle avec DALL-E 3
 * 
 * @body {string} prompt - Description de l'image à générer (10-1000 caractères)
 * @body {string} style - Style visuel (professional, creative, technical, etc.)
 * @body {string} size - Format (1024x1024, 1792x1024, 1024x1792)
 * @body {string} quality - Qualité (standard, hd)
 * @body {string} context - Contexte additionnel (optionnel)
 * 
 * @returns {object} Image URL et métadonnées
 * 
 * @throws {401} Si l'utilisateur n'est pas authentifié
 * @throws {400} Si les données sont invalides
 * @throws {500} Si la génération échoue
 * 
 * @example
 * POST /api/ai/generate-image
 * {
 *   "prompt": "Une équipe professionnelle travaillant sur un projet",
  // Améliorer le prompt selon le style demandé
  const enhancedPrompt = enhancePrompt(
    validatedData.prompt,
    validatedData.style,
    validatedData.context || ''
  );

  console.log('Generating image with DALL-E 3:', enhancedPrompt);

  // Générer l'image avec DALL-E 3
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: enhancedPrompt,
    n: 1,
    size: validatedData.size,
    quality: validatedData.quality,
    style: 'natural',
  });
  // Valider les données d'entrée
  const body = await request.json();
  const validatedData = ImageGenerationSchema.parse(body);

    // Améliorer le prompt selon le style demandé
    const enhancedPrompt = enhancePrompt(prompt, style, context);

    console.log('Generating image with DALL-E 3:', enhancedPrompt);

    // Générer l'image avec DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
  const imageUrl = response.data[0]?.url;
  const revisedPrompt = response.data[0]?.revised_prompt;

  if (!imageUrl) {
    throw new Error('No image generated');
  }

  // TODO: Sauvegarder l'image dans Supabase Storage pour persistance
  
  return NextResponse.json({
    success: true,
    imageUrl,
    revisedPrompt,
    originalPrompt: validatedData.prompt,
    metadata: {
      style: validatedData.style,
      size: validatedData.size,
      quality: validatedData.quality,
      generatedAt: new Date().toISOString(),
      userId: user.id,
    },
  });
}

export const POST = withErrorHandler(generateImageHandler as any);     error: 'Failed to generate image',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * Améliore le prompt selon le style demandé
 * 
 * @param prompt - Prompt de base de l'utilisateur
 * @param style - Style visuel souhaité
 * @param context - Contexte additionnel
 * @returns Prompt amélioré pour DALL-E
 */
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
