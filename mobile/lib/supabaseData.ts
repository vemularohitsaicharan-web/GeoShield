import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

import { supabase } from "./supabaseClient";
import {
  AlertItem,
  AlertStatus,
  FieldReport,
  HistoricalLandslide,
  ObservedSign,
  ReportStatus,
  RiskPrediction,
  RoadSegment,
  TerrainCell,
  Village,
} from "./types";

export async function fetchReferenceData(): Promise<{
  terrainCells: TerrainCell[];
  historicalLandslides: HistoricalLandslide[];
  villages: Village[];
  roads: RoadSegment[];
}> {
  const [cellsRes, histRes, villagesRes, roadsRes] = await Promise.all([
    supabase.from("terrain_cells").select("id, name, lat, lon, elevation_m, slope_degrees"),
    supabase.from("historical_landslides").select("id, lat, lon, year, note"),
    supabase.from("villages").select("id, name, lat, lon, population_est"),
    supabase.from("roads").select("id, name, path"),
  ]);

  if (cellsRes.error) throw cellsRes.error;
  if (histRes.error) throw histRes.error;
  if (villagesRes.error) throw villagesRes.error;
  if (roadsRes.error) throw roadsRes.error;

  return {
    terrainCells: (cellsRes.data ?? []) as TerrainCell[],
    historicalLandslides: (histRes.data ?? []) as HistoricalLandslide[],
    villages: (villagesRes.data ?? []) as Village[],
    roads: (roadsRes.data ?? []).map((r: any) => ({ id: r.id, name: r.name, path: r.path })) as RoadSegment[],
  };
}

export async function upsertProfileRole(userId: string, role: string) {
  const { error } = await supabase.from("profiles").upsert({ id: userId, role });
  if (error) throw error;
}

function toDbReport(r: FieldReport, reporterId: string | null) {
  return {
    id: r.id,
    reporter_id: reporterId,
    reporter_label: r.reporter,
    lat: r.lat,
    lon: r.lon,
    description: r.description,
    severity: r.severity,
    observed_signs: r.observedSigns,
    photo_url: r.photoUri && r.photoUri.startsWith("http") ? r.photoUri : null,
    status: r.status,
    ai_category: r.ai?.category ?? null,
    ai_severity: r.ai?.severity ?? null,
    ai_summary: r.ai?.summary ?? null,
    ai_confidence: r.ai?.confidence ?? null,
    ai_model: r.ai?.model ?? null,
    ai_source: r.ai?.source ?? null,
    created_at: r.timestamp,
  };
}

function fromDbReport(row: any): FieldReport {
  return {
    id: row.id,
    lat: row.lat,
    lon: row.lon,
    description: row.description,
    severity: row.severity,
    observedSigns: row.observed_signs as ObservedSign[],
    reporter: row.reporter_label,
    photoUri: row.photo_url ?? undefined,
    timestamp: row.created_at,
    status: row.status as ReportStatus,
    ai: row.ai_category
      ? {
          category: row.ai_category,
          severity: row.ai_severity,
          signals: row.observed_signs,
          summary: row.ai_summary,
          confidence: row.ai_confidence,
          model: row.ai_model,
          generatedAt: row.created_at,
          source: row.ai_source,
        }
      : undefined,
  };
}

export async function fetchFieldReports(): Promise<FieldReport[]> {
  const { data, error } = await supabase.from("field_reports").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromDbReport);
}

/**
 * Upsert (not insert) so this is safe to call both when a report is
 * first created online and again when it finishes AI sync — callers
 * don't need to track whether the row already exists in Supabase.
 */
export async function upsertFieldReport(report: FieldReport, reporterId: string | null) {
  const { error } = await supabase.from("field_reports").upsert(toDbReport(report, reporterId));
  if (error) throw error;
}

export async function updateFieldReportSync(
  id: string,
  patch: { status: ReportStatus; ai?: FieldReport["ai"] },
) {
  const { error } = await supabase
    .from("field_reports")
    .update({
      status: patch.status,
      ai_category: patch.ai?.category ?? null,
      ai_severity: patch.ai?.severity ?? null,
      ai_summary: patch.ai?.summary ?? null,
      ai_confidence: patch.ai?.confidence ?? null,
      ai_model: patch.ai?.model ?? null,
      ai_source: patch.ai?.source ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function updateFieldReportStatus(id: string, status: ReportStatus) {
  const { error } = await supabase.from("field_reports").update({ status }).eq("id", id);
  if (error) throw error;
}

function toDbAlert(a: AlertItem) {
  return {
    id: a.id,
    cell_id: a.cellId ?? null,
    report_id: a.reportId ?? null,
    level: a.level,
    message: a.message,
    status: a.status,
    created_at: a.createdAt,
  };
}

function fromDbAlert(row: any): AlertItem {
  return {
    id: row.id,
    cellId: row.cell_id ?? undefined,
    reportId: row.report_id ?? undefined,
    level: row.level,
    message: row.message,
    createdAt: row.created_at,
    status: row.status as AlertStatus,
  };
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const { data, error } = await supabase.from("alerts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromDbAlert);
}

export async function insertAlerts(alerts: AlertItem[]) {
  if (alerts.length === 0) return;
  const { error } = await supabase.from("alerts").insert(alerts.map(toDbAlert));
  if (error) throw error;
}

export async function updateAlertStatus(id: string, status: AlertStatus) {
  const { error } = await supabase.from("alerts").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function insertRiskPrediction(p: RiskPrediction) {
  const { error } = await supabase.from("risk_predictions").insert({
    cell_id: p.cellId,
    risk_score: p.risk_score,
    risk_level: p.risk_level,
    confidence: p.confidence,
    model_version: p.model_version,
    inputs: p.inputs,
    computed_at: p.computed_at,
  });
  if (error) throw error;
}

/**
 * Uploads a locally-picked photo (expo-image-picker URI) to Supabase
 * Storage and returns its public URL. Reads the file as base64 via the
 * legacy expo-file-system API (the new one dropped base64 helpers) and
 * decodes to bytes, since React Native fetch/Blob upload of local file
 * URIs is unreliable across platforms.
 */
export async function uploadReportPhoto(localUri: string, reportId: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const ext = localUri.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${reportId}.${ext}`;

  const { error } = await supabase.storage.from("field-report-photos").upload(path, decode(base64), {
    contentType: ext === "png" ? "image/png" : "image/jpeg",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("field-report-photos").getPublicUrl(path);
  return data.publicUrl;
}
