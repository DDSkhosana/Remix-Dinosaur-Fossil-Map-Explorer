import React, { useState, useMemo } from 'react';
import { 
  Navigation, 
  Calendar, 
  Mountain, 
  Footprints, 
  Activity, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Compass, 
  Plus, 
  Minus, 
  RotateCcw,
  Sparkles,
  Info,
  Scale,
  Zap,
  Gauge,
  Layers,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { PlottingLayerConfig, PlottingSpecializationMode, DEFAULT_PLOTTING_CONFIG } from './PlottingSpecializationLayer';
import { SiteMarker, PaleoData } from '../types';
import { getLocomotionMetricsForDino, calculateFroudeNumber } from '../utils/locomotionKinematics';
import { computeRelativeLocation, formatBearingDisplay } from '../utils/cardinalDirection';

interface InfoPanelLegendHeaderProps {
  config: PlottingLayerConfig;
  onChangeConfig: (newConfig: Partial<PlottingLayerConfig>) => void;
  isIntervalsOpen: boolean;
  onToggleIntervals: () => void;
  markers: SiteMarker[];
  activeSite: PaleoData | null;
  activeTaxaName: string;
  defaultCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
}

export const MODE_TO_DOSSIER_TAB: Record<PlottingSpecializationMode, { tabId: string; label: string; description: string }> = {
  trails: { tabId: 'overview', label: 'Overview', description: 'Excavation summary, geological period, and preservation' },
  migration: { tabId: 'lifecycle', label: 'Migration & Lifecycle', description: 'Ontogeny, waypoint nesting sites, and migration corridors' },
  hypsometry: { tabId: 'elevation', label: 'Elevation Profile', description: 'Topographic altitudinal transect and tectonic basin relief' },
  locomotion: { tabId: 'locomotion', label: 'Gait Dynamics', description: 'Alexander dynamic velocity, stride length, and trackway footprints' },
  density: { tabId: 'inventory', label: 'Strata Inventory', description: 'Cataloged osteological elements, sediment matrix, and fossil density' },
  cardinal: { tabId: 'cardinal', label: 'Cardinal Radar', description: 'True-North azimuths, Great Circle bearings, and geodesic distances' },
};

const getModeLabel = (mode: PlottingSpecializationMode): string => {
  switch (mode) {
    case 'trails': return 'Sites & Buffer';
    case 'migration': return 'Migration Flow';
    case 'hypsometry': return 'Hypsometry';
    case 'locomotion': return 'Gait Tracks';
    case 'density': return 'Density Isopleths';
    case 'cardinal': return 'Cardinal Vectors';
    default: return mode;
  }
};

const getModeIntervalBadge = (cfg: PlottingLayerConfig): string => {
  switch (cfg.mode) {
    case 'trails': return `Δr ${cfg.bufferRadiusKm}km`;
    case 'migration': return `Δt ${cfg.timeSliceInterval}Ma`;
    case 'hypsometry': return `Δh ${cfg.contourIntervalM}m`;
    case 'locomotion': return `Δs ${cfg.strideLengthM}m`;
    case 'density': return `${cfg.densityQuantileBands} bands`;
    case 'cardinal': return cfg.maxNeighbourRadiusKm === 0 ? 'All Digs' : `≤${cfg.maxNeighbourRadiusKm}km`;
    default: return '';
  }
};

const getModeThemeBadgeClass = (mode: PlottingSpecializationMode): string => {
  switch (mode) {
    case 'trails': return 'bg-emerald-700 text-white';
    case 'migration': return 'bg-blue-600 text-white';
    case 'hypsometry': return 'bg-emerald-800 text-white';
    case 'locomotion': return 'bg-amber-700 text-white';
    case 'density': return 'bg-rose-700 text-white';
    case 'cardinal': return 'bg-teal-700 text-white';
    default: return 'bg-slate-800 text-white';
  }
};

export const InfoPanelLegendHeader: React.FC<InfoPanelLegendHeaderProps> = ({
  config,
  onChangeConfig,
  isIntervalsOpen,
  onToggleIntervals,
  markers,
  activeSite,
  activeTaxaName,
  defaultCollapsed = true,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse,
  activeTab,
  onSelectTab
}) => {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dino_legend_intelligence_collapsed');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalIsCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('dino_legend_intelligence_collapsed', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  };

  const [showTheoryDetails, setShowTheoryDetails] = useState<boolean>(true);

  const setMode = (mode: PlottingSpecializationMode) => {
    onChangeConfig({ mode });
  };

  // Helper for stepping numerical interval values
  const stepValue = (
    field: keyof PlottingLayerConfig,
    deltaSign: 1 | -1,
    intervalField: keyof PlottingLayerConfig,
    min: number,
    max: number,
    precision = 1
  ) => {
    const currentVal = (config[field] as number) ?? 0;
    const interval = (config[intervalField] as number) ?? 1;
    let nextVal = currentVal + deltaSign * interval;
    nextVal = Math.max(min, Math.min(max, nextVal));
    const factor = Math.pow(10, precision);
    nextVal = Math.round(nextVal * factor) / factor;
    onChangeConfig({ [field]: nextVal } as Partial<PlottingLayerConfig>);
  };

  // 1. Calculations for Migration Flow
  const migrationStats = useMemo(() => {
    if (markers.length < 2) {
      return { totalDistanceKm: 0, timeSpanMa: 0, impliedVelocityKmPerMa: 0, swathAreaKm2: 0 };
    }
    // Calculate distance along chronological or sequence path
    let dist = 0;
    for (let i = 0; i < markers.length - 1; i++) {
      const rel = computeRelativeLocation(markers[i], markers[i + 1]);
      dist += rel.distanceKm;
    }
    const totalDist = Math.round(dist);
    const timeSlice = Math.max(0.1, config.timeSliceInterval);
    const corridorW = config.corridorWidthKm;
    const swathArea = Math.round(totalDist * corridorW);
    const impliedVelocity = Number((totalDist / timeSlice).toFixed(1));

    return {
      totalDistanceKm: totalDist,
      timeSpanMa: timeSlice,
      impliedVelocityKmPerMa: impliedVelocity,
      swathAreaKm2: swathArea
    };
  }, [markers, config.timeSliceInterval, config.corridorWidthKm]);

  // 2. Calculations for Sites & Buffer
  const bufferStats = useMemo(() => {
    const radius = config.bufferRadiusKm;
    const singleArea = Math.PI * radius * radius;
    // Overlap reduction factor approx
    const totalArea = Math.round(singleArea * markers.length * (markers.length > 1 ? 0.78 : 1.0));
    const viableSites = markers.filter(m => (m.osteologyRecoveryPct || 0) >= config.minRecoveryPercent);
    const density = totalArea > 0 ? ((viableSites.length / totalArea) * 10000).toFixed(2) : '0';

    return {
      radiusKm: radius,
      totalAreaKm2: totalArea,
      viableSitesCount: viableSites.length,
      totalSitesCount: markers.length,
      densityPer10kKm2: density
    };
  }, [markers, config.bufferRadiusKm, config.minRecoveryPercent]);

  // 3. Calculations for Hypsometry
  const hypsometryStats = useMemo(() => {
    const siteElevation = activeSite?.metadata?.elevationMeters ?? 640;
    const intervalM = Math.max(10, config.contourIntervalM);
    const numContours = Math.floor(siteElevation / intervalM);
    // Environmental lapse rate: ~6.5°C per 1000m
    const lapseDropC = Number(((siteElevation / 1000) * 6.5).toFixed(1));
    const estimatedSiteTempC = Number((24.0 - lapseDropC).toFixed(1)); // assuming 24°C datum
    const reliefSpan = config.maxElevationM - config.minElevationM;

    return {
      siteElevationM: siteElevation,
      numContours,
      lapseDropC,
      estimatedSiteTempC,
      reliefSpan
    };
  }, [activeSite, config.contourIntervalM, config.maxElevationM, config.minElevationM]);

  // 4. Calculations for Gait Tracks / Locomotion
  const gaitStats = useMemo(() => {
    const loco = getLocomotionMetricsForDino(activeTaxaName, 'carnivore', 80);
    const hipHeight = loco.hipHeightM || 2.8;
    const stride = config.strideLengthM;
    const g = 9.81;

    // Alexander's formula: v = 0.25 * g^0.5 * stride^1.67 * h^-1.17
    const speedMs = 0.25 * Math.pow(g, 0.5) * Math.pow(stride, 1.67) * Math.pow(hipHeight, -1.17);
    const speedKmh = Number((speedMs * 3.6).toFixed(1));
    const froude = calculateFroudeNumber(speedMs, hipHeight);
    
    let gaitClassification = 'Walk (Low Impact Pelvic Pivot)';
    let gaitColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (froude >= 1.0) {
      gaitClassification = 'Full Cursorial Sprint (Aerial Phase)';
      gaitColor = 'text-rose-700 bg-rose-50 border-rose-300';
    } else if (froude >= 0.5) {
      gaitClassification = 'Suspended Trot / Fast Walk';
      gaitColor = 'text-amber-700 bg-amber-50 border-amber-300';
    }

    const dutyFactor = Math.round((1 / (1 + 0.5 * froude)) * 100);

    return {
      hipHeightM: hipHeight,
      strideLengthM: stride,
      speedKmh,
      speedMs: Number(speedMs.toFixed(2)),
      froudeNumber: froude,
      gaitClassification,
      gaitColor,
      dutyFactor
    };
  }, [activeTaxaName, config.strideLengthM]);

  // 5. Calculations for Density Isopleths
  const densityStats = useMemo(() => {
    const bands = config.densityQuantileBands;
    const bandwidth = config.kernelBandwidthKm;
    const quantileStep = (100 / bands).toFixed(0);
    return {
      bandsCount: bands,
      bandwidthKm: bandwidth,
      quantileStepPercent: quantileStep,
      activeHotspotRank: `Core Iso-Band (${Math.min(95, bands * 18)}th Percentile)`
    };
  }, [config.densityQuantileBands, config.kernelBandwidthKm]);

  // 6. Calculations for Cardinal Vectors
  const cardinalStats = useMemo(() => {
    const activeMarker = markers.find(m => m.name === activeSite?.name) || markers[0];
    if (!activeMarker || markers.length < 2) {
      return { nearestNeighbour: null, furthestNeighbour: null, averageDistKm: 0 };
    }
    const neighbours = markers
      .filter(m => m.id !== activeMarker.id)
      .map(m => computeRelativeLocation(activeMarker, m))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const nearest = neighbours[0] || null;
    const furthest = neighbours[neighbours.length - 1] || null;
    const avgDist = Math.round(neighbours.reduce((acc, n) => acc + n.distanceKm, 0) / neighbours.length);

    return {
      nearestNeighbour: nearest,
      furthestNeighbour: furthest,
      averageDistKm: avgDist
    };
  }, [markers, activeSite]);

  return (
    <div className="w-full bg-white/95 border-2 border-stone-200/90 rounded-2xl shadow-sm overflow-hidden transition-all text-slate-800">
      
      {/* 1. TOP INTERACTIVE LEGEND BAR - EXACT LAYOUT AND STYLING FROM REFERENCE IMAGE */}
      <div className={`p-3 bg-[#faf8f4] ${isCollapsed ? '' : 'border-b border-stone-200/80 space-y-2.5'} transition-all`}>
        <div 
          onClick={handleToggleCollapse}
          className="flex items-center justify-between cursor-pointer select-none group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleCollapse();
            }
          }}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? "Click to expand Plotting Specialization Legend & Intelligence" : "Click to collapse Plotting Specialization Legend & Intelligence"}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500/25 transition-all">
              <Sparkles size={13} className="text-amber-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10.5px] font-rounded font-extrabold uppercase tracking-wider text-stone-700 group-hover:text-stone-900 transition-colors">
                  Plotting Specialization Legend & Intelligence
                </span>
                {isCollapsed && (
                  <span className={`text-[9.5px] font-rounded font-bold px-2 py-0.5 rounded-full ${getModeThemeBadgeClass(config.mode)} shadow-2xs`}>
                    {getModeLabel(config.mode)} • {getModeIntervalBadge(config)}
                  </span>
                )}
              </div>
              {isCollapsed && (
                <span className="text-[9px] font-rounded text-stone-400 group-hover:text-stone-600 transition-colors truncate">
                  Click anywhere to expand plotting controls, mathematical formulas, and interval tuners
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {!isCollapsed && (
              <span className="text-[9px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-stone-200 shadow-2xs hidden sm:inline-block">
                Active: {config.mode.toUpperCase()}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleCollapse();
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-rounded font-bold transition-all bg-white hover:bg-stone-100 border border-stone-200/90 text-stone-700 shadow-2xs cursor-pointer group-hover:border-stone-300"
              title={isCollapsed ? "Expand Plotting Specialization Legend & Intelligence" : "Collapse Plotting Specialization Legend & Intelligence"}
            >
              <span>{isCollapsed ? "Expand" : "Collapse"}</span>
              {isCollapsed ? <ChevronDown size={13} className="text-stone-600" /> : <ChevronUp size={13} className="text-stone-600" />}
            </button>
          </div>
        </div>

        {/* When not collapsed, render 2-Row Legend matching user reference image */}
        {!isCollapsed && (
          <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
          {/* Row 1: Sites & Buffer | Migration Flow [Δt 2Ma] | Hypsometry | Gait Tracks */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Mode 1: Sites & Buffer */}
            <button
              onClick={() => setMode('trails')}
              className={`flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                config.mode === 'trails' 
                  ? 'bg-emerald-700 text-white shadow-xs px-3.5 py-1.5 rounded-full font-rounded font-bold text-[11px]' 
                  : 'text-slate-700 hover:text-slate-950 font-rounded font-bold text-[11px] px-1 py-1'
              }`}
              title="Fossil Sites with Geospatial Survey Buffer Intervals"
            >
              <Navigation size={13} className={config.mode === 'trails' ? 'text-white' : 'text-slate-600'} />
              <span>Sites & Buffer</span>
              {config.mode === 'trails' && (
                <span className="text-[9px] font-mono bg-white/25 text-white px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                  Δr {config.bufferRadiusKm}km
                </span>
              )}
            </button>

            {/* Mode 2: Migration Flow */}
            <button
              onClick={() => setMode('migration')}
              className={`flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                config.mode === 'migration' 
                  ? 'bg-blue-600 text-white shadow-xs px-3.5 py-1.5 rounded-full font-rounded font-bold text-[11px]' 
                  : 'text-slate-700 hover:text-slate-950 font-rounded font-bold text-[11px] px-1 py-1'
              }`}
              title="Spatio-Temporal Migration Corridor & Vector Velocity Flow"
            >
              <Calendar size={13} className={config.mode === 'migration' ? 'text-white' : 'text-slate-600'} />
              <span>Migration Flow</span>
              {config.mode === 'migration' && (
                <span className="text-[9px] font-mono bg-blue-500/70 text-white px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                  Δt {config.timeSliceInterval}Ma
                </span>
              )}
            </button>

            {/* Mode 3: Hypsometry */}
            <button
              onClick={() => setMode('hypsometry')}
              className={`flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                config.mode === 'hypsometry' 
                  ? 'bg-emerald-800 text-white shadow-xs px-3.5 py-1.5 rounded-full font-rounded font-bold text-[11px]' 
                  : 'text-slate-700 hover:text-slate-950 font-rounded font-bold text-[11px] px-1 py-1'
              }`}
              title="Paleo-Elevation Hypsometric Contours & Isoline Interval Slicing"
            >
              <Mountain size={13} className={config.mode === 'hypsometry' ? 'text-white' : 'text-slate-600'} />
              <span>Hypsometry</span>
              {config.mode === 'hypsometry' && (
                <span className="text-[9px] font-mono bg-white/25 text-white px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                  Δh {config.contourIntervalM}m
                </span>
              )}
            </button>

            {/* Mode 4: Gait Tracks */}
            <button
              onClick={() => setMode('locomotion')}
              className={`flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                config.mode === 'locomotion' 
                  ? 'bg-amber-700 text-white shadow-xs px-3.5 py-1.5 rounded-full font-rounded font-bold text-[11px]' 
                  : 'text-slate-700 hover:text-slate-950 font-rounded font-bold text-[11px] px-1 py-1'
              }`}
              title="Biomechanical Gait Kinematics & Stride Length Interval"
            >
              <Footprints size={13} className={config.mode === 'locomotion' ? 'text-white' : 'text-slate-600'} />
              <span>Gait Tracks</span>
              {config.mode === 'locomotion' && (
                <span className="text-[9px] font-mono bg-white/25 text-white px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                  Δs {config.strideLengthM}m
                </span>
              )}
            </button>
          </div>

          {/* Row 2: Density Isopleths | Cardinal Vectors ... (right) Intervals ⌵ */}
          <div className="flex items-center justify-between gap-3 w-full pt-1">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              {/* Mode 5: Density Isopleths */}
              <button
                onClick={() => setMode('density')}
                className={`flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                  config.mode === 'density' 
                    ? 'bg-rose-700 text-white shadow-xs px-3.5 py-1.5 rounded-full font-rounded font-bold text-[11px]' 
                    : 'text-slate-700 hover:text-slate-950 font-rounded font-bold text-[11px] px-1 py-1'
                }`}
                title="Paleo-Biodiversity Kernel Density Estimation & Quantile Intervals"
              >
                <Activity size={13} className={config.mode === 'density' ? 'text-white' : 'text-slate-600'} />
                <span>Density Isopleths</span>
                {config.mode === 'density' && (
                  <span className="text-[9px] font-mono bg-white/25 text-white px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                    {config.densityQuantileBands} bands
                  </span>
                )}
              </button>

              {/* Mode 6: Cardinal Vectors */}
              <button
                onClick={() => setMode('cardinal')}
                className={`flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                  config.mode === 'cardinal' 
                    ? 'bg-teal-700 text-white shadow-xs px-3.5 py-1.5 rounded-full font-rounded font-bold text-[11px]' 
                    : 'text-slate-700 hover:text-slate-950 font-rounded font-bold text-[11px] px-1 py-1'
                }`}
                title="Cardinal Directionality & Relative Locality Vectors to Neighbouring Excavation Sites"
              >
                <Compass size={13} className={config.mode === 'cardinal' ? 'text-white' : 'text-slate-600'} />
                <span>Cardinal Vectors</span>
                {config.mode === 'cardinal' && (
                  <span className="text-[9px] font-mono bg-white/25 text-white px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                    {config.maxNeighbourRadiusKm === 0 ? 'All' : `≤${config.maxNeighbourRadiusKm}km`}
                  </span>
                )}
              </button>
            </div>

            {/* Intervals & Slicing button matching user reference image */}
            <button
              onClick={onToggleIntervals}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-rounded font-bold transition-all border select-none cursor-pointer shadow-2xs ${
                isIntervalsOpen
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-[#f7f4ed] hover:bg-[#ece7db] text-slate-700 border-stone-200/90'
              }`}
              title="Intervals & Slicing: Adjust chronostratigraphic time-slices, survey buffer radii, contour altitude steps, and kernel bandwidths"
            >
              <SlidersHorizontal size={13} className={isIntervalsOpen ? "text-white" : "text-slate-600"} />
              <span>Intervals & Slicing</span>
              {isIntervalsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>
        )}

        {/* 1B. Expandable Interactive Intervals & Slicing Control Drawer */}
        {!isCollapsed && isIntervalsOpen && (
          <div className="mt-2 p-3 bg-slate-950 text-white rounded-xl border border-slate-800 space-y-3 animate-in fade-in shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10.5px] font-rounded font-extrabold uppercase tracking-wide">
                <SlidersHorizontal size={12} />
                <span>Intervals & Slicing Tuner • {config.mode.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-slate-400">Step Bin Tuning</span>
                <button
                  onClick={() => onChangeConfig(DEFAULT_PLOTTING_CONFIG)}
                  className="text-[9px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 cursor-pointer"
                  title="Reset to defaults"
                >
                  <RotateCcw size={10} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Mode-Specific Interactive Sliders & Step Interval Buttons */}
            {config.mode === 'trails' && (
              <div className="space-y-2 text-[10px]">
                <div className="flex items-center justify-between font-rounded font-bold">
                  <span className="text-emerald-300 flex items-center gap-1">
                    <Navigation size={11} />
                    <span>Geospatial Survey Buffer Radius (Δr):</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {config.bufferRadiusKm} km
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[10, 25, 50, 100].map((step) => (
                      <button
                        key={step}
                        onClick={() => onChangeConfig({ bufferRadiusInterval: step })}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-all ${
                          config.bufferRadiusInterval === step
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{step}km
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="600"
                    step={config.bufferRadiusInterval || 25}
                    value={config.bufferRadiusKm}
                    onChange={(e) => onChangeConfig({ bufferRadiusKm: Number(e.target.value) })}
                    className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}

            {config.mode === 'migration' && (
              <div className="space-y-2 text-[10px]">
                <div className="flex items-center justify-between font-rounded font-bold">
                  <span className="text-blue-300 flex items-center gap-1">
                    <Calendar size={11} />
                    <span>Chronostratigraphic Time-Slice Interval (Δt):</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {config.timeSliceInterval} Ma
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[0.5, 1.0, 2.0, 5.0].map((step) => (
                      <button
                        key={step}
                        onClick={() => onChangeConfig({ timeSliceInterval: step })}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-all ${
                          config.timeSliceInterval === step
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{step}Ma
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10.0"
                    step="0.5"
                    value={config.timeSliceInterval}
                    onChange={(e) => onChangeConfig({ timeSliceInterval: Number(e.target.value) })}
                    className="flex-1 accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}

            {config.mode === 'hypsometry' && (
              <div className="space-y-2 text-[10px]">
                <div className="flex items-center justify-between font-rounded font-bold">
                  <span className="text-emerald-300 flex items-center gap-1">
                    <Mountain size={11} />
                    <span>Hypsometric Contour Step Interval (Δh):</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {config.contourIntervalM} m
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[25, 50, 100, 250].map((step) => (
                      <button
                        key={step}
                        onClick={() => onChangeConfig({ contourIntervalM: step })}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-all ${
                          config.contourIntervalM === step
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{step}m
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="500"
                    step="25"
                    value={config.contourIntervalM}
                    onChange={(e) => onChangeConfig({ contourIntervalM: Number(e.target.value) })}
                    className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}

            {config.mode === 'locomotion' && (
              <div className="space-y-2 text-[10px]">
                <div className="flex items-center justify-between font-rounded font-bold">
                  <span className="text-amber-300 flex items-center gap-1">
                    <Footprints size={11} />
                    <span>Kinematic Stride Length (Δs):</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {config.strideLengthM.toFixed(1)} m
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[0.1, 0.2, 0.5, 1.0].map((step) => (
                      <button
                        key={step}
                        onClick={() => onChangeConfig({ strideInterval: step })}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-all ${
                          config.strideInterval === step
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{step}m
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="8.0"
                    step="0.1"
                    value={config.strideLengthM}
                    onChange={(e) => onChangeConfig({ strideLengthM: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}

            {config.mode === 'density' && (
              <div className="space-y-2 text-[10px]">
                <div className="flex items-center justify-between font-rounded font-bold">
                  <span className="text-rose-300 flex items-center gap-1">
                    <Activity size={11} />
                    <span>Kernel Density Bandwidth & Quantile Bands:</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {config.densityBandwidthKm} km • {config.densityQuantileBands} bands
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[3, 5, 8, 12].map((bands) => (
                      <button
                        key={bands}
                        onClick={() => onChangeConfig({ densityQuantileBands: bands })}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-all ${
                          config.densityQuantileBands === bands
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {bands} Bands
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={config.densityBandwidthKm}
                    onChange={(e) => onChangeConfig({ densityBandwidthKm: Number(e.target.value) })}
                    className="flex-1 accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}

            {config.mode === 'cardinal' && (
              <div className="space-y-2 text-[10px]">
                <div className="flex items-center justify-between font-rounded font-bold">
                  <span className="text-teal-300 flex items-center gap-1">
                    <Compass size={11} />
                    <span>Max Proximity Radius Filter:</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {config.maxNeighbourRadiusKm === 0 ? 'Unlimited (All)' : `≤${config.maxNeighbourRadiusKm} km`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[500, 1000, 2000, 0].map((radius) => (
                      <button
                        key={radius}
                        onClick={() => onChangeConfig({ maxNeighbourRadiusKm: radius })}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-all ${
                          config.maxNeighbourRadiusKm === radius
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {radius === 0 ? 'All' : `${radius}km`}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="100"
                    value={config.maxNeighbourRadiusKm}
                    onChange={(e) => onChangeConfig({ maxNeighbourRadiusKm: Number(e.target.value) })}
                    className="flex-1 accent-teal-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. MODE-BASED INTELLIGENCE DOSSIER (Calculations, Logical Relations, Live Mathematical Formulas) */}
      {!isCollapsed && (
        <div className="p-3.5 space-y-3">
        
        {/* Active Mode Title & Core Theme */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-2xs font-bold ${
              config.mode === 'migration' ? 'bg-blue-600' :
              config.mode === 'trails' ? 'bg-emerald-700' :
              config.mode === 'hypsometry' ? 'bg-emerald-800' :
              config.mode === 'locomotion' ? 'bg-amber-700' :
              config.mode === 'density' ? 'bg-rose-700' : 'bg-teal-700'
            }`}>
              {config.mode === 'migration' && <Calendar size={15} />}
              {config.mode === 'trails' && <Navigation size={15} />}
              {config.mode === 'hypsometry' && <Mountain size={15} />}
              {config.mode === 'locomotion' && <Footprints size={15} />}
              {config.mode === 'density' && <Activity size={15} />}
              {config.mode === 'cardinal' && <Compass size={15} />}
            </div>
            <div>
              <h4 className="text-[12px] font-rounded font-extrabold text-slate-900">
                {config.mode === 'migration' && 'Spatio-Temporal Migration Corridor Analysis'}
                {config.mode === 'trails' && 'Geospatial Excavation Buffer & Survey Coverage'}
                {config.mode === 'hypsometry' && 'Hypsometric Contours & Atmospheric Lapse Cooling'}
                {config.mode === 'locomotion' && 'Biomechanical Gait Kinematics & Stride Dynamics'}
                {config.mode === 'density' && 'Kernel Density Isopleths & Spatial Clustering'}
                {config.mode === 'cardinal' && 'Cardinal Directionality & Relative Locality Bearing'}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">
                {config.mode === 'migration' && 'Chrono-stratigraphic vector flow across evolutionary time slices'}
                {config.mode === 'trails' && 'Preservation viability filtering and radial catchment basin area'}
                {config.mode === 'hypsometry' && 'Paleo-altitude isoline slices and environmental temperature gradient'}
                {config.mode === 'locomotion' && 'Alexander equation dynamic speed calculation and Froude duty factor'}
                {config.mode === 'density' && 'Bivariate Gaussian kernel probability volume and hot-spot rank'}
                {config.mode === 'cardinal' && 'Great Circle forward azimuths and reciprocal return bearings'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onSelectTab && (
              <button
                onClick={() => {
                  const targetTab = MODE_TO_DOSSIER_TAB[config.mode].tabId;
                  onSelectTab(targetTab);
                  const el = document.getElementById('field-journal-tab-group');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
                className={`text-[9.5px] font-rounded font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                  activeTab === MODE_TO_DOSSIER_TAB[config.mode].tabId
                    ? 'bg-emerald-800 text-white border-emerald-900 ring-2 ring-emerald-400/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                }`}
                title={`Jump directly to the ${MODE_TO_DOSSIER_TAB[config.mode].label} module in the dossier below`}
              >
                <span>{activeTab === MODE_TO_DOSSIER_TAB[config.mode].tabId ? `Active: ${MODE_TO_DOSSIER_TAB[config.mode].label}` : `Jump to ${MODE_TO_DOSSIER_TAB[config.mode].label}`}</span>
                <ArrowRight size={11} className="text-amber-300" />
              </button>
            )}

            <button
              onClick={() => setShowTheoryDetails(!showTheoryDetails)}
              className="text-[9.5px] font-rounded font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/80 cursor-pointer"
            >
              <span>{showTheoryDetails ? 'Compact' : 'Show Theory'}</span>
              {showTheoryDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>
        </div>

        {/* 3. LOGICAL RELATIONS & FORMULAE CONTAINER */}
        {showTheoryDetails && (
          <div className="bg-[#fcfbf7] p-2.5 rounded-xl border border-stone-200/90 space-y-2 text-[10.5px]">
            <div className="flex items-center justify-between text-[10px] font-rounded font-bold text-stone-700">
              <span className="flex items-center gap-1.5 text-stone-800 uppercase tracking-wider font-extrabold">
                <Scale size={12} className="text-amber-700" />
                <span>Mathematical Logic & Formal Relations</span>
              </span>
              <span className="font-mono text-[9px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 border border-stone-200">
                Peer-Reviewed Physics & Stratigraphy
              </span>
            </div>

            {/* MIGRATION LOGICAL RELATIONS */}
            {config.mode === 'migration' && (
              <div className="space-y-1.5">
                <div className="bg-white p-2 rounded-lg border border-stone-200/80 font-mono text-[10px] text-blue-900 flex items-center justify-between">
                  <span>Dispersal Velocity Formula:</span>
                  <span className="font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                    v = Δd / Δt = {migrationStats.totalDistanceKm}km / {migrationStats.timeSpanMa}Ma = {migrationStats.impliedVelocityKmPerMa} km/Ma
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/70">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">Corridor Dispersion Area</span>
                    <span className="font-mono font-bold text-slate-800">
                      A = W × L = {config.corridorWidthKm}km × {migrationStats.totalDistanceKm}km = {migrationStats.swathAreaKm2.toLocaleString()} km²
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/70">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">Temporal Velocity Scaling</span>
                    <span className="font-mono font-bold text-blue-700">
                      Animation rate: {config.flowVelocityScale.toFixed(2)}× real-time flow
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 italic">
                  *Logical Relation: Shorter time-slice intervals (Δt) yield higher localized dispersal vector resolutions across chronostratigraphic horizons.
                </p>
              </div>
            )}

            {/* SITES & BUFFER LOGICAL RELATIONS */}
            {config.mode === 'trails' && (
              <div className="space-y-1.5">
                <div className="bg-white p-2 rounded-lg border border-stone-200/80 font-mono text-[10px] text-emerald-900 flex items-center justify-between">
                  <span>Survey Catchment Area:</span>
                  <span className="font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    A = Σ π(Δr)² · (1 - k_ovlp) ≈ {bufferStats.totalAreaKm2.toLocaleString()} km²
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/70">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">Preservation Filter Viability</span>
                    <span className="font-mono font-bold text-slate-800">
                      {bufferStats.viableSitesCount} of {bufferStats.totalSitesCount} sites qualified (≥{config.minRecoveryPercent}%)
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/70">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">Fossil Catchment Locality Density</span>
                    <span className="font-mono font-bold text-emerald-700">
                      ρ = {bufferStats.densityPer10kKm2} sites / 10,000 km²
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 italic">
                  *Logical Relation: Incrementing survey radius (Δr) expands taphonomic boundary buffers; increasing minimum recovery filter excludes degraded bonebeds.
                </p>
              </div>
            )}

            {/* HYPSOMETRY LOGICAL RELATIONS */}
            {config.mode === 'hypsometry' && (
              <div className="space-y-1.5">
                <div className="bg-white p-2 rounded-lg border border-stone-200/80 font-mono text-[10px] text-emerald-900 flex items-center justify-between">
                  <span>Atmospheric Temperature Lapse:</span>
                  <span className="font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    T(h) = T₀ - (6.5°C/km × h) = 24°C - {hypsometryStats.lapseDropC}°C = {hypsometryStats.estimatedSiteTempC}°C
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/70">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">Active Formation Relief</span>
                    <span className="font-mono font-bold text-slate-800">
                      {hypsometryStats.siteElevationM}m a.s.l. ({hypsometryStats.numContours} isolines @ Δh {config.contourIntervalM}m)
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/70">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">Basin Altitude Ceiling</span>
                    <span className="font-mono font-bold text-amber-700">
                      Ceiling: {config.maxElevationM}m (Δh span: {hypsometryStats.reliefSpan}m)
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 italic">
                  *Logical Relation: Finer contour interval slicing (Δh) uncovers micro-drainage channels and upland altitudinal speciation boundaries.
                </p>
              </div>
            )}

            {/* GAIT TRACKS LOGICAL RELATIONS */}
            {config.mode === 'locomotion' && (
              <div className="space-y-1.5">
                <div className="bg-white p-2 rounded-lg border border-stone-200/80 font-mono text-[10px] text-amber-950 flex items-center justify-between">
                  <span>Alexander Locomotion Dynamic Velocity:</span>
                  <span className="font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                    v ≈ 0.25 g^0.5 · λ^1.67 · h^-1.17 = {gaitStats.speedKmh} km/h ({gaitStats.speedMs} m/s)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/70">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">Dimensionless Froude Number</span>
                    <span className="font-mono font-bold text-slate-800">
                      Fr = v² / (g·h) = {gaitStats.froudeNumber} (Duty factor: {gaitStats.dutyFactor}%)
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/70">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">Dynamic Kinematic Regime</span>
                    <span className={`font-mono font-bold px-1 py-0.2 rounded border text-[9px] ${gaitStats.gaitColor}`}>
                      {gaitStats.gaitClassification}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 italic">
                  *Logical Relation: When Froude Fr &lt; 0.5, locomotion is strictly walking; 0.5 ≤ Fr &lt; 1.0 represents a fast trot; Fr ≥ 1.0 requires an aerial running stride.
                </p>
              </div>
            )}

            {/* DENSITY ISOPLETHS LOGICAL RELATIONS */}
            {config.mode === 'density' && (
              <div className="space-y-1.5">
                <div className="bg-white p-2 rounded-lg border border-stone-200/80 font-mono text-[10px] text-rose-900 flex items-center justify-between">
                  <span>Bivariate Gaussian Kernel Density:</span>
                  <span className="font-bold bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                    f̂(x,y) = (2π n h²)⁻¹ Σ exp(-d_i² / 2h²) @ h={densityStats.bandwidthKm}km
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/70">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">Quantile Band Slices</span>
                    <span className="font-mono font-bold text-slate-800">
                      {densityStats.bandsCount} nested bands ({densityStats.quantileStepPercent}% volume increments)
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/70">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">Active Site Density Quantile</span>
                    <span className="font-mono font-bold text-rose-700">
                      {densityStats.activeHotspotRank}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 italic">
                  *Logical Relation: Smaller kernel bandwidth (h) reveals fine localized fossil clusters; larger bandwidth smooths macro-paleo-basin richness.
                </p>
              </div>
            )}

            {/* CARDINAL VECTORS LOGICAL RELATIONS */}
            {config.mode === 'cardinal' && (
              <div className="space-y-1.5">
                <div className="bg-white p-2 rounded-lg border border-stone-200/80 font-mono text-[10px] text-teal-900 flex items-center justify-between">
                  <span>Great Circle Forward Azimuth Formula:</span>
                  <span className="font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                    θ = atan2(sin Δλ cos φ₂, cos φ₁ sin φ₂ - sin φ₁ cos φ₂ cos Δλ)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/70">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">Nearest Contemporaneous Dig</span>
                    <span className="font-mono font-bold text-slate-800 truncate block">
                      {cardinalStats.nearestNeighbour ? (
                        `${cardinalStats.nearestNeighbour.targetSiteName}: ${cardinalStats.nearestNeighbour.distanceKm}km (${cardinalStats.nearestNeighbour.cardinal} ${Math.round(cardinalStats.nearestNeighbour.azimuthDeg)}°)`
                      ) : 'No neighbours within range'}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/70">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">Reciprocal Return Bearing</span>
                    <span className="font-mono font-bold text-teal-700 truncate block">
                      {cardinalStats.nearestNeighbour ? (
                        `Return: ${cardinalStats.nearestNeighbour.reciprocalCardinal} (${Math.round(cardinalStats.nearestNeighbour.reciprocalAzimuthDeg)}°)`
                      ) : 'N/A'}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 italic">
                  *Logical Relation: Reciprocal azimuth relation θ_return = (θ + 180°) mod 360° establishes bi-directional paleo-geographic vectors.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. REAL-TIME INTERVAL MANIPULATION STRIP (Direct Interactivity) */}
        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-rounded font-bold text-stone-700">
            <span className="flex items-center gap-1.5 text-slate-800">
              <SlidersHorizontal size={11} className="text-stone-600" />
              <span>Direct Interval Tuning for {config.mode.toUpperCase()}:</span>
            </span>
            <button
              onClick={() => onChangeConfig(DEFAULT_PLOTTING_CONFIG)}
              className="text-[9px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              title="Reset Intervals"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          </div>

          {/* Quick step buttons and slider depending on mode */}
          {config.mode === 'migration' && (
            <div className="flex items-center justify-between gap-2 text-[9.5px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-bold">Step Δt:</span>
                {[0.5, 1.0, 2.0, 5.0].map((step) => (
                  <button
                    key={step}
                    onClick={() => onChangeConfig({ timeSliceInterval: step })}
                    className={`px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                      config.timeSliceInterval === step
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    ±{step}Ma
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 font-mono">
                <button
                  onClick={() => stepValue('timeSliceInterval', -1, 'timeSliceInterval', 0.5, 10.0, 1)}
                  className="w-6 h-6 rounded bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <Minus size={11} />
                </button>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded font-bold border border-blue-200">
                  {config.timeSliceInterval} Ma
                </span>
                <button
                  onClick={() => stepValue('timeSliceInterval', 1, 'timeSliceInterval', 0.5, 10.0, 1)}
                  className="w-6 h-6 rounded bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          )}

          {config.mode === 'trails' && (
            <div className="flex items-center justify-between gap-2 text-[9.5px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-bold">Step Δr:</span>
                {[10, 25, 50, 100].map((step) => (
                  <button
                    key={step}
                    onClick={() => onChangeConfig({ bufferRadiusInterval: step })}
                    className={`px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                      config.bufferRadiusInterval === step
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    ±{step}km
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 font-mono">
                <button
                  onClick={() => stepValue('bufferRadiusKm', -1, 'bufferRadiusInterval', 0, 800, 0)}
                  className="w-6 h-6 rounded bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <Minus size={11} />
                </button>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-900 rounded font-bold border border-emerald-200">
                  {config.bufferRadiusKm} km
                </span>
                <button
                  onClick={() => stepValue('bufferRadiusKm', 1, 'bufferRadiusInterval', 0, 800, 0)}
                  className="w-6 h-6 rounded bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          )}

          {config.mode === 'hypsometry' && (
            <div className="flex items-center justify-between gap-2 text-[9.5px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-bold">Step Δh:</span>
                {[25, 50, 100, 250].map((step) => (
                  <button
                    key={step}
                    onClick={() => onChangeConfig({ contourIntervalM: step })}
                    className={`px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                      config.contourIntervalM === step
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    ±{step}m
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 font-mono">
                <button
                  onClick={() => stepValue('contourIntervalM', -1, 'contourStepInterval', 25, 1000, 0)}
                  className="w-6 h-6 rounded bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <Minus size={11} />
                </button>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-900 rounded font-bold border border-emerald-200">
                  {config.contourIntervalM} m
                </span>
                <button
                  onClick={() => stepValue('contourIntervalM', 1, 'contourStepInterval', 25, 1000, 0)}
                  className="w-6 h-6 rounded bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          )}

          {config.mode === 'locomotion' && (
            <div className="flex items-center justify-between gap-2 text-[9.5px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-bold">Step Δs:</span>
                {[0.1, 0.2, 0.5, 1.0].map((step) => (
                  <button
                    key={step}
                    onClick={() => onChangeConfig({ strideLengthInterval: step })}
                    className={`px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                      config.strideLengthInterval === step
                        ? 'bg-amber-700 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    ±{step}m
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 font-mono">
                <button
                  onClick={() => stepValue('strideLengthM', -1, 'strideLengthInterval', 0.5, 8.0, 1)}
                  className="w-6 h-6 rounded bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <Minus size={11} />
                </button>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-900 rounded font-bold border border-amber-200">
                  {config.strideLengthM.toFixed(1)} m
                </span>
                <button
                  onClick={() => stepValue('strideLengthM', 1, 'strideLengthInterval', 0.5, 8.0, 1)}
                  className="w-6 h-6 rounded bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          )}

          {config.mode === 'density' && (
            <div className="flex items-center justify-between gap-2 text-[9.5px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-bold">Quantile Bands:</span>
                {[3, 4, 5, 7].map((b) => (
                  <button
                    key={b}
                    onClick={() => onChangeConfig({ densityQuantileBands: b })}
                    className={`px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                      config.densityQuantileBands === b
                        ? 'bg-rose-700 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {b} bands
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 font-mono">
                <span className="text-slate-500 text-[8.5px]">Bandwidth:</span>
                <button
                  onClick={() => stepValue('kernelBandwidthKm', -1, 'bandwidthInterval', 50, 800, 0)}
                  className="w-6 h-6 rounded bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <Minus size={11} />
                </button>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-900 rounded font-bold border border-rose-200">
                  {config.kernelBandwidthKm} km
                </span>
                <button
                  onClick={() => stepValue('kernelBandwidthKm', 1, 'bandwidthInterval', 50, 800, 0)}
                  className="w-6 h-6 rounded bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          )}

          {config.mode === 'cardinal' && (
            <div className="flex items-center justify-between gap-2 text-[9.5px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-bold">Max Radius:</span>
                {[500, 1000, 2000, 0].map((rad) => (
                  <button
                    key={rad}
                    onClick={() => onChangeConfig({ maxNeighbourRadiusKm: rad })}
                    className={`px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                      config.maxNeighbourRadiusKm === rad
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {rad === 0 ? 'All Digs' : `≤${rad}km`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 font-mono">
                <span className="text-slate-500 text-[8.5px]">Format:</span>
                {(['both', 'cardinal', 'degrees'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onChangeConfig({ cardinalBearingMode: mode })}
                    className={`px-1.5 py-0.5 rounded text-[8.5px] uppercase font-bold cursor-pointer ${
                      config.cardinalBearingMode === mode
                        ? 'bg-teal-700 text-white'
                        : 'bg-white text-slate-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default InfoPanelLegendHeader;
