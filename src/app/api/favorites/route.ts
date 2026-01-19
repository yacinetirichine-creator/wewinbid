import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================
// SCHEMAS
// ============================================================

const AddFavoriteSchema = z.object({
  tender_id: z.string().uuid(),
  folder: z.string().max(100).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  reminder_date: z.string().optional(), // ISO date
  priority: z.number().min(0).max(2).default(0), // 0=normal, 1=high, 2=urgent
});

const UpdateFavoriteSchema = z.object({
  id: z.string().uuid(),
  folder: z.string().max(100).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  reminder_date: z.string().nullable().optional(),
  priority: z.number().min(0).max(2).optional(),
});

// ============================================================
// GET - List favorites
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

    // Query parameters
    const url = new URL(req.url);
    const folder = url.searchParams.get('folder');
    const priority = url.searchParams.get('priority');
    const tag = url.searchParams.get('tag');

    // Get favorites with tender details
    let query = supabase
      .from('tender_favorites')
      .select(`
        *,
        tender:tenders(
          id,
          title,
          description,
          sector,
          country,
          estimated_value,
          currency,
          deadline,
          type,
          buyer_name,
          status,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (folder) {
      query = query.eq('folder', folder);
    }
    if (priority) {
      query = query.eq('priority', parseInt(priority));
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data: favorites, error: favoritesError } = await query;

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError);
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    // Get unique folders for filter
    const { data: foldersData } = await (supabase as any)
      .from('tender_favorites')
      .select('folder')
      .eq('user_id', user.id)
      .not('folder', 'is', null);

    const folders = [...new Set(foldersData?.map((f: any) => f.folder) || [])];

    return NextResponse.json({ favorites, folders });
  } catch (error) {
    console.error('Favorites GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Add to favorites
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

    // Validate request body
    const body = await req.json();
    const validation = AddFavoriteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { tender_id, folder, notes, tags, reminder_date, priority } =
      validation.data;

    // Check if tender exists
    const { data: tender, error: tenderError } = await (supabase as any)
      .from('tenders')
      .select('id')
      .eq('id', tender_id)
      .single();

    if (tenderError || !tender) {
      return NextResponse.json(
        { error: 'Tender not found' },
        { status: 404 }
      );
    }

    // Check if already favorited
    const { data: existing } = await (supabase as any)
      .from('tender_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('tender_id', tender_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Tender already in favorites' },
        { status: 409 }
      );
    }

    // Add to favorites
    const { data: favorite, error: createError } = await (supabase as any)
      .from('tender_favorites')
      .insert({
        user_id: user.id,
        tender_id,
        folder,
        notes,
        tags,
        reminder_date,
        priority,
      })
      .select(`
        *,
        tender:tenders(
          id,
          title,
          description,
          sector,
          country,
          estimated_value,
          currency,
          deadline,
          type,
          buyer_name,
          status
        )
      `)
      .single();

    if (createError) {
      console.error('Error adding to favorites:', createError);
      return NextResponse.json(
        { error: 'Failed to add to favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error('Favorites POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Update favorite
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
    const validation = UpdateFavoriteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { id, ...updates } = validation.data;

    // Check if user owns this favorite
    const { data: existing, error: checkError } = await (supabase as any)
      .from('tender_favorites')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Favorite not found or access denied' },
        { status: 404 }
      );
    }

    // Update favorite
    const { data: favorite, error: updateError } = await (supabase as any)
      .from('tender_favorites')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        tender:tenders(
          id,
          title,
          description,
          sector,
          country,
          estimated_value,
          currency,
          deadline,
          type,
          buyer_name,
          status
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating favorite:', updateError);
      return NextResponse.json(
        { error: 'Failed to update favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({ favorite });
  } catch (error) {
    console.error('Favorites PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Remove from favorites
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

    // Get tender_id from query params
    const url = new URL(req.url);
    const tender_id = url.searchParams.get('tender_id');

    if (!tender_id) {
      return NextResponse.json(
        { error: 'Tender ID is required' },
        { status: 400 }
      );
    }

    // Delete favorite (RLS will ensure user owns it)
    const { error: deleteError } = await (supabase as any)
      .from('tender_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('tender_id', tender_id);

    if (deleteError) {
      console.error('Error removing from favorites:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove from favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Favorites DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
