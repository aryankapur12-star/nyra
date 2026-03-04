import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, billCount } = await req.json();

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    if (billCount === 0) {
      // Cancel at period end — they keep access until their billing cycle ends
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      return NextResponse.json({ success: true, action: 'cancelled_at_period_end' });
    } else {
      // Update quantity to match new bill count
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      const itemId = subscription.items.data[0].id;
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: false, // in case they re-added a bill after cancelling
        items: [{ id: itemId, quantity: billCount }],
      });
      return NextResponse.json({ success: true, action: 'updated', billCount });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}