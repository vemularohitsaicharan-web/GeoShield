import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import type MapViewType from "react-native-maps";

import { DEMO_REGION, HISTORICAL_LANDSLIDES, ROADS, TERRAIN_CELLS, VILLAGES } from "@/lib/demoRegion";
import { theme, RISK_COLORS } from "@/lib/theme";
import { RiskPrediction } from "@/lib/types";

export default function RiskMapView({
  predictions,
  onSelectCell,
}: {
  predictions: RiskPrediction[];
  onSelectCell?: (cellId: string) => void;
}) {
  const mapRef = useRef<MapViewType>(null);
  const [ready, setReady] = useState(false);

  const initialRegion: Region = useMemo(
    () => ({
      latitude: (DEMO_REGION.bbox.minLat + DEMO_REGION.bbox.maxLat) / 2,
      longitude: (DEMO_REGION.bbox.minLon + DEMO_REGION.bbox.maxLon) / 2,
      latitudeDelta: DEMO_REGION.bbox.maxLat - DEMO_REGION.bbox.minLat + 0.05,
      longitudeDelta: DEMO_REGION.bbox.maxLon - DEMO_REGION.bbox.minLon + 0.05,
    }),
    [],
  );

  const predictionByCell = useMemo(() => {
    const map = new Map<string, RiskPrediction>();
    predictions.forEach((p) => map.set(p.cellId, p));
    return map;
  }, [predictions]);

  const handleMapReady = useCallback(() => {
    setReady(true);
    try {
      mapRef.current?.fitToCoordinates(
        TERRAIN_CELLS.map((c) => ({ latitude: c.lat, longitude: c.lon })),
        { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true },
      );
    } catch {
      // fitToCoordinates can fail on some Android emulator configs without
      // Play services fully ready — the initialRegion fallback still works.
    }
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        onMapReady={handleMapReady}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {ROADS.map((road) => (
          <Polyline
            key={road.id}
            coordinates={road.path.map(([lat, lon]) => ({ latitude: lat, longitude: lon }))}
            strokeColor={theme.accent}
            strokeWidth={3}
          />
        ))}

        {TERRAIN_CELLS.map((cell) => {
          const prediction = predictionByCell.get(cell.id);
          const color = prediction ? RISK_COLORS[prediction.risk_level] : "#94a3b8";
          return (
            <React.Fragment key={cell.id}>
              <Circle
                center={{ latitude: cell.lat, longitude: cell.lon }}
                radius={900}
                strokeColor={color}
                fillColor={color + "33"}
                zIndex={1}
              />
              <Marker
                coordinate={{ latitude: cell.lat, longitude: cell.lon }}
                title={cell.name}
                description={
                  prediction
                    ? `${prediction.risk_level} · score ${prediction.risk_score.toFixed(2)} · model ${prediction.model_version}`
                    : "Awaiting prediction"
                }
                pinColor={color}
                tracksViewChanges={false}
                zIndex={2}
                onPress={() => onSelectCell?.(cell.id)}
              />
            </React.Fragment>
          );
        })}

        {HISTORICAL_LANDSLIDES.map((h) => (
          <Marker
            key={h.id}
            coordinate={{ latitude: h.lat, longitude: h.lon }}
            title={`Historical event (${h.year})`}
            description={h.note}
            pinColor="#7c3aed"
            tracksViewChanges={false}
            opacity={0.85}
          />
        ))}

        {VILLAGES.map((v) => (
          <Marker
            key={v.id}
            coordinate={{ latitude: v.lat, longitude: v.lon }}
            title={v.name}
            description={`Population (est.): ${v.population_est}`}
            pinColor="#2563eb"
            tracksViewChanges={false}
            opacity={0.85}
          />
        ))}
      </MapView>

      {!ready ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.bg,
  },
});
