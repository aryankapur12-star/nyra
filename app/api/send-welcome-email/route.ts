// ═══════════════════════════════════════════════════════════════════════════════
// WELCOME EMAIL API ROUTE
// /api/send-welcome-email/route.ts
// Sends welcome email when user signs up
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { welcomeEmail } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, name, plan } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Missing email or name' }, { status: 400 });
    }

    const { subject, html } = welcomeEmail(name, plan || 'Plus');

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Nyra <onboarding@resend.dev>',
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error('Welcome email error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`📧 Welcome email sent to ${email}`, data);

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error('Welcome email API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
