import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/tenders - List all tenders for the user's company
export async function GET(request: NextRequest) {
  try {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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
  } catch (error) {
    console.error('Tenders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tenders - Create a new tender
export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();
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
    } = body;

    // Validate required fields
    if (!title || !type || !country) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, type, country' 
      }, { status: 400 });
    }

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
  } catch (error) {
    console.error('Tenders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/tenders - Update a tender (by id in body)
export async function PUT(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tender ID is required' }, { status: 400 });
    }

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
  } catch (error) {
    console.error('Tenders PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tenders - Delete a tender
export async function DELETE(request: NextRequest) {
  try {
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

    // Parse tender ID from query or body
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tender ID is required' }, { status: 400 });
    }

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
  } catch (error) {
    console.error('Tenders DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
