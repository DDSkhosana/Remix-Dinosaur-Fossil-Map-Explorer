import React, { useState, useMemo, useEffect } from 'react';
import { 
  Globe, 
  Sparkles, 
  Clock, 
  Layers, 
  Flame, 
  Zap, 
  Activity, 
  Compass, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Eye, 
  Share2, 
  ChevronRight,
  ShieldAlert,
  Dna,
  Footprints,
  Play,
  Pause
} from 'lucide-react';
import { GeologicalTimeMarker } from '../types';

export interface EvolutionaryEvent {
  id: string;
  ageMa: number;
  title: string;
  period: string;
  epoch: string;
  type: 'extinction' | 'diversification' | 'tectonic' | 'climate' | 'coevolution';
  summary: string;
  impact: string;
  keyTaxa: string[];
  continentLayout: string;
}

export const EVOLUTIONARY_EVENTS: EvolutionaryEvent[] = [
  {
    id: 'evt-permian-extinction',
    ageMa: 252,
    title: 'End-Permian Great Dying Mass Extinction',
    period: 'Permian-Triassic Boundary',
    epoch: 'Late Permian',
    type: 'extinction',
    summary: 'Siberian Traps volcanism released gigatons of CO2, causing global ocean acidification and 96% marine species collapse.',
    impact: 'Vacated ecological niches paved the way for Archosaurs and early Dinosauriformes to emerge.',
    keyTaxa: ['Euparkeria', 'Erythrosuchus', 'Kannemeyeria'],
    continentLayout: 'Pangea Supercontinent (Unified Landmass)'
  },
  {
    id: 'evt-carnian-pluvial',
    ageMa: 234,
    title: 'Carnian Pluvial Episode & Dino Explosive Origin',
    period: 'Late Triassic',
    epoch: 'Carnian',
    type: 'climate',
    summary: 'A 2-million-year period of intense humid rainfall and volcanic CO2 spikes transformed global arid deserts into lush conifer biomes.',
    impact: 'Dinosaurian abundance surged from 5% to over 50% of terrestrial fauna.',
    keyTaxa: ['Herrerasaurus', 'Eoraptor', 'Coelophysis', 'Plateosaurus'],
    continentLayout: 'Pangea Assembly (Beginning Early Rifting)'
  },
  {
    id: 'evt-tj-boundary',
    ageMa: 201,
    title: 'Triassic-Jurassic Boundary Mass Extinction',
    period: 'Triassic-Jurassic Boundary',
    epoch: 'Rhaetian / Hettangian',
    type: 'extinction',
    summary: 'Central Atlantic Magmatic Province (CAMP) flood basalts triggered runaway greenhouse warming and pseudosuchian collapse.',
    impact: 'Dinosaurs survived due to avian-like air sac respiratory efficiency and insulating proto-feathers.',
    keyTaxa: ['Dilophosaurus', 'Heterodontosaurus', 'Scelidosaurus'],
    continentLayout: 'Initial Rifting of Laurasia and Gondwana'
  },
  {
    id: 'evt-pangea-breakup',
    ageMa: 180,
    title: 'Pangea Breakup & Gondwanan Isolation',
    period: 'Early Jurassic',
    epoch: 'Toarcian / Aalenian',
    type: 'tectonic',
    summary: 'Opening of the Central Atlantic Ocean separated North America from Africa and Gondwana, isolating continental faunal pools.',
    impact: 'Speciation exploded: Sauropods gigantism escalated in Laurasia and Gondwana.',
    keyTaxa: ['Vulcanodon', 'Barapasaurus', 'Cryolophosaurus'],
    continentLayout: 'Laurasia (North) & Gondwana (South) Split'
  },
  {
    id: 'evt-jurassic-golden-age',
    ageMa: 152,
    title: 'Late Jurassic Radiation & Origin of Avian Flight',
    period: 'Late Jurassic',
    epoch: 'Kimmeridgian / Tithonian',
    type: 'diversification',
    summary: 'Warm epicontinental seas created lush fern-conifer floodplains across Morrison Formation and Solnhofen Lagoons.',
    impact: 'Evolution of Archeopteryx, colossal Diplodocids, allosaurid hypercarnivores, and armored Thyreophorans.',
    keyTaxa: ['Brachiosaurus', 'Stegosaurus', 'Allosaurus', 'Archaeopteryx'],
    continentLayout: 'Tethys Ocean Expansion & Shallow Seaways'
  },
  {
    id: 'evt-angiosperm-coevolution',
    ageMa: 125,
    title: 'Angiosperm Radiation & Herbivore Jaw Evolution',
    period: 'Early Cretaceous',
    epoch: 'Aptian / Barremian',
    type: 'coevolution',
    summary: 'Flowering plants (Angiosperms) radiated globally, revolutionizing herbivorous feeding strategies and tooth batteries.',
    impact: 'Co-evolution of Iguanodontians, Hadrosaurs with complex dental batteries, and horned Ceratopsians.',
    keyTaxa: ['Iguanodon', 'Deinonychus', 'Psittacosaurus', 'Sinosauropteryx'],
    continentLayout: 'South America & Africa Rifting Apart'
  },
  {
    id: 'evt-mid-cretaceous-thermal',
    ageMa: 95,
    title: 'Cenomanian Mid-Cretaceous Thermal Maximum',
    period: 'Late Cretaceous',
    epoch: 'Cenomanian / Turonian',
    type: 'climate',
    summary: 'Atmospheric CO2 exceeded 1,200 ppm; sea levels reached +250m above modern, turning Europe into an archipelago.',
    impact: 'Giant semi-aquatic predators like Spinosaurus flourished in North African Saharan river systems.',
    keyTaxa: ['Spinosaurus', 'Carcharodontosaurus', 'Argentinosaurus'],
    continentLayout: 'Western Interior Seaway Bisects North America'
  },
  {
    id: 'evt-terminal-kpg',
    ageMa: 66,
    title: 'Chicxulub Bolide Impact & Terminal K-Pg Extinction',
    period: 'Late Cretaceous Boundary',
    epoch: 'Maastrichtian',
    type: 'extinction',
    summary: 'A 10-km asteroid impacted Chicxulub, Mexico, launching sulfur soot into stratosphere and shutting down photosynthesis for years.',
    impact: '75% of all species perished; Non-avian dinosaurs vanished, while Avian Dinosaurs (Birds) survived.',
    keyTaxa: ['Tyrannosaurus Rex', 'Triceratops', 'Ankylosaurus', 'Edmontosaurus'],
    continentLayout: 'Modern-like Continents with High Sea Levels'
  }
];

