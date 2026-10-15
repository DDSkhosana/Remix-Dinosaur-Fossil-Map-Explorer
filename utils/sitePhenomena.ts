import { SiteMarker, PaleoData } from '../types';
import { DINOSAUR_DB } from '../data/dinosaurData';

export interface SitePhenomenaInfo {
  locationTitle: string;
  regionCountry: string;
  coordinatesFormatted: string;
  stratigraphicPeriod: string;
  stratigraphicAge: string;
  formationName: string;
  memberHorizon: string;
  weatherType: string;
  phenomenaLabel: string;
  climateBiome: string;
  iconType: 'sun' | 'rain' | 'waves' | 'flame' | 'trees' | 'wind' | 'droplets' | 'snow';
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconColor: string;
  surveyTransitMins: number;
  osteologyRecoveryPct: number;
  elevationFormatted: string;
  sedimentMatrix: string;
}

export const getSitePhenomenaDetails = (
  site: SiteMarker, 
  index: number, 
  taxaName: string, 
  paleoData?: PaleoData | null
): SitePhenomenaInfo => {
  const dinoEntry = DINOSAUR_DB.find(d => d.name.toLowerCase() === taxaName.toLowerCase().trim());
  const siteEntry = dinoEntry?.sites.find(s => 
    s.name.toLowerCase() === site.name.toLowerCase() || 
    site.name.toLowerCase().includes(s.name.toLowerCase().split(',')[0])
  );

  const rawClimate = (siteEntry?.geologicalContext?.climate || paleoData?.geologicalContext?.climate || site.climateBiome || "Subtropical").toLowerCase();
  const rawPeriod = siteEntry?.geologicalContext?.period || paleoData?.geologicalContext?.period || "Late Cretaceous";
  const rawAge = siteEntry?.geologicalContext?.age || "68 Ma";
  const rawFormation = (siteEntry?.name || site.name).split(',')[0].trim();

  const latDir = site.lat >= 0 ? 'N' : 'S';
  const lngDir = site.lng >= 0 ? 'E' : 'W';
  const coordinatesFormatted = `${Math.abs(site.lat).toFixed(2)}°${latDir}, ${Math.abs(site.lng).toFixed(2)}°${lngDir}`;

  const splitName = site.name.split(',');
  const locationTitle = splitName[0].trim();
  const regionCountry = splitName.length > 1 ? splitName.slice(1).join(',').trim() : "Excavation Basin";

  let weatherType = "Subtropical Solar";
  let phenomenaLabel = "Greenhouse Solar & High Insolation";
  let climateBiome = "Subtropical";
  let iconType: SitePhenomenaInfo['iconType'] = 'sun';
  let badgeBg = "bg-amber-50";
  let badgeBorder = "border-amber-200";
  let badgeText = "text-amber-950";
  let iconColor = "text-amber-600";
  let sedimentMatrix = "Fluvial Sandstone";

  if (rawClimate.includes("arid") || rawClimate.includes("desert") || rawClimate.includes("dune") || rawClimate.includes("semi-arid")) {
    weatherType = "Arid Monsoonal";
    phenomenaLabel = "Aeolian Dust & Dune Migration";
    climateBiome = "Semi-Arid Dunes";
    iconType = 'wind';
    badgeBg = "bg-orange-50";
    badgeBorder = "border-orange-200";
    badgeText = "text-orange-950";
    iconColor = "text-orange-600";
    sedimentMatrix = "Aeolian Sandstone";
  } else if (rawClimate.includes("coast") || rawClimate.includes("wetland") || rawClimate.includes("marine") || rawClimate.includes("estuary")) {
    weatherType = "Coastal Wetland";
    phenomenaLabel = "Tidal Inundation & Surges";
    climateBiome = "Paralic Estuary";
    iconType = 'waves';
    badgeBg = "bg-teal-50";
    badgeBorder = "border-teal-200";
    badgeText = "text-teal-950";
    iconColor = "text-teal-600";
    sedimentMatrix = "Estuarine Mudstone";
  } else if (rawClimate.includes("floodplain") || rawClimate.includes("riverine") || rawClimate.includes("fluvial")) {
    weatherType = "Fluvial Floodplain";
    phenomenaLabel = "Seasonal Deluges & Alluvium";
    climateBiome = "Fluvial Floodplain";
    iconType = 'droplets';
    badgeBg = "bg-sky-50";
    badgeBorder = "border-sky-200";
    badgeText = "text-sky-950";
    iconColor = "text-sky-600";
    sedimentMatrix = "Overbank Silt";
  } else if (rawClimate.includes("volcan") || rawClimate.includes("ash") || rawClimate.includes("tephra")) {
    weatherType = "Volcanic Ashfall";
    phenomenaLabel = "Tephra Fallout & Tuff";
    climateBiome = "Volcanic Arc";
    iconType = 'flame';
    badgeBg = "bg-rose-50";
    badgeBorder = "border-rose-200";
    badgeText = "text-rose-950";
    iconColor = "text-rose-600";
    sedimentMatrix = "Bentonite Tuff";
  } else if (rawClimate.includes("forest") || rawClimate.includes("conifer") || rawClimate.includes("temperate")) {
    weatherType = "Conifer Canopy";
    phenomenaLabel = "Gymnosperm Canopy & O₂";
    climateBiome = "Conifer Forest";
    iconType = 'trees';
    badgeBg = "bg-emerald-50";
    badgeBorder = "border-emerald-200";
    badgeText = "text-emerald-950";
    iconColor = "text-emerald-600";
    sedimentMatrix = "Organic Paleosol";
  } else if (rawClimate.includes("humid") || rawClimate.includes("rain") || rawClimate.includes("pluvial")) {
    weatherType = "Pluvial Monsoon";
    phenomenaLabel = "Monsoonal Cloudbursts";
    climateBiome = "Humid Pluvial";
    iconType = 'rain';
    badgeBg = "bg-blue-50";
    badgeBorder = "border-blue-200";
    badgeText = "text-blue-950";
    iconColor = "text-blue-600";
    sedimentMatrix = "Lacustrine Silt";
  } else if (rawClimate.includes("polar") || rawClimate.includes("cold") || rawClimate.includes("snow")) {
    weatherType = "Polar Frost";
    phenomenaLabel = "Polar Winter Frost";
    climateBiome = "High-Latitude Coastal";
    iconType = 'snow';
    badgeBg = "bg-cyan-50";
    badgeBorder = "border-cyan-200";
    badgeText = "text-cyan-950";
    iconColor = "text-cyan-600";
    sedimentMatrix = "Cryoturbated Silt";
  }

  const surveyTransitMins = (index + 1) * 7 + 4;
  const osteologyRecoveryPct = Math.min(96, Math.max(65, (dinoEntry?.metadata?.osteologicalCompleteness || 85) - (index * 4)));
  const elevationFormatted = site.elevationM ? `${site.elevationM}m` : "120m";

  return {
    locationTitle,
    regionCountry,
    coordinatesFormatted,
    stratigraphicPeriod: rawPeriod,
    stratigraphicAge: rawAge,
    formationName: rawFormation,
    memberHorizon: `${locationTitle} Horizon`,
    weatherType,
    phenomenaLabel,
    climateBiome,
    iconType,
    badgeBg,
    badgeBorder,
    badgeText,
    iconColor,
    surveyTransitMins,
    osteologyRecoveryPct,
    elevationFormatted,
    sedimentMatrix
  };
};
