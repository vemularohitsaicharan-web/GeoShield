import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { TERRAIN_CELLS } from "@/lib/demoRegion";
import RiskBadge from "@/components/RiskBadge";
import { theme } from "@/lib/theme";
import { RiskPrediction } from "@/lib/types";

/**
 * Native maps (react-native-maps) have no reliable web renderer, so the
 * web build (used here only for quick preview during development) shows
 * a list fallback instead. The real interactive GIS map is the native
 * component (RiskMapView.tsx) used on iOS/Android via Expo Go.
 */
export default function RiskMapView({
  predictions,
  onSelectCell,
}: {
  predictions: RiskPrediction[];
  onSelectCell?: (cellId: string) => void;
}) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={styles.notice}>
        Map preview unavailable in web dev mode — this list mirrors the same data the native map renders on
        iOS/Android via Expo Go.
      </Text>
      {TERRAIN_CELLS.map((cell) => {
        const p = predictions.find((pr) => pr.cellId === cell.id);
        return (
          <View key={cell.id} style={styles.row} onTouchEnd={() => onSelectCell?.(cell.id)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{cell.name}</Text>
              <Text style={styles.coords}>
                {cell.lat.toFixed(4)}, {cell.lon.toFixed(4)} · slope {cell.slope_degrees}°
              </Text>
            </View>
            {p ? <RiskBadge level={p.risk_level} /> : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  notice: { color: theme.textMuted, fontSize: 12, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  name: { color: theme.text, fontWeight: "700", fontSize: 14 },
  coords: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
});
