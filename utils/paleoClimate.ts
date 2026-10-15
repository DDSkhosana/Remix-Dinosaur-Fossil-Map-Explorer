import { ClimateVariables } from '../types';

export interface PaleoclimateTimePoint {
  ageMa: number;
  period: string;
  meanTempC: number;
  tempAnomalyC: number;
  co2Ppm: number;
  oxygenPercent: number;
  seaLevelM: number;
  summary: string;
}

// Deep time climate curve through the Mesozoic Era
export const MESOZOIC_CLIMATE_CURVE: PaleoclimateTimePoint[] = [
  { ageMa: 250, period: 'Early Triassic', meanTempC: 28.5, tempAnomalyC: 13.5, co2Ppm: 2400, oxygenPercent: 15.2, seaLevelM: 20, summary: 'Extreme hothouse following the End-Permian extinction, lethal equatorial heat' },
  { ageMa: 230, period: 'Late Triassic (Carnian)', meanTempC: 24.2, tempAnomalyC: 9.2, co2Ppm: 1850, oxygenPercent: 17.5, seaLevelM: 40, summary: 'Carnian Pluvial Episode: intense global rainfall, expansion of lush conifer forests' },
  { ageMa: 200, period: 'Early Jurassic', meanTempC: 21.0, tempAnomalyC: 6.0, co2Ppm: 1250, oxygenPercent: 18.8, seaLevelM: 60, summary: 'Warm greenhouse with humid poles, breakup of Pangaea begins' },
  { ageMa: 150, period: 'Late Jurassic', meanTempC: 22.5, tempAnomalyC: 7.5, co2Ppm: 1600, oxygenPercent: 22.4, seaLevelM: 90, summary: 'Uniformly warm climate, semi-arid savanna basins & lush coastal fern prairies' },
  { ageMa: 110, period: 'Early Cretaceous (Aptian)', meanTempC: 23.8, tempAnomalyC: 8.8, co2Ppm: 1900, oxygenPercent: 24.1, seaLevelM: 140, summary: 'Oceanic Anoxic Event, high volcanic degassing, extensive shallow epicontinental seas' },
  { ageMa: 90, period: 'Mid Cretaceous (Cenomanian)', meanTempC: 27.0, tempAnomalyC: 12.0, co2Ppm: 2100, oxygenPercent: 26.5, seaLevelM: 220, summary: 'Cretaceous Thermal Maximum: ice-free poles, polar breadfruit & dinosaur nesting' },
  { ageMa: 75, period: 'Late Cretaceous (Campanian)', meanTempC: 21.5, tempAnomalyC: 6.5, co2Ppm: 1400, oxygenPercent: 28.2, seaLevelM: 150, summary: 'Western Interior Seaway peak, subtropical river floodplains' },
  { ageMa: 66, period: 'Late Cretaceous (Maastrichtian)', meanTempC: 19.8, tempAnomalyC: 4.8, co2Ppm: 1100, oxygenPercent: 30.0, seaLevelM: 80, summary: 'Slight cooling trend, Deccan volcanism greenhouse pulse before Chicxulub bolide impact' }
];

export interface FloraPlant {
  name: string;
  scientific: string;
  stratum: 'canopy' | 'understory' | 'ground';
  height: string;
  paleoNote: string;
  browseSignificance: string;
}

export interface PaleoBiome {
  id: string;
  name: string;
  category: 'Wetland & Coastal' | 'Floodplain & Lowland' | 'Savanna & Prairie' | 'Arid & Desert' | 'Polar & Boreal';
  color: string;
  fillHex: string;
  tempRangeC: string;
  annualRainfallMm: string;
  characteristics: string;
  flora: string;
  typicalTempC: number;
  minTempC: number;
  maxTempC: number;
  typicalCo2Ppm: number;
  typicalSeaLevelM: number;
  typicalPrecipitationMm: number;
  humidityIndex: 'Hyper-Arid' | 'Semi-Arid' | 'Sub-Humid' | 'Humid' | 'Perhumid';
  koppenEquivalent: string;
  soilSedimentFacies: string;
  associatedFormations: string[];
  associatedTaxa: string[];
  floraStratum: {
    canopy: FloraPlant[];
    understory: FloraPlant[];
    ground: FloraPlant[];
  };
}

