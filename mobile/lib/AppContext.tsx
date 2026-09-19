import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { TERRAIN_CELLS } from "./demoRegion";
import { AiStatus, analyzeReport, pingAiService } from "./groqClient";
import { computeRisk } from "./riskEngine";
import { generateReadingsForScenario } from "./scenarios";
import { fetchOwnRole, getActiveSession, signInAsRole, signOut, supabaseConfigured } from "./supabaseClient";
import {
  fetchAlerts,
  fetchFieldReports,
  insertAlerts,
  insertRiskPrediction,
  updateAlertStatus,
  updateFieldReportStatus,
  upsertFieldReport,
  uploadReportPhoto,
} from "./supabaseData";
import {
  AlertItem,
  EnvironmentalReading,
  FieldReport,
  ObservedSign,
  RiskPrediction,
  ScenarioId,
  UserRole,
} from "./types";

const STORAGE_KEY = "geoshield-ner-state-v1";

interface PersistedState {
  scenario: ScenarioId;
  reports: FieldReport[];
  alerts: AlertItem[];
}

type AuthStatus = "CHECKING" | "SIGNED_OUT" | "SIGNED_IN";

interface AppState extends PersistedState {
  role: UserRole | null;
  authStatus: AuthStatus;
  readings: EnvironmentalReading[];
  predictions: RiskPrediction[];
  isOffline: boolean;
  networkConnected: boolean;
  aiStatus: AiStatus | "CHECKING";
  backendStatus: "CONNECTED" | "LOCAL_ONLY" | "CHECKING";
  lastPredictionAt?: string;
}

