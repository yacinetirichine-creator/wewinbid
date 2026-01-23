import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export interface SignatureRequest {
  id: string;
  organization_id: string;
  created_by: string;
  tender_id?: string;
  title: string;
  description?: string;
  status: 'draft' | 'pending' | 'partially_signed' | 'completed' | 'cancelled' | 'expired';
  document_url?: string;
  document_name?: string;
  document_type?: string;
  expires_at?: string;
  signed_document_url?: string;
  created_at: string;
  signers?: SignatureSigner[];
}

export interface SignatureSigner {
  id: string;
  signature_request_id: string;
  user_id?: string;
  email: string;
  name: string;
  phone?: string;
  order_index: number;
  status: 'pending' | 'notified' | 'viewed' | 'signed' | 'declined' | 'expired';
  notified_at?: string;
  viewed_at?: string;
  signed_at?: string;
  access_token: string;
}

// GET - Liste des demandes de signature
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tenderId = searchParams.get('tender_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('signature_requests')
      .select('*, signature_signers(*)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (tenderId) {
      query = query.eq('tender_id', tenderId);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: requests, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      requests: requests || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching signature requests:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des demandes' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle demande de signature
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      tender_id,
      document_url,
      document_name,
      signers,
      expires_in_days = 30,
      send_immediately = false,
    } = body;

    if (!title || !signers || signers.length === 0) {
      return NextResponse.json(
        { error: 'Le titre et au moins un signataire sont requis' },
        { status: 400 }
      );
    }

    // Récupérer l'org_id
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    // Calculer le hash du document si fourni
    let documentHash = null;
    if (document_url) {
      // Dans un cas réel, on récupérerait le fichier pour le hasher
      documentHash = crypto.randomUUID(); // Placeholder
    }

    // Créer la demande de signature
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    const { data: signatureRequest, error } = await supabase
      .from('signature_requests')
      .insert({
        organization_id: userData?.organization_id,
        created_by: user.id,
        tender_id,
        title,
        description,
        document_url,
        document_name,
        document_hash: documentHash,
        status: send_immediately ? 'pending' : 'draft',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Créer les signataires
    const signersToInsert = signers.map((signer: Partial<SignatureSigner>, index: number) => ({
      signature_request_id: signatureRequest.id,
      user_id: signer.user_id,
      email: signer.email,
      name: signer.name,
      phone: signer.phone,
      order_index: index,
      status: 'pending',
      token_expires_at: expiresAt.toISOString(),
    }));

    const { data: createdSigners, error: signersError } = await supabase
      .from('signature_signers')
      .insert(signersToInsert)
      .select();

    if (signersError) throw signersError;

    // Si envoi immédiat, envoyer les notifications
    if (send_immediately && createdSigners) {
      // TODO: Implémenter l'envoi d'emails
      // Pour l'instant, on met juste à jour les statuts
      await supabase
        .from('signature_signers')
        .update({ 
          status: 'notified',
          notified_at: new Date().toISOString(),
        })
        .in('id', createdSigners.map(s => s.id));
    }

    // Log d'audit
    await (supabase as any).from('signature_audit_log').insert({
      signature_request_id: signatureRequest.id,
      action: 'created',
      actor_id: user.id,
      actor_type: 'user',
      details: { signers_count: signers.length },
    });

    return NextResponse.json({
      request: {
        ...signatureRequest,
        signers: createdSigners,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating signature request:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la demande' },
      { status: 500 }
    );
  }
}
