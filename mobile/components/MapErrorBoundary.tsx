import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/lib/theme";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Native maps depend on platform services (Google Play services on
 * Android, Apple Maps on iOS) that can be missing or misconfigured on a
 * given device/emulator. If the map view throws during render, this
 * keeps the rest of the app (dashboard, reports, alerts) usable instead
 * of crashing the whole screen.
 */
export default class MapErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("RiskMapView failed to render:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Map unavailable on this device</Text>
          <Text style={styles.hint}>
            This can happen without Google Play services configured. The rest of the app (Dashboard, Reports,
            Alerts, Analytics) is unaffected.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: theme.bg },
  title: { color: theme.text, fontWeight: "700", fontSize: 15, marginBottom: 8, textAlign: "center" },
  hint: { color: theme.textMuted, fontSize: 13, textAlign: "center" },
});
