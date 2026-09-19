import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { RISK_COLORS } from "@/lib/theme";
import { RiskLevel } from "@/lib/types";

export default function RiskBadge({ level, size = "md" }: { level: RiskLevel; size?: "sm" | "md" }) {
  const color = RISK_COLORS[level] ?? "#64748b";
  return (
    <View style={[styles.badge, { backgroundColor: color + "26", borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color, fontSize: size === "sm" ? 11 : 13 }]}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
