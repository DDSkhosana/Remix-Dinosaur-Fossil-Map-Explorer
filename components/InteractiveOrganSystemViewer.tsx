import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Wind, 
  Flame, 
  Brain, 
  Activity, 
  Layers, 
  Sparkles, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  X, 
  Sliders, 
  ChevronRight, 
  Info,
  CheckCircle2,
  Stethoscope,
  Share2,
  Bone,
  ExternalLink,
  Eye,
  Radio,
  ArrowLeft,
  Microscope,
  Zap,
  RotateCcw,
  Filter,
  ZoomIn,
  ZoomOut,
  Move,
  Crosshair,
  Compass
} from 'lucide-react';
import { 
  DinoOrganProfile, 
  OrganDetail, 
  OrganSystemCategory, 
  ORGAN_SYSTEM_META, 
  getDinoOrganProfile 
} from '../data/organSystemsData';
import { AbstractionTier } from '../types';
import PhysiologicalTelemetryMedia from './PhysiologicalTelemetryMedia';
import OrganInterrelationCircuit from './OrganInterrelationCircuit';

export type VisualMediaMode = 'visceral_xray' | 'interrelation_circuit' | 'telemetry_oscilloscope';

interface InteractiveOrganSystemViewerProps {
  taxaName: string;
  initialSystem?: OrganSystemCategory | 'all';
  onClose?: () => void;
  isModal?: boolean;
  onNavigateToTab?: (tab: string) => void;
}