export const PALEO_BIOMES: PaleoBiome[] = [
  {
    id: 'megathermal_rainforest',
    name: 'Megathermal Wetland / Rainforest',
    category: 'Wetland & Coastal',
    color: '#059669',
    fillHex: '#10b981',
    tempRangeC: '26°C – 34°C',
    annualRainfallMm: '2,200 – 4,000 mm/yr',
    characteristics: 'Hyper-dense canopy, permanent humidity, extensive deltaic swamps and river networks',
    flora: 'Giant horsetails (Equisetites), cycads, bennettitaleans, tree ferns',
    typicalTempC: 30.0,
    minTempC: 26,
    maxTempC: 34,
    typicalCo2Ppm: 2100,
    typicalSeaLevelM: 215,
    typicalPrecipitationMm: 3100,
    humidityIndex: 'Perhumid',
    koppenEquivalent: 'Af (Tropical Megathermal Rainforest)',
    soilSedimentFacies: 'Carbonaceous mudstone, mangrove deltaic silts, peat & lignite swamp horizons',
    associatedFormations: ['Kem Kem Beds (Morocco)', 'Bahariya Oasis (Egypt)', 'Chenini Formation (Tunisia)', 'Weald Basin (UK)'],
    associatedTaxa: ['Spinosaurus', 'Baryonyx', 'Carcharodontosaurus'],
    floraStratum: {
      canopy: [
        {
          name: 'Giant Araucarians',
          scientific: 'Araucariaceae indet.',
          stratum: 'canopy',
          height: '35m – 45m',
          paleoNote: 'Massive resinous conifers forming high emergent crowns above dense riparian wetlands.',
          browseSignificance: 'High-fiber seed cones browsed by long-necked sauropods.'
        },
        {
          name: 'Extinct Bennettitales',
          scientific: 'Zamites & Williamsonia',
          stratum: 'canopy',
          height: '10m – 16m',
          paleoNote: 'Flower-like reproductive strobili with thick leathery foliage adapted to tropical downpours.',
          browseSignificance: 'Primary foliage browse for mid-canopy herbivores.'
        }
      ],
      understory: [
        {
          name: 'Giant Tree Ferns',
          scientific: 'Dicksoniaceae (Coniopteris)',
          stratum: 'understory',
          height: '4m – 8m',
          paleoNote: 'Shade-tolerant arborescent ferns with fibrous trunk mantles thriving in permanent mist.',
          browseSignificance: 'Nutrient-rich tender croziers and fronds favored by juvenile herbivores.'
        },
        {
          name: 'Thick-Trunk Cycads',
          scientific: 'Nilssonia & Cycadites',
          stratum: 'understory',
          height: '2m – 4m',
          paleoNote: 'Tough, slow-growing pinnate fronds with neurotoxic cycasin defenses.',
          browseSignificance: 'Chewed by armored ornithischians with specialized grinding dentition.'
        }
      ],
      ground: [
        {
          name: 'Giant Horsetails',
          scientific: 'Equisetites beanii',
          stratum: 'ground',
          height: '1.5m – 3.5m',
          paleoNote: 'Jointed silica-sheathed hollow stems lining delta waterways and stabilizing muddy banks.',
          browseSignificance: 'High-silica abrasive diet requiring heavy dental battery wear.'
        },
        {
          name: 'Royal Fern Spikes',
          scientific: 'Osmundastrum cinnamomeum ancestor',
          stratum: 'ground',
          height: '0.8m – 1.2m',
          paleoNote: 'Dense rhizomatous ground mats carpeting deltaic soils and surviving seasonal floods.',
          browseSignificance: 'Ground-level foraging for hadrosaurs and small ornithopods.'
        }
      ]
    }
  },
  {
    id: 'subtropical_floodplain',
    name: 'Subtropical River Floodplain',
    category: 'Floodplain & Lowland',
    color: '#65a30d',
    fillHex: '#84cc16',
    tempRangeC: '20°C – 28°C',
    annualRainfallMm: '1,200 – 2,000 mm/yr',
    characteristics: 'Seasonal monsoonal rainfall, braided river channels, rich fertile organic soils',
    flora: 'Ginkgoes, conifers (Araucaria, Metasequoia), early angiosperms, magnolias',
    typicalTempC: 24.0,
    minTempC: 20,
    maxTempC: 28,
    typicalCo2Ppm: 1200,
    typicalSeaLevelM: 165,
    typicalPrecipitationMm: 1650,
    humidityIndex: 'Humid',
    koppenEquivalent: 'Cfa (Humid Subtropical Greenhouse)',
    soilSedimentFacies: 'Fluvial point-bar sandstones, overbank floodplain mudstones, paleosols with root-casts',
    associatedFormations: ['Hell Creek (Montana/Dakotas)', 'Lance Formation (Wyoming)', 'Dinosaur Park (Alberta)', 'Scollard Formation (Alberta)'],
    associatedTaxa: ['Tyrannosaurus Rex', 'Triceratops', 'Edmontosaurus', 'Ankylosaurus', 'Pachycephalosaurus'],
    floraStratum: {
      canopy: [
        {
          name: 'Dawn Redwood',
          scientific: 'Metasequoia occidentalis',
          stratum: 'canopy',
          height: '30m – 40m',
          paleoNote: 'Deciduous conifer dominant along overbank riparian terraces; shed soft needles seasonally.',
          browseSignificance: 'Upper canopy forage for adult hadrosaurs like Edmontosaurus.'
        },
        {
          name: 'Prehistoric Ginkgo',
          scientific: 'Ginkgo adiantoides',
          stratum: 'canopy',
          height: '18m – 25m',
          paleoNote: 'Fan-shaped leaves resilient to insect herbivory and floodplain disturbances.',
          browseSignificance: 'Fleshy seeds and leaves eaten by diverse herbivorous taxa.'
        }
      ],
      understory: [
        {
          name: 'Early Magnolia & Laurel',
          scientific: 'Magnoliaceae & Lauraceae indet.',
          stratum: 'understory',
          height: '4m – 9m',
          paleoNote: 'Rapidly radiating flowering angiosperms with broad leaves and beetle-pollinated blooms.',
          browseSignificance: 'High-protein forage supporting flourishing Late Cretaceous ornithischians.'
        },
        {
          name: 'Swamp Cypress',
          scientific: 'Taxodium olrikii',
          stratum: 'understory',
          height: '8m – 15m',
          paleoNote: 'Pneumatophore root-bearing wetland trees lining oxbow lakes and crevasse splays.',
          browseSignificance: 'Shelter and soft forage for ceratopsians.'
        }
      ],
      ground: [
        {
          name: 'Cinnamon Fern Mats',
          scientific: 'Osmunda hollicki',
          stratum: 'ground',
          height: '0.6m – 1.0m',
          paleoNote: 'Dense herbaceous underbrush holding fertile alluvial silt between monsoons.',
          browseSignificance: 'Primary bulk graze for Triceratops and armored Ankylosaurus.'
        },
        {
          name: 'Riparian Rushes',
          scientific: 'Sparganiaceae ancestor',
          stratum: 'ground',
          height: '0.4m – 0.9m',
          paleoNote: 'Aquatic and semi-aquatic reeds lining river bends and sluggish sloughs.',
          browseSignificance: 'Low-browse forage for duck-billed dinosaurs.'
        }
      ]
    }
  },
  {
    id: 'semi_arid_savanna',
    name: 'Semi-Arid Savanna & Fern Prairie',
    category: 'Savanna & Prairie',
    color: '#d97706',
    fillHex: '#f59e0b',
    tempRangeC: '18°C – 32°C',
    annualRainfallMm: '400 – 900 mm/yr',
    characteristics: 'Prolonged dry season with wet pulses, open expanses with riparian corridors',
    flora: 'Fern ground-cover (fern spikes), drought-tolerant conifers, cycadeoids',
    typicalTempC: 25.0,
    minTempC: 18,
    maxTempC: 32,
    typicalCo2Ppm: 1650,
    typicalSeaLevelM: 95,
    typicalPrecipitationMm: 780,
    humidityIndex: 'Semi-Arid',
    koppenEquivalent: 'Aw (Tropical Wet/Dry Savanna)',
    soilSedimentFacies: 'Variegated reddish-green smectite mudstones, caliche carbonate nodule paleosols, seasonal lake clays',
    associatedFormations: ['Morrison Formation (Colorado/Utah/Wyoming)', 'Tendaguru Formation (Tanzania)', 'Lourinhã Formation (Portugal)'],
    associatedTaxa: ['Stegosaurus', 'Brachiosaurus', 'Diplodocus', 'Allosaurus'],
    floraStratum: {
      canopy: [
        {
          name: 'Scaly Conifers',
          scientific: 'Cheirolepidiaceae (Brachyphyllum)',
          stratum: 'canopy',
          height: '20m – 30m',
          paleoNote: 'Drought-hardy gymnosperms with thick waxy cuticles that resist arid seasonal desiccation.',
          browseSignificance: 'Specialized browse for ultra-long-necked sauropods like Brachiosaurus.'
        },
        {
          name: 'Hoop Pine Ancestor',
          scientific: 'Araucaria mirabilis',
          stratum: 'canopy',
          height: '25m – 35m',
          paleoNote: 'Pachycaul conifer with heavily armored seed cones and spiraled sharp leaves.',
          browseSignificance: 'High-canopy niche browse out of reach of all other herbivores.'
        }
      ],
      understory: [
        {
          name: 'Barrel Cycadeoids',
          scientific: 'Cycadeoidea dacotensis',
          stratum: 'understory',
          height: '1.5m – 3.0m',
          paleoNote: 'Squat, armored barrel-like trunks covered with persistent leaf bases and bisexual cones.',
          browseSignificance: 'Tough vegetative matter browsed by Stegosaurus with narrow beak slices.'
        },
        {
          name: 'Shrubby Ephedroids',
          scientific: 'Ephedraceae morphotype',
          stratum: 'understory',
          height: '1.0m – 2.0m',
          paleoNote: 'Photosynthetic jointed twigs with reduced scale leaves adapted to savanna scrub.',
          browseSignificance: 'Low-browse dry season sustenance.'
        }
      ],
      ground: [
        {
          name: 'Fern Prairie Carpet',
          scientific: 'Gleichenites & Hausmannia',
          stratum: 'ground',
          height: '0.3m – 0.8m',
          paleoNote: 'Extensive open fern meadows (fern savannas) that functioned ecologically like modern grasses.',
          browseSignificance: 'Extensive grazing turf cropped by low-browsing Diplodocus and Camptosaurus.'
        },
        {
          name: 'Ephemeral Oasis Rushes',
          scientific: 'Isoetites (quillworts)',
          stratum: 'ground',
          height: '0.2m – 0.5m',
          paleoNote: 'Flash-sprouting aquatic flora around seasonal playas and dried river washes.',
          browseSignificance: 'Rapid opportunistic forage during short monsoonal pulses.'
        }
      ]
    }
  },
  {
    id: 'eolian_arid_dune',
    name: 'Eolian Erg & Hyper-Arid Desert',
    category: 'Arid & Desert',
    color: '#ea580c',
    fillHex: '#fb923c',
    tempRangeC: '15°C – 42°C (High diurnal swing)',
    annualRainfallMm: '< 250 mm/yr',
    characteristics: 'Migrating sand dunes, ephemeral oasis waterholes, sudden sandstorm events',
    flora: 'Xerophytic scrub, scrub conifers, oasis rushes',
    typicalTempC: 28.5,
    minTempC: 15,
    maxTempC: 42,
    typicalCo2Ppm: 1450,
    typicalSeaLevelM: 110,
    typicalPrecipitationMm: 210,
    humidityIndex: 'Hyper-Arid',
    koppenEquivalent: 'BWh (Hot Paleo-Desert)',
    soilSedimentFacies: 'Cross-bedded red eolian quartz sandstone, structureless dune-collapse beds, calcrete crusts',
    associatedFormations: ['Djadokhta Formation (Gobi Desert)', 'Bayan Mandahu (Inner Mongolia)', 'Flaming Cliffs (Mongolia)'],
    associatedTaxa: ['Velociraptor', 'Protoceratops', 'Oviraptor'],
    floraStratum: {
      canopy: [
        {
          name: 'Sparse Desert Conifers',
          scientific: 'Pseudofrenelopsis sp.',
          stratum: 'canopy',
          height: '4m – 8m',
          paleoNote: 'Heavily stunted, jointed succulent conifers cluster solely near deep subterranean aquifers.',
          browseSignificance: 'Scattered emergency foliage for desert ceratopsians.'
        }
      ],
      understory: [
        {
          name: 'Xerophytic Salt Scrub',
          scientific: 'Cheirolepidiaceae scrub',
          stratum: 'understory',
          height: '1.0m – 2.0m',
          paleoNote: 'Deep taproots anchoring moving dune margins with salt-secreting epidermal glands.',
          browseSignificance: 'Primary dry-season browse for Protoceratops.'
        },
        {
          name: 'Desert Ephedra Scrub',
          scientific: 'Protoephedra deserti',
          stratum: 'understory',
          height: '0.8m – 1.5m',
          paleoNote: 'Whip-like photosynthetic branches tolerating fierce blowing sand and high daytime heat.',
          browseSignificance: 'Stalks cropped by small desert theropods and herbivores.'
        }
      ],
      ground: [
        {
          name: 'Playa Charophytes & Algae',
          scientific: 'Characeae microflora',
          stratum: 'ground',
          height: '0.1m – 0.3m',
          paleoNote: 'Calcified green algae forming thick organic crusts across temporary interdune wet playas.',
          browseSignificance: 'Rich source of calcium and water for nesting dinosaurs.'
        },
        {
          name: 'Inter-dune Oasis Rushes',
          scientific: 'Equisetum sand-form',
          stratum: 'ground',
          height: '0.3m – 0.7m',
          paleoNote: 'Clustered around ephemeral waterholes where dinosaur nesting colonies gathered.',
          browseSignificance: 'High-moisture green browse during egg-laying season.'
        }
      ]
    }
  },
  {
    id: 'polar_greenhouse_forest',
    name: 'Polar Deciduous Greenhouse Woodland',
    category: 'Polar & Boreal',
    color: '#0284c7',
    fillHex: '#38bdf8',
    tempRangeC: '4°C – 18°C (No winter sea ice)',
    annualRainfallMm: '800 – 1,400 mm/yr',
    characteristics: 'Months of continuous summer daylight & winter polar twilight without permanent ice caps',
    flora: 'Deciduous conifers, polar ferns, moss carpets, evergreen podocarps',
    typicalTempC: 11.5,
    minTempC: 4,
    maxTempC: 18,
    typicalCo2Ppm: 1350,
    typicalSeaLevelM: 140,
    typicalPrecipitationMm: 950,
    humidityIndex: 'Sub-Humid',
    koppenEquivalent: 'Dfb (Humid Continental / Polar Forest)',
    soilSedimentFacies: 'Volcanic ash tuffs, cryoturbated organic paleosols, fossil wood beds with clear annual rings',
    associatedFormations: ['Prince Creek Formation (North Slope, Alaska)', 'Dinosaur Cove (Victoria, Australia)', 'Wapiti Formation (Northern Alberta)'],
    associatedTaxa: ['Albertosaurus', 'Edmontosaurus', 'Troodon'],
    floraStratum: {
      canopy: [
        {
          name: 'Deciduous Conifers',
          scientific: 'Parataxodium & Pseudolarix',
          stratum: 'canopy',
          height: '20m – 30m',
          paleoNote: 'Needles shed annually to survive 3 months of complete winter polar night without sunlight.',
          browseSignificance: 'Explosive spring and summer foliage browse for migrating herds.'
        },
        {
          name: 'Polar Maidenhair Tree',
          scientific: 'Ginkgo polaris',
          stratum: 'canopy',
          height: '15m – 22m',
          paleoNote: 'Fast summer photosynthetic flush under 24-hour continuous arctic sunshine.',
          browseSignificance: 'Rich summer nutrition for juvenile polar theropods and ornithopods.'
        }
      ],
      understory: [
        {
          name: 'Cold-Tolerant Podocarps',
          scientific: 'Podozamites & Elatocladus',
          stratum: 'understory',
          height: '3m – 7m',
          paleoNote: 'Broad-leaved gymnosperms with resin ducts resistant to sub-freezing winter ground frosts.',
          browseSignificance: 'Evergreen winter browse during the dark polar night.'
        },
        {
          name: 'Arctic Birch Ancestor',
          scientific: 'Early Betulaceae / Angiosperm scrub',
          stratum: 'understory',
          height: '2m – 4m',
          paleoNote: 'Deciduous woody shrubs with rapid bud-burst timing keyed to polar spring solstice.',
          browseSignificance: 'Spring forage for hadrosaurs returning from southern migrations.'
        }
      ],
      ground: [
        {
          name: 'Polar Fern & Moss Carpet',
          scientific: 'Coniopteris & Sphagnum sp.',
          stratum: 'ground',
          height: '0.2m – 0.6m',
          paleoNote: 'Insulative thick moss and peat cushions that protected dinosaur nesting mounds from chill.',
          browseSignificance: 'Nesting material and soft undergrowth for hatchlings.'
        },
        {
          name: 'Sub-Arctic Horsetails',
          scientific: 'Equisetum arcticum',
          stratum: 'ground',
          height: '0.4m – 0.8m',
          paleoNote: 'Stands along polar braided rivers fed by spring snow and highland meltwaters.',
          browseSignificance: 'High mineral content forage supporting rapid seasonal growth.'
        }
      ]
    }
  }
];

