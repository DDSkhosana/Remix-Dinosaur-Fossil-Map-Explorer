
export type DenominationFormat = 'scientific' | 'metric_si' | 'place_value' | 'exact_years';

export interface GeologicalTimeMarker {
  eon: string;
  era: string;
  period: string;
  epoch: string;
  ageStage: string;
  exactAgeMa: number; // in Million years ago (Ma)
  scientificYears: string; // e.g. "6.8 × 10⁷ yr"
  placeValueDenomination: string; // e.g. "68.0 Million Years" or "0.068 Billion Years"
  teraAnnum: string; // e.g. "0.000068 Ta"
  gigaAnnum: string; // e.g. "0.068 Ga"
  megaAnnum: string; // e.g. "68.0 Ma"
  kiloAnnum: string; // e.g. "68,000 ka"
  icsPeriodColor: string; // Official ICS Hex color
  icsEpochColor: string;
}

export interface ClimateVariables {
  meanTempC: number;
  tempAnomalyC: number; // relative to pre-industrial modern
  co2Ppm: number;
  oxygenPercent: number;
  precipitationMmYr: number;
  humidityIndex: 'Hyper-Arid' | 'Semi-Arid' | 'Sub-Humid' | 'Humid' | 'Perhumid';
  biome: string;
  koppenEquivalent: string;
  solarInsolationWpm2: number;
  seaLevelAnomalyM: number;
}

export type LocomotionCategory = 
  | 'bipedal_cursorial' 
  | 'quadrupedal_graviportal' 
  | 'facultative_biped' 
  | 'armored_quadruped' 
  | 'semi_aquatic_propulsion';

export interface LocomotionMetrics {
  category: LocomotionCategory;
  categoryLabel: string;
  posture: string; // e.g. "Digitigrade Bipedal", "Unguligrade Graviportal"
  topSpeedKmh: number;
  cruisingSpeedKmh: number;
  strideLengthM: number;
  hipHeightM: number;
  froudeNumber: number; // v^2 / (g * h)
  gaitMode: 'Walk' | 'Trot' | 'Fast Cursorial Sprint' | 'Graviportal Paced Stride' | 'Submerged Lateral Undulation';
  dutyFactorPercent: number; // % of stride cycle feet contact ground
  paceAngulationDeg: number; // Angle between successive steps (140° - 180°)
  trackGaugeWidthCm: number; // Inter-track width
  manusPesRatio: string; // Ratio of front to back footprints
  centerOfMassPosition: string; // e.g. "Pelvic Girdle Axis", "Anterior Mid-Dorsal"
  groundReactionForceKn: number;
  locomotionFeatures: string[];
}

export interface OntogenyStage {
  id: string;
  stageName: string;
  ageRangeYears: string;
  ageYearsNum: number;
  bodyMassKg: number;
  bodyLengthM: number;
  nicheDescription: string;
  histologyNotes: string; // LAGs, bone vascularity
  behaviorPattern: string;
  icon: string;
}

export interface GrowthCurvePoint {
  ageYears: number;
  massKg: number;
  growthRateKgPerDay: number;
  hasLAG: boolean;
  stageName: string;
}

export interface SpatioTemporalWaypoint {
  id: string;
  phaseName: string;
  seasonMonth: string;
  timeOfYearFraction: number; // 0.0 - 1.0
  lat: number;
  lng: number;
  paleoElevationM: number;
  climateSummary: string;
  ecologicalActivity: string;
  terrainType: string;
}

export interface ElevationData {
  paleoElevationM: number; // in meters above sea level
  paleoElevationFt: number;
  modernElevationM: number;
  hypsometryZone: 'Coastal Marine Lowland' | 'Inland Floodplain Basin' | 'Alluvial Delta Margin' | 'Highland Plateau' | 'Montane Orogen';
  depositionalEnvironment: string;
  taphonomicBurialDepthM: number;
  stratigraphicMember: string;
  reliefGradientPercent: number;
  crossSectionProfile: {
    distanceKm: number;
    altitudeM: number;
    terrainLabel: string;
    isSiteLocation?: boolean;
  }[];
}

export interface PaleoData {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  summary: string;
  stats: PaleoStat[];
  features: PaleoFeature[];
  geologicalContext: {
    era: string;
    period: string;
    climate: string;
    age: string;
  };
  timeMarker?: GeologicalTimeMarker;
  timeScale?: GeologicalTimeMarker;
  climateVariables?: ClimateVariables;
  climate?: ClimateVariables;
  locomotion: LocomotionMetrics;
  ontogeny: {
    stages: OntogenyStage[];
    growthCurve: GrowthCurvePoint[];
    migrationLapse?: SpatioTemporalWaypoint[];
  };
  migrationLapse?: SpatioTemporalWaypoint[];
  elevation: ElevationData;
  metadata: {
    threatLevel: string;
    threatScore: number; // 1-5 scale
    diet: string;
    packBehavior: string;
    integument: string;
    flight: string;
    osteologicalCompleteness: number; // 0-100 percentage
  };
}

export interface SiteMarker {
  name: string;
  lat: number;
  lng: number;
  id: string;
  elevationM?: number;
  climateBiome?: string;
}

export interface PaleoStat {
  label: string;
  value: string;
  subtext: string;
  iconType: 'era' | 'geology' | 'discovery' | 'status' | 'climate' | 'locomotion' | 'elevation';
}

export interface PaleoFeature {
  name: string;
  description: string;
  category: 'skull' | 'skeleton' | 'footprint' | 'environment' | 'histology' | 'locomotion';
}

export interface MapStyleConfig {
  featureType?: string;
  elementType?: string;
  stylers: Array<{ [key: string]: string | number | boolean }>;
}

export type AbstractionTier = 
  | 'macro_ecological'        // Climate, Stratigraphy, Geographic Azimuths, Elevation
  | 'organismal_biomechanic'  // Locomotion, Stride Kinematics, Ontogenetic Life Cycle, Whole-body Specs
  | 'systemic_physiological' // Cardiovascular, Parabronchial Air Sacs, Visceral Gizzard, Neurosensory
  | 'micro_histological';     // Taphonomic Fossils, Bone Histology, Enamel Micro-Wear, Pneumatic Foramina

export interface CrossDomainInterrelation {
  targetDomain: 'climate' | 'locomotion' | 'lifecycle' | 'elevation' | 'inventory' | 'metrics' | 'organs' | 'overview' | 'cardinal';
  domainLabel: string;
  relationshipTitle: string;
  relationshipDescription: string;
  feedbackType: 'metabolic_coupling' | 'biomechanical_leverage' | 'climatic_adaptation' | 'taphonomic_signature' | 'developmental_progression';
  telemetryMetric?: { label: string; value: string };
}


