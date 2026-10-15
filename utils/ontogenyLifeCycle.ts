import { OntogenyStage, GrowthCurvePoint, SpatioTemporalWaypoint } from '../types';

export interface DinoLifeCyclePackage {
  stages: OntogenyStage[];
  growthCurve: GrowthCurvePoint[];
  migrationLapse: SpatioTemporalWaypoint[];
}

export const getLifeCycleForDino = (dinoName: string, baseCoordinates: { lat: number; lng: number }): DinoLifeCyclePackage => {
  const n = dinoName.toLowerCase();
  const baseLat = baseCoordinates.lat;
  const baseLng = baseCoordinates.lng;

  // 1. Tyrannosaurus Rex
  if (n.includes('tyrannosaurus') || n.includes('rex')) {
    const stages: OntogenyStage[] = [
      {
        id: 'stage-1-egg',
        stageName: 'Ovum & Nesting Clutch',
        ageRangeYears: '0.0 Years (Incubation: ~3-6 Months)',
        ageYearsNum: 0.0,
        bodyMassKg: 5.5,
        bodyLengthM: 0.4,
        nicheDescription: 'Subterranean sediment nests in upland riverbanks; protected by brooding parental pairs',
        histologyNotes: 'Elongatoolithid multi-layer calcite eggshell with high gas-exchange pore density',
        behaviorPattern: 'Embryonic vocalizations coordinating synchronized clutch hatching',
        icon: 'egg'
      },
      {
        id: 'stage-2-hatchling',
        stageName: 'Hatchling / Perinate',
        ageRangeYears: '0 – 2 Years',
        ageYearsNum: 1.0,
        bodyMassKg: 45,
        bodyLengthM: 1.8,
        nicheDescription: 'Cryptic forest understory insectivore & small lizard hunter; covered in insulating protofeathers',
        histologyNotes: 'Woven-fibered cortical bone with dense vascular canals indicating high metabolic rate',
        behaviorPattern: 'Nesting site fidelity with parental food provision and pack defense',
        icon: 'footprints'
      },
      {
        id: 'stage-3-juvenile',
        stageName: 'Juvenile Cursorial Hunter (Nanotyrannus morph)',
        ageRangeYears: '2 – 12 Years',
        ageYearsNum: 8.0,
        bodyMassKg: 650,
        bodyLengthM: 5.8,
        nicheDescription: 'Hyper-agile pursuit predator occupying a completely distinct ecological niche from adults',
        histologyNotes: 'Annual LAGs (Lines of Arrested Growth) spaced at 2.5 mm intervals; rapid radial expansion',
        behaviorPattern: 'Pursuit hunting of small ornithopods and pachycephalosaurs at speeds up to 45 km/h',
        icon: 'zap'
      },
      {
        id: 'stage-4-subadult',
        stageName: 'Sub-Adult Growth Spurt Phase',
        ageRangeYears: '13 – 18 Years',
        ageYearsNum: 15.0,
        bodyMassKg: 3400,
        bodyLengthM: 9.5,
        nicheDescription: 'Exponential mass gain phase (up to 2.1 kg/day); skull deepens, teeth become bone-crushing',
        histologyNotes: 'Transition from fibrolamellar to dense Haversian remodeling in femoral cortices',
        behaviorPattern: 'Ontogenetic dietary shift: transitioning from pursuit running to ambush bone-crushing',
        icon: 'bone'
      },
      {
        id: 'stage-5-adult',
        stageName: 'Sexually Mature Adult Apex',
        ageRangeYears: '19 – 25 Years',
        ageYearsNum: 22.0,
        bodyMassKg: 8200,
        bodyLengthM: 12.4,
        nicheDescription: 'Apex macropredator controlling 500+ km² territories; crushing armored ceratopsian bones',
        histologyNotes: 'External Fundamental System (EFS) formed at periosteal surface indicating growth cessation',
        behaviorPattern: 'Territorial pair bonding, active courtship display, dominance head-biting scars',
        icon: 'shield-alert'
      },
      {
        id: 'stage-6-senescent',
        stageName: 'Senescent Mega-Specimen (e.g. SUE / Scotty)',
        ageRangeYears: '26 – 33+ Years',
        ageYearsNum: 29.0,
        bodyMassKg: 9100,
        bodyLengthM: 13.0,
        nicheDescription: 'Maximal skeletal robusticity, deep osteological pathology, healed bite wounds and gout',
        histologyNotes: 'Thick avascular outer periosteal bone with dense secondary osteons replacing primary matrix',
        behaviorPattern: 'Dominant territorial anchoring, solitary scavenging and large herbivore ambush',
        icon: 'sparkles'
      }
    ];

    const growthCurve: GrowthCurvePoint[] = [
      { ageYears: 0, massKg: 5, growthRateKgPerDay: 0.05, hasLAG: false, stageName: 'Hatching' },
      { ageYears: 2, massKg: 75, growthRateKgPerDay: 0.15, hasLAG: true, stageName: 'Early Juvenile' },
      { ageYears: 5, massKg: 280, growthRateKgPerDay: 0.35, hasLAG: true, stageName: 'Mid Juvenile' },
      { ageYears: 8, massKg: 650, growthRateKgPerDay: 0.60, hasLAG: true, stageName: 'Late Juvenile' },
      { ageYears: 11, massKg: 1400, growthRateKgPerDay: 1.10, hasLAG: true, stageName: 'Pre-Spurt' },
      { ageYears: 14, massKg: 2800, growthRateKgPerDay: 2.05, hasLAG: true, stageName: 'Peak Growth Spurt' },
      { ageYears: 16, massKg: 4900, growthRateKgPerDay: 2.10, hasLAG: true, stageName: 'Sub-Adult Peak' },
      { ageYears: 18, massKg: 6800, growthRateKgPerDay: 1.45, hasLAG: true, stageName: 'Skeletal Maturity' },
      { ageYears: 22, massKg: 8200, growthRateKgPerDay: 0.30, hasLAG: true, stageName: 'Prime Adult' },
      { ageYears: 28, massKg: 8900, growthRateKgPerDay: 0.05, hasLAG: true, stageName: 'Senescent Plateau' }
    ];

    const migrationLapse: SpatioTemporalWaypoint[] = [
      {
        id: 'waypoint-1',
        phaseName: 'Spring Nesting & Oviposition',
        seasonMonth: 'March – May (Vernal Equinox)',
        timeOfYearFraction: 0.15,
        lat: baseLat + 0.85,
        lng: baseLng - 0.95,
        paleoElevationM: 420,
        climateSummary: 'Subtropical Warm Monsoonal (22°C, 160 mm rain)',
        ecologicalActivity: 'Excavation of elevated sandy nests above flood levels; aggressive territory defense',
        terrainType: 'Upland Alluvial Terraces & Pine/Cycad Ridges'
      },
      {
        id: 'waypoint-2',
        phaseName: 'Summer Foraging & Juvenile Training',
        seasonMonth: 'June – August (Summer Solstice)',
        timeOfYearFraction: 0.40,
        lat: baseLat - 0.35,
        lng: baseLng + 0.65,
        paleoElevationM: 180,
        climateSummary: 'Hot Monsoonal Greenhouse (31°C, 240 mm rain)',
        ecologicalActivity: 'Herding juvenile packs along river oxbows; stalking Edmontosaurus nesting colonies',
        terrainType: 'Braided River Deltas & Metasequoia Swamps'
      },
      {
        id: 'waypoint-3',
        phaseName: 'Autumn Ceratopsian Ambush Gathering',
        seasonMonth: 'September – November (Autumn Equinox)',
        timeOfYearFraction: 0.70,
        lat: baseLat - 1.10,
        lng: baseLng - 0.40,
        paleoElevationM: 85,
        climateSummary: 'Warm Temperate Coastal Breezes (20°C, 110 mm rain)',
        ecologicalActivity: 'Ambushing migrating Triceratops herds across coastal river fords',
        terrainType: 'Western Interior Seaway Coastal Lowland'
      },
      {
        id: 'waypoint-4',
        phaseName: 'Winter Lowland Refugium & Courtship',
        seasonMonth: 'December – February (Winter Solstice)',
        timeOfYearFraction: 0.95,
        lat: baseLat + 0.20,
        lng: baseLng + 0.15,
        paleoElevationM: 140,
        climateSummary: 'Mild Subtropical Winter (14°C, 80 mm rain)',
        ecologicalActivity: 'Courtship displays, territory boundary scenting, pair bonding along sheltered river valleys',
        terrainType: 'Inland River Basin & Lowland Ginkgo Canopy'
      }
    ];

    return { stages, growthCurve, migrationLapse };
  }

  // 2. Generic / Sauropod / Herbivore / Other Taxa Life Cycle Generator
  const isSauropod = n.includes('brachiosaurus') || n.includes('sauropod') || n.includes('diplodocus');
  const isCeratopsian = n.includes('triceratops') || n.includes('ceratops');
  const isSmallTheropod = n.includes('velociraptor') || n.includes('raptor');

  const maxMassKg = isSauropod ? 55000 : isCeratopsian ? 11000 : isSmallTheropod ? 18 : 4500;
  const maxLenM = isSauropod ? 26.0 : isCeratopsian ? 9.0 : isSmallTheropod ? 2.0 : 8.5;

  const stages: OntogenyStage[] = [
    {
      id: 'stage-1-egg',
      stageName: 'Egg Clutch & Colony Hatchery',
      ageRangeYears: '0.0 Years (Incubation: ~60-120 Days)',
      ageYearsNum: 0.0,
      bodyMassKg: isSauropod ? 4.2 : isSmallTheropod ? 0.35 : 2.5,
      bodyLengthM: isSauropod ? 0.45 : isSmallTheropod ? 0.18 : 0.35,
      nicheDescription: 'Communal nesting colonies in semi-arid fluvial floodplains; high clutch numbers to offset predation',
      histologyNotes: 'Spheroolithid calcified eggshell membranes with high structural pore distribution',
      behaviorPattern: 'Precocial hatchlings breaking shell with specialized egg tooth caruncle',
      icon: 'egg'
    },
    {
      id: 'stage-2-hatchling',
      stageName: 'Hatchling / Crèche Stage',
      ageRangeYears: '0 – 2 Years',
      ageYearsNum: 1.0,
      bodyMassKg: isSauropod ? 120 : isSmallTheropod ? 2.8 : 85,
      bodyLengthM: isSauropod ? 1.8 : isSmallTheropod ? 0.6 : 1.2,
      nicheDescription: 'Communal crèche grouping for safety against dromaeosaurid and pterosaur predators',
      histologyNotes: 'Fast-growing woven osteonal bone tissue with extensive marrow cavity formation',
      behaviorPattern: 'Rapid ground foraging on ferns, horsetails, and soft riparian undergrowth',
      icon: 'footprints'
    },
    {
      id: 'stage-3-juvenile',
      stageName: 'Juvenile Rapid Growth Band',
      ageRangeYears: '3 – 8 Years',
      ageYearsNum: 5.0,
      bodyMassKg: isSauropod ? 3500 : isSmallTheropod ? 8.5 : 950,
      bodyLengthM: isSauropod ? 8.5 : isSmallTheropod ? 1.2 : 3.8,
      nicheDescription: 'High-speed intermediate growth phase; developing rudimentary display features or armor osteoderms',
      histologyNotes: 'Fibrolamellar bone with prominent cyclical annual LAG rest lines',
      behaviorPattern: 'Segregated juvenile sub-herds foraging in secondary forest fringes',
      icon: 'zap'
    },
    {
      id: 'stage-4-subadult',
      stageName: 'Sub-Adult Maturation Phase',
      ageRangeYears: '9 – 16 Years',
      ageYearsNum: 12.0,
      bodyMassKg: isSauropod ? 24000 : isSmallTheropod ? 14.0 : 5200,
      bodyLengthM: isSauropod ? 18.0 : isSmallTheropod ? 1.7 : 6.5,
      nicheDescription: 'Integration into main herd hierarchy; skull frills, plates, sails, or bite force reach functional apex',
      histologyNotes: 'Primary osteon compaction and development of dense Haversian bone structures',
      behaviorPattern: 'Social hierarchy integration, intraspecific sparring, sexual dimorphism expression',
      icon: 'bone'
    },
    {
      id: 'stage-5-adult',
      stageName: 'Sexually Mature Adult Member',
      ageRangeYears: '17 – 30 Years',
      ageYearsNum: 20.0,
      bodyMassKg: maxMassKg * 0.9,
      bodyLengthM: maxLenM * 0.95,
      nicheDescription: 'Peak reproductive vigor and territorial range control; full osteological and behavioral dominance',
      histologyNotes: 'Outer Fundamental System (EFS) deposition confirming skeletal growth stabilization',
      behaviorPattern: 'Long-distance herd migration, seasonal rutting contests, dominant breeding access',
      icon: 'shield-alert'
    },
    {
      id: 'stage-6-senescent',
      stageName: 'Senescent Veteran Specimen',
      ageRangeYears: '31 – 50+ Years',
      ageYearsNum: 35.0,
      bodyMassKg: maxMassKg,
      bodyLengthM: maxLenM,
      nicheDescription: 'Maximum fossilized dimensions with hyper-ossified joints, cranial fusion, and chronic combat pathology',
      histologyNotes: 'Complete secondary Haversian replacement with thick endosteal bone lamellae',
      behaviorPattern: 'Herd flank guardian or solitary anchor occupying primary ecological feeding cores',
      icon: 'sparkles'
    }
  ];

  const growthCurve: GrowthCurvePoint[] = [
    { ageYears: 0, massKg: stages[0].bodyMassKg, growthRateKgPerDay: 0.02, hasLAG: false, stageName: 'Egg Clutch' },
    { ageYears: 2, massKg: stages[1].bodyMassKg, growthRateKgPerDay: isSauropod ? 0.8 : 0.15, hasLAG: true, stageName: 'Crèche Hatchling' },
    { ageYears: 6, massKg: stages[2].bodyMassKg, growthRateKgPerDay: isSauropod ? 3.5 : 0.45, hasLAG: true, stageName: 'Juvenile Band' },
    { ageYears: 12, massKg: stages[3].bodyMassKg, growthRateKgPerDay: isSauropod ? 8.2 : 0.85, hasLAG: true, stageName: 'Sub-Adult Growth' },
    { ageYears: 20, massKg: stages[4].bodyMassKg, growthRateKgPerDay: isSauropod ? 1.5 : 0.15, hasLAG: true, stageName: 'Adult Maturity' },
    { ageYears: 32, massKg: stages[5].bodyMassKg, growthRateKgPerDay: 0.02, hasLAG: true, stageName: 'Senescent Plateau' }
  ];

  const migrationLapse: SpatioTemporalWaypoint[] = [
    {
      id: 'waypoint-1',
      phaseName: 'Spring Nesting Grounds',
      seasonMonth: 'March – May',
      timeOfYearFraction: 0.2,
      lat: baseLat + 0.65,
      lng: baseLng - 0.75,
      paleoElevationM: 350,
      climateSummary: 'Warm Monsoonal Season (24°C, 180 mm rain)',
      ecologicalActivity: 'Colonial oviposition, nesting mound construction, predator vigilance',
      terrainType: 'Elevated River Terraces & Semi-Arid Savanna Margins'
    },
    {
      id: 'waypoint-2',
      phaseName: 'Summer Riparian Grazing / Hunting Corridor',
      seasonMonth: 'June – August',
      timeOfYearFraction: 0.45,
      lat: baseLat - 0.45,
      lng: baseLng + 0.55,
      paleoElevationM: 160,
      climateSummary: 'Peak Summer Monsoonal Humidity (29°C, 280 mm rain)',
      ecologicalActivity: 'High-volume calorie intake, tracking riverine vegetation flushes',
      terrainType: 'Lush Braided River Delta & Conifer Swamps'
    },
    {
      id: 'waypoint-3',
      phaseName: 'Autumn Trans-Continental Migration',
      seasonMonth: 'September – November',
      timeOfYearFraction: 0.75,
      lat: baseLat - 1.20,
      lng: baseLng - 0.35,
      paleoElevationM: 75,
      climateSummary: 'Temperate Coastal Fringe (21°C, 120 mm rain)',
      ecologicalActivity: 'Mass herd movement traversing seasonal river crossings to avoid seasonal drought',
      terrainType: 'Coastal Lowland Floodplain'
    },
    {
      id: 'waypoint-4',
      phaseName: 'Winter Oasis / Thermal Basin Haven',
      seasonMonth: 'December – February',
      timeOfYearFraction: 0.95,
      lat: baseLat + 0.15,
      lng: baseLng + 0.25,
      paleoElevationM: 210,
      climateSummary: 'Dry Season Mild Thermal Haven (16°C, 40 mm rain)',
      ecologicalActivity: 'Low-metabolism foraging around perennial springs and deep groundwater aquifers',
      terrainType: 'Sheltered Inland Basin & Riparian Oasis'
    }
  ];

  return { stages, growthCurve, migrationLapse };
};
