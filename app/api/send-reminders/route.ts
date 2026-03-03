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
    const { data: bills, error } = await supabase
      .from('bills')
      .select('*, profiles(phone_number, full_name)')
      .eq('recurring', true);

    if (error) throw error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group bills by user phone + days until due
    const userMap: Record<string, { phone: string; name: string; bills: { name: string; amount: number; daysUntil: number }[] }> = {};

    for (const bill of bills || []) {
      const dueDate = new Date(bill.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const remindDays = bill.remind_days_before || 3;
      const phone = (bill.profiles as any)?.phone_number;
      const name = (bill.profiles as any)?.full_name?.split(' ')[0] || 'there';

      if (daysUntil === remindDays && phone) {
        const key = `${phone}_${daysUntil}`;
        if (!userMap[key]) {
          userMap[key] = { phone, name, bills: [] };
        }
        userMap[key].bills.push({ name: bill.bill_name, amount: bill.amount, daysUntil });
      }
    }

    const reminders_sent: string[] = [];

    for (const { phone, name, bills } of Object.values(userMap)) {
      const daysUntil = bills[0].daysUntil;
      const dayText = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;

      let billList: string;
      if (bills.length === 1) {
        billList = `${bills[0].name} ($${bills[0].amount})`;
      } else {
        const items = bills.map(b => `${b.name} ($${b.amount})`);
        billList = items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
      }

      await twilioClient.messages.create({
        body: `Hey ${name}! 👋 Nyra reminder: ${bills.length > 1 ? 'these bills are' : 'this bill is'} due ${dayText}: ${billList}. Don't forget! 💸`,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: phone,
      });

      reminders_sent.push(...bills.map(b => b.name));
    }

    return NextResponse.json({ success: true, reminders_sent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}