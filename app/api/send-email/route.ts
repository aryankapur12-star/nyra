// ═══════════════════════════════════════════════════════════════════════════════
// NYRA EMAIL API ROUTE
// /api/send-email/route.ts
// Sends emails using Resend
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  welcomeEmail,
  billReminderEmail,
  paymentConfirmationEmail,
  weeklySummaryEmail,
  verificationCodeEmail,
} from '@/lib/email-templates';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// From address - update this to your verified domain
const FROM_EMAIL = 'Nyra <noreply@nyra-app.com>';
// Fallback for testing (Resend allows this on free tier)
const FROM_EMAIL_TEST = 'Nyra <onboarding@resend.dev>';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, data } = body;

    if (!type || !to) {
      return NextResponse.json({ error: 'Missing type or to address' }, { status: 400 });
    }

    let email: { subject: string; html: string };

    // Generate email based on type
    switch (type) {
      case 'welcome':
        email = welcomeEmail(data.name, data.plan);
        break;

      case 'bill_reminder':
        email = billReminderEmail(
          data.name,
          data.billName,
          data.amount,
          data.dueDate,
          data.daysUntil
        );
        break;

      case 'payment_confirmation':
        email = paymentConfirmationEmail(
          data.name,
          data.plan,
          data.amount,
          data.nextBillingDate
        );
        break;

      case 'weekly_summary':
        email = weeklySummaryEmail(data.name, data.stats);
        break;

      case 'verification_code':
        email = verificationCodeEmail(data.name, data.code);
        break;

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    // Send via Resend
    const { data: result, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || FROM_EMAIL_TEST,
      to: [to],
      subject: email.subject,
      html: email.html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`📧 Email sent: ${type} to ${to}`, result);

    return NextResponse.json({ success: true, id: result?.id });
  } catch (err: any) {
    console.error('Email API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'Email API is running',
    types: ['welcome', 'bill_reminder', 'payment_confirmation', 'weekly_summary', 'verification_code'],
  });
}
