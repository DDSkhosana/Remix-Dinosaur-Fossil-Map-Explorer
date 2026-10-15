import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Bone, 
  Flame, 
  Activity, 
  Sparkles, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCcw, 
  Award, 
  Sliders, 
  Eye, 
  Share2, 
  Download, 
  Layers, 
  ChevronRight,
  Gauge,
  Dna,
  Footprints,
  Maximize2,
  Dice5,
  Info,
  Shield,
  Copy,
  Check,
  BookOpen
} from 'lucide-react';

export interface OrganSelectionState {
  skullType: 'theropod_carnivore' | 'sauropod_peg' | 'ceratopsian_frill' | 'hadrosaur_battery' | 'spinosaur_snout';
  vertebralAxis: 'pneumatized_air_sac' | 'rigid_armored' | 'elastic_long_neck' | 'sail_backed_neural';
  limbProportions: 'cursorial_biped' | 'graviportal_pillar' | 'semi_aquatic_paddle' | 'robust_quadruped';
  heartType: 'four_chamber_avian' | 'three_chamber_reptilian';
  respiratoryAirSacs: 'parabronchial_unidirectional' | 'simple_pulmonary_lungs';
  gizzardCapacity: 'gastrolith_grinding' | 'simple_acid_stomach' | 'fermentation_chamber';
  muscleVolume: 'hyper_caudofemoralis' | 'balanced_medium' | 'lean_cursorial';
  jawMusculature: 'massive_pterygoideus' | 'rapid_snap_kinetic' | 'grinding_battery';
  metabolicRate: 'endothermic_high' | 'mesothermic_balanced' | 'ectothermic_low';
  thermoregulation: 'vascular_sail_plates' | 'nasal_countercurrent' | 'passive_gigantothermy';
  integumentCoating: 'proto_feathers' | 'osteoderm_armor' | 'pebbled_scales' | 'quills_filaments';
  cranialDisplay: 'keratin_horns' | 'hollow_resonance_crest' | 'streamlined_ridge' | 'none';
  tailArmament: 'thagomizer_spikes' | 'ankylosaur_club' | 'counterbalance_whip' | 'swimming_keel';
}

export const DEFAULT_ORGAN_SELECTION: OrganSelectionState = {
  skullType: 'theropod_carnivore',
  vertebralAxis: 'pneumatized_air_sac',
  limbProportions: 'cursorial_biped',
  heartType: 'four_chamber_avian',
  respiratoryAirSacs: 'parabronchial_unidirectional',
  gizzardCapacity: 'simple_acid_stomach',
  muscleVolume: 'hyper_caudofemoralis',
  jawMusculature: 'massive_pterygoideus',
  metabolicRate: 'endothermic_high',
  thermoregulation: 'nasal_countercurrent',
  integumentCoating: 'proto_feathers',
  cranialDisplay: 'streamlined_ridge',
  tailArmament: 'counterbalance_whip'
};

const PRESETS: { name: string; desc: string; icon: string; state: OrganSelectionState }[] = [
  {
    name: 'Apex Hypercarnivore',
    desc: 'High-speed bipedal pursuit predator with crushing bite force and high-output cardiovascular motor.',
    icon: '🦖',
    state: {
      skullType: 'theropod_carnivore',
      vertebralAxis: 'pneumatized_air_sac',
      limbProportions: 'cursorial_biped',
      heartType: 'four_chamber_avian',
      respiratoryAirSacs: 'parabronchial_unidirectional',
      gizzardCapacity: 'simple_acid_stomach',
      muscleVolume: 'hyper_caudofemoralis',
      jawMusculature: 'massive_pterygoideus',
      metabolicRate: 'endothermic_high',
      thermoregulation: 'nasal_countercurrent',
      integumentCoating: 'proto_feathers',
      cranialDisplay: 'streamlined_ridge',
      tailArmament: 'counterbalance_whip'
    }
  },
  {
    name: 'Colossal Titan',
    desc: 'Multi-ton graviportal sauropod with high-canopy strip-browsing dentition and elastic tensile cervical axis.',
    icon: '🦕',
    state: {
      skullType: 'sauropod_peg',
      vertebralAxis: 'elastic_long_neck',
      limbProportions: 'graviportal_pillar',
      heartType: 'four_chamber_avian',
      respiratoryAirSacs: 'parabronchial_unidirectional',
      gizzardCapacity: 'fermentation_chamber',
      muscleVolume: 'balanced_medium',
      jawMusculature: 'grinding_battery',
      metabolicRate: 'mesothermic_balanced',
      thermoregulation: 'passive_gigantothermy',
      integumentCoating: 'pebbled_scales',
      cranialDisplay: 'none',
      tailArmament: 'counterbalance_whip'
    }
  },
  {
    name: 'Armored Fortress',
    desc: 'Heavy quadrupedal defensive tank clad in dermal osteoderm shields, nasal spikes, and a bone-crushing tail weapon.',
    icon: '🛡️',
    state: {
      skullType: 'ceratopsian_frill',
      vertebralAxis: 'rigid_armored',
      limbProportions: 'robust_quadruped',
      heartType: 'three_chamber_reptilian',
      respiratoryAirSacs: 'simple_pulmonary_lungs',
      gizzardCapacity: 'gastrolith_grinding',
      muscleVolume: 'balanced_medium',
      jawMusculature: 'grinding_battery',
      metabolicRate: 'mesothermic_balanced',
      thermoregulation: 'vascular_sail_plates',
      integumentCoating: 'osteoderm_armor',
      cranialDisplay: 'keratin_horns',
      tailArmament: 'ankylosaur_club'
    }
  },
  {
    name: 'Riverine Sail-Hunter',
    desc: 'Spinosaurid aquatic specialist equipped with sensory snout, paddle limbs, and thermal vascular sail.',
    icon: '🐊',
    state: {
      skullType: 'spinosaur_snout',
      vertebralAxis: 'sail_backed_neural',
      limbProportions: 'semi_aquatic_paddle',
      heartType: 'four_chamber_avian',
      respiratoryAirSacs: 'parabronchial_unidirectional',
      gizzardCapacity: 'simple_acid_stomach',
      muscleVolume: 'lean_cursorial',
      jawMusculature: 'rapid_snap_kinetic',
      metabolicRate: 'mesothermic_balanced',
      thermoregulation: 'vascular_sail_plates',
      integumentCoating: 'pebbled_scales',
      cranialDisplay: 'streamlined_ridge',
      tailArmament: 'swimming_keel'
    }
  }
];

interface AnatomicalSynthesizerBuilderProps {
  onDeployToObservatory?: (specimenData: any) => void;
  onNavigateToTab?: (tab: string) => void;
  fossilFeatures?: { name: string; description: string; tag?: string; year?: number }[];
  activeTaxaName?: string;
}

