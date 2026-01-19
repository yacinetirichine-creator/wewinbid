import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/chat/analyze - Analyze a tender with AI
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tender_id, session_id, analysis_type = 'full' } = body;

    if (!tender_id) {
      return NextResponse.json({ error: 'Tender ID is required' }, { status: 400 });
    }

    // Get tender data
    const { data: tender, error: tenderError } = await (supabase as any)
      .from('tenders')
      .select('*')
      .eq('id', tender_id)
      .single();

    if (tenderError) {
      console.error('Error fetching tender:', tenderError);
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
    }

    // Prepare analysis prompt based on type
    const analysisPrompts: Record<string, string> = {
      full: `Provide a comprehensive analysis of this tender including:
1. Key requirements and deliverables
2. Submission deadline and timeline
3. Evaluation criteria
4. Risk assessment
5. Recommended approach`,
      
      quick: `Provide a quick summary of this tender:
1. Main objective
2. Deadline
3. Critical requirements
4. Estimated complexity (Low/Medium/High)`,
      
      requirements: `Extract and list all key requirements from this tender:
1. Technical requirements
2. Documentation needed
3. Qualification criteria
4. Compliance requirements`,
      
      risks: `Identify potential risks and challenges:
1. Technical risks
2. Timeline risks
3. Resource requirements
4. Competitive analysis`,
    };

    const systemPrompt = `You are an expert tender analyst. Analyze the following tender and ${analysisPrompts[analysis_type] || analysisPrompts.full}

Tender Details:
Title: ${tender.title}
Organization: ${tender.organization || 'N/A'}
Deadline: ${tender.deadline || 'N/A'}
Budget: ${tender.budget || 'N/A'}
Description: ${tender.description || 'N/A'}
Requirements: ${tender.requirements || 'N/A'}

Provide a clear, structured analysis in markdown format.`;

    // Call OpenAI for analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert tender analyst providing detailed, actionable insights.',
        },
        {
          role: 'user',
          content: systemPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const analysis = completion.choices[0].message.content || '';

    // Extract key points from analysis
    const keyPoints = analysis
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))
      .slice(0, 10)
      .map(point => point.replace(/^[-•\d.]+\s*/, '').trim());

    // Save analysis context
    const { data: context, error: contextError } = await (supabase as any)
      .from('chat_context')
      .insert({
        session_id: session_id || null,
        context_type: 'tender_summary',
        tender_id: tender_id,
        title: `Analysis: ${tender.title}`,
        content_summary: analysis.substring(0, 500),
        key_points: keyPoints,
        analysis_result: {
          full_analysis: analysis,
          analysis_type: analysis_type,
          model_used: 'gpt-4',
          tokens_used: completion.usage?.total_tokens || 0,
        },
        relevance_score: 1.0,
      })
      .select()
      .single();

    if (contextError) {
      console.error('Error saving context:', contextError);
    }

    return NextResponse.json({
      analysis,
      key_points: keyPoints,
      context_id: context?.id,
      tokens_used: completion.usage?.total_tokens || 0,
      tender: {
        id: tender.id,
        title: tender.title,
        deadline: tender.deadline,
      },
    });

  } catch (error: any) {
    console.error('Error analyzing tender:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
