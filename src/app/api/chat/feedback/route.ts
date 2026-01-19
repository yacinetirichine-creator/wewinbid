import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/chat/feedback - Rate a message
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message_id, rating, feedback, is_helpful } = body;

    if (!message_id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Verify message belongs to user's session
    const { data: message, error: messageError } = await (supabase as any)
      .from('chat_messages')
      .select(`
        id,
        chat_sessions!inner(user_id)
      `)
      .eq('id', message_id)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Update message with feedback
    const updates: any = {};
    if (rating !== undefined) updates.user_rating = rating;
    if (feedback !== undefined) updates.user_feedback = feedback;
    if (is_helpful !== undefined) updates.is_helpful = is_helpful;

    const { data, error } = await (supabase as any)
      .from('chat_messages')
      .update(updates)
      .eq('id', message_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating feedback:', error);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data });

  } catch (error: any) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
