import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { phone, code, userId } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
    }

    // Format phone number
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Get the verification code from database
    const { data: verification, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone', formattedPhone)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      await supabase.from('verification_codes').delete().eq('id', verification.id);
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
    }

    // Check attempts
    if (verification.attempts >= MAX_ATTEMPTS) {
      await supabase.from('verification_codes').delete().eq('id', verification.id);
      return NextResponse.json({ error: 'Too many attempts. Please request a new code.' }, { status: 400 });
    }

    // Increment attempts
    await supabase
      .from('verification_codes')
      .update({ attempts: verification.attempts + 1 })
      .eq('id', verification.id);

    // Check code
    if (verification.code !== code) {
      const remainingAttempts = MAX_ATTEMPTS - verification.attempts - 1;
      return NextResponse.json({ 
        error: `Invalid code. ${remainingAttempts} attempts remaining.` 
      }, { status: 400 });
    }

    // Code is valid! Update user's profile
    if (userId) {
      await supabase
        .from('profiles')
        .update({ 
          phone_number: formattedPhone,
          phone_verified: true 
        })
        .eq('id', userId);
    }

    // Delete the used code
    await supabase.from('verification_codes').delete().eq('id', verification.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Phone verified successfully',
      phone: formattedPhone,
    });

  } catch (error: any) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
