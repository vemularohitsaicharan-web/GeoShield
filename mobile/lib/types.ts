export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ScenarioId = "NORMAL" | "HEAVY_RAIN" | "CRITICAL_LANDSLIDE_RISK";

export type UserRole = "ADMIN" | "AUTHORITY" | "FIELD_OFFICER" | "ANALYST" | "VIEWER";

export interface TerrainCell {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation_m: number;
  slope_degrees: number;
}

export interface HistoricalLandslide {
  id: string;
  lat: number;
  lon: number;
  year: number;
  note: string;
}

export interface Village {
  id: string;
  name: string;
  lat: number;
  lon: number;
  population_est: number;
}

export interface RoadSegment {
  id: string;
  name: string;
  path: [number, number][];
}

export interface EnvironmentalReading {
  cellId: string;
  lat: number;
  lon: number;
  rainfall_1h: number;
  rainfall_6h: number;
  rainfall_24h: number;
  soil_moisture: number;
  temperature: number;
  timestamp: string;
  device_id: string;
  quality_status: "OK" | "SUSPECT";
}

export interface RiskPrediction {
  cellId: string;
  risk_score: number;
  risk_level: RiskLevel;
  confidence: number;
  model_version: string;
  computed_at: string;
  inputs: {
    rainfall_1h: number;
    rainfall_6h: number;
    rainfall_24h: number;
    soil_moisture: number;
    slope_degrees: number;
    elevation_m: number;
    historical_landslide_density: number;
  };
}

export type ObservedSign =
  | "ground_cracks"
  | "soil_movement"
  | "rockfall"
  | "mud_accumulation"
  | "road_obstruction"
  | "drainage_blockage"
  | "unusual_water_flow"
  | "other";

export type ReportStatus =
  | "DRAFT"
  | "PENDING_SYNC"
  | "SYNCED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED";

export interface FieldReport {
  id: string;
  lat: number;
  lon: number;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  observedSigns: ObservedSign[];
  reporter: string;
  photoUri?: string;
  timestamp: string;
  status: ReportStatus;
  ai?: FieldReportAI;
}

export interface FieldReportAI {
  category: string;
  severity: string;
  signals: string[];
  summary: string;
  confidence: number;
  model: string;
  generatedAt: string;
  source: "groq" | "fallback";
}

export type AlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" | "EXPIRED";

export interface AlertItem {
  id: string;
  cellId?: string;
  reportId?: string;
  level: RiskLevel;
  message: string;
  createdAt: string;
  status: AlertStatus;
}
