import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import RiskBadge from '@/components/RiskBadge';
import { useApp } from '@/lib/AppContext';
import { DEMO_REGION } from '@/lib/demoRegion';
import { theme } from '@/lib/theme';
import { ObservedSign } from '@/lib/types';

const SIGNS: { id: ObservedSign; label: string }[] = [
  { id: 'ground_cracks', label: 'Ground cracks' },
  { id: 'soil_movement', label: 'Soil movement' },
  { id: 'rockfall', label: 'Rockfall' },
  { id: 'mud_accumulation', label: 'Mud accumulation' },
  { id: 'road_obstruction', label: 'Road obstruction' },
  { id: 'drainage_blockage', label: 'Drainage blockage' },
  { id: 'unusual_water_flow', label: 'Unusual water flow' },
  { id: 'other', label: 'Other' },
];

export default function ReportsScreen() {
  const {
    reports,
    role,
    isOffline,
    networkConnected,
    effectiveOffline,
    setOffline,
    submitReport,
    syncPendingReports,
    verifyReport,
  } = useApp();

  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [signs, setSigns] = useState<ObservedSign[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const toggleSign = (id: ObservedSign) => {
    setSigns((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const captureLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      // Fall back to the demo region centroid so the flow keeps working
      // (e.g. during a desk demo without GPS/location permission).
      setCoords({
        lat: (DEMO_REGION.bbox.minLat + DEMO_REGION.bbox.maxLat) / 2,
        lon: (DEMO_REGION.bbox.minLon + DEMO_REGION.bbox.maxLon) / 2,
      });
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!coords) {
      Alert.alert('Location required', 'Capture a location before submitting.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description required', 'Describe what was observed.');
      return;
    }
    setSubmitting(true);
    try {
      await submitReport({
        lat: coords.lat,
        lon: coords.lon,
        description,
        severity,
        observedSigns: signs,
        reporter: `${role.replace('_', ' ')} (demo user)`,
        photoUri,
      });
      setDescription('');
      setSigns([]);
      setPhotoUri(undefined);
      setCoords(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncPendingReports();
    } finally {
      setSyncing(false);
    }
  };

  const pendingCount = reports.filter((r) => r.status === 'PENDING_SYNC').length;
  const canVerify = role === 'AUTHORITY' || role === 'ADMIN';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <View style={styles.offlineRow}>
          <View>
            <Text style={styles.sectionTitle}>Field report</Text>
            <Text style={styles.hint}>Offline-first: reports queue locally and sync when back online.</Text>
          </View>
          <View style={styles.offlineSwitch}>
            <Text style={styles.offlineLabel}>{isOffline ? 'FORCED OFFLINE' : 'DEMO OVERRIDE'}</Text>
            <Switch value={isOffline} onValueChange={setOffline} />
          </View>
        </View>

        <View style={styles.networkRow}>
          <View style={[styles.networkDot, { backgroundColor: networkConnected ? '#15803d' : '#b91c1c' }]} />
          <Text style={styles.networkText}>
            Device network: {networkConnected ? 'connected' : 'no connection'}
            {isOffline ? ' (demo override forces offline regardless)' : ''}
          </Text>
        </View>

        <Pressable style={styles.button} onPress={captureLocation}>
          <Text style={styles.buttonText}>{coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : 'Capture GPS location'}</Text>
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Describe what you observed..."
          placeholderTextColor={theme.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.hint}>Severity</Text>
        <View style={styles.row}>
          {(['LOW', 'MEDIUM', 'HIGH'] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSeverity(s)}
              style={[styles.severityChip, severity === s && styles.severityChipActive]}
            >
              <Text style={[styles.severityText, severity === s && styles.severityTextActive]}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.hint}>Observed signs</Text>
        <View style={styles.signsGrid}>
          {SIGNS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => toggleSign(s.id)}
              style={[styles.signChip, signs.includes(s.id) && styles.signChipActive]}
            >
              <Text style={[styles.signText, signs.includes(s.id) && styles.signTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.button} onPress={pickPhoto}>
          <Text style={styles.buttonText}>{photoUri ? 'Photo attached ✓' : 'Attach photo'}</Text>
        </Pressable>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.photoPreview} /> : null}

        <Pressable style={[styles.button, styles.submitButton]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit report'}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.offlineRow}>
          <Text style={styles.sectionTitle}>Reports ({reports.length})</Text>
          <Pressable onPress={handleSync} disabled={effectiveOffline || syncing || pendingCount === 0}>
            <Text style={[styles.syncLink, (effectiveOffline || pendingCount === 0) && styles.syncLinkDisabled]}>
              {syncing ? 'Syncing...' : `Sync (${pendingCount})`}
            </Text>
          </Pressable>
        </View>

        {reports.length === 0 ? (
          <Text style={styles.hint}>No reports yet. Submit one above.</Text>
        ) : (
          reports.map((r) => (
            <View key={r.id} style={styles.reportCard}>
              <View style={styles.offlineRow}>
                <Text style={styles.reportDesc}>{r.description || '(no description)'}</Text>
                <RiskBadge level={(r.severity === 'HIGH' ? 'HIGH' : r.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW') as any} size="sm" />
              </View>
              <Text style={styles.reportMeta}>
                {r.reporter} · {new Date(r.timestamp).toLocaleString()} · {r.status}
              </Text>
              {r.ai ? (
                <View style={styles.aiBox}>
                  <Text style={styles.aiLabel}>
                    AI analysis ({r.ai.source === 'groq' ? 'Groq' : 'fallback — Groq unavailable'})
                  </Text>
                  <Text style={styles.aiText}>{r.ai.summary}</Text>
                  <Text style={styles.aiMeta}>
                    category: {r.ai.category} · confidence {Math.round(r.ai.confidence * 100)}%
                  </Text>
                </View>
              ) : null}
              {canVerify && (r.status === 'SYNCED' || r.status === 'UNDER_REVIEW') ? (
                <View style={styles.row}>
                  <Pressable style={styles.verifyBtn} onPress={() => verifyReport(r.id, 'VERIFIED')}>
                    <Text style={styles.verifyText}>Verify</Text>
                  </Pressable>
                  <Pressable style={styles.rejectBtn} onPress={() => verifyReport(r.id, 'REJECTED')}>
                    <Text style={styles.rejectText}>Reject</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  sectionTitle: { color: theme.text, fontWeight: '700', fontSize: 15 },
  hint: { color: theme.textMuted, fontSize: 12 },
  offlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offlineSwitch: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offlineLabel: { color: theme.textMuted, fontSize: 11, fontWeight: '700' },
  networkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  networkDot: { width: 7, height: 7, borderRadius: 4 },
  networkText: { color: theme.textMuted, fontSize: 11 },
  button: {
    backgroundColor: theme.surfaceAlt,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  buttonText: { color: theme.text, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: theme.surfaceAlt,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: theme.text,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  severityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.border,
  },
  severityChipActive: { backgroundColor: theme.accent + '22', borderColor: theme.accent },
  severityText: { color: theme.textMuted, fontSize: 12, fontWeight: '600' },
  severityTextActive: { color: theme.accent },
  signsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  signChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.border,
  },
  signChipActive: { backgroundColor: theme.accent + '22', borderColor: theme.accent },
  signText: { color: theme.textMuted, fontSize: 11 },
  signTextActive: { color: theme.accent },
  photoPreview: { width: '100%', height: 140, borderRadius: 10 },
  submitButton: { backgroundColor: theme.accent, borderColor: theme.accent },
  submitText: { color: theme.accentText, fontWeight: '800', fontSize: 14 },
  syncLink: { color: theme.accent, fontSize: 12, fontWeight: '700' },
  syncLinkDisabled: { color: theme.textMuted },
  reportCard: {
    backgroundColor: theme.surfaceAlt,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  reportDesc: { color: theme.text, fontSize: 13, flex: 1, marginRight: 8 },
  reportMeta: { color: theme.textMuted, fontSize: 11 },
  aiBox: { backgroundColor: theme.bg, borderRadius: 8, padding: 8, gap: 3 },
  aiLabel: { color: theme.accent, fontSize: 11, fontWeight: '700' },
  aiText: { color: theme.text, fontSize: 12 },
  aiMeta: { color: theme.textMuted, fontSize: 10 },
  verifyBtn: { backgroundColor: '#15803d14', borderColor: '#15803d', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  verifyText: { color: '#15803d', fontWeight: '700', fontSize: 12 },
  rejectBtn: { backgroundColor: '#b91c1c14', borderColor: '#b91c1c', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  rejectText: { color: '#b91c1c', fontWeight: '700', fontSize: 12 },
});
