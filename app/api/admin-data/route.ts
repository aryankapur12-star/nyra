import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: bills } = await supabase.from('bills').select('*');

    const users = (authUsers?.users || []).map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id);
      const userBills = bills?.filter(b => b.user_id === authUser.id) || [];
      return {
        id: authUser.id,
        email: authUser.email,
        full_name: profile?.full_name || '',
        phone_number: profile?.phone_number || '',
        created_at: authUser.created_at,
        bills: userBills,
      };
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}