export const getClimateVariablesForTaxon = (climateDesc: string, periodDesc: string, lat: number): ClimateVariables => {
  const desc = (climateDesc + ' ' + periodDesc).toLowerCase();
  
  if (desc.includes('arid') || desc.includes('desert') || desc.includes('dune')) {
    return {
      meanTempC: 29.4,
      tempAnomalyC: 14.4,
      co2Ppm: 1450,
      oxygenPercent: 27.5,
      precipitationMmYr: 210,
      humidityIndex: 'Hyper-Arid',
      biome: 'Eolian Erg & Desert Dunes (Djadokhta / Flaming Cliffs)',
      koppenEquivalent: 'BWh (Hot Paleo-Desert)',
      solarInsolationWpm2: 320,
      seaLevelAnomalyM: 110
    };
  } else if (desc.includes('subtropical') || desc.includes('wetland') || desc.includes('floodplain')) {
    return {
      meanTempC: 23.5,
      tempAnomalyC: 8.5,
      co2Ppm: 1200,
      oxygenPercent: 29.0,
      precipitationMmYr: 1650,
      humidityIndex: 'Humid',
      biome: 'Subtropical Coastal Lowland Floodplain (Hell Creek / Lance)',
      koppenEquivalent: 'Cfa (Humid Subtropical Greenhouse)',
      solarInsolationWpm2: 245,
      seaLevelAnomalyM: 165
    };
  } else if (desc.includes('delta') || desc.includes('estuary') || desc.includes('riverine') || desc.includes('swamp')) {
    return {
      meanTempC: 28.2,
      tempAnomalyC: 13.2,
      co2Ppm: 2100,
      oxygenPercent: 26.0,
      precipitationMmYr: 2850,
      humidityIndex: 'Perhumid',
      biome: 'Megathermal Riverine Delta & Estuary (Kem Kem / Bahariya)',
      koppenEquivalent: 'Af (Tropical Megathermal Rainforest)',
      solarInsolationWpm2: 290,
      seaLevelAnomalyM: 215
    };
  } else if (desc.includes('savanna') || desc.includes('lake') || desc.includes('morrison') || desc.includes('jurassic')) {
    return {
      meanTempC: 22.0,
      tempAnomalyC: 7.0,
      co2Ppm: 1650,
      oxygenPercent: 23.0,
      precipitationMmYr: 780,
      humidityIndex: 'Semi-Arid',
      biome: 'Seasonal Savanna & Braided River Basin (Morrison Formation)',
      koppenEquivalent: 'Aw (Tropical Wet/Dry Savanna)',
      solarInsolationWpm2: 260,
      seaLevelAnomalyM: 95
    };
  }

  // Default based on latitude
  const absLat = Math.abs(lat);
  if (absLat > 55) {
    return {
      meanTempC: 12.0,
      tempAnomalyC: 10.0,
      co2Ppm: 1350,
      oxygenPercent: 28.0,
      precipitationMmYr: 950,
      humidityIndex: 'Sub-Humid',
      biome: 'Polar Greenhouse Deciduous Forest',
      koppenEquivalent: 'Dfb (Humid Continental / Polar Forest)',
      solarInsolationWpm2: 175,
      seaLevelAnomalyM: 140
    };
  }

  return {
    meanTempC: 24.0,
    tempAnomalyC: 9.0,
    co2Ppm: 1500,
    oxygenPercent: 28.0,
    precipitationMmYr: 1400,
    humidityIndex: 'Humid',
    biome: 'Warm Temperate Coastal Plains',
    koppenEquivalent: 'Cwa (Monsoonal Subtropical)',
    solarInsolationWpm2: 250,
    seaLevelAnomalyM: 150
  };
};
