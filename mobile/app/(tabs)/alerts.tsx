import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import RiskBadge from '@/components/RiskBadge';
import { useApp } from '@/lib/AppContext';
import { theme } from '@/lib/theme';

export default function AlertsScreen() {
  const { alerts, acknowledgeAlert } = useApp();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {alerts.length === 0 ? (
        <Text style={styles.empty}>No alerts yet. Run a Heavy Rain or Critical scenario from the Dashboard.</Text>
      ) : (
        alerts.map((a) => (
          <View key={a.id} style={styles.card}>
            <View style={styles.row}>
              <RiskBadge level={a.level} />
              <Text style={styles.status}>{a.status}</Text>
            </View>
            <Text style={styles.message}>{a.message}</Text>
            <Text style={styles.time}>{new Date(a.createdAt).toLocaleString()}</Text>
            {a.status === 'ACTIVE' ? (
              <Pressable style={styles.ackButton} onPress={() => acknowledgeAlert(a.id)}>
                <Text style={styles.ackText}>Acknowledge</Text>
              </Pressable>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { color: theme.textMuted, fontSize: 11, fontWeight: '700' },
  message: { color: theme.text, fontSize: 13 },
  time: { color: theme.textMuted, fontSize: 11 },
  ackButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.surfaceAlt,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  ackText: { color: theme.accent, fontSize: 12, fontWeight: '700' },
});
