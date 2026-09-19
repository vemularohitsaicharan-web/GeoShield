import { UserRole } from "./types";

/**
 * Fixed demo login accounts, one per role — see scripts/create-demo-user.mjs
 * (which created these in Supabase) and mobile/app/login.tsx (which lists
 * them). The shared password is intentionally not a meaningful secret: it
 * only gates a hackathon demo project's own throwaway accounts, so it's
 * fine to ship in the app bundle rather than route through .env.
 */
export const DEMO_PASSWORD = "kaebtQyvyuigRrJ8IA2FuXwn";

export const DEMO_ACCOUNTS: { role: UserRole; email: string; label: string }[] = [
  { role: "ADMIN", email: "admin@geoshield-ner.demo", label: "Admin" },
  { role: "AUTHORITY", email: "authority@geoshield-ner.demo", label: "Authority" },
  { role: "FIELD_OFFICER", email: "field-officer@geoshield-ner.demo", label: "Field Officer" },
  { role: "ANALYST", email: "analyst@geoshield-ner.demo", label: "Analyst" },
  { role: "VIEWER", email: "viewer@geoshield-ner.demo", label: "Viewer" },
];
