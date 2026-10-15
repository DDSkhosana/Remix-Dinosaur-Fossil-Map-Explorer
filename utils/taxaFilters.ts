import { DINOSAUR_DB } from '../data/dinosaurData';
import { 
  GEOGRAPHIC_REGIONS, 
  isSiteInArea, 
  taxonHasArea, 
  getAreaForSite,
  AREA_KEYWORDS 
} from './geoRegions';

export interface FilterTabOption {
  id: string;
  label: string;
  subLabel?: string;
  count?: number;
  iconType?: string;
  badge?: string;
}

export const PERIOD_TABS: FilterTabOption[] = [
  { id: 'all', label: 'All Periods', subLabel: '252–66 Ma', badge: 'Mesozoic' },
  { id: 'late_cretaceous', label: 'Late Cretaceous', subLabel: '100–66 Ma', badge: 'K-Pg Peak' },
  { id: 'early_cretaceous', label: 'Early Cretaceous', subLabel: '145–100 Ma', badge: 'Radiation' },
  { id: 'late_jurassic', label: 'Late Jurassic', subLabel: '163–145 Ma', badge: 'Sauropod Reign' },
  { id: 'early_jurassic', label: 'Early Jurassic', subLabel: '201–174 Ma', badge: 'Early Archosaurs' },
  { id: 'triassic', label: 'Triassic Period', subLabel: '252–201 Ma', badge: 'Dawn of Dinosaurs' }
];

export const AREA_TABS: FilterTabOption[] = [
  { id: 'all', label: 'All Global Areas', subLabel: 'World Map', badge: 'Global' },
  { id: 'north_america', label: 'North America', subLabel: 'Hell Creek, Lance, Morrison', badge: 'Nearctic' },
  { id: 'asia', label: 'Asia & Gobi', subLabel: 'Djadokhta, Liaoning, Yixian', badge: 'Palearctic' },
  { id: 'south_america', label: 'South America', subLabel: 'Patagonia, Neuquén, La Amarga', badge: 'Neotropical' },
  { id: 'europe', label: 'Europe & UK', subLabel: 'Solnhofen, Isle of Wight', badge: 'Eurasian' },
  { id: 'africa', label: 'Africa & Sahara', subLabel: 'Bahariya, Tendaguru, Kem Kem', badge: 'Afrotropical' },
  { id: 'australia', label: 'Australia & Oceania', subLabel: 'Winton, Queensland', badge: 'Australasian' }
];

export const CLIMATE_TABS: FilterTabOption[] = [
  { id: 'all', label: 'All Climate Biomes', subLabel: 'Global Paleoclimate', badge: 'All Zones' },
  { id: 'subtropical', label: 'Subtropical Floodplain', subLabel: 'Lush river plains & deltas', badge: 'Warm & Humid' },
  { id: 'coastal_wetland', label: 'Coastal Wetland & Estuary', subLabel: 'Mangroves & marine margins', badge: 'Marine Shore' },
  { id: 'savanna', label: 'Tropical Savanna', subLabel: 'Seasonal plains & fern prairies', badge: 'Monsoonal' },
  { id: 'semi_arid', label: 'Semi-Arid Basin', subLabel: 'Braided streams & dry basins', badge: 'Seasonal' },
  { id: 'desert', label: 'Desert Sand Dunes', subLabel: 'Arid erg systems & red beds', badge: 'Arid' },
  { id: 'temperate_forest', label: 'Temperate Conifer Forest', subLabel: 'Gymnosperm & fern forests', badge: 'Temperate' },
  { id: 'polar_forest', label: 'Arctic & Polar Forest', subLabel: 'High-latitude polar woodlands', badge: 'Boreal' }
];

export function getTaxonPeriodCategory(dinoName: string): string {
  const entry = DINOSAUR_DB.find(d => d.name.toLowerCase() === dinoName.toLowerCase());
  if (!entry || !entry.sites || entry.sites.length === 0) return 'late_cretaceous';
  
  const site = entry.sites[0];
  const periodText = (site.geologicalContext?.period || '').toLowerCase();
  const ageText = (site.geologicalContext?.age || '').toLowerCase();

  if (periodText.includes('late cretaceous') || ageText.includes('66') || ageText.includes('70') || ageText.includes('75')) {
    return 'late_cretaceous';
  }
  if (periodText.includes('early cretaceous') || ageText.includes('110') || ageText.includes('115') || ageText.includes('125') || ageText.includes('130')) {
    return 'early_cretaceous';
  }
  if (periodText.includes('late jurassic') || ageText.includes('150') || ageText.includes('152') || ageText.includes('155')) {
    return 'late_jurassic';
  }
  if (periodText.includes('early jurassic') || periodText.includes('jurassic') || ageText.includes('190') || ageText.includes('195') || ageText.includes('200')) {
    return 'early_jurassic';
  }
  if (periodText.includes('triassic') || ageText.includes('220') || ageText.includes('230') || ageText.includes('240')) {
    return 'triassic';
  }
  return 'late_cretaceous';
}

export function getTaxonAreaCategory(dinoName: string): string {
  const entry = DINOSAUR_DB.find(d => d.name.toLowerCase() === dinoName.toLowerCase());
  if (!entry || !entry.sites || entry.sites.length === 0) return 'north_america';

  // Check the primary site first
  const primarySite = entry.sites[0]?.name || '';
  const primaryArea = getAreaForSite(primarySite);
  if (primaryArea) return primaryArea;

  // Fallback to checking all sites
  for (const site of entry.sites) {
    const area = getAreaForSite(site.name);
    if (area) return area;
  }

  return 'north_america';
}

export function getTaxonClimateCategory(dinoName: string): string {
  const entry = DINOSAUR_DB.find(d => d.name.toLowerCase() === dinoName.toLowerCase());
  if (!entry || !entry.sites || entry.sites.length === 0) return 'subtropical';

  const climateTexts = entry.sites.map(s => (s.geologicalContext?.climate || '').toLowerCase()).join(' ');

  if (climateTexts.includes('arctic') || climateTexts.includes('polar') || climateTexts.includes('cool wetland')) {
    return 'polar_forest';
  }
  if (climateTexts.includes('desert') || climateTexts.includes('dune') || climateTexts.includes('arid')) {
    return 'desert';
  }
  if (climateTexts.includes('semi-arid') || climateTexts.includes('braided')) {
    return 'semi_arid';
  }
  if (climateTexts.includes('savanna') || climateTexts.includes('seasonal')) {
    return 'savanna';
  }
  if (climateTexts.includes('coastal') || climateTexts.includes('lagoon') || climateTexts.includes('estuary') || climateTexts.includes('shoreline')) {
    return 'coastal_wetland';
  }
  if (climateTexts.includes('temperate') || climateTexts.includes('forest') || climateTexts.includes('marsh')) {
    return 'temperate_forest';
  }
  return 'subtropical';
}

export function filterTaxa(
  periodId: string,
  areaId: string,
  climateId: string
): string[] {
  return DINOSAUR_DB.filter(dino => {
    if (periodId !== 'all') {
      const p = getTaxonPeriodCategory(dino.name);
      if (p !== periodId) return false;
    }
    if (areaId !== 'all') {
      const matchesArea = taxonHasArea(dino.name, areaId);
      if (!matchesArea) return false;
    }
    if (climateId !== 'all') {
      const c = getTaxonClimateCategory(dino.name);
      if (c !== climateId) return false;
    }
    return true;
  }).map(d => d.name);
}
