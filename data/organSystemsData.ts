import { AbstractionTier, CrossDomainInterrelation } from '../types';

export type OrganSystemCategory = 
  | 'cardiovascular'
  | 'respiratory'
  | 'digestive'
  | 'neurosensory'
  | 'musculoskeletal';

export interface OrganDetail {
  id: string;
  name: string;
  latinTerm: string;
  system: OrganSystemCategory;
  categoryLabel: string;
  color: string;
  coords: { x: number; y: number; r?: number };
  svgShape?: string; // Optional detailed SVG path string
  summary: string;
  physiologicalRole: string;
  avianHomology: string; // Evolutionary link (birds vs crocodilians)
  fossilEvidence: string; // Taphonomic & osteological correlates (foramina, endocasts, etc.)
  keyMetrics: { label: string; value: string }[];
  simulationType?: 'heartbeat' | 'airflow' | 'digestion' | 'neural' | 'muscle';
  abstractionTier?: AbstractionTier;
  interrelations?: CrossDomainInterrelation[];
  skeletalCorrelate?: { boneName: string; feature: string };
  waveformData?: {
    waveformType: 'cardiac_ecg' | 'air_cycle' | 'grf_curve' | 'neural_spike' | 'gastric_pressure';
    primaryLabel: string;
    baselineVal: number;
    peakVal: number;
    unit: string;
    description: string;
  };
}

export interface DinoOrganProfile {
  taxaName: string;
  clade: string;
  posture: string;
  metabolismModel: 'Avian Endothermy' | 'Gigantothermy' | 'Mesothermy' | 'Poikilothermy';
  estimatedBpm: number;
  bodyMassKg: number;
  coreBodyTempC: number;
  silhouettePath: string;
  organs: OrganDetail[];
  systemSummaries: Record<OrganSystemCategory, string>;
  evolutionaryNotes: string;
}

export const ORGAN_SYSTEM_META: Record<OrganSystemCategory, { label: string; color: string; badge: string; icon: string; description: string }> = {
  cardiovascular: {
    label: "Cardiovascular & Hemodynamic",
    color: "#ef4444",
    badge: "Arterial Circulatory",
    icon: "Heart",
    description: "4-chambered double-circuit heart, high-pressure systemic aorta, and microvascular thermoregulatory shunts."
  },
  respiratory: {
    label: "Respiratory & Avian Air Sacs",
    color: "#06b6d4",
    badge: "Unidirectional Flow",
    icon: "Wind",
    description: "Rigid flow-through parabronchial lungs with anterior and posterior pneumatic air sacs that invade skeletal vertebrae."
  },
  digestive: {
    label: "Digestive & Visceral Gizzard",
    color: "#f59e0b",
    badge: "Gastric Mill",
    icon: "Flame",
    description: "Multi-chambered proventriculus, muscular gizzard with gastroliths, heavy hepatic lobe, and high-efficiency nutrient uptake."
  },
  neurosensory: {
    label: "Neurosensory & Braincase",
    color: "#a855f7",
    badge: "Endocranial Neural",
    icon: "Brain",
    description: "Encephalic lobes, hypertrophied olfactory bulbs, stereoscopic optic tectum, and vestibular semicircular canals."
  },
  musculoskeletal: {
    label: "Locomotor Musculature & Scaffolding",
    color: "#10b981",
    badge: "Biomechanical Power",
    icon: "Activity",
    description: "M. caudofemoralis longus locomotor engines, craniomandibular bite adductors, and protective gastralia baskets."
  }
};

