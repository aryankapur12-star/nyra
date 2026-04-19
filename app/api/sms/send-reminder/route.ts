import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBillReminder } from '@/lib/twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, billId, billName, amount, dueDate, daysUntilDue } = await req.json();

    // Get user's phone number
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone_number, phone_verified, sms_enabled, first_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!profile.phone_number) {
      return NextResponse.json({ error: 'No phone number on file' }, { status: 400 });
    }

    if (!profile.phone_verified) {
      return NextResponse.json({ error: 'Phone number not verified' }, { status: 400 });
    }

    if (!profile.sms_enabled) {
      return NextResponse.json({ error: 'SMS reminders disabled by user' }, { status: 400 });
    }

    // Send the reminder
    const result = await sendBillReminder(
      profile.phone_number,
      billName,
      amount,
      dueDate,
      daysUntilDue
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send SMS' }, { status: 500 });
    }

    // Log the reminder (optional - for tracking)
    await supabase.from('reminder_logs').insert({
      user_id: userId,
      bill_id: billId,
      type: 'sms',
      status: 'sent',
      sent_at: new Date().toISOString(),
    }).catch(() => {}); // Don't fail if logging fails

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder sent successfully',
    });

  } catch (error: any) {
    console.error('Send reminder error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
