import { DenominationFormat, GeologicalTimeMarker } from '../types';

export interface TimescaleUnit {
  name: string;
  type: 'eon' | 'era' | 'period' | 'epoch' | 'stage';
  startMa: number;
  endMa: number;
  color: string;
  description: string;
  parent?: string;
}

export const GEOLOGICAL_TIMESCALE: TimescaleUnit[] = [
  // Eons
  { name: 'Hadean', type: 'eon', startMa: 4600, endMa: 4000, color: '#903b68', description: 'Planetary accretion & crust formation' },
  { name: 'Archean', type: 'eon', startMa: 4000, endMa: 2500, color: '#f04368', description: 'Early continental nuclei & proto-life' },
  { name: 'Proterozoic', type: 'eon', startMa: 2500, endMa: 541, color: '#f74370', description: 'Great Oxidation Event & multicellularity' },
  { name: 'Phanerozoic', type: 'eon', startMa: 541, endMa: 0, color: '#9ad9c5', description: 'Visible life & abundant skeletal fossils' },

  // Eras
  { name: 'Paleozoic', type: 'era', startMa: 541, endMa: 251.9, color: '#99c08d', description: 'Ancient life, Cambrian explosion to Permian extinction', parent: 'Phanerozoic' },
  { name: 'Mesozoic', type: 'era', startMa: 251.9, endMa: 66.0, color: '#67c5ca', description: 'Age of Dinosaurs & Reptiles', parent: 'Phanerozoic' },
  { name: 'Cenozoic', type: 'era', startMa: 66.0, endMa: 0, color: '#f2f97c', description: 'Age of Mammals & Avian radiation', parent: 'Phanerozoic' },

  // Periods of Mesozoic (Primary Dinosaur Window) + adjacent
  { name: 'Permian', type: 'period', startMa: 298.9, endMa: 251.9, color: '#F04028', description: 'Synapsid reign and the Great Dying', parent: 'Paleozoic' },
  { name: 'Triassic', type: 'period', startMa: 251.9, endMa: 201.3, color: '#812B92', description: 'Dawn of Archosaurs and first true Dinosaurs', parent: 'Mesozoic' },
  { name: 'Jurassic', type: 'period', startMa: 201.3, endMa: 145.0, color: '#34B2C9', description: 'Sauropod & Stegosaur mega-fauna dominance', parent: 'Mesozoic' },
  { name: 'Cretaceous', type: 'period', startMa: 145.0, endMa: 66.0, color: '#7FB844', description: 'Tyrannosaurs, Ceratopsians & K-Pg bolide impact', parent: 'Mesozoic' },
  { name: 'Paleogene', type: 'period', startMa: 66.0, endMa: 23.03, color: '#FD9A52', description: 'Post-impact recovery & mammalian diversification', parent: 'Cenozoic' },

  // Epochs of Dinosaur Era
  { name: 'Early Triassic', type: 'epoch', startMa: 251.9, endMa: 247.2, color: '#983F9C', description: 'Induan-Olenekian recovery', parent: 'Triassic' },
  { name: 'Middle Triassic', type: 'epoch', startMa: 247.2, endMa: 237.0, color: '#B168B1', description: 'Anisian-Ladinian radiation', parent: 'Triassic' },
  { name: 'Late Triassic', type: 'epoch', startMa: 237.0, endMa: 201.3, color: '#BD80BC', description: 'Carnian-Norian-Rhaetian early dinos (Herrerasaurus, Coelophysis)', parent: 'Triassic' },
  
  { name: 'Early Jurassic', type: 'epoch', startMa: 201.3, endMa: 174.1, color: '#42C6DC', description: 'Hettangian-Toarcian post-extinction expansion (Dilophosaurus)', parent: 'Jurassic' },
  { name: 'Middle Jurassic', type: 'epoch', startMa: 174.1, endMa: 163.5, color: '#80CFDC', description: 'Aalenian-Callovian early mega-sauropods', parent: 'Jurassic' },
  { name: 'Late Jurassic', type: 'epoch', startMa: 163.5, endMa: 145.0, color: '#B3E3EE', description: 'Oxfordian-Tithonian Morrison fauna (Allosaurus, Stegosaurus, Brachiosaurus)', parent: 'Jurassic' },

  { name: 'Early Cretaceous', type: 'epoch', startMa: 145.0, endMa: 100.5, color: '#8CC653', description: 'Berriasian-Albian spinosaurid & iguanodontian radiation', parent: 'Cretaceous' },
  { name: 'Late Cretaceous', type: 'epoch', startMa: 100.5, endMa: 66.0, color: '#A6D277', description: 'Cenomanian-Maastrichtian apex clades (T-Rex, Triceratops, Ankylosaurus)', parent: 'Cretaceous' },

  // Key Stages
  { name: 'Maastrichtian', type: 'stage', startMa: 72.1, endMa: 66.0, color: '#C2E49B', description: 'Terminal Cretaceous stage (Hell Creek, Lance, Scollard)', parent: 'Late Cretaceous' },
  { name: 'Campanian', type: 'stage', startMa: 83.6, endMa: 72.1, color: '#B7DC8B', description: 'Dinosaur Park Formation, Djadokhta (Velociraptor)', parent: 'Late Cretaceous' },
  { name: 'Cenomanian', type: 'stage', startMa: 100.5, endMa: 93.9, color: '#9ACD62', description: 'Kem Kem & Bahariya giant theropods (Spinosaurus, Carcharodontosaurus)', parent: 'Late Cretaceous' },
  { name: 'Kimmeridgian', type: 'stage', startMa: 157.3, endMa: 152.1, color: '#A0DCE9', description: 'Peak Morrison & Lourinhã sauropod ecosystem', parent: 'Late Jurassic' }
];