export const DINO_ORGAN_PROFILES: Record<string, DinoOrganProfile> = {
  "Tyrannosaurus Rex": {
    taxaName: "Tyrannosaurus Rex",
    clade: "Coelurosauria • Tyrannosauroidea",
    posture: "Horizontal Bipedal Theropod",
    metabolismModel: "Avian Endothermy",
    estimatedBpm: 34,
    bodyMassKg: 8400,
    coreBodyTempC: 37.5,
    silhouettePath: "M 70,220 C 80,180 110,130 160,115 C 210,100 280,110 330,130 C 370,146 410,130 450,110 C 470,100 500,95 530,105 C 550,112 565,130 550,150 C 530,175 490,185 450,195 C 430,200 410,215 395,240 C 380,265 370,300 380,340 C 390,380 405,420 395,445 C 385,465 365,470 345,465 C 330,460 320,440 330,410 C 340,380 345,340 330,300 C 310,280 280,270 250,280 C 230,290 220,330 225,370 C 230,410 240,450 230,465 C 220,475 200,470 190,455 C 180,430 185,380 195,330 C 180,300 160,280 130,270 C 95,260 70,240 70,220 Z",
    systemSummaries: {
      cardiovascular: "Enormous 4-chambered heart (~185 kg) generating elevated systolic pressure to drive blood through a 12-meter muscular frame.",
      respiratory: "Advanced avian-style unidirectional air sac system that continuously oxygenated blood on both inhalation and exhalation.",
      digestive: "Hydrochloric proventriculus and muscular gizzard containing swallowed stones (gastroliths) to shatter ceratopsian bone shards.",
      neurosensory: "Hypertrophied olfactory bulbs providing olfactory acuity comparable to modern turkey vultures and bloodhounds.",
      musculoskeletal: "Massive M. caudofemoralis longus muscle anchoring to femur 4th trochanter, powering high-torque strides."
    },
    evolutionaryNotes: "Possesses homologous avian air sacs, pneumatic bones, and fully divided ventricular septum, confirming close affinity to modern birds.",
    organs: [
      {
        id: "trex-heart",
        name: "4-Chambered Archosaurian Heart",
        latinTerm: "Cor tetracameratum archosaurianum",
        system: "cardiovascular",
        categoryLabel: "Cardiovascular Core",
        color: "#ef4444",
        coords: { x: 375, y: 220, r: 24 },
        svgShape: "M 375,200 C 390,195 400,210 395,228 C 390,244 375,255 375,255 C 375,255 360,244 355,228 C 350,210 360,195 375,200 Z",
        summary: "Massive double-pump heart separated by complete interventricular septum.",
        physiologicalRole: "Pumps approximately 14 liters of oxygenated blood per stroke at 32-36 BPM to maintain elevated metabolic demands in a multi-ton theropod.",
        avianHomology: "Shared complete ventricular septum with extant Neornithes (birds); high cardiac mass-to-body ratio exceeding non-avian reptiles.",
        fossilEvidence: "Corroborated by high oxygen-isotope bone turnover rates, dense Haversian canals, and cardiovascular canal prints in fossilized thoraces.",
        keyMetrics: [
          { label: "Cardiac Mass", value: "~185 kg" },
          { label: "Resting Heart Rate", value: "32 - 36 BPM" },
          { label: "Stroke Volume", value: "14.2 Liters" },
          { label: "Systolic Pressure", value: "195 mmHg" }
        ],
        simulationType: "heartbeat"
      },
      {
        id: "trex-dorsal-aorta",
        name: "Systemic Dorsal Aorta",
        latinTerm: "Aorta dorsalis theropoda",
        system: "cardiovascular",
        categoryLabel: "High-Pressure Arterial Trunk",
        color: "#dc2626",
        coords: { x: 310, y: 175, r: 16 },
        svgShape: "M 375,210 Q 320,165 240,185 Q 170,210 130,230",
        summary: "Arterial highway carrying pressurized oxygen-rich blood along the spinal axis.",
        physiologicalRole: "Distributes arterial blood to the caudal retractor musculature, pelvics, and digestive organs under sustained pressure.",
        avianHomology: "Directly homologous to the dorsal aorta of palaeognathous birds (ostriches and emus).",
        fossilEvidence: "Aortic groove markings and sub-vertebral arterial canal impressions preserved along dorsal vertebra centra.",
        keyMetrics: [
          { label: "Lumen Diameter", value: "8.5 cm" },
          { label: "Flow Velocity", value: "1.4 m/s" },
          { label: "Arterial Branching", value: "Renal & Iliac" }
        ],
        simulationType: "heartbeat"
      },
      {
        id: "trex-lungs",
        name: "Parabronchial Flow-Through Lungs",
        latinTerm: "Pulmo parabronchialis avianus",
        system: "respiratory",
        categoryLabel: "Gas-Exchange Core",
        color: "#06b6d4",
        coords: { x: 360, y: 170, r: 22 },
        svgShape: "M 335,160 C 350,150 380,150 395,165 C 400,180 390,195 375,195 C 350,195 330,180 335,160 Z",
        summary: "Rigid, non-expanding lung tissue with microscopic honeycomb parabronchi.",
        physiologicalRole: "Maintains constant, unidirectional airflow where fresh air moves across blood capillaries during both inspiration and expiration.",
        avianHomology: "Identical aerodynamic valvular mechanism found in modern birds and extinct theropods.",
        fossilEvidence: "Costal rib articulation facets and thoracic vertebral osteological pits indicating rigid dorsal lung anchorage.",
        keyMetrics: [
          { label: "Lung Volume", value: "120 Liters" },
          { label: "Capillary Surface Area", value: "1,450 m²" },
          { label: "Gas Exchange Mechanism", value: "Cross-current flow" }
        ],
        simulationType: "airflow"
      },
      {
        id: "trex-post-air-sacs",
        name: "Posterior Abdominal Air Sacs",
        latinTerm: "Saccus pneumaticus abdominalis",
        system: "respiratory",
        categoryLabel: "Inspiratory Bellows",
        color: "#0284c7",
        coords: { x: 280, y: 215, r: 26 },
        svgShape: "M 255,200 C 275,190 305,195 315,215 C 320,235 300,250 275,250 C 255,250 245,230 255,200 Z",
        summary: "Massive compliant bellows in the abdominal cavity that receive fresh inhaled air.",
        physiologicalRole: "Expands during inhalation to draw outside air directly through the primary bronchi past the lungs, storing oxygen for the next stroke.",
        avianHomology: "Homologous to avian abdominal air sacs; pneumatic diverticula invade ilium and sacral vertebrae.",
        fossilEvidence: "Profound skeletal pneumaticity (pleurocoels and neural canal cavities) in T-Rex sacral vertebrae.",
        keyMetrics: [
          { label: "Air Sac Volume", value: "280 Liters" },
          { label: "Pneumatization Depth", value: "Sacrum & Pelvis" },
          { label: "Respiratory Cycles", value: "2-Cycle Loop" }
        ],
        simulationType: "airflow"
      },
      {
        id: "trex-ant-air-sacs",
        name: "Anterior Thoracic & Cervical Air Sacs",
        latinTerm: "Saccus pneumaticus cervicalis et thoracicus",
        system: "respiratory",
        categoryLabel: "Expiratory Reservoir",
        color: "#38bdf8",
        coords: { x: 425, y: 165, r: 18 },
        svgShape: "M 410,150 C 430,140 450,150 455,170 C 455,185 435,195 415,185 C 400,175 400,160 410,150 Z",
        summary: "Forward air sacs invading the cervical vertebrae to lighten the massive head.",
        physiologicalRole: "Collects deoxygenated air exiting the lungs, then expels it through the trachea during exhalation.",
        avianHomology: "Extensive pneumatic foramina invading cervical neural arches identically to eagles and ratites.",
        fossilEvidence: "Large elliptical pneumatic foramina on cervical vertebrae centra of FMNH PR2081 ('Sue').",
        keyMetrics: [
          { label: "Neck Weight Reduction", value: "38% Bone Mass" },
          { label: "Exhalation Efficiency", value: "94% Tidal Purge" }
        ],
        simulationType: "airflow"
      },
      {
        id: "trex-gizzard",
        name: "Muscular Gizzard (Ventriculus)",
        latinTerm: "Ventriculus muscularis theropoda",
        system: "digestive",
        categoryLabel: "Gastric Mechanical Mill",
        color: "#f59e0b",
        coords: { x: 320, y: 245, r: 20 },
        svgShape: "M 305,230 C 325,220 345,230 350,250 C 350,265 330,275 310,270 C 295,260 295,245 305,230 Z",
        summary: "Dense, hyper-muscular churning chamber lined with tough koilin and gastrolith stones.",
        physiologicalRole: "Crushes and pulverizes bone shards (osteophagy), tendon, and armor plates swallowed whole from hadrosaur and ceratopsian prey.",
        avianHomology: "Direct homologue to the avian muscular gizzard; supported by fossil gastroliths in related theropods.",
        fossilEvidence: "Crushed Triceratops bone fragments preserved in T-Rex coprolites (fossil feces) and gastric residue.",
        keyMetrics: [
          { label: "Crushing Pressure", value: "18.5 MPa" },
          { label: "Gastric Transit Time", value: "36 - 48 Hours" },
          { label: "Gastrolith Load", value: "5 - 12 kg Stones" }
        ],
        simulationType: "digestion"
      },
      {
        id: "trex-proventriculus",
        name: "Acidic Chemical Proventriculus",
        latinTerm: "Proventriculus gastricus",
        system: "digestive",
        categoryLabel: "Acid Digestion Chamber",
        color: "#d97706",
        coords: { x: 355, y: 235, r: 16 },
        summary: "Enzymatic stomach secreting concentrated hydrochloric acid and pepsin.",
        physiologicalRole: "Dissolves bone apatite and organic collagen before slurry passes into the duodenum.",
        avianHomology: "Shared chemical digestion organ with falconiform and crocodilian archosaurs.",
        fossilEvidence: "Coprolite matrix analysis showing high dissolved calcium-phosphate from digested bone.",
        keyMetrics: [
          { label: "Gastric pH", value: "1.1 - 1.4 (Extremely Acidic)" },
          { label: "Bone Dissolution Rate", value: "High Osteolysis" }
        ],
        simulationType: "digestion"
      },
      {
        id: "trex-olfactory",
        name: "Hypertrophied Olfactory Bulbs",
        latinTerm: "Bulbus olfactorius hypertrophicus",
        system: "neurosensory",
        categoryLabel: "Apex Chemosensory Engine",
        color: "#a855f7",
        coords: { x: 520, y: 95, r: 14 },
        svgShape: "M 508,90 C 520,82 535,88 538,98 C 538,108 522,112 512,106 C 504,100 502,94 508,90 Z",
        summary: "Colossal chemosensory brain lobes occupying over 50% of the cranial endocast volume.",
        physiologicalRole: "Detects decaying carcasses or live prey herds from tens of kilometers downwind across Late Cretaceous floodplains.",
        avianHomology: "Relative olfactory bulb volume exceeds that of any other known dinosaur, comparable only to modern turkey vultures.",
        fossilEvidence: "High-resolution CT endocranial scans of the AMNH 5027 and FMNH PR2081 crania.",
        keyMetrics: [
          { label: "Olfactory Ratio", value: "61.3% (World Record)" },
          { label: "Scent Range", value: "> 15 km Radius" },
          { label: "Turbinate Surface", value: "Extensive Cribriform" }
        ],
        simulationType: "neural"
      },
      {
        id: "trex-cerebrum",
        name: "Cerebrum & Semicircular Canals",
        latinTerm: "Cerebrum et canales semicirculares",
        system: "neurosensory",
        categoryLabel: "Predatory Spatial Processing",
        color: "#7c3aed",
        coords: { x: 490, y: 110, r: 16 },
        summary: "Brain center controlling binocular vision, aggressive coordination, and head stabilization.",
        physiologicalRole: "Processes 3D stereoscopic depth from forward-facing eyes (55° binocular overlap) and calculates trajectory strikes.",
        avianHomology: "Enlarged optic tectum and expanded semicircular canals matching modern predatory raptors.",
        fossilEvidence: "Bony labyrinth CT models demonstrating habitual horizontal snout tilt (neutral hunting stance).",
        keyMetrics: [
          { label: "Binocular Overlap", value: "55° (Exceeds Modern Hawk)" },
          { label: "Encephalization Quotient (EQ)", value: "2.4 - 2.8" },
          { label: "Auditory Range", value: "Infrasonic (10 - 200 Hz)" }
        ],
        simulationType: "neural"
      },
      {
        id: "trex-caudofemoralis",
        name: "M. Caudofemoralis Longus",
        latinTerm: "Musculus caudofemoralis longus",
        system: "musculoskeletal",
        categoryLabel: "Primary Locomotor Powerhouse",
        color: "#10b981",
        coords: { x: 230, y: 260, r: 28 },
        svgShape: "M 170,230 C 220,210 260,225 280,260 C 265,285 220,295 170,270 C 140,250 150,235 170,230 Z",
        summary: "Immense locomotor retractor muscle stretching from tail vertebrae to the 4th trochanter of the femur.",
        physiologicalRole: "Generates explosive backward pulling force on the hindlimb during walking and predatory charges.",
        avianHomology: "Reduced in modern flying birds as the tail shortened into the pygostyle, but retains massive proportions in crocodilians and theropods.",
        fossilEvidence: "Pronounced fourth trochanter flanges on T-Rex femora and expanded haemal spines/chevrons in proximal caudal vertebrae.",
        keyMetrics: [
          { label: "Muscle Mass", value: "480 kg per side" },
          { label: "Force Vector", value: "High-Torque Retraction" },
          { label: "Stride Propulsion", value: "62% Total Kinetic Power" }
        ],
        simulationType: "muscle"
      },
      {
        id: "trex-adductor",
        name: "M. Adductor Mandibulae Complex",
        latinTerm: "Musculus adductor mandibulae externus",
        system: "musculoskeletal",
        categoryLabel: "Craniomandibular Bite Engine",
        color: "#059669",
        coords: { x: 470, y: 140, r: 18 },
        svgShape: "M 455,130 C 475,120 490,135 485,155 C 475,165 460,165 450,150 C 445,140 445,135 455,130 Z",
        summary: "Massive jaw-closing muscular complex packed inside the temporal fenestrae.",
        physiologicalRole: "Drives the serrated teeth through armored bone with up to 57,000 Newtons of force.",
        avianHomology: "Derived archosaurian jaw adductor architecture anchoring to supratemporal fossae.",
        fossilEvidence: "Deep rugose muscle scars inside the temporal bar and fused nasal bones adapted to resist crushing torsion.",
        keyMetrics: [
          { label: "Crushing Force", value: "57,000 N (12,800 lbf)" },
          { label: "Tooth Pressure", value: "431,000 psi at tip" },
          { label: "Bite Mechanism", value: "Puncturing Bone-Crush" }
        ],
        simulationType: "muscle",
        abstractionTier: "organismal_biomechanic"
      },
      {
        id: "trex-haversian-bone",
        name: "Dense Haversian Canals & Fibrolamellar Osteons",
        latinTerm: "Canales haversiani et osteona fibrolamellaria",
        system: "musculoskeletal",
        categoryLabel: "Bone Histology & Microvasculature",
        color: "#8b5cf6",
        coords: { x: 330, y: 390, r: 16 },
        summary: "Densely packed vascular osteons and fibrolamellar bone matrix exhibiting hyper-rapid remodeling during growth spurts.",
        physiologicalRole: "Supported adolescent mass gain (up to 767 kg/year) and sustained bone repair under 50+ kN dynamic strike loads.",
        avianHomology: "Shared fast-growing fibrolamellar bone fabric directly matching modern ratites (ostriches and emus).",
        fossilEvidence: "Petrographic thin-sections of specimen FMNH PR2081 ('Sue') revealing dense osteocyte lacunae networks and secondary Haversian remodeling.",
        keyMetrics: [
          { label: "Histological Fabric", value: "Fibrolamellar Complex" },
          { label: "Annual Growth Spurt", value: "767 kg / year" },
          { label: "Osteon Remodeling", value: "Continuous High-Flux" },
          { label: "Taphonomic Matrix", value: "Silicified Canaliculi" }
        ],
        simulationType: "muscle",
        abstractionTier: "micro_histological"
      },
      {
        id: "trex-pneumatic-camerae",
        name: "Pneumatic Foramina & Vertebral Camerae",
        latinTerm: "Foramina pneumatica et camerae vertebrales",
        system: "respiratory",
        categoryLabel: "Micro-Osteological Diverticula",
        color: "#a855f7",
        coords: { x: 435, y: 155, r: 15 },
        summary: "Microscopic cortical bone apertures through which respiratory air sacs invaded internal vertebral trabecular spaces.",
        physiologicalRole: "Excavated skeletal deadweight from cervical and dorsal vertebrae, lightening the axial skeleton by >35% while maintaining structural rigidity.",
        avianHomology: "Direct homologue to the pneumatic foramina found on cervical vertebrae of modern raptors and vultures.",
        fossilEvidence: "High-resolution micro-CT scans showing internal pneumatic camerae and camellae inside articulated T-Rex vertebrae.",
        keyMetrics: [
          { label: "Centrum Porosity", value: "58% Void Volume" },
          { label: "Cortical Wall", value: "1.8 - 2.4 mm Thickness" },
          { label: "Pneumatopore Diameter", value: "14 mm Aperture" }
        ],
        simulationType: "airflow",
        abstractionTier: "micro_histological"
      },
      {
        id: "trex-enamel-tubules",
        name: "Hunter-Schreger Enamel & Dentine Tubules",
        latinTerm: "Tubuli dentinales et fasciae hunter-schregeri",
        system: "digestive",
        categoryLabel: "Micro-Dental Biomechanics",
        color: "#c084fc",
        coords: { x: 535, y: 125, r: 14 },
        summary: "Complex wavy decussating enamel prisms (Hunter-Schreger bands) and microscopic fluid-filled dentine tubules.",
        physiologicalRole: "Arrests micro-crack propagation across tooth enamel when delivering 57,000 N of crushing force into ceratopsian bone.",
        avianHomology: "Retains ancestral archosaurian odontogenic microstructure prior to the evolution of the avian rhamphotheca (keratin beak).",
        fossilEvidence: "SEM electron microscopy showing pristine wavy enamel prisms and mineralized odontoblast processes in shed T-Rex tooth crowns.",
        keyMetrics: [
          { label: "Enamel Hardness", value: "390 Vickers (HV)" },
          { label: "Tubule Density", value: "48,000 / mm²" },
          { label: "Crack Arrest Angle", value: "45° Decussation" }
        ],
        simulationType: "digestion",
        abstractionTier: "micro_histological"
      }
    ]
  },

  "Triceratops": {
    taxaName: "Triceratops",
    clade: "Ornithischia • Ceratopsidae",
    posture: "Obligate Quadrupedal Herbivore",
    metabolismModel: "Mesothermy",
    estimatedBpm: 26,
    bodyMassKg: 9200,
    coreBodyTempC: 36.0,
    silhouettePath: "M 70,260 C 110,230 170,200 230,190 C 290,180 340,190 390,170 C 420,150 450,110 490,100 C 530,90 550,115 540,145 C 530,175 490,200 460,225 C 440,240 430,270 435,310 C 440,360 450,420 435,445 C 425,460 405,455 395,435 C 385,400 380,350 375,300 C 340,290 310,290 280,300 C 270,340 275,390 280,430 C 285,455 265,465 250,455 C 235,440 235,390 240,330 C 210,310 180,300 140,295 C 100,290 70,280 70,260 Z",
    systemSummaries: {
      cardiovascular: "High-volume, heavy-duty 4-chambered heart (~210 kg) pumping through low-resistance systemic vascular beds.",
      respiratory: "Large thoracic lung volume with strong costal rib-driven expansion (bellows system) optimized for steady endurance.",
      digestive: "Immense microbial hindgut/caecal fermentation vat processing fibrous cycads, palms, and woody conifers.",
      neurosensory: "Downward-tilted endocranium with sensory focus on ground forage and olfactory sniffing for poisonous foliage.",
      musculoskeletal: "Colossal cervical and scapular musculature supporting the 2.5-meter solid bone frill and dual 1-meter orbital horns."
    },
    evolutionaryNotes: "Ornithischian gut morphology with specialized retroverted pubis creating vast abdominal volume for fermentation.",
    organs: [
      {
        id: "tri-heart",
        name: "Heavy-Duty Ventricular Heart",
        latinTerm: "Cor ceratopsianum quadrichamber",
        system: "cardiovascular",
        categoryLabel: "High-Volume Graviportal Pump",
        color: "#ef4444",
        coords: { x: 380, y: 250, r: 24 },
        summary: "Broad 4-chambered heart maintaining continuous perfusion to massive quadruped limbs.",
        physiologicalRole: "Circulates blood through high-resistance muscular beds at 24-28 BPM with massive stroke volume.",
        avianHomology: "Divided ventricles prevent mixing of venous and arterial blood, standard across advanced archosaurs.",
        fossilEvidence: "Deep thoracic cavity bounded by robust, broad rib cages capable of housing a >200kg heart.",
        keyMetrics: [
          { label: "Heart Mass", value: "~210 kg" },
          { label: "Resting Rate", value: "24 - 28 BPM" },
          { label: "Cardiac Output", value: "240 L/min" }
        ],
        simulationType: "heartbeat"
      },
      {
        id: "tri-ferment-gut",
        name: "Massive Caecal Fermentation Vat",
        latinTerm: "Vesica fermentationis caecalis",
        system: "digestive",
        categoryLabel: "Microbial Cellulolytic Fermenter",
        color: "#f59e0b",
        coords: { x: 260, y: 240, r: 32 },
        summary: "Immense fermentation chamber hosting anaerobic bacteria that break down tough cellulose and lignin.",
        physiologicalRole: "Ferments tough Cretaceous flora (cycads, ginkgoes, conifers) over a multi-day retention period.",
        avianHomology: "Homologous to the paired caeca of herbivorous birds (like the hoatzin and grouse), but scaled to multi-ton proportions.",
        fossilEvidence: "Expanded pelvic canal with backward-projecting pubis creating huge abdominal visceral volume.",
        keyMetrics: [
          { label: "Gut Volume", value: "1,200+ Liters" },
          { label: "Fermentation Retention", value: "54 - 72 Hours" },
          { label: "Dietary Substrate", value: "Cycads, Palms, Conifers" }
        ],
        simulationType: "digestion"
      },
      {
        id: "tri-dental-batteries",
        name: "Dental Battery Masticator & Jaw Adductors",
        latinTerm: "Batteria dentalis ceratopsia",
        system: "musculoskeletal",
        categoryLabel: "Vertical Shearing Mechanism",
        color: "#10b981",
        coords: { x: 500, y: 155, r: 20 },
        summary: "Stack of hundreds of self-sharpening teeth powered by enormous adductor muscles anchored to the frill.",
        physiologicalRole: "Shears through fibrous, woody vegetation like a botanical guillotine prior to swallowing.",
        avianHomology: "Functional convergence with avian rhamphotheca and dental replacement.",
        fossilEvidence: "Polished enamel shearing facets on thousands of fossilized Triceratops replacement teeth.",
        keyMetrics: [
          { label: "Active Tooth Count", value: "Up to 800 Teeth" },
          { label: "Shearing Pressure", value: "24,000 N" }
        ],
        simulationType: "muscle"
      },
      {
        id: "tri-braincase",
        name: "Endocranium & Olfactory Complex",
        latinTerm: "Endocranium ceratopsianum",
        system: "neurosensory",
        categoryLabel: "Olfactory Ground-Browser",
        color: "#a855f7",
        coords: { x: 450, y: 140, r: 14 },
        summary: "Compact brain tilted downward at a 45° habitual angle.",
        physiologicalRole: "Specialized in detecting low-growing plant aromas and ground vibrations of approaching theropods.",
        avianHomology: "Typical archosaurian endocranial layout with enlarged olfactory lobes relative to cerebrum.",
        fossilEvidence: "Complete endocranial brain casts taken from solid Triceratops crania.",
        keyMetrics: [
          { label: "Brain Mass", value: "~170 grams" },
          { label: "Habitual Head Pitch", value: "-45° downward tilt" }
        ],
        simulationType: "neural",
        abstractionTier: "organismal_biomechanic"
      },
      {
        id: "tri-haversian-frill",
        name: "Frill Vascular Grooves & Osteoderm Sharpey Fibers",
        latinTerm: "Sulci vasculares squamosalis et fibrae sharpeyi",
        system: "musculoskeletal",
        categoryLabel: "Frill Bone Histology",
        color: "#8b5cf6",
        coords: { x: 440, y: 105, r: 18 },
        summary: "Branching sub-periosteal vascular sulci and dense Sharpey's collagen fiber anchors spanning the squamosal frill bone.",
        physiologicalRole: "Supported a vibrant keratin horn sheath, dissipated cranial heat, and anchored massive neck levator tendons.",
        avianHomology: "Directly mirrors the vascularized dermal bone underlying modern avian casque and bill sheaths (e.g. hornbills and cassowaries).",
        fossilEvidence: "Pristine dendritic vascular canals etched directly into the dorsal and ventral bone surface of adult Triceratops frills.",
        keyMetrics: [
          { label: "Sulcus Depth", value: "2.5 - 4.2 mm" },
          { label: "Bone Remodeling", value: "Parieto-Squamosal Lags" },
          { label: "Thermal Function", value: "Dermal Radiator" }
        ],
        simulationType: "muscle",
        abstractionTier: "micro_histological"
      },
      {
        id: "tri-enamel-schmelzmuster",
        name: "5-Tissue Dental Battery Histology & Schmelzmuster",
        latinTerm: "Histologia dentis ceratopsiae pentatissuealis",
        system: "digestive",
        categoryLabel: "Micro-Dental Biomechanics",
        color: "#c084fc",
        coords: { x: 515, y: 165, r: 15 },
        summary: "Ultra-complex 5-layer dental composite of mantle dentine, coronal cementum, orthodentine, and decussating enamel.",
        physiologicalRole: "Differential wear rates between the 5 micro-tissues created a self-sharpening guillotine blade to dice fibrous palms.",
        avianHomology: "More micro-structurally intricate than mammalian enamel or avian beaks, representing the apex of reptilian dental evolution.",
        fossilEvidence: "Micro-CT and nanoindentation studies demonstrating hardness variations matching industrial composite ceramics.",
        keyMetrics: [
          { label: "Tissue Count", value: "5 Distinct Micro-Layers" },
          { label: "Vickers Microhardness", value: "480 HV (Enamel)" },
          { label: "Replacement Rate", value: "Every 90 Days" }
        ],
        simulationType: "digestion",
        abstractionTier: "micro_histological"
      },
      {
        id: "tri-trabecular-spongiosa",
        name: "Graviportal Limb Trabecular Spongiosa",
        latinTerm: "Substantia spongiosa trabecularis graviportalis",
        system: "musculoskeletal",
        categoryLabel: "Load-Bearing Micro-Architecture",
        color: "#a855f7",
        coords: { x: 395, y: 380, r: 18 },
        summary: "Orientation-tuned cancellous bone trabeculae inside the humerus and femur resisting multi-ton compressive impacts.",
        physiologicalRole: "Absorbed ground reaction shocks during charge maneuvers and sustained 9.2 metric tons of gravitational mass.",
        avianHomology: "Shared archosaurian trabecular alignment along principal stress trajectories, similar to ratite limb bone architecture.",
        fossilEvidence: "High-resolution radiography of ceratopsian limb cross-sections displaying orthogonal trabecular lattices.",
        keyMetrics: [
          { label: "Strut Thickness", value: "280 - 450 μm" },
          { label: "Trabecular Porosity", value: "42% Volume" },
          { label: "Dynamic Load Limit", value: "115 kN Compressive" }
        ],
        simulationType: "muscle",
        abstractionTier: "micro_histological"
      }
    ]
  },

  "Velociraptor": {
    taxaName: "Velociraptor",
    clade: "Coelurosauria • Dromaeosauridae",
    posture: "Agile Feathered Theropod",
    metabolismModel: "Avian Endothermy",
    estimatedBpm: 120,
    bodyMassKg: 18,
    coreBodyTempC: 39.2,
    silhouettePath: "M 60,190 C 100,165 170,140 230,135 C 280,130 330,140 370,130 C 410,120 440,85 475,75 C 500,68 515,80 505,100 C 490,125 455,140 425,155 C 400,170 385,195 375,230 C 365,270 370,320 375,360 C 380,385 365,395 350,390 C 335,380 330,350 335,310 C 310,290 280,280 250,285 C 240,310 245,350 250,380 C 255,400 235,405 220,395 C 210,375 210,330 215,290 C 180,270 140,250 100,230 C 75,215 60,200 60,190 Z",
    systemSummaries: {
      cardiovascular: "High-frequency avian heart (~110-130 BPM) maintaining intense athletic aerobic activity for high-speed pursuit.",
      respiratory: "Complete 5-tier avian air sac system with ultra-light hollow bones and continuous counter-current gas exchange.",
      digestive: "High-efficiency, rapid-transit digestive tract with muscular proventriculus and crop.",
      neurosensory: "Remarkable Encephalization Quotient (EQ 5.8) with large stereoscopic optic lobes and hyper-sensitive inner ear vestibular canals.",
      musculoskeletal: "Hyper-specialized flexor digitorum muscles driving the iconic Digit II sickle claw strike mechanism."
    },
    evolutionaryNotes: "Possesses a furcula (wishbone), uncinate processes on ribs, and pennaceous feathers, placing it right on the avian threshold.",
    organs: [
      {
        id: "velo-heart",
        name: "Rapid-Cycle Avian Heart",
        latinTerm: "Cor dromaeosaurinum tachycardicum",
        system: "cardiovascular",
        categoryLabel: "High-Aerobic Avian Core",
        color: "#ef4444",
        coords: { x: 370, y: 175, r: 16 },
        summary: "Rapidly beating 4-chambered heart powering sustained aerobic chases across arid dune landscapes.",
        physiologicalRole: "Maintains intense tissue oxygenation during explosive agile hunting maneuvers.",
        avianHomology: "Nearly identical to modern birds of prey (falconiformes); cardiac mass is ~1.2% of body mass.",
        fossilEvidence: "Thoracic uncinate processes on dorsal ribs providing structural rigidity for rapid breathing.",
        keyMetrics: [
          { label: "Heart Rate", value: "110 - 135 BPM" },
          { label: "Heart Mass", value: "220 grams" },
          { label: "Metabolic Output", value: "Tachyaerobic" }
        ],
        simulationType: "heartbeat"
      },
      {
        id: "velo-optic-brain",
        name: "High-EQ Cerebrum & Optic Tectum",
        latinTerm: "Cerebrum stereoscopicum dromaeosaurianum",
        system: "neurosensory",
        categoryLabel: "Predatory Intelligence Core",
        color: "#a855f7",
        coords: { x: 485, y: 85, r: 14 },
        summary: "Exceptionally large brain featuring forward-facing eyes with binocular visual depth.",
        physiologicalRole: "Calculates complex 3D ambush intercept paths and coordinates pack communication signals.",
        avianHomology: "Encephalization Quotient of 5.8, matching modern crows and parrots.",
        fossilEvidence: "Pristine skull endocasts from the Djadochta Formation of Mongolia showing large cerebellar floccular lobes.",
        keyMetrics: [
          { label: "EQ Score", value: "5.8 (Highest non-avian)" },
          { label: "Binocular Vision", value: "60° Stereo Arch" }
        ],
        simulationType: "neural"
      },
      {
        id: "velo-sickle-flexor",
        name: "Digit II Hyper-Extensor Muscular Complex",
        latinTerm: "M. flexor hallucis & ungualis",
        system: "musculoskeletal",
        categoryLabel: "Hydraulic Striking Weapon",
        color: "#10b981",
        coords: { x: 360, y: 380, r: 16 },
        summary: "Specialized deep flexor tendons powering the rapid downward strike of the 8cm sickle killing claw.",
        physiologicalRole: "Punctures jugular veins or pins struggling protoceratopsid prey to the sand while feeding.",
        avianHomology: "Homologous to the raptorial talon-flexor mechanism of modern eagles and owls (accipitridae).",
        fossilEvidence: "Hypertrophied flexor tubercles on the second ungual phalanx seen in the iconic 'Fighting Dinosaurs' fossil.",
        keyMetrics: [
          { label: "Striking Velocity", value: "12.4 m/s" },
          { label: "Grip Retention", value: "Raptorial Clamping" }
        ],
        simulationType: "muscle",
        abstractionTier: "organismal_biomechanic"
      },
      {
        id: "velo-pneumatic-foramina",
        name: "Furcular & Vertebral Pneumatopores",
        latinTerm: "Foramina pneumatica furculae et vertebrarum",
        system: "respiratory",
        categoryLabel: "Micro-Osteological Diverticula",
        color: "#a855f7",
        coords: { x: 400, y: 125, r: 14 },
        summary: "Microscopic cortical bone apertures through which diverticula hollowed out the vertebrae, wishbone, and ilium.",
        physiologicalRole: "Reduced skeletal body mass to a featherlight 18 kg without sacrificing structural leaping rigidity.",
        avianHomology: "Identical to the ultra-thin pneumatic bone walls of peregrine falcons and red-tailed hawks.",
        fossilEvidence: "Micro-CT scans of Mongolian dromaeosaurid vertebrae displaying camellate internal hollows and millimeter-scale pore openings.",
        keyMetrics: [
          { label: "Cortical Wall", value: "0.8 - 1.2 mm" },
          { label: "Skeletal Lightening", value: "40% Mass Reduction" },
          { label: "Avian Convergence", value: "Direct Homology" }
        ],
        simulationType: "airflow",
        abstractionTier: "micro_histological"
      },
      {
        id: "velo-sclerotic-ring",
        name: "Ossified Sclerotic Ring Plate Histology",
        latinTerm: "Anulus scleroticus ossificatus",
        system: "neurosensory",
        categoryLabel: "Ocular Micro-Skeletal Ring",
        color: "#8b5cf6",
        coords: { x: 495, y: 78, r: 12 },
        summary: "Delicate overlapping ossified bone plates encircling the eyeball and anchoring accommodation muscles.",
        physiologicalRole: "Prevented globe distortion under aerodynamic wind drag during high-speed leaps and calibrated pupil geometry for nocturnal hunting.",
        avianHomology: "Direct architectural homologue of the sclerotic ring of modern owls and raptors.",
        fossilEvidence: "Complete intact sclerotic rings preserved in pristine articulated Velociraptor skulls from Tugriken Shireh.",
        keyMetrics: [
          { label: "Plate Count", value: "14 Overlapping Ossicles" },
          { label: "Aperture Ratio", value: "Cathemeral / Nocturnal" },
          { label: "Eye Diameter", value: "28 mm" }
        ],
        simulationType: "neural",
        abstractionTier: "micro_histological"
      },
      {
        id: "velo-osteocyte-lacunae",
        name: "Fast-Growth Fibrolamellar Osteocyte Lacunae",
        latinTerm: "Lacunae osteocyticae fibrolamellariae",
        system: "musculoskeletal",
        categoryLabel: "Cellular Bone Matrix",
        color: "#c084fc",
        coords: { x: 335, y: 340, r: 14 },
        summary: "Ultra-dense networks of microscopic cell spaces (osteocytes) and canaliculi embedded in woven-parallel bone.",
        physiologicalRole: "Enabled rapid juvenile growth rates matching modern precocial birds, allowing full maturity in under 2 years.",
        avianHomology: "High osteocyte density and circular vascular canal organization characteristic of avian endotherms.",
        fossilEvidence: "Petrographic thin-sections of Velociraptor tibiotarsi exhibiting uninterrupted vascular canals devoid of ectothermic resting lines.",
        keyMetrics: [
          { label: "Osteocyte Density", value: "62,000 / mm³" },
          { label: "Vascular Canal Pattern", value: "Plexiform / Longitudinal" },
          { label: "Metabolic Status", value: "Avian-Grade Endotherm" }
        ],
        simulationType: "muscle",
        abstractionTier: "micro_histological"
      }
    ]
  },

  "Spinosaurus": {
    taxaName: "Spinosaurus",
    clade: "Megalosauroidea • Spinosauridae",
    posture: "Semiaquatic Megatheropod",
    metabolismModel: "Gigantothermy",
    estimatedBpm: 30,
    bodyMassKg: 14000,
    coreBodyTempC: 36.8,
    silhouettePath: "M 60,240 C 100,210 160,190 220,180 C 250,130 290,70 340,55 C 390,45 420,95 440,165 C 480,160 520,140 560,130 C 580,125 590,140 580,160 C 560,190 510,210 470,225 C 440,245 420,285 420,340 C 420,390 430,440 415,465 C 400,480 380,470 375,440 C 370,400 370,350 365,300 C 330,290 290,290 260,300 C 250,340 255,395 260,435 C 265,460 245,470 230,460 C 220,440 220,390 225,330 C 190,310 140,300 100,285 C 70,270 60,255 60,240 Z",
    systemSummaries: {
      cardiovascular: "Dense capillary bed network throughout the 1.8m neural spine sail acting as a solar thermoregulator and heat radiator.",
      respiratory: "Dorsally positioned lungs and internal narial pathways allowing breathing while submerged in river delta waters.",
      digestive: "Elongated, acid-rich piscivorous digestive tract adapted to dissolve giant armored coelacanth and sawfish scales.",
      neurosensory: "Snout neurovascular foramina connected to trigeminal nerves detecting hydrodynamic pressure waves of swimming fish.",
      musculoskeletal: "Osteosclerotic (bone-ballast) skeleton and high-aspect fin-tail musculature adapted for submerged aquatic propulsion."
    },
    evolutionaryNotes: "Extreme semiaquatic specialization: dense pachyostotic bones for buoyancy control and fin-like caudal vertebrae.",
    organs: [
      {
        id: "spino-sail-vascular",
        name: "Arteriovenous Thermal Sail Network",
        latinTerm: "Plexus vascularis dorsalis spinosus",
        system: "cardiovascular",
        categoryLabel: "Thermoregulatory Heat Exchanger",
        color: "#ef4444",
        coords: { x: 340, y: 95, r: 28 },
        summary: "Extensive network of capillary channels and arterioles embedded across the 1.8-meter neural spine sail.",
        physiologicalRole: "Rapidly absorbs morning solar heat from the North African sun and dumps excess metabolic heat during strenuous swimming.",
        avianHomology: "Analogous to vascularized bill flushing in toucans and ostrich skin flushing for temperature control.",
        fossilEvidence: "Deep longitudinal vascular grooves and nutritive foramina scored into the cortical bone of neural spines.",
        keyMetrics: [
          { label: "Sail Surface Area", value: "5.8 m²" },
          { label: "Thermal Regulation Rate", value: "+2.8°C / 30 min" }
        ],
        simulationType: "heartbeat"
      },
      {
        id: "spino-rostral-sensors",
        name: "Neurovascular Rostral Pressure Pits",
        latinTerm: "Foramina neurovascularia rostralia",
        system: "neurosensory",
        categoryLabel: "Submerged Hydrodynamic Sensor",
        color: "#a855f7",
        coords: { x: 570, y: 140, r: 16 },
        summary: "Dense network of nerve canals passing through the premaxilla to detect water movements.",
        physiologicalRole: "Detects the pressure wake and acoustic vibrations of giant fish (Onchopristis and Mawsonia) in murky river systems.",
        avianHomology: "Homologous to the bill-tip sensory organ in kiwi and wading shorebirds; analogous to crocodilian integumentary sensory organs (ISOs).",
        fossilEvidence: "CT scanning of Moroccan Spinosaurus rostra reveals extensive internal trigeminal nerve branching channels.",
        keyMetrics: [
          { label: "Sensory Pit Count", value: "85+ per quadrant" },
          { label: "Vibration Threshold", value: "Sub-hertz sensitive" }
        ],
        simulationType: "neural",
        abstractionTier: "organismal_biomechanic"
      },
      {
        id: "spino-piscivore-heart",
        name: "Hyper-Endurance Semiaquatic Heart",
        latinTerm: "Cor spinosaurinum hydrodynamica",
        system: "cardiovascular",
        categoryLabel: "Aquatic Hemodynamic Engine",
        color: "#dc2626",
        coords: { x: 375, y: 245, r: 24 },
        summary: "Robust 4-chambered pump with high stroke volume supporting prolonged delta breath-hold dives.",
        physiologicalRole: "Maintains visceral perfusion during submergence and channels heated blood from the dorsal sail.",
        avianHomology: "Shared archosaurian double-circuit with diving avians like penguins and loons.",
        fossilEvidence: "Calculated metabolic and circulatory demands from gigantic body mass and oxygen-isotope aquatic ratios.",
        keyMetrics: [
          { label: "Stroke Volume", value: "22 Liters" },
          { label: "Submergence Cadence", value: "18 BPM in Dive" }
        ],
        simulationType: "heartbeat",
        abstractionTier: "systemic_physiological"
      },
      {
        id: "spino-osteosclerosis",
        name: "Pachyostotic Bone-Ballast Histology",
        latinTerm: "Histologia pachyosteosclerotica spinosaurina",
        system: "musculoskeletal",
        categoryLabel: "Dive-Ballast Micro-Histology",
        color: "#8b5cf6",
        coords: { x: 265, y: 380, r: 18 },
        summary: "Extremely dense, thickened cortical bone with completely occluded medullary (marrow) cavities.",
        physiologicalRole: "Acted as internal scuba dive ballast, reducing positive buoyancy so Spinosaurus could cruise underwater effortlessly.",
        avianHomology: "Identical bone pachyosteosclerosis observed in diving penguins, sea cows (sirenia), and early cetaceans.",
        fossilEvidence: "Femoral and rib cross-sections from Kem Kem beds demonstrating compact bone matrix with >90% density.",
        keyMetrics: [
          { label: "Cortical Density", value: "92% Solid Matrix" },
          { label: "Medullary Cavity", value: "Fully Occluded" },
          { label: "Hydrostatic Ballast", value: "+380 kg Negative Lift" }
        ],
        simulationType: "muscle",
        abstractionTier: "micro_histological"
      },
      {
        id: "spino-sail-foramina",
        name: "Neural Spine Micro-Vascular Foramina",
        latinTerm: "Foramina nutricia vertebrarum dorsalium",
        system: "cardiovascular",
        categoryLabel: "Micro-Osteological Perfusion",
        color: "#a855f7",
        coords: { x: 340, y: 55, r: 16 },
        summary: "Microscopic nutrient foramina penetrating the cortical walls of the 1.8-meter neural spines.",
        physiologicalRole: "Supplied continuous arterial blood to the periosteum and skin layer of the sail for dynamic thermoregulation.",
        avianHomology: "Vascular bone conduits homologous to the osteological nutrient canals supplying the avian rhamphotheca.",
        fossilEvidence: "High-magnification SEM analysis revealing regular micro-foramina spaced every 4-6 mm along the spine ridges.",
        keyMetrics: [
          { label: "Foramen Diameter", value: "1.2 - 2.8 mm" },
          { label: "Micro-Canal Count", value: "Over 350 per Spine" },
          { label: "Perfusion Index", value: "High-Flow Capillary" }
        ],
        simulationType: "heartbeat",
        abstractionTier: "micro_histological"
      }
    ]
  },

  "Stegosaurus": {
    taxaName: "Stegosaurus",
    clade: "Thyreophora • Stegosauria",
    posture: "Armored Quadrupedal Thyreophoran",
    metabolismModel: "Poikilothermy",
    estimatedBpm: 24,
    bodyMassKg: 5000,
    coreBodyTempC: 34.5,
    silhouettePath: "M 60,270 C 100,240 160,210 220,190 C 260,150 300,120 350,120 C 400,120 440,150 470,190 C 510,195 540,210 560,235 C 570,250 560,265 540,265 C 510,265 480,260 455,270 C 440,285 430,330 435,380 C 440,430 450,470 435,490 C 420,505 400,495 390,470 C 380,430 380,380 375,330 C 340,320 300,320 270,330 C 260,370 265,420 270,460 C 275,485 255,495 240,485 C 230,465 230,415 235,355 C 190,335 140,325 100,310 C 70,295 60,280 60,270 Z",
    systemSummaries: {
      cardiovascular: "Broad slow-pulse heart driving systemic flow to dermal vascularized osteoderm plates for thermoregulation.",
      respiratory: "Costal rib aspiration driving robust mid-sized lungs in a low-metabolic body frame.",
      digestive: "Immense microbial gut fermentation vat adapted to digest low-nutrient Jurassic ferns and horsetails.",
      neurosensory: "Diminutive 80-gram walnut-sized brain paired with an expanded sacral neural plexus for hindlimb and tail reflexes.",
      musculoskeletal: "Heavy caudal flexor and abductor muscles providing lethal swinging momentum to the 4-spiked thagomizer."
    },
    evolutionaryNotes: "The famous 'second brain' in the sacrum was not a brain, but an expanded neural canal housing a glycogen body (as in birds) or reflex coordination center.",
    organs: [
      {
        id: "stego-sacral-plexus",
        name: "Expanded Sacral Neural Plexus ('Second Brain')",
        latinTerm: "Plexus lumbosacralis et corpus glycogeni",
        system: "neurosensory",
        categoryLabel: "Caudal Reflex & Glycogen Core",
        color: "#a855f7",
        coords: { x: 230, y: 310, r: 20 },
        summary: "Greatly enlarged spinal cavity in the sacrum, over 20x the volume of the braincase.",
        physiologicalRole: "Coordinates autonomic hindlimb locomotion and violent reflexive strikes with the heavy spiked tail.",
        avianHomology: "Homologous to the avian lumbo-sacral sinus containing the glycogen body (energy buffer and equilibrium organ).",
        fossilEvidence: "Massive sacral neural canal preserved in all articulated Stegosaurus fossil skeletons.",
        keyMetrics: [
          { label: "Plexus Volume", value: "Over 1,200 cm³" },
          { label: "Caudal Reflex Speed", value: "45 ms response" }
        ],
        simulationType: "neural"
      },
      {
        id: "stego-thagomizer-muscles",
        name: "Thagomizer Caudal Strike Musculature",
        latinTerm: "M. transversospinalis & iliocaudalis",
        system: "musculoskeletal",
        categoryLabel: "Defensive Weapon Motor",
        color: "#10b981",
        coords: { x: 100, y: 265, r: 22 },
        summary: "Interconnected muscular bands anchoring to 45 caudal vertebrae to swing the 4 spikes.",
        physiologicalRole: "Delivers bone-shattering impacts into the flanks or legs of attacking predators like Allosaurus.",
        avianHomology: "Ancestral archosaurian tail musculature retaining extreme flexibility.",
        fossilEvidence: "Allosaurus pubic bone specimen recovered with a punctured hole matching the exact diameter of a Stegosaurus thagomizer spike.",
        keyMetrics: [
          { label: "Spike Length", value: "0.9 Meters each" },
          { label: "Impact Kinetic Energy", value: "Over 5,000 Joules" }
        ],
        simulationType: "muscle",
        abstractionTier: "organismal_biomechanic"
      },
      {
        id: "stego-plate-vascular",
        name: "Dermal Plate Vasculature & Sharpey's Collagen Fibers",
        latinTerm: "Vasa osteodermalia et fibrae collagenae",
        system: "musculoskeletal",
        categoryLabel: "Osteoderm Plate Histology",
        color: "#8b5cf6",
        coords: { x: 350, y: 130, r: 20 },
        summary: "Dense network of superficial vascular channels and deeply anchored Sharpey's fibers securing plates to the back fascia.",
        physiologicalRole: "Anchored loose dermal plates without bony articulation to the vertebrae, allowing slight muscular pivoting and vascular heat dissipation.",
        avianHomology: "Dermal bone vascularization comparable to crocodilian scutes and bird beaks.",
        fossilEvidence: "Histological plate cross-sections showing spongy cancellous bone cores flanked by dense cortical vascular grooves.",
        keyMetrics: [
          { label: "Core Porosity", value: "65% Spongy Bone" },
          { label: "Vascular Channel Width", value: "1.4 - 3.2 mm" },
          { label: "Biomechanical Role", value: "Elastic Anchor" }
        ],
        simulationType: "muscle",
        abstractionTier: "micro_histological"
      },
      {
        id: "stego-spike-trabeculae",
        name: "Thagomizer Spike Cortical Reinforcement Layer",
        latinTerm: "Stratum corticale spinae caudalis",
        system: "musculoskeletal",
        categoryLabel: "Impact Weapon Micro-Structure",
        color: "#a855f7",
        coords: { x: 80, y: 260, r: 16 },
        summary: "Extremely dense, thickened laminar outer cortex enveloping a cancellous internal core inside each 90cm tail spike.",
        physiologicalRole: "Dissipated massive impact shockwaves when penetrating predator bone, preventing the spike from fracturing at its base.",
        avianHomology: "Micro-structure functionally converging on horned ungulate horn cores and predatory raptor talons.",
        fossilEvidence: "CT scans of Morrison Formation thagomizer specimens showing concentric laminar thickening at the impact tip.",
        keyMetrics: [
          { label: "Cortical Thickness", value: "18 - 25 mm" },
          { label: "Fracture Toughness", value: "4.8 MPa·m^0.5" },
          { label: "Impact Energy Tolerance", value: "7,200 Joules" }
        ],
        simulationType: "muscle",
        abstractionTier: "micro_histological"
      }
    ]
  },

  "Brachiosaurus": {
    taxaName: "Brachiosaurus",
    clade: "Sauropodomorpha • Titanosauriformes",
    posture: "Macronarian High-Browsing Sauropod",
    metabolismModel: "Gigantothermy",
    estimatedBpm: 18,
    bodyMassKg: 38000,
    coreBodyTempC: 38.0,
    silhouettePath: "M 60,320 C 110,300 170,270 230,250 C 260,200 280,130 310,60 C 320,35 340,30 350,45 C 360,70 350,150 360,230 C 410,240 450,260 480,280 C 500,295 490,320 470,330 C 440,340 420,380 425,430 C 430,480 440,520 425,540 C 410,555 390,545 380,520 C 370,480 375,430 370,380 C 340,370 300,370 270,380 C 260,420 265,470 270,510 C 275,535 255,545 240,535 C 230,515 230,465 235,405 C 190,385 140,375 100,360 C 70,345 60,330 60,320 Z",
    systemSummaries: {
      cardiovascular: "Colossal high-pressure heart (~350 kg) generating systolic pressure over 280 mmHg to pump blood 12m vertically.",
      respiratory: "Extensive cervical air sacs hollowing out neck vertebrae like honeycomb, reducing neck weight by over 65%.",
      digestive: "Gigantic 35-meter digestive transit tract featuring a 50+ kg gastrolith gizzard mill grinding conifer foliage without chewing.",
      neurosensory: "Elevated sensory platform with high dorsal nares and immense spinal conduction velocity.",
      musculoskeletal: "Towering columnar forelimbs longer than hindlimbs, suspended by massive elastic ligamentum nuchae cables."
    },
    evolutionaryNotes: "Pneumatic camellate vertebra structure reduces neck weight while permitting high browsing in the Jurassic canopy.",
    organs: [
      {
        id: "brachio-titan-heart",
        name: "Titan Hyper-Pressure Heart",
        latinTerm: "Cor megamassivum brachiosaurianum",
        system: "cardiovascular",
        categoryLabel: "Gravitational Super-Pump",
        color: "#ef4444",
        coords: { x: 380, y: 300, r: 30 },
        summary: "Mammoth 400-kilogram muscular heart with ventricular walls over 10 cm thick.",
        physiologicalRole: "Pumps blood against 12 meters of gravitational head pressure to reach the brain.",
        avianHomology: "Complete interventricular septum and high relative blood pressure typical of archosaurian endotherms.",
        fossilEvidence: "Calculated hydrostatic column requirements based on mounted skeleton measurements (FMNH & MNHN).",
        keyMetrics: [
          { label: "Heart Mass", value: "~380 - 420 kg" },
          { label: "Systolic Pressure", value: "> 280 mmHg (Highest in Vertebrata)" },
          { label: "Hydrostatic Column", value: "12.0 Meters Vertical Lift" }
        ],
        simulationType: "heartbeat"
      },
      {
        id: "brachio-cervical-sacs",
        name: "Cervical Pneumatic Diverticula System",
        latinTerm: "Systema pneumaticum cervicale camellatum",
        system: "respiratory",
        categoryLabel: "Honeycomb Bone-Lightening Air Sacs",
        color: "#06b6d4",
        coords: { x: 330, y: 150, r: 24 },
        summary: "Extensive air sacs running the length of the 9-meter neck, hollowing out the vertebrae into thin struts.",
        physiologicalRole: "Lightens the neck by 65% while providing continuous unidirectional oxygen flow during breathing.",
        avianHomology: "Identical internal camellate bone structure found in pelicans, vultures, and geese.",
        fossilEvidence: "Internal bone cross-sections and CT scans showing paper-thin bone walls with pneumatic air spaces.",
        keyMetrics: [
          { label: "Weight Reduction", value: "65% Skeletal Mass" },
          { label: "Neck Length", value: "9.2 Meters" }
        ],
        simulationType: "airflow"
      },
      {
        id: "brachio-gastrolith-mill",
        name: "50kg Gastrolith Gizzard Mill",
        latinTerm: "Mola gastrolithica sauropoda",
        system: "digestive",
        categoryLabel: "Industrial Botanical Pulverizer",
        color: "#f59e0b",
        coords: { x: 310, y: 340, r: 28 },
        summary: "Chamber holding dozens of smooth, swallowed river stones that grind conifer needles into digestible pulp.",
        physiologicalRole: "Sauropods could not chew; all mechanical breakdown occurred internally within the gastrolith mill.",
        avianHomology: "Identical to the avian grit/stone gizzard of ostriches and turkeys.",
        fossilEvidence: "Piles of highly polished exotics stones found clustered within the rib cages of sauropod skeletons.",
        keyMetrics: [
          { label: "Gastrolith Weight", value: "45 - 60 kg" },
          { label: "Daily Foliage Intake", value: "Over 400 kg Conifer needles" }
        ],
        simulationType: "digestion",
        abstractionTier: "systemic_physiological"
      },
      {
        id: "brachio-columnar-triceps",
        name: "Forelimb Graviportal Columnar Musculature",
        latinTerm: "M. triceps brachii sauropodae",
        system: "musculoskeletal",
        categoryLabel: "Gravitational Support Engine",
        color: "#10b981",
        coords: { x: 420, y: 410, r: 26 },
        summary: "Massive vertical muscular columns anchoring the 2.1m humerus and supporting 60% of the animal's 38-ton body weight.",
        physiologicalRole: "Held the towering thoracic posture with minimal active metabolic energy via locked pillar-like bone orientation.",
        avianHomology: "Ancestral archosaurian forelimb architecture modified into graviportal weight-bearing pillars.",
        fossilEvidence: "Immense olecranon process and hypertrophied muscle insertion ridges across the humerus and ulna.",
        keyMetrics: [
          { label: "Static Pillar Load", value: "11.4 Tons per Forelimb" },
          { label: "Limb Length", value: "3.2 Meters (Forelimb)" }
        ],
        simulationType: "muscle",
        abstractionTier: "organismal_biomechanic"
      },
      {
        id: "brachio-camellate-bone",
        name: "Pneumatic Camellate Micro-Honeycomb Struts",
        latinTerm: "Trabeculae camellatae ossis pneumatici",
        system: "respiratory",
        categoryLabel: "Bone-Pneumatic Architecture",
        color: "#8b5cf6",
        coords: { x: 325, y: 110, r: 20 },
        summary: "Paper-thin 1-2mm internal bony struts creating a micro-honeycomb matrix inside the 9-meter neck vertebrae.",
        physiologicalRole: "Lightened the colossal neck skeleton by >65% without compromising resistance to buckling and bending torques.",
        avianHomology: "Direct architectural precursor to the internal camellate pneumatic bone microstructure of modern vultures and cranes.",
        fossilEvidence: "Micro-CT scans and broken vertebra cross-sections exhibiting thin internal bony camerae and septa.",
        keyMetrics: [
          { label: "Wall Thickness", value: "1.2 - 1.8 mm" },
          { label: "Internal Void Ratio", value: "72% Air Space" },
          { label: "Weight Reduction", value: "1.4 Metric Tons Saved" }
        ],
        simulationType: "airflow",
        abstractionTier: "micro_histological"
      },
      {
        id: "brachio-fibrolamellar-lags",
        name: "Cyclical Lines of Arrested Growth (LAGs)",
        latinTerm: "Lineae incrementi arrestatae sauropodae",
        system: "musculoskeletal",
        categoryLabel: "Ontogenetic Sclerochronology",
        color: "#a855f7",
        coords: { x: 390, y: 465, r: 22 },
        summary: "Microscopic annual growth rings in the femur shaft recording astronomical adolescent growth rates up to 2 tons/year.",
        physiologicalRole: "Records how Brachiosaurus reached reproductive maturity at age 20-25 years despite starting as a 5 kg hatchling.",
        avianHomology: "Exhibits uninterrupted laminar fibrolamellar bone similar to fast-growing birds, punctuated by annual environmental LAGs.",
        fossilEvidence: "Petrographic histology cores from Morrison Formation sauropod femora displaying complete ontogenetic ring series.",
        keyMetrics: [
          { label: "Annual Mass Accretion", value: "Up to 2,000 kg / year" },
          { label: "Estimated Longevity", value: "75 - 100 Years" },
          { label: "Bone Type", value: "Fibrolamellar Complex" }
        ],
        simulationType: "muscle",
        abstractionTier: "micro_histological"
      }
    ]
  }
};

