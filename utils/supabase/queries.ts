import { User } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

export async function getUser(
  supabase: ReturnType<typeof createServerClient>
): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
