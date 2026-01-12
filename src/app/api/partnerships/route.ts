import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Partnership types
type PartnershipType = 'SUBCONTRACTOR' | 'PRIME_CONTRACTOR' | 'GROUPEMENT' | 'CONSULTANT';
type PartnershipStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'INACTIVE';

// GET /api/partnerships - List partnerships and search for partners
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'my_partnerships';
    const sector = searchParams.get('sector');
    const region = searchParams.get('region');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (action === 'search') {
      // Search for potential partners (other companies)
      let query = supabase
        .from('companies')
        .select(`
          id,
          name,
          logo_url,
          description,
          sectors,
          regions,
          certifications,
          website,
          city,
          country,
          is_verified,
          rating
        `)
        .neq('id', profile.company_id)
        .eq('is_marketplace_visible', true)
        .limit(limit);

      if (sector) {
        query = query.contains('sectors', [sector]);
      }
      if (region) {
        query = query.contains('regions', [region]);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data: companies, error } = await query;

      if (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
      }

      return NextResponse.json({ partners: companies });
    } else {
      // Get my partnerships
      const { data: partnerships, error } = await supabase
        .from('partnerships')
        .select(`
          *,
          partner:companies!partnerships_partner_id_fkey(
            id, name, logo_url, description, sectors, city, country, is_verified, rating
          ),
          requester:companies!partnerships_requester_id_fkey(
            id, name, logo_url, description, sectors, city, country, is_verified, rating
          )
        `)
        .or(`requester_id.eq.${profile.company_id},partner_id.eq.${profile.company_id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Partnerships error:', error);
        return NextResponse.json({ error: 'Failed to fetch partnerships' }, { status: 500 });
      }

      // Format partnerships
      const formattedPartnerships = partnerships?.map(p => ({
        ...p,
        isRequester: p.requester_id === profile.company_id,
        otherCompany: p.requester_id === profile.company_id ? p.partner : p.requester,
      }));

      return NextResponse.json({ partnerships: formattedPartnerships });
    }
  } catch (error) {
    console.error('Partnerships GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/partnerships - Create a partnership request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      partner_id, 
      type, 
      message, 
      tender_id,
      proposed_terms 
    } = body;

    if (!partner_id || !type) {
      return NextResponse.json({ 
        error: 'Partner ID and partnership type are required' 
      }, { status: 400 });
    }

    // Check if partnership already exists
    const { data: existing } = await supabase
      .from('partnerships')
      .select('id, status')
      .or(`and(requester_id.eq.${profile.company_id},partner_id.eq.${partner_id}),and(requester_id.eq.${partner_id},partner_id.eq.${profile.company_id})`)
      .single();

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return NextResponse.json({ 
          error: 'Partnership already exists' 
        }, { status: 400 });
      }
      if (existing.status === 'PENDING') {
        return NextResponse.json({ 
          error: 'Partnership request already pending' 
        }, { status: 400 });
      }
    }

    // Create partnership request
    const { data: partnership, error: createError } = await supabase
      .from('partnerships')
      .insert({
        requester_id: profile.company_id,
        partner_id,
        type,
        status: 'PENDING',
        message,
        tender_id,
        proposed_terms,
        requested_by: user.id,
      })
      .select(`
        *,
        partner:companies!partnerships_partner_id_fkey(id, name, logo_url)
      `)
      .single();

    if (createError) {
      console.error('Create partnership error:', createError);
      return NextResponse.json({ error: 'Failed to create partnership' }, { status: 500 });
    }

    // TODO: Send notification email to partner

    return NextResponse.json({ partnership }, { status: 201 });
  } catch (error) {
    console.error('Partnerships POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/partnerships - Update partnership (accept/reject/terminate)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    const body = await request.json();
    const { id, action, response_message } = body;

    if (!id || !action) {
      return NextResponse.json({ 
        error: 'Partnership ID and action are required' 
      }, { status: 400 });
    }

    // Get the partnership
    const { data: partnership } = await supabase
      .from('partnerships')
      .select('*')
      .eq('id', id)
      .single();

    if (!partnership) {
      return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
    }

    // Check authorization
    const isRequester = partnership.requester_id === profile.company_id;
    const isPartner = partnership.partner_id === profile.company_id;

    if (!isRequester && !isPartner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let updateData: any = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'accept':
        if (!isPartner) {
          return NextResponse.json({ error: 'Only the partner can accept' }, { status: 403 });
        }
        if (partnership.status !== 'PENDING') {
          return NextResponse.json({ error: 'Partnership is not pending' }, { status: 400 });
        }
        updateData.status = 'ACTIVE';
        updateData.accepted_at = new Date().toISOString();
        updateData.response_message = response_message;
        break;

      case 'reject':
        if (!isPartner) {
          return NextResponse.json({ error: 'Only the partner can reject' }, { status: 403 });
        }
        if (partnership.status !== 'PENDING') {
          return NextResponse.json({ error: 'Partnership is not pending' }, { status: 400 });
        }
        updateData.status = 'REJECTED';
        updateData.rejected_at = new Date().toISOString();
        updateData.response_message = response_message;
        break;

      case 'terminate':
        if (partnership.status !== 'ACTIVE') {
          return NextResponse.json({ error: 'Partnership is not active' }, { status: 400 });
        }
        updateData.status = 'INACTIVE';
        updateData.terminated_at = new Date().toISOString();
        updateData.terminated_by = user.id;
        updateData.termination_reason = response_message;
        break;

      case 'cancel':
        if (!isRequester) {
          return NextResponse.json({ error: 'Only the requester can cancel' }, { status: 403 });
        }
        if (partnership.status !== 'PENDING') {
          return NextResponse.json({ error: 'Partnership is not pending' }, { status: 400 });
        }
        updateData.status = 'INACTIVE';
        updateData.cancelled_at = new Date().toISOString();
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('partnerships')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update partnership error:', updateError);
      return NextResponse.json({ error: 'Failed to update partnership' }, { status: 500 });
    }

    // TODO: Send notification email

    return NextResponse.json({ partnership: updated });
  } catch (error) {
    console.error('Partnerships PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/partnerships - Delete a partnership (only if pending or inactive)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Partnership ID required' }, { status: 400 });
    }

    // Get and validate partnership
    const { data: partnership } = await supabase
      .from('partnerships')
      .select('*')
      .eq('id', id)
      .single();

    if (!partnership) {
      return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
    }

    // Check authorization
    if (partnership.requester_id !== profile.company_id && partnership.partner_id !== profile.company_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow deletion of non-active partnerships
    if (partnership.status === 'ACTIVE') {
      return NextResponse.json({ 
        error: 'Cannot delete active partnership. Terminate it first.' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('partnerships')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete partnership error:', error);
      return NextResponse.json({ error: 'Failed to delete partnership' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Partnerships DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
