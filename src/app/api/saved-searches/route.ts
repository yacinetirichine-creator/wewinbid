import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================
// SCHEMAS
// ============================================================

const CreateSearchSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional(),
  filters: z.object({
    query: z.string().optional(),
    sectors: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
    min_value: z.number().optional(),
    max_value: z.number().optional(),
    deadline_from: z.string().optional(), // ISO date
    deadline_to: z.string().optional(), // ISO date
    tender_type: z.string().optional(),
    status: z.array(z.string()).optional(),
  }),
  notification_enabled: z.boolean().default(false),
});

const UpdateSearchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional(),
  filters: z.object({
    query: z.string().optional(),
    sectors: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
    min_value: z.number().optional(),
    max_value: z.number().optional(),
    deadline_from: z.string().optional(),
    deadline_to: z.string().optional(),
    tender_type: z.string().optional(),
    status: z.array(z.string()).optional(),
  }).optional(),
  notification_enabled: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

// ============================================================
// GET - List saved searches
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Query parameters
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get('active_only') === 'true';

    // Get saved searches
    let query = supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: searches, error: searchesError } = await query;

    if (searchesError) {
      console.error('Error fetching saved searches:', searchesError);
      return NextResponse.json(
        { error: 'Failed to fetch saved searches' },
        { status: 500 }
      );
    }

    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Saved searches GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create saved search
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = CreateSearchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, description, filters, notification_enabled } = validation.data;

    // Create saved search
    const { data: search, error: createError } = await (supabase as any)
      .from('saved_searches')
      .insert({
        user_id: user.id,
        company_id: profile.company_id,
        name,
        description,
        filters,
        notification_enabled,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating saved search:', createError);
      return NextResponse.json(
        { error: 'Failed to create saved search' },
        { status: 500 }
      );
    }

    return NextResponse.json({ search }, { status: 201 });
  } catch (error) {
    console.error('Saved search POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Update saved search
// ============================================================

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await req.json();
    const validation = UpdateSearchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { id, ...updates } = validation.data;

    // Check if user owns this search
    const { data: existing, error: checkError } = await (supabase as any)
      .from('saved_searches')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Saved search not found or access denied' },
        { status: 404 }
      );
    }

    // Update search
    const { data: search, error: updateError } = await (supabase as any)
      .from('saved_searches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating saved search:', updateError);
      return NextResponse.json(
        { error: 'Failed to update saved search' },
        { status: 500 }
      );
    }

    return NextResponse.json({ search });
  } catch (error) {
    console.error('Saved search PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Remove saved search
// ============================================================

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search ID from query params
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      );
    }

    // Delete search (RLS will ensure user owns it)
    const { error: deleteError } = await (supabase as any)
      .from('saved_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting saved search:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete saved search' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Saved search DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