interface EvolutionaryChronologyMapProps {
  activeAgeMa: number;
  onSelectAgeMa: (ageMa: number) => void;
  timeMarker?: GeologicalTimeMarker;
  activeTaxaName?: string;
  onSelectTaxon?: (taxonName: string) => void;
}

export const EvolutionaryChronologyMap: React.FC<EvolutionaryChronologyMapProps> = ({
  activeAgeMa,
  onSelectAgeMa,
  timeMarker,
  activeTaxaName = 'Tyrannosaurus Rex',
  onSelectTaxon
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(EVOLUTIONARY_EVENTS[7].id);

  // Chrono-Stratigraphy Time Lapse Player State
  const [isTectonicLapsePlaying, setIsTectonicLapsePlaying] = useState(false);

  useEffect(() => {
    if (!isTectonicLapsePlaying) return;
    const MILESTONES_MA = [250, 230, 201, 180, 155, 145, 120, 90, 66];
    
    const interval = setInterval(() => {
      // Find index of closest milestone
      const closestIdx = MILESTONES_MA.reduce((bestIdx, currVal, currIdx) => {
        const bestDiff = Math.abs(MILESTONES_MA[bestIdx] - activeAgeMa);
        const currDiff = Math.abs(currVal - activeAgeMa);
        return currDiff < bestDiff ? currIdx : bestIdx;
      }, 0);

      // Go to next milestone (Ma goes down as we move forward in time)
      const nextIdx = (closestIdx + 1) % MILESTONES_MA.length;
      const nextMa = MILESTONES_MA[nextIdx];
      onSelectAgeMa(nextMa);
    }, 1800);

    return () => clearInterval(interval);
  }, [isTectonicLapsePlaying, activeAgeMa, onSelectAgeMa]);

  // 3D Globe Spin and Drag States
  const [rotation, setRotation] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [viewLayoutMode, setViewLayoutMode] = useState<'split' | 'drift' | 'lineages'>('split');
  const [showBottomEventsTracker, setShowBottomEventsTracker] = useState(false);

  // Auto-spin when not dragging
  useEffect(() => {
    if (isDragging) return;
    const timer = setInterval(() => {
      setRotation(r => (r + 0.6) % 360);
    }, 45);
    return () => clearInterval(timer);
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStart;
    setRotation(r => (r + delta * 0.7) % 360);
    setDragStart(e.clientX);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Find closest event to activeAgeMa
  const closestEvent = useMemo(() => {
    return EVOLUTIONARY_EVENTS.reduce((prev, curr) => {
      return Math.abs(curr.ageMa - activeAgeMa) < Math.abs(prev.ageMa - activeAgeMa) ? curr : prev;
    });
  }, [activeAgeMa]);

  const activeEvent = EVOLUTIONARY_EVENTS.find(e => e.id === selectedEventId) || closestEvent;

  // Calculate continental drift position fraction (250 Ma = 0.0 Pangea -> 66 Ma = 1.0 Drifted)
  const driftProgress = Math.max(0, Math.min(1, (250 - activeAgeMa) / (250 - 66)));

  // 3D Projection Helpers
  const R = 75; // Radius of the 3D globe
  const cx = 200;
  const cy = 100;

  const projectPoint = (latDeg: number, lngDeg: number) => {
    const lat = (latDeg * Math.PI) / 180;
    const lng = (lngDeg * Math.PI) / 180;
    const rotRad = (rotation * Math.PI) / 180;

    // 3D coordinates on sphere surface
    const x3d = Math.cos(lat) * Math.sin(lng);
    const y3d = Math.sin(lat);
    const z3d = Math.cos(lat) * Math.cos(lng);

    // Rotate around Y-axis (spin)
    const xRot = x3d * Math.cos(rotRad) - z3d * Math.sin(rotRad);
    const yRot = y3d;
    const zRot = x3d * Math.sin(rotRad) + z3d * Math.cos(rotRad);

    return {
      x: cx + R * xRot,
      y: cy - R * yRot,
      z: zRot // zRot > 0 means visible on the front hemisphere
    };
  };

  // Build beautiful 3D landmass polygons
  const render3DContinent = (baseCoords: { lat: number; lng: number }[], latShift: number, lngShift: number, fillColor: string, strokeColor: string) => {
    const shifted = baseCoords.map(c => ({
      lat: Math.max(-85, Math.min(85, c.lat + latShift)),
      lng: c.lng + lngShift
    }));

    const projected = shifted.map(c => projectPoint(c.lat, c.lng));
    const averageZ = projected.reduce((sum, p) => sum + p.z, 0) / projected.length;

    // Construct SVG path connecting projected points
    const pathD = projected.reduce((acc, p, idx) => {
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }, '') + ' Z';

    // Back-hemisphere continents are drawn with high transparency (X-Ray effect)
    const isBack = averageZ < 0;
    const opacity = isBack ? 0.15 : 0.85;

    return (
      <path
        d={pathD}
        fill={fillColor}
        fillOpacity={opacity}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeOpacity={isBack ? 0.2 : 0.9}
        className="transition-all duration-300 ease-out"
      />
    );
  };

  // Continental bases: Realistic intricate Mesozoic coastlines
  const laurasiaBase = [
    { lat: 15, lng: -45 },
    { lat: 25, lng: -55 },
    { lat: 45, lng: -65 }, // North America West Coast
    { lat: 65, lng: -60 }, // Alaska / Beringia
    { lat: 75, lng: -20 }, // Greenland / Arctic
    { lat: 70, lng: 15 },  // Scandinavia
    { lat: 65, lng: 45 },  // Siberia East Coast
    { lat: 50, lng: 60 },  // Japan Basin region
    { lat: 35, lng: 55 },  // Cathaysian microcontinents
    { lat: 25, lng: 30 },  // Tethyan northern shelf
    { lat: 20, lng: -10 }, // Central Atlantic rifting edge
    { lat: 10, lng: -30 }, // Central American land bridge
  ];

  const gondwanaBase = [
    { lat: -15, lng: -35 }, // Amazonian bulge
    { lat: -5, lng: -25 },  // Guiana shield
    { lat: -5, lng: 5 },    // Nigeria coastline
    { lat: 5, lng: 15 },    // Somali basin bulge
    { lat: -15, lng: 35 },  // Madagascar / India fit
    { lat: -35, lng: 45 },  // Australian west shelf
    { lat: -55, lng: 55 },  // Queensland bulge
    { lat: -75, lng: 45 },  // East Antarctica
    { lat: -85, lng: 5 },   // South Pole core
    { lat: -75, lng: -35 }, // West Antarctica peninsula
    { lat: -55, lng: -45 }, // Patagonia tip
    { lat: -35, lng: -45 }, // Argentine coast
    { lat: -25, lng: -35 },
  ];

  const indiaBase = [
    { lat: -35, lng: 15 },
    { lat: -45, lng: 25 },
    { lat: -40, lng: 35 },
    { lat: -30, lng: 25 },
    { lat: -28, lng: 18 },
  ];

  // Glowing Spreading Ridges and Subduction Trenches vector points
  const ridgeCoords = [
    { lat: 15, lng: -25 },
    { lat: 5, lng: -15 },
    { lat: -5, lng: -2 },
    { lat: -12, lng: 12 },
    { lat: -22, lng: 28 },
  ];

  const trenchCoords = [
    { lat: 50, lng: -72 },
    { lat: 30, lng: -67 },
    { lat: 10, lng: -58 },
    { lat: -10, lng: -52 },
    { lat: -30, lng: -58 },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-park-card-border p-3.5 sm:p-4 space-y-3.5 shadow-xs text-park-ink">
      
      {/* Master Coordinated Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-park-card-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
            <Globe size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-rounded font-extrabold text-park-accent-green uppercase tracking-wider">
                Paleotectonics & Geochronology
              </span>
              <span className="text-slate-400 text-[10px]" aria-hidden="true">·</span>
              <span className="text-[9.5px] font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.2 rounded-md border border-amber-300/60">
                {activeAgeMa} Ma
              </span>
            </div>
            <h3 className="text-[13px] sm:text-[14px] font-rounded font-extrabold text-park-tree leading-snug">
              Evolutionary Events & Continental Drift Map
            </h3>
            <p className="text-[10px] font-rounded text-park-ink-muted leading-tight">
              Synchronized plate tectonics, evolutionary landmarks & dinosaur lineages
            </p>
          </div>
        </div>

        {/* Chrono-Stratigraphy Time Lapse Player Control */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsTectonicLapsePlaying(!isTectonicLapsePlaying)}
            className={`px-3 py-1.5 rounded-xl text-[10.5px] font-rounded font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isTectonicLapsePlaying 
                ? 'bg-rose-600 text-white animate-pulse' 
                : 'bg-park-tree text-white hover:bg-park-tree/90'
            }`}
            title="Play automatic timeline film of geological plate tectonics & drift from 250 Ma to 66 Ma"
          >
            {isTectonicLapsePlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isTectonicLapsePlaying ? 'Pause Timelapse' : 'Play Tectonic Timelapse'}</span>
          </button>

          <span className="text-[9.5px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-600" />
            <span>Synced ({activeAgeMa} Ma)</span>
          </span>
        </div>
      </div>

      {/* Interactive Geological Time Range Scrub Slider */}
      <div className="bg-white p-3 rounded-2xl border border-park-card-border shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700">
              <Clock size={13} />
            </div>
            <div>
              <span className="text-[11px] font-rounded font-extrabold text-park-tree uppercase tracking-wider block">
                Interactive Geological Time Slider (Scrub 252 Ma → 66 Ma)
              </span>
              <span className="text-[9.5px] font-mono text-park-ink-muted">
                Drag slider to continuously simulate plate tectonics & faunal turnover
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Segmented Controls */}
            <div className="flex items-center gap-1 bg-park-card-muted/80 p-0.5 sm:p-1 rounded-xl border border-park-card-border/60 text-[9.5px] font-rounded font-bold">
              {(['split', 'drift', 'lineages'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewLayoutMode(mode)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    viewLayoutMode === mode
                      ? 'bg-park-tree text-white shadow-2xs font-extrabold'
                      : 'text-park-ink-muted hover:text-park-tree hover:bg-white/60'
                  }`}
                >
                  {mode === 'split' ? 'Split View' : mode === 'drift' ? 'Drift Focus' : 'Lineages Focus'}
                </button>
              ))}
            </div>

            {/* Active Age Badge */}
            <div className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-mono text-xs font-extrabold shadow-xs flex items-center gap-1">
              <Sparkles size={11} className="text-amber-200 animate-pulse" />
              <span>{activeAgeMa} Ma</span>
            </div>
          </div>
        </div>

        {/* Continuous Range Scrub Slider */}
        <div className="space-y-1.5 pt-1">
          <input
            type="range"
            min="0"
            max="186"
            step="1"
            value={252 - activeAgeMa}
            onChange={(e) => {
              const newMa = 252 - Number(e.target.value);
              onSelectAgeMa(newMa);
            }}
            className="w-full h-3 bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />

          {/* Geological Periods Milestones beneath track */}
          <div className="flex justify-between text-[8.5px] font-mono font-bold text-park-ink-muted">
            <span className={activeAgeMa >= 201 ? 'text-emerald-700 font-extrabold' : ''}>
              252 Ma (Triassic Dawn)
            </span>
            <span className={activeAgeMa >= 145 && activeAgeMa < 201 ? 'text-amber-700 font-extrabold' : ''}>
              201 Ma (Jurassic Rifting)
            </span>
            <span className={activeAgeMa >= 66 && activeAgeMa < 145 ? 'text-rose-700 font-extrabold' : ''}>
              145 Ma (Cretaceous Dispersal)
            </span>
            <span className={activeAgeMa <= 68 ? 'text-red-700 font-extrabold' : ''}>
              66 Ma (K-Pg Extinction)
            </span>
          </div>
        </div>
      </div>

      {/* Main Dual Viewport: Continental Drift vs Dinosaur Lineages (Zero-Scroll Responsive Layout) */}
      <div className={`grid gap-4 min-w-0 ${viewLayoutMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* VIEWPORT 1: CONTINENTAL DRIFT & PALAEOGEOGRAPHY CANVAS */}
        {(viewLayoutMode === 'split' || viewLayoutMode === 'drift') && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3.5 text-white flex flex-col justify-between space-y-3 relative overflow-auto custom-scrollbar max-h-[390px] shadow-lg min-w-0">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 z-10">
            <div className="flex items-center gap-1.5">
              <Compass size={14} className="text-amber-400" />
              <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                Continental Drift Projection ({activeAgeMa} Ma)
              </span>
            </div>
            <span className="text-[9.5px] font-mono bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {activeEvent.continentLayout}
            </span>
          </div>

          {/* Interactive Drag-to-Spin 3D Continental Drift Globe Visualization */}
          <div 
            className="relative w-full h-56 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden p-2 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            <div className="absolute top-2 left-3 text-[9px] font-mono text-slate-400 flex items-center gap-1.5 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              <span>Interactive 3D Globe: Drag to Rotate & Spin</span>
            </div>

            {/* SVG 3D Globe Container */}
            <svg viewBox="0 0 400 200" className="w-full h-full relative z-10 drop-shadow-[0_0_20px_rgba(56,189,248,0.15)]">
              <defs>
                {/* 3D sphere depth ocean background */}
                <radialGradient id="globe-ocean" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="50%" stopColor="#090d16" />
                  <stop offset="100%" stopColor="#02040a" />
                </radialGradient>
                {/* 3D atmosphere rim highlight */}
                <radialGradient id="globe-atmosphere" cx="50%" cy="50%" r="50%">
                  <stop offset="88%" stopColor="#000000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
                </radialGradient>
                
                <clipPath id="globe-clip">
                  <circle cx={cx} cy={cy} r={R} />
                </clipPath>

                {/* Spreading Displacement Vector Arrow markers */}
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0,1 L 10,5 L 0,9 Z" fill="#facc15" />
                </marker>
              </defs>

              {/* Ocean Sphere base */}
              <circle cx={cx} cy={cy} r={R} fill="url(#globe-ocean)" stroke="#1e293b" strokeWidth="1" />

              {/* 3D Coordinate Grid Lines wrapping around the sphere */}
              <g clipPath="url(#globe-clip)" opacity="0.12" stroke="#38bdf8" strokeWidth="0.8" fill="none">
                {/* Latitudes */}
                {[-60, -30, 0, 30, 60].map((lat, i) => {
                  const pts = Array.from({ length: 37 }).map((_, idx) => {
                    const lng = idx * 10 - 180;
                    return projectPoint(lat, lng);
                  });
                  const d = pts.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  return <path key={i} d={d} />;
                })}
                {/* Longitudes */}
                {[-120, -60, 0, 60, 120].map((lng, i) => {
                  const pts = Array.from({ length: 19 }).map((_, idx) => {
                    const lat = idx * 10 - 90;
                    return projectPoint(lat, lng);
                  });
                  const d = pts.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  return <path key={i} d={d} />;
                })}
              </g>

              {/* Projected 3D Continental Plates with Drift Morphing */}
              <g clipPath="url(#globe-clip)">
                {/* Laurasia (North) */}
                {render3DContinent(
                  laurasiaBase, 
                  driftProgress * 18,      // latShift North
                  -driftProgress * 28,     // lngShift West
                  "#10b981", 
                  "#34d399"
                )}

                {/* Gondwana (South) */}
                {render3DContinent(
                  gondwanaBase, 
                  -driftProgress * 20,     // latShift South
                  driftProgress * 32,      // lngShift East
                  "#059669", 
                  "#6EE7B7"
                )}

                {/* Sub-continental India Fragment (splits from Gondwana & drifts fast) */}
                {driftProgress >= 0.4 && render3DContinent(
                  indiaBase,
                  driftProgress * 15,
                  driftProgress * 42,
                  "#0d9488",
                  "#2dd4bf"
                )}

                {/* Spreading Ridge glowing dashed vectors */}
                {(() => {
                  const projectedRidge = ridgeCoords.map(c => projectPoint(c.lat, c.lng));
                  const d = projectedRidge.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  return (
                    <path 
                      d={d} 
                      fill="none" 
                      stroke="#facc15" 
                      strokeWidth="1.6" 
                      strokeDasharray="4,2" 
                      opacity="0.8" 
                    />
                  );
                })()}

                {/* Subduction Trench jagged margins */}
                {(() => {
                  const projectedTrench = trenchCoords.map(c => projectPoint(c.lat, c.lng));
                  const d = projectedTrench.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  return (
                    <path 
                      d={d} 
                      fill="none" 
                      stroke="#f97316" 
                      strokeWidth="1.5" 
                      strokeDasharray="2,3" 
                      opacity="0.7" 
                    />
                  );
                })()}

                {/* Directional Plate Displacement Spreading Vectors */}
                {ridgeCoords.map((c, i) => {
                  if (i % 2 !== 0) return null; // space them out
                  const pin = projectPoint(c.lat, c.lng);
                  if (pin.z < 0) return null;

                  // Spreading vectors pointing away from ridge segment
                  const pinWest = projectPoint(c.lat, c.lng - 10);
                  const pinEast = projectPoint(c.lat, c.lng + 10);

                  return (
                    <g key={i} stroke="#facc15" strokeWidth="1" fill="none" opacity="0.85">
                      <line x1={pin.x} y1={pin.y} x2={pinWest.x} y2={pinWest.y} markerEnd="url(#arrow)" />
                      <line x1={pin.x} y1={pin.y} x2={pinEast.x} y2={pinEast.y} markerEnd="url(#arrow)" />
                    </g>
                  );
                })}
              </g>

              {/* 3D Atmosphere rim glow overlay */}
              <circle cx={cx} cy={cy} r={R} fill="url(#globe-atmosphere)" className="pointer-events-none" />

              {/* Projected 3D Active Excavation Pin */}
              {(() => {
                // Calculate dynamic coordinate for the active dig site on the globe
                // e.g. North America centered at lat 38N, lng -20W for Hell Creek, drifting over time
                const siteLat = 36 + driftProgress * 8;
                const siteLng = -15 - driftProgress * 35;
                const pin = projectPoint(siteLat, siteLng);

                if (pin.z < 0) return null; // Hide if on the back hemisphere

                return (
                  <g transform={`translate(${pin.x}, ${pin.y})`} className="pointer-events-none">
                    <circle r="5" fill="#f43f5e" className="animate-ping opacity-75" />
                    <circle r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
                    <text x="6" y="2.5" fill="#93c5fd" fontSize="7" fontFamily="monospace" fontWeight="bold">
                      {activeTaxaName.split(' ')[0]} Horizon
                    </text>
                  </g>
                );
              })()}
            </svg>

            {/* Bottom Latitude / Drift Progress Slider */}
            <div className="absolute bottom-2 left-3 right-3 bg-slate-900/90 backdrop-blur-xs p-1.5 rounded-lg border border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-300 pointer-events-none">
              <span>250 Ma (Pangea)</span>
              <div className="flex-1 mx-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-400 transition-all duration-500" 
                  style={{ width: `${driftProgress * 100}%` }}
                />
              </div>
              <span>66 Ma (Seaways)</span>
            </div>
          </div>

          {/* New Tectonic Strain & Volcanic Outgassing Metrics Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono">
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[8px] uppercase">Spreading Rate</span>
              <strong className="text-amber-400">{(2.4 + driftProgress * 2.8).toFixed(1)} cm/yr</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[8px] uppercase">Paleolatitude</span>
              <strong className="text-cyan-400">{Math.round(48.2 - driftProgress * 11.5)}°N</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[8px] uppercase">CO₂ Outgassing</span>
              <strong className="text-emerald-400">{(1.2 + (1 - driftProgress) * 1.6).toFixed(1)} Gt/yr</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[8px] uppercase">Sea Level Delta</span>
              <strong className="text-teal-400">+{Math.round(80 + driftProgress * 170)}m</strong>
            </div>
          </div>

          <div className="text-[10px] font-rounded text-slate-300 flex items-center justify-between">
            <span>Tectonic State: <strong className="text-emerald-400">{activeEvent.continentLayout}</strong></span>
            <span>Drift Index: <strong className="text-amber-300">{(driftProgress * 100).toFixed(0)}% Dispersal</strong></span>
          </div>
        </div>
        )}

        {/* VIEWPORT 2: DINOSAUR EVOLUTIONARY GRAPHICS & LINEAGES */}
        {(viewLayoutMode === 'split' || viewLayoutMode === 'lineages') && (
        <div className="bg-white rounded-2xl border border-park-card-border p-3.5 flex flex-col justify-between space-y-3 shadow-xs overflow-y-auto custom-scrollbar max-h-[390px] min-w-0">
          <div className="flex items-center justify-between border-b border-park-card-border pb-2">
            <div className="flex items-center gap-1.5">
              <Dna size={14} className="text-emerald-700" />
              <span className="text-[11px] font-rounded font-extrabold text-park-tree uppercase tracking-wider">
                Dinosaur Evolutionary Lineages & Graphics
              </span>
            </div>
            <span className="text-[9.5px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              {activeEvent.period}
            </span>
          </div>

          {/* Lineages Graphics Matrix */}
          <div className="space-y-2">
            <div className="text-[10px] font-rounded font-bold text-park-ink-muted uppercase tracking-wider">
              Dominant Faunal Guilds at {activeAgeMa} Ma:
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  🦖
                </div>
                <div>
                  <div className="text-[11px] font-rounded font-extrabold text-emerald-950">Theropoda</div>
                  <div className="text-[9px] font-mono text-emerald-800">Bipedal Carnivores & Birds</div>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  🦕
                </div>
                <div>
                  <div className="text-[11px] font-rounded font-extrabold text-amber-950">Sauropodomorpha</div>
                  <div className="text-[9px] font-mono text-amber-800">Long-Necked Gigantic Herbivores</div>
                </div>
              </div>

              <div className="p-2.5 bg-cyan-50/80 rounded-xl border border-cyan-200 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  🛡️
                </div>
                <div>
                  <div className="text-[11px] font-rounded font-extrabold text-cyan-950">Thyreophora</div>
                  <div className="text-[9px] font-mono text-cyan-800">Armored Stegosaurs & Ankylosaurs</div>
                </div>
              </div>

              <div className="p-2.5 bg-purple-50/80 rounded-xl border border-purple-200 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  👑
                </div>
                <div>
                  <div className="text-[11px] font-rounded font-extrabold text-purple-950">Marginocephalia</div>
                  <div className="text-[9px] font-mono text-purple-800">Ceratopsians & Pachycephalosaurs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Taxa in Horizon */}
          <div className="p-2.5 bg-park-sand/40 rounded-xl border border-park-card-border space-y-1">
            <div className="text-[9.5px] font-rounded font-bold text-park-tree uppercase flex items-center gap-1">
              <Footprints size={12} className="text-amber-600" />
              <span>Key Specimen Fossils Recorded in Horizon:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {activeEvent.keyTaxa.map((taxa, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectTaxon && onSelectTaxon(taxa)}
                  className={`text-[9.5px] font-mono px-2 py-0.5 rounded border font-bold transition-all ${
                    onSelectTaxon ? 'cursor-pointer hover:bg-amber-100 hover:border-amber-400' : ''
                  } ${taxa.toLowerCase() === activeTaxaName.toLowerCase() ? 'bg-amber-500 text-white border-amber-600 shadow-2xs' : 'bg-white text-park-tree border-park-card-border'}`}
                  title={onSelectTaxon ? `Click to inspect ${taxa} in Observatory` : taxa}
                >
                  {taxa}
                </button>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* MAJOR EVOLUTIONARY EVENTS CONTINUUM TRACKER (Collapsible for zero-scroll fold) */}
      <div className="space-y-2 pt-2 border-t border-park-card-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-600" />
            <h4 className="text-[11px] font-rounded font-extrabold text-park-tree uppercase tracking-wider">
              Geological Evolutionary Landmark Events Tracker
            </h4>
          </div>
          <button
            onClick={() => setShowBottomEventsTracker(!showBottomEventsTracker)}
            className="text-[9.5px] font-mono px-2.5 py-1 rounded-lg bg-white hover:bg-park-sand/60 border border-park-card-border font-bold text-park-tree flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
          >
            <span>{showBottomEventsTracker ? '▲ Collapse Events' : '▼ Expand All 8 Events'}</span>
          </button>
        </div>

        {/* Scrollable Horizontal Event Cards */}
        {showBottomEventsTracker && (
        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar animate-in">
          {EVOLUTIONARY_EVENTS.map((evt) => {
            const isSelected = evt.id === activeEvent.id;
            return (
              <div
                key={evt.id}
                onClick={() => {
                  setSelectedEventId(evt.id);
                  onSelectAgeMa(evt.ageMa);
                }}
                className={`w-72 p-3 rounded-xl border transition-all cursor-pointer shrink-0 space-y-2 select-none ${
                  isSelected
                    ? 'bg-amber-950 text-white border-amber-500 shadow-md ring-2 ring-amber-400/50 scale-102'
                    : 'bg-white hover:bg-park-sand/50 text-park-ink border-park-card-border shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                    evt.type === 'extinction'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : evt.type === 'climate'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : evt.type === 'tectonic'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {evt.type}
                  </span>
                  <span className="text-[10px] font-mono font-extrabold text-amber-300">
                    {evt.ageMa} Ma
                  </span>
                </div>

                <div>
                  <h5 className={`text-xs font-rounded font-bold leading-tight ${isSelected ? 'text-white' : 'text-park-tree'}`}>
                    {evt.title}
                  </h5>
                  <p className={`text-[10px] leading-snug line-clamp-2 mt-1 ${isSelected ? 'text-slate-300' : 'text-park-ink-muted'}`}>
                    {evt.summary}
                  </p>
                </div>

                <div className={`text-[9px] pt-1 border-t flex items-center justify-between ${
                  isSelected ? 'border-amber-800 text-amber-200' : 'border-park-card-border/60 text-park-tree'
                }`}>
                  <span>{evt.epoch}</span>
                  <ChevronRight size={12} className={isSelected ? 'text-amber-400' : 'text-park-tree'} />
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};

export default EvolutionaryChronologyMap;
