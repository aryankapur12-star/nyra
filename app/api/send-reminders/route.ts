import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    // Get all bills with their user profiles
    const { data: bills, error } = await supabase
      .from('bills')
      .select('*, profiles(phone_number, full_name)')
      .eq('recurring', true);

    if (error) throw error;

    const today = new Date();
    const reminders_sent = [];

    for (const bill of bills || []) {
      const dueDate = new Date(bill.due_date);
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const remindDays = bill.remind_days_before || 3;
      const phone = (bill.profiles as any)?.phone_number;
      const name = (bill.profiles as any)?.full_name?.split(' ')[0] || 'there';

      if (daysUntil === remindDays && phone) {
        await twilioClient.messages.create({
          body: `Hey ${name}! 👋 Just a reminder from Nyra — your ${bill.bill_name} payment of $${bill.amount} is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}. Stay on top of it! 💸`,
          from: process.env.TWILIO_PHONE_NUMBER!,
          to: phone,
        });
        reminders_sent.push(bill.bill_name);
      }
    }

    return NextResponse.json({ success: true, reminders_sent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}