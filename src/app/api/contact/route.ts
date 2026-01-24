import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, phone, subject, message } = body;

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      );
    }

    // Send the email to commercial@wewinbid.com
    const emailContent = `
  New contact request from WeWinBid

  Name: ${name}
  Email: ${email}
  Company: ${company || 'Not provided'}
  Phone: ${phone || 'Not provided'}
  Subject: ${subject || 'General inquiry'}

  Message:
${message}

---
  Sent from the WeWinBid contact form
  Date: ${new Date().toLocaleString('en-US')}
    `.trim();

    await sendEmail({
      to: 'commercial@wewinbid.com',
      subject: `[WeWinBid] ${subject || 'New contact request'} - ${name}`,
      text: emailContent,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px;">
    New contact request
  </h2>
  
  <div style="margin: 20px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
    <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
    <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
    <p style="margin: 10px 0;"><strong>Company:</strong> ${company || 'Not provided'}</p>
    <p style="margin: 10px 0;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
    <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject || 'General inquiry'}</p>
  </div>

  <div style="margin: 20px 0;">
    <h3 style="color: #374151; margin-bottom: 10px;">Message:</h3>
    <div style="padding: 15px; background-color: #ffffff; border-left: 4px solid #2563eb; white-space: pre-wrap;">
${message}
    </div>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    <p>Sent from the WeWinBid contact form</p>
    <p>Date: ${new Date().toLocaleString('en-US')}</p>
  </div>
</div>
      `.trim(),
    });

    // Send a confirmation email to the requester
    await sendEmail({
      to: email,
      subject: 'We received your message - WeWinBid',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">WeWinBid</h1>
  </div>

  <div style="padding: 30px; background-color: #ffffff;">
    <h2 style="color: #1f2937; margin-top: 0;">Hello ${name},</h2>
    
    <p style="color: #374151; line-height: 1.6;">
      Thanks for your message. Our sales team has received it and will get back to you as soon as possible.
    </p>

    <div style="margin: 25px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 4px;">
      <p style="margin: 0; color: #166534;">
        <strong>💡 Need a quick reply?</strong><br/>
        Book a meeting directly with our team:
        <a href="https://calendly.com/commercial-wewinbid/30min" style="color: #16a34a; text-decoration: underline;">
          Book a slot
        </a>
      </p>
    </div>

    <p style="color: #374151; line-height: 1.6;">
      Talk soon,<br/>
      <strong>The WeWinBid team</strong>
    </p>
  </div>

  <div style="padding: 20px; background-color: #f9fafb; text-align: center; border-radius: 0 0 8px 8px;">
    <p style="margin: 0; font-size: 12px; color: #6b7280;">
      JARVIS SAS - WeWinBid<br/>
      © ${new Date().getFullYear()} All rights reserved
    </p>
  </div>
</div>
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Error sending message' },
      { status: 500 }
    );
  }
}
