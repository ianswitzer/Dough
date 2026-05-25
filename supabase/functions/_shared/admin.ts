import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function serviceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing service role environment');
  return createClient(supabaseUrl, serviceRoleKey);
}
