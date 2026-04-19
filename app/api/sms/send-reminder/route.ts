import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, billId, billName, amount, dueDate, phoneNumber } = await request.json();

    // Validate required fields
    if (!phoneNumber || !billName || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, billName, amount, dueDate' },
        { status: 400 }
      );
    }

    // Format the reminder message
    const formattedDate = new Date(dueDate + 'T00:00:00').toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric'
    });
    
    const message = `👋 Hey! Your ${billName} bill of $${amount} is due ${formattedDate}. Don't forget to pay it on time! — Nyra`;

    // Send the SMS
    const result = await sendSMS(phoneNumber, message);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      );
    }

    // Log the reminder to the database (don't fail if this fails)
    if (userId && billId) {
      try {
        await supabase.from('reminder_logs').insert({
          user_id: userId,
          bill_id: billId,
          bill_name: billName,
          amount: amount,
          type: 'sms',
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
      } catch {
        // Don't fail if logging fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      message: 'Reminder sent successfully'
    });

  } catch (error) {
    console.error('Send reminder error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
