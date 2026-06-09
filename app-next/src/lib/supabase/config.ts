export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.includes("YOUR_PROJECT_REF") || anonKey.includes("YOUR_")) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return getSupabasePublicConfig() !== null;
}
