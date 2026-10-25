// Only these explicitly public fields can be injected into the browser bundle.
export function publicSupabaseConfig(env) {
  const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '';
  const key =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    '';
  if (key.startsWith('sb_secret_'))
    throw Error('Use a Supabase publishable key, never a secret key, in browser configuration.');
  try {
    const payload = key.split('.')[1];
    if (
      payload &&
      JSON.parse(atob(payload.replaceAll('-', '+').replaceAll('_', '/'))).role === 'service_role'
    )
      throw Error('Service-role keys cannot be used in the browser.');
  } catch (error) {
    if (error.message === 'Service-role keys cannot be used in the browser.') throw error;
  }
  return { url, key };
}