/**
 * Generates calibrated cross-domain interrelations and telemetry based on organ type and dinosaur taxon.
 */
function enrichOrganWithInterrelations(organ: Partial<OrganDetail>, taxaName: string, bpm: number, massKg: number): OrganDetail {
  const norm = taxaName.toLowerCase();
  const system = organ.system || 'cardiovascular';
  
  // Abstraction Tier classification
  let abstractionTier: AbstractionTier = organ.abstractionTier || 'systemic_physiological';
  if (!organ.abstractionTier) {
    if (
      organ.id?.includes('haversian') ||
      organ.id?.includes('osteon') ||
      organ.id?.includes('tubule') ||
      organ.id?.includes('foramina') ||
      organ.id?.includes('camera') ||
      organ.id?.includes('sclerotic') ||
      organ.id?.includes('spongiosa') ||
      organ.id?.includes('osteosclerosis') ||
      organ.id?.includes('lacunae') ||
      organ.id?.includes('micro') ||
      organ.id?.includes('denticle') ||
      organ.id?.includes('lags') ||
      (organ.fossilEvidence && organ.fossilEvidence.toLowerCase().includes('histolog')) ||
      (organ.categoryLabel && organ.categoryLabel.toLowerCase().includes('histolog'))
    ) {
      abstractionTier = 'micro_histological';
    } else if (system === 'musculoskeletal' || system === 'neurosensory') {
      abstractionTier = 'organismal_biomechanic';
    } else {
      abstractionTier = 'systemic_physiological';
    }
  }

  // Cross-Domain Interrelations
  const interrelations: CrossDomainInterrelation[] = [];
  let skeletalCorrelate = organ.skeletalCorrelate || { boneName: "Axial Column", feature: "Neurocentral articular synchondrosis" };
  let waveformData = organ.waveformData;

  if (abstractionTier === 'micro_histological') {
    skeletalCorrelate = organ.skeletalCorrelate || { 
      boneName: "Cortical Bone & Taphonomic Matrix", 
      feature: "Haversian canalicular system & mineralized osteocyte lacunae" 
    };

    interrelations.push({
      targetDomain: 'inventory',
      domainLabel: 'Fossil Stratum & Taphonomy',
      relationshipTitle: 'Thin-Section Petrographic Micro-Structure',
      relationshipDescription: 'Microscopic cellular lacunae and vascular canal networks preserved via authigenic permineralization in sedimentary strata.',
      feedbackType: 'taphonomic_signature',
      telemetryMetric: { label: "Mineral Replacement", value: "Silicified / Apatite" }
    });

    interrelations.push({
      targetDomain: 'lifecycle',
      domainLabel: 'Ontogeny & Life Cycle',
      relationshipTitle: 'Lines of Arrested Growth (LAGs) Sclerochronology',
      relationshipDescription: 'Cyclical annual pauses in periosteal bone deposition record physiological age, juvenile growth spurts, and environmental seasonality.',
      feedbackType: 'developmental_progression',
      telemetryMetric: { label: "Growth Annuli", value: "Ontogenetic Ring Series" }
    });

    interrelations.push({
      targetDomain: 'locomotion',
      domainLabel: 'Locomotor Kinematics',
      relationshipTitle: 'Micro-Architectural Strain Adaptation',
      relationshipDescription: 'Secondary Haversian remodeling density aligns with the principal stress trajectories produced by ground reaction loads during locomotion.',
      feedbackType: 'biomechanical_leverage',
      telemetryMetric: { label: "Remodeling Flux", value: "Stress-Aligned" }
    });

    waveformData = waveformData || {
      waveformType: 'neural_spike',
      primaryLabel: 'Micro-CT Petrographic Density',
      baselineVal: 25,
      peakVal: 85,
      unit: 'HU x10',
      description: 'Densitometric profile across cortical osteons, vascular canal lumens, and mineralized bone matrix.'
    };
  } else if (system === 'cardiovascular') {
    abstractionTier = 'systemic_physiological';
    skeletalCorrelate = { boneName: "Thoracic Rib Cage & Sternum", feature: "Coracoid & sternal rib cardiac impression" };
    
    interrelations.push({
      targetDomain: 'locomotion',
      domainLabel: 'Locomotor Kinematics',
      relationshipTitle: 'Aerobic Cardiac Output for Muscular Thrust',
      relationshipDescription: `A sustained stroke volume driven by ${bpm} BPM supplies arterial oxygen to the pelvic retractors, directly enabling top sprint velocity and sustaining ground reaction force without lactic exhaustion.`,
      feedbackType: 'metabolic_coupling',
      telemetryMetric: { label: "Cardiac Index", value: `${(massKg / 1000 * 2.8).toFixed(1)} L/min` }
    });

    interrelations.push({
      targetDomain: 'climate',
      domainLabel: 'Paleoclimate Matrix',
      relationshipTitle: 'Subtropical Thermal Equilibrium',
      relationshipDescription: `Massive body mass (${(massKg / 1000).toFixed(1)} tons) combined with high-flow systemic circulation buffered against ambient diurnal temperature swings across Mesozoic floodplains.`,
      feedbackType: 'climatic_adaptation',
      telemetryMetric: { label: "Thermal Capacity", value: "3.4 kJ/kg/°C" }
    });

    interrelations.push({
      targetDomain: 'metrics',
      domainLabel: 'Vital Metrics',
      relationshipTitle: 'Systolic Arterial Column Pressure',
      relationshipDescription: `Hydrostatic pressure must overcome vertical heart-to-brain head height to maintain cranial blood perfusion during upright vigilance.`,
      feedbackType: 'biomechanical_leverage',
      telemetryMetric: { label: "Systolic Pressure", value: massKg > 20000 ? "480 mmHg" : "195 mmHg" }
    });

    waveformData = waveformData || {
      waveformType: 'cardiac_ecg',
      primaryLabel: 'Arterial Pressure Pulse',
      baselineVal: 80,
      peakVal: massKg > 20000 ? 480 : 195,
      unit: 'mmHg',
      description: `Rhythmic ventricular contraction cycle calibrated to ${bpm} resting BPM.`
    };
  } else if (system === 'respiratory') {
    abstractionTier = 'systemic_physiological';
    skeletalCorrelate = { boneName: "Cervical & Dorsal Vertebrae", feature: "Pneumatic pleurocoels & camerae" };

    interrelations.push({
      targetDomain: 'climate',
      domainLabel: 'Paleoclimate Matrix',
      relationshipTitle: 'Atmospheric O₂ Hyper-Extraction',
      relationshipDescription: 'Continuous unidirectional flow through rigid parabronchial capillaries extracts up to 25% more oxygen per breath than mammalian tidal lungs, thriving in Mesozoic atmospheric regimes.',
      feedbackType: 'climatic_adaptation',
      telemetryMetric: { label: "Gas Exchange Ratio", value: "0.88 RQ" }
    });

    interrelations.push({
      targetDomain: 'inventory',
      domainLabel: 'Fossil Stratum',
      relationshipTitle: 'Taphonomic Skeletal Pneumatization',
      relationshipDescription: 'Diverticula from the respiratory air sacs hollowed out the interior of vertebral centra, leaving distinctive pneumatic pleurocoels observable in excavated fossils.',
      feedbackType: 'taphonomic_signature',
      telemetryMetric: { label: "Bone Mass Reduction", value: "35% - 42%" }
    });

    interrelations.push({
      targetDomain: 'lifecycle',
      domainLabel: 'Ontogeny & Life Cycle',
      relationshipTitle: 'Pneumatic Weight Lightening for Rapid Growth',
      relationshipDescription: 'Internal bone hollows reduced axial deadweight, allowing rapid juvenile mass escalation without structural collapse of the vertebral column.',
      feedbackType: 'developmental_progression',
      telemetryMetric: { label: "Structural Efficiency", value: "2.8x Solid Bone" }
    });

    waveformData = waveformData || {
      waveformType: 'air_cycle',
      primaryLabel: '2-Cycle Unidirectional Tidal Flow',
      baselineVal: 0,
      peakVal: Math.round(massKg * 0.04),
      unit: 'Liters/cycle',
      description: 'Continuous non-mixing pulmonary gas exchange across anterior and posterior bellows.'
    };
  } else if (system === 'digestive') {
    abstractionTier = 'systemic_physiological';
    skeletalCorrelate = { boneName: "Gastralia & Pubic Boot", feature: "Ventral abdominal viscera support cradle" };

    interrelations.push({
      targetDomain: 'inventory',
      domainLabel: 'Fossil Stratum',
      relationshipTitle: 'Gastrolith Clustered Stones & Coprolites',
      relationshipDescription: 'Swallowed chert stones preserved within the fossilized abdominal cavity confirm mechanical grinding of fibrous conifers or bone shards.',
      feedbackType: 'taphonomic_signature',
      telemetryMetric: { label: "Stone Hardness", value: "7.0 Mohs (Quartzite)" }
    });

    interrelations.push({
      targetDomain: 'lifecycle',
      domainLabel: 'Ontogeny & Life Cycle',
      relationshipTitle: 'Dietary Ontogenetic Shift',
      relationshipDescription: 'Juvenile specimens lacked the extreme gastric grinding pressure of adults, necessitating nutritional transitions from tender foliage or insects to adult diets.',
      feedbackType: 'developmental_progression',
      telemetryMetric: { label: "Bite & Grind Force", value: "8.4x Juvenile" }
    });

    interrelations.push({
      targetDomain: 'climate',
      domainLabel: 'Paleoclimate Matrix',
      relationshipTitle: 'Microbiome Heat Fermentation',
      relationshipDescription: 'Immense caecal fermentation in herbivores generated endogenous heat, contributing to gigantothermic body temperature stability.',
      feedbackType: 'metabolic_coupling',
      telemetryMetric: { label: "Fermentation Heat", value: "+1.8°C Core Temp" }
    });

    waveformData = waveformData || {
      waveformType: 'gastric_pressure',
      primaryLabel: 'Gizzard Churning Contraction',
      baselineVal: 2,
      peakVal: 18.5,
      unit: 'MPa',
      description: 'Cyclic muscular compression pulverizing ingested botanical and osteological matrix.'
    };
  } else if (system === 'neurosensory') {
    abstractionTier = 'organismal_biomechanic';
    skeletalCorrelate = { boneName: "Neurocranium & Braincase", feature: "Basioccipital & endocranial olfactory cavity" };

    interrelations.push({
      targetDomain: 'cardinal',
      domainLabel: 'Neighbouring Sites & Bearing',
      relationshipTitle: 'Apex Sensory Navigation across River Basins',
      relationshipDescription: 'Ultra-sensitive olfactory reception and low-frequency auditory canals enabled navigation across dozens of kilometers to locate seasonal nesting grounds or carcasses.',
      feedbackType: 'biomechanical_leverage',
      telemetryMetric: { label: "Olfactory Detection", value: "> 15 km Radius" }
    });

    interrelations.push({
      targetDomain: 'elevation',
      domainLabel: 'Hypsometric Profile',
      relationshipTitle: 'Semicircular Vestibular Gaze Stabilization',
      relationshipDescription: 'Expanded horizontal semicircular canals stabilized ocular fixations when traversing sloping floodplain contours and rocky alluvial fans.',
      feedbackType: 'biomechanical_leverage',
      telemetryMetric: { label: "Vestibular Tilt Precision", value: "±0.5° Roll Angle" }
    });

    waveformData = waveformData || {
      waveformType: 'neural_spike',
      primaryLabel: 'Sensory Evoked Potential',
      baselineVal: 12,
      peakVal: 65,
      unit: 'μV (Microvolts)',
      description: 'Neural signal spike frequency corresponding to binocular optic alignment and olfactory stimulation.'
    };
  } else if (system === 'musculoskeletal') {
    abstractionTier = 'organismal_biomechanic';
    skeletalCorrelate = { boneName: "Femur & Caudal Vertebrae", feature: "Fourth trochanter crest & chevron scars" };

    interrelations.push({
      targetDomain: 'locomotion',
      domainLabel: 'Locomotor Kinematics',
      relationshipTitle: 'Direct Pelvic Retractor Propulsive Engine',
      relationshipDescription: 'The retractor muscle pulls directly on the femur 4th trochanter, providing the primary ground reaction force vector for forward propulsion.',
      feedbackType: 'biomechanical_leverage',
      telemetryMetric: { label: "Peak Propulsive Force", value: `${(massKg * 0.0098 * 1.6).toFixed(1)} kN` }
    });

    interrelations.push({
      targetDomain: 'inventory',
      domainLabel: 'Fossil Stratum',
      relationshipTitle: 'Osteological Muscle Insertion Scars',
      relationshipDescription: 'Hypertrophied rugose crests on fossilized femora and ilia record the exact attachment vectors and cross-sectional areas of the locomotor engine.',
      feedbackType: 'taphonomic_signature',
      telemetryMetric: { label: "Scar Area", value: "480 cm²" }
    });

    waveformData = waveformData || {
      waveformType: 'grf_curve',
      primaryLabel: 'Ground Reaction Force Cycle',
      baselineVal: 0,
      peakVal: Math.round(massKg * 0.0098 * 1.8),
      unit: 'kN (Kilonewtons)',
      description: 'Vertical and braking forces transmitted through hindlimbs during each locomotive stride cycle.'
    };
  }

  return {
    id: organ.id || `organ-${Math.random().toString(36).substr(2, 6)}`,
    name: organ.name || "Specialized Anatomical Structure",
    latinTerm: organ.latinTerm || "Organum paleobiologicum",
    system: system,
    categoryLabel: organ.categoryLabel || "Physiological Component",
    color: organ.color || "#10b981",
    coords: organ.coords || { x: 300, y: 200, r: 20 },
    svgShape: organ.svgShape,
    summary: organ.summary || "Essential visceral or biomechanical structure supporting organismal vitality.",
    physiologicalRole: organ.physiologicalRole || "Maintains homeostatic metabolism and locomotion.",
    avianHomology: organ.avianHomology || "Archosaurian morphological precursor homologous to modern aves.",
    fossilEvidence: organ.fossilEvidence || "Preserved through osteological muscle scars and vascular canal prints.",
    keyMetrics: organ.keyMetrics || [{ label: "Status", value: "Functional" }],
    simulationType: organ.simulationType || "heartbeat",
    abstractionTier: organ.abstractionTier || abstractionTier,
    interrelations: (organ.interrelations && organ.interrelations.length > 0) ? organ.interrelations : interrelations,
    skeletalCorrelate: organ.skeletalCorrelate || skeletalCorrelate,
    waveformData: organ.waveformData || waveformData
  };
}