export const AnatomicalSynthesizerBuilder: React.FC<AnatomicalSynthesizerBuilderProps> = ({
  onDeployToObservatory,
  onNavigateToTab,
  fossilFeatures = [],
  activeTaxaName = 'Tyrannosaurus Rex'
}) => {
  const [activeBuilderView, setActiveBuilderView] = useState<'synthesizer' | 'fossil_stratum'>('synthesizer');
  const [organState, setOrganState] = useState<OrganSelectionState>(DEFAULT_ORGAN_SELECTION);
  const [activeLevel, setActiveLevel] = useState<number>(1);
  const [specimenCustomName, setSpecimenCustomName] = useState<string>('Synthetosaurus Rex');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [fossilMode, setFossilMode] = useState<boolean>(true);
  const [showFossilHelpTooltips, setShowFossilHelpTooltips] = useState<boolean>(false);
  const [pitchDegree, setPitchDegree] = useState<number>(12);
  const [yawDegree, setYawDegree] = useState<number>(-18);
  const [activeDragOverZone, setActiveDragOverZone] = useState<string | null>(null);
  const [isSkeletonDragging, setIsSkeletonDragging] = useState<boolean>(false);
  const [skeletonDragStart, setSkeletonDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layer Visibility Toggles for Visualizer
  const [visibleLayers, setVisibleLayers] = useState({
    skeleton: true,
    organs: true,
    muscles: true,
    integument: true
  });

  const toggleLayer = (layer: keyof typeof visibleLayers) => {
    setVisibleLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Comprehensive Biophysical & Biomechanical Simulation Engine
  const simMetrics = useMemo(() => {
    let massKg = 4200;
    let topSpeedKmh = 32;
    let biteForceN = 28000;
    let respirationEff = 80;
    let metabolicWkg = 45;
    let dailyKcal = 35000;
    let viabilityScore = 95;
    const diagnostics: { type: 'positive' | 'warning' | 'neutral'; text: string }[] = [];

    // 1. Skull & Jaw Mechanics
    switch (organState.skullType) {
      case 'theropod_carnivore':
        biteForceN += 26000;
        massKg += 1100;
        diagnostics.push({ type: 'positive', text: 'Ziphodont dentition delivers lethal puncture-pull shearing vectors.' });
        break;
      case 'sauropod_peg':
        biteForceN = 9500;
        massKg += 18000;
        topSpeedKmh -= 14;
        diagnostics.push({ type: 'positive', text: 'Peg dentition enables continuous high-canopy strip-harvesting.' });
        break;
      case 'ceratopsian_frill':
        biteForceN += 16000;
        massKg += 4200;
        topSpeedKmh -= 6;
        diagnostics.push({ type: 'positive', text: 'Keratin beak with pterygoideus anchor slices through woody cycads.' });
        break;
      case 'hadrosaur_battery':
        biteForceN += 8000;
        massKg += 3200;
        diagnostics.push({ type: 'positive', text: 'Pleurokinetic diamond dental batteries grind fibrous horsetails.' });
        break;
      case 'spinosaur_snout':
        biteForceN += 12000;
        massKg += 2500;
        diagnostics.push({ type: 'positive', text: 'Neurovascular foramina in premaxilla sense submerged hydraulic vibrations.' });
        break;
    }

    if (organState.jawMusculature === 'massive_pterygoideus') {
      biteForceN = Math.round(biteForceN * 1.35);
      massKg += 450;
    } else if (organState.jawMusculature === 'rapid_snap_kinetic') {
      biteForceN = Math.round(biteForceN * 0.75);
      topSpeedKmh += 3;
    }

    // 2. Axial Framework & Vertebrae
    switch (organState.vertebralAxis) {
      case 'pneumatized_air_sac':
        massKg = Math.round(massKg * 0.82);
        respirationEff += 10;
        diagnostics.push({ type: 'positive', text: 'Extensive skeletal pneumaticity reduces skeletal dead-weight by 18%.' });
        break;
      case 'rigid_armored':
        massKg = Math.round(massKg * 1.25);
        topSpeedKmh -= 7;
        diagnostics.push({ type: 'positive', text: 'Fused co-ossified dorsal ribs provide heavy structural impact dissipation.' });
        break;
      case 'elastic_long_neck':
        massKg = Math.round(massKg * 1.15);
        topSpeedKmh -= 5;
        diagnostics.push({ type: 'positive', text: 'Bifid neural spines anchor tensile elastin ligaments for energy-efficient browsing.' });
        break;
      case 'sail_backed_neural':
        massKg += 350;
        diagnostics.push({ type: 'positive', text: 'Elongated hyper-neural spines expand vascular surface area.' });
        break;
    }

    // 3. Appendicular Locomotion & Posture
    switch (organState.limbProportions) {
      case 'cursorial_biped':
        topSpeedKmh += 16;
        if (massKg > 12000) {
          viabilityScore -= 28;
          diagnostics.push({ type: 'warning', text: 'Gravitational limit warning: >12 tons exceeds bipedal femur fracture thresholds.' });
        } else {
          diagnostics.push({ type: 'positive', text: 'Digitigrade cursorial stance maximizes stride frequency and pendulum kinetic return.' });
        }
        break;
      case 'graviportal_pillar':
        massKg = Math.max(8000, massKg);
        topSpeedKmh = Math.min(22, Math.max(10, topSpeedKmh - 12));
        diagnostics.push({ type: 'positive', text: 'Vertical columnar limb geometry distributes multi-ton compressive loads safely.' });
        break;
      case 'semi_aquatic_paddle':
        topSpeedKmh = Math.max(14, topSpeedKmh - 6);
        diagnostics.push({ type: 'positive', text: 'Flattened propodials and hyper-expanded webbed digits generate aquatic thrust.' });
        break;
      case 'robust_quadruped':
        topSpeedKmh = Math.max(18, topSpeedKmh - 4);
        diagnostics.push({ type: 'positive', text: 'Stable quadrupedal center of gravity resists predatory lateral torque.' });
        break;
    }

    // 4. Musculature
    if (organState.muscleVolume === 'hyper_caudofemoralis') {
      topSpeedKmh += 8;
      massKg += 850;
      diagnostics.push({ type: 'positive', text: 'Caudofemoralis longus anchors immense retractor force from tail into fourth trochanter.' });
    } else if (organState.muscleVolume === 'lean_cursorial') {
      topSpeedKmh += 10;
      massKg -= 400;
    }

    // 5. Visceral Cardiac & Respiration
    if (organState.heartType === 'four_chamber_avian') {
      respirationEff += 15;
      metabolicWkg += 20;
      diagnostics.push({ type: 'positive', text: 'Fully septated 4-chambered heart generates systemic pressure >200 mmHg.' });
    } else {
      respirationEff -= 22;
      metabolicWkg -= 25;
      if (organState.metabolicRate === 'endothermic_high') {
        viabilityScore -= 30;
        diagnostics.push({ type: 'warning', text: 'Cardiovascular mismatch: 3-chambered heart blood shunting cannot fuel high endothermy.' });
      }
    }

    if (organState.respiratoryAirSacs === 'parabronchial_unidirectional') {
      respirationEff += 15;
      diagnostics.push({ type: 'positive', text: 'Unidirectional continuous cross-current air flow eliminates dead lung airspace.' });
    } else {
      respirationEff -= 15;
      if (massKg > 10000) {
        viabilityScore -= 18;
        diagnostics.push({ type: 'warning', text: 'Tidal pulmonary volume insufficient for gas exchange across giant body mass.' });
      }
    }

    // 6. Gastrointestinal
    if (organState.gizzardCapacity === 'gastrolith_grinding') {
      dailyKcal = Math.round(dailyKcal * 0.9);
      diagnostics.push({ type: 'positive', text: 'Muscular gizzard loaded with quartz gastroliths mechanically mills tough fibrous vegetation.' });
    } else if (organState.gizzardCapacity === 'fermentation_chamber') {
      massKg += 1200;
      dailyKcal = Math.round(dailyKcal * 0.85);
      diagnostics.push({ type: 'positive', text: 'Multi-chamber fermentation vat extracts maximum cellulose nutrition over 120-hour transit.' });
    }

    // 7. Integument, Defense & Weapons
    if (organState.integumentCoating === 'osteoderm_armor') {
      massKg += 1400;
      topSpeedKmh = Math.max(10, topSpeedKmh - 5);
      diagnostics.push({ type: 'positive', text: 'Collagen-reinforced bone plates deflect puncturing theropod teeth.' });
    } else if (organState.integumentCoating === 'proto_feathers') {
      diagnostics.push({ type: 'positive', text: 'Insulating stage-II feather down prevents nocturnal thermal dissipation.' });
    }

    if (organState.cranialDisplay === 'keratin_horns') {
      biteForceN += 3000;
      massKg += 300;
    }

    if (organState.tailArmament === 'ankylosaur_club') {
      massKg += 550;
      diagnostics.push({ type: 'positive', text: 'Terminal tail club capable of shattering theropod tibiae with 14,000 N impact.' });
    } else if (organState.tailArmament === 'thagomizer_spikes') {
      diagnostics.push({ type: 'positive', text: 'Quad-spike thagomizer wields penetrating impalement arc.' });
    }

    // Daily Calorie requirement based on mass and metabolism
    dailyKcal = Math.round(massKg * metabolicWkg * 0.7);

    // Dynamic Synthetic Taxon Name
    let syntheticName = 'Synthetosaurus Rex';
    if (organState.skullType === 'sauropod_peg') syntheticName = 'Brachiodon Imperator';
    if (organState.skullType === 'ceratopsian_frill') syntheticName = 'Triceratosuchus Shield';
    if (organState.skullType === 'hadrosaur_battery') syntheticName = 'Hadromimus Crest';
    if (organState.skullType === 'spinosaur_snout') syntheticName = 'Spinosuchus Aquaticus';

    return {
      massKg: Math.round(massKg),
      massTons: (massKg / 1000).toFixed(1),
      topSpeedKmh: Math.max(8, Math.round(topSpeedKmh)),
      biteForceN: Math.max(4000, Math.round(biteForceN)),
      respirationEff: Math.min(99, Math.max(35, respirationEff)),
      metabolicWkg,
      dailyKcal,
      viabilityScore: Math.min(100, Math.max(25, viabilityScore)),
      syntheticName,
      diagnostics
    };
  }, [organState]);

  // Handle Deploying Specimen to Observatory
  const handleSaveSpecimen = () => {
    setIsSaved(true);
    if (onDeployToObservatory) {
      onDeployToObservatory({
        name: specimenCustomName || simMetrics.syntheticName,
        metrics: simMetrics,
        organState,
        timestamp: Date.now()
      });
    }
  };

  // Copy Specimen Blueprint JSON
  const handleCopyBlueprint = () => {
    const data = JSON.stringify({
      taxon: specimenCustomName || simMetrics.syntheticName,
      metrics: simMetrics,
      organSystems: organState
    }, null, 2);
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Download Specimen Specification
  const handleDownloadBlueprint = () => {
    const data = JSON.stringify({
      taxon: specimenCustomName || simMetrics.syntheticName,
      metrics: simMetrics,
      organSystems: organState
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(specimenCustomName || simMetrics.syntheticName).toLowerCase().replace(/\s+/g, '_')}_blueprint.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Randomize Organ Assembly
  const handleRandomize = () => {
    const skulls: OrganSelectionState['skullType'][] = ['theropod_carnivore', 'sauropod_peg', 'ceratopsian_frill', 'hadrosaur_battery', 'spinosaur_snout'];
    const axes: OrganSelectionState['vertebralAxis'][] = ['pneumatized_air_sac', 'rigid_armored', 'elastic_long_neck', 'sail_backed_neural'];
    const limbs: OrganSelectionState['limbProportions'][] = ['cursorial_biped', 'graviportal_pillar', 'semi_aquatic_paddle', 'robust_quadruped'];
    const hearts: OrganSelectionState['heartType'][] = ['four_chamber_avian', 'three_chamber_reptilian'];
    const resp: OrganSelectionState['respiratoryAirSacs'][] = ['parabronchial_unidirectional', 'simple_pulmonary_lungs'];
    const gizzard: OrganSelectionState['gizzardCapacity'][] = ['gastrolith_grinding', 'simple_acid_stomach', 'fermentation_chamber'];
    const muscle: OrganSelectionState['muscleVolume'][] = ['hyper_caudofemoralis', 'balanced_medium', 'lean_cursorial'];
    const jaws: OrganSelectionState['jawMusculature'][] = ['massive_pterygoideus', 'rapid_snap_kinetic', 'grinding_battery'];
    const meta: OrganSelectionState['metabolicRate'][] = ['endothermic_high', 'mesothermic_balanced', 'ectothermic_low'];
    const thermo: OrganSelectionState['thermoregulation'][] = ['vascular_sail_plates', 'nasal_countercurrent', 'passive_gigantothermy'];
    const skin: OrganSelectionState['integumentCoating'][] = ['proto_feathers', 'osteoderm_armor', 'pebbled_scales', 'quills_filaments'];
    const horns: OrganSelectionState['cranialDisplay'][] = ['keratin_horns', 'hollow_resonance_crest', 'streamlined_ridge', 'none'];
    const tail: OrganSelectionState['tailArmament'][] = ['thagomizer_spikes', 'ankylosaur_club', 'counterbalance_whip', 'swimming_keel'];

    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    setOrganState({
      skullType: pick(skulls),
      vertebralAxis: pick(axes),
      limbProportions: pick(limbs),
      heartType: pick(hearts),
      respiratoryAirSacs: pick(resp),
      gizzardCapacity: pick(gizzard),
      muscleVolume: pick(muscle),
      jawMusculature: pick(jaws),
      metabolicRate: pick(meta),
      thermoregulation: pick(thermo),
      integumentCoating: pick(skin),
      cranialDisplay: pick(horns),
      tailArmament: pick(tail)
    });
    setIsSaved(false);
  };

  // Reset to default
  const handleReset = () => {
    setOrganState(DEFAULT_ORGAN_SELECTION);
    setSpecimenCustomName('Synthetosaurus Rex');
    setIsSaved(false);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-park-card-border p-3.5 sm:p-4 space-y-3.5 shadow-xs text-park-ink animate-in">
      
      {/* Studio Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-park-card-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-700 flex items-center justify-center shadow-2xs shrink-0">
            <Dna size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-rounded font-extrabold text-park-accent-green uppercase tracking-wider">
                Fossil Assembly & Synthesis
              </span>
              <span className="text-slate-400 text-[10px]" aria-hidden="true">·</span>
              <span className="text-[9.5px] font-mono font-bold px-2 py-0.2 rounded-md bg-purple-50 text-purple-900 border border-purple-200">
                {activeBuilderView === 'synthesizer' ? `Synthesizer Level ${activeLevel}/5` : `Fossil Stratum (${fossilFeatures.length} Specimens)`}
              </span>
            </div>
            <h4 className="text-[13px] sm:text-[14px] font-rounded font-extrabold text-park-tree leading-snug">
              Fossil Assembly & Dinosaur Synthesizer
            </h4>
            <p className="text-[10px] font-rounded text-park-ink-muted leading-tight">
              Unified paleobiological suite: assemble excavated fossil holotypes and synthesize functional morphotypes with live biomechanics
            </p>
          </div>
        </div>

        {/* View Switcher Segmented Control */}
        <div className="flex items-center gap-1 bg-park-card-muted/80 p-1 rounded-xl border border-park-card-border/60 text-[9.5px] font-rounded font-bold">
          <button
            onClick={() => setActiveBuilderView('synthesizer')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeBuilderView === 'synthesizer'
                ? 'bg-park-tree text-white shadow-2xs font-extrabold'
                : 'text-park-ink-muted hover:text-park-tree hover:bg-white/60'
            }`}
          >
            <Dna size={12} />
            <span>1. Morphotype Synthesizer</span>
          </button>
          <button
            onClick={() => setActiveBuilderView('fossil_stratum')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeBuilderView === 'fossil_stratum'
                ? 'bg-amber-700 text-white shadow-2xs font-extrabold'
                : 'text-park-ink-muted hover:text-park-tree hover:bg-white/60'
            }`}
          >
            <Bone size={12} />
            <span>2. Fossil Stratum ({fossilFeatures.length || 4})</span>
          </button>
        </div>

        {/* Action Controls: Randomize, Reset, Export & Deploy */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRandomize}
            className="px-2.5 py-1 rounded-xl bg-white border border-park-card-border text-park-ink-muted hover:text-park-tree hover:border-park-tree text-xs font-rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Roll random genetic mutations across all organ systems"
          >
            <Dice5 size={13} className="text-amber-600" />
            <span>Randomize</span>
          </button>
          
          <button
            onClick={handleReset}
            className="px-2.5 py-1 rounded-xl bg-white border border-park-card-border text-park-ink-muted hover:text-rose-700 hover:border-rose-300 text-xs font-rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Reset to default prototype"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>

          <button
            onClick={handleCopyBlueprint}
            className="px-2.5 py-1 rounded-xl bg-white border border-park-card-border text-park-ink-muted hover:text-park-tree text-xs font-rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Copy Specimen Blueprint JSON"
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy Spec'}</span>
          </button>

          <button
            onClick={handleDownloadBlueprint}
            className="px-2.5 py-1 rounded-xl bg-white border border-park-card-border text-park-ink-muted hover:text-park-tree text-xs font-rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Download JSON Blueprint"
          >
            <Download size={12} />
            <span>JSON</span>
          </button>

          <button
            onClick={handleSaveSpecimen}
            className={`px-3.5 py-1 rounded-xl text-xs font-rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isSaved
                ? 'bg-emerald-700 text-white ring-1 ring-emerald-500'
                : 'bg-park-tree text-white hover:bg-emerald-800'
            }`}
          >
            {isSaved ? <CheckCircle2 size={13} /> : <Award size={13} />}
            <span>{isSaved ? 'Deployed to Observatory' : 'Deploy Specimen'}</span>
          </button>
        </div>
      </div>

      {/* View Mode 2: Recovered Fossil Stratum & Inventory View */}
      {activeBuilderView === 'fossil_stratum' && (
        <div className="space-y-4 animate-in">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
                <h4 className="text-xs font-rounded font-extrabold text-amber-950 uppercase tracking-wide">
                  Recovered Fossil Holotypes & Taxa Stratum Record
                </h4>
                <span className="text-[9px] font-mono bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                  {fossilFeatures.length || 4} Documented Specimens
                </span>
              </div>
              <p className="text-[11px] font-rounded text-slate-700 leading-snug">
                Authenticated fossil elements recovered from geological horizon. Select any holotype to load its exact morphological parameters into the synthesizer.
              </p>
            </div>

            <button
              onClick={() => setActiveBuilderView('synthesizer')}
              className="px-3 py-1.5 rounded-xl bg-park-tree text-white font-rounded font-extrabold text-[11px] flex items-center gap-1.5 shadow-xs hover:bg-emerald-800 transition-all cursor-pointer shrink-0"
            >
              <span>Back to Synthesizer</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Fossil Specimen Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(fossilFeatures.length > 0 ? fossilFeatures : [
              { name: `${activeTaxaName} Cranial Holotype (Specimen #1)`, description: 'Complete articulated cranium with preserved sclerotic rings, lateral fenestrae and deep mandibular roots.', year: 1992 },
              { name: `${activeTaxaName} Articulated Postcranial Axis (Specimen #2)`, description: 'Pneumatized cervical-dorsal vertebral column showing micro-camellate bone architecture and rib facets.', year: 1996 },
              { name: `${activeTaxaName} Appendicular Pelvic & Femoral Girdle`, description: 'Massive iliac blade, fourth trochanter caudal retractor crest, and robust digitigrade pes elements.', year: 2002 },
              { name: `${activeTaxaName} Dermal Gastralia & Integument Imprint`, description: 'Preserved abdominal gastral basket with fine sediment impressions of pebbled dermal scales and scutes.', year: 2008 }
            ]).map((feat, idx) => {
              const completeness = [88, 74, 92, 65][idx % 4];
              return (
                <div 
                  key={idx}
                  className="bg-white rounded-2xl border border-park-card-border p-4 shadow-xs hover:border-amber-400/80 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200">
                          #{idx + 1}
                        </div>
                        <div>
                          <h5 className="text-[12px] font-rounded font-extrabold text-park-tree group-hover:text-amber-950 transition-colors">
                            {feat.name}
                          </h5>
                          <span className="text-[9.5px] font-mono text-slate-500">
                            Excavated: {feat.year || 1990 + idx * 4} • Stratum Horizon
                          </span>
                        </div>
                      </div>

                      <span className="text-[9.5px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                        {completeness}% Skeleton
                      </span>
                    </div>

                    <p className="text-[11px] font-rounded text-slate-600 leading-relaxed">
                      {feat.description}
                    </p>

                    {/* Skeletal Completeness Gauge */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[8.5px] font-mono text-slate-500 font-bold">
                        <span>Osteological Completeness</span>
                        <span>{completeness}% Preserved</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action: Load Fossil into Morphotype Synthesizer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono text-slate-400">
                      Taphonomy: Fluvial Channel
                    </span>
                    <button
                      onClick={() => {
                        setSpecimenCustomName(`${activeTaxaName} (${feat.name.split('(')[0].trim()})`);
                        setActiveBuilderView('synthesizer');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-rounded font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                      title="Load this fossil specimen into the Synthesizer"
                    >
                      <Sparkles size={11} className="text-amber-600" />
                      <span>Assemble in Builder →</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Mode 1: Active Morphotype Synthesizer (Presets + Levels 1-5 + Studio Grid) */}
      {activeBuilderView === 'synthesizer' && (
        <>
      {/* Preset Fast-Loader Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-[9.5px] font-mono uppercase tracking-wider font-bold text-park-ink-muted shrink-0 mr-1 flex items-center gap-1">
          <Sparkles size={11} className="text-amber-500" />
          <span>Presets:</span>
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => {
              setOrganState(preset.state);
              setSpecimenCustomName(preset.name);
              setIsSaved(false);
            }}
            className="px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white border border-park-card-border text-park-ink text-[11px] font-rounded font-bold flex items-center gap-1.5 shrink-0 transition-all hover:border-park-tree/50 cursor-pointer shadow-2xs"
          >
            <span>{preset.icon}</span>
            <span>{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Main Studio Grid: Left Configuration Studio vs Right Live Biomechanical Canvas (Independently Scrollable) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-w-0">
          
          {/* LEFT COLUMN (7 COLS): ORGAN CONTROLS (Independently Scrollable) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-park-card-border p-4 space-y-4 shadow-xs overflow-y-auto custom-scrollbar max-h-[640px] min-w-0">
            
            {/* Low-Profile Organizational Level Stepper Tabs (1 to 5) - Self-contained inside the column */}
            <div className="bg-park-card-muted/65 p-1 rounded-xl border border-park-card-border/80 shadow-3xs">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
                {[
                  { level: 1, title: '1. Skeleton', icon: Bone, color: 'text-cyan-700' },
                  { level: 2, title: '2. Viscera', icon: Heart, color: 'text-rose-700' },
                  { level: 3, title: '3. Muscles', icon: Activity, color: 'text-orange-700' },
                  { level: 4, title: '4. Bioenergy', icon: Flame, color: 'text-amber-700' },
                  { level: 5, title: '5. Integument', icon: Layers, color: 'text-emerald-700' }
                ].map(lvl => {
                  const Icon = lvl.icon;
                  const isActive = activeLevel === lvl.level;
                  return (
                    <button
                      key={lvl.level}
                      onClick={() => setActiveLevel(lvl.level)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-rounded font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-park-tree shadow-xs border border-park-card-border'
                          : 'text-park-ink-muted hover:text-park-tree hover:bg-white/50'
                      }`}
                    >
                      <Icon size={12} className={lvl.color} />
                      <span className="truncate">{lvl.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          
          {/* LEVEL 1: OSTEOLOGY & SKELETON */}
          {activeLevel === 1 && (
            <div className="space-y-4 animate-in">
              <div className="border-b border-park-card-border pb-2 flex items-center justify-between">
                <h4 className="text-xs font-rounded font-extrabold text-park-tree uppercase tracking-wider flex items-center gap-1.5">
                  <Bone size={14} className="text-cyan-700" />
                  <span>Level 1: Osteology, Cranial & Appendicular Architecture</span>
                </h4>
                <span className="text-[10px] font-mono text-park-ink-muted">Skeletal Frame</span>
              </div>

              {/* 1A. Skull Morphology */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">1A. Skull Architecture & Dentition:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'theropod_carnivore', label: 'Theropod Serrated Blade-Tooth', desc: 'Ziphodont recurved dentition & lateral temporal fenestrae for crushing bite pressure.' },
                    { id: 'sauropod_peg', label: 'Sauropod Peg/Spoon Dentition', desc: 'Slender crowns for raking canopy foliage without mastication.' },
                    { id: 'ceratopsian_frill', label: 'Ceratopsian Beaked Frill', desc: 'Sharp shearing rhamphotheca beak anchored to an expanded neck frill shield.' },
                    { id: 'hadrosaur_battery', label: 'Hadrosaur Grinding Battery', desc: 'Hundreds of interlocked self-sharpening dental columns for abrasive silica plants.' },
                    { id: 'spinosaur_snout', label: 'Spinosaurid Crocodilian Snout', desc: 'Conical sub-circular teeth designed for slippery teleost fish retention.' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, skullType: opt.id as any }))}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        organState.skullType === opt.id
                          ? 'bg-cyan-50/80 border-cyan-400 text-cyan-950 font-bold shadow-2xs ring-1 ring-cyan-300'
                          : 'bg-park-card-muted/30 hover:bg-park-card-muted/60 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[11px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.skullType === opt.id && <CheckCircle2 size={12} className="text-cyan-700" />}
                      </div>
                      <p className="text-[9.5px] leading-snug text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1B. Vertebral Axial Framework */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">1B. Vertebral Axial Column:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'pneumatized_air_sac', label: 'Pneumatized Hollow Air-Sac Vertebrae', desc: 'Pleurocoel bone cavities containing respiratory diverticula that reduce weight by 18%.' },
                    { id: 'rigid_armored', label: 'Rigid Armored Axis with Fused Tendons', desc: 'Hyper-ossified dorsal tendons locking spine against predatory bite torque.' },
                    { id: 'elastic_long_neck', label: 'Elastic Tensile Long-Neck Axis', desc: 'Deeply bifurcated neural spines anchoring massive ligamentum nuchae cords.' },
                    { id: 'sail_backed_neural', label: 'Hyper-Neural Spines (Thermal Sail)', desc: 'Vertically elongated neural processes up to 1.8 meters for display and thermoregulation.' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, vertebralAxis: opt.id as any }))}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        organState.vertebralAxis === opt.id
                          ? 'bg-cyan-50/80 border-cyan-400 text-cyan-950 font-bold shadow-2xs ring-1 ring-cyan-300'
                          : 'bg-park-card-muted/30 hover:bg-park-card-muted/60 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[11px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.vertebralAxis === opt.id && <CheckCircle2 size={12} className="text-cyan-700" />}
                      </div>
                      <p className="text-[9.5px] leading-snug text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1C. Appendicular Limbs & Posture */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">1C. Appendicular Limbs & Locomotor Posture:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'cursorial_biped', label: 'Digitigrade Cursorial Biped', desc: 'Elongated distal metatarsals and tridactyl pes for high-cadence spring running.' },
                    { id: 'graviportal_pillar', label: 'Graviportal Columnar Pillars', desc: 'Pillar-like stylopodial columns and fibrocartilaginous pads for multi-ton load absorption.' },
                    { id: 'semi_aquatic_paddle', label: 'Semi-Aquatic Paddle Limbs', desc: 'Shortened robust femur with hyper-expanded webbed pedes for aquatic propulsion.' },
                    { id: 'robust_quadruped', label: 'Robust Quadrupedal Stance', desc: 'Sprawling-to-parasagittal compromise with massive pectoral girdle reinforcement.' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, limbProportions: opt.id as any }))}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        organState.limbProportions === opt.id
                          ? 'bg-cyan-50/80 border-cyan-400 text-cyan-950 font-bold shadow-2xs ring-1 ring-cyan-300'
                          : 'bg-park-card-muted/30 hover:bg-park-card-muted/60 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[11px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.limbProportions === opt.id && <CheckCircle2 size={12} className="text-cyan-700" />}
                      </div>
                      <p className="text-[9.5px] leading-snug text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 2: VISCERA & RESPIRATION */}
          {activeLevel === 2 && (
            <div className="space-y-4 animate-in">
              <div className="border-b border-park-card-border pb-2 flex items-center justify-between">
                <h4 className="text-xs font-rounded font-extrabold text-park-tree uppercase tracking-wider flex items-center gap-1.5">
                  <Heart size={14} className="text-rose-700" />
                  <span>Level 2: Visceral, Cardiovascular & Respiratory Engines</span>
                </h4>
                <span className="text-[10px] font-mono text-park-ink-muted">Circulatory & Air Sacs</span>
              </div>

              {/* 2A. Cardiac Chambers */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">2A. Cardiac Chambers & Circuitry:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'four_chamber_avian', label: '4-Chambered High-Pressure Avian Heart', desc: 'Completely separated systemic and pulmonary circuits delivering blood to head at 250 mmHg.' },
                    { id: 'three_chamber_reptilian', label: '3-Chambered Shunting Ectothermic Heart', desc: 'Right-to-left intracardiac shunting for energy conservation during idle basking.' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, heartType: opt.id as any }))}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        organState.heartType === opt.id
                          ? 'bg-rose-50/80 border-rose-400 text-rose-950 font-bold shadow-2xs ring-1 ring-rose-300'
                          : 'bg-park-card-muted/30 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[11.5px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.heartType === opt.id && <CheckCircle2 size={13} className="text-rose-700" />}
                      </div>
                      <p className="text-[9.5px] leading-snug text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2B. Respiratory System */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">2B. Respiratory Mechanism & Oxygenation:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'parabronchial_unidirectional', label: 'Parabronchial Air Sac System (Avian)', desc: 'Continuous unidirectional cross-current airflow oxygenating blood during both inhale and exhale.' },
                    { id: 'simple_pulmonary_lungs', label: 'Tidal Inhalation Lungs (Squamate)', desc: 'Standard bidirectional alveolar tidal flow with residual un-exchanged stale volume.' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, respiratoryAirSacs: opt.id as any }))}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        organState.respiratoryAirSacs === opt.id
                          ? 'bg-rose-50/80 border-rose-400 text-rose-950 font-bold shadow-2xs ring-1 ring-rose-300'
                          : 'bg-park-card-muted/30 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[11.5px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.respiratoryAirSacs === opt.id && <CheckCircle2 size={13} className="text-rose-700" />}
                      </div>
                      <p className="text-[9.5px] leading-snug text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2C. Digestive Tract & Stomach */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">2C. Gastrointestinal & Digestive Strategy:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'simple_acid_stomach', label: 'Hyper-Acidic Stomach (pH ~1.2)', desc: 'Fast proteolytic bone dissolution for carnivores.' },
                    { id: 'gastrolith_grinding', label: 'Gizzard with Gastrolith Mill', desc: 'Stomach stones pulverizing rough vegetation.' },
                    { id: 'fermentation_chamber', label: 'Caecal Fermentation Vat', desc: 'Symbiotic gut flora fermenting cellulose fibers.' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, gizzardCapacity: opt.id as any }))}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        organState.gizzardCapacity === opt.id
                          ? 'bg-rose-50/80 border-rose-400 text-rose-950 font-bold shadow-2xs ring-1 ring-rose-300'
                          : 'bg-park-card-muted/30 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[11px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.gizzardCapacity === opt.id && <CheckCircle2 size={12} className="text-rose-700" />}
                      </div>
                      <p className="text-[9px] leading-snug text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 3: MUSCULAR MOTORS */}
          {activeLevel === 3 && (
            <div className="space-y-4 animate-in">
              <div className="border-b border-park-card-border pb-2 flex items-center justify-between">
                <h4 className="text-xs font-rounded font-extrabold text-park-tree uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={14} className="text-orange-700" />
                  <span>Level 3: Muscular Motors & Kinetic Leverage</span>
                </h4>
                <span className="text-[10px] font-mono text-park-ink-muted">Locomotion & Jaw Adductors</span>
              </div>

              {/* 3A. Caudofemoralis Motor */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">3A. Tail-Femur Retractor (M. Caudofemoralis Longus):</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'hyper_caudofemoralis', label: 'Hypertrophied Sprint Engine', desc: 'Massive tail muscles delivering explosive burst speed out of concealment.' },
                    { id: 'balanced_medium', label: 'Balanced Locomotor Mass', desc: 'Moderate energy consumption with versatile endurance roaming.' },
                    { id: 'lean_cursorial', label: 'Lean High-Cadence Muscle', desc: 'Optimized for non-stop marathon pursuit without thermal exhaustion.' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, muscleVolume: opt.id as any }))}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        organState.muscleVolume === opt.id
                          ? 'bg-orange-50/80 border-orange-400 text-orange-950 font-bold shadow-2xs ring-1 ring-orange-300'
                          : 'bg-park-card-muted/30 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[11px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.muscleVolume === opt.id && <CheckCircle2 size={12} className="text-orange-700" />}
                      </div>
                      <p className="text-[9px] leading-snug text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3B. Jaw Adductor Musculature */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">3B. Cranial Jaw Adductor Muscles:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'massive_pterygoideus', label: 'M. Pterygoideus Shearing Motor', desc: 'Provides peak bone-crushing closing torque at the back of the tooth row.' },
                    { id: 'rapid_snap_kinetic', label: 'Fast-Closing Kinetic Adductor', desc: 'Snaps jaws shut in 80 milliseconds for capturing evasive prey.' },
                    { id: 'grinding_battery', label: 'Propterygoid Palatal Battery', desc: 'Multi-directional transverse grinding for pulverizing fibrous cellulose.' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, jawMusculature: opt.id as any }))}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        organState.jawMusculature === opt.id
                          ? 'bg-orange-50/80 border-orange-400 text-orange-950 font-bold shadow-2xs ring-1 ring-orange-300'
                          : 'bg-park-card-muted/30 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[11px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.jawMusculature === opt.id && <CheckCircle2 size={12} className="text-orange-700" />}
                      </div>
                      <p className="text-[9px] leading-snug text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 4: BIOENERGETICS & METABOLISM */}
          {activeLevel === 4 && (
            <div className="space-y-4 animate-in">
              <div className="border-b border-park-card-border pb-2 flex items-center justify-between">
                <h4 className="text-xs font-rounded font-extrabold text-park-tree uppercase tracking-wider flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-700" />
                  <span>Level 4: Bioenergetics, Metabolic Engines & Heat Dissipation</span>
                </h4>
                <span className="text-[10px] font-mono text-park-ink-muted">Thermal Kinetics</span>
              </div>

              {/* 4A. Metabolic Rate */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">4A. Resting Metabolic Rate Strategy:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'endothermic_high', label: 'High Tachymetabolic Endothermy', desc: 'Constant 38°C core body heat; extreme sustained activity with high caloric demand.' },
                    { id: 'mesothermic_balanced', label: 'Balanced Mesothermy', desc: 'Elevates core temperature above ambient while moderating food intake.' },
                    { id: 'ectothermic_low', label: 'Bradymetabolic Ectothermy', desc: 'Low resting energy expenditure; requires environmental solar basking.' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, metabolicRate: opt.id as any }))}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        organState.metabolicRate === opt.id
                          ? 'bg-amber-50/80 border-amber-400 text-amber-950 font-bold shadow-2xs ring-1 ring-amber-300'
                          : 'bg-park-card-muted/30 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[11px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.metabolicRate === opt.id && <CheckCircle2 size={12} className="text-amber-700" />}
                      </div>
                      <p className="text-[9px] leading-snug text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4B. Thermoregulation */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">4B. Thermoregulatory Heat Exchanger:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'nasal_countercurrent', label: 'Nasal Turbinate Exchanger', desc: 'Conserves respiratory moisture and cools blood headed to the brain.' },
                    { id: 'vascular_sail_plates', label: 'Vascular Dorsal Sail / Plates', desc: 'Pumps blood through high surface area plates to dump or absorb solar heat.' },
                    { id: 'passive_gigantothermy', label: 'Passive Gigantothermy', desc: 'Extreme body mass produces minimal surface-area-to-volume heat loss.' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, thermoregulation: opt.id as any }))}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        organState.thermoregulation === opt.id
                          ? 'bg-amber-50/80 border-amber-400 text-amber-950 font-bold shadow-2xs ring-1 ring-amber-300'
                          : 'bg-park-card-muted/30 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[11px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.thermoregulation === opt.id && <CheckCircle2 size={12} className="text-amber-700" />}
                      </div>
                      <p className="text-[9px] leading-snug text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 5: INTEGUMENT, ARMOR & WEAPONRY */}
          {activeLevel === 5 && (
            <div className="space-y-4 animate-in">
              <div className="border-b border-park-card-border pb-2 flex items-center justify-between">
                <h4 className="text-xs font-rounded font-extrabold text-park-tree uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-emerald-700" />
                  <span>Level 5: Integument Shielding, Weaponry & Display Structures</span>
                </h4>
                <span className="text-[10px] font-mono text-park-ink-muted">Epidermis & Defensive Organs</span>
              </div>

              {/* 5A. Integument */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">5A. Epidermal Integument Coating:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'proto_feathers', label: 'Filamentous Proto-Feathers & Down', desc: 'Stage-II branching plumes providing superior thermal insulation and display vibrancy.' },
                    { id: 'osteoderm_armor', label: 'Osteoderm Dermal Armor Shield', desc: 'Bony scutes embedded in the dermis deflecting theropod teeth and talons.' },
                    { id: 'pebbled_scales', label: 'Non-Overlapping Pebbled Scales', desc: 'Basement epidermal tubercles providing tough, flexible, moisture-retaining shielding.' },
                    { id: 'quills_filaments', label: 'Caudal Defensive Quills', desc: 'Elongated hollow bristle spikes along the dorsal axis for predatory deterrent.' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, integumentCoating: opt.id as any }))}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        organState.integumentCoating === opt.id
                          ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-300'
                          : 'bg-park-card-muted/30 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[11px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.integumentCoating === opt.id && <CheckCircle2 size={12} className="text-emerald-700" />}
                      </div>
                      <p className="text-[9.5px] leading-snug text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5B. Cranial Display & Weaponry */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">5B. Cranial Weapons & Display Crests:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'keratin_horns', label: 'Keratin Brow Horns', desc: 'Penetrating goring weapons' },
                    { id: 'hollow_resonance_crest', label: 'Hollow Vocal Crest', desc: 'Low-frequency acoustic horn' },
                    { id: 'streamlined_ridge', label: 'Streamlined Lacrimal Ridge', desc: 'Aerodynamic skull brows' },
                    { id: 'none', label: 'Unadorned Cranium', desc: 'Minimal skeletal mass' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, cranialDisplay: opt.id as any }))}
                      className={`p-2 rounded-xl border transition-all cursor-pointer space-y-0.5 ${
                        organState.cranialDisplay === opt.id
                          ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-300'
                          : 'bg-park-card-muted/30 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[10.5px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.cranialDisplay === opt.id && <CheckCircle2 size={11} className="text-emerald-700" />}
                      </div>
                      <p className="text-[8.5px] text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5C. Tail Armament */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-rounded font-bold text-park-ink uppercase">5C. Caudal Weaponry & Counter-Weights:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'counterbalance_whip', label: 'Whiplash Counterbalance', desc: 'Supersonic balance whip' },
                    { id: 'ankylosaur_club', label: 'Bone Osteoderm Club', desc: 'Bone-shattering impact mass' },
                    { id: 'thagomizer_spikes', label: 'Thagomizer Spikes', desc: 'Paired impalement spikes' },
                    { id: 'swimming_keel', label: 'Laterally Flattened Keel', desc: 'Fin for aquatic propulsion' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setOrganState(prev => ({ ...prev, tailArmament: opt.id as any }))}
                      className={`p-2 rounded-xl border transition-all cursor-pointer space-y-0.5 ${
                        organState.tailArmament === opt.id
                          ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-300'
                          : 'bg-park-card-muted/30 border-park-card-border/60 text-park-ink'
                      }`}
                    >
                      <div className="text-[10.5px] font-rounded font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {organState.tailArmament === opt.id && <CheckCircle2 size={11} className="text-emerald-700" />}
                      </div>
                      <p className="text-[8.5px] text-park-ink-muted font-normal">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 COLS): LIVE BIOMECHANICAL & ANATOMICAL VISUALIZER (Independently Scrollable) */}
        <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-4 text-white flex flex-col justify-between space-y-4 shadow-lg overflow-y-auto custom-scrollbar max-h-[640px] min-w-0">
          
          {/* Header & Viability Gauge */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Gauge size={15} className="text-amber-400" />
              <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                Biomechanical Simulator
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-extrabold border ${
                simMetrics.viabilityScore >= 80 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                  : simMetrics.viabilityScore >= 60 
                    ? 'bg-amber-950 text-amber-300 border-amber-700' 
                    : 'bg-rose-950 text-rose-300 border-rose-700'
              }`}>
                Viability: {simMetrics.viabilityScore}%
              </span>
            </div>
          </div>

          {/* Interactive Multi-Layer Dynamic SVG Silhouette with HTML5 Drag & Drop droppable boundaries and 3D Drag-to-Rotate */}
          <div 
            className={`relative w-full h-56 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 rounded-xl border flex items-center justify-center p-2 overflow-hidden transition-all duration-300 cursor-grab active:cursor-grabbing select-none ${
              activeDragOverZone ? 'border-purple-500 ring-2 ring-purple-500/20 scale-[1.01]' : 'border-slate-800'
            }`}
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'INPUT') return;
              setIsSkeletonDragging(true);
              setSkeletonDragStart({ x: e.clientX, y: e.clientY });
            }}
            onMouseMove={(e) => {
              if (!isSkeletonDragging) return;
              const dx = e.clientX - skeletonDragStart.x;
              const dy = e.clientY - skeletonDragStart.y;
              setYawDegree(y => Math.max(-55, Math.min(55, Math.round(y + dx * 0.7))));
              setPitchDegree(p => Math.max(-35, Math.min(35, Math.round(p - dy * 0.5))));
              setSkeletonDragStart({ x: e.clientX, y: e.clientY });
            }}
            onMouseUp={() => setIsSkeletonDragging(false)}
            onMouseLeave={() => {
              setIsSkeletonDragging(false);
              setActiveDragOverZone(null);
            }}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                setIsSkeletonDragging(true);
                setSkeletonDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
              }
            }}
            onTouchMove={(e) => {
              if (!isSkeletonDragging || e.touches.length === 0) return;
              const dx = e.touches[0].clientX - skeletonDragStart.x;
              const dy = e.touches[0].clientY - skeletonDragStart.y;
              setYawDegree(y => Math.max(-55, Math.min(55, Math.round(y + dx * 0.7))));
              setPitchDegree(p => Math.max(-35, Math.min(35, Math.round(p - dy * 0.5))));
              setSkeletonDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            }}
            onTouchEnd={() => setIsSkeletonDragging(false)}
            onDragOver={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = e.clientX - rect.left;
              const relY = e.clientY - rect.top;
              if (relX < rect.width * 0.35) {
                setActiveDragOverZone('skullType');
              } else if (relX > rect.width * 0.70) {
                setActiveDragOverZone('tailArmament');
              } else if (relY > rect.height * 0.60) {
                setActiveDragOverZone('limbProportions');
              } else {
                setActiveDragOverZone('viscera');
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              const dataStr = e.dataTransfer.getData('text/plain');
              if (!dataStr) return;
              const [partKey, partValue] = dataStr.split(':');
              if (partKey && partValue) {
                setOrganState(prev => ({ ...prev, [partKey]: partValue as any }));
                setIsSaved(false);
                // Trigger quick visual feedback pop!
                setActiveDragOverZone('SUCCESS_POP');
                setTimeout(() => setActiveDragOverZone(null), 1200);
              }
            }}
          >
            
            {/* Specimen Header & Custom Naming Overlay */}
            <div className="absolute top-2 left-2 z-10 bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-2">
              <div>
                <div className="text-[7.5px] font-mono text-slate-400 uppercase">SPECIMEN TAXON</div>
                <input
                  type="text"
                  value={specimenCustomName}
                  onChange={(e) => { setSpecimenCustomName(e.target.value); setIsSaved(false); }}
                  placeholder={simMetrics.syntheticName}
                  className="bg-transparent text-xs font-hand font-bold text-amber-300 focus:outline-hidden border-b border-amber-400/30 hover:border-amber-400 w-36"
                />
              </div>
            </div>

            {/* 3D Skeleton Interaction Cue */}
            <div className="absolute top-10 left-2 z-10 text-[7.5px] font-mono text-cyan-400/80 bg-slate-900/75 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-800 pointer-events-none flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              <span>3D Skeleton: Drag to Rotate • Drag & Drop Parts from Tray Below</span>
            </div>

            {/* Layer Visibility Pills */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur-xs px-1.5 py-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => toggleLayer('skeleton')}
                className={`p-1 rounded text-[9px] font-mono ${visibleLayers.skeleton ? 'bg-cyan-900/60 text-cyan-300' : 'text-slate-500'}`}
                title="Toggle Skeleton Layer"
              >
                <Bone size={11} />
              </button>
              <button
                onClick={() => toggleLayer('organs')}
                className={`p-1 rounded text-[9px] font-mono ${visibleLayers.organs ? 'bg-rose-900/60 text-rose-300' : 'text-slate-500'}`}
                title="Toggle Visceral Organs Layer"
              >
                <Heart size={11} />
              </button>
              <button
                onClick={() => toggleLayer('muscles')}
                className={`p-1 rounded text-[9px] font-mono ${visibleLayers.muscles ? 'bg-orange-900/60 text-orange-300' : 'text-slate-500'}`}
                title="Toggle Musculature Layer"
              >
                <Activity size={11} />
              </button>
              <button
                onClick={() => toggleLayer('integument')}
                className={`p-1 rounded text-[9px] font-mono ${visibleLayers.integument ? 'bg-emerald-900/60 text-emerald-300' : 'text-slate-500'}`}
                title="Toggle Integument & Weapon Layer"
              >
                <Shield size={11} />
              </button>

              {/* Graphics Texture Mode Selection */}
              <div className="flex items-center gap-1.5 border-l border-slate-700/80 pl-2 ml-1">
                <button
                  onClick={() => setShowFossilHelpTooltips(!showFossilHelpTooltips)}
                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-extrabold flex items-center gap-1 transition-all cursor-pointer ${showFossilHelpTooltips ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Toggle interactive explanatory guide tooltips across the anatomy builder"
                >
                  <BookOpen size={10} />
                  <span>Guide: {showFossilHelpTooltips ? 'On' : 'Off'}</span>
                </button>

                <button
                  onClick={() => setFossilMode(true)}
                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-extrabold flex items-center gap-1 transition-all cursor-pointer ${fossilMode ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Visualize authentic realistic mineralized fossil bones embedded in rock sediment"
                >
                  <Bone size={10} />
                  <span>🦴 Realistic Fossil</span>
                </button>
                <button
                  onClick={() => setFossilMode(false)}
                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-extrabold flex items-center gap-1 transition-all cursor-pointer ${!fossilMode ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Visualize neon cyber-blue biomechanical X-Ray blueprint"
                >
                  <Dna size={10} />
                  <span>🧬 Cyber-X-Ray</span>
                </button>
              </div>
            </div>

            {/* Interactive 3D Perspective Rotation Sliders */}
            <div className="absolute bottom-2 right-2 z-15 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-xs px-2 py-1 rounded-lg border border-slate-800 text-[8.5px] text-slate-400 select-none">
              <span>Rotate 3D:</span>
              <button onClick={() => setYawDegree(y => y - 8)} className="px-1 py-0.2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer">◀</button>
              <span className="font-mono text-cyan-400 font-bold">{yawDegree}°</span>
              <button onClick={() => setYawDegree(y => y + 8)} className="px-1 py-0.2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer">▶</button>
              <button onClick={() => setPitchDegree(p => p - 4)} className="px-1 py-0.2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer">▲</button>
              <span className="font-mono text-cyan-400 font-bold">{pitchDegree}°</span>
              <button onClick={() => setPitchDegree(p => p + 4)} className="px-1 py-0.2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer">▼</button>
              <button 
                onClick={() => { setYawDegree(-18); setPitchDegree(12); }} 
                className="px-1.5 py-0.2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded cursor-pointer ml-0.5" 
                title="Reset 3D perspective orientation"
              >
                Reset
              </button>
            </div>

            {/* Pulsing Drag & Drop Hover Zones Overlay */}
            {activeDragOverZone && activeDragOverZone !== 'SUCCESS_POP' && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xs flex items-center justify-center p-4 pointer-events-none z-10">
                <div className="bg-purple-950/90 border border-purple-500 p-2 rounded-xl text-center space-y-1 animate-pulse max-w-xs shadow-2xl">
                  <div className="text-[10px] font-rounded font-extrabold text-purple-200 uppercase tracking-wider flex items-center justify-center gap-1">
                    <Sparkles size={11} className="text-purple-400 animate-spin-slow" />
                    <span>Drop to Assemble</span>
                  </div>
                  <p className="text-[8.5px] font-mono text-purple-300">
                    Hovering over <strong className="text-white uppercase font-bold">{activeDragOverZone}</strong> dropzone. Release mouse to lock holotype!
                  </p>
                </div>
              </div>
            )}

            {/* Drop success confirmation animation */}
            {activeDragOverZone === 'SUCCESS_POP' && (
              <div className="absolute inset-0 bg-emerald-950/50 backdrop-blur-3xs flex items-center justify-center pointer-events-none z-10 animate-fade-in">
                <div className="bg-emerald-900 border border-emerald-400 p-3 rounded-2xl text-center space-y-1 shadow-2xl scale-105 transition-all">
                  <span className="text-xl">⚡</span>
                  <div className="text-[11px] font-rounded font-extrabold text-white uppercase tracking-wider">
                    Anatomy Synced Successfully!
                  </div>
                  <p className="text-[9px] font-mono text-emerald-200">
                    Holotype locked and integrated into biomechanical matrix.
                  </p>
                </div>
              </div>
            )}

            {/* Toggleable Tooltips Overlay Legend */}
            {showFossilHelpTooltips && !activeDragOverZone && (
              <div className="absolute bottom-2 left-2 right-2 z-10 bg-slate-950/95 p-2 rounded-lg border border-slate-800 text-[8px] leading-tight space-y-1 text-slate-300 font-mono pointer-events-none shadow-xl">
                <div className="text-amber-300 font-extrabold flex items-center gap-1">
                  <Sparkles size={10} className="animate-pulse" />
                  <span>Biomechanical & Anatomical 3D Realistic Guide</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  <div>🦴 <strong className="text-slate-200">Spine Curve</strong>: Standard or sail-backed 3D cylinders.</div>
                  <div>❤️ <strong className="text-slate-200">Avian Heart</strong>: Highly vascular four-chambered motor.</div>
                  <div>🦾 <strong className="text-slate-200">Pillar Limbs</strong>: Cursorial biped or graviportal pillar columns.</div>
                  <div>🛡️ <strong className="text-slate-200">Integument</strong>: Plumed proto-feathers or dermal osteoderm scutes.</div>
                </div>
              </div>
            )}

            {/* SVG Anatomical Visualization */}
            <svg 
              viewBox="0 0 320 160" 
              className="w-full h-full relative"
              style={{
                transform: `perspective(380px) rotateX(${pitchDegree}deg) rotateY(${yawDegree}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.18s ease-out'
              }}
            >
              <defs>
                <linearGradient id="visceraHeartGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#9f1239" />
                </linearGradient>
                <linearGradient id="airSacGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* 3D Rock/Sandstone matrix background underlay for realistic fossil mode */}
              {fossilMode && (
                <g opacity="0.45" className="pointer-events-none">
                  <rect x="0" y="0" width="320" height="160" fill="#f5ebe0" />
                  {/* Winding geological stratum lines */}
                  <path d="M -10,120 Q 80,140 160,115 T 330,125" fill="none" stroke="#d5bdaf" strokeWidth="1" strokeDasharray="3,3" />
                  <path d="M -10,35 Q 90,25 180,55 T 330,45" fill="none" stroke="#d5bdaf" strokeWidth="1" strokeDasharray="4,2" />
                  {/* Sediment grains */}
                  <circle cx="50" cy="110" r="0.7" fill="#8d99ae" />
                  <circle cx="210" cy="30" r="0.9" fill="#8d99ae" />
                  <circle cx="280" cy="130" r="0.7" fill="#8d99ae" />
                </g>
              )}

              {/* LAYER 1: SKELETAL FRAME */}
              {visibleLayers.skeleton && (
                <g className="transition-all duration-500">
                  {/* Spine / Vertebral Column */}
                  {organState.vertebralAxis === 'elastic_long_neck' ? (
                    // Sauropod long neck
                    <path
                      d="M 25 35 Q 50 15 90 45 Q 160 55 220 75 Q 265 95 295 105"
                      fill="none"
                      stroke={fossilMode ? '#5c3a21' : '#38bdf8'}
                      strokeWidth={fossilMode ? '4.5' : '3.5'}
                      strokeLinecap="round"
                    />
                  ) : organState.vertebralAxis === 'sail_backed_neural' ? (
                    // Spinosaur sail
                    <>
                      <path
                        d="M 45 60 Q 80 40 120 50 Q 180 50 220 70 Q 260 90 295 100"
                        fill="none"
                        stroke={fossilMode ? '#5c3a21' : '#38bdf8'}
                        strokeWidth={fossilMode ? '4.5' : '3.5'}
                        strokeLinecap="round"
                      />
                      <path
                        d="M 90 50 Q 135 10 180 50 Z"
                        fill={fossilMode ? 'rgba(120, 53, 4, 0.15)' : 'rgba(245, 158, 11, 0.2)'}
                        stroke={fossilMode ? '#78350f' : '#f59e0b'}
                        strokeWidth="1.5"
                        strokeDasharray={fossilMode ? "none" : "2 2"}
                      />
                    </>
                  ) : (
                    // Standard theropod / ceratopsian curve
                    <path
                      d="M 45 55 Q 85 45 125 55 Q 185 55 225 75 Q 265 95 295 105"
                      fill="none"
                      stroke={fossilMode ? '#5c3a21' : '#38bdf8'}
                      strokeWidth={fossilMode ? '4.5' : '3.5'}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Skull Outline */}
                  {organState.skullType === 'sauropod_peg' ? (
                    <circle cx="25" cy="35" r="9" fill={fossilMode ? '#7c2d12' : 'none'} fillOpacity={fossilMode ? 0.15 : 0} stroke={fossilMode ? '#451a03' : '#67e8f9'} strokeWidth={fossilMode ? '2.5' : '2'} />
                  ) : organState.skullType === 'ceratopsian_frill' ? (
                    <path d="M 45 55 L 30 70 L 50 72 Z M 48 53 Q 65 30 55 60" fill={fossilMode ? '#7c2d12' : 'none'} fillOpacity={fossilMode ? 0.15 : 0} stroke={fossilMode ? '#451a03' : '#67e8f9'} strokeWidth={fossilMode ? '2.5' : '2'} />
                  ) : organState.skullType === 'spinosaur_snout' ? (
                    <path d="M 45 60 L 15 65 L 45 72 Z" fill={fossilMode ? '#7c2d12' : 'none'} fillOpacity={fossilMode ? 0.15 : 0} stroke={fossilMode ? '#451a03' : '#67e8f9'} strokeWidth={fossilMode ? '2.5' : '2'} />
                  ) : (
                    // Theropod serrated cranium
                    <path d="M 45 55 L 20 62 L 45 70 Z" fill={fossilMode ? '#7c2d12' : 'none'} fillOpacity={fossilMode ? 0.15 : 0} stroke={fossilMode ? '#451a03' : '#67e8f9'} strokeWidth={fossilMode ? '2.5' : '2'} />
                  )}

                  {/* Limbs Skeleton */}
                  {organState.limbProportions === 'cursorial_biped' ? (
                    <>
                      {/* Biped Hindlimb */}
                      <path d="M 185 65 L 180 100 L 195 135 L 208 138" fill="none" stroke={fossilMode ? '#4a2c0c' : '#a5f3fc'} strokeWidth={fossilMode ? '4' : '3'} strokeLinecap="round" />
                      {/* Reduced Forelimb */}
                      <path d="M 115 65 L 120 85 L 126 88" fill="none" stroke={fossilMode ? '#4a2c0c' : '#a5f3fc'} strokeWidth={fossilMode ? '2.5' : '2'} strokeLinecap="round" />
                    </>
                  ) : organState.limbProportions === 'semi_aquatic_paddle' ? (
                    <>
                      <path d="M 185 68 L 182 105 L 196 125 L 210 128" fill="none" stroke={fossilMode ? '#4a2c0c' : '#a5f3fc'} strokeWidth={fossilMode ? '4.5' : '3.5'} strokeLinecap="round" />
                      <path d="M 115 68 L 105 100 L 118 120 L 128 122" fill="none" stroke={fossilMode ? '#4a2c0c' : '#a5f3fc'} strokeWidth={fossilMode ? '4.5' : '3.5'} strokeLinecap="round" />
                    </>
                  ) : (
                    // Quadruped pillar limbs
                    <>
                      <path d="M 195 72 L 195 110 L 195 140" fill="none" stroke={fossilMode ? '#4a2c0c' : '#a5f3fc'} strokeWidth={fossilMode ? '5.5' : '4.5'} strokeLinecap="round" />
                      <path d="M 105 60 L 105 105 L 105 140" fill="none" stroke={fossilMode ? '#4a2c0c' : '#a5f3fc'} strokeWidth={fossilMode ? '5.5' : '4.5'} strokeLinecap="round" />
                    </>
                  )}
                </g>
              )}

              {/* LAYER 2: VISCERAL ORGANS */}
              {visibleLayers.organs && (
                <g className="transition-all duration-500">
                  {/* Pulsing Heart */}
                  <circle
                    cx="120"
                    cy="72"
                    r={organState.heartType === 'four_chamber_avian' ? "9" : "6"}
                    fill="url(#visceraHeartGrad)"
                    className="animate-pulse"
                  />
                  <circle cx="120" cy="72" r="3" fill="#ffffff" />

                  {/* Air Sacs (Cyan Diverticula) */}
                  {organState.respiratoryAirSacs === 'parabronchial_unidirectional' && (
                    <>
                      <ellipse cx="145" cy="68" rx="14" ry="8" fill="url(#airSacGrad)" />
                      <ellipse cx="98" cy="65" rx="10" ry="6" fill="url(#airSacGrad)" />
                      <line x1="120" y1="72" x2="145" y2="68" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 1" />
                    </>
                  )}

                  {/* Gizzard / Stomach */}
                  <circle
                    cx="152"
                    cy="80"
                    r="8"
                    fill={organState.gizzardCapacity === 'gastrolith_grinding' ? "#d97706" : "#b45309"}
                    fillOpacity="0.7"
                  />
                </g>
              )}

              {/* LAYER 3: MUSCULATURE */}
              {visibleLayers.muscles && (
                <g className="transition-all duration-500">
                  {/* Caudofemoralis Muscle Engine */}
                  <ellipse
                    cx="205"
                    cy="78"
                    rx={organState.muscleVolume === 'hyper_caudofemoralis' ? "24" : "16"}
                    ry={organState.muscleVolume === 'hyper_caudofemoralis' ? "14" : "9"}
                    fill="rgba(249, 115, 22, 0.25)"
                    stroke="#f97316"
                    strokeWidth="1.5"
                  />
                  {/* Jaw Adductor Mass */}
                  <ellipse cx="48" cy="62" rx="8" ry="6" fill="rgba(249, 115, 22, 0.35)" />
                </g>
              )}

              {/* LAYER 4: INTEGUMENT, ARMOR & WEAPONS */}
              {visibleLayers.integument && (
                <g className="transition-all duration-500">
                  {/* Proto-feather plumage fringes */}
                  {organState.integumentCoating === 'proto_feathers' && (
                    <path
                      d="M 85 45 Q 110 38 135 48 M 185 62 L 195 52 M 225 72 L 240 65 M 265 92 L 285 85"
                      stroke="#34d399"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Osteoderm plates */}
                  {organState.integumentCoating === 'osteoderm_armor' && (
                    <>
                      <polygon points="105,48 112,42 119,48" fill="#10b981" />
                      <polygon points="135,50 142,44 149,50" fill="#10b981" />
                      <polygon points="165,54 172,48 179,54" fill="#10b981" />
                      <polygon points="195,62 202,56 209,62" fill="#10b981" />
                    </>
                  )}

                  {/* Cranial Horns */}
                  {organState.cranialDisplay === 'keratin_horns' && (
                    <line x1="38" y1="52" x2="28" y2="35" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" />
                  )}

                  {/* Tail Weaponry */}
                  {organState.tailArmament === 'ankylosaur_club' && (
                    <circle cx="298" cy="106" r="8" fill="#10b981" stroke="#34d399" strokeWidth="2" />
                  )}
                  {organState.tailArmament === 'thagomizer_spikes' && (
                    <>
                      <line x1="290" y1="102" x2="305" y2="92" stroke="#fcd34d" strokeWidth="2.5" />
                      <line x1="295" y1="105" x2="310" y2="115" stroke="#fcd34d" strokeWidth="2.5" />
                    </>
                  )}
                </g>
              )}
            </svg>
          </div>

          {/* DRAGGABLE ANATOMICAL HOLOTYPES TRAY (Direct drag-and-drop assembly!) */}
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[9.5px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              <span className="flex items-center gap-1">
                <Dna size={11} className="text-cyan-400 animate-pulse" />
                <span>Draggable Holotypes Tray (Drag direct to 3D Canvas!)</span>
              </span>
              <span className="text-amber-400 font-bold">Level: {activeLevel}</span>
            </div>

            {/* List 4 draggable components relevant to current level */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              {(() => {
                const getLevelDraggables = () => {
                  switch (activeLevel) {
                    case 1:
                      return [
                        { key: 'skullType', val: 'theropod_carnivore', label: '🦖 Carnivore Blade-Skull', color: 'bg-cyan-950/70 border-cyan-800 hover:border-cyan-600' },
                        { key: 'skullType', val: 'ceratopsian_frill', label: '🛡️ Ceratopsian Frilled-Beak', color: 'bg-cyan-950/70 border-cyan-800 hover:border-cyan-600' },
                        { key: 'vertebralAxis', val: 'pneumatized_air_sac', label: '🦴 Air-Sac Spine Column', color: 'bg-cyan-950/70 border-cyan-800 hover:border-cyan-600' },
                        { key: 'limbProportions', val: 'cursorial_biped', label: '👣 Cursorial Biped Legs', color: 'bg-cyan-950/70 border-cyan-800 hover:border-cyan-600' }
                      ];
                    case 2:
                      return [
                        { key: 'heartType', val: 'four_chamber_avian', label: '❤️ 4-Chamber Avian Heart', color: 'bg-rose-950/70 border-rose-800 hover:border-rose-600' },
                        { key: 'respiratoryAirSacs', val: 'parabronchial_unidirectional', label: '🫁 Parabronchial Air Sac', color: 'bg-rose-950/70 border-rose-800 hover:border-rose-600' },
                        { key: 'gizzardCapacity', val: 'gastrolith_grinding', label: '🪨 Gastrolith Gizzard Mill', color: 'bg-rose-950/70 border-rose-800 hover:border-rose-600' },
                        { key: 'gizzardCapacity', val: 'simple_acid_stomach', label: '🧪 High-Acid Proteolysis', color: 'bg-rose-950/70 border-rose-800 hover:border-rose-600' }
                      ];
                    case 3:
                      return [
                        { key: 'muscleVolume', val: 'hyper_caudofemoralis', label: '💪 Hyper Caudofemoralis', color: 'bg-orange-950/70 border-orange-800 hover:border-orange-600' },
                        { key: 'muscleVolume', val: 'lean_cursorial', label: '⚡ Lean Cursorial Bundles', color: 'bg-orange-950/70 border-orange-800 hover:border-orange-600' },
                        { key: 'jawMusculature', val: 'massive_pterygoideus', label: '🐊 Crushing Pterygoideus', color: 'bg-orange-950/70 border-orange-800 hover:border-orange-600' },
                        { key: 'jawMusculature', val: 'rapid_snap_kinetic', label: '🎯 High-Speed Snap Muscle', color: 'bg-orange-950/70 border-orange-800 hover:border-orange-600' }
                      ];
                    case 4:
                      return [
                        { key: 'metabolicRate', val: 'endothermic_high', label: '🔥 Endothermic Furnace', color: 'bg-amber-950/70 border-amber-800 hover:border-amber-600' },
                        { key: 'metabolicRate', val: 'mesothermic_balanced', label: '⚖️ Mesothermic Buffer', color: 'bg-amber-950/70 border-amber-800 hover:border-amber-600' },
                        { key: 'thermoregulation', val: 'vascular_sail_plates', label: '⛵ Vascular Sail Plates', color: 'bg-amber-950/70 border-amber-800 hover:border-amber-600' },
                        { key: 'thermoregulation', val: 'nasal_countercurrent', label: '🌀 Nasal Heat Exchanger', color: 'bg-amber-950/70 border-amber-800 hover:border-amber-600' }
                      ];
                    default:
                      return [
                        { key: 'integumentCoating', val: 'proto_feathers', label: '🪶 Filamentous Plumage', color: 'bg-emerald-950/70 border-emerald-800 hover:border-emerald-600' },
                        { key: 'integumentCoating', val: 'osteoderm_armor', label: '🛡️ Bony Osteoderm Scutes', color: 'bg-emerald-950/70 border-emerald-800 hover:border-emerald-600' },
                        { key: 'tailArmament', val: 'ankylosaur_club', label: '🔨 Tail Osteoderm Club', color: 'bg-emerald-950/70 border-emerald-800 hover:border-emerald-600' },
                        { key: 'tailArmament', val: 'thagomizer_spikes', label: '⚔️ Thagomizer Spikes', color: 'bg-emerald-950/70 border-emerald-800 hover:border-emerald-600' }
                      ];
                  }
                };

                return getLevelDraggables().map((item, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', `${item.key}:${item.val}`);
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-between text-[10px] font-rounded font-bold text-white transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02] shadow-sm select-none ${item.color}`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[8px] font-mono text-slate-400 bg-slate-900/60 px-1 py-0.2 rounded border border-slate-700/60 uppercase">DRAG</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Real-time Physiological Stat Scoreboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Calculated Mass</span>
              <span className="text-sm font-mono font-bold text-amber-300">{simMetrics.massKg.toLocaleString()} kg</span>
              <span className="text-[9px] font-mono text-slate-400 block">({simMetrics.massTons} tons)</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Top Sprint Velocity</span>
              <span className="text-sm font-mono font-bold text-emerald-400">{simMetrics.topSpeedKmh} km/h</span>
              <span className="text-[9px] font-mono text-slate-400 block">Digitigrade Gait</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Jaw Bite Force Vector</span>
              <span className="text-sm font-mono font-bold text-rose-400">{simMetrics.biteForceN.toLocaleString()} N</span>
              <span className="text-[9px] font-mono text-slate-400 block">Pterygoideus Peak</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Respiration Output</span>
              <span className="text-sm font-mono font-bold text-cyan-400">{simMetrics.respirationEff}%</span>
              <span className="text-[9px] font-mono text-slate-400 block">{simMetrics.dailyKcal.toLocaleString()} kcal/day</span>
            </div>
          </div>

          {/* Biological Diagnostics & Evolutionary Insights */}
          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
              <span>Physiological Diagnostics:</span>
              <span className="text-emerald-400">{simMetrics.diagnostics.length} Active Vectors</span>
            </div>
            <div className="max-h-24 overflow-y-auto space-y-1 no-scrollbar text-[10px]">
              {simMetrics.diagnostics.map((diag, i) => (
                <div key={i} className="flex items-start gap-1.5 leading-snug">
                  {diag.type === 'positive' && <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />}
                  {diag.type === 'warning' && <ShieldAlert size={12} className="text-amber-400 shrink-0 mt-0.5" />}
                  {diag.type === 'neutral' && <Info size={12} className="text-slate-400 shrink-0 mt-0.5" />}
                  <span className={diag.type === 'warning' ? 'text-amber-300' : 'text-slate-300'}>
                    {diag.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>)}

      {/* Mobile Quick-Metrics Floating HUD (Visible on small screens so mobile users never scroll up & down) */}
      <div className="lg:hidden sticky bottom-3 z-30 bg-slate-900/95 text-white p-2.5 rounded-2xl border border-slate-700/90 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2 text-[10.5px] font-mono">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="font-extrabold text-amber-300 truncate">{specimenCustomName || simMetrics.syntheticName}</span>
          <span className="text-slate-500">•</span>
          <span className={`px-1.5 py-0.2 rounded font-bold border shrink-0 text-[9px] ${
            simMetrics.viabilityScore >= 80 ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-amber-950 text-amber-300 border-amber-700'
          }`}>
            {simMetrics.viabilityScore}% Viable
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-bold">
          <span className="text-cyan-300" title="Mass">{simMetrics.massTons}t</span>
          <span className="text-emerald-300" title="Top Speed">{simMetrics.topSpeedKmh}km/h</span>
          <span className="text-rose-300" title="Bite Force">{(simMetrics.biteForceN / 1000).toFixed(1)}kN</span>
        </div>
      </div>
    </div>
  );
};

export default AnatomicalSynthesizerBuilder;
