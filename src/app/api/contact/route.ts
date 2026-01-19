import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, phone, subject, message } = body;

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Envoyer l'email à commercial@wewinbid.com
    const emailContent = `
Nouvelle demande de contact depuis WeWinBid

Nom: ${name}
Email: ${email}
Entreprise: ${company || 'Non renseignée'}
Téléphone: ${phone || 'Non renseigné'}
Sujet: ${subject || 'Contact général'}

Message:
${message}

---
Envoyé depuis le formulaire de contact WeWinBid
Date: ${new Date().toLocaleString('fr-FR')}
    `.trim();

    await sendEmail({
      to: 'commercial@wewinbid.com',
      subject: `[WeWinBid] ${subject || 'Nouvelle demande de contact'} - ${name}`,
      text: emailContent,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px;">
    Nouvelle demande de contact
  </h2>
  
  <div style="margin: 20px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
    <p style="margin: 10px 0;"><strong>Nom:</strong> ${name}</p>
    <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
    <p style="margin: 10px 0;"><strong>Entreprise:</strong> ${company || 'Non renseignée'}</p>
    <p style="margin: 10px 0;"><strong>Téléphone:</strong> ${phone || 'Non renseigné'}</p>
    <p style="margin: 10px 0;"><strong>Sujet:</strong> ${subject || 'Contact général'}</p>
  </div>

  <div style="margin: 20px 0;">
    <h3 style="color: #374151; margin-bottom: 10px;">Message:</h3>
    <div style="padding: 15px; background-color: #ffffff; border-left: 4px solid #2563eb; white-space: pre-wrap;">
${message}
    </div>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    <p>Envoyé depuis le formulaire de contact WeWinBid</p>
    <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
  </div>
</div>
      `.trim(),
    });

    // Envoyer un email de confirmation au demandeur
    await sendEmail({
      to: email,
      subject: 'Nous avons bien reçu votre message - WeWinBid',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">WeWinBid</h1>
  </div>

  <div style="padding: 30px; background-color: #ffffff;">
    <h2 style="color: #1f2937; margin-top: 0;">Bonjour ${name},</h2>
    
    <p style="color: #374151; line-height: 1.6;">
      Merci pour votre message. Notre équipe commerciale l'a bien reçu et vous répondra dans les plus brefs délais.
    </p>

    <div style="margin: 25px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 4px;">
      <p style="margin: 0; color: #166534;">
        <strong>💡 Besoin d'une réponse rapide ?</strong><br/>
        Prenez rendez-vous directement avec notre équipe: 
        <a href="https://calendly.com/commercial-wewinbid/30min" style="color: #16a34a; text-decoration: underline;">
          Réserver un créneau
        </a>
      </p>
    </div>

    <p style="color: #374151; line-height: 1.6;">
      À très bientôt,<br/>
      <strong>L'équipe WeWinBid</strong>
    </p>
  </div>

  <div style="padding: 20px; background-color: #f9fafb; text-align: center; border-radius: 0 0 8px 8px;">
    <p style="margin: 0; font-size: 12px; color: #6b7280;">
      JARVIS SAS - WeWinBid<br/>
      © ${new Date().getFullYear()} Tous droits réservés
    </p>
  </div>
</div>
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    );
  }
}
