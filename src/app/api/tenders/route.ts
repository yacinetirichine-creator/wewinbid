import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withErrorHandler } from '@/lib/errors';
import { canCreateTender } from '@/lib/subscription';
import { z } from 'zod';

// Validation schemas
const TenderQuerySchema = z.object({
  status: z.string().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const CreateTenderSchema = z.object({
  title: z.string().min(1).max(500),
  reference: z.string().max(100).optional(),
  type: z.enum(['PUBLIC', 'PRIVATE']),
  status: z.enum(['DRAFT', 'ANALYSIS', 'IN_PROGRESS', 'REVIEW', 'SUBMITTED', 'WON', 'LOST', 'ABANDONED']).default('DRAFT'),
  description: z.string().optional(),
  sector: z.string().optional(),
  country: z.string().length(2),
  region: z.string().optional(),
  department: z.string().optional(),
  buyer: z.object({
    name: z.string(),
    type: z.enum(['PUBLIC', 'PRIVATE']).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
  }).optional(),
  estimated_value: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  publication_date: z.string().datetime().optional(),
  source_url: z.string().url().optional(),
  source_platform: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateTenderSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  status: z.enum(['DRAFT', 'ANALYSIS', 'IN_PROGRESS', 'REVIEW', 'SUBMITTED', 'WON', 'LOST', 'ABANDONED']).optional(),
  description: z.string().optional(),
  estimated_value: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// GET /api/tenders - List all tenders for the user's company
async function getHandler(request: NextRequest) {
  const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    // Parse and validate query params
    const { searchParams } = new URL(request.url);
    const params = TenderQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });
    const { status, type, search, limit, offset } = params;

    // Build query
    let query = supabase
      .from('tenders')
      .select('*, buyer:buyers(*), documents:tender_documents(*)', { count: 'exact' })
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,reference.ilike.%${search}%`);
    }

    const { data: tenders, error, count } = await query;

    if (error) {
      console.error('Error fetching tenders:', error);
      return NextResponse.json({ error: 'Failed to fetch tenders' }, { status: 500 });
    }

  return NextResponse.json({
    tenders,
    pagination: {
      total: count,
      limit,
      offset,
      hasMore: count ? offset + limit < count : false,
    },
  });
}

// POST /api/tenders - Create a new tender
async function postHandler(request: NextRequest) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated' }, { status: 400 });
  }

  // ✅ VÉRIFICATION DU QUOTA D'ABONNEMENT
  const quotaCheck = await canCreateTender(profile.company_id);
  if (!quotaCheck.canCreate) {
    return NextResponse.json({ 
      error: quotaCheck.reason || 'Quota exceeded',
      quota: {
        current: quotaCheck.currentCount,
        limit: quotaCheck.limit,
      }
    }, { status: 403 });
  }

  // Parse and validate request body
  const body = await request.json();
  const data = CreateTenderSchema.parse(body);
  const {
    title,
    reference,
    type,
    status = 'DRAFT',
    description,
    sector,
    country,
    region,
    department,
    buyer,
    estimated_value,
    deadline,
    publication_date,
    source_url,
    source_platform,
    notes,
  } = data;

    // Generate reference if not provided
    const finalReference = reference || `WW-${Date.now().toString(36).toUpperCase()}`;

    // Create or get buyer if provided
    let buyerId = null;
    if (buyer?.name) {
      // Check if buyer exists
      const { data: existingBuyer } = await supabase
        .from('buyers')
        .select('id')
        .eq('name', buyer.name)
        .eq('company_id', profile.company_id)
        .single();

      if (existingBuyer) {
        buyerId = existingBuyer.id;
      } else {
        // Create new buyer
        const { data: newBuyer, error: buyerError } = await supabase
          .from('buyers')
          .insert({
            company_id: profile.company_id,
            name: buyer.name,
            type: buyer.type || 'PUBLIC',
            email: buyer.email,
            phone: buyer.phone,
            address: buyer.address,
            city: buyer.city,
            postal_code: buyer.postal_code,
            country: country,
          })
          .select('id')
          .single();

        if (!buyerError && newBuyer) {
          buyerId = newBuyer.id;
        }
      }
    }

    // Create tender
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .insert({
        company_id: profile.company_id,
        buyer_id: buyerId,
        title,
        reference: finalReference,
        type,
        status,
        description,
        sector,
        country,
        region,
        department,
        estimated_value,
        deadline,
        publication_date,
        source_url,
        source_platform,
        notes,
        created_by: user.id,
      })
      .select('*, buyer:buyers(*)')
      .single();

    if (tenderError) {
      console.error('Error creating tender:', tenderError);
      return NextResponse.json({ error: 'Failed to create tender' }, { status: 500 });
    }

  return NextResponse.json({ tender }, { status: 201 });
}

// PUT /api/tenders - Update a tender (by id in body)
async function putHandler(request: NextRequest) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated' }, { status: 400 });
  }

  // Parse and validate request body
  const body = await request.json();
  const { id, ...updateData } = UpdateTenderSchema.parse(body);

    // Update tender (only if belongs to user's company)
    const { data: tender, error: updateError } = await supabase
      .from('tenders')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .select('*, buyer:buyers(*)')
      .single();

    if (updateError) {
      console.error('Error updating tender:', updateError);
      return NextResponse.json({ error: 'Failed to update tender' }, { status: 500 });
    }

    if (!tender) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
    }

  return NextResponse.json({ tender });
}

// DELETE /api/tenders - Delete a tender
async function deleteHandler(request: NextRequest) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated' }, { status: 400 });
  }

  // Parse and validate tender ID
  const { searchParams } = new URL(request.url);
  const id = z.string().uuid().parse(searchParams.get('id'));

    // Delete tender (only if belongs to user's company)
    const { error: deleteError } = await supabase
      .from('tenders')
      .delete()
      .eq('id', id)
      .eq('company_id', profile.company_id);

    if (deleteError) {
      console.error('Error deleting tender:', deleteError);
      return NextResponse.json({ error: 'Failed to delete tender' }, { status: 500 });
    }

  return NextResponse.json({ success: true });
}

// Export wrapped handlers
export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
