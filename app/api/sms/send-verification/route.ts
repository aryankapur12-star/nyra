import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateVerificationCode, sendVerificationCode } from '@/lib/twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { phone, userId } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Format phone number (ensure it has +1 prefix)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Generate 6-digit code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing codes for this phone
    await supabase
      .from('verification_codes')
      .delete()
      .eq('phone', formattedPhone);

    // Store the code in database
    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert({
        phone: formattedPhone,
        code: code,
        user_id: userId || null,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to store verification code' }, { status: 500 });
    }

    // Send SMS via Twilio
    const result = await sendVerificationCode(formattedPhone, code);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send SMS' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent',
      // Don't send the code back in production! This is just for debugging
      // code: process.env.NODE_ENV === 'development' ? code : undefined,
    });

  } catch (error: any) {
    console.error('Send verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
