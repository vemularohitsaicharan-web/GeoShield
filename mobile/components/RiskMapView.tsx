import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { DEMO_REGION, HISTORICAL_LANDSLIDES, ROADS, TERRAIN_CELLS, VILLAGES } from "@/lib/demoRegion";
import { theme, RISK_COLORS } from "@/lib/theme";
import { RiskPrediction } from "@/lib/types";

/**
 * Native Google Maps (react-native-maps + PROVIDER_GOOGLE) requires an
 * API key baked into the app's native config at build time — that only
 * works in a custom dev client or EAS build, never in plain Expo Go
 * (a pre-built shell binary that can't accept custom native config).
 * A WebView running Leaflet + free OpenStreetMap tiles needs no API key
 * and works identically in Expo Go, a dev client, or a production build,
 * so it's the map implementation used everywhere (this file replaces
 * what was previously a native-only view with a web-preview fallback).
 */
export default function RiskMapView({
  predictions,
  onSelectCell,
}: {
  predictions: RiskPrediction[];
  onSelectCell?: (cellId: string) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const lastMessageRef = useRef<string | null>(null);

  const html = useMemo(() => buildMapHtml(predictions), [predictions]);

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.map}
        onLoadEnd={() => setLoaded(true)}
        onMessage={(event) => {
          const cellId = event.nativeEvent.data;
          if (cellId && cellId !== lastMessageRef.current) {
            lastMessageRef.current = cellId;
            onSelectCell?.(cellId);
          }
        }}
      />
      {!loaded ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      ) : null}
    </View>
  );
}

function buildMapHtml(predictions: RiskPrediction[]): string {
  const centerLat = (DEMO_REGION.bbox.minLat + DEMO_REGION.bbox.maxLat) / 2;
  const centerLon = (DEMO_REGION.bbox.minLon + DEMO_REGION.bbox.maxLon) / 2;

  const cellsData = TERRAIN_CELLS.map((cell) => {
    const prediction = predictions.find((p) => p.cellId === cell.id);
    const color = prediction ? RISK_COLORS[prediction.risk_level] : "#94a3b8";
    const detail = prediction
      ? `${prediction.risk_level} &middot; score ${prediction.risk_score.toFixed(2)} &middot; model ${prediction.model_version}`
      : "Awaiting prediction";
    return { id: cell.id, name: cell.name, lat: cell.lat, lon: cell.lon, color, detail };
  });

  const historicalData = HISTORICAL_LANDSLIDES.map((h) => ({
    lat: h.lat,
    lon: h.lon,
    label: `Historical event (${h.year})`,
    note: h.note,
  }));

  const villagesData = VILLAGES.map((v) => ({
    lat: v.lat,
    lon: v.lon,
    label: v.name,
    note: `Population (est.): ${v.population_est}`,
  }));

  const roadsData = ROADS.map((r) => ({ name: r.name, path: r.path }));

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: ${theme.bg}; }
    .leaflet-popup-content { font-family: system-ui, sans-serif; font-size: 13px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLon}], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    var roads = ${JSON.stringify(roadsData)};
    roads.forEach(function (road) {
      L.polyline(road.path, { color: '${theme.accent}', weight: 3 }).addTo(map).bindPopup(road.name);
    });

    var cells = ${JSON.stringify(cellsData)};
    cells.forEach(function (cell) {
      L.circle([cell.lat, cell.lon], { radius: 900, color: cell.color, fillColor: cell.color, fillOpacity: 0.25, weight: 2 }).addTo(map);
      var marker = L.circleMarker([cell.lat, cell.lon], { radius: 9, color: '#ffffff', weight: 2, fillColor: cell.color, fillOpacity: 1 }).addTo(map);
      marker.bindPopup('<b>' + cell.name + '</b><br/>' + cell.detail);
      marker.on('click', function () {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(cell.id);
      });
    });

    var historical = ${JSON.stringify(historicalData)};
    historical.forEach(function (h) {
      L.marker([h.lat, h.lon], {
        icon: L.divIcon({ className: '', html: '<div style="width:10px;height:10px;border-radius:50%;background:#7c3aed;border:2px solid #fff;"></div>', iconSize: [10, 10] })
      }).addTo(map).bindPopup('<b>' + h.label + '</b><br/>' + h.note);
    });

    var villages = ${JSON.stringify(villagesData)};
    villages.forEach(function (v) {
      L.marker([v.lat, v.lon], {
        icon: L.divIcon({ className: '', html: '<div style="width:10px;height:10px;border-radius:50%;background:#2563eb;border:2px solid #fff;"></div>', iconSize: [10, 10] })
      }).addTo(map).bindPopup('<b>' + v.label + '</b><br/>' + v.note);
    });
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, backgroundColor: theme.bg },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.bg,
  },
});
