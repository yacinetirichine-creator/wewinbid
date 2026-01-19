import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/chat/suggestions - Get contextual suggestions for chat
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const tenderId = searchParams.get('tender_id');

    const suggestions: Array<{ text: string; icon: string; category: string }> = [];

    // General suggestions
    const generalSuggestions = [
      { text: 'How do I respond to this tender?', icon: '💡', category: 'general' },
      { text: 'What are the key requirements?', icon: '📋', category: 'requirements' },
      { text: 'Analyze the evaluation criteria', icon: '🎯', category: 'analysis' },
      { text: 'What documents do I need?', icon: '📄', category: 'documents' },
      { text: 'Suggest a timeline', icon: '📅', category: 'planning' },
    ];

    if (!sessionId && !tenderId) {
      suggestions.push(...generalSuggestions);
    } else if (tenderId) {
      // Get tender-specific suggestions
      const { data: tender } = await (supabase as any)
        .from('tenders')
        .select('title, deadline, status')
        .eq('id', tenderId)
        .single();

      if (tender) {
        suggestions.push(
          { text: `Analyze "${tender.title.substring(0, 30)}..."`, icon: '🔍', category: 'analysis' },
          { text: 'What are my chances of winning?', icon: '🏆', category: 'strategy' },
          { text: 'Calculate time remaining', icon: '⏰', category: 'deadline' },
          { text: 'Identify potential risks', icon: '⚠️', category: 'risk' },
          { text: 'Suggest similar past tenders', icon: '🔄', category: 'reference' }
        );

        if (tender.deadline) {
          const daysRemaining = Math.ceil(
            (new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysRemaining < 7) {
            suggestions.unshift({
              text: `Urgent: Only ${daysRemaining} days left!`,
              icon: '🚨',
              category: 'urgent',
            });
          }
        }
      }
    } else if (sessionId) {
      // Get context-based suggestions from previous conversation
      const { data: recentMessages } = await (supabase as any)
        .from('chat_messages')
        .select('content, role')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentMessages && recentMessages.length > 0) {
        const lastUserMessage = recentMessages.find((m: any) => m.role === 'user');
        
        if (lastUserMessage) {
          const content = lastUserMessage.content.toLowerCase();
          
          if (content.includes('deadline') || content.includes('time')) {
            suggestions.push(
              { text: 'Create a submission timeline', icon: '📅', category: 'planning' },
              { text: 'Set up deadline reminders', icon: '🔔', category: 'reminders' }
            );
          }
          
          if (content.includes('requirement') || content.includes('criteria')) {
            suggestions.push(
              { text: 'Checklist of all requirements', icon: '✅', category: 'requirements' },
              { text: 'Compare with our capabilities', icon: '🔄', category: 'comparison' }
            );
          }
          
          if (content.includes('document') || content.includes('file')) {
            suggestions.push(
              { text: 'List required documents', icon: '📎', category: 'documents' },
              { text: 'Document preparation tips', icon: '📝', category: 'guidance' }
            );
          }
          
          if (content.includes('budget') || content.includes('cost')) {
            suggestions.push(
              { text: 'Budget breakdown guidance', icon: '💰', category: 'budget' },
              { text: 'Cost optimization strategies', icon: '📊', category: 'optimization' }
            );
          }
        }

        if (suggestions.length < 3) {
          suggestions.push(...generalSuggestions.slice(0, 3));
        }
      } else {
        suggestions.push(...generalSuggestions);
      }
    }

    // Limit to 5 suggestions
    const limitedSuggestions = suggestions.slice(0, 5);

    return NextResponse.json({ suggestions: limitedSuggestions });

  } catch (error: any) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
