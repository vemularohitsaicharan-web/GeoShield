import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import MapErrorBoundary from '@/components/MapErrorBoundary';
import RiskBadge from '@/components/RiskBadge';
import RiskMapView from '@/components/RiskMapView';
import { useApp } from '@/lib/AppContext';
import { TERRAIN_CELLS } from '@/lib/demoRegion';
import { RISK_COLORS, theme } from '@/lib/theme';

export default function RiskMapScreen() {
  const { predictions } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCell = TERRAIN_CELLS.find((c) => c.id === selectedId);
  const selectedPrediction = predictions.find((p) => p.cellId === selectedId);

  return (
    <View style={styles.screen}>
      <MapErrorBoundary>
        <RiskMapView predictions={predictions} onSelectCell={setSelectedId} />
      </MapErrorBoundary>

      <View style={styles.legend}>
        {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((level) => (
          <View key={level} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: RISK_COLORS[level] }]} />
            <Text style={styles.legendText} allowFontScaling={false} numberOfLines={1}>
              {level}
            </Text>
          </View>
        ))}
      </View>

      {selectedCell && selectedPrediction ? (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{selectedCell.name}</Text>
            <View style={styles.detailHeaderRight}>
              <RiskBadge level={selectedPrediction.risk_level} />
              <Pressable onPress={() => setSelectedId(null)} hitSlop={8}>
                <Text style={styles.closeButton}>✕</Text>
              </Pressable>
            </View>
          </View>
          <DetailRow label="Risk score" value={selectedPrediction.risk_score.toFixed(2)} />
          <DetailRow label="Confidence" value={`${Math.round(selectedPrediction.confidence * 100)}%`} />
          <DetailRow label="Rainfall (24h)" value={`${selectedPrediction.inputs.rainfall_24h} mm`} />
          <DetailRow label="Soil moisture" value={`${selectedPrediction.inputs.soil_moisture}%`} />
          <DetailRow label="Slope" value={`${selectedPrediction.inputs.slope_degrees}°`} />
          <DetailRow label="Historical events nearby" value={String(selectedPrediction.inputs.historical_landslide_density)} />
          <DetailRow label="Model version" value={selectedPrediction.model_version} />
          <DetailRow label="Updated" value={new Date(selectedPrediction.computed_at).toLocaleTimeString()} />
        </View>
      ) : null}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  legend: {
    position: 'absolute',
    top: 12,
    right: 12,
    minWidth: 92,
    backgroundColor: theme.surface + 'ee',
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 5,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendText: { color: theme.text, fontSize: 11, flexShrink: 0 },
  detailCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detailHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  closeButton: { color: theme.textMuted, fontSize: 16, fontWeight: '700', padding: 4 },
  detailTitle: { color: theme.text, fontWeight: '800', fontSize: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  detailLabel: { color: theme.textMuted, fontSize: 12 },
  detailValue: { color: theme.text, fontSize: 12, fontWeight: '600' },
});
