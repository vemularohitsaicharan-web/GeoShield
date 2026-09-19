import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DEMO_ACCOUNTS } from "@/lib/demoAccounts";
import { useApp } from "@/lib/AppContext";
import { theme } from "@/lib/theme";
import { UserRole } from "@/lib/types";

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: "Full system access — configuration and user management.",
  AUTHORITY: "Reviews and verifies field reports, manages alerts.",
  FIELD_OFFICER: "Submits geo-tagged field reports, including offline.",
  ANALYST: "Views risk data and historical analytics.",
  VIEWER: "Read-only access to the dashboard and map.",
};

export default function LoginScreen() {
  const { login } = useApp();
  const [pending, setPending] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (role: UserRole) => {
    setPending(role);
    setError(null);
    try {
      await login(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>GeoShield-NER</Text>
      <Text style={styles.subtitle}>Sohra (Cherrapunji) — East Khasi Hills, Meghalaya</Text>
      <Text style={styles.hint}>Sign in with a demo account to continue. Each role has its own account and permissions, enforced by Supabase Row Level Security.</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {DEMO_ACCOUNTS.map((account) => (
          <Pressable
            key={account.role}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => handleLogin(account.role)}
            disabled={pending !== null}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{account.label}</Text>
              {pending === account.role ? <ActivityIndicator size="small" color={theme.accent} /> : null}
            </View>
            <Text style={styles.cardEmail}>{account.email}</Text>
            <Text style={styles.cardDescription}>{ROLE_DESCRIPTIONS[account.role]}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 24, paddingTop: 64, gap: 8 },
  title: { color: theme.text, fontSize: 28, fontWeight: "800" },
  subtitle: { color: theme.textMuted, fontSize: 13, marginBottom: 8 },
  hint: { color: theme.textMuted, fontSize: 13, marginBottom: 20, lineHeight: 19 },
  errorBox: {
    backgroundColor: "#b91c1c14",
    borderColor: "#b91c1c",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: "#b91c1c", fontSize: 13 },
  list: { gap: 12 },
  card: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  cardPressed: { backgroundColor: theme.surfaceAlt },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: theme.text, fontSize: 16, fontWeight: "700" },
  cardEmail: { color: theme.accent, fontSize: 12, marginTop: 2, fontWeight: "600" },
  cardDescription: { color: theme.textMuted, fontSize: 12, marginTop: 6 },
});
