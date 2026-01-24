import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { ImageGenerationSchema } from '@/lib/validation';
import { AppError, ErrorCode, withErrorHandler, throwAuthError } from '@/lib/errors';

// Types for different providers
type ImageProvider = 'dalle3' | 'flux' | 'stability';

interface GenerationResult {
  imageUrl: string;
  revisedPrompt?: string;
  provider: ImageProvider;
}

// Provider configurations
const PROVIDER_PRIORITY: ImageProvider[] = ['flux', 'dalle3', 'stability'];

// DALL-E 3 (OpenAI)
async function generateWithDallE(
  prompt: string,
  size: string,
  quality: 'standard' | 'hd'
): Promise<GenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const openai = new OpenAI({ apiKey });
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: size as '1024x1024' | '1792x1024' | '1024x1792',
    quality,
    style: 'natural',
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) throw new Error('No image generated');

  return {
    imageUrl,
    revisedPrompt: response.data?.[0]?.revised_prompt,
    provider: 'dalle3',
  };
}

// Flux (via Replicate or Together AI)
async function generateWithFlux(
  prompt: string,
  size: string,
  quality: 'standard' | 'hd'
): Promise<GenerationResult> {
  // Try Together AI first (faster and more reliable)
  const togetherApiKey = process.env.TOGETHER_API_KEY;
  if (togetherApiKey) {
    return generateWithFluxTogether(prompt, size, quality);
  }

  // Fallback to Replicate
  const replicateApiKey = process.env.REPLICATE_API_TOKEN;
  if (replicateApiKey) {
    return generateWithFluxReplicate(prompt, size, quality);
  }

  throw new Error('No Flux provider configured (TOGETHER_API_KEY or REPLICATE_API_TOKEN)');
}

// Flux via Together AI
async function generateWithFluxTogether(
  prompt: string,
  size: string,
  quality: 'standard' | 'hd'
): Promise<GenerationResult> {
  const apiKey = process.env.TOGETHER_API_KEY;

  // Map sizes
  const sizeMap: Record<string, { width: number; height: number }> = {
    '1024x1024': { width: 1024, height: 1024 },
    '1792x1024': { width: 1792, height: 1024 },
    '1024x1792': { width: 1024, height: 1792 },
  };
  const { width, height } = sizeMap[size] || sizeMap['1024x1024'];

  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: quality === 'hd' ? 'black-forest-labs/FLUX.1.1-pro' : 'black-forest-labs/FLUX.1-schnell',
      prompt,
      width,
      height,
      steps: quality === 'hd' ? 28 : 4,
      n: 1,
      response_format: 'url',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Flux generation failed');
  }

  const data = await response.json();
  const imageUrl = data.data?.[0]?.url;
  if (!imageUrl) throw new Error('No image generated');

  return {
    imageUrl,
    provider: 'flux',
  };
}

// Flux via Replicate
async function generateWithFluxReplicate(
  prompt: string,
  size: string,
  quality: 'standard' | 'hd'
): Promise<GenerationResult> {
  const apiKey = process.env.REPLICATE_API_TOKEN;

  // Map sizes for aspect ratio
  const aspectMap: Record<string, string> = {
    '1024x1024': '1:1',
    '1792x1024': '16:9',
    '1024x1792': '9:16',
  };
  const aspectRatio = aspectMap[size] || '1:1';

  // Use flux-1.1-pro for HD, flux-schnell for standard
  const model = quality === 'hd'
    ? 'black-forest-labs/flux-1.1-pro'
    : 'black-forest-labs/flux-schnell';

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({
      version: quality === 'hd'
        ? 'a22046c9df7e2e0b35fca2e8e8e0d18ea8f9b2c7e0a6c2d0d7d3a6a0c0c0c0c0'
        : 'bff6dd9bd5ef3e0d7b1b3f9b0c5c6c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c',
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        output_format: 'png',
        output_quality: quality === 'hd' ? 95 : 80,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Replicate Flux generation failed');
  }

  const data = await response.json();

  // If prediction is completed, get the output
  let imageUrl: string;
  if (data.status === 'succeeded' && data.output) {
    imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
  } else if (data.status === 'processing' || data.status === 'starting') {
    // Poll for completion
    const predictionId = data.id;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const pollData = await pollResponse.json();

      if (pollData.status === 'succeeded') {
        imageUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
        break;
      } else if (pollData.status === 'failed') {
        throw new Error(pollData.error || 'Generation failed');
      }
      attempts++;
    }

    if (!imageUrl!) throw new Error('Generation timeout');
  } else {
    throw new Error('Unexpected response from Replicate');
  }

  return {
    imageUrl,
    provider: 'flux',
  };
}

