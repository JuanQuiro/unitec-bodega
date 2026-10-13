import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/health — para Uptime Kuma o cualquier monitor.
// 200 = app + base de datos responden.
export async function GET() {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('stores').select('id').limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true, time: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
