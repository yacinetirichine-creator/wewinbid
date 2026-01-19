import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================
// SCHEMAS
// ============================================================

const CreateAlertSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional(),
  criteria: z.object({
    query: z.string().optional(),
    sectors: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
    min_value: z.number().optional(),
    max_value: z.number().optional(),
    deadline_from: z.string().optional(),
    deadline_to: z.string().optional(),
    tender_type: z.string().optional(),
    status: z.array(z.string()).optional(),
  }),
  frequency: z.enum(['instant', 'daily', 'weekly']).default('daily'),
  notification_channels: z
    .object({
      email: z.boolean().default(true),
      in_app: z.boolean().default(true),
    })
    .default({ email: true, in_app: true }),
});

const UpdateAlertSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional(),
  criteria: z
    .object({
      query: z.string().optional(),
      sectors: z.array(z.string()).optional(),
      countries: z.array(z.string()).optional(),
      min_value: z.number().optional(),
      max_value: z.number().optional(),
      deadline_from: z.string().optional(),
      deadline_to: z.string().optional(),
      tender_type: z.string().optional(),
      status: z.array(z.string()).optional(),
    })
    .optional(),
  frequency: z.enum(['instant', 'daily', 'weekly']).optional(),
  notification_channels: z
    .object({
      email: z.boolean(),
      in_app: z.boolean(),
    })
    .optional(),
  is_active: z.boolean().optional(),
});

// ============================================================
// GET - List alerts
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

    // Get alerts
    let query = supabase
      .from('search_alerts' as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: alerts, error: alertsError } = await query;

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Alerts GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create alert
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
    const validation = CreateAlertSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, description, criteria, frequency, notification_channels } =
      validation.data;

    // Create alert
    const { data: alert, error: createError } = await (supabase as any)
      .from('search_alerts' as any)
      .insert({
        user_id: user.id,
        company_id: profile.company_id,
        name,
        description,
        criteria,
        frequency,
        notification_channels,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating alert:', createError);
      return NextResponse.json(
        { error: 'Failed to create alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('Alert POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Update alert
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
    const validation = UpdateAlertSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { id, ...updates } = validation.data;

    // Check if user owns this alert
    const { data: existing, error: checkError } = await (supabase as any)
      .from('search_alerts' as any)
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      );
    }

    // Update alert
    const { data: alert, error: updateError } = await (supabase as any)
      .from('search_alerts' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating alert:', updateError);
      return NextResponse.json(
        { error: 'Failed to update alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Alert PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Remove alert
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

    // Get alert ID from query params
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Delete alert (RLS will ensure user owns it)
    const { error: deleteError } = await supabase
      .from('search_alerts' as any)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting alert:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Alert DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
