import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Ne pas échouer au build : on ne touche jamais à l'env tant que la route n'est pas appelée.
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAIClient();
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      topic,
      context,
      slideCount = 5,
      style = 'professional',
      includeImages = true,
      language = 'fr'
    } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    console.log('Generating presentation for:', topic);

    // 1. Générer le contenu de la présentation avec GPT-4
    const contentResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Vous êtes un expert en création de présentations professionnelles style Gamma.app. 
Créez une présentation structurée et engageante en ${language === 'fr' ? 'français' : 'anglais'}.
Format JSON avec: title, slides array (chaque slide a: slideNumber, title, content, bulletPoints, imagePrompt, speakerNotes).`
        },
        {
          role: 'user',
          content: `Créez une présentation de ${slideCount} slides sur: "${topic}".
${context ? `Contexte additionnel: ${context}` : ''}
Style: ${style}
${includeImages ? 'Incluez des suggestions de visuels pour chaque slide (imagePrompt).' : ''}

Retournez un JSON structuré avec le format suivant:
{
  "title": "Titre de la présentation",
  "description": "Description courte",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Titre du slide",
      "content": "Contenu principal",
      "bulletPoints": ["Point 1", "Point 2"],
      "imagePrompt": "Description pour génération d'image DALL-E",
      "speakerNotes": "Notes pour le présentateur"
    }
  ]
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const contentText = contentResponse.choices[0]?.message?.content;
    if (!contentText) {
      throw new Error('No content generated');
    }

    // Parser le JSON
    let presentation;
    try {
      // Extraire le JSON du contenu (au cas où GPT ajoute du texte avant/après)
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        presentation = JSON.parse(jsonMatch[0]);
      } else {
        presentation = JSON.parse(contentText);
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.log('Raw content:', contentText);
      throw new Error('Failed to parse presentation content');
    }

    // 2. Générer les images pour chaque slide (si demandé)
    if (includeImages) {
      const imagePromises = presentation.slides.map(async (slide: any, index: number) => {
        if (slide.imagePrompt) {
          try {
            const imageResponse = await openai.images.generate({
              model: 'dall-e-3',
              prompt: enhanceImagePrompt(slide.imagePrompt, style),
              n: 1,
              size: '1792x1024', // Format paysage pour présentation
              quality: 'hd',
              style: 'natural',
            });

            return {
              slideNumber: slide.slideNumber,
              imageUrl: imageResponse.data?.[0]?.url,
              revisedPrompt: imageResponse.data?.[0]?.revised_prompt,
            };
          } catch (imageError) {
            console.error(`Failed to generate image for slide ${index + 1}:`, imageError);
            return {
              slideNumber: slide.slideNumber,
              imageUrl: null,
              error: 'Image generation failed',
            };
          }
        }
        return null;
      });

      const images = await Promise.all(imagePromises);
      
      // Ajouter les URLs d'images aux slides
      presentation.slides = presentation.slides.map((slide: any) => {
        const imageData = images.find((img) => img?.slideNumber === slide.slideNumber);
        return {
          ...slide,
          imageUrl: imageData?.imageUrl || null,
          imageRevisedPrompt: imageData?.revisedPrompt || null,
        };
      });
    }

    // 3. Sauvegarder dans creative_contents
    const { data: savedPresentation, error: saveError } = await (supabase as any)
      .from('creative_contents')
      .insert({
        type: 'CASE_STUDY',
        title: presentation.title,
        content: JSON.stringify(presentation),
        status: 'DRAFT',
        created_by: user.id,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save presentation:', saveError);
    }

    return NextResponse.json({
      success: true,
      presentation,
      savedId: savedPresentation?.id,
      metadata: {
        slideCount: presentation.slides.length,
        generatedAt: new Date().toISOString(),
        style,
        includeImages,
      },
    });

  } catch (error: any) {
    console.error('Presentation generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate presentation',
      details: error.message,
    }, { status: 500 });
  }
}

function enhanceImagePrompt(prompt: string, style: string): string {
  const styleMap: Record<string, string> = {
    professional: 'Professional business photography, modern corporate style, clean composition',
    creative: 'Creative and artistic, vibrant colors, modern design',
    technical: 'Technical illustration, clean lines, professional diagram style',
    minimal: 'Minimal design, simple composition, modern aesthetic',
  };

  const enhancement = styleMap[style] || styleMap.professional;
  return `${prompt}. ${enhancement}. High-quality, suitable for business presentation, no text overlay, landscape format.`;
}
