/**
 * @fileoverview Email service using Nodemailer with Gmail SMTP.
 * Handles transactional emails for tenders, alerts, and notifications.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Gmail SMTP transporter configuration.
 * Uses App Password for authentication (not regular Gmail password).
 * 
 * Setup Instructions:
 * 1. Enable 2FA on your Gmail account
 * 2. Go to https://myaccount.google.com/apppasswords
 * 3. Generate new App Password for "Mail"
 * 4. Add to .env.local: GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
 */
const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // App Password (not regular password)
  },
});

/**
 * Email template types
 */
export type EmailTemplate = 
  | 'tender_alert'
  | 'deadline_reminder'
  | 'welcome'
  | 'partnership_request'
  | 'tender_won'
  | 'tender_lost'
  | 'document_expiring';

/**
 * Base email options
 */
interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Gmail SMTP.
 * 
 * @param options - Email configuration
 * @returns Promise with email info
 * 
 * @example
 * ```ts
 * await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'New Tender Alert',
 *   html: '<h1>Check this tender!</h1>',
 * });
 * ```
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"WeWinBid" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
}

/**
 * Send tender alert email.
 */
export async function sendTenderAlert(email: string, tender: {
  id: string;
  title: string;
  budget?: number;
  deadline: string;
  sector?: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .tender-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Nouvel Appel d'Offres</h1>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p>Un nouvel appel d'offres correspondant à vos critères vient d'être publié :</p>
            
            <div class="tender-card">
              <h2>${tender.title}</h2>
              ${tender.sector ? `<p><strong>Secteur:</strong> ${tender.sector}</p>` : ''}
              ${tender.budget ? `<p><strong>Budget estimé:</strong> ${tender.budget.toLocaleString('fr-FR')} €</p>` : ''}
              <p><strong>Date limite:</strong> ${new Date(tender.deadline).toLocaleDateString('fr-FR')}</p>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/tenders/${tender.id}" class="button">
              Voir l'appel d'offres
            </a>
            
            <div class="footer">
              <p>WeWinBid - Plateforme SaaS B2B pour Appels d'Offres</p>
              <p>Commercialisé par JARVIS SAS</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🎯 Nouvel AO: ${tender.title}`,
    html,
  });
}

/**
 * Send deadline reminder email (3 days before).
 */
export async function sendDeadlineReminder(email: string, tender: {
  id: string;
  title: string;
  deadline: string;
  daysRemaining: number;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Rappel de Deadline</h1>
          </div>
          <div class="content">
            <div class="warning">
              <h2>⚠️ Plus que ${tender.daysRemaining} jour${tender.daysRemaining > 1 ? 's' : ''} !</h2>
              <p><strong>${tender.title}</strong></p>
              <p>Date limite: ${new Date(tender.deadline).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            
            <p>N'oubliez pas de finaliser votre dossier de candidature.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/tenders/${tender.id}" class="button">
              Accéder au dossier
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `⏰ Rappel: ${tender.title} - ${tender.daysRemaining} jour${tender.daysRemaining > 1 ? 's' : ''} restant${tender.daysRemaining > 1 ? 's' : ''}`,
    html,
  });
}

/**
 * Send welcome email for new users.
 */
export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .features { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue sur WeWinBid !</h1>
          </div>
          <div class="content">
            <p>Bonjour ${name},</p>
            <p>Votre compte WeWinBid est prêt ! Vous pouvez désormais automatiser vos réponses aux appels d'offres.</p>
            
            <div class="features">
              <h3>🚀 Fonctionnalités disponibles :</h3>
              <ul>
                <li>✅ Score IA de compatibilité (0-100%)</li>
                <li>🎨 Génération d'images avec DALL-E 3</li>
                <li>📊 Générateur de présentations</li>
                <li>📄 Mémoires techniques automatiques</li>
                <li>🤝 Marketplace de partenaires</li>
                <li>📈 Analytics ROI complètes</li>
              </ul>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
              Accéder au tableau de bord
            </a>
            
            <p style="margin-top: 30px; color: #6b7280;">
              Besoin d'aide ? Consultez notre <a href="${process.env.NEXT_PUBLIC_APP_URL}/docs">documentation</a> 
              ou contactez notre support.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Bienvenue sur WeWinBid !',
    html,
  });
}

/**
 * Send document expiring notification.
 */
export async function sendDocumentExpiringEmail(email: string, document: {
  name: string;
  type: string;
  expiresAt: string;
  daysUntilExpiry: number;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Document bientôt expiré</h1>
          </div>
          <div class="content">
            <div class="alert">
              <h2>Document à renouveler</h2>
              <p><strong>${document.name}</strong> (${document.type})</p>
              <p>Expire le: ${new Date(document.expiresAt).toLocaleDateString('fr-FR')}</p>
              <p>⏰ Plus que ${document.daysUntilExpiry} jour${document.daysUntilExpiry > 1 ? 's' : ''}</p>
            </div>
            
            <p>Pensez à renouveler ce document pour rester conforme dans vos candidatures.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/documents" class="button">
              Gérer mes documents
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `⚠️ ${document.name} expire dans ${document.daysUntilExpiry} jour${document.daysUntilExpiry > 1 ? 's' : ''}`,
    html,
  });
}

/**
 * Verify email configuration on server startup.
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ Email server ready (Gmail SMTP)');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}
