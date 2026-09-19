import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "./demoAccounts";
import { UserRole } from "./types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
  console.warn(
    "Supabase not configured (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY missing) — " +
      "the app will fall back to local-only state. See mobile/.env.example.",
  );
}

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * There is a real Login screen (mobile/app/login.tsx) backed by one fixed
 * Supabase Auth account per role (created by scripts/create-demo-user.mjs)
 * rather than a free-text signup form — appropriate for a demo/hackathon
 * build where the "users" are five known roles, not arbitrary people.
 * Signing in as a role gives Row Level Security a genuine auth.uid() tied
 * to that role's `profiles.role` row.
 */
export async function signInAsRole(role: UserRole) {
  const account = DEMO_ACCOUNTS.find((a) => a.role === role);
  if (!account) throw new Error(`No demo account configured for role ${role}`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: DEMO_PASSWORD,
  });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getActiveSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function fetchOwnRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return data.role as UserRole;
}
