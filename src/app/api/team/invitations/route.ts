import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['viewer', 'editor', 'admin']),
});

/**
 * GET /api/team/invitations
 * Récupère les invitations de l'entreprise
 */
export async function GET() {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le company_id
    const { data: profile } = (await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()) as { data: { company_id: string } | null };

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Récupérer les invitations
    const { data: invitations, error } = (await supabase
      .from('team_invitations')
      .select(`
        *,
        inviter:profiles!invited_by(
          id,
          email,
          full_name
        )
      `)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })) as { data: any[] | null; error: any };

    if (error) throw error;

    return NextResponse.json({ invitations: invitations || [] });
  } catch (error) {
    console.error('Erreur récupération invitations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/team/invitations
 * Créer une invitation
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const validated = inviteSchema.parse(body);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le company_id et vérifier les permissions
    const { data: profile } = (await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()) as { data: { company_id: string } | null };

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Vérifier le rôle de l'inviteur
    const { data: member } = (await supabase
      .from('team_members')
      .select('role')
      .eq('company_id', profile.company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()) as { data: { role: string } | null };

    if (!member || !['admin', 'editor'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', validated.email)
      .single();

    if (existingUser) {
      // Vérifier s'il est déjà membre
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('company_id', profile.company_id)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'Cet utilisateur est déjà membre de l\'équipe' },
          { status: 400 }
        );
      }
    }

    // Générer un token unique
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    // Créer l'invitation
    const { data: invitation, error: insertError } = await supabase
      .from('team_invitations')
      .insert({
        company_id: profile.company_id,
        email: validated.email,
        role: validated.role,
        invited_by: user.id,
        token,
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

    await transporter.sendMail({
      from: `"WeWinBid" <${process.env.SMTP_USER}>`,
      to: validated.email,
      subject: 'Invitation à rejoindre une équipe sur WeWinBid',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Invitation à rejoindre une équipe</h2>
          <p>Vous avez été invité à rejoindre une équipe sur WeWinBid en tant que <strong>${validated.role}</strong>.</p>
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

    return NextResponse.json({ invitation, inviteUrl });
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
    const supabase = createClient();
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

    // Supprimer l'invitation
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression invitation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
