import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateMemberSchema = z.object({
  role: z.enum(['viewer', 'editor', 'admin']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

/**
 * GET /api/team/members
 * Récupère les membres de l'équipe
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le company_id
    const { data: profile } = (await (supabase as any)
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()) as { data: { company_id: string } | null };

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Récupérer les membres
    const { data: members, error } = (await (supabase as any)
      .from('team_members')
      .select(`
        *,
        user:profiles!user_id(
          id,
          email,
          full_name,
          avatar_url
        ),
        inviter:profiles!invited_by(
          id,
          full_name
        )
      `)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })) as { data: any[] | null; error: any };

    if (error) throw error;

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error('Erreur récupération membres:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/team/members
 * Mettre à jour un membre
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('id');
    const body = await request.json();
    
    if (!memberId) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const validated = updateMemberSchema.parse(body);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier les permissions (seuls les admins peuvent modifier)
    const { data: currentMember } = (await (supabase as any)
      .from('team_members')
      .select('company_id, role')
      .eq('id', memberId)
      .single()) as { data: { company_id: string; role: string } | null };

    if (!currentMember) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
    }

    const { data: adminCheck } = (await (supabase as any)
      .from('team_members')
      .select('role')
      .eq('company_id', currentMember.company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()) as { data: { role: string } | null };

    if (!adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent modifier les membres' },
        { status: 403 }
      );
    }

    // Mettre à jour le membre
    const updateData: any = { updated_at: new Date().toISOString() };
    if (validated.role) updateData.role = validated.role;
    if (validated.status) updateData.status = validated.status;

    const { data, error } = await (supabase as any)
      .from('team_members')
      .update(updateData)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ member: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Erreur mise à jour membre:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/team/members
 * Retirer un membre de l'équipe
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('id');

    if (!memberId) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier les permissions
    const { data: targetMember } = (await (supabase as any)
      .from('team_members')
      .select('company_id, user_id')
      .eq('id', memberId)
      .single()) as { data: { company_id: string; user_id: string } | null };

    if (!targetMember) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
    }

    const { data: adminCheck } = (await (supabase as any)
      .from('team_members')
      .select('role')
      .eq('company_id', targetMember.company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()) as { data: { role: string } | null };

    if (!adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent retirer des membres' },
        { status: 403 }
      );
    }

    // Empêcher de se retirer soi-même
    if (targetMember.user_id === user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous retirer vous-même' },
        { status: 400 }
      );
    }

    // Supprimer le membre
    const { error } = await (supabase as any)
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression membre:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
