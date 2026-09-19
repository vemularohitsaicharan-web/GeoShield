import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/lib/theme";

export default function StatCard({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: string | number;
  accentColor?: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, accentColor ? { color: accentColor } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    minWidth: "45%",
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  value: {
    color: theme.text,
    fontSize: 26,
    fontWeight: "800",
  },
  label: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
