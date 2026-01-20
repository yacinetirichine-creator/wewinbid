import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { ImageGenerationSchema } from '@/lib/validation';
import { AppError, ErrorCode, withErrorHandler, throwAuthError } from '@/lib/errors';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Important: ne jamais exiger la clé au chargement du module (sinon `next build` échoue).
    throw new AppError(ErrorCode.EXTERNAL_API_ERROR, 'Service IA non configuré (OPENAI_API_KEY manquante)', 500);
  }
  return new OpenAI({ apiKey });
}

async function generateImageHandler(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throwAuthError();
  }

  const body = await request.json();
  const validatedData = ImageGenerationSchema.parse(body);

  const enhancedPrompt = enhancePrompt(
    validatedData.prompt,
    validatedData.style,
    validatedData.context || ''
  );

  const openai = getOpenAIClient();
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: enhancedPrompt,
    n: 1,
    size: validatedData.size,
    quality: validatedData.quality,
    style: 'natural',
  });

  const imageUrl = response.data?.[0]?.url;
  const revisedPrompt = response.data?.[0]?.revised_prompt;

  if (!imageUrl) {
    throw new Error('No image generated');
  }

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

export const POST = withErrorHandler(generateImageHandler as any);

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

  enhancedPrompt += ' No text overlay, no watermarks, clean composition, suitable for business use.';
  return enhancedPrompt;
}
