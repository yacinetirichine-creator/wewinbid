import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { TeamService, DEFAULT_PERMISSIONS, type TeamRole } from '@/lib/services/team-service';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['viewer', 'member', 'admin']),
  message: z.string().optional(),
});

/**
 * GET /api/team/invitations
 * Récupère les invitations de l'équipe
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

    const teamService = new TeamService(supabase);
    const team = await teamService.getUserTeam(user.id);

    if (!team) {
      return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });
    }

    const invitations = await teamService.getTeamInvitations(team.id);

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Erreur récupération invitations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/team/invitations
 * Créer une invitation (avec vérification du quota et facturation)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validated = inviteSchema.parse(body);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const teamService = new TeamService(supabase);
    const team = await teamService.getUserTeam(user.id);

    if (!team) {
      return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });
    }

    // Vérifier les permissions
    const canManage = await teamService.hasPermission(user.id, team.id, 'can_manage_team');
    if (!canManage) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes pour inviter des membres' },
        { status: 403 }
      );
    }

    // Vérifier si on peut ajouter un membre (et info facturation)
    const canAddResult = await teamService.canAddMember(team.id);
    if (!canAddResult.allowed) {
      return NextResponse.json(
        { error: canAddResult.reason || 'Impossible d\'ajouter plus de membres' },
        { status: 400 }
      );
    }

    // Générer un token unique
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const role = validated.role as TeamRole;

    // Créer l'invitation
    const { data: invitation, error: insertError } = await (supabase as any)
      .from('team_invitations')
      .insert({
        team_id: team.id,
        email: validated.email,
        role: role,
        permissions: DEFAULT_PERMISSIONS[role],
        invited_by: user.id,
        token,
        message: validated.message,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Une invitation existe déjà pour cet email' },
          { status: 400 }
        );
      }
      throw insertError;
    }

    // Envoyer l'email d'invitation
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team/accept-invitation?token=${token}`;

      const roleLabels: Record<string, string> = {
        admin: 'Administrateur',
        member: 'Membre',
        viewer: 'Lecteur'
      };

      await transporter.sendMail({
        from: `"WeWinBid" <${process.env.SMTP_USER}>`,
        to: validated.email,
        subject: `Invitation à rejoindre l'équipe ${team.name} sur WeWinBid`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Invitation à rejoindre une équipe</h2>
            <p>Vous avez été invité à rejoindre l'équipe <strong>${team.name}</strong> sur WeWinBid en tant que <strong>${roleLabels[role] || role}</strong>.</p>
            ${validated.message ? `<p style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-style: italic;">"${validated.message}"</p>` : ''}
            <p>Cette invitation expire dans 7 jours.</p>
            <a href="${inviteUrl}"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              Accepter l'invitation
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
      // Continue même si l'email échoue
    }

    // Retourner l'info de facturation si c'est un membre payant
    const response: any = { invitation };
    if (canAddResult.is_paid) {
      response.billing_info = {
        is_paid_member: true,
        extra_cost_per_month: canAddResult.extra_cost,
        message: `Ce membre sera facturé ${canAddResult.extra_cost}€/mois (au-delà des 2 collaborateurs gratuits inclus)`
      };
    } else {
      response.billing_info = {
        is_paid_member: false,
        remaining_free: canAddResult.remaining_free,
        message: `Membre gratuit. Il vous reste ${(canAddResult.remaining_free || 0) - 1} place(s) gratuite(s) après cette invitation.`
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Erreur création invitation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/team/invitations
 * Supprimer une invitation
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const teamService = new TeamService(supabase);
    await teamService.cancelInvitation(invitationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression invitation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/team/invitations
 * Accepter ou refuser une invitation
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { token, action } = body;

    if (!token || !action) {
      return NextResponse.json({ error: 'Token et action requis' }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const teamService = new TeamService(supabase);

    if (action === 'accept') {
      const member = await teamService.acceptInvitation(token, user.id);
      return NextResponse.json({
        success: true,
        member,
        message: 'Vous avez rejoint l\'équipe avec succès !'
      });
    } else if (action === 'decline') {
      await teamService.declineInvitation(token);
      return NextResponse.json({
        success: true,
        message: 'Invitation refusée'
      });
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur traitement invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