interface AppContextValue extends AppState {
  effectiveOffline: boolean;
  login: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  runScenario: (scenario: ScenarioId) => void;
  setOffline: (offline: boolean) => void;
  submitReport: (input: {
    lat: number;
    lon: number;
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    observedSigns: ObservedSign[];
    reporter: string;
    photoUri?: string;
  }) => Promise<void>;
  syncPendingReports: () => Promise<void>;
  generateSampleReport: () => Promise<void>;
  verifyReport: (id: string, status: "VERIFIED" | "REJECTED") => void;
  acknowledgeAlert: (id: string) => void;
  resetDemo: () => void;
  refreshAiStatus: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function uuid() {
  return Crypto.randomUUID();
}

function computeAllPredictions(readings: EnvironmentalReading[]): RiskPrediction[] {
  return readings.map((reading) => {
    const cell = TERRAIN_CELLS.find((c) => c.id === reading.cellId)!;
    return computeRisk(cell, reading);
  });
}

function alertsFromPredictions(predictions: RiskPrediction[], existing: AlertItem[]): AlertItem[] {
  const now = new Date().toISOString();
  const newAlerts: AlertItem[] = [...existing];

  predictions.forEach((p) => {
    if (p.risk_level === "HIGH" || p.risk_level === "CRITICAL") {
      const alreadyActive = existing.some(
        (a) => a.cellId === p.cellId && a.status === "ACTIVE" && a.level === p.risk_level,
      );
      if (!alreadyActive) {
        const cellName = TERRAIN_CELLS.find((c) => c.id === p.cellId)?.name ?? p.cellId;
        newAlerts.unshift({
          id: uuid(),
          cellId: p.cellId,
          level: p.risk_level,
          message: `${p.risk_level} landslide risk detected near ${cellName} (score ${p.risk_score.toFixed(2)}).`,
          createdAt: now,
          status: "ACTIVE",
        });
      }
    }
  });

  return newAlerts;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialReadings = useMemo(() => generateReadingsForScenario("NORMAL"), []);
  const initialPredictions = useMemo(() => computeAllPredictions(initialReadings), [initialReadings]);

  const [state, setState] = useState<AppState>({
    role: supabaseConfigured ? null : "AUTHORITY",
    authStatus: supabaseConfigured ? "CHECKING" : "SIGNED_IN",
    scenario: "NORMAL",
    readings: initialReadings,
    predictions: initialPredictions,
    reports: [],
    alerts: [],
    isOffline: false,
    networkConnected: true,
    aiStatus: "CHECKING",
    backendStatus: supabaseConfigured ? "CHECKING" : "LOCAL_ONLY",
    lastPredictionAt: new Date().toISOString(),
  });

  // Supabase is a best-effort mirror layer, never the source of truth for
  // the UI — every write below happens against local state first (so the
  // app keeps working offline or if Supabase is unreachable), then is
  // best-effort persisted to Supabase in the background.
  const userIdRef = useRef<string | null>(null);

  const wasConnected = useRef(true);
  const syncPendingReportsRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState) => {
      const connected = netState.isConnected !== false && netState.isInternetReachable !== false;
      setState((prev) => ({ ...prev, networkConnected: connected }));

      if (connected && !wasConnected.current) {
        syncPendingReportsRef.current();
      }
      wasConnected.current = connected;
    });
    return unsubscribe;
  }, []);

  // Loads reference/report/alert state that depends on a live Supabase
  // session — shared by the initial-mount check (existing session) and
  // by a fresh login.
  const loadBackendData = async (userId: string) => {
    userIdRef.current = userId;
    try {
      const [remoteReports, remoteAlerts] = await Promise.all([fetchFieldReports(), fetchAlerts()]);
      setState((prev) => {
        const localIds = new Set(prev.reports.map((r) => r.id));
        const localAlertIds = new Set(prev.alerts.map((a) => a.id));
        return {
          ...prev,
          reports: [...prev.reports, ...remoteReports.filter((r) => !localIds.has(r.id))],
          alerts: [...prev.alerts, ...remoteAlerts.filter((a) => !localAlertIds.has(a.id))],
          backendStatus: "CONNECTED",
        };
      });
    } catch (err) {
      console.warn("Supabase unavailable, continuing local-only:", err);
      setState((prev) => ({ ...prev, backendStatus: "LOCAL_ONLY" }));
    }
  };

  useEffect(() => {
    (async () => {
      let persisted: PersistedState | null = null;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) persisted = JSON.parse(raw);
      } catch {
        // Corrupt or unavailable local storage — continue with defaults.
      }

      if (persisted) {
        const readings = generateReadingsForScenario(persisted.scenario);
        setState((prev) => ({
          ...prev,
          scenario: persisted!.scenario,
          reports: persisted!.reports,
          alerts: persisted!.alerts,
          readings,
          predictions: computeAllPredictions(readings),
        }));
      }

      const status = await pingAiService();
      setState((prev) => ({ ...prev, aiStatus: status }));

      if (supabaseConfigured) {
        const session = await getActiveSession();
        if (session) {
          const role = await fetchOwnRole(session.user.id);
          setState((prev) => ({ ...prev, role, authStatus: "SIGNED_IN" }));
          await loadBackendData(session.user.id);
        } else {
          setState((prev) => ({ ...prev, authStatus: "SIGNED_OUT", backendStatus: "LOCAL_ONLY" }));
        }
      }
    })();
  }, []);

  useEffect(() => {
    const toPersist: PersistedState = {
      scenario: state.scenario,
      reports: state.reports,
      alerts: state.alerts,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist)).catch(() => {});
  }, [state.scenario, state.reports, state.alerts]);

  const login: AppContextValue["login"] = async (role) => {
    const session = await signInAsRole(role);
    if (!session) throw new Error("Sign-in did not return a session");
    setState((prev) => ({ ...prev, role, authStatus: "SIGNED_IN" }));
    await loadBackendData(session.user.id);
  };

  const logout: AppContextValue["logout"] = async () => {
    await signOut();
    userIdRef.current = null;
    setState((prev) => ({ ...prev, role: null, authStatus: "SIGNED_OUT", backendStatus: "LOCAL_ONLY" }));
  };

  const runScenario = (scenario: ScenarioId) => {
    const readings = generateReadingsForScenario(scenario);
    const predictions = computeAllPredictions(readings);
    const newAlerts = alertsFromPredictions(predictions, state.alerts);
    const createdAlerts = newAlerts.filter((a) => !state.alerts.some((existing) => existing.id === a.id));

    setState((prev) => ({
      ...prev,
      scenario,
      readings,
      predictions,
      alerts: newAlerts,
      lastPredictionAt: new Date().toISOString(),
    }));

    if (supabaseConfigured && state.backendStatus === "CONNECTED") {
      predictions.forEach((p) => insertRiskPrediction(p).catch((err) => console.warn("insertRiskPrediction failed:", err)));
      if (createdAlerts.length > 0) {
        insertAlerts(createdAlerts).catch((err) => console.warn("insertAlerts failed:", err));
      }
    }
  };

  const setOffline = (offline: boolean) => setState((prev) => ({ ...prev, isOffline: offline }));

  const mirrorReportToSupabase = async (report: FieldReport) => {
    if (!(supabaseConfigured && state.backendStatus === "CONNECTED")) return;
    try {
      let photoUrl = report.photoUri;
      if (photoUrl && !photoUrl.startsWith("http")) {
        photoUrl = await uploadReportPhoto(photoUrl, report.id);
        setState((prev) => ({
          ...prev,
          reports: prev.reports.map((r) => (r.id === report.id ? { ...r, photoUri: photoUrl } : r)),
        }));
      }
      await upsertFieldReport({ ...report, photoUri: photoUrl }, userIdRef.current);
    } catch (err) {
      console.warn("Supabase report mirror failed (report stays local):", err);
    }
  };

  const submitReport: AppContextValue["submitReport"] = async (input) => {
    const report: FieldReport = {
      id: uuid(),
      lat: input.lat,
      lon: input.lon,
      description: input.description,
      severity: input.severity,
      observedSigns: input.observedSigns,
      reporter: input.reporter,
      photoUri: input.photoUri,
      timestamp: new Date().toISOString(),
      status: "PENDING_SYNC",
    };
    setState((prev) => ({ ...prev, reports: [report, ...prev.reports] }));

    if (!state.isOffline && state.networkConnected) {
      await mirrorReportToSupabase(report);
    }
  };

  const syncPendingReports: AppContextValue["syncPendingReports"] = async () => {
    if (state.isOffline || !state.networkConnected) return;
    const pending = state.reports.filter((r) => r.status === "PENDING_SYNC");
    for (const report of pending) {
      const ai = await analyzeReport(report.description, report.observedSigns);
      const synced: FieldReport = { ...report, status: "SYNCED", ai };
      setState((prev) => ({
        ...prev,
        reports: prev.reports.map((r) => (r.id === report.id ? synced : r)),
      }));
      await mirrorReportToSupabase(synced);

      if (ai.severity === "HIGH") {
        const alert: AlertItem = {
          id: uuid(),
          reportId: report.id,
          level: "HIGH",
          message: `Field report flagged HIGH severity by AI analysis: ${ai.summary}`,
          createdAt: new Date().toISOString(),
          status: "ACTIVE",
        };
        setState((prev) => ({ ...prev, alerts: [alert, ...prev.alerts] }));
        if (supabaseConfigured && state.backendStatus === "CONNECTED") {
          insertAlerts([alert]).catch((err) => console.warn("insertAlerts failed:", err));
        }
      }
    }
  };

  // Phase 9 (End-to-End Integration): a one-tap "generate field report"
  // demo action, so a live presentation doesn't depend on typing a report
  // by hand under time pressure. It exercises the exact same
  // submitReport/syncPendingReports code paths as the manual form.
  const generateSampleReport: AppContextValue["generateSampleReport"] = async () => {
    const highestRisk = [...state.predictions].sort((a, b) => b.risk_score - a.risk_score)[0];
    const cell = TERRAIN_CELLS.find((c) => c.id === highestRisk?.cellId) ?? TERRAIN_CELLS[0];

    const descriptionsByScenario: Record<ScenarioId, string> = {
      NORMAL: `Routine patrol near ${cell.name}: conditions look stable, nothing unusual to report.`,
      HEAVY_RAIN: `Heavy runoff observed near ${cell.name}: minor soil movement on the embankment, drainage channel partly blocked with debris.`,
      CRITICAL_LANDSLIDE_RISK: `Urgent: fresh ground cracks and rockfall debris across the road near ${cell.name} after sustained heavy rain. Some water pooling upslope, possible drainage blockage.`,
    };

    const signsByScenario: Record<ScenarioId, ObservedSign[]> = {
      NORMAL: [],
      HEAVY_RAIN: ["soil_movement", "drainage_blockage"],
      CRITICAL_LANDSLIDE_RISK: ["ground_cracks", "rockfall", "road_obstruction"],
    };

    const severityByScenario: Record<ScenarioId, "LOW" | "MEDIUM" | "HIGH"> = {
      NORMAL: "LOW",
      HEAVY_RAIN: "MEDIUM",
      CRITICAL_LANDSLIDE_RISK: "HIGH",
    };

    const report: FieldReport = {
      id: uuid(),
      lat: cell.lat,
      lon: cell.lon,
      description: descriptionsByScenario[state.scenario],
      severity: severityByScenario[state.scenario],
      observedSigns: signsByScenario[state.scenario],
      reporter: "Demo Field Officer",
      timestamp: new Date().toISOString(),
      status: "PENDING_SYNC",
    };
    setState((prev) => ({ ...prev, reports: [report, ...prev.reports] }));

    // Sync immediately (rather than going through syncPendingReports,
    // which would otherwise read a stale pre-update `reports` list from
    // its closure) so the one-tap demo action completes the full
    // report -> AI analysis loop without a second manual step.
    if (!state.isOffline && state.networkConnected) {
      const ai = await analyzeReport(report.description, report.observedSigns);
      const synced: FieldReport = { ...report, status: "SYNCED", ai };
      setState((prev) => ({
        ...prev,
        reports: prev.reports.map((r) => (r.id === report.id ? synced : r)),
      }));
      await mirrorReportToSupabase(synced);

      if (ai.severity === "HIGH") {
        const alert: AlertItem = {
          id: uuid(),
          reportId: report.id,
          level: "HIGH",
          message: `Field report flagged HIGH severity by AI analysis: ${ai.summary}`,
          createdAt: new Date().toISOString(),
          status: "ACTIVE",
        };
        setState((prev) => ({ ...prev, alerts: [alert, ...prev.alerts] }));
        if (supabaseConfigured && state.backendStatus === "CONNECTED") {
          insertAlerts([alert]).catch((err) => console.warn("insertAlerts failed:", err));
        }
      }
    }
  };

  const verifyReport: AppContextValue["verifyReport"] = (id, status) => {
    setState((prev) => ({
      ...prev,
      reports: prev.reports.map((r) => (r.id === id ? { ...r, status } : r)),
    }));
    if (supabaseConfigured && state.backendStatus === "CONNECTED") {
      updateFieldReportStatus(id, status).catch((err) => console.warn("updateFieldReportStatus failed:", err));
    }
  };

  const acknowledgeAlert: AppContextValue["acknowledgeAlert"] = (id) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === id ? { ...a, status: "ACKNOWLEDGED" } : a)),
    }));
    if (supabaseConfigured && state.backendStatus === "CONNECTED") {
      updateAlertStatus(id, "ACKNOWLEDGED").catch((err) => console.warn("updateAlertStatus failed:", err));
    }
  };

  const resetDemo = () => {
    const readings = generateReadingsForScenario("NORMAL");
    setState((prev) => ({
      ...prev,
      scenario: "NORMAL",
      readings,
      predictions: computeAllPredictions(readings),
      reports: [],
      alerts: [],
      lastPredictionAt: new Date().toISOString(),
    }));
  };

  const refreshAiStatus = () => {
    setState((prev) => ({ ...prev, aiStatus: "CHECKING" }));
    pingAiService().then((status) => setState((prev) => ({ ...prev, aiStatus: status })));
  };

  // Keep the ref used by the NetInfo listener pointed at the latest
  // closure (which captures the current reports list) without having to
  // re-subscribe to NetInfo on every state change.
  useEffect(() => {
    syncPendingReportsRef.current = syncPendingReports;
  });

  const effectiveOffline = state.isOffline || !state.networkConnected;

  const value: AppContextValue = {
    ...state,
    effectiveOffline,
    login,
    logout,
    runScenario,
    setOffline,
    submitReport,
    syncPendingReports,
    generateSampleReport,
    verifyReport,
    acknowledgeAlert,
    resetDemo,
    refreshAiStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
