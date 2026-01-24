import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TeamService } from '@/lib/services/team-service';

export const dynamic = 'force-dynamic';

// GET /api/team - Get current user's team
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const teamService = new TeamService(supabase);
    const team = await teamService.getUserTeam(user.id);

    if (!team) {
      return NextResponse.json({ team: null });
    }

    // Get team members and billing info
    const [members, billingInfo] = await Promise.all([
      teamService.getTeamMembers(team.id),
      teamService.getTeamBillingInfo(team.id)
    ]);

    return NextResponse.json({
      team,
      members,
      billing: billingInfo,
      is_owner: team.owner_id === user.id
    });
  } catch (error) {
    console.error('Error getting team:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/team - Create a new team
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Check if user already has a team
    const teamService = new TeamService(supabase);
    const existingTeam = await teamService.getUserTeam(user.id);

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Vous avez déjà une équipe' },
        { status: 400 }
      );
    }

    // Check subscription level
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (!profile || !['pro', 'enterprise'].includes(profile.subscription_tier || '')) {
      return NextResponse.json(
        { error: 'La fonctionnalité équipe est réservée aux abonnements Pro et Enterprise' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Le nom de l\'équipe doit contenir au moins 2 caractères' },
        { status: 400 }
      );
    }

    const team = await teamService.createTeam(user.id, name.trim());

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH /api/team - Update team settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const teamService = new TeamService(supabase);
    const team = await teamService.getUserTeam(user.id);

    if (!team) {
      return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });
    }

    // Only owner can update team
    if (team.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Seul le propriétaire peut modifier l\'équipe' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, settings } = body;

    const updates: { name?: string; settings?: typeof settings } = {};
    if (name) updates.name = name;
    if (settings) updates.settings = settings;

    const updatedTeam = await teamService.updateTeam(team.id, updates);

    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
