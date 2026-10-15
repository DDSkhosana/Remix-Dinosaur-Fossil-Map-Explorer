import { SiteMarker } from '../types';

export type Cardinal16 = 
  | 'N' | 'NNE' | 'NE' | 'ENE' 
  | 'E' | 'ESE' | 'SE' | 'SSE' 
  | 'S' | 'SSW' | 'SW' | 'WSW' 
  | 'W' | 'WNW' | 'NW' | 'NNW';

export interface RelativeLocationInfo {
  sourceSiteName: string;
  targetSiteName: string;
  targetSiteId: string;
  targetSiteIndex: number;
  distanceKm: number;
  distanceMiles: number;
  distanceNauticalMiles: number;
  azimuthDeg: number; // 0 to 359.9°
  cardinal: Cardinal16;
  cardinalFullName: string;
  reciprocalAzimuthDeg: number;
  reciprocalCardinal: Cardinal16;
  deltaLatDeg: number; // lat2 - lat1
  deltaLngDeg: number; // lng2 - lng1
  deltaLatKm: number;  // northward distance in km
  deltaLngKm: number;  // eastward distance in km
  cardinalVectorDescription: string;
  targetLat: number;
  targetLng: number;
  sourceLat: number;
  sourceLng: number;
  elevationDeltaM?: number;
}

const CARDINAL_NAMES_16: Record<Cardinal16, string> = {
  N: 'North',
  NNE: 'North-Northeast',
  NE: 'Northeast',
  ENE: 'East-Northeast',
  E: 'East',
  ESE: 'East-Southeast',
  SE: 'Southeast',
  SSE: 'South-Southeast',
  S: 'South',
  SSW: 'South-Southwest',
  SW: 'Southwest',
  WSW: 'West-Southwest',
  W: 'West',
  WNW: 'West-Northwest',
  NW: 'Northwest',
  NNW: 'North-Northwest'
};

const CARDINAL_POINTS_16: Cardinal16[] = [
  'N', 'NNE', 'NE', 'ENE', 
  'E', 'ESE', 'SE', 'SSE', 
  'S', 'SSW', 'SW', 'WSW', 
  'W', 'WNW', 'NW', 'NNW'
];

/**
 * Calculates Great-Circle Geodesic Distance via the Haversine formula
 */
export function calculateGeodesicDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates initial Great-Circle Azimuth Bearing in degrees (0° - 359.9°)
 */
export function calculateInitialBearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const thetaRad = Math.atan2(y, x);
  const thetaDeg = (thetaRad * 180) / Math.PI;
  return (thetaDeg + 360) % 360;
}

/**
 * Maps an azimuth degree to the standard 16-point cardinal compass rose
 */
export function degreeToCardinal16(deg: number): Cardinal16 {
  const normalized = (deg % 360 + 360) % 360;
  const sectorIndex = Math.floor((normalized + 11.25) / 22.5) % 16;
  return CARDINAL_POINTS_16[sectorIndex];
}

/**
 * Computes full Relative Location and Cardinal Directionality between two excavation sites
 */
export function computeRelativeLocation(
  source: SiteMarker, 
  target: SiteMarker,
  targetSiteIndex: number = 0
): RelativeLocationInfo {
  const distanceKm = calculateGeodesicDistanceKm(source.lat, source.lng, target.lat, target.lng);
  const distanceMiles = distanceKm * 0.621371;
  const distanceNauticalMiles = distanceKm * 0.539957;

  const azimuthDeg = calculateInitialBearingDeg(source.lat, source.lng, target.lat, target.lng);
  const cardinal = degreeToCardinal16(azimuthDeg);
  const cardinalFullName = CARDINAL_NAMES_16[cardinal];

  const reciprocalAzimuthDeg = (azimuthDeg + 180) % 360;
  const reciprocalCardinal = degreeToCardinal16(reciprocalAzimuthDeg);

  const deltaLatDeg = target.lat - source.lat;
  const deltaLngDeg = target.lng - source.lng;

  // Approx km along meridian and parallel
  const deltaLatKm = deltaLatDeg * 111.13;
  const avgLatRad = ((source.lat + target.lat) / 2 * Math.PI) / 180;
  const deltaLngKm = deltaLngDeg * (111.32 * Math.cos(avgLatRad));

  const roundedDist = Math.round(distanceKm);
  const roundedDeg = Math.round(azimuthDeg);

  const cardinalVectorDescription = `${roundedDist} km ${cardinal} (${roundedDeg}°) from ${source.name.split(',')[0]}`;

  return {
    sourceSiteName: source.name,
    targetSiteName: target.name,
    targetSiteId: target.id,
    targetSiteIndex,
    distanceKm: Math.round(distanceKm * 10) / 10,
    distanceMiles: Math.round(distanceMiles * 10) / 10,
    distanceNauticalMiles: Math.round(distanceNauticalMiles * 10) / 10,
    azimuthDeg: Math.round(azimuthDeg * 10) / 10,
    cardinal,
    cardinalFullName,
    reciprocalAzimuthDeg: Math.round(reciprocalAzimuthDeg * 10) / 10,
    reciprocalCardinal,
    deltaLatDeg: Math.round(deltaLatDeg * 1000) / 1000,
    deltaLngDeg: Math.round(deltaLngDeg * 1000) / 1000,
    deltaLatKm: Math.round(deltaLatKm * 10) / 10,
    deltaLngKm: Math.round(deltaLngKm * 10) / 10,
    cardinalVectorDescription,
    targetLat: target.lat,
    targetLng: target.lng,
    sourceLat: source.lat,
    sourceLng: source.lng,
    elevationDeltaM: (target.elevationM && source.elevationM) ? (target.elevationM - source.elevationM) : undefined
  };
}

/**
 * Computes relative location from one origin site to all other neighbouring excavation sites,
 * sorted by proximity (nearest first).
 */
export function computeAllNeighbouringRelativeLocations(
  originSite: SiteMarker,
  allSites: SiteMarker[]
): RelativeLocationInfo[] {
  return allSites
    .map((target, idx) => ({ target, idx }))
    .filter(({ target }) => target.id !== originSite.id && target.name !== originSite.name)
    .map(({ target, idx }) => computeRelativeLocation(originSite, target, idx))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Helper to format cardinal bearing in multiple notations
 */
export function formatBearingDisplay(
  azimuthDeg: number, 
  cardinal: Cardinal16, 
  mode: 'both' | 'cardinal' | 'degrees' = 'both'
): string {
  if (mode === 'cardinal') return cardinal;
  if (mode === 'degrees') return `${Math.round(azimuthDeg).toString().padStart(3, '0')}°`;
  return `${cardinal} (${Math.round(azimuthDeg).toString().padStart(3, '0')}°)`;
}
