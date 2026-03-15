import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, name, plan } = await req.json();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const priceMap: Record<string, string> = { Basic: '$3.39', Plus: '$5.65', Power: '$9.04' };
    const price = priceMap[plan] || '$5.65';

    // Send welcome email via Supabase Auth Admin API
    // This uses your configured SMTP in Supabase dashboard
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        data: { name, plan }
      }
    });

    // Send custom welcome email using fetch to your SMTP
    // We use the Supabase Edge Function approach via their email API
    const emailRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        to: email,
        subject: `Welcome to Nyra, ${name}! 🎉`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; background: #eef3fb; padding: 40px 20px;">
            <div style="background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 24px rgba(33,119,209,.08);">
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.6rem; color: #2177d1; margin-bottom: 8px; letter-spacing: -.03em;">
                Nyra ✦
              </div>
              <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.4rem; color: #0c1524; margin: 24px 0 8px; letter-spacing: -.03em;">
                Welcome, ${name}! 🎉
              </h1>
              <p style="color: #3a4f6a; font-size: .92rem; line-height: 1.7; margin-bottom: 20px;">
                You're now on the <strong>${plan} Plan</strong> (${price}/mo incl. tax). Here's what to do first:
              </p>
              <div style="background: #eef3fb; border-radius: 14px; padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  ${['➕ Add your first bill — takes 30 seconds', '📱 Set your phone number for SMS reminders', '💰 Set up your Payday cashflow timeline', '✦ Ask the Nyra AI coach anything about your finances'].map(step => `
                    <div style="display: flex; align-items: center; gap: 10px; font-size: .85rem; color: #0c1524;">
                      ${step}
                    </div>
                  `).join('')}
                </div>
              </div>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard"
                style="display: block; text-align: center; background: #2177d1; color: white; padding: 14px 28px; border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: .9rem; text-decoration: none; margin-bottom: 24px;">
                Go to my dashboard →
              </a>
              <p style="font-size: .76rem; color: #7a90aa; line-height: 1.6; border-top: 1px solid #e5eaf3; padding-top: 20px; margin: 0;">
                20% of Nyra profits go to <strong>Financial Futures Education</strong> — delivering financial literacy to youth across Canada. Thank you for being part of the mission. 🍁
              </p>
            </div>
          </div>
        `
      })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