export const InteractiveOrganSystemViewer: React.FC<InteractiveOrganSystemViewerProps> = ({
  taxaName,
  initialSystem = 'all',
  onClose,
  isModal = false,
  onNavigateToTab
}) => {
  const profile: DinoOrganProfile = getDinoOrganProfile(taxaName);
  
  const [activeMediaMode, setActiveMediaMode] = useState<VisualMediaMode>('visceral_xray');
  const [activeSystem, setActiveSystem] = useState<OrganSystemCategory | 'all'>(initialSystem);
  const [activeAbstractionTier, setActiveAbstractionTier] = useState<AbstractionTier | 'all'>('all');
  const [selectedOrganId, setSelectedOrganId] = useState<string>(profile.organs[0]?.id || '');
  const [xrayOpacity, setXrayOpacity] = useState<number>(0.85);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationPhase, setSimulationPhase] = useState<number>(0); // 0 to 1 cycle
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hoveredOrganId, setHoveredOrganId] = useState<string | null>(null);

  // 3D Perspective Volumetric State & Orientation Controls
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [pitchDegree, setPitchDegree] = useState<number>(12);
  const [yawDegree, setYawDegree] = useState<number>(-14);

  const reset3DView = () => {
    setPitchDegree(12);
    setYawDegree(-14);
    setCanvasZoom(1.0);
    setCanvasPan({ x: 0, y: 0 });
  };

  // Canvas Zoom & Pan state for Deep-Inspection
  const [canvasZoom, setCanvasZoom] = useState<number>(1.0);
  const [canvasPan, setCanvasPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanningCanvas, setIsPanningCanvas] = useState<boolean>(false);
  const canvasPanStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0, startY: 0, initX: 0, initY: 0
  });

  // Reset zoom & pan when taxa or visual mode changes
  useEffect(() => {
    setCanvasZoom(1.0);
    setCanvasPan({ x: 0, y: 0 });
  }, [taxaName, activeMediaMode]);

  // Canvas drag-to-pan handlers
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea, a, [data-interactive]')) return;
    setIsPanningCanvas(true);
    canvasPanStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: canvasPan.x,
      initY: canvasPan.y
    };
  };

  useEffect(() => {
    if (!isPanningCanvas) return;
    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - canvasPanStartRef.current.startX;
      const dy = e.clientY - canvasPanStartRef.current.startY;
      setCanvasPan({
        x: canvasPanStartRef.current.initX + dx,
        y: canvasPanStartRef.current.initY + dy
      });
    };
    const handlePointerUp = () => {
      setIsPanningCanvas(false);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isPanningCanvas]);

  // Jump to specific anatomical locant / organ and focus viewport
  const jumpToOrganLocant = (organ: OrganDetail) => {
    setSelectedOrganId(organ.id);
    // Center pan on the organ coordinates in SVG viewBox (600 x 480)
    const centerX = 300;
    const centerY = 240;
    const offsetX = (centerX - organ.coords.x) * (canvasZoom > 1 ? canvasZoom * 0.5 : 0.8);
    const offsetY = (centerY - organ.coords.y) * (canvasZoom > 1 ? canvasZoom * 0.5 : 0.8);
    setCanvasPan({ x: offsetX, y: offsetY });
  };

  // Filter visible organs according to active system and active abstraction tier
  const visibleOrgans = profile.organs.filter(organ => {
    const matchesSystem = activeSystem === 'all' || organ.system === activeSystem;
    const matchesTier = activeAbstractionTier === 'all' || (organ.abstractionTier || 'systemic_physiological') === activeAbstractionTier;
    return matchesSystem && matchesTier;
  });

  // Selected organ reference (defaults to first visible organ if available)
  const selectedOrgan = profile.organs.find(o => o.id === selectedOrganId) || visibleOrgans[0] || profile.organs[0];

  // Auto-switch selected organ when filters change to ensure selected organ is always visible
  useEffect(() => {
    const currentIsVisible = visibleOrgans.some(o => o.id === selectedOrganId);
    if (!currentIsVisible && visibleOrgans.length > 0) {
      setSelectedOrganId(visibleOrgans[0].id);
    }
  }, [activeSystem, activeAbstractionTier, taxaName, visibleOrgans, selectedOrganId]);

  // Keep selected organ valid when taxa changes
  useEffect(() => {
    const valid = profile.organs.find(o => o.id === selectedOrganId);
    if (!valid && profile.organs.length > 0) {
      setSelectedOrganId(profile.organs[0].id);
    }
  }, [taxaName]);

  // Tier counts calculation for logical data categorization
  const tierCounts = {
    all: profile.organs.length,
    systemic_physiological: profile.organs.filter(o => o.abstractionTier === 'systemic_physiological').length,
    organismal_biomechanic: profile.organs.filter(o => o.abstractionTier === 'organismal_biomechanic').length,
    micro_histological: profile.organs.filter(o => o.abstractionTier === 'micro_histological').length
  };

  // System counts calculation
  const systemCounts = {
    all: profile.organs.length,
    cardiovascular: profile.organs.filter(o => o.system === 'cardiovascular').length,
    respiratory: profile.organs.filter(o => o.system === 'respiratory').length,
    digestive: profile.organs.filter(o => o.system === 'digestive').length,
    neurosensory: profile.organs.filter(o => o.system === 'neurosensory').length,
    musculoskeletal: profile.organs.filter(o => o.system === 'musculoskeletal').length
  };

  // Dedicated tier selection handler with automatic cross-filter reconciliation
  const handleSelectTier = (tier: AbstractionTier | 'all') => {
    setActiveAbstractionTier(tier);
    // If current system has no organs in the newly selected tier, reset system to 'all' so hotspots appear
    if (tier !== 'all' && activeSystem !== 'all') {
      const hasMatch = profile.organs.some(o => o.abstractionTier === tier && o.system === activeSystem);
      if (!hasMatch) {
        setActiveSystem('all');
      }
    }
    const firstMatch = profile.organs.find(o => tier === 'all' || o.abstractionTier === tier);
    if (firstMatch) {
      setSelectedOrganId(firstMatch.id);
    }
  };

  // Label click action: cycle through tiers logically
  const cycleTier = () => {
    const tiers: (AbstractionTier | 'all')[] = ['all', 'systemic_physiological', 'organismal_biomechanic', 'micro_histological'];
    const currentIndex = tiers.indexOf(activeAbstractionTier);
    const nextTier = tiers[(currentIndex + 1) % tiers.length];
    handleSelectTier(nextTier);
  };

  // Functional Vital Metric Click Handlers: turns static metric labels into interactive actions
  const handleVitalClick = (metricType: 'heart' | 'mass' | 'temp' | 'viscera') => {
    switch (metricType) {
      case 'heart': {
        setActiveSystem('cardiovascular');
        const heartOrgan = profile.organs.find(o => o.system === 'cardiovascular');
        if (heartOrgan) {
          setSelectedOrganId(heartOrgan.id);
        }
        break;
      }
      case 'mass': {
        setActiveSystem('musculoskeletal');
        const muscleOrgan = profile.organs.find(o => o.system === 'musculoskeletal');
        if (muscleOrgan) {
          setSelectedOrganId(muscleOrgan.id);
        }
        break;
      }
      case 'temp': {
        setActiveSystem('respiratory');
        const respOrgan = profile.organs.find(o => o.system === 'respiratory');
        if (respOrgan) {
          setSelectedOrganId(respOrgan.id);
        }
        break;
      }
      case 'viscera': {
        setActiveSystem('all');
        setActiveAbstractionTier('all');
        if (profile.organs.length > 0) {
          setSelectedOrganId(profile.organs[0].id);
        }
        break;
      }
    }
  };

  // Centralized Exit Action - Works across fullscreen, modal, and tab views
  const handleExit = () => {
    if (isFullscreen) {
      setIsFullscreen(false);
    } else if (onClose) {
      onClose();
    } else if (onNavigateToTab) {
      onNavigateToTab('overview');
    }
  };

  // Escape key handler - Universal exit functionality in all view modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isModal, onClose, onNavigateToTab]);

  // Simulation timer loop (animates respiration and heartbeat)
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSimulationPhase(prev => (prev + 0.05) % 1);
    }, 60);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // System category list
  const systemKeys: OrganSystemCategory[] = [
    'cardiovascular',
    'respiratory',
    'digestive',
    'neurosensory',
    'musculoskeletal'
  ];

  const getSystemIcon = (sys: OrganSystemCategory, size = 14) => {
    switch (sys) {
      case 'cardiovascular': return <Heart size={size} />;
      case 'respiratory': return <Wind size={size} />;
      case 'digestive': return <Flame size={size} />;
      case 'neurosensory': return <Brain size={size} />;
      case 'musculoskeletal': return <Activity size={size} />;
    }
  };

  // Heart pulse scale calculation based on species estimated BPM
  const heartPulseScale = 1 + (Math.sin(simulationPhase * Math.PI * 4) > 0.4 ? 0.16 : 0);

  // Respiratory expansion scale
  const lungFlowOpacity = 0.4 + 0.6 * Math.sin(simulationPhase * Math.PI * 2);

  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-park-card-border shadow-xs overflow-hidden ${
      isFullscreen 
        ? 'fixed inset-0 z-[100] rounded-none bg-slate-950 p-4 sm:p-6 overflow-y-auto text-slate-100' 
        : 'w-full'
    }`}>
      {/* Master Module Header Ribbon */}
      <div className={`p-3.5 sm:p-4 border-b flex flex-wrap items-center justify-between gap-3 flex-none ${
        isFullscreen ? 'border-slate-800 bg-slate-900' : 'border-park-card-border bg-[#faf8f2]'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Direct Return Button */}
          <button
            onClick={handleExit}
            className="p-1.5 rounded-xl border border-park-card-border hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer shrink-0 shadow-3xs"
            title="Exit Organ Viewer & Return to Overview (Esc)"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 flex items-center justify-center shadow-2xs shrink-0">
            <Stethoscope size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-rounded font-extrabold text-park-accent-green uppercase tracking-wider">
                Anatomical Viscera & Physiology
              </span>
              <span className="text-slate-400 text-[10px]" aria-hidden="true">·</span>
              <span className="text-[9.5px] font-mono font-bold text-rose-900 bg-rose-50 px-2 py-0.2 rounded-md border border-rose-200">
                {profile.metabolismModel}
              </span>
            </div>
            <h4 className={`text-[13px] sm:text-[14px] font-rounded font-extrabold leading-snug truncate ${
              isFullscreen ? 'text-white' : 'text-park-tree'
            }`}>
              {profile.taxaName} — Organ Systems & Biomechanical Hotspots
            </h4>
            <p className={`text-[10px] font-rounded text-park-ink-muted leading-tight truncate ${
              isFullscreen ? 'text-slate-400' : 'text-park-ink-muted'
            }`}>
              Structured Abstraction Architecture • 3D Volumetric Hotspot Interrelation Engine
            </p>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Simulation Play / Pause */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-rounded font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs active:scale-95 ${
              isSimulating 
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300' 
                : 'bg-white border-slate-300 text-slate-600'
            }`}
            title={isSimulating ? "Pause Physiological Simulation" : "Resume Physiological Simulation"}
          >
            {isSimulating ? <Pause size={12} /> : <Play size={12} />}
            <span className="hidden sm:inline">{isSimulating ? 'Pulse Active' : 'Paused'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer shadow-3xs ${
              isFullscreen 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-white border-park-card-border text-park-ink-muted hover:text-park-tree hover:bg-park-land/20'
            }`}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand Fullscreen Organ Viewer"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Dedicated Exit Button */}
          <button
            onClick={handleExit}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-rounded font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
            title="Exit Organ Viewer (Esc) - Return to Specimen Overview"
          >
            <X size={13} strokeWidth={2.5} />
            <span>{isFullscreen ? 'Exit Fullscreen' : isModal ? 'Close' : 'Exit Organ Viewer'}</span>
            <span className="text-[9px] font-mono bg-black/25 px-1 py-0.2 rounded text-white/90">Esc</span>
          </button>
        </div>
      </div>

      {/* Unified Compact Control Panel */}
      <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 ${
        isFullscreen ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-park-card-border'
      }`}>
        {/* Section 1: Visual Media Selection (Compact Pills) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
            <Eye size={12} />
            <span>MEDIA:</span>
          </span>
          <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-3xs">
            <button
              onClick={() => setActiveMediaMode('visceral_xray')}
              className={`px-2.5 py-1 rounded text-[10.5px] font-rounded font-extrabold transition-all cursor-pointer ${
                activeMediaMode === 'visceral_xray'
                  ? 'bg-rose-600 text-white shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
              title="Anatomical X-Ray Canvas"
            >
              X-Ray Canvas
            </button>
            <button
              onClick={() => setActiveMediaMode('interrelation_circuit')}
              className={`px-2.5 py-1 rounded text-[10.5px] font-rounded font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                activeMediaMode === 'interrelation_circuit'
                  ? 'bg-sky-600 text-white shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
              title="Cross-Domain Circuit"
            >
              <span>Circuit</span>
              <span className={`text-[9px] font-mono px-1 rounded-full ${activeMediaMode === 'interrelation_circuit' ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                {selectedOrgan.interrelations?.length || 3}
              </span>
            </button>
            <button
              onClick={() => setActiveMediaMode('telemetry_oscilloscope')}
              className={`px-2.5 py-1 rounded text-[10.5px] font-rounded font-extrabold transition-all cursor-pointer ${
                activeMediaMode === 'telemetry_oscilloscope'
                  ? 'bg-emerald-600 text-white shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
              title="Physiological Oscilloscope"
            >
              Oscilloscope
            </button>
          </div>
        </div>

        {/* Section 2: Compact Dropdown Filters (Grouped) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-0.5">
              <Filter size={11} className="text-violet-500" />
              <span>CATEGORY:</span>
            </span>
            <select
              value={activeAbstractionTier}
              onChange={(e) => handleSelectTier(e.target.value as AbstractionTier | 'all')}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px] font-rounded font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer shadow-3xs"
            >
              <option value="all">All Categories ({tierCounts.all})</option>
              <option value="systemic_physiological">Systemic Physiological ({tierCounts.systemic_physiological})</option>
              <option value="organismal_biomechanic">Organismal Biomechanical ({tierCounts.organismal_biomechanic})</option>
              <option value="micro_histological">Micro & Taphonomic ({tierCounts.micro_histological})</option>
            </select>
          </div>

          {/* System Dropdown */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-0.5">
              <Layers size={11} className="text-park-tree" />
              <span>SYSTEM:</span>
            </span>
            <select
              value={activeSystem}
              onChange={(e) => setActiveSystem(e.target.value as OrganSystemCategory | 'all')}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px] font-rounded font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-park-tree cursor-pointer shadow-3xs"
            >
              <option value="all">All Systems ({systemCounts.all})</option>
              {systemKeys.map(sysKey => (
                <option key={sysKey} value={sysKey}>
                  {ORGAN_SYSTEM_META[sysKey].label.split(' ')[0]} ({systemCounts[sysKey]})
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filter Action */}
          {(activeAbstractionTier !== 'all' || activeSystem !== 'all') && (
            <button
              onClick={() => {
                setActiveAbstractionTier('all');
                setActiveSystem('all');
              }}
              className="text-[10.5px] font-rounded font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors border-l border-slate-200 dark:border-slate-700 pl-2.5"
              title="Reset both Category and System filters"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Vital Metrics Quick-Ribbon - Fully Functional & Interactive */}
      <div className={`px-4 py-2 border-b grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] font-rounded ${
        isFullscreen ? 'bg-slate-900 border-slate-800' : 'bg-white border-park-card-border'
      }`}>
        <button
          onClick={() => handleVitalClick('heart')}
          className={`flex items-center gap-2 p-1.5 rounded-xl border text-left cursor-pointer transition-all ${
            activeSystem === 'cardiovascular'
              ? 'bg-rose-50 border-rose-300 shadow-xs dark:bg-rose-950/40 dark:border-rose-700'
              : isFullscreen
                ? 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                : 'bg-slate-50/60 border-slate-200 hover:bg-rose-50/50 hover:border-rose-200'
          }`}
          title="Click to filter Cardiovascular System & inspect arterial pulse"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <div className="min-w-0">
            <span className={`text-[9px] uppercase tracking-wider block truncate ${
              isFullscreen ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Heart Rate
            </span>
            <strong className={`truncate block leading-tight ${
              activeSystem === 'cardiovascular' ? 'text-rose-700 dark:text-rose-400' : isFullscreen ? 'text-white' : 'text-park-tree'
            }`}>
              ~{profile.estimatedBpm} BPM
            </strong>
          </div>
        </button>

        <button
          onClick={() => handleVitalClick('mass')}
          className={`flex items-center gap-2 p-1.5 rounded-xl border text-left cursor-pointer transition-all ${
            activeSystem === 'musculoskeletal'
              ? 'bg-amber-50 border-amber-300 shadow-xs dark:bg-amber-950/40 dark:border-amber-700'
              : isFullscreen
                ? 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                : 'bg-slate-50/60 border-slate-200 hover:bg-amber-50/50 hover:border-amber-200'
          }`}
          title="Click to filter Musculoskeletal System & inspect load-bearing structures"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <div className="min-w-0">
            <span className={`text-[9px] uppercase tracking-wider block truncate ${
              isFullscreen ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Body Mass
            </span>
            <strong className={`truncate block leading-tight ${
              activeSystem === 'musculoskeletal' ? 'text-amber-700 dark:text-amber-400' : isFullscreen ? 'text-white' : 'text-park-tree'
            }`}>
              {(profile.bodyMassKg / 1000).toFixed(1)} Tons
            </strong>
          </div>
        </button>

        <button
          onClick={() => handleVitalClick('temp')}
          className={`flex items-center gap-2 p-1.5 rounded-xl border text-left cursor-pointer transition-all ${
            activeSystem === 'respiratory'
              ? 'bg-cyan-50 border-cyan-300 shadow-xs dark:bg-cyan-950/40 dark:border-cyan-700'
              : isFullscreen
                ? 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                : 'bg-slate-50/60 border-slate-200 hover:bg-cyan-50/50 hover:border-cyan-200'
          }`}
          title="Click to filter Respiratory & thermal exchange air sac systems"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
          <div className="min-w-0">
            <span className={`text-[9px] uppercase tracking-wider block truncate ${
              isFullscreen ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Core Temp
            </span>
            <strong className={`truncate block leading-tight ${
              activeSystem === 'respiratory' ? 'text-cyan-700 dark:text-cyan-400' : isFullscreen ? 'text-white' : 'text-park-tree'
            }`}>
              {profile.coreBodyTempC}°C
            </strong>
          </div>
        </button>

        <button
          onClick={() => handleVitalClick('viscera')}
          className={`flex items-center gap-2 p-1.5 rounded-xl border text-left cursor-pointer transition-all ${
            activeSystem === 'all' && activeAbstractionTier === 'all'
              ? 'bg-purple-50 border-purple-300 shadow-xs dark:bg-purple-950/40 dark:border-purple-700'
              : isFullscreen
                ? 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                : 'bg-slate-50/60 border-slate-200 hover:bg-purple-50/50 hover:border-purple-200'
          }`}
          title="Click to reset filters and view all active specimen hotspots"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
          <div className="min-w-0">
            <span className={`text-[9px] uppercase tracking-wider block truncate ${
              isFullscreen ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Active Hotspots
            </span>
            <strong className={`truncate block leading-tight ${
              activeSystem === 'all' && activeAbstractionTier === 'all' ? 'text-purple-700 dark:text-purple-400' : isFullscreen ? 'text-white' : 'text-park-tree'
            }`}>
              {visibleOrgans.length} of {profile.organs.length}
            </strong>
          </div>
        </button>
      </div>

      {/* Main Interactive Stage & Anatomy Visualizer (Independently scrollable left & right panes) */}
      <div className="flex flex-col lg:flex-row min-w-0 border-t border-park-card-border overflow-hidden">
        {/* Left / Center: Interactive Visual Media Stage (Independently Scrollable & Zoomable) */}
        <div className={`flex-1 relative flex flex-col items-center justify-center p-3 sm:p-4 border-b lg:border-b-0 lg:border-r overflow-auto custom-scrollbar select-none bg-slate-950 border-slate-800 min-h-[460px] lg:min-h-[560px] max-h-[720px]`}>
          {/* Active Visual Media Modality Dispatcher */}
          {activeMediaMode === 'interrelation_circuit' ? (
            <div className="w-full h-full animate-in flex flex-col justify-center">
              <OrganInterrelationCircuit 
                organ={selectedOrgan} 
                taxaName={profile.taxaName} 
                onNavigateToTab={onNavigateToTab} 
                onClose={handleExit}
                onSelectTier={handleSelectTier}
              />
            </div>
          ) : activeMediaMode === 'telemetry_oscilloscope' ? (
            <div className="w-full h-full animate-in flex flex-col justify-center">
              <PhysiologicalTelemetryMedia
                organ={selectedOrgan}
                bpm={profile.estimatedBpm}
                massKg={profile.bodyMassKg}
                taxaName={profile.taxaName}
                onClose={handleExit}
              />
            </div>
          ) : (
            /* Standard Vector Anatomical X-Ray Canvas */
            <div className="w-full max-w-[640px] flex flex-col items-center">
              {/* Active Categorization Scope Banner */}
              <div className="w-full mb-2 flex items-center justify-between flex-wrap gap-2 text-[11px] font-rounded">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                    activeAbstractionTier === 'micro_histological'
                      ? 'bg-violet-100 text-violet-800 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300'
                      : activeAbstractionTier === 'organismal_biomechanic'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : activeAbstractionTier === 'systemic_physiological'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {activeAbstractionTier === 'micro_histological' && <Microscope size={11} />}
                    {activeAbstractionTier === 'organismal_biomechanic' && <Zap size={11} />}
                    {activeAbstractionTier === 'systemic_physiological' && <Activity size={11} />}
                    {activeAbstractionTier === 'all' && <Layers size={11} />}
                    <span>
                      {activeAbstractionTier === 'all' 
                        ? 'Composite Specimen View' 
                        : activeAbstractionTier === 'micro_histological'
                          ? 'Micro & Taphonomic Structures'
                          : activeAbstractionTier === 'organismal_biomechanic'
                            ? 'Organismal Biomechanical Structures'
                            : 'Systemic Physiological Viscera'}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    ({visibleOrgans.length} {visibleOrgans.length === 1 ? 'structure' : 'structures'} displayed)
                  </span>
                </div>

                {/* Direct quick-selection chips for visible structures / Locant Jumper */}
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-full py-0.5">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-900/80 rounded-md text-[8.5px] font-mono font-bold text-emerald-400 border border-slate-700/80 shrink-0">
                    <Crosshair size={10} className="text-emerald-400" />
                    <span>LOCANT:</span>
                  </div>
                  {visibleOrgans.map(org => {
                    const isSelected = selectedOrgan?.id === org.id;
                    const osteo = org.skeletalCorrelate?.boneName ? `[${org.skeletalCorrelate.boneName.split(' ')[0]}]` : '';
                    return (
                      <button
                        key={org.id}
                        onClick={() => jumpToOrganLocant(org)}
                        className={`px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                            : 'bg-white/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:text-emerald-600'
                        }`}
                        title={`Jump to locant & inspect: ${org.name} ${osteo}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: org.color }} />
                        <span>{org.name.split(' ')[0]}</span>
                        {osteo && <span className="text-[8px] opacity-70">{osteo}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {visibleOrgans.length === 0 ? (
                <div className="w-full aspect-[4/3] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 bg-white/40 dark:bg-slate-900/40">
                  <Filter size={32} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-rounded font-bold text-slate-700 dark:text-slate-200">
                      No structures match this category and system combination
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                      Try selecting another physiological system or switch to all categories.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveSystem('all');
                      setActiveAbstractionTier('all');
                    }}
                    className="px-3.5 py-1.5 bg-park-tree hover:bg-park-moss text-white rounded-xl text-xs font-rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw size={13} />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              ) : (
                <div 
                  className={`w-full aspect-[4/3] min-h-[300px] relative flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl select-none ${
                    canvasZoom > 1.0 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                  }`}
                  onPointerDown={handleCanvasPointerDown}
                  onWheel={(e) => {
                    if (e.ctrlKey || e.metaKey || isFullscreen) {
                      e.preventDefault();
                      const delta = e.deltaY * -0.0015;
                      setCanvasZoom(prev => Math.min(3.0, Math.max(0.75, Number((prev + delta).toFixed(2)))));
                    }
                  }}
                >
                  <div
                    style={{
                      transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`,
                      transformOrigin: 'center center',
                      transition: isPanningCanvas ? 'none' : 'transform 0.15s ease-out'
                    }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <svg
                      viewBox="0 0 600 480"
                      className="w-full h-full drop-shadow-2xl overflow-visible"
                      style={{
                        transform: is3DMode 
                          ? `perspective(850px) rotateX(${pitchDegree}deg) rotateY(${yawDegree}deg)` 
                          : 'none',
                        transformStyle: 'preserve-3d',
                        transition: isPanningCanvas ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                    <defs>
                      {/* High-Contrast Grid Background Pattern */}
                      <pattern id="organ-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.8" strokeOpacity="0.8" />
                        <circle cx="24" cy="24" r="0.8" fill="#334155" />
                      </pattern>

                      {/* 3D Volumetric Perspective Grid Pattern */}
                      <pattern id="organ-grid-3d" width="32" height="32" patternUnits="userSpaceOnUse">
                        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#0ea5e9" strokeWidth="0.75" strokeOpacity="0.35" />
                        <circle cx="32" cy="32" r="1.2" fill="#38bdf8" fillOpacity="0.7" />
                        <path d="M 0 32 L 32 0" fill="none" stroke="#0284c7" strokeWidth="0.5" strokeDasharray="3,3" strokeOpacity="0.25" />
                      </pattern>

                      {/* 3D Volumetric Depth Vignette Gradient */}
                      <radialGradient id="organ-depth-gradient" cx="50%" cy="45%" r="65%">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.08" />
                        <stop offset="45%" stopColor="#0f172a" stopOpacity="0.4" />
                        <stop offset="85%" stopColor="#020617" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#000000" stopOpacity="0.98" />
                      </radialGradient>
                      
                      {/* Glow Filter for Active Organ */}
                      <filter id="organ-glow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="7" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>

                      {/* Soft Specimen Drop Shadow */}
                      <filter id="specimen-shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.6" />
                      </filter>
                    </defs>

                    {/* Dark Grid Canvas Base */}
                    <rect width="100%" height="100%" fill="#0b1120" />
                    <rect 
                      width="100%" 
                      height="100%" 
                      fill={is3DMode ? "url(#organ-grid-3d)" : "url(#organ-grid)"} 
                      className="transition-all duration-300"
                      style={{
                        transform: is3DMode ? 'translateZ(-50px) scale(1.08)' : 'none',
                        transformOrigin: 'center center',
                        opacity: is3DMode ? 0.95 : 0.8,
                        filter: is3DMode ? 'drop-shadow(0 25px 35px rgba(0,0,0,0.85))' : 'none'
                      }}
                    />
                    {is3DMode && (
                      <rect 
                        width="100%" 
                        height="100%" 
                        fill="url(#organ-depth-gradient)" 
                        className="pointer-events-none transition-opacity duration-300" 
                      />
                    )}

                    {/* Specimen Anatomical Body Silhouette with High Contrast */}
                    <g filter="url(#specimen-shadow)">
                      {/* Organic Body Volume Contour */}
                      <path 
                        d={profile.silhouettePath} 
                        fill="#1e293b"
                        fillOpacity={Math.max(0.6, xrayOpacity)}
                        stroke="#0ea5e9"
                        strokeWidth="2.5"
                        strokeOpacity="0.7"
                        strokeLinejoin="round"
                      />
                      
                      {/* Dashed Skeletal Envelope Glow */}
                      <path 
                        d={profile.silhouettePath} 
                        fill="none" 
                        stroke="#38bdf8" 
                        strokeWidth="1.2"
                        strokeDasharray="6,4"
                        strokeOpacity="0.85"
                      />
                    </g>

                    {/* REAL-TIME SIMULATION PARTICLES & PATHS */}
                    {isSimulating && (
                      <g className="pointer-events-none">
                        {/* Airflow trajectory (Trachea to Posterior sacs to Lungs) */}
                        {(activeSystem === 'all' || activeSystem === 'respiratory') && (
                          <g opacity={lungFlowOpacity}>
                            <path 
                              d="M 520,110 Q 450,150 375,170 Q 310,180 280,215" 
                              fill="none" 
                              stroke="#06b6d4" 
                              strokeWidth="2.5" 
                              strokeDasharray="5,5" 
                            />
                            <circle 
                              cx={520 - simulationPhase * 240} 
                              cy={110 + simulationPhase * 105} 
                              r="3" 
                              fill="#38bdf8" 
                            />
                          </g>
                        )}

                        {/* Cardiovascular Arterial Pulse Ring */}
                        {(activeSystem === 'all' || activeSystem === 'cardiovascular') && (
                          <circle
                            cx="375"
                            cy="220"
                            r={24 * heartPulseScale}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            strokeOpacity={0.6}
                          />
                        )}
                      </g>
                    )}

                    {/* VISCERAL ORGANS & VISUAL HOTSPOTS */}
                    {visibleOrgans.map((organ) => {
                      const isSelected = selectedOrgan?.id === organ.id;
                      const isHovered = hoveredOrganId === organ.id;
                      const isHeart = organ.simulationType === 'heartbeat' && isSimulating;
                      const currentScale = isHeart ? heartPulseScale : 1;
                      const isMicro = organ.abstractionTier === 'micro_histological';

                      return (
                        <g 
                          key={organ.id} 
                          className="cursor-pointer transition-all"
                          onClick={() => setSelectedOrganId(organ.id)}
                          onMouseEnter={() => setHoveredOrganId(organ.id)}
                          onMouseLeave={() => setHoveredOrganId(null)}
                        >
                          {/* Optional detailed SVG path shape if provided */}
                          {organ.svgShape && (
                            <path
                              d={organ.svgShape}
                              fill={organ.color}
                              fillOpacity={isSelected ? 0.9 : 0.65}
                              stroke={isSelected ? '#ffffff' : organ.color}
                              strokeWidth={isSelected ? 3 : 1.5}
                              filter={isSelected ? 'url(#organ-glow)' : undefined}
                              className="transition-all duration-200"
                              style={{
                                transformOrigin: `${organ.coords.x}px ${organ.coords.y}px`,
                                transform: `scale(${currentScale})`
                              }}
                            />
                          )}

                          {/* Micro-Histological Outer Dash Ring */}
                          {isMicro && (
                            <circle
                              cx={organ.coords.x}
                              cy={organ.coords.y}
                              r={(isSelected ? 10 : isHovered ? 8 : 6) + 4}
                              fill="none"
                              stroke="#8b5cf6"
                              strokeWidth="1.5"
                              strokeDasharray="2.5,2.5"
                              opacity="0.9"
                            />
                          )}

                          {/* Hotspot Radial Pin */}
                          <circle
                            cx={organ.coords.x}
                            cy={organ.coords.y}
                            r={isSelected ? 10 : isHovered ? 8 : 6}
                            fill={organ.color}
                            stroke="#ffffff"
                            strokeWidth={isSelected ? 2.5 : 1.5}
                            className="transition-all duration-150"
                            style={{
                              transformOrigin: `${organ.coords.x}px ${organ.coords.y}px`,
                              transform: `scale(${currentScale})`
                            }}
                          />

                          {/* Pulsing selection aura */}
                          {isSelected && (
                            <circle
                              cx={organ.coords.x}
                              cy={organ.coords.y}
                              r={18}
                              fill="none"
                              stroke={organ.color}
                              strokeWidth="2"
                              strokeDasharray="3,3"
                              className="animate-spin"
                              style={{ animationDuration: '6s' }}
                            />
                          )}

                          {/* Floating Pin Label on Hover/Selected */}
                          {(isSelected || isHovered) && (
                            <g className="pointer-events-none">
                              <rect
                                x={organ.coords.x - 70}
                                y={organ.coords.y - 42}
                                width="140"
                                height="32"
                                rx="7"
                                fill="#0f172a"
                                fillOpacity="0.92"
                                stroke={organ.color}
                                strokeWidth="1.2"
                              />
                              <text
                                x={organ.coords.x}
                                y={organ.coords.y - 28}
                                textAnchor="middle"
                                fill={isMicro ? '#c084fc' : '#94a3b8'}
                                fontSize="7.5"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {isMicro ? 'MICRO & TAPHONOMIC' : organ.abstractionTier.toUpperCase().replace('_', ' ')}
                              </text>
                              <text
                                x={organ.coords.x}
                                y={organ.coords.y - 15}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="9.5"
                                fontFamily="sans-serif"
                                fontWeight="bold"
                              >
                                {organ.name.length > 20 ? `${organ.name.substring(0, 18)}...` : organ.name}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                  </div>

                  {/* Bottom Canvas Overlay Controls: Opacity Slider, Zoom Stepper & Reset, Instruction Pill */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none gap-2">
                    {/* Opacity slider & Zoom controls */}
                    <div className="flex items-center gap-2 pointer-events-auto">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl shadow-md border backdrop-blur-xs ${
                        isFullscreen ? 'bg-slate-900/90 border-slate-700 text-slate-200' : 'bg-white/95 border-park-card-border text-park-tree'
                      }`}>
                        <span className="text-[9.5px] font-rounded font-bold flex items-center gap-1">
                          <Sliders size={11} />
                          X-Ray:
                        </span>
                        <input 
                          type="range" 
                          min="0.2" 
                          max="1.0" 
                          step="0.05" 
                          value={xrayOpacity} 
                          onChange={(e) => setXrayOpacity(parseFloat(e.target.value))}
                          className="w-14 sm:w-16 accent-emerald-600 cursor-pointer h-1.5"
                        />
                        <span className="text-[9px] font-mono font-bold">{Math.round(xrayOpacity * 100)}%</span>
                      </div>

                      {/* Zoom Controls */}
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xl shadow-md border backdrop-blur-xs ${
                        isFullscreen ? 'bg-slate-900/90 border-slate-700 text-slate-200' : 'bg-white/95 border-park-card-border text-park-tree'
                      }`}>
                        <button
                          onClick={() => setCanvasZoom(prev => Math.max(0.75, Number((prev - 0.25).toFixed(2))))}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer text-slate-500 hover:text-emerald-500 transition-colors"
                          title="Zoom Out Canvas (-)"
                        >
                          <ZoomOut size={11} />
                        </button>
                        <button
                          onClick={() => {
                            setCanvasZoom(1.0);
                            setCanvasPan({ x: 0, y: 0 });
                          }}
                          className="px-1 text-[9px] font-mono font-bold hover:underline cursor-pointer"
                          title="Click to reset zoom & pan to 100%"
                        >
                          {Math.round(canvasZoom * 100)}%
                        </button>
                        <button
                          onClick={() => setCanvasZoom(prev => Math.min(3.0, Number((prev + 0.25).toFixed(2))))}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer text-slate-500 hover:text-emerald-500 transition-colors"
                          title="Zoom In Canvas (+)"
                        >
                          <ZoomIn size={11} />
                        </button>
                        {(canvasPan.x !== 0 || canvasPan.y !== 0 || canvasZoom !== 1.0) && (
                          <button
                            onClick={() => {
                              setCanvasZoom(1.0);
                              setCanvasPan({ x: 0, y: 0 });
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-400 cursor-pointer"
                            title="Recenter anatomical canvas"
                          >
                            <RotateCcw size={10} />
                          </button>
                        )}
                      </div>

                      {/* 3D Volumetric Mode Toggle */}
                      <button
                        onClick={() => setIs3DMode(!is3DMode)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl shadow-md border font-rounded font-extrabold text-[9.5px] transition-all cursor-pointer backdrop-blur-xs select-none ${
                          is3DMode
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-emerald-500/20'
                            : isFullscreen
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                              : 'bg-white/95 border-park-card-border text-park-ink hover:text-park-tree'
                        }`}
                        title="Toggle 3D Volumetric Perspective vs 2D Planar Orthographic"
                      >
                        <Compass size={11} className={is3DMode ? 'animate-pulse text-slate-950' : 'text-slate-400'} />
                        <span>{is3DMode ? '3D Active' : '2D Mode'}</span>
                      </button>

                      {/* 3D Volumetric Orientation HUD */}
                      {is3DMode && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-xl shadow-md border backdrop-blur-xs text-[9px] select-none ${
                          isFullscreen ? 'bg-slate-900/90 border-slate-700 text-slate-200' : 'bg-white/95 border-park-card-border text-park-tree'
                        }`}>
                          <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold mr-0.5">3D:</span>
                          <button 
                            onClick={() => setYawDegree(y => y - 6)} 
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer text-slate-600 dark:text-slate-300 font-bold"
                            title="Rotate Yaw Left (◀)"
                          >
                            ◀
                          </button>
                          <span className="font-mono font-bold text-[8.5px] text-cyan-500">{yawDegree}°</span>
                          <button 
                            onClick={() => setYawDegree(y => y + 6)} 
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer text-slate-600 dark:text-slate-300 font-bold"
                            title="Rotate Yaw Right (▶)"
                          >
                            ▶
                          </button>
                          <button 
                            onClick={() => setPitchDegree(p => Math.max(-30, p - 4))} 
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer text-slate-600 dark:text-slate-300 font-bold"
                            title="Tilt Pitch Up (▲)"
                          >
                            ▲
                          </button>
                          <span className="font-mono font-bold text-[8.5px] text-cyan-500">{pitchDegree}°</span>
                          <button 
                            onClick={() => setPitchDegree(p => Math.min(45, p + 4))} 
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer text-slate-600 dark:text-slate-300 font-bold"
                            title="Tilt Pitch Down (▼)"
                          >
                            ▼
                          </button>
                          <button 
                            onClick={reset3DView} 
                            className="px-1 text-[8.5px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-bold"
                            title="Reset 3D Perspective Orientation"
                          >
                            ↺
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Click instruction pill */}
                    <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl shadow-md border text-[9.5px] font-rounded font-bold pointer-events-auto backdrop-blur-xs ${
                      isFullscreen ? 'bg-slate-900/90 border-slate-700 text-slate-300' : 'bg-white/95 border-park-card-border text-park-tree'
                    }`}>
                      <Sparkles size={11} className="text-amber-500" />
                      <span>{canvasZoom > 1.0 ? 'Drag to pan • Click hotspot to inspect' : 'Click hotspot or locant to focus'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right / Bottom: Deep-Dive Organ Scientific Dossier Panel (Independently Scrollable) */}
        <div className={`w-full lg:w-[380px] xl:w-[440px] flex flex-col p-3.5 sm:p-4 space-y-3 overflow-y-auto overflow-x-auto custom-scrollbar min-h-[340px] lg:min-h-[560px] max-h-[520px] lg:max-h-[720px] shrink-0 ${
          isFullscreen ? 'bg-slate-900/60' : 'bg-white'
        }`}>
          {/* Panel Top Title Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <Stethoscope size={11} className="text-rose-500" />
              <span>ORGAN SPECIMEN DOSSIER</span>
            </span>
          </div>

          {selectedOrgan ? (
            <div className="space-y-3 animate-in">
              {/* Card 1: Active Organ Identity Card */}
              <div 
                className="p-3.5 rounded-2xl border transition-all space-y-2"
                style={{
                  backgroundColor: `${selectedOrgan.color}10`,
                  borderColor: `${selectedOrgan.color}40`
                }}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <button 
                    onClick={() => setActiveSystem(selectedOrgan.system)}
                    className="text-[9px] font-rounded font-extrabold uppercase px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1"
                    style={{
                      backgroundColor: `${selectedOrgan.color}25`,
                      color: selectedOrgan.color
                    }}
                    title={`Click to filter by ${selectedOrgan.system} system`}
                  >
                    <span>{selectedOrgan.categoryLabel}</span>
                  </button>
                  <button 
                    onClick={() => handleSelectTier(selectedOrgan.abstractionTier)}
                    className="text-[9px] font-mono text-slate-500 hover:text-violet-600 dark:hover:text-violet-300 font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 cursor-pointer transition-colors"
                    title={`Click to filter by ${selectedOrgan.abstractionTier.replace('_', ' ')} tier`}
                  >
                    Tier: {selectedOrgan.abstractionTier.replace('_', ' ')}
                  </button>
                </div>
                
                <div>
                  <h4 className={`text-base font-rounded font-black leading-tight ${
                    isFullscreen ? 'text-white' : 'text-slate-900'
                  }`}>
                    {selectedOrgan.name}
                  </h4>
                  <p className="text-[10px] font-serif italic text-slate-500">
                    {selectedOrgan.latinTerm}
                  </p>
                </div>

                <p className={`text-[11.5px] font-rounded leading-relaxed ${
                  isFullscreen ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {selectedOrgan.summary}
                </p>

                {selectedOrgan.skeletalCorrelate && (
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 text-[10.5px]">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                      <Bone size={12} className="text-amber-500 shrink-0" />
                      <span>{selectedOrgan.skeletalCorrelate.boneName}</span>
                    </div>
                    <span className="text-[9.5px] text-slate-500 italic truncate">
                      {selectedOrgan.skeletalCorrelate.feature}
                    </span>
                  </div>
                )}
              </div>

              {/* Card 2: Physiological Mechanism & Quantitative Metrics Grid */}
              <div className={`p-3.5 rounded-2xl border text-[11px] font-rounded space-y-3 ${
                isFullscreen ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-park-tree">
                    <Activity size={12} className="text-emerald-600" />
                    <span className={isFullscreen ? 'text-emerald-400' : 'text-park-tree'}>Paleophysiological Mechanism:</span>
                  </div>
                  <p className={`leading-relaxed text-[11px] ${isFullscreen ? 'text-slate-300' : 'text-slate-600'}`}>
                    {selectedOrgan.physiologicalRole}
                  </p>
                </div>

                {/* Key Metrics 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  {selectedOrgan.keyMetrics.map((metric, i) => (
                    <div 
                      key={i} 
                      className={`p-2 rounded-xl border ${
                        isFullscreen ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <span className="text-[8px] font-rounded font-bold text-slate-400 uppercase tracking-wider block truncate">
                        {metric.label}
                      </span>
                      <strong className={`text-[11px] font-mono font-extrabold mt-0.5 block truncate ${
                        isFullscreen ? 'text-emerald-400' : 'text-park-tree'
                      }`}>
                        {metric.value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Homology, Fossil Record & Cross-Domain Circuit Links (High-Contrast Readable) */}
              <div className={`p-3.5 rounded-2xl border text-[11px] font-rounded space-y-2.5 ${
                isFullscreen ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900 shadow-2xs'
              }`}>
                {/* Circuit Links Header */}
                {selectedOrgan.interrelations && selectedOrgan.interrelations.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-sky-300 text-[11.5px]">
                        <Share2 size={13} className="text-sky-700 dark:text-sky-400 shrink-0" />
                        <span>Systemic Interrelations ({selectedOrgan.interrelations.length}):</span>
                      </div>
                      <button
                        onClick={() => setActiveMediaMode('interrelation_circuit')}
                        className="text-[10px] font-mono text-sky-800 dark:text-sky-300 font-extrabold underline cursor-pointer hover:text-sky-950"
                      >
                        View Circuit →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {selectedOrgan.interrelations.slice(0, 2).map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-1.5 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700 shadow-3xs">
                          <div className="min-w-0 flex-1">
                            <span className="font-extrabold text-[10.5px] block truncate text-slate-900 dark:text-white">{link.domainLabel}</span>
                            <span className="text-[9.5px] text-slate-700 dark:text-slate-300 font-medium truncate block">{link.relationshipTitle}</span>
                          </div>
                          {onNavigateToTab && (
                            <button
                              onClick={() => onNavigateToTab(link.targetDomain)}
                              className="p-1 rounded-lg bg-sky-100 dark:bg-sky-950 hover:bg-sky-200 text-sky-900 dark:text-sky-200 shrink-0 cursor-pointer transition-colors"
                              title={`Jump to ${link.domainLabel}`}
                            >
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Homology & Fossil Evidence concise high-contrast text */}
                <div className="pt-2 border-t border-slate-300 dark:border-slate-700 grid grid-cols-1 gap-2 text-[10.5px]">
                  <div className="bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-extrabold text-slate-950 dark:text-white flex items-center gap-1.5 text-[11px]">
                      <Wind size={12} className="text-cyan-700 dark:text-cyan-400 shrink-0" />
                      Avian Homology:
                    </span>
                    <p className="text-[10px] text-slate-800 dark:text-slate-200 font-medium leading-snug mt-1">
                      {selectedOrgan.avianHomology}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-extrabold text-slate-950 dark:text-white flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 size={12} className="text-amber-700 dark:text-amber-400 shrink-0" />
                      Fossil Record:
                    </span>
                    <p className="text-[10px] text-slate-800 dark:text-slate-200 font-medium leading-snug mt-1">
                      {selectedOrgan.fossilEvidence}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Info size={32} className="opacity-40" />
              <p className="text-[11px] font-rounded">Select an organ hotspot on the anatomical cross-section to view paleophysiological data.</p>
            </div>
          )}

          {/* Organ Quick Selector Carousel */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[9px] font-rounded font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
              Organs in this Morphotype ({visibleOrgans.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {visibleOrgans.map((org) => {
                const isSelected = selectedOrgan?.id === org.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrganId(org.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-rounded font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'text-white border-transparent shadow-2xs'
                        : isFullscreen
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                    style={{
                      backgroundColor: isSelected ? org.color : undefined
                    }}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: isSelected ? '#ffffff' : org.color }}
                    />
                    <span>{org.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Evolutionary Paleophysiology Clade Summary Footer */}
      <div className={`p-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10.5px] font-rounded ${
        isFullscreen ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-park-sand/20 border-park-card-border text-park-ink-muted'
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-amber-500 shrink-0" />
          <span><strong>Clade Adaptation:</strong> {profile.evolutionaryNotes}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-[9.5px]">Metabolism: {profile.metabolismModel}</span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveOrganSystemViewer;
