import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useApp } from "@/lib/AppContext";
import { theme } from "@/lib/theme";
import { UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["ADMIN", "AUTHORITY", "FIELD_OFFICER", "ANALYST", "VIEWER"];

export default function RoleSwitcher() {
  const { role, setRole } = useApp();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {ROLES.map((r) => {
        const active = r === role;
        return (
          <Pressable key={r} onPress={() => setRole(r)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.text, active && styles.textActive]}>{r.replace("_", " ")}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  text: { color: theme.textMuted, fontSize: 12, fontWeight: "600" },
  textActive: { color: theme.accentText },
});
