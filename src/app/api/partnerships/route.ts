import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withErrorHandler } from '@/lib/errors';
import { z } from 'zod';

// Validation schemas
const PartnerSearchSchema = z.object({
  action: z.enum(['search', 'my_partnerships']).default('my_partnerships'),
  sector: z.string().optional(),
  region: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const CreatePartnershipSchema = z.object({
  partner_id: z.string().uuid(),
  type: z.enum(['SUBCONTRACTOR', 'PRIME_CONTRACTOR', 'GROUPEMENT', 'CONSULTANT']),
  message: z.string().optional(),
  tender_id: z.string().uuid().optional(),
  proposed_terms: z.string().optional(),
});

const UpdatePartnershipSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['accept', 'reject', 'terminate', 'cancel']),
  response_message: z.string().optional(),
});

// GET /api/partnerships - List partnerships and search for partners
async function getHandler(request: NextRequest) {
  const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    // Parse and validate query params
    const { searchParams } = new URL(request.url);
    const params = PartnerSearchSchema.parse({
      action: searchParams.get('action') || 'my_partnerships',
      sector: searchParams.get('sector') || undefined,
      region: searchParams.get('region') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit'),
    });
    const { action, sector, region, search, limit } = params;

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
      const { data: partnerships, error } = await (supabase as any)
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
      const formattedPartnerships = partnerships?.map((p: any) => ({
        ...p,
        isRequester: p.requester_id === profile.company_id,
        otherCompany: p.requester_id === profile.company_id ? p.partner : p.requester,
      }));

      return NextResponse.json({ partnerships: formattedPartnerships });
    }
}

// POST /api/partnerships - Create a partnership request
async function postHandler(request: NextRequest) {
  const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const data = CreatePartnershipSchema.parse(body);

    // Check if partnership already exists
    const { data: existing } = await (supabase as any)
      .from('partnerships')
      .select('id, status')
      .or(`and(requester_id.eq.${profile.company_id},partner_id.eq.${data.partner_id}),and(requester_id.eq.${data.partner_id},partner_id.eq.${profile.company_id})`)
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
    const { data: partnership, error: createError } = await (supabase as any)
      .from('partnerships')
      .insert({
        requester_id: profile.company_id,
        partner_id: data.partner_id,
        type: data.type,
        status: 'PENDING',
        message: data.message,
        tender_id: data.tender_id,
        proposed_terms: data.proposed_terms,
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
}

// PUT /api/partnerships - Update partnership (accept/reject/terminate)
async function putHandler(request: NextRequest) {
  const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { id, action, response_message } = UpdatePartnershipSchema.parse(body);

    // Get the partnership
    const { data: partnership } = await (supabase as any)
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

    const { data: updated, error: updateError } = await (supabase as any)
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
}

// DELETE /api/partnerships - Delete a partnership (only if pending or inactive)
async function deleteHandler(request: NextRequest) {
  const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    // Parse and validate partnership ID
    const { searchParams } = new URL(request.url);
    const id = z.string().uuid().parse(searchParams.get('id'));

    // Get and validate partnership
    const { data: partnership } = await (supabase as any)
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

    const { error } = await (supabase as any)
      .from('partnerships')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete partnership error:', error);
      return NextResponse.json({ error: 'Failed to delete partnership' }, { status: 500 });
    }

  return NextResponse.json({ success: true });
}

// Export wrapped handlers
export const GET = withErrorHandler(getHandler as any);
export const POST = withErrorHandler(postHandler as any);
export const PUT = withErrorHandler(putHandler as any);
export const DELETE = withErrorHandler(deleteHandler as any);
