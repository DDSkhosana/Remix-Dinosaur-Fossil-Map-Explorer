import { LocomotionCategory, LocomotionMetrics } from '../types';

export const calculateFroudeNumber = (velocityMs: number, hipHeightM: number): number => {
  const g = 9.81; // m/s^2
  if (hipHeightM <= 0) return 0;
  return parseFloat(((velocityMs * velocityMs) / (g * hipHeightM)).toFixed(2));
};

export const getLocomotionMetricsForDino = (name: string, diet: string, threatScore: number): LocomotionMetrics => {
  const n = name.toLowerCase();

  // 1. Spinosaurus (Semi-aquatic tail propulsion & bipedal/quadrupedal shore wading)
  if (n.includes('spinosaurus')) {
    const hipHeightM = 4.2;
    const topSpeedKmh = 25.0;
    const speedMs = topSpeedKmh / 3.6;
    return {
      category: 'semi_aquatic_propulsion',
      categoryLabel: 'Semi-Aquatic Lateral Tail Propulsion & Wading Bipedalism',
      posture: 'Semi-erect Low-Slung / Aquatic Propulsive with webbed unguals',
      topSpeedKmh,
      cruisingSpeedKmh: 12.0,
      strideLengthM: 3.8,
      hipHeightM,
      froudeNumber: calculateFroudeNumber(speedMs, hipHeightM),
      gaitMode: 'Submerged Lateral Undulation',
      dutyFactorPercent: 62,
      paceAngulationDeg: 148,
      trackGaugeWidthCm: 85,
      manusPesRatio: '0.45 : 1.0 (Narrow manus, flat broad paddle-like pes)',
      centerOfMassPosition: 'Anterior mid-torso (Optimized for swimming trim & floating equilibrium)',
      groundReactionForceKn: 92.5,
      locomotionFeatures: [
        'Hyper-elongated neural spines forming a hydrodynamic dorsal stabilizer',
        'Paddle-like laterally flattened tail specialized for aquatic thrust',
        'Dense pachyostotic bones serving as biological diving ballast',
        'Retracted nostrils enabling surface breathing during fish pursuit'
      ]
    };
  }

  // 2. Velociraptor / Dromaeosaurs (Hyper-cursorial agile bipedal)
  if (n.includes('velociraptor') || n.includes('deinonychus') || n.includes('utahraptor')) {
    const hipHeightM = 0.65;
    const topSpeedKmh = 42.0;
    const speedMs = topSpeedKmh / 3.6;
    return {
      category: 'bipedal_cursorial',
      categoryLabel: 'Hyper-Cursorial Dynamic Bipedalism',
      posture: 'Digitigrade Bipedal with Didactyl Footfall (Sickle claw hyperextended in digit II)',
      topSpeedKmh,
      cruisingSpeedKmh: 18.0,
      strideLengthM: 2.4,
      hipHeightM,
      froudeNumber: calculateFroudeNumber(speedMs, hipHeightM),
      gaitMode: 'Fast Cursorial Sprint',
      dutyFactorPercent: 28,
      paceAngulationDeg: 176,
      trackGaugeWidthCm: 16,
      manusPesRatio: '0.0 : 1.0 (Non-weight bearing raptorial forelimbs)',
      centerOfMassPosition: 'Directly over acetabulum / hip joint balanced by ossified stiff tail rods',
      groundReactionForceKn: 0.85,
      locomotionFeatures: [
        'Stiffened caudal rod bundle functioning as dynamic aerodynamic counterbalance rudder',
        'Functional didactyl footfall keeping lethal sickle claw razor-sharp off the substrate',
        'High metric cursoriality index (tibiotarsus + metatarsus > femur ratio)',
        'Spring-loaded iliofibularis musculature generating high explosive acceleration'
      ]
    };
  }

  // 3. Tyrannosaurus Rex / Giganotosaurus / Allosaurus (Giant Cursorial Theropods)
  if (n.includes('tyrannosaurus') || n.includes('rex') || n.includes('allosaurus') || n.includes('giganotosaurus') || n.includes('carnotaurus')) {
    const isTRex = n.includes('tyrannosaurus') || n.includes('rex');
    const hipHeightM = isTRex ? 3.9 : 3.4;
    const topSpeedKmh = isTRex ? 28.0 : 34.0;
    const speedMs = topSpeedKmh / 3.6;
    return {
      category: 'bipedal_cursorial',
      categoryLabel: 'Sub-Cursorial Pelvic Pendulum Bipedalism',
      posture: 'Digitigrade Tridactyl Bipedal with Arctometatarsalian shock absorption',
      topSpeedKmh,
      cruisingSpeedKmh: 14.0,
      strideLengthM: 4.6,
      hipHeightM,
      froudeNumber: calculateFroudeNumber(speedMs, hipHeightM),
      gaitMode: 'Trot',
      dutyFactorPercent: 42,
      paceAngulationDeg: 168,
      trackGaugeWidthCm: 52,
      manusPesRatio: '0.0 : 1.0 (Vestigial forelimbs, strictly bipedal)',
      centerOfMassPosition: 'Over pelvic girdle (counter-balanced by massive caudofemoralis longus muscle)',
      groundReactionForceKn: 65.0,
      locomotionFeatures: [
        'Arctometatarsalian foot structure: pinch-middle metatarsal dispersing multi-ton ground impacts',
        'Massive M. caudofemoralis longus originating from tail anchors directly to femoral fourth trochanter',
        'Elastic energy storage in digital flexor tendons mitigating bone stress during stride',
        'Optimal biomechanical pacing avoiding flight phase to prevent dangerous ground impact fractures'
      ]
    };
  }

  // 4. Brachiosaurus / Sauropods (Giant Graviportal Quadrupeds)
  if (n.includes('brachiosaurus') || n.includes('sauropod') || n.includes('diplodocus') || n.includes('apatosaurus')) {
    const hipHeightM = 6.2;
    const topSpeedKmh = 14.0;
    const speedMs = topSpeedKmh / 3.6;
    return {
      category: 'quadrupedal_graviportal',
      categoryLabel: 'Massive Graviportal Pillar-Erect Quadrupedalism',
      posture: 'Unguligrade Forelimbs / Semi-Digitigrade Hindlimbs with fibro-cartilaginous heel pads',
      topSpeedKmh,
      cruisingSpeedKmh: 6.5,
      strideLengthM: 3.2,
      hipHeightM,
      froudeNumber: calculateFroudeNumber(speedMs, hipHeightM),
      gaitMode: 'Graviportal Paced Stride',
      dutyFactorPercent: 78,
      paceAngulationDeg: 142,
      trackGaugeWidthCm: 140,
      manusPesRatio: '0.65 : 1.0 (Horseshoe crescent manus, massive oval elephantine pes)',
      centerOfMassPosition: 'Mid-pectoral torso (Forelimbs taller than hindlimbs carrying 60% of total mass)',
      groundReactionForceKn: 380.0,
      locomotionFeatures: [
        'Columnar vertical limb orientation eliminating bending stresses under 50-tonne gravitational loads',
        'Thick fibro-elastic heel cushion beneath pad spreading peak impact pressures over 1 m²',
        'Loss of distal phalanges in manus forming a solid bone horseshoe stilt for high browsing reach',
        'Diagonal-couplet footfall sequence maintaining triple-limb ground support triangle at all phases'
      ]
    };
  }

  // 5. Triceratops / Ceratopsia (Heavy Sprawling-to-Erect Quadrupedal)
  if (n.includes('triceratops') || n.includes('ceratops') || n.includes('styracosaurus')) {
    const hipHeightM = 2.4;
    const topSpeedKmh = 32.0;
    const speedMs = topSpeedKmh / 3.6;
    return {
      category: 'armored_quadruped',
      categoryLabel: 'Semi-Erect Heavy Charging Quadrupedalism',
      posture: 'Semi-sprawling Pectoral Forelimbs, Pillar-erect Pelvic Hindlimbs',
      topSpeedKmh,
      cruisingSpeedKmh: 12.0,
      strideLengthM: 2.8,
      hipHeightM,
      froudeNumber: calculateFroudeNumber(speedMs, hipHeightM),
      gaitMode: 'Trot',
      dutyFactorPercent: 54,
      paceAngulationDeg: 154,
      trackGaugeWidthCm: 110,
      manusPesRatio: '0.55 : 1.0 (Five-toed hoofed manus, four-toed broad pes)',
      centerOfMassPosition: 'Slightly anterior to pelvic girdle beneath massive cervical frill',
      groundReactionForceKn: 78.0,
      locomotionFeatures: [
        'Syncervical fused neck vertebrae providing absolute shock absorption for head-first charges',
        'Wide-gauge front trackway granting high lateral turning stability against theropod flank attacks',
        'Hoof-like blunt unguals with thick keratinous sheaths built for high torque pivoting',
        'Short powerful olecranon processes on ulna delivering high torque low-gear power strokes'
      ]
    };
  }

  // 6. Stegosaurus / Ankylosaurus (Armored Thyreophoran Quadrupedal)
  if (n.includes('stegosaurus') || n.includes('ankylosaurus') || n.includes('nodosaurs')) {
    const hipHeightM = 2.1;
    const topSpeedKmh = 16.0;
    const speedMs = topSpeedKmh / 3.6;
    return {
      category: 'armored_quadruped',
      categoryLabel: 'Low-Slung Wide-Gauge Defensive Quadrupedalism',
      posture: 'Graviportal Quadrupedal with asymmetric low head and high arched pelvis',
      topSpeedKmh,
      cruisingSpeedKmh: 7.0,
      strideLengthM: 2.1,
      hipHeightM,
      froudeNumber: calculateFroudeNumber(speedMs, hipHeightM),
      gaitMode: 'Walk',
      dutyFactorPercent: 68,
      paceAngulationDeg: 138,
      trackGaugeWidthCm: 125,
      manusPesRatio: '0.50 : 1.0 (Compact round manus, broad triple-toed pes)',
      centerOfMassPosition: 'Low central abdominal axis lowering rotational inertia for fast tail swings',
      groundReactionForceKn: 52.0,
      locomotionFeatures: [
        'Short forelimbs paired with elongated hindlimbs pivoting the entire body on the hind axis',
        'Dense osteoderm carapace and tail vertebrae ossified tendons acting as high-torque swing levers',
        'Ultra-wide track gauge trackways conferring high stability in marshy and floodland soils',
        'Low center of mass rendering the animal nearly impossible for large theropods to overturn'
      ]
    };
  }

  // Default: Facultative Bipedal / Cursorial
  const hipHeightM = 2.5;
  const topSpeedKmh = 28.0;
  const speedMs = topSpeedKmh / 3.6;
  return {
    category: 'facultative_biped',
    categoryLabel: 'Facultative Bipedal / Quadrupedal Transitional Gait',
    posture: 'Quadrupedal Low-Browsing / Bipedal High-Speed Sprint',
    topSpeedKmh,
    cruisingSpeedKmh: 10.0,
    strideLengthM: 3.1,
    hipHeightM,
    froudeNumber: calculateFroudeNumber(speedMs, hipHeightM),
    gaitMode: 'Walk',
    dutyFactorPercent: 48,
    paceAngulationDeg: 160,
    trackGaugeWidthCm: 60,
    manusPesRatio: '0.35 : 1.0 (Specialized hooves / grasping digits, broad tridactyl pes)',
    centerOfMassPosition: 'Mid-body with dynamic shift towards hips during bipedal sprint',
    groundReactionForceKn: 34.0,
    locomotionFeatures: [
      'Flexible carpal and metacarpal joints capable of supporting weight and stripping foliage',
      'Ossified dorsal and caudal tendon mesh stabilizing the spine during sprint phases',
      'Tridactyl weight-bearing pes with broad pads suited for varied fluvial terrains',
      'Dual-mode locomotion maximizing both foraging economy and emergency sprint evasion'
    ]
  };
};
