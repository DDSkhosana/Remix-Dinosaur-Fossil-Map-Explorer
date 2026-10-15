import React, { useState, useEffect, useMemo } from 'react';
import { OntogenyStage, GrowthCurvePoint, SpatioTemporalWaypoint } from '../types';
import { getLifeCycleForDino } from '../utils/ontogenyLifeCycle';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Calendar, 
  Sparkles, 
  Bone, 
  Zap, 
  Compass, 
  Sun, 
  Snowflake, 
  Wind, 
  Layers,
  Activity,
  MapPin,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Footprints,
  SlidersHorizontal,
  RefreshCw,
  BookOpen,
  SkipBack,
  SkipForward,
  FastForward,
  Gauge,
  Clock
} from 'lucide-react';

interface LifeCycleTemporalLapseProps {
  stages?: OntogenyStage[];
  growthCurve?: GrowthCurvePoint[];
  ontogeny?: {
    stages: OntogenyStage[];
    growthCurve: GrowthCurvePoint[];
  };
  migrationLapse?: SpatioTemporalWaypoint[];
  taxaName: string;
  onWaypointSelect?: (wp: SpatioTemporalWaypoint) => void;
  onSelectWaypoint?: (wp: SpatioTemporalWaypoint) => void;
}

export const LifeCycleTemporalLapse: React.FC<LifeCycleTemporalLapseProps> = ({
  stages: stagesProp,
  growthCurve: growthCurveProp,
  ontogeny,
  migrationLapse: migrationLapseProp,
  taxaName,
  onWaypointSelect,
  onSelectWaypoint
}) => {
  const fallbackPkg = getLifeCycleForDino(taxaName, { lat: 47.0, lng: -106.0 });
  const stages = stagesProp || ontogeny?.stages || fallbackPkg.stages;
  const growthCurve = growthCurveProp || ontogeny?.growthCurve || fallbackPkg.growthCurve;
  const migrationLapse = migrationLapseProp || fallbackPkg.migrationLapse;
  const handleWaypointSelect = onSelectWaypoint || onWaypointSelect;

  const [selectedStageIdx, setSelectedStageIdx] = useState(2); // Default to Juvenile
  const [lapsePlaying, setLapsePlaying] = useState(false);
  const [activeWaypointIdx, setActiveWaypointIdx] = useState(1); // Default to Q2
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5x, 1x, 2x, 4x

  // Step seasonal waypoint forward or backward
  const handleStepWaypoint = (direction: -1 | 1) => {
    setActiveWaypointIdx(prev => {
      const next = prev + direction;
      if (next < 0) {
        setSelectedStageIdx(s => (s - 1 + stages.length) % stages.length);
        return dynamicMigrationLapse.length - 1;
      }
      if (next >= dynamicMigrationLapse.length) {
        setSelectedStageIdx(s => (s + 1) % stages.length);
        return 0;
      }
      return next;
    });
  };

  // Step ontogenetic stage forward or backward
  const handleStepStage = (direction: -1 | 1) => {
    setSelectedStageIdx(prev => (prev + direction + stages.length) % stages.length);
  };

  // Interactive Units & Curve Point Selection
  const [massUnit, setMassUnit] = useState<'kg' | 'lbs' | 'tons'>('kg');
  const [lengthUnit, setLengthUnit] = useState<'m' | 'ft'>('m');
  const [selectedCurvePoint, setSelectedCurvePoint] = useState<GrowthCurvePoint | null>(null);
  const [showGrowthTooltips, setShowGrowthTooltips] = useState<boolean>(false);

  const activeStage = stages[selectedStageIdx] || stages[0];

  // Dynamically tailor spatial annual migration waypoints to the currently active growth stage
  const dynamicMigrationLapse = useMemo(() => {
    return migrationLapse.map((wp, idx) => {
      let activity = wp.ecologicalActivity;
      let elevation = wp.paleoElevationM;
      let lat = wp.lat;
      let lng = wp.lng;
      let mobilityRadiusKm = 450;

      if (selectedStageIdx === 0) { // Egg/Ovum Stage
        activity = `Embryo incubating in subterranean nest clutch. 100% stationary; brooding parental pair provides thermoregulation and territorial defense.`;
        elevation = Math.round(wp.paleoElevationM * 1.1);
        const nestingGround = migrationLapse[0] || wp;
        lat = nestingGround.lat;
        lng = nestingGround.lng;
        mobilityRadiusKm = 0;
      } else if (selectedStageIdx === 1) { // Hatchling Stage
        activity = `Precocial hatchling foraging in dense riparian understory ferns within 500m of natal nesting zone; guarded by sub-adult nursery creches.`;
        elevation = wp.paleoElevationM;
        mobilityRadiusKm = 2;
      } else if (selectedStageIdx === 2) { // Juvenile Stage
        activity = `Fast-paced hyper-cursorial sub-herd. Pursues small vertebrates, ornithopods, and lizards along floodplain margins independently of adults.`;
        elevation = Math.round(wp.paleoElevationM * 0.95);
        mobilityRadiusKm = 120;
      } else if (selectedStageIdx === 3) { // Sub-Adult Stage
        activity = `Rapid exponential growth phase. Active predatory dispersals across seasonal braided river corridors, ambushing medium hadrosaur herds.`;
        elevation = wp.paleoElevationM;
        mobilityRadiusKm = 300;
      } else if (selectedStageIdx === 4) { // Adult Apex Stage
        activity = `Dominant apex territorial patrols. Long-range trans-continental migrations tracking migratory ceratopsian and titanosaur breeding aggregations.`;
        elevation = wp.paleoElevationM;
        mobilityRadiusKm = 550;
      } else { // Senescent Mega-Specimen
        activity = `Elder solitary mega-predator restricted to low-energy lowland oxbow lakes and dense palm gallery forests; scavenges large carcasses.`;
        elevation = Math.max(10, Math.round(wp.paleoElevationM * 0.7));
        mobilityRadiusKm = 80;
      }

      return {
        ...wp,
        ecologicalActivity: activity,
        paleoElevationM: elevation,
        lat,
        lng,
        mobilityRadiusKm
      };
    });
  }, [migrationLapse, selectedStageIdx]);

  const activeWaypoint = dynamicMigrationLapse[activeWaypointIdx] || dynamicMigrationLapse[0];

  // Auto-play synchronized animation loop with dynamic playback speed
  useEffect(() => {
    if (!lapsePlaying) return;
    const intervalMs = Math.max(250, Math.round(1600 / playbackSpeed));
    const timer = setInterval(() => {
      setActiveWaypointIdx(prevWp => {
        const nextWp = (prevWp + 1) % dynamicMigrationLapse.length;
        if (nextWp === 0) {
          // Advance to next ontogenetic stage when a full 4-quarter year cycle completes
          setSelectedStageIdx(prevStg => (prevStg + 1) % stages.length);
        }
        return nextWp;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [lapsePlaying, playbackSpeed, dynamicMigrationLapse.length, stages.length]);

  // Sync active waypoint selection to external map if listener provided
  useEffect(() => {
    if (activeWaypoint && handleWaypointSelect) {
      handleWaypointSelect(activeWaypoint);
    }
  }, [activeWaypoint, handleWaypointSelect]);

  // Sync default growth curve point when stage changes
  useEffect(() => {
    if (!growthCurve || growthCurve.length === 0) return;
    const stageAge = activeStage.ageYearsNum;
    const matchingPoint = growthCurve.find(pt => {
      const rangeNums = activeStage.ageRangeYears.match(/\d+/g);
      if (rangeNums && rangeNums.length >= 2) {
        const min = parseInt(rangeNums[0]);
        const max = parseInt(rangeNums[1]);
        return pt.ageYears >= min && pt.ageYears <= max;
      }
      return pt.ageYears === stageAge;
    }) || growthCurve[0];
    setSelectedCurvePoint(matchingPoint);
  }, [selectedStageIdx, activeStage, growthCurve]);

  // Format mass helper
  const formatMass = (massKg: number) => {
    if (massUnit === 'lbs') return `${Math.round(massKg * 2.20462).toLocaleString()} lbs`;
    if (massUnit === 'tons') return `${(massKg / 1000).toFixed(2)} t`;
    return `${massKg.toLocaleString()} kg`;
  };

  // Format length helper
  const formatLength = (lengthM: number) => {
    if (lengthUnit === 'ft') return `${(lengthM * 3.28084).toFixed(1)} ft`;
    return `${lengthM.toFixed(1)} m`;
  };

  // Season icon dispatcher
  const getSeasonIcon = (idx: number) => {
    switch (idx) {
      case 0: return <Sun size={12} className="text-amber-500" />;
      case 1: return <Sun size={12} className="text-orange-500" />;
      case 2: return <Wind size={12} className="text-emerald-500" />;
      case 3: return <Snowflake size={12} className="text-sky-500" />;
      default: return <Calendar size={12} className="text-purple-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-park-card-border p-3.5 sm:p-4 shadow-xs space-y-3.5">
      {/* 1. Master Coordinated Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-park-card-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-600 shadow-2xs shrink-0">
            <Activity size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-rounded font-extrabold text-park-accent-green uppercase tracking-wider">
                Ontogeny & Phenology
              </span>
              <span className="text-slate-400 text-[10px]" aria-hidden="true">·</span>
              <span className="text-[9.5px] font-mono font-bold text-purple-900 bg-purple-100/80 px-2 py-0.2 rounded-md border border-purple-300/60">
                Stage {selectedStageIdx + 1}/{stages.length}
              </span>
            </div>
            <h4 className="text-[13px] sm:text-[14px] font-rounded font-extrabold text-park-tree leading-snug">
              Ontogeny & Seasonal Migration Synchronizer
            </h4>
            <p className="text-[10px] font-rounded text-park-ink-muted leading-tight">
              Bi-directionally coordinated developmental osteology, mass growth curve & quarterly spatial range
            </p>
          </div>
        </div>

        {/* Master Synchronized Status & Play/Pause Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Main Info Pills directly linked to sync lapse toggler */}
          <div className="flex items-center gap-1.5 bg-park-card-muted/80 p-1 rounded-xl border border-park-card-border/60 text-[10px] font-mono">
            <span className="text-[9.5px] font-rounded font-extrabold text-purple-900 px-1.5">
              {activeStage.stageName.split('(')[0].trim()}
            </span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="font-bold text-purple-950 px-1 text-[9.5px]">{activeStage.ageRangeYears}</span>
            <button
              onClick={() => setMassUnit(u => u === 'kg' ? 'lbs' : u === 'lbs' ? 'tons' : 'kg')}
              className="px-2 py-0.5 bg-white border border-purple-200/80 rounded-lg font-bold text-purple-800 active:scale-95 text-[9px] transition-all cursor-pointer hover:bg-purple-50 shadow-3xs"
              title="Click to toggle mass unit (kg / lbs / tons)"
            >
              {formatMass(activeStage.bodyMassKg)}
            </button>
            <button
              onClick={() => setLengthUnit(l => l === 'm' ? 'ft' : 'm')}
              className="px-2 py-0.5 bg-white border border-purple-200/80 rounded-lg font-bold text-slate-700 active:scale-95 text-[9px] transition-all cursor-pointer hover:bg-slate-50 shadow-3xs"
              title="Click to toggle length unit (m / ft)"
            >
              {formatLength(activeStage.bodyLengthM)}
            </button>
          </div>

          <button
            onClick={() => setLapsePlaying(!lapsePlaying)}
            className={`px-3 py-1.5 rounded-xl text-[10.5px] font-rounded font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              lapsePlaying 
                ? 'bg-rose-500 text-white animate-pulse' 
                : 'bg-park-tree text-white hover:bg-park-tree/90'
            }`}
            title="Auto-scrub through the annual migration seasons in sync with ontogeny"
          >
            {lapsePlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{lapsePlaying ? 'Pause Sync' : 'Play Synced Lapse'}</span>
          </button>
        </div>
      </div>

      {/* NEW MASTER TOP PANEL: Interactive Von Bertalanffy Growth Curve */}
      <div className="bg-white p-3 rounded-2xl border border-purple-100 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <span className="flex items-center gap-1.5 text-[10.5px] font-rounded font-extrabold text-slate-700 uppercase">
            <TrendingUp size={13} className="text-purple-600 animate-pulse" />
            <span>Master Lifespan Ontogeny Timeline (Von Bertalanffy Growth Curve - Synced to Lapse!)</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrowthTooltips(!showGrowthTooltips)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9.5px] font-rounded font-bold transition-all cursor-pointer ${
                showGrowthTooltips
                  ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                  : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200'
              }`}
              title="Toggle interactive explanatory guide tooltips across the growth curve"
            >
              <BookOpen size={10} />
              <span>Guide: {showGrowthTooltips ? 'Active' : 'Off'}</span>
            </button>

            <button
              onClick={() => setLapsePlaying(!lapsePlaying)}
              className={`px-3 py-1 rounded-lg text-[10.5px] font-rounded font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-3xs ${
                lapsePlaying 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-park-tree text-white hover:bg-park-tree/95'
              }`}
              title="Click to play or pause the coupled growth and seasonal migration timelapse"
            >
              {lapsePlaying ? <Pause size={11} /> : <Play size={11} />}
              <span>{lapsePlaying ? 'Pause Sync' : 'Play Synced Lapse'}</span>
            </button>
            <span className="text-[9px] font-mono text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
              {selectedCurvePoint ? `Year ${selectedCurvePoint.ageYears}: ${formatMass(selectedCurvePoint.massKg)}` : 'Interactive - Click any age point!'}
            </span>
          </div>
        </div>

        {/* Toggleable Tooltips Guide Overlay for Von Bertalanffy Curve */}
        {showGrowthTooltips && (
          <div className="p-2.5 bg-purple-50/70 rounded-xl border border-purple-200/50 text-[10px] leading-relaxed space-y-1 text-purple-950 font-rounded">
            <div className="font-extrabold text-purple-900 flex items-center gap-1">
              <Sparkles size={11} className="text-purple-600 animate-pulse" />
              <span>Lifespan Growth Timeline Explanatory Guide</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[9px]">
              <li><strong className="text-purple-900">Von Bertalanffy Math Mode</strong>: Calculates the sigmoidal metabolic saturation limit where bone growth slows and reaches asymptotic adult mass.</li>
              <li><strong className="text-purple-900">Age Circles (1y-30y)</strong>: Click any point to automatically select the matching life stage, dimensions, and spatial territory size!</li>
            </ul>
          </div>
        )}

        <div className="relative w-full h-24 bg-slate-50/60 rounded-xl border border-slate-200/80 p-2 flex flex-col justify-between">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 380 50">
            {/* Reference Grid lines */}
            <line x1="0" y1="15" x2="380" y2="15" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="0" y1="30" x2="380" y2="30" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />

            {/* Growth Curve Points */}
            {(() => {
              const maxAge = growthCurve[growthCurve.length - 1]?.ageYears || 30;
              const maxMass = growthCurve[growthCurve.length - 1]?.massKg || 8000;

              const points = growthCurve.map(pt => {
                const x = 20 + (pt.ageYears / maxAge) * 340;
                const y = 42 - (pt.massKg / maxMass) * 36;
                return { x, y, pt };
              });

              const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
              const areaD = `${pathD} L ${points[points.length - 1].x} 48 L ${points[0].x} 48 Z`;

              return (
                <>
                  <path d={areaD} fill="#f3e8ff" opacity="0.45" />
                  <path d={pathD} fill="none" stroke="#7e22ce" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {points.map((p, i) => {
                    const isSelected = selectedCurvePoint?.ageYears === p.pt.ageYears;
                    return (
                      <g 
                        key={i} 
                        className="cursor-pointer group"
                        onClick={() => {
                          setSelectedCurvePoint(p.pt);
                          const stageIdx = stages.findIndex(s => {
                            const rangeNums = s.ageRangeYears.match(/\d+/g);
                            if (rangeNums && rangeNums.length >= 2) {
                              const min = parseInt(rangeNums[0]);
                              const max = parseInt(rangeNums[1]);
                              return p.pt.ageYears >= min && p.pt.ageYears <= max;
                            }
                            return false;
                          });
                          if (stageIdx >= 0) setSelectedStageIdx(stageIdx);
                        }}
                      >
                        <circle cx={p.x} cy={p.y} r="9" fill="transparent" />
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r={isSelected ? 5.5 : p.pt.hasLAG ? 3.5 : 2} 
                          fill={isSelected ? "#f59e0b" : p.pt.hasLAG ? "#9333ea" : "#ffffff"} 
                          stroke={isSelected ? "#b45309" : "#7e22ce"} 
                          strokeWidth={isSelected ? 2.5 : 1.2} 
                        />
                        <text 
                          x={p.x} 
                          y="49" 
                          textAnchor="middle" 
                          fontSize="6" 
                          fill={isSelected ? "#b45309" : "#64748b"} 
                          fontWeight={isSelected ? "bold" : "normal"} 
                          fontFamily="monospace"
                        >
                          {p.pt.ageYears}y
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* 2. Unified Master Dual-Scrubber Progression Ribbon: Ontogeny Stages (1-6) + Annual Seasons (Q1-Q4) */}
      <div className="bg-gradient-to-r from-purple-50/70 via-slate-50 to-amber-50/70 p-2.5 rounded-xl border border-purple-200/70 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-rounded font-extrabold uppercase">
          <div className="flex items-center gap-1.5 text-purple-950">
            <Layers size={12} className="text-purple-600" />
            <span>1. Ontogenetic Life Stage:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-purple-800 bg-purple-100 px-1.5 py-0.2 rounded border border-purple-200">
              Stage {selectedStageIdx + 1}/{stages.length}: {activeStage.ageRangeYears}
            </span>
            <span className="text-[9px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200 font-bold">
              Season: Q{activeWaypointIdx + 1} ({activeWaypoint.seasonMonth.split('(')[0].trim()})
            </span>
          </div>
        </div>

        {/* 6 Stage Compact Connected Stepper Tiles */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {stages.map((stage, idx) => {
            const isSel = selectedStageIdx === idx;
            return (
              <button
                key={stage.id}
                onClick={() => {
                  setSelectedStageIdx(idx);
                  if (lapsePlaying) setLapsePlaying(false);
                }}
                className={`p-1.5 rounded-lg text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[46px] relative ${
                  isSel
                    ? 'bg-purple-700 text-white border-purple-800 shadow-xs ring-2 ring-purple-400/50 scale-[1.02] z-10 font-bold'
                    : 'bg-white border-purple-200/70 text-slate-700 hover:bg-slate-50 shadow-3xs'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8.5px] font-mono font-bold ${
                    isSel ? 'bg-white text-purple-800' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={`text-[8px] font-mono font-bold ${isSel ? 'text-purple-200' : 'text-slate-400'}`}>
                    {stage.ageYearsNum === 0 ? '0y' : `~${stage.ageYearsNum}y`}
                  </span>
                </div>
                <div className="mt-0.5">
                  <div className="text-[9.5px] font-rounded font-extrabold leading-tight truncate">
                    {stage.stageName.split('(')[0].trim()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Coordinated Annual Seasonal Sub-Bar (Q1 to Q4) */}
        <div className="pt-1.5 border-t border-purple-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 text-[9.5px] font-rounded font-bold text-amber-900 uppercase">
            <Compass size={11} className="text-amber-600" />
            <span>2. Coupled Annual Season (Quarterly Cycle):</span>
          </div>
          
          <div className="grid grid-cols-4 gap-1 flex-1 sm:max-w-md">
            {dynamicMigrationLapse.map((wp, idx) => {
              const isCur = activeWaypointIdx === idx;
              return (
                <button
                  key={wp.id}
                  onClick={() => {
                    setActiveWaypointIdx(idx);
                    if (lapsePlaying) setLapsePlaying(false);
                  }}
                  className={`px-1.5 py-1 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-1 text-[9px] font-rounded ${
                    isCur
                      ? 'bg-amber-700 text-white border-amber-800 shadow-2xs font-extrabold ring-1 ring-amber-400/40'
                      : 'bg-white border-amber-200/50 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {getSeasonIcon(idx)}
                  <span className="font-bold">Q{idx + 1}</span>
                  <span className="hidden md:inline text-[8px] opacity-85 truncate">
                    {wp.phaseName.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Side-by-Side Zero-Scroll Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch min-w-0">
        
        {/* === LEFT COLUMN: Active Stage Explanatory Notes & Ontogeny Lapse Controls === */}
        <div className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 shadow-xs ${
          lapsePlaying 
            ? 'bg-purple-50/30 border-purple-300 ring-1 ring-purple-300/50' 
            : 'bg-white border-purple-100 hover:border-purple-200'
        }`}>
          <div className="space-y-2">
            {/* Stage Header with Stepper & Usable-Range Lapse Controls */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-purple-100/80 pb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">
                  Ontogeny {selectedStageIdx + 1}/{stages.length}
                </span>
                <span className="text-[8.5px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300/60 px-1.5 py-0.5 rounded">
                  {activeStage.ageRangeYears}
                </span>
              </div>

              {/* Usable-Range Stage Stepper & Sync Pill */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStepStage(-1)}
                  className="px-1.5 py-0.5 bg-white hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-md text-[9px] font-mono font-bold transition-all cursor-pointer shadow-3xs active:scale-95"
                  title="Step to previous ontogenetic stage (⏮)"
                >
                  <SkipBack size={10} className="inline mr-0.5" />
                  Prev
                </button>
                <button
                  onClick={() => handleStepStage(1)}
                  className="px-1.5 py-0.5 bg-white hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-md text-[9px] font-mono font-bold transition-all cursor-pointer shadow-3xs active:scale-95"
                  title="Step to next ontogenetic stage (⏭)"
                >
                  Next
                  <SkipForward size={10} className="inline ml-0.5" />
                </button>
                <button
                  onClick={() => setLapsePlaying(!lapsePlaying)}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-rounded font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-3xs ${
                    lapsePlaying
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-park-tree text-white hover:bg-park-tree/90'
                  }`}
                  title="Toggle coupled timelapse playback directly from stage card"
                >
                  {lapsePlaying ? <Pause size={9} /> : <Play size={9} />}
                  <span>{lapsePlaying ? 'Pause' : 'Sync'}</span>
                </button>
              </div>
            </div>

            {/* Stage Title, Description & Unit Pills */}
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <h5 className="text-[12.5px] font-rounded font-extrabold text-park-tree leading-snug">
                  {activeStage.stageName}
                </h5>
                <p className="text-[10px] font-rounded text-park-ink leading-relaxed mt-1">
                  {activeStage.nicheDescription}
                </p>
              </div>

              {/* Mass & Length Unit Interactive Toggles (Pills) */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <button
                  onClick={() => setMassUnit(u => u === 'kg' ? 'lbs' : u === 'lbs' ? 'tons' : 'kg')}
                  className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer shadow-3xs active:scale-95"
                  title="Click to cycle mass unit (kg / lbs / tons)"
                >
                  {formatMass(activeStage.bodyMassKg)}
                </button>
                <button
                  onClick={() => setLengthUnit(l => l === 'm' ? 'ft' : 'm')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[9px] font-mono transition-all cursor-pointer active:scale-95"
                  title="Click to toggle length unit (m / ft)"
                >
                  {formatLength(activeStage.bodyLengthM)}
                </button>
              </div>
            </div>

            {/* Mini Stage Progress Dots */}
            <div className="flex items-center gap-1 pt-1">
              <span className="text-[8px] font-mono text-purple-700 font-bold uppercase mr-1">Stage Progression:</span>
              <div className="flex items-center gap-1 flex-1">
                {stages.map((stg, sIdx) => (
                  <button
                    key={stg.id}
                    onClick={() => setSelectedStageIdx(sIdx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer flex-1 ${
                      selectedStageIdx === sIdx
                        ? 'bg-purple-600 ring-1 ring-purple-400'
                        : sIdx < selectedStageIdx
                          ? 'bg-purple-300'
                          : 'bg-slate-200 hover:bg-purple-200'
                    }`}
                    title={`Jump to Stage ${sIdx + 1}: ${stg.stageName}`}
                  />
                ))}
              </div>
            </div>

            {/* Micro-Histology & Ethology Specimen Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-dashed border-slate-200 text-[9.5px]">
              <div className="p-1.5 rounded-lg bg-purple-50/60 border border-purple-200/70 space-y-0.5">
                <div className="flex items-center gap-1 font-bold text-purple-900 font-rounded text-[9px] uppercase">
                  <Bone size={10} className="text-purple-600" />
                  <span>Skeletal Mineralization</span>
                </div>
                <p className="font-rounded text-slate-600 text-[9px] leading-tight">
                  {activeStage.histologyNotes}
                </p>
              </div>

              <div className="p-1.5 rounded-lg bg-amber-50/60 border border-amber-200/70 space-y-0.5">
                <div className="flex items-center gap-1 font-bold text-amber-900 font-rounded text-[9px] uppercase">
                  <Zap size={10} className="text-amber-600" />
                  <span>Ethology & Foraging Niche</span>
                </div>
                <p className="font-rounded text-slate-600 text-[9px] leading-tight">
                  {activeStage.behaviorPattern}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* === RIGHT COLUMN: Spatio-Temporal Annual Migration Lapse & Usable-Range Controller === */}
        <div className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 shadow-xs ${
          lapsePlaying
            ? 'bg-emerald-50/30 border-emerald-300 ring-2 ring-emerald-400/40 shadow-emerald-500/10'
            : 'bg-white border-purple-100 hover:border-purple-200'
        }`}>
          <div className="space-y-2">
            {/* Season Header with Stepper & Usable-Range Lapse Controls (Styled identically to Stage Header) */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-emerald-100/80 pb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                  Season Q{activeWaypointIdx + 1}/{dynamicMigrationLapse.length}
                </span>
                <span className="text-[8.5px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300/60 px-1.5 py-0.5 rounded">
                  {activeWaypoint.seasonMonth}
                </span>
              </div>

              {/* Usable-Range Season Stepper & Sync Pill */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStepWaypoint(-1)}
                  className="px-1.5 py-0.5 bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-md text-[9px] font-mono font-bold transition-all cursor-pointer shadow-3xs active:scale-95"
                  title="Step backward one season (⏮)"
                >
                  <SkipBack size={10} className="inline mr-0.5" />
                  Prev
                </button>
                <button
                  onClick={() => handleStepWaypoint(1)}
                  className="px-1.5 py-0.5 bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-md text-[9px] font-mono font-bold transition-all cursor-pointer shadow-3xs active:scale-95"
                  title="Step forward one season (⏭)"
                >
                  Next
                  <SkipForward size={10} className="inline ml-0.5" />
                </button>
                <button
                  onClick={() => setLapsePlaying(!lapsePlaying)}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-rounded font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-3xs ${
                    lapsePlaying
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-park-tree text-white hover:bg-park-tree/90'
                  }`}
                  title="Toggle real-time seasonal lapse simulation"
                >
                  {lapsePlaying ? <Pause size={9} /> : <Play size={9} />}
                  <span>{lapsePlaying ? 'Pause' : 'Sync'}</span>
                </button>
              </div>
            </div>

            {/* Integrated Usable-Range Lapse Controls Deck directly inside card */}
            <div className="bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 space-y-2 shadow-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${lapsePlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1">
                    <Compass size={11} className="text-emerald-400" />
                    <span>{lapsePlaying ? `Lapse Active (${playbackSpeed}x)` : 'Lapse Paused'}</span>
                  </span>
                </div>

                {/* Playback speed pills */}
                <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                  {[0.5, 1, 2, 4].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold transition-all cursor-pointer ${
                        playbackSpeed === speed
                          ? 'bg-emerald-500 text-slate-950 shadow-2xs font-extrabold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={`Set lapse speed to ${speed}x`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Control Buttons & Interactive Scrubber in Usable Range */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLapsePlaying(!lapsePlaying)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-rounded font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 ${
                    lapsePlaying 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                  }`}
                  title="Toggle real-time seasonal lapse simulation"
                >
                  {lapsePlaying ? <Pause size={11} /> : <Play size={11} />}
                  <span>{lapsePlaying ? 'Pause Sync' : 'Play Synced Lapse'}</span>
                </button>

                <button
                  onClick={() => handleStepWaypoint(-1)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer active:scale-95"
                  title="Step backward one season (⏮)"
                >
                  <SkipBack size={11} />
                </button>

                <button
                  onClick={() => handleStepWaypoint(1)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer active:scale-95"
                  title="Step forward one season (⏭)"
                >
                  <SkipForward size={11} />
                </button>

                <button
                  onClick={() => {
                    setActiveWaypointIdx(0);
                    if (lapsePlaying) setLapsePlaying(false);
                  }}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                  title="Reset cycle to Spring / Q1 (↺)"
                >
                  <RotateCcw size={11} />
                </button>

                {/* Interactive Scrub Slider in usable range */}
                <div className="flex-1 flex items-center gap-1.5 min-w-[70px]">
                  <input
                    type="range"
                    min="0"
                    max={dynamicMigrationLapse.length - 1}
                    step="1"
                    value={activeWaypointIdx}
                    onChange={(e) => {
                      setActiveWaypointIdx(Number(e.target.value));
                      if (lapsePlaying) setLapsePlaying(false);
                    }}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    title="Interactive Scrubber: Drag to scrub seasonal lapse progression"
                  />
                </div>
              </div>

              {/* In-Card Season Progression Pills (Q1 to Q4) */}
              <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-800">
                {dynamicMigrationLapse.map((wp, idx) => {
                  const isCur = activeWaypointIdx === idx;
                  return (
                    <button
                      key={wp.id}
                      onClick={() => {
                        setActiveWaypointIdx(idx);
                        if (lapsePlaying) setLapsePlaying(false);
                      }}
                      className={`py-1 px-1 rounded-md text-center transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center ${
                        isCur
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-xs ring-1 ring-emerald-300'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[9px] font-mono leading-none">
                        {getSeasonIcon(idx)}
                        <span className="font-bold">Q{idx + 1}</span>
                      </div>
                      <span className="text-[7.5px] truncate mt-0.5 opacity-90 leading-tight">
                        {wp.phaseName.split(' ')[0]}
                      </span>
                      {/* Live Progress Bar on the active pill during playback */}
                      {isCur && lapsePlaying && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Coordinated Seasonal Waypoint Card */}
          <div className="p-2.5 bg-gradient-to-br from-amber-50/60 to-emerald-50/40 border border-emerald-200/80 rounded-xl space-y-2 shadow-3xs flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[8.5px] font-rounded font-bold text-slate-500 uppercase block">
                    {activeWaypoint.seasonMonth} • Quarter {activeWaypointIdx + 1} of 4
                  </span>
                  <h6 className="text-[12px] font-rounded font-extrabold text-park-tree flex items-center gap-1.5 mt-0.5">
                    <span>{activeWaypoint.phaseName}</span>
                  </h6>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono font-extrabold text-emerald-800 block">
                    {activeWaypoint.paleoElevationM} m
                  </span>
                  <span className="text-[7.5px] font-mono text-slate-500 block leading-none">
                    paleo-elevation
                  </span>
                </div>
              </div>

              {/* Geolocation & Biome Strip */}
              <div className="flex items-center justify-between gap-1 text-[8.5px] font-mono text-slate-600 bg-white/80 px-2 py-0.8 rounded-md border border-slate-200">
                <span className="flex items-center gap-1">
                  <MapPin size={9.5} className="text-rose-500 shrink-0" />
                  <span>Lat: {activeWaypoint.lat.toFixed(2)}° • Lng: {activeWaypoint.lng.toFixed(2)}°</span>
                </span>
                <span className="text-emerald-700 font-bold truncate">
                  {activeWaypoint.terrainType.split('&')[0].trim()}
                </span>
              </div>

              {/* Coupled Biological Activity */}
              <div className="p-2 rounded-lg bg-white/90 border border-emerald-100 text-[9.5px] space-y-0.5">
                <div className="flex items-center justify-between font-bold text-[8.5px] uppercase font-rounded text-emerald-950">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={10} className="text-emerald-600" />
                    <span>Coupled {activeStage.stageName.split(' ')[0]} Behavior</span>
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {activeWaypoint.mobilityRadiusKm === 0 ? 'Nest-Bound' : `~${activeWaypoint.mobilityRadiusKm} km range`}
                  </span>
                </div>
                <p className="font-rounded text-slate-700 text-[9px] leading-snug">
                  {activeWaypoint.ecologicalActivity}
                </p>
              </div>
            </div>

            {/* Spatial Range & Mobility Radar Indicator */}
            <div className="p-1.5 mt-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[9px] font-rounded">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${lapsePlaying ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`}></span>
                <span className="font-bold text-slate-700 shrink-0">Territory Footprint:</span>
                <span className="font-mono text-amber-800 font-bold truncate">
                  {selectedStageIdx === 0 && '0 km (Egg Clutches)'}
                  {selectedStageIdx === 1 && '1.2 km² (Understory Nursery)'}
                  {selectedStageIdx === 2 && '120 km² (Pack Hunting Run)'}
                  {selectedStageIdx === 3 && '300 km² (Delta Corridor)'}
                  {selectedStageIdx === 4 && '500+ km² (Apex Territory)'}
                  {selectedStageIdx === 5 && '80 km² (Solitary Solitude)'}
                </span>
              </div>
              <span className="text-[8px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 shrink-0">
                {lapsePlaying ? '● Progressing' : 'Synced'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* === BOTTOM EXPLANATORY FOOTNOTES SECTION === */}
      <div className="border-t border-purple-100 pt-3 space-y-3">
        {/* Footnote 1: How does the Growth & Migration Module work? */}
        <div className="p-2.5 bg-gradient-to-r from-purple-50/30 via-slate-50 to-amber-50/30 rounded-xl border border-purple-100/60 text-[10px] leading-relaxed space-y-0.5">
          <div className="flex items-center gap-1 text-purple-950 font-rounded font-extrabold">
            <Sparkles size={11} className="text-amber-500 shrink-0" />
            <span>Explanatory Footnote: How the Coupled Growth & Seasonality Module Works</span>
          </div>
          <p className="text-slate-500 font-rounded">
            This module synchronizes **Ontogeny (lifetime growth)** with **Quarterly Seasonality**. Advancing the lifetime growth curve alters the biological constraints of the dinosaur (increasing territory size, nesting limits, and metabolic needs). When the "Play Synced Lapse" playhead runs, it cycles quarters Q1 to Q4 repeatedly; upon completing Q4, the system automatically advances the dinosaur to the next ontogenetic life stage, illustrating a continuous, coupled lifespan simulation!
          </p>
        </div>

        {/* Footnote 2: Microscopic Femur Bone Histology (Fossil LAG Rings) */}
        <div className="p-2.5 bg-purple-950/5 rounded-xl border border-purple-100 flex flex-col sm:flex-row items-center gap-3">
          {/* Bone Cross Section Graphic */}
          <div className="w-10 h-10 shrink-0 relative flex items-center justify-center bg-white rounded-full border border-purple-200 shadow-inner">
            <svg viewBox="0 0 60 60" className="w-full h-full">
              <circle cx="30" cy="30" r="26" fill="#fcfcfd" stroke="#7e22ce" strokeWidth="1.5" />
              {Array.from({ length: Math.min(8, selectedCurvePoint?.ageYears || 2) }).map((_, rIdx) => (
                <circle
                  key={rIdx}
                  cx="30"
                  cy="30"
                  r={Math.min(24, 7 + rIdx * 2.3)}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="0.8"
                  strokeDasharray={rIdx % 2 === 0 ? "none" : "2,2"}
                  opacity="0.85"
                />
              ))}
              <circle cx="30" cy="30" r="5" fill="#e2e8f0" stroke="#7e22ce" strokeWidth="1" />
              <circle cx="20" cy="22" r="0.8" fill="#ec4899" />
              <circle cx="38" cy="20" r="0.8" fill="#ec4899" />
              <circle cx="24" cy="38" r="0.8" fill="#ec4899" />
              <circle cx="34" cy="36" r="0.8" fill="#ec4899" />
            </svg>
          </div>

          {/* Histology Explainer Text */}
          <div className="space-y-0.5 text-[9.5px] flex-1 min-w-0">
            <span className="font-rounded font-extrabold text-purple-950 flex items-center gap-1.5">
              <Bone size={11} className="text-purple-600" />
              <span>Microscopic Femur Bone Histology Footnote (Lines of Arrested Growth)</span>
            </span>
            <p className="text-slate-500 font-rounded text-[9px] leading-tight">
              Like tree rings, each concentric ring represents an annual seasonal winter arrest. At <strong className="text-purple-700">{selectedCurvePoint?.ageYears || 2} years old</strong> (auto-updating during lapse sync!), this fossil femur cross-section registers exactly <strong className="text-purple-700">{selectedCurvePoint?.ageYears || 2} LAG annuli</strong> with dense, vascularized cortical bone tissues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeCycleTemporalLapse;