/**
 * Returns an organ profile for any dinosaur taxon, enriched with abstraction tiers,
 * cross-domain interrelations, skeletal correlates, and physiological telemetry.
 */
export function getDinoOrganProfile(taxaName: string): DinoOrganProfile {
  let baseProfile: DinoOrganProfile;
  
  if (DINO_ORGAN_PROFILES[taxaName]) {
    baseProfile = DINO_ORGAN_PROFILES[taxaName];
  } else {
    const norm = taxaName.toLowerCase();
    if (norm.includes("tri") || norm.includes("cerat")) {
      baseProfile = DINO_ORGAN_PROFILES["Triceratops"];
    } else if (norm.includes("velo") || norm.includes("rapt") || norm.includes("dromaeo")) {
      baseProfile = DINO_ORGAN_PROFILES["Velociraptor"];
    } else if (norm.includes("spino") || norm.includes("bary")) {
      baseProfile = DINO_ORGAN_PROFILES["Spinosaurus"];
    } else if (norm.includes("stego") || norm.includes("ankylo")) {
      baseProfile = DINO_ORGAN_PROFILES["Stegosaurus"];
    } else if (norm.includes("brachio") || norm.includes("sauro") || norm.includes("diplo") || norm.includes("titan")) {
      baseProfile = DINO_ORGAN_PROFILES["Brachiosaurus"];
    } else {
      baseProfile = DINO_ORGAN_PROFILES["Tyrannosaurus Rex"];
    }
  }

  // Systematically enrich each organ with abstraction tiers, interrelations, and waveforms
  const enrichedOrgans = baseProfile.organs.map(organ => 
    enrichOrganWithInterrelations(organ, taxaName, baseProfile.estimatedBpm, baseProfile.bodyMassKg)
  );

  return {
    ...baseProfile,
    taxaName: taxaName,
    organs: enrichedOrgans
  };
}
