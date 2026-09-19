import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/lib/AppContext";
import { SCENARIOS } from "@/lib/scenarios";
import { theme } from "@/lib/theme";
import { ScenarioId } from "@/lib/types";

const ORDER: ScenarioId[] = ["NORMAL", "HEAVY_RAIN", "CRITICAL_LANDSLIDE_RISK"];

export default function ScenarioSwitcher() {
  const { scenario, runScenario } = useApp();

  return (
    <View>
      <Text style={styles.title}>Simulator scenario</Text>
      <View style={styles.row}>
        {ORDER.map((id) => {
          const active = id === scenario;
          return (
            <Pressable
              key={id}
              onPress={() => runScenario(id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{SCENARIOS[id].label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.desc}>{SCENARIOS[scenario].description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.textMuted, fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipActive: {
    backgroundColor: theme.accent + "22",
    borderColor: theme.accent,
  },
  chipText: { color: theme.textMuted, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: theme.accent },
  desc: { color: theme.textMuted, fontSize: 12, marginTop: 8 },
});
