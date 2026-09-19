// One-off script: creates (or resets) one Supabase Auth user PER ROLE,
// each with email_confirm set so no confirmation flow is needed, and
// writes their profiles.role row immediately via the service-role key.
//
// This backs the app's Login screen (mobile/app/login.tsx) — tapping a
// role there signs in as that role's fixed demo account. Real Supabase
// Auth + RLS, no anonymous-sign-ins dependency (that project toggle
// proved unreliable during setup — see docs/security.md).
//
// Run manually: node scripts/create-demo-user.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf-8");
  const out = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return out;
}

const env = { ...loadEnvFile(join(__dirname, "../server/.env")), ...process.env };
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_PASSWORD = env.DEMO_PASSWORD;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DEMO_PASSWORD) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DEMO_PASSWORD in server/.env");
  process.exit(1);
}

// Mirrors mobile/lib/demoAccounts.ts — keep both in sync.
const ROLES = ["ADMIN", "AUTHORITY", "FIELD_OFFICER", "ANALYST", "VIEWER"];
const emailFor = (role) => `${role.toLowerCase().replace("_", "-")}@geoshield-ner.demo`;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  for (const role of ROLES) {
    const email = emailFor(role);
    let userId = list.users.find((u) => u.email === email)?.id;

    if (userId) {
      console.log(`${role}: user exists (${userId}), updating password.`);
      const { error } = await supabase.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD });
      if (error) throw error;
    } else {
      console.log(`${role}: creating user ${email}...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
      userId = data.user.id;
      console.log(`${role}: created ${userId}.`);
    }

    const { error: profileError } = await supabase.from("profiles").upsert({ id: userId, role });
    if (profileError) throw profileError;
  }

  console.log("Done. All 5 role accounts ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
