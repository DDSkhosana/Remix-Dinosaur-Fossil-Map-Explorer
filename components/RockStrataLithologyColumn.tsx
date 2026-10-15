import React, { useState, useEffect } from 'react';
import { 
  Layers, Mountain, Sparkles, Sliders, ChevronRight, Activity, 
  RotateCcw, Compass, ArrowDown, Info, CheckCircle2, Plus, Minus,
  ChevronDown, ChevronUp, MapPin, Eye, EyeOff, LayoutGrid, Play, Pause
} from 'lucide-react';

export interface RockStratumLayer {
  id: string;
  name: string;
  rockType: string;
  depthRangeM: [number, number]; // [topDepth, bottomDepth]
  color: string;
  pattern: 'sandstone' | 'mudstone' | 'siltstone' | 'tuff' | 'shale' | 'limestone' | 'conglomerate';
  grainSize: string;
  mineralogy: string;
  porosityPercent: number;
  depositionalEnvironment: string;
  depositionalEnergy: 'High (Fluvial)' | 'Moderate (Overbank)' | 'Low (Lacustrine)' | 'Anoxic (Marsh)' | 'Marine (Carbonate)' | 'Volcanic';
  taphonomyPreservation: string;
  fossilIndex: string;
  radioMetricDatingPossible: boolean;
  densityKgM3: number;
}

export const STRATIGRAPHIC_ROCK_COLUMN: RockStratumLayer[] = [
  {
    id: 'layer-paleosol',
    name: 'Upper Bioturbated Paleosol Horizon',
    rockType: 'Loess, Clay & Caliche Paleosol',
    depthRangeM: [0, 20],
    color: '#8c6239',
    pattern: 'mudstone',
    grainSize: '< 0.004 mm (Clay & Fine Silt)',
    mineralogy: 'Illite, Smectite, Calcite nodular concretions',
    porosityPercent: 28,
    depositionalEnvironment: 'Ancient Floodplain Soil & Vegetated Terraces',
    depositionalEnergy: 'Low (Lacustrine)',
    taphonomyPreservation: 'Root traces, invertebrate burrows & microvertebrate teeth',
    fossilIndex: 'Coprolites, Charophytes & Root Casts',
    radioMetricDatingPossible: false,
    densityKgM3: 2150
  },
  {
    id: 'layer-sandstone',
    name: 'Cross-Bedded Channel Sandstone',
    rockType: 'Fluvial Quartzose Sandstone',
    depthRangeM: [20, 75],
    color: '#d4a373',
    pattern: 'sandstone',
    grainSize: '0.25 - 0.5 mm (Medium Quartz Sand)',
    mineralogy: 'Quartz (82%), Feldspar (12%), Lithic fragments (6%)',
    porosityPercent: 22,
    depositionalEnvironment: 'Braided Meandering River Channels & Point Bars',
    depositionalEnergy: 'High (Fluvial)',
    taphonomyPreservation: 'High bonebed fossilization, rapid fluvial burial & articulation',
    fossilIndex: 'Articulated Theropod/Sauropod Skeletons & Trackways',
    radioMetricDatingPossible: false,
    densityKgM3: 2420
  },
  {
    id: 'layer-mudstone',
    name: 'Laminated Overbank Siltstone & Mudstone',
    rockType: 'Overbank Siltstone / Mudstone',
    depthRangeM: [75, 130],
    color: '#a37081',
    pattern: 'siltstone',
    grainSize: '0.004 - 0.062 mm (Silt & Fine Clay)',
    mineralogy: 'Quartz silt, Kaolinite, Hematite pigment (Red beds)',
    porosityPercent: 15,
    depositionalEnvironment: 'Overbank Floodplain & Crevasse Splay Lowlands',
    depositionalEnergy: 'Moderate (Overbank)',
    taphonomyPreservation: 'Fine skin impressions, delicate osteoderms & nest clutches',
    fossilIndex: 'Dinosaur Egg Nests, Hadrosaur Mummies & Plant Fronds',
    radioMetricDatingPossible: false,
    densityKgM3: 2510
  },
  {
    id: 'layer-tuff',
    name: 'Argon-Datable Bentonitic Volcanic Tuff Bed',
    rockType: 'Volcanic Ash Bed (Bentonite / Tuff)',
    depthRangeM: [130, 145],
    color: '#e0a96d',
    pattern: 'tuff',
    grainSize: 'Glass shards, Sanidine & Zircon crystals',
    mineralogy: 'Altered rhyolitic volcanic ash, Sanidine, Biotite, Zircons',
    porosityPercent: 11,
    depositionalEnvironment: 'Airfall Volcanic Tephra Plume across Paleo-basin',
    depositionalEnergy: 'Volcanic',
    taphonomyPreservation: 'Preserves instantaneous chronostratigraphic marker layer',
    fossilIndex: 'Isotopic ⁴⁰Ar/³⁹Ar & U-Pb Zircon Geochronology Horizon',
    radioMetricDatingPossible: true,
    densityKgM3: 2280
  },
  {
    id: 'layer-shale',
    name: 'Carbonaceous Bituminous Shale & Lignite',
    rockType: 'Organic-Rich Bituminous Black Shale',
    depthRangeM: [145, 195],
    color: '#3d405b',
    pattern: 'shale',
    grainSize: '< 0.002 mm (Colloidal Organic Clay)',
    mineralogy: 'Kerogen (TOC > 12%), Pyrite, Smectite, Amber droplets',
    porosityPercent: 8,
    depositionalEnvironment: 'Anoxic Palustrine Swamp & Stagnant Coastal Delta Lagoon',
    depositionalEnergy: 'Anoxic (Marsh)',
    taphonomyPreservation: 'Exceptional carbonized compressions, feather fibers & amber',
    fossilIndex: 'Feathered Theropods, Insects in Amber & Gymnosperm Wood',
    radioMetricDatingPossible: false,
    densityKgM3: 2350
  },
  {
    id: 'layer-limestone',
    name: 'Bioclastic Fossiliferous Calcarenite',
    rockType: 'Bioclastic Fossiliferous Limestone',
    depthRangeM: [195, 260],
    color: '#8187dc',
    pattern: 'limestone',
    grainSize: 'Bioclastic Carbonate Grainstone / Wackestone',
    mineralogy: 'Calcite (94%), Aragonite remnants, Glauconite',
    porosityPercent: 18,
    depositionalEnvironment: 'Epicontinental Seaway / Shallow Marine Carbonate Platform',
    depositionalEnergy: 'Marine (Carbonate)',
    taphonomyPreservation: 'Marine invertebrate shell beds & marine reptile dentition',
    fossilIndex: 'Ammonites, Inoceramid Bivalves & Mosasaur/Plesiosaur Teeth',
    radioMetricDatingPossible: false,
    densityKgM3: 2680
  },
  {
    id: 'layer-conglomerate',
    name: 'Basal Unconformity Conglomerate & Basalt',
    rockType: 'Polymictic Basal Conglomerate & Basalt',
    depthRangeM: [260, 350],
    color: '#495057',
    pattern: 'conglomerate',
    grainSize: '> 2.0 - 64.0 mm (Rounded Quartzite Pebbles & Cobbles)',
    mineralogy: 'Quartzite pebbles, Chert, Basaltic volcanic matrix',
    porosityPercent: 9,
    depositionalEnvironment: 'High-Energy Alluvial Fan & Tectonic Rifting Base',
    depositionalEnergy: 'High (Fluvial)',
    taphonomyPreservation: 'Abraded robust bone fragments & silicified trunk logs',
    fossilIndex: 'Silicified Conifer Trunks & Reworked Fossil Clasts',
    radioMetricDatingPossible: true,
    densityKgM3: 2780
  }
];