/**
 * Formats a raw age in Million years ago (Ma) according to denomination format.
 */
export const formatAgeDenomination = (ageMa: number, format: DenominationFormat): string => {
  const years = ageMa * 1_000_000;

  switch (format) {
    case 'scientific': {
      // E.g. 66 Ma -> 6.60 × 10⁷ yr, 150 Ma -> 1.50 × 10⁸ yr, 2.5 Ga -> 2.50 × 10⁹ yr
      const exponent = Math.floor(Math.log10(years));
      const mantissa = (years / Math.pow(10, exponent)).toFixed(2);
      const superscriptMap: Record<string, string> = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻'
      };
      const expStr = exponent.toString().split('').map(c => superscriptMap[c] || c).join('');
      return `${mantissa} × 10${expStr} yr`;
    }

    case 'metric_si': {
      if (ageMa >= 1000) {
        return `${(ageMa / 1000).toFixed(3)} Ga (Giga-annum)`;
      } else if (ageMa >= 1) {
        return `${ageMa.toFixed(1)} Ma (Mega-annum)`;
      } else {
        return `${(ageMa * 1000).toFixed(0)} ka (kilo-annum)`;
      }
    }

    case 'place_value': {
      if (ageMa >= 1_000_000) {
        return `${(ageMa / 1_000_000).toFixed(3)} Trillion Years`;
      } else if (ageMa >= 1_000) {
        return `${(ageMa / 1_000).toFixed(3)} Billion Years (${(ageMa / 1_000_000).toExponential(2)} Trillion)`;
      } else if (ageMa >= 1) {
        return `${ageMa.toFixed(1)} Million Years (${(ageMa / 1_000).toFixed(3)} Billion / ${(ageMa / 1_000_000).toFixed(6)} Trillion)`;
      } else {
        return `${(ageMa * 1000).toFixed(1)} Thousand Years`;
      }
    }

    case 'exact_years':
    default:
      return `${years.toLocaleString()} Years Ago`;
  }
};

/**
 * Builds full scientific GeologicalTimeMarker structure from age or period name.
 */
export const buildGeologicalTimeMarker = (ageStr: string, periodStr: string, eraStr: string): GeologicalTimeMarker => {
  // Extract numerical Ma if present, else estimate from period
  let ageMa = 68.0;
  const match = ageStr.match(/(\d+(\.\d+)?)/);
  if (match) {
    ageMa = parseFloat(match[1]);
  } else if (periodStr.toLowerCase().includes('jurassic')) {
    ageMa = 152.0;
  } else if (periodStr.toLowerCase().includes('triassic')) {
    ageMa = 220.0;
  } else if (periodStr.toLowerCase().includes('early cretaceous')) {
    ageMa = 112.0;
  } else {
    ageMa = 67.0;
  }

  const years = ageMa * 1_000_000;
  const exponent = Math.floor(Math.log10(years));
  const mantissa = (years / Math.pow(10, exponent)).toFixed(2);
  const superscriptMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  const expStr = exponent.toString().split('').map(c => superscriptMap[c] || c).join('');

  // Determine ICS Colors
  let icsPeriodColor = '#7FB844'; // Cretaceous
  let icsEpochColor = '#A6D277';
  let epoch = 'Late Cretaceous';
  let ageStage = 'Maastrichtian';

  if (ageMa > 201.3) {
    icsPeriodColor = '#812B92'; // Triassic
    icsEpochColor = '#BD80BC';
    epoch = 'Late Triassic';
    ageStage = 'Carnian/Norian';
  } else if (ageMa > 145.0) {
    icsPeriodColor = '#34B2C9'; // Jurassic
    icsEpochColor = '#B3E3EE';
    epoch = 'Late Jurassic';
    ageStage = 'Kimmeridgian/Tithonian';
  } else if (ageMa > 100.5) {
    icsPeriodColor = '#7FB844';
    icsEpochColor = '#8CC653';
    epoch = 'Early Cretaceous';
    ageStage = 'Albian/Aptian';
  }

  return {
    eon: 'Phanerozoic',
    era: 'Mesozoic',
    period: periodStr.toUpperCase().includes('JURASSIC') ? 'Jurassic' : periodStr.toUpperCase().includes('TRIASSIC') ? 'Triassic' : 'Cretaceous',
    epoch,
    ageStage,
    exactAgeMa: ageMa,
    scientificYears: `${mantissa} × 10${expStr} yr`,
    placeValueDenomination: `${ageMa.toFixed(1)} Million Years (${(ageMa / 1000).toFixed(4)} Billion)`,
    teraAnnum: `${(ageMa / 1_000_000).toFixed(6)} Ta (Trillion-yr)`,
    gigaAnnum: `${(ageMa / 1000).toFixed(3)} Ga (Billion-yr)`,
    megaAnnum: `${ageMa.toFixed(1)} Ma (Million-yr)`,
    kiloAnnum: `${(ageMa * 1000).toLocaleString()} ka (Thousand-yr)`,
    icsPeriodColor,
    icsEpochColor
  };
};
