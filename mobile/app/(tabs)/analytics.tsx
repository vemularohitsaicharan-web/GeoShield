import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/lib/AppContext';
import { RISK_COLORS, theme } from '@/lib/theme';
import { RiskLevel } from '@/lib/types';

const LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function AnalyticsScreen() {
  const { predictions, reports, alerts, resetDemo } = useApp();

  const counts = LEVELS.map((level) => ({
    level,
    count: predictions.filter((p) => p.risk_level === level).length,
  }));
  const maxCount = Math.max(1, ...counts.map((c) => c.count));

  const verified = reports.filter((r) => r.status === 'VERIFIED').length;
  const rejected = reports.filter((r) => r.status === 'REJECTED').length;
  const resolvedAlerts = alerts.filter((a) => a.status !== 'ACTIVE').length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current risk distribution</Text>
        {counts.map(({ level, count }) => (
          <View key={level} style={styles.barRow}>
            <Text style={styles.barLabel}>{level}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${(count / maxCount) * 100}%`, backgroundColor: RISK_COLORS[level] },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{count}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historical / event summary</Text>
        <Row label="Total field reports" value={reports.length} />
        <Row label="Verified reports" value={verified} />
        <Row label="Rejected reports" value={rejected} />
        <Row label="Total alerts raised" value={alerts.length} />
        <Row label="Alerts resolved/acknowledged" value={resolvedAlerts} />
      </View>

      <Pressable style={styles.resetButton} onPress={resetDemo}>
        <Text style={styles.resetText}>Reset demo data</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  section: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sectionTitle: { color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { color: theme.textMuted, fontSize: 11, width: 64 },
  barTrack: { flex: 1, height: 10, backgroundColor: theme.surfaceAlt, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  barValue: { color: theme.text, fontSize: 12, width: 20, textAlign: 'right' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: theme.textMuted, fontSize: 13 },
  rowValue: { color: theme.text, fontSize: 13, fontWeight: '700' },
  resetButton: {
    borderColor: '#b91c1c',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  resetText: { color: '#b91c1c', fontWeight: '700' },
});
