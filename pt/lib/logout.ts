import { createClient } from '@/lib/supabase/client';

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  document.cookie = 'ptone_session=; path=/; max-age=0; SameSite=Lax';
  window.location.href = '/login';
}
