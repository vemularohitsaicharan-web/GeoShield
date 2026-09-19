import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useApp } from "@/lib/AppContext";
import { RISK_COLORS, theme } from "@/lib/theme";

export default function AlertBanner() {
  const { alerts } = useApp();
  const active = alerts.filter((a) => a.status === "ACTIVE");
  const top = active.find((a) => a.level === "CRITICAL") ?? active[0];

  if (!top) return null;

  const color = RISK_COLORS[top.level];

  return (
    <View style={[styles.banner, { borderColor: color, backgroundColor: color + "1a" }]}>
      <Text style={[styles.level, { color }]}>{top.level} ALERT</Text>
      <Text style={styles.message} numberOfLines={2}>
        {top.message}
      </Text>
      {active.length > 1 ? <Text style={styles.more}>+{active.length - 1} more active</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  level: { fontWeight: "800", fontSize: 12, letterSpacing: 0.5, marginBottom: 2 },
  message: { color: theme.text, fontSize: 13 },
  more: { color: theme.textMuted, fontSize: 11, marginTop: 4 },
});