// Stability AI (Stable Diffusion 3)
async function generateWithStability(
  prompt: string,
  size: string,
  quality: 'standard' | 'hd'
): Promise<GenerationResult> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error('STABILITY_API_KEY not configured');

  // Map sizes for aspect ratio
  const aspectMap: Record<string, string> = {
    '1024x1024': '1:1',
    '1792x1024': '16:9',
    '1024x1792': '9:16',
  };
  const aspectRatio = aspectMap[size] || '1:1';

  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
    body: (() => {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('aspect_ratio', aspectRatio);
      formData.append('model', quality === 'hd' ? 'sd3-large-turbo' : 'sd3-medium');
      formData.append('output_format', 'png');
      return formData;
    })(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Stability AI generation failed');
  }

  const data = await response.json();
  const base64Image = data.image;

  // Convert base64 to URL (you might want to upload to storage instead)
  const imageUrl = `data:image/png;base64,${base64Image}`;

  return {
    imageUrl,
    provider: 'stability',
  };
}

// Enhanced prompt for professional business images
function enhancePrompt(prompt: string, style: string, context: string): string {
  const styleEnhancements: Record<string, string> = {
    professional: 'Professional corporate photography, clean modern aesthetic, high-end business environment, well-lit, sharp focus, premium quality',
    creative: 'Creative and artistic design, vibrant dynamic colors, innovative modern concept, inspiring visual composition',
    technical: 'Technical precision diagram, clean professional infographic, detailed technical illustration, precise engineering aesthetic',
    social: 'Eye-catching social media visual, modern engaging design, professional photography, scroll-stopping composition',
    presentation: 'Professional presentation slide visual, clean corporate design, modern gradient background, business appropriate',
    linkedin: 'LinkedIn professional post visual, corporate business aesthetic, engaging professional imagery, premium quality',
    illustration: 'Modern minimalist vector illustration, clean design aesthetic, professional style, limited color palette',
    photo: 'Professional high-end photography, well-composed shot, natural lighting, crystal clear focus, editorial quality',
  };

  const enhancement = styleEnhancements[style] || styleEnhancements.professional;

  let enhancedPrompt = `${prompt}. Style: ${enhancement}.`;

  if (context) {
    enhancedPrompt += ` Context: ${context}.`;
  }

  // Add negative prompt elements
  enhancedPrompt += ' No text overlays, no watermarks, clean composition, suitable for professional business use, high resolution, photorealistic when appropriate.';

  return enhancedPrompt;
}

// Main handler
async function generateImageHandler(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throwAuthError();
  }

  const body = await request.json();
  const validatedData = ImageGenerationSchema.parse(body);

  // Determine which provider to use
  let preferredProvider: ImageProvider | null = null;

  // Check available providers in priority order
  if (process.env.TOGETHER_API_KEY || process.env.REPLICATE_API_TOKEN) {
    preferredProvider = 'flux';
  } else if (process.env.OPENAI_API_KEY) {
    preferredProvider = 'dalle3';
  } else if (process.env.STABILITY_API_KEY) {
    preferredProvider = 'stability';
  }

  if (!preferredProvider) {
    throw new AppError(
      ErrorCode.EXTERNAL_API_ERROR,
      'Aucun service IA configuré. Configurez TOGETHER_API_KEY, OPENAI_API_KEY ou STABILITY_API_KEY.',
      500
    );
  }

  const enhancedPrompt = enhancePrompt(
    validatedData.prompt,
    validatedData.style,
    validatedData.context || ''
  );

  let result: GenerationResult;

  // Try providers in order of preference with fallbacks
  const providers = [preferredProvider, ...PROVIDER_PRIORITY.filter(p => p !== preferredProvider)];

  for (const provider of providers) {
    try {
      switch (provider) {
        case 'flux':
          result = await generateWithFlux(enhancedPrompt, validatedData.size, validatedData.quality);
          break;
        case 'dalle3':
          result = await generateWithDallE(enhancedPrompt, validatedData.size, validatedData.quality);
          break;
        case 'stability':
          result = await generateWithStability(enhancedPrompt, validatedData.size, validatedData.quality);
          break;
        default:
          continue;
      }

      // Success! Return the result
      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl,
        revisedPrompt: result.revisedPrompt,
        originalPrompt: validatedData.prompt,
        provider: result.provider,
        metadata: {
          style: validatedData.style,
          size: validatedData.size,
          quality: validatedData.quality,
          generatedAt: new Date().toISOString(),
          userId: user.id,
        },
      });
    } catch (error) {
      console.error(`Provider ${provider} failed:`, error);
      // Try next provider
      continue;
    }
  }

  // All providers failed
  throw new AppError(
    ErrorCode.EXTERNAL_API_ERROR,
    'Tous les services de génération ont échoué. Veuillez réessayer.',
    500
  );
}

export const POST = withErrorHandler(generateImageHandler as any);
