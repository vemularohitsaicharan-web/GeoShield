import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import AlertBanner from '@/components/AlertBanner';
import RoleSwitcher from '@/components/RoleSwitcher';
import ScenarioSwitcher from '@/components/ScenarioSwitcher';
import StatCard from '@/components/StatCard';
import { useApp } from '@/lib/AppContext';
import { RISK_COLORS, theme } from '@/lib/theme';
import { DEMO_REGION } from '@/lib/demoRegion';

export default function DashboardScreen() {
  const {
    predictions,
    alerts,
    reports,
    aiStatus,
    networkConnected,
    lastPredictionAt,
    refreshAiStatus,
    generateSampleReport,
    resetDemo,
  } = useApp();
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await generateSampleReport();
    } finally {
      setGenerating(false);
    }
  };

  const counts = {
    LOW: predictions.filter((p) => p.risk_level === 'LOW').length,
    MEDIUM: predictions.filter((p) => p.risk_level === 'MEDIUM').length,
    HIGH: predictions.filter((p) => p.risk_level === 'HIGH').length,
    CRITICAL: predictions.filter((p) => p.risk_level === 'CRITICAL').length,
  };
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE').length;
  const pendingReports = reports.filter((r) => r.status === 'PENDING_SYNC').length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refreshAiStatus} tintColor={theme.accent} />}
    >
      <RoleSwitcher />

      <AlertBanner />

      <Text style={styles.region}>{DEMO_REGION.name}</Text>

      <View style={styles.grid}>
        <StatCard label="Monitored zones" value={predictions.length} />
        <StatCard label="Active alerts" value={activeAlerts} accentColor={activeAlerts ? RISK_COLORS.HIGH : undefined} />
        <StatCard label="High-risk zones" value={counts.HIGH} accentColor={RISK_COLORS.HIGH} />
        <StatCard label="Critical zones" value={counts.CRITICAL} accentColor={RISK_COLORS.CRITICAL} />
        <StatCard label="Field reports" value={reports.length} />
        <StatCard label="Pending sync" value={pendingReports} />
      </View>

      <View style={styles.section}>
        <ScenarioSwitcher />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Demo mode</Text>
        <Text style={styles.hint}>
          One-tap actions for a live run-through — generates a report tied to the current scenario and
          highest-risk zone, then syncs it through AI analysis automatically.
        </Text>
        <View style={styles.demoRow}>
          <Pressable style={styles.demoButton} onPress={handleGenerateReport} disabled={generating}>
            <Text style={styles.demoButtonText}>
              {generating ? 'Generating…' : 'Generate sample field report'}
            </Text>
          </Pressable>
          <Pressable style={styles.demoButtonOutline} onPress={resetDemo}>
            <Text style={styles.demoButtonOutlineText}>Reset demo data</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System health</Text>
        <View style={styles.healthRow}>
          <Text style={styles.healthLabel}>Database</Text>
          <Text style={styles.healthValue}>LOCAL (demo)</Text>
        </View>
        <View style={styles.healthRow}>
          <Text style={styles.healthLabel}>AI service (Groq)</Text>
          <Text
            style={[
              styles.healthValue,
              {
                color:
                  aiStatus === 'ONLINE'
                    ? RISK_COLORS.LOW
                    : aiStatus === 'FALLBACK_ONLY'
                      ? RISK_COLORS.MEDIUM
                      : RISK_COLORS.HIGH,
              },
            ]}
          >
            {aiStatus === 'ONLINE'
              ? 'ONLINE'
              : aiStatus === 'FALLBACK_ONLY'
                ? 'FALLBACK MODE'
                : aiStatus === 'CHECKING'
                  ? 'CHECKING'
                  : 'OFFLINE'}
          </Text>
        </View>
        <View style={styles.healthRow}>
          <Text style={styles.healthLabel}>Device network</Text>
          <Text style={[styles.healthValue, { color: networkConnected ? RISK_COLORS.LOW : RISK_COLORS.HIGH }]}>
            {networkConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </Text>
        </View>
        <View style={styles.healthRow}>
          <Text style={styles.healthLabel}>Simulator</Text>
          <Text style={styles.healthValue}>ACTIVE</Text>
        </View>
        <View style={styles.healthRow}>
          <Text style={styles.healthLabel}>Pending offline reports</Text>
          <Text style={styles.healthValue}>{pendingReports}</Text>
        </View>
        <View style={styles.healthRow}>
          <Text style={styles.healthLabel}>Last prediction</Text>
          <Text style={styles.healthValue}>
            {lastPredictionAt ? new Date(lastPredictionAt).toLocaleTimeString() : '—'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  region: { color: theme.textMuted, fontSize: 12, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  section: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  sectionTitle: { color: theme.text, fontWeight: '700', marginBottom: 10, fontSize: 14 },
  hint: { color: theme.textMuted, fontSize: 12, marginBottom: 12 },
  demoRow: { gap: 8 },
  demoButton: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  demoButtonText: { color: theme.accentText, fontWeight: '700', fontSize: 13 },
  demoButtonOutline: {
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  demoButtonOutlineText: { color: theme.textMuted, fontWeight: '700', fontSize: 13 },
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  healthLabel: { color: theme.textMuted, fontSize: 13 },
  healthValue: { color: theme.text, fontSize: 13, fontWeight: '600' },
});
