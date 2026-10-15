import { DINOSAUR_DB } from '../data/dinosaurData';

export interface GeographicRegion {
  id: string;
  name: string;
  badge: string;
  subLabel: string;
  centerLng: number;
  centerLat: number;
  zoomScale: number;
  description: string;
  keyFormations: string[];
}

export const GEOGRAPHIC_REGIONS: Record<string, GeographicRegion> = {
  all: {
    id: 'all',
    name: 'Global Terrestrial Paleogeography',
    badge: 'World Map',
    subLabel: 'Planetary Pangaea & Continental Strata',
    centerLng: 0.0,
    centerLat: 15.0,
    zoomScale: 1.0,
    description: 'Mesozoic fossil localities distributed across supercontinental breakups and paleo-terranes.',
    keyFormations: ['Global Stratigraphic Horizons']
  },
  africa: {
    id: 'africa',
    name: 'Africa & Sahara Basin',
    badge: 'Afrotropical',
    subLabel: 'Kem Kem, Bahariya, Tendaguru, Elrhaz',
    centerLng: 18.0,
    centerLat: 12.0,
    zoomScale: 2.7,
    description: 'North African mangrove river systems (Kem Kem, Bahariya) and East African Jurassic dinosaur graveyards (Tendaguru).',
    keyFormations: [
      'Kem Kem Beds (Morocco)',
      'Bahariya Oasis (Egypt)',
      'Tendaguru Formation (Tanzania)',
      'Elrhaz Formation (Niger)',
      'Chenini Formation (Tunisia)',
      'Adrar des Ifoghas (Mali)'
    ]
  },
  north_america: {
    id: 'north_america',
    name: 'North American Western Interior',
    badge: 'Nearctic',
    subLabel: 'Hell Creek, Lance, Morrison, Cloverly',
    centerLng: -100.0,
    centerLat: 42.0,
    zoomScale: 2.7,
    description: 'Laramidia floodplain ecosystems, Western Interior Seaway deltas, and Morrison Jurassic savannas.',
    keyFormations: [
      'Hell Creek Formation (Montana)',
      'Morrison Formation (Colorado/Utah)',
      'Lance Formation (Wyoming)',
      'Dinosaur Park Formation (Alberta)'
    ]
  },
  south_america: {
    id: 'south_america',
    name: 'South America & Patagonia',
    badge: 'Neotropical',
    subLabel: 'Neuquén, Candeleros, La Amarga, Ischigualasto',
    centerLng: -64.0,
    centerLat: -24.0,
    zoomScale: 2.6,
    description: 'Southern Gondwanan giant titanosaur and carcharodontosaurian ecosystems across Patagonia and the Neuquén Basin.',
    keyFormations: [
      'Candeleros Formation (Neuquén, Argentina)',
      'La Amarga Formation (Patagonia)',
      'Ischigualasto Formation (San Juan)',
      'Alcântara Formation (Brazil)'
    ]
  },
  asia: {
    id: 'asia',
    name: 'Asia & Central Gobi',
    badge: 'Palearctic',
    subLabel: 'Djadokhta, Nemegt, Liaoning, Yixian',
    centerLng: 96.0,
    centerLat: 38.0,
    zoomScale: 2.3,
    description: 'Central Asian aeolian dunes (Djadokhta), Liaoning volcanic ash feather-preservation beds (Yixian), and Nemegt basins.',
    keyFormations: [
      'Djadokhta Formation (Gobi Desert, Mongolia)',
      'Yixian Formation (Liaoning, China)',
      'Nemegt Basin (Mongolia)',
      'Lufeng Formation (Yunnan, China)'
    ]
  },
  europe: {
    id: 'europe',
    name: 'Europe & Archipelago',
    badge: 'Eurasian',
    subLabel: 'Solnhofen, Isle of Wight, Burgos, Wealden',
    centerLng: 10.0,
    centerLat: 50.0,
    zoomScale: 3.6,
    description: 'Mesozoic European archipelago featuring shallow lagoonal limestones, deltaic estuaries, and island ecosystems.',
    keyFormations: [
      'Solnhofen Limestone (Bavaria, Germany)',
      'Wessex & Vectis Formations (Isle of Wight, UK)',
      'Burgos Province (Spain)',
      'Bernissart (Belgium)'
    ]
  },
  australia: {
    id: 'australia',
    name: 'Australia & East Gondwana',
    badge: 'Australasian',
    subLabel: 'Winton, Eromanga, Lightning Ridge',
    centerLng: 135.0,
    centerLat: -25.0,
    zoomScale: 3.0,
    description: 'High-latitude polar Cretaceous river basins and opalized fossil deposits bordering the inland Eromanga Sea.',
    keyFormations: [
      'Winton Formation (Queensland)',
      'Lightning Ridge (New South Wales)',
      'Dinosaur Cove (Otway Group, Victoria)'
    ]
  }
};

export const AREA_KEYWORDS: Record<string, string[]> = {
  africa: [
    'egypt', 'bahariya', 'tanzania', 'tendaguru', 'morocco', 'kem kem', 
    'sahara', 'tunisia', 'chenini', 'mali', 'niger', 'elrhaz', 'algeria', 
    'south africa', 'madagascar', 'tegana', 'adrar', 'ifoghas'
  ],
  north_america: [
    'montana', 'wyoming', 'colorado', 'alberta', 'saskatchewan', 'utah', 
    'texas', 'oklahoma', 'alaska', 'maryland', 'arizona', 'cloverly', 
    'morrison', 'hell creek', 'lance', 'frenchman', 'scollard', 'horseshoecanyon',
    'dinosaur park', 'kaiparowits', 'kayenta', 'two medicine'
  ],
  asia: [
    'mongolia', 'gobi', 'china', 'liaoning', 'yixian', 'india', 'lufeng', 
    'djadokhta', 'nemegt', 'tianshan', 'dharamsala', 'dharmaram'
  ],
  south_america: [
    'argentina', 'patagonia', 'neuquén', 'la amarga', 'ischigualasto', 
    'candeleros', 'brazil', 'chile', 'alcântara', 'lohan cura', 'rayoso', 'bajada'
  ],
  europe: [
    'germany', 'solnhofen', 'uk', 'england', 'isle of wight', 'surrey', 
    'belgium', 'spain', 'burgos', 'france', 'portugal', 'romania', 'bernissart'
  ],
  australia: [
    'australia', 'queensland', 'winton', 'victoria', 'lightning ridge', 
    'dinosaur cove', 'otway'
  ]
};

export function isSiteInArea(siteName: string, areaId: string): boolean {
  if (areaId === 'all') return true;
  const keywords = AREA_KEYWORDS[areaId];
  if (!keywords) return true;
  const lower = siteName.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

export function taxonHasArea(dinoName: string, areaId: string): boolean {
  if (areaId === 'all') return true;
  const entry = DINOSAUR_DB.find(d => d.name.toLowerCase() === dinoName.toLowerCase());
  if (!entry || !entry.sites || entry.sites.length === 0) return false;
  return entry.sites.some(s => isSiteInArea(s.name, areaId));
}

export function findFirstSiteIndexInArea(sites: { name: string }[], areaId: string): number {
  if (areaId === 'all') return 0;
  const idx = sites.findIndex(s => isSiteInArea(s.name, areaId));
  return idx !== -1 ? idx : 0;
}

export function getAreaForSite(siteName: string): string {
  const lower = siteName.toLowerCase();
  for (const [areaId, keywords] of Object.entries(AREA_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      return areaId;
    }
  }
  return 'north_america';
}