// Synthetic 2D Regional Hypsometry Relief Cross-Section Nodes
const REGIONAL_HYPSOMETRY_PROFILE = [
  { distanceKm: 0, altitudeM: 15, label: 'Coastal Plain / Delta' },
  { distanceKm: 20, altitudeM: 45, label: 'Lowland Floodplain Basin' },
  { distanceKm: 45, altitudeM: 120, label: 'Discovery Quarry Locality', isSite: true },
  { distanceKm: 70, altitudeM: 280, label: 'Savanna Plateau' },
  { distanceKm: 100, altitudeM: 650, label: 'Sub-Alpine Conifer Uplands' },
  { distanceKm: 135, altitudeM: 1250, label: 'Orogenic Highlands Peak' }
];

interface RockStrataLithologyColumnProps {
  currentBurialDepthM?: number;
  currentElevationM?: number;
  siteName?: string;
  formationName?: string;
  onSelectStratum?: (stratum: RockStratumLayer) => void;
  collapsible?: boolean;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onElevationChange?: (elevationM: number) => void;
  onDepthChange?: (depthM: number) => void;
}

export const RockStrataLithologyColumn: React.FC<RockStrataLithologyColumnProps> = ({
  currentBurialDepthM = 45,
  currentElevationM = 120,
  siteName = 'Excavation Locality',
  formationName = 'Hell Creek / Morrison Formation',
  onSelectStratum,
  collapsible = true,
  isPlaying = false,
  onTogglePlay,
  onElevationChange,
  onDepthChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [activeTabMode, setActiveTabMode] = useState<'integrated' | 'strata' | 'hypsometry'>('integrated');
  
  const [activeDepthM, setActiveDepthM] = useState<number>(currentBurialDepthM);
  const [activeDatumCutM, setActiveDatumCutM] = useState<number>(currentElevationM);

  // Sync prop changes
  useEffect(() => {
    setActiveElevationM_internal(currentElevationM);
  }, [currentElevationM]);

  useEffect(() => {
    setActiveDepthM(currentBurialDepthM);
  }, [currentBurialDepthM]);

  const setActiveElevationM_internal = (val: number) => {
    setActiveDatumCutM(val);
  };

  // Automated Time-Lapse Synchronization for Canvas Sliders & Perforated Lines
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveDatumCutM(prev => {
        const next = prev >= 1200 ? 50 : prev + 45;
        onElevationChange?.(next);
        return next;
      });
      setActiveDepthM(prev => {
        const next = prev >= 330 ? 10 : prev + 20;
        onDepthChange?.(next);
        return next;
      });
      setQuarryDistanceKm(prev => {
        const next = prev >= 130 ? 10 : prev + 15;
        return next;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying, onElevationChange, onDepthChange]);
  
  // Interval states
  const [sliceInterval, setSliceInterval] = useState<number>(50); // ±25m, ±50m, ±100m, ±250m
  const [stepIntervalM, setStepIntervalM] = useState<number>(10); // ±5m, ±10m, ±25m, ±50m
  const [pressureUnit, setPressureUnit] = useState<'MPa' | 'bar' | 'psi'>('MPa');

  // Selected node on 2D hypsometric curve & Transect distance (km)
  const [selectedNodeIdx, setSelectedNodeIdx] = useState<number>(2);
  const [quarryDistanceKm, setQuarryDistanceKm] = useState<number>(45);

  // Helper to interpolate elevation & environmental zone at any transect distance
  const getProfileAtDistance = (distKm: number) => {
    const sorted = [...REGIONAL_HYPSOMETRY_PROFILE].sort((a, b) => a.distanceKm - b.distanceKm);
    if (distKm <= sorted[0].distanceKm) return { altitudeM: sorted[0].altitudeM, label: sorted[0].label };
    if (distKm >= sorted[sorted.length - 1].distanceKm) {
      const last = sorted[sorted.length - 1];
      return { altitudeM: last.altitudeM, label: last.label };
    }
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      if (distKm >= p1.distanceKm && distKm <= p2.distanceKm) {
        const t = (distKm - p1.distanceKm) / (p2.distanceKm - p1.distanceKm);
        const altitudeM = Math.round(p1.altitudeM + t * (p2.altitudeM - p1.altitudeM));
        const label = t < 0.5 ? p1.label : p2.label;
        return { altitudeM, label };
      }
    }
    return { altitudeM: 120, label: 'Discovery Quarry Locality' };
  };

  // SVG Direct Drag-to-Set Elevation Handles
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  const startDrag = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    setIsDragging(true);
    updateElevationFromEvent(e);
  };

  const doDrag = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    updateElevationFromEvent(e);
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const updateElevationFromEvent = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const relativeY = clientY - rect.top;
    const heightPercent = relativeY / rect.height;
    
    // Convert to SVG space y range 0-85
    const svgY = heightPercent * 85;
    
    // Terrain height range: y=10 (1250m) to y=62 (0m)
    const clampedY = Math.max(10, Math.min(62, svgY));
    const percentage = (62 - clampedY) / 52;
    const rawElev = percentage * 1250;
    
    // Snapped to nearest 10m for super smooth interaction
    const roundedElev = Math.max(0, Math.min(1250, Math.round(rawElev / 10) * 10));
    setActiveDatumCutM(roundedElev);
    onElevationChange?.(roundedElev);
  };

  // Find stratum matching current depth
  const activeStratum = STRATIGRAPHIC_ROCK_COLUMN.find(
    s => activeDepthM >= s.depthRangeM[0] && activeDepthM <= s.depthRangeM[1]
  ) || STRATIGRAPHIC_ROCK_COLUMN[1];

  const handleStratumClick = (stratum: RockStratumLayer) => {
    const midPoint = Math.round((stratum.depthRangeM[0] + stratum.depthRangeM[1]) / 2);
    setActiveDepthM(midPoint);
    onDepthChange?.(midPoint);
    onSelectStratum?.(stratum);
  };

  const stepDepth = (sign: 1 | -1) => {
    const nextD = Math.max(0, Math.min(350, activeDepthM + sign * stepIntervalM));
    setActiveDepthM(nextD);
    onDepthChange?.(nextD);
  };

  const stepDatum = (sign: 1 | -1) => {
    const nextE = Math.max(0, Math.min(1500, activeDatumCutM + sign * sliceInterval));
    setActiveDatumCutM(nextE);
    onElevationChange?.(nextE);
  };

  // Lithostatic Overburden Pressure: P = rho * g * h
  const rawMpa = (activeStratum.densityKgM3 * 9.81 * activeDepthM) / 1e6;
  const overburdenPressureFormatted = pressureUnit === 'MPa'
    ? `${rawMpa.toFixed(2)} MPa`
    : pressureUnit === 'bar'
    ? `${(rawMpa * 10).toFixed(1)} bar`
    : `${(rawMpa * 145.038).toFixed(0)} psi`;

  const overburdenPressureMpa = rawMpa.toFixed(2);
  const modernAltitudeM = activeDatumCutM + 755;

  return (
    <div className="bg-gradient-to-br from-white via-[#faf8f2] to-amber-50/20 rounded-2xl border border-park-card-border p-3.5 sm:p-4 shadow-xs space-y-3.5 text-park-ink transition-all">
      {/* Collapsible Subpanel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-park-card-border/80 pb-2.5 select-none">
        <div 
          onClick={() => collapsible && setIsCollapsed(prev => !prev)}
          className={`flex items-center gap-2 flex-1 ${collapsible ? 'cursor-pointer' : ''}`}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-700/20 to-amber-900/30 border border-amber-700/30 flex items-center justify-center text-amber-800 shadow-2xs shrink-0">
            <Layers size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-300">
                Integrated Geological Profile
              </span>
              <span className="text-slate-400 text-[10px]" aria-hidden="true">·</span>
              <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-950 px-1.5 py-0.2 rounded border border-amber-200">
                Topography & Litho-Column
              </span>
            </div>
            <h4 className="text-[13px] font-rounded font-extrabold text-park-tree leading-snug">
              Paleo-Hypsometry, Topographic Relief & Rock Strata
            </h4>
          </div>
        </div>

        {/* Action Controls, Minimal Synchronized Play/Pause & Collapse Toggle */}
        <div className="flex items-center gap-2">
          {/* Synchronized Play/Pause Lapse Button */}
          {onTogglePlay && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
              }}
              className={`px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer shadow-3xs active:scale-95 ${
                isPlaying 
                  ? 'bg-amber-600 text-white shadow-amber-600/30 ring-1 ring-amber-400' 
                  : 'bg-white text-park-tree border border-park-card-border hover:bg-park-sand/50'
              }`}
              title={isPlaying ? "Pause Epoch Time-Lapse" : "Play Epoch Time-Lapse"}
            >
              {isPlaying ? <Pause size={11} /> : <Play size={11} />}
              <span>{isPlaying ? 'Lapse Active' : 'Play Lapse'}</span>
            </button>
          )}

          {/* Quick Tab Selector */}
          {!isCollapsed && (
            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-park-card-border text-[9.5px] font-mono shadow-3xs">
              <button
                onClick={() => setActiveTabMode('integrated')}
                className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer ${
                  activeTabMode === 'integrated' ? 'bg-amber-700 text-white shadow-2xs' : 'text-park-ink-muted hover:text-park-tree'
                }`}
              >
                Dual Cross-Section
              </button>
              <button
                onClick={() => setActiveTabMode('strata')}
                className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer ${
                  activeTabMode === 'strata' ? 'bg-amber-700 text-white shadow-2xs' : 'text-park-ink-muted hover:text-park-tree'
                }`}
              >
                Rock Strata (0-350m)
              </button>
              <button
                onClick={() => setActiveTabMode('hypsometry')}
                className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer ${
                  activeTabMode === 'hypsometry' ? 'bg-amber-700 text-white shadow-2xs' : 'text-park-ink-muted hover:text-park-tree'
                }`}
              >
                Topographic Relief
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setActiveDepthM(currentBurialDepthM);
              setActiveDatumCutM(currentElevationM);
              setSelectedNodeIdx(2);
              onElevationChange?.(currentElevationM);
              onDepthChange?.(currentBurialDepthM);
            }}
            className="p-1 rounded-lg bg-white hover:bg-park-card-muted/60 text-park-ink-muted hover:text-park-tree border border-park-card-border text-[10px] font-rounded font-bold transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
            title="Reset Depth and Altimetry"
          >
            <RotateCcw size={11} />
          </button>

          {collapsible && (
            <button
              onClick={() => setIsCollapsed(prev => !prev)}
              className="p-1.5 rounded-lg bg-white hover:bg-park-sand/50 text-park-ink-muted hover:text-park-tree border border-park-card-border transition-colors cursor-pointer"
              title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
            >
              {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>
          )}
        </div>
      </div>

      {/* Collapsed Minimal Summary Bar */}
      {isCollapsed ? (
        <div 
          onClick={() => setIsCollapsed(false)}
          className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-center justify-between text-[10.5px] font-mono text-amber-950 cursor-pointer hover:bg-amber-100/70 transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-900">⛰️ Surface Relief: {activeDatumCutM}m ASL</span>
            <span>·</span>
            <span className="font-bold text-emerald-800">🪨 Active Stratum: {activeStratum.rockType} ({activeDepthM}m Depth)</span>
            <span>·</span>
            <span className="text-amber-900 font-extrabold">{overburdenPressureMpa} MPa Pressure</span>
          </div>
          <span className="text-[9.5px] font-rounded font-extrabold text-amber-800 underline">Click to Expand Panel ▾</span>
        </div>
      ) : (
        <div className="space-y-3.5 animate-in">
          {/* FEATURE 1: 2D REGIONAL TOPOGRAPHIC RELIEF PROFILE & DUAL SYNCHRONIZED CANVAS SLIDERS */}
          {(activeTabMode === 'integrated' || activeTabMode === 'hypsometry') && (
            <div className="space-y-3">
              <div className="w-full bg-gradient-to-br from-slate-950 via-[#0f172a] to-stone-900 text-white rounded-xl border border-slate-800 p-3.5 space-y-3.5 shadow-md select-none">
                
                {/* Header with Title & Live Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Mountain size={13} />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-mono font-extrabold text-white uppercase tracking-wide">
                        Regional Paleogeographic Cross-Section Profile
                      </h5>
                      <p className="text-[9px] font-mono text-slate-400">
                        2D Surface Topography & Subsurface Taphonomic Horizon Slicers
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {/* Compact Interactive Legend with Live Dynamic Metrics */}
                    {(() => {
                      const quarryInfo = getProfileAtDistance(quarryDistanceKm);
                      return (
                        <div className="text-[8px] font-mono font-bold tracking-wider text-slate-300 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 flex items-center gap-2.5 flex-wrap justify-end select-none">
                          <span className="text-emerald-400">🟢 Elevation Plane: <strong className="text-emerald-300">{activeDatumCutM}m ASL</strong> (Horizontal Slicer)</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-rose-400">🔴 Quarry Station: <strong className="text-rose-300">{quarryDistanceKm}km / {quarryInfo.altitudeM}m ASL</strong> ({quarryInfo.label})</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-purple-400">🟣 Borehole Horizon: <strong className="text-purple-300">{activeDepthM}m ({overburdenPressureFormatted})</strong></span>
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-slate-900 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-mono font-bold text-[9px] sm:text-[9.5px] whitespace-nowrap shadow-3xs">
                        ⛰️ Paleo-Elevation: {activeDatumCutM}m ASL
                      </span>
                      <span className="bg-slate-900 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-mono font-bold text-[9px] sm:text-[9.5px] whitespace-nowrap shadow-3xs">
                        🌄 Modern Altitude: {modernAltitudeM}m
                      </span>
                      <span className="bg-slate-900 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30 font-mono font-bold text-[9px] sm:text-[9.5px] whitespace-nowrap shadow-3xs">
                        🪨 Burial Depth: {activeDepthM}m (Step: ±{stepIntervalM}m)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Full-Width SVG Canvas with Perforated Lines & Distinct Handles */}
                {(() => {
                  const quarryInfo = getProfileAtDistance(quarryDistanceKm);
                  const quarryX = 20 + (quarryDistanceKm / 135) * 480;
                  const quarryY = 62 - (quarryInfo.altitudeM / 1250) * 48;
                  const maxDist = 135;
                  const maxAlt = 1250;
                  const pts = REGIONAL_HYPSOMETRY_PROFILE.map((p) => {
                    const x = 20 + (p.distanceKm / maxDist) * 480;
                    const y = 62 - (p.altitudeM / maxAlt) * 48;
                    return { x, y, ...p };
                  });
                  const pathD = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  const areaD = `${pathD} L ${pts[pts.length - 1].x} 62 L ${pts[0].x} 62 Z`;

                  return (
                    <div className="space-y-2.5">
                      <div className="relative w-full h-40 bg-slate-950/90 rounded-lg border border-slate-800 p-2 overflow-hidden flex flex-col justify-between shadow-inner">
                        {isPlaying && (
                          <div className="absolute top-1.5 left-2.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[8px] font-mono font-bold animate-pulse flex items-center gap-1 z-10 select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>TIME-LAPSE SYNCHRONIZED SWEEP</span>
                          </div>
                        )}
                        <svg 
                          ref={svgRef}
                          onMouseDown={startDrag}
                          onMouseMove={doDrag}
                          onMouseUp={stopDrag}
                          onMouseLeave={stopDrag}
                          onTouchStart={startDrag}
                          onTouchMove={doDrag}
                          onTouchEnd={stopDrag}
                          className="w-full h-full overflow-visible select-none cursor-row-resize" 
                          viewBox="0 0 520 85"
                        >
                          {/* Sea Level Baseline */}
                          <line x1="0" y1="62" x2="520" y2="62" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3,3" />

                          {/* Distance X-Axis Labels */}
                          {[
                            { x: 20, label: '0km' },
                            { x: 90, label: '20km' },
                            { x: 180, label: '45km' },
                            { x: 260, label: '65km' },
                            { x: 340, label: '85km' },
                            { x: 420, label: '110km' },
                            { x: 500, label: '140km' }
                          ].map((lbl, idx) => (
                            <text key={idx} x={lbl.x} y="80" textAnchor="middle" fontSize="5.5" fill="#64748b" fontFamily="monospace">
                              {lbl.label}
                            </text>
                          ))}

                          {/* Topographic Curve Fill & Stroke */}
                          <g>
                            <path d={areaD} fill="url(#terrainGrad2)" opacity="0.4" />
                            <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                            <defs>
                              <linearGradient id="terrainGrad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#022c22" />
                              </linearGradient>
                            </defs>

                            {/* Dynamic Vertical Borehole under the Discovery Quarry Locality (Linking Surface & Subsurface) */}
                            {(() => {
                              const boreholeBottomY = 78;
                              const drillY = quarryY + (activeDepthM / 350) * (boreholeBottomY - quarryY);
                              return (
                                <g>
                                  {/* Borehole Vertical Shaft (dashed purple line) */}
                                  <line 
                                    x1={quarryX} 
                                    y1={quarryY} 
                                    x2={quarryX} 
                                    y2={boreholeBottomY} 
                                    stroke="#c084fc" 
                                    strokeWidth="1.2" 
                                    strokeDasharray="2,2" 
                                    opacity="0.85"
                                  />
                                  {/* Drilling target bit indicator */}
                                  <circle 
                                    cx={quarryX} 
                                    cy={drillY} 
                                    r="3.5" 
                                    fill="#a855f7" 
                                    stroke="#ffffff" 
                                    strokeWidth="1" 
                                    className="animate-pulse"
                                  />
                                  {/* Drill bit halo */}
                                  <circle 
                                    cx={quarryX} 
                                    cy={drillY} 
                                    r="6" 
                                    fill="none" 
                                    stroke="#c084fc" 
                                    strokeWidth="0.5" 
                                    opacity="0.5" 
                                  />
                                </g>
                              );
                            })()}

                            {/* Geological Survey Elevation Benchmark Nodes (Diamonds - Distinct from Slicers) */}
                            {pts.map((pt, idx) => (
                              <g 
                                key={idx} 
                                className="cursor-pointer font-sans group/node"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNodeIdx(idx);
                                  setQuarryDistanceKm(pt.distanceKm);
                                  setActiveDatumCutM(pt.altitudeM);
                                  onElevationChange?.(pt.altitudeM);
                                }}
                              >
                                {/* Subtle diamond benchmark marker */}
                                <polygon
                                  points={`${pt.x},${pt.y - 2.5} ${pt.x + 2.5},${pt.y} ${pt.x},${pt.y + 2.5} ${pt.x - 2.5},${pt.y}`}
                                  fill="#1e293b"
                                  stroke="#64748b"
                                  strokeWidth="0.7"
                                />
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={1}
                                  fill="#94a3b8"
                                />
                                {/* Clean altitude tag above node */}
                                <text
                                  x={pt.x}
                                  y={Math.max(6, pt.y - 4.5)}
                                  textAnchor="middle"
                                  fontSize="4.5"
                                  fill="#64748b"
                                  fontFamily="monospace"
                                  className="group-hover/node:fill-emerald-400 font-bold transition-colors select-none"
                                >
                                  {pt.altitudeM}m
                                </text>
                              </g>
                            ))}

                            {/* Discovery Quarry Locality Station (Distinct Red Circle Target Beacon) */}
                            <g className="cursor-ew-resize select-none">
                              {/* Pulsing Beacon Halo */}
                              <circle
                                cx={quarryX}
                                cy={quarryY}
                                r={7}
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="0.8"
                                opacity="0.6"
                                className="animate-pulse"
                              />
                              {/* Quarry Crimson Core Pin */}
                              <circle
                                cx={quarryX}
                                cy={quarryY}
                                r={3.2}
                                fill="#e11d48"
                                stroke="#ffffff"
                                strokeWidth="1.2"
                              />
                              <circle
                                cx={quarryX}
                                cy={quarryY}
                                r={1}
                                fill="#ffffff"
                              />
                              {/* Non-obstructing Badge above quarry */}
                              <g transform={`translate(${Math.max(34, Math.min(486, quarryX))}, ${Math.max(8, quarryY - 7.5)})`}>
                                <rect x="-24" y="-4.5" width="48" height="7.5" rx="1.5" fill="#1e1b4b" stroke="#f43f5e" strokeWidth="0.6" opacity="0.9" />
                                <text x="0" y="1" textAnchor="middle" fontSize="4.2" fill="#fecdd3" fontWeight="bold" fontFamily="monospace">
                                  ★ QUARRY {quarryDistanceKm}km
                                </text>
                              </g>
                            </g>
                          </g>

                          {/* Perforated Line: HORIZONTAL ELEVATION DATUM CUT (Gutter Tab - Non Obstructing) */}
                          {(() => {
                            const datumY = Math.max(10, Math.min(62, 62 - (activeDatumCutM / 1250) * 48));
                            return (
                              <g className="cursor-ns-resize select-none">
                                {isDragging && <rect x="0" y={datumY - 4} width="520" height="8" fill="#10b981" opacity="0.08" />}
                                <line x1="0" y1={datumY} x2="520" y2={datumY} stroke="#10b981" strokeWidth="1.4" strokeDasharray="3,2" />
                                
                                {/* Left Gutter Drag Pull Tab: Sits on margin, distinct & intuitive */}
                                <g>
                                  <rect x="2" y={datumY - 4.5} width="30" height="9" rx="2" fill="#064e3b" stroke="#34d399" strokeWidth="0.8" />
                                  <text x="14" y={datumY + 1.8} textAnchor="middle" fontSize="4.6" fill="#a7f3d0" fontWeight="bold" fontFamily="monospace">
                                    ▲{activeDatumCutM}m
                                  </text>
                                  <line x1="25.5" y1={datumY - 2} x2="25.5" y2={datumY + 2} stroke="#34d399" strokeWidth="0.5" />
                                  <line x1="27.5" y1={datumY - 2} x2="27.5" y2={datumY + 2} stroke="#34d399" strokeWidth="0.5" />
                                </g>
                              </g>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Interactive Discovery Quarry Locality & Transect Slicer Controller */}
                      <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[9px] font-mono">
                          <div className="flex items-center gap-1.5 text-rose-300">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span className="font-bold uppercase tracking-wider">Quarry Locality Slicer:</span>
                            <strong className="text-white bg-slate-950 px-1.5 py-0.5 rounded border border-rose-500/40">
                              {quarryDistanceKm} km Transect
                            </strong>
                            <span className="text-slate-400">({quarryInfo.label})</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 text-[8.5px]">
                            <span>Surface: <strong className="text-emerald-400">{quarryInfo.altitudeM}m ASL</strong></span>
                            <span>·</span>
                            <span>Borehole Depth: <strong className="text-purple-300">{activeDepthM}m</strong></span>
                            <span>·</span>
                            <span>Overburden: <strong className="text-amber-300">{overburdenPressureFormatted}</strong></span>
                          </div>
                        </div>

                        {/* Smooth Slicer for Discovery Quarry along the 0-135km Transect */}
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-mono text-slate-400 shrink-0">0km (Delta)</span>
                          <input
                            type="range"
                            min={0}
                            max={135}
                            step={1}
                            value={quarryDistanceKm}
                            onChange={(e) => {
                              const dist = Number(e.target.value);
                              setQuarryDistanceKm(dist);
                            }}
                            className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-ew-resize"
                          />
                          <span className="text-[8px] font-mono text-slate-400 shrink-0">135km (Peak)</span>
                        </div>

                        {/* Quick Transect Station Anchor Buttons */}
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          <span className="text-[8px] font-mono text-slate-400 mr-1">Transect Stations:</span>
                          {REGIONAL_HYPSOMETRY_PROFILE.map((node, idx) => {
                            const isCurrent = Math.abs(quarryDistanceKm - node.distanceKm) < 5;
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setQuarryDistanceKm(node.distanceKm);
                                  setSelectedNodeIdx(idx);
                                }}
                                className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  isCurrent
                                    ? node.isSite
                                      ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-400'
                                      : 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                                }`}
                              >
                                {node.isSite && <span>★</span>}
                                <span>{node.distanceKm}km</span>
                                <span className="text-[7.5px] opacity-75">({node.label.split(' ')[0]})</span>
                              </button>
                            );
                          })}
                          <button
                            onClick={() => {
                              setActiveDatumCutM(quarryInfo.altitudeM);
                              onElevationChange?.(quarryInfo.altitudeM);
                            }}
                            className="ml-auto px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[8.5px] font-mono font-bold border border-emerald-700/60 transition-colors cursor-pointer"
                            title="Align horizontal elevation slicer to current quarry altitude"
                          >
                            Snap Elevation to Quarry ({quarryInfo.altitudeM}m)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Bottom Facies Bar (Matching Image) */}
              <div className="p-2.5 bg-gradient-to-r from-amber-50 via-white to-emerald-50 rounded-xl border border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-rounded shadow-3xs">
                <div>
                  <span className="text-[9px] font-mono font-bold text-amber-900 uppercase block">FACIES & DEPOSITIONAL PALEO-ENVIRONMENT</span>
                  <p className="text-park-tree font-bold leading-snug">
                    Coastal Plain Deltaic Wetland bordering the Western Interior Seaway
                  </p>
                  <div className="text-[9px] font-mono text-park-ink-muted mt-0.5 flex items-center gap-2">
                    <span>Relief Gradient: <strong className="text-emerald-900">1.8%</strong></span>
                    <span>·</span>
                    <span>Member: <strong className="text-amber-900">{formationName}</strong></span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono font-bold text-[9px] border border-emerald-300 uppercase">
                  SEDIMENTARY STRATUM
                </span>
              </div>
            </div>
          )}

          {/* FEATURE 2: SUBSURFACE LITHOSTRATIGRAPHIC ROCK COLUMN & MATRIX */}
          {(activeTabMode === 'integrated' || activeTabMode === 'strata') && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch min-w-0">
              
              {/* Left Column: Visual Stratigraphic Column Graphic (0-350m Depth) */}
              <div className="md:col-span-5 bg-gradient-to-b from-slate-900 via-[#1b2028] to-stone-900 text-white p-3.5 rounded-xl border border-stone-800/80 flex flex-col justify-between space-y-3 select-none shadow-sm">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 border-b border-stone-800 pb-2">
                  <span className="font-bold flex items-center gap-1.5 text-amber-400">
                    <Layers size={13} />
                    <span>Subsurface Stratum Stack</span>
                  </span>
                  <span className="text-emerald-400 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    Horizon: {activeStratum.depthRangeM[0]}m – {activeStratum.depthRangeM[1]}m
                  </span>
                </div>

                {/* Expanded SVG Stratigraphic Column */}
                <div className="relative w-full h-80 sm:h-96 min-h-[320px] bg-slate-950/90 rounded-xl border border-stone-800 overflow-hidden flex shadow-inner">
                  {/* Depth Axis Scale */}
                  <div className="w-11 bg-slate-950 border-r border-stone-800/80 flex flex-col justify-between py-2.5 text-[8.5px] font-mono text-slate-400 text-right pr-1.5 shrink-0">
                    <span className="text-amber-400 font-bold">0m</span>
                    <span>70m</span>
                    <span>140m</span>
                    <span>210m</span>
                    <span>280m</span>
                    <span className="text-amber-400 font-bold">350m</span>
                  </div>

                  {/* Rock Layers Stack */}
                  <div className="flex-1 relative flex flex-col h-full cursor-pointer overflow-hidden">
                    {STRATIGRAPHIC_ROCK_COLUMN.map((stratum) => {
                      const heightPercent = Math.max(7, ((stratum.depthRangeM[1] - stratum.depthRangeM[0]) / 350) * 100);
                      const isSelected = activeStratum.id === stratum.id;
                      return (
                        <div
                          key={stratum.id}
                          onClick={() => handleStratumClick(stratum)}
                          style={{ 
                            height: `${heightPercent}%`,
                            backgroundColor: isSelected ? `${stratum.color}` : `${stratum.color}c0`,
                            borderColor: isSelected ? '#f59e0b' : `${stratum.color}60`
                          }}
                          className={`relative w-full border-b min-h-[28px] transition-all flex items-center justify-between px-2.5 py-1 group ${
                            isSelected 
                              ? 'ring-2 ring-amber-400 z-10 shadow-lg font-black brightness-110' 
                              : 'hover:brightness-125 opacity-90 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span 
                              className={`text-[9.5px] font-rounded font-bold drop-shadow-md truncate ${
                                isSelected ? 'text-white font-extrabold' : 'text-white/95'
                              }`}
                            >
                              {stratum.rockType.split('/')[0]}
                            </span>
                          </div>
                          <span className="text-[8px] font-mono text-amber-200 shrink-0 bg-slate-950/70 px-1.5 py-0.5 rounded border border-white/20 font-bold shadow-2xs">
                            {stratum.depthRangeM[0]}–{stratum.depthRangeM[1]}m
                          </span>
                        </div>
                      );
                    })}

                    {/* Red Active Depth Horizon Slicer */}
                    {(() => {
                      const topPercent = Math.max(0, Math.min(100, (activeDepthM / 350) * 100));
                      return (
                        <div 
                          style={{ top: `${topPercent}%` }}
                          className="absolute left-0 right-0 -translate-y-1/2 pointer-events-none z-20 flex items-center"
                        >
                          <div className="w-full h-0.5 bg-rose-500 shadow-md border-t border-dashed border-white" />
                          <div className="absolute right-1 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-[8.5px] font-mono font-black px-2 py-0.5 rounded shadow-md border border-white/90 flex flex-col items-end gap-0.5">
                            <span className="font-extrabold">▶ DEPTH: {activeDepthM}m</span>
                            <span className="text-[7.5px] text-amber-200 uppercase tracking-wide">P: {overburdenPressureFormatted}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Streamlined Control Panel */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sliders size={11} />
                      <span>Burial Depth Slicer:</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {[5, 10, 25, 50].map((stepVal) => (
                        <button
                          key={stepVal}
                          onClick={() => setStepIntervalM(stepVal)}
                          className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold transition-all cursor-pointer ${
                            stepIntervalM === stepVal 
                              ? 'bg-amber-500 text-slate-950 font-black shadow-2xs' 
                              : 'bg-stone-800 text-slate-400 hover:text-white hover:bg-stone-700'
                          }`}
                        >
                          ±{stepVal}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => stepDepth(-1)}
                      disabled={activeDepthM <= 0}
                      className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-amber-600 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer transition-colors shadow-2xs"
                      title="Decrease Depth"
                    >
                      <Minus size={11} />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="350"
                      step={stepIntervalM}
                      value={activeDepthM}
                      onChange={(e) => setActiveDepthM(Number(e.target.value))}
                      className="flex-1 accent-amber-500 cursor-pointer h-2 bg-stone-800 rounded-lg shadow-inner"
                    />
                    <button
                      onClick={() => stepDepth(1)}
                      disabled={activeDepthM >= 350}
                      className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-amber-600 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer transition-colors shadow-2xs"
                      title="Increase Depth"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Active Rock Layer Detailed Profile & Taphonomy */}
              <div className="md:col-span-7 bg-[#faf8f2] rounded-xl border border-park-card-border p-3.5 space-y-3 flex flex-col justify-between min-w-0">
                <div>
                  {/* Stratum Header Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-park-card-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3.5 h-3.5 rounded-full shadow-2xs shrink-0" 
                        style={{ backgroundColor: activeStratum.color }} 
                      />
                      <div>
                        <h5 className="text-[12.5px] font-rounded font-extrabold text-park-tree leading-tight">
                          {activeStratum.name}
                        </h5>
                        <span className="text-[9.5px] font-mono text-park-ink-muted">
                          {activeStratum.rockType} • {activeStratum.depthRangeM[0]}m to {activeStratum.depthRangeM[1]}m
                        </span>
                      </div>
                    </div>

                    {activeStratum.radioMetricDatingPossible && (
                      <span className="text-[8.5px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-3xs">
                        <Sparkles size={10} className="text-amber-600" />
                        <span>Isotopic Datable</span>
                      </span>
                    )}
                  </div>

                  {/* Core Lithology Parameters Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-rounded pt-2.5">
                    <div className="p-2 bg-white rounded-lg border border-park-card-border/80 space-y-0.5">
                      <span className="text-[8.5px] font-bold text-park-ink-muted uppercase">Grain Size & Texture</span>
                      <p className="font-mono font-bold text-park-tree text-[10.5px] truncate">{activeStratum.grainSize}</p>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-park-card-border/80 space-y-0.5">
                      <span className="text-[8.5px] font-bold text-park-ink-muted uppercase">Depositional Energy</span>
                      <p className="font-mono font-bold text-amber-900 text-[10.5px] truncate">{activeStratum.depositionalEnergy}</p>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-park-card-border/80 space-y-0.5">
                      <span className="text-[8.5px] font-bold text-park-ink-muted uppercase">Porosity & Compaction</span>
                      <p className="font-mono font-bold text-emerald-800 text-[10.5px]">
                        {activeStratum.porosityPercent}% Porosity ({activeStratum.densityKgM3} kg/m³)
                      </p>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-park-card-border/80 space-y-0.5">
                      <span className="text-[8.5px] font-bold text-park-ink-muted uppercase">Lithostatic Pressure</span>
                      <p className="font-mono font-bold text-indigo-900 text-[10.5px]">{overburdenPressureMpa} MPa Overburden</p>
                    </div>
                  </div>

                  {/* Mineralogy & Environmental Description */}
                  <div className="space-y-1.5 pt-2 text-[10.5px] font-rounded">
                    <div className="p-2 bg-white rounded-lg border border-park-card-border/80 space-y-0.5">
                      <span className="text-[8.5px] font-bold text-park-ink-muted uppercase">Mineralogical Composition</span>
                      <p className="text-park-ink font-medium leading-relaxed">{activeStratum.mineralogy}</p>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-park-card-border/80 space-y-0.5">
                      <span className="text-[8.5px] font-bold text-park-ink-muted uppercase">Depositional Paleoenvironment</span>
                      <p className="text-park-ink font-medium leading-relaxed">{activeStratum.depositionalEnvironment}</p>
                    </div>
                  </div>
                </div>

                {/* Taphonomy, Chrono-Age & Fossil Horizon Banner */}
                {(() => {
                  const estimatedAgeMa = (152.1 - (activeDepthM / 350) * 14.5).toFixed(1);
                  const baseCompleteness = activeStratum.id === 'layer-tuff' ? 98 : activeStratum.id === 'layer-shale' ? 92 : activeStratum.id === 'layer-sandstone' ? 84 : 68;
                  const depthBonus = Math.min(10, Math.round(activeDepthM / 35));
                  const taphonomicScore = Math.min(98, baseCompleteness + depthBonus);

                  return (
                    <div className="p-2.5 bg-gradient-to-r from-amber-100/80 via-white to-emerald-100/70 rounded-xl border border-amber-300/80 space-y-1.5 text-[10px] font-rounded shadow-3xs">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-amber-950 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-emerald-700" />
                          <span>Fossil Taphonomy & Chrono-Stratigraphy</span>
                        </span>
                        <div className="flex items-center gap-1.5 text-[8.5px] font-mono">
                          <span className="bg-amber-900 text-amber-100 px-1.5 py-0.5 rounded font-bold">
                            ~{estimatedAgeMa} Ma
                          </span>
                          <span className="bg-emerald-900 text-emerald-100 px-1.5 py-0.5 rounded font-bold">
                            {taphonomicScore}% Preservation
                          </span>
                        </div>
                      </div>

                      <p className="text-park-ink leading-snug">
                        {activeStratum.taphonomyPreservation}
                      </p>

                      {/* Skeleton Completeness Index Progress Meter */}
                      <div className="space-y-0.5 pt-0.5">
                        <div className="flex items-center justify-between text-[8.5px] font-mono font-bold text-park-ink-muted">
                          <span>Skeleton Articulation & Completeness Probability:</span>
                          <span className="text-emerald-900 font-extrabold">{taphonomicScore}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden flex">
                          <div 
                            style={{ width: `${taphonomicScore}%` }} 
                            className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-600 transition-all duration-300 rounded-full"
                          />
                        </div>
                      </div>

                      <div className="pt-0.5 flex items-center gap-1.5 text-[9px] font-mono text-emerald-900 font-bold">
                        <span className="text-amber-800">Key Fossil Index:</span>
                        <span className="truncate text-park-tree">{activeStratum.fossilIndex}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RockStrataLithologyColumn;
