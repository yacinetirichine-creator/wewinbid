import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/chat - Send a message and get AI response
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { session_id, message, context_ids = [], model = 'gpt-4' } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let sessionId = session_id;

    // Create new session if none provided
    if (!sessionId) {
      const { data: newSession, error: sessionError } = await (supabase as any)
        .from('chat_sessions')
        .insert({
          user_id: session.user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          ai_model: model,
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }

      sessionId = newSession.id;
    }

    // Verify session belongs to user
    const { data: sessionData, error: sessionCheckError } = await (supabase as any)
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', session.user.id)
      .single();

    if (sessionCheckError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get previous messages for context
    const { data: previousMessages } = await (supabase as any)
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Save user message
    const startTime = Date.now();
    const { data: userMessage, error: userMessageError } = await (supabase as any)
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message,
      })
      .select()
      .single();

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are an expert tender assistant helping users analyze and respond to tenders. 
You provide clear, actionable advice on tender requirements, deadlines, and submission strategies.
Be concise, professional, and helpful. If you're not sure about something, say so.`,
      },
      ...(previousMessages || []).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: model as 'gpt-4' | 'gpt-3.5-turbo',
      messages,
      temperature: sessionData.temperature || 0.7,
      max_tokens: 1000,
    });

    const responseTime = Date.now() - startTime;
    const aiResponse = completion.choices[0].message.content || '';

    // Save AI response
    const { data: assistantMessage, error: assistantMessageError } = await (supabase as any)
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
        model_used: model,
        tokens_used: completion.usage?.total_tokens || 0,
        response_time_ms: responseTime,
      })
      .select()
      .single();

    if (assistantMessageError) {
      console.error('Error saving assistant message:', assistantMessageError);
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
    }

    return NextResponse.json({
      session_id: sessionId,
      user_message: userMessage,
      assistant_message: assistantMessage,
      tokens_used: completion.usage?.total_tokens || 0,
      response_time_ms: responseTime,
    });

  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/chat - Get user's chat sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data, error } = await (supabase as any)
      .rpc('get_user_chat_sessions', {
        user_id_param: session.user.id,
        limit_param: limit,
      });

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions: data });

  } catch (error: any) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
