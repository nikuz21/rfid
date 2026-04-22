import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export async function signInSupabaseWithPassword(email: string, password: string) {
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return null;
  }
  return data.user ?? null;
}

export async function getSupabaseUserFromToken(token: string) {
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    return null;
  }
  return data.user ?? null;
}
