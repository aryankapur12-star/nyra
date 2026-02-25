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
    const { sessionId } = await req.json();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    const customerId = session.customer as string;
    const subscriptionId = (session.subscription as any)?.id;
    const email = session.customer_email || (session.customer_details?.email ?? '');

   const { data: userData } = await supabase.auth.admin.listUsers();
const matchedUser = userData?.users?.find((u: any) => u.email === email);

await supabase
  .from('profiles')
  .update({ stripe_customer_id: customerId, stripe_subscription_id: subscriptionId })
  .eq('id', matchedUser?.id ?? '');
```

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

Finally add your Supabase service role key to `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
