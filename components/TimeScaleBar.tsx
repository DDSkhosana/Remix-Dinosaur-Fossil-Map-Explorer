import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DenominationFormat, GeologicalTimeMarker } from '../types';
import { formatAgeDenomination } from '../utils/geologicalTime';
import { Clock, Sliders, ZoomIn, ChevronLeft, ChevronRight, Target, Sparkles } from 'lucide-react';

interface TimeScaleBarProps {
  timeMarker?: GeologicalTimeMarker;
  onSelectAgeMa?: (ageMa: number) => void;
}

const DEFAULT_TIME_MARKER: GeologicalTimeMarker = {
  eon: 'Phanerozoic',
  era: 'Mesozoic',
  period: 'Cretaceous',
  epoch: 'Late Cretaceous',
  ageStage: 'Maastrichtian',
  exactAgeMa: 68.0,
  scientificYears: '6.80 × 10⁷ yr',
  placeValueDenomination: '68.0 Million Years (0.068 Billion)',
  teraAnnum: '0.000068 Ta',
  gigaAnnum: '0.068 Ga',
  megaAnnum: '68.0 Ma',
  kiloAnnum: '68,000 ka',
  icsPeriodColor: '#7FB844',
  icsEpochColor: '#A6D277'
};

// Timeline width in pixels for high-detail horizontal scrolling
const TIMELINE_TRACK_WIDTH_PX = 940;

const TimeScaleBar: React.FC<TimeScaleBarProps> = ({ 
  timeMarker: markerProp, 
  onSelectAgeMa 
}) => {
  const [format, setFormat] = useState<DenominationFormat>('scientific');
  const [scaleMode, setScaleMode] = useState<'unified_phanerozoic' | 'mesozoic_focus'>('unified_phanerozoic');

  const timeMarker = markerProp || DEFAULT_TIME_MARKER;
  const activeAge = timeMarker.exactAgeMa ?? 68.0;

  // Refs for synchronized bidirectional scrolling
  const eraScrollRef = useRef<HTMLDivElement>(null);
  const periodScrollRef = useRef<HTMLDivElement>(null);
  const epochScrollRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef<boolean>(false);

  // Drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const activeDragTarget = useRef<'era' | 'period' | 'epoch' | null>(null);

  // Calculate percentage positions
  // 1. Phanerozoic Unified Scale (541 Ma -> 0 Ma)
  const phanerozoicTotal = 541.0;
  const eraMarkerPercent = Math.max(0, Math.min(100, ((phanerozoicTotal - activeAge) / phanerozoicTotal) * 100));

  // Era Proportions in Phanerozoic (541 -> 0 Ma)
  const paleozoicWidth = ((541.0 - 251.9) / phanerozoicTotal) * 100; // 53.44%
  const mesozoicWidth = ((251.9 - 66.0) / phanerozoicTotal) * 100;   // 34.36%
  const cenozoicWidth = ((66.0 - 0.0) / phanerozoicTotal) * 100;     // 12.20%

  // Period Proportions in Phanerozoic Unified Scale (541 -> 0 Ma)
  const unifiedPaleozoicWidth = paleozoicWidth;
  const unifiedTriassicWidth = ((251.9 - 201.3) / phanerozoicTotal) * 100; // 9.35%
  const unifiedJurassicWidth = ((201.3 - 145.0) / phanerozoicTotal) * 100; // 10.41%
  const unifiedCretaceousWidth = ((145.0 - 66.0) / phanerozoicTotal) * 100; // 14.60%
  const unifiedCenozoicWidth = cenozoicWidth; // 12.20%

  // 2. Mesozoic Focus Scale (260 Ma -> 0 Ma)
  const mesozoicFocusTotal = 260.0;
  const mesozoicMarkerPercent = Math.max(0, Math.min(100, ((mesozoicFocusTotal - activeAge) / mesozoicFocusTotal) * 100));

  const focusPermianWidth = ((260.0 - 251.9) / mesozoicFocusTotal) * 100; // 3.12%
  const focusTriassicWidth = ((251.9 - 201.3) / mesozoicFocusTotal) * 100; // 19.46%
  const focusJurassicWidth = ((201.3 - 145.0) / mesozoicFocusTotal) * 100; // 21.65%
  const focusCretaceousWidth = ((145.0 - 66.0) / mesozoicFocusTotal) * 100; // 30.38%
  const focusCenozoicWidth = ((66.0 - 0.0) / mesozoicFocusTotal) * 100;     // 25.38%

  // Active percentages according to scale mode
  const activeEraPercent = eraMarkerPercent;
  const activePeriodPercent = scaleMode === 'unified_phanerozoic' ? eraMarkerPercent : mesozoicMarkerPercent;

  // Synced scroll handler across all visual elements (Era, Period, Epochs)
  const syncScrollPositions = useCallback((source: 'era' | 'period' | 'epoch') => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    let sourceScrollLeft = 0;
    if (source === 'era' && eraScrollRef.current) {
      sourceScrollLeft = eraScrollRef.current.scrollLeft;
    } else if (source === 'period' && periodScrollRef.current) {
      sourceScrollLeft = periodScrollRef.current.scrollLeft;
    } else if (source === 'epoch' && epochScrollRef.current) {
      sourceScrollLeft = epochScrollRef.current.scrollLeft;
    }

    if (source !== 'era' && eraScrollRef.current) {
      eraScrollRef.current.scrollLeft = sourceScrollLeft;
    }
    if (source !== 'period' && periodScrollRef.current) {
      periodScrollRef.current.scrollLeft = sourceScrollLeft;
    }
    if (source !== 'epoch' && epochScrollRef.current) {
      epochScrollRef.current.scrollLeft = sourceScrollLeft;
    }

    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }, []);

  // Center active marker in viewport
  const centerActiveMarker = useCallback((smooth = true) => {
    const targetPercent = scaleMode === 'unified_phanerozoic' ? activeEraPercent : activePeriodPercent;
    const targetPx = (targetPercent / 100) * TIMELINE_TRACK_WIDTH_PX;
    
    // Viewport width of the container
    const containerWidth = eraScrollRef.current?.clientWidth || 400;
    const desiredScrollLeft = Math.max(0, targetPx - containerWidth / 2);

    [eraScrollRef, periodScrollRef, epochScrollRef].forEach(ref => {
      if (ref.current) {
        ref.current.scrollTo({
          left: desiredScrollLeft,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    });
  }, [activeEraPercent, activePeriodPercent, scaleMode]);

  // Auto-center when active age or scale mode changes
  useEffect(() => {
    const timer = setTimeout(() => {
      centerActiveMarker(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [activeAge, scaleMode, centerActiveMarker]);

  // Manual scroll buttons
  const handleScrollStep = (direction: 'left' | 'right') => {
    const delta = direction === 'left' ? -220 : 220;
    const currentLeft = eraScrollRef.current?.scrollLeft || 0;
    const nextLeft = currentLeft + delta;

    [eraScrollRef, periodScrollRef, epochScrollRef].forEach(ref => {
      if (ref.current) {
        ref.current.scrollTo({
          left: nextLeft,
          behavior: 'smooth'
        });
      }
    });
  };

  // Direct Click/Drag Seek on Timeline Tracks
  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const totalSpan = scaleMode === 'unified_phanerozoic' ? 541 : 260;
    const calculatedAge = Math.max(0, Math.min(541, Math.round(totalSpan * (1 - ratio))));
    onSelectAgeMa?.(calculatedAge);
  };

  // Mouse Drag-to-Scroll handlers
  const handleMouseDown = (e: React.MouseEvent, source: 'era' | 'period' | 'epoch') => {
    setIsDragging(true);
    activeDragTarget.current = source;
    dragStartX.current = e.clientX;
    const sourceRef = source === 'era' ? eraScrollRef : source === 'period' ? periodScrollRef : epochScrollRef;
    dragStartScrollLeft.current = sourceRef.current?.scrollLeft || 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !activeDragTarget.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStartX.current;
    const newScrollLeft = dragStartScrollLeft.current - dx;

    [eraScrollRef, periodScrollRef, epochScrollRef].forEach(ref => {
      if (ref.current) {
        ref.current.scrollLeft = newScrollLeft;
      }
    });
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      activeDragTarget.current = null;
    }
  };

  return (
    <div 
      className="bg-white/95 rounded-2xl border border-park-card-border p-4 shadow-xs space-y-3.5 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      {/* Top Header with Format Denomination Switcher & View Scale Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-park-card-border pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-park-tree/10 border border-park-tree/20 flex items-center justify-center text-park-tree">
            <Clock size={15} />
          </div>
          <div>
            <h4 className="text-[12px] font-rounded font-extrabold text-park-tree uppercase tracking-wider">
              Era & Period Continuum (Synchronized Scroll)
            </h4>
            <span className="text-[10px] font-rounded text-park-ink-muted font-medium">
              ICS Chronostratigraphy • Scrolling Either Moves The Other
            </span>
          </div>
        </div>

        {/* Controls Container: Scale Mode & Format Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Center Marker Quick Button */}
          <button
            onClick={() => centerActiveMarker(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[9.5px] font-rounded font-bold transition-all shadow-2xs"
            title="Center timeline on active dinosaur time marker"
          >
            <Target size={11} className="text-rose-600 animate-pulse" />
            <span>Center Marker ({activeAge} Ma)</span>
          </button>

          {/* Scale Alignment Switcher */}
          <div className="flex items-center bg-park-sand/80 p-0.5 rounded-xl border border-park-card-border">
            <button
              onClick={() => setScaleMode('unified_phanerozoic')}
              className={`px-2 py-0.8 rounded-lg text-[9.5px] font-rounded font-bold transition-all flex items-center gap-1 ${
                scaleMode === 'unified_phanerozoic' 
                  ? 'bg-park-tree text-white shadow-xs' 
                  : 'text-park-ink-muted hover:text-park-ink'
              }`}
              title="Synchronized Phanerozoic Scale (541 Ma – 0 Ma)"
            >
              <Sliders size={10} />
              <span>Unified 541 Ma</span>
            </button>
            <button
              onClick={() => setScaleMode('mesozoic_focus')}
              className={`px-2 py-0.8 rounded-lg text-[9.5px] font-rounded font-bold transition-all flex items-center gap-1 ${
                scaleMode === 'mesozoic_focus' 
                  ? 'bg-park-tree text-white shadow-xs' 
                  : 'text-park-ink-muted hover:text-park-ink'
              }`}
              title="Mesozoic Zoom View (260 Ma – 0 Ma)"
            >
              <ZoomIn size={10} />
              <span>Mesozoic Focus</span>
            </button>
          </div>

          {/* Place Value Format Switcher Tabs */}
          <div className="flex items-center bg-park-sand/80 p-0.5 rounded-xl border border-park-card-border">
            <button
              onClick={() => setFormat('scientific')}
              className={`px-2 py-0.8 rounded-lg text-[9.5px] font-rounded font-bold transition-all ${
                format === 'scientific' 
                  ? 'bg-white text-park-tree shadow-xs border border-park-card-border' 
                  : 'text-park-ink-muted hover:text-park-ink'
              }`}
              title="Scientific Notation (e.g. 6.80 × 10⁷ yr)"
            >
              Scientific (10ⁿ yr)
            </button>
            <button
              onClick={() => setFormat('place_value')}
              className={`px-2 py-0.8 rounded-lg text-[9.5px] font-rounded font-bold transition-all ${
                format === 'place_value' 
                  ? 'bg-white text-park-tree shadow-xs border border-park-card-border' 
                  : 'text-park-ink-muted hover:text-park-ink'
              }`}
              title="Place Value Denominations"
            >
              Place Value
            </button>
            <button
              onClick={() => setFormat('metric_si')}
              className={`px-2 py-0.8 rounded-lg text-[9.5px] font-rounded font-bold transition-all ${
                format === 'metric_si' 
                  ? 'bg-white text-park-tree shadow-xs border border-park-card-border' 
                  : 'text-park-ink-muted hover:text-park-ink'
              }`}
              title="SI Metric Prefixes"
            >
              SI
            </button>
          </div>
        </div>
      </div>

      {/* Active Taxon Chrono-Anchor Display Card */}
      <div className="p-3 bg-gradient-to-r from-park-sand/80 to-white rounded-xl border border-park-card-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-4 h-9 rounded-md border border-black/10 shrink-0 shadow-xs"
            style={{ backgroundColor: timeMarker.icsPeriodColor }}
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-rounded font-extrabold uppercase tracking-wide text-park-ink-muted">
                {timeMarker.era} • {timeMarker.period} Period • {timeMarker.epoch}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white border border-park-card-border font-bold text-park-tree">
                {timeMarker.ageStage}
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-park-ink mt-0.5">
              {formatAgeDenomination(timeMarker.exactAgeMa, format)}
            </div>
          </div>
        </div>

        {/* Place value breakdown cards */}
        <div className="flex items-center gap-2 text-right flex-wrap">
          <div className="bg-white/90 border border-park-card-border px-2.5 py-1 rounded-lg">
            <span className="text-[8px] font-rounded font-bold text-park-ink-muted block uppercase">Tera-Annum (Trillion)</span>
            <span className="text-[10px] font-mono font-bold text-park-tree">{timeMarker.teraAnnum}</span>
          </div>
          <div className="bg-white/90 border border-park-card-border px-2.5 py-1 rounded-lg">
            <span className="text-[8px] font-rounded font-bold text-park-ink-muted block uppercase">Giga-Annum (Billion)</span>
            <span className="text-[10px] font-mono font-bold text-park-tree">{timeMarker.gigaAnnum}</span>
          </div>
          <div className="bg-white/90 border border-park-card-border px-2.5 py-1 rounded-lg">
            <span className="text-[8px] font-rounded font-bold text-park-ink-muted block uppercase">Mega-Annum (Million)</span>
            <span className="text-[10px] font-mono font-bold text-park-tree">{timeMarker.megaAnnum}</span>
          </div>
        </div>
      </div>

      {/* Synchronized Multi-Tier Stratigraphic Continuum Container with Scroll Navigation */}
      <div className="relative space-y-2 pt-1 pb-2">
        
        {/* Header Indicator with Navigation Chevrons */}
        <div className="flex justify-between items-center text-[9.5px] font-rounded font-bold text-park-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
            <span className="text-park-tree font-extrabold uppercase">
              {scaleMode === 'unified_phanerozoic' ? 'ERA & PERIOD CONTINUUM (Phanerozoic Eon: 541 Ma – Present)' : 'MESOZOIC CONTINUUM (260 Ma – Present)'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-park-card-muted p-0.5 rounded-lg border border-park-card-border">
              <button
                onClick={() => handleScrollStep('left')}
                className="w-5 h-5 rounded flex items-center justify-center text-park-tree hover:bg-white hover:shadow-2xs transition-all"
                title="⬅ Chronological Direction: Deep Past (541 Ma – 250 Ma Older Stratum)"
                aria-label="Scroll timeline to deep past"
              >
                <ChevronLeft size={13} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => handleScrollStep('right')}
                className="w-5 h-5 rounded flex items-center justify-center text-park-tree hover:bg-white hover:shadow-2xs transition-all"
                title="➡ Chronological Direction: Recent Time (66 Ma – 0 Ma Younger Stratum)"
                aria-label="Scroll timeline to recent time"
              >
                <ChevronRight size={13} strokeWidth={2.5} />
              </button>
            </div>
            <span className="font-mono bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded-md font-extrabold">
              Active Timestamp: {activeAge} Ma
            </span>
          </div>
        </div>

        {/* TIER 1: ERA CONTINUUM BAR (SCROLLABLE, SYNCED & CLICK-TO-SEEK) */}
        <div className="space-y-1">
          <div 
            ref={eraScrollRef}
            onScroll={() => syncScrollPositions('era')}
            onMouseDown={(e) => handleMouseDown(e, 'era')}
            onClick={handleTrackPointerDown}
            className={`w-full overflow-x-auto no-scrollbar scroll-smooth relative rounded-xl border border-black/15 shadow-xs ${
              isDragging ? 'cursor-grabbing' : 'cursor-crosshair'
            }`}
          >
            <div 
              style={{ width: `${TIMELINE_TRACK_WIDTH_PX}px` }}
              className="relative h-8 flex overflow-hidden select-none"
            >
              {/* Paleozoic Era */}
              <div 
                style={{ width: `${paleozoicWidth}%` }}
                className="bg-[#99c08d] text-park-ink flex flex-col justify-center px-3 relative group cursor-pointer transition-all hover:brightness-105"
                onClick={(e) => { e.stopPropagation(); onSelectAgeMa?.(300); }}
                title="Paleozoic Era: 541.0 – 251.9 Ma (5.41 × 10⁸ – 2.52 × 10⁸ yr)"
              >
                <span className="text-[10px] font-rounded font-extrabold leading-tight truncate">
                  Paleozoic (5.41 × 10⁸ yr)
                </span>
                <span className="text-[8px] font-mono opacity-80 truncate">541 – 252 Ma (Cambrian–Permian)</span>
              </div>

              {/* Mesozoic Era (Age of Dinosaurs) */}
              <div 
                style={{ width: `${mesozoicWidth}%` }}
                className="bg-[#67c5ca] text-park-ink flex flex-col justify-center px-3 relative group cursor-pointer border-x border-white/50 transition-all font-extrabold shadow-inner hover:brightness-105"
                onClick={(e) => { e.stopPropagation(); onSelectAgeMa?.(150); }}
                title="Mesozoic Era (Age of Dinosaurs): 251.9 – 66.0 Ma (2.52 × 10⁸ – 6.60 × 10⁷ yr)"
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-rounded font-black leading-tight text-emerald-950 truncate">
                    Mesozoic (2.52 × 10⁸ – 6.6 × 10⁷ yr)
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 inline-block" />
                </div>
                <span className="text-[8px] font-mono opacity-90 truncate">252 – 66 Ma (Age of Reptiles & Dinosaurs)</span>
              </div>

              {/* Cenozoic Era */}
              <div 
                style={{ width: `${cenozoicWidth}%` }}
                className="bg-[#f2f97c] text-park-ink flex flex-col justify-center px-3 relative group cursor-pointer transition-all hover:brightness-105"
                onClick={(e) => { e.stopPropagation(); onSelectAgeMa?.(30); }}
                title="Cenozoic Era: 66.0 – 0 Ma (6.60 × 10⁷ yr – Present)"
              >
                <span className="text-[10px] font-rounded font-extrabold leading-tight truncate">
                  Cenozoic (6.6 × 10⁷ yr – Present)
                </span>
                <span className="text-[8px] font-mono opacity-80 truncate">66 – 0 Ma (Age of Mammals)</span>
              </div>

              {/* TIER 1 SYNCHRONIZED RED TIME MARKER NEEDLE */}
              <div 
                className="absolute top-0 bottom-0 w-1.5 bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,1)] z-20 transition-all duration-200 pointer-events-none"
                style={{ left: `${Math.max(0.5, Math.min(99.5, activeEraPercent))}%` }}
              >
                <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center shadow-md animate-pulse">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TIER 2: PERIOD CONTINUUM BAR (SCROLLABLE, SYNCED & CLICK-TO-SEEK) */}
        <div className="space-y-1 pt-0.5">
          <div 
            ref={periodScrollRef}
            onScroll={() => syncScrollPositions('period')}
            onMouseDown={(e) => handleMouseDown(e, 'period')}
            onClick={handleTrackPointerDown}
            className={`w-full overflow-x-auto no-scrollbar scroll-smooth relative rounded-xl border border-black/15 shadow-xs ${
              isDragging ? 'cursor-grabbing' : 'cursor-crosshair'
            }`}
          >
            <div 
              style={{ width: `${TIMELINE_TRACK_WIDTH_PX}px` }}
              className="relative h-10 flex overflow-hidden select-none"
            >
              {scaleMode === 'unified_phanerozoic' ? (
                /* Unified 541 Ma Linear Scale */
                <>
                  {/* Paleozoic Combined Periods */}
                  <div 
                    style={{ width: `${unifiedPaleozoicWidth}%` }}
                    className="bg-[#8bb47f] text-park-ink flex flex-col justify-center px-3 cursor-pointer transition-all hover:brightness-105"
                    onClick={() => onSelectAgeMa?.(270)}
                    title="Paleozoic (Permian, Carboniferous, Devonian, Silurian, Ordovician, Cambrian)"
                  >
                    <span className="text-[10px] font-rounded font-extrabold leading-tight truncate">
                      Paleozoic Stratum (Cambrian to Permian)
                    </span>
                    <span className="text-[8px] font-mono opacity-80 truncate">541 – 252 Ma (Early Life & Forests)</span>
                  </div>

                  {/* Triassic Period */}
                  <div 
                    style={{ width: `${unifiedTriassicWidth}%` }}
                    className="bg-[#812B92] text-white flex flex-col justify-center px-2 border-l border-white/30 cursor-pointer transition-all hover:brightness-110"
                    onClick={() => onSelectAgeMa?.(220)}
                    title="Triassic Period: 251.9 - 201.3 Ma"
                  >
                    <span className="text-[10.5px] font-rounded font-extrabold leading-tight truncate">Triassic</span>
                    <span className="text-[8px] font-mono opacity-90 truncate">252 – 201 Ma</span>
                  </div>

                  {/* Jurassic Period */}
                  <div 
                    style={{ width: `${unifiedJurassicWidth}%` }}
                    className="bg-[#34B2C9] text-park-ink flex flex-col justify-center px-2 border-l border-white/30 cursor-pointer transition-all hover:brightness-110"
                    onClick={() => onSelectAgeMa?.(152)}
                    title="Jurassic Period: 201.3 - 145.0 Ma"
                  >
                    <span className="text-[10.5px] font-rounded font-extrabold leading-tight truncate">Jurassic</span>
                    <span className="text-[8px] font-mono opacity-90 truncate">201 – 145 Ma</span>
                  </div>

                  {/* Cretaceous Period */}
                  <div 
                    style={{ width: `${unifiedCretaceousWidth}%` }}
                    className="bg-[#7FB844] text-white flex flex-col justify-center px-2.5 border-l border-white/30 cursor-pointer transition-all hover:brightness-110"
                    onClick={() => onSelectAgeMa?.(75)}
                    title="Cretaceous Period: 145.0 - 66.0 Ma"
                  >
                    <span className="text-[10.5px] font-rounded font-extrabold leading-tight truncate">Cretaceous</span>
                    <span className="text-[8px] font-mono opacity-90 truncate">145 – 66 Ma</span>
                  </div>

                  {/* Paleogene / Cenozoic */}
                  <div 
                    style={{ width: `${unifiedCenozoicWidth}%` }}
                    className="bg-[#FD9A52] text-white flex flex-col justify-center px-2 border-l border-white/30 cursor-pointer transition-all hover:brightness-110"
                    onClick={() => onSelectAgeMa?.(30)}
                    title="Cenozoic: Paleogene, Neogene, Quaternary (66 Ma - Present)"
                  >
                    <span className="text-[10.5px] font-rounded font-extrabold leading-tight truncate">Paleogene & Neogene</span>
                    <span className="text-[8px] font-mono opacity-90 truncate">66 – 0 Ma</span>
                  </div>
                </>
              ) : (
                /* Mesozoic Detail Focus Scale (260 Ma -> 0 Ma) */
                <>
                  {/* Permian Margin */}
                  <div 
                    style={{ width: `${focusPermianWidth}%` }}
                    className="bg-[#F04028] text-white flex flex-col justify-center px-2 cursor-pointer transition-all"
                    onClick={() => onSelectAgeMa?.(255)}
                    title="Late Permian (260 - 252 Ma)"
                  >
                    <span className="text-[8.5px] font-mono font-bold truncate">Permian</span>
                  </div>

                  {/* Triassic Period */}
                  <div 
                    style={{ width: `${focusTriassicWidth}%` }}
                    className="bg-[#812B92] text-white flex flex-col justify-center px-3 border-l border-white/30 cursor-pointer transition-all"
                    onClick={() => onSelectAgeMa?.(220)}
                    title="Triassic Period: 251.9 - 201.3 Ma"
                  >
                    <span className="text-[11px] font-rounded font-extrabold leading-tight">Triassic Period</span>
                    <span className="text-[8.5px] font-mono opacity-90">252 – 201 Ma</span>
                  </div>

                  {/* Jurassic Period */}
                  <div 
                    style={{ width: `${focusJurassicWidth}%` }}
                    className="bg-[#34B2C9] text-park-ink flex flex-col justify-center px-3 border-l border-white/30 cursor-pointer transition-all"
                    onClick={() => onSelectAgeMa?.(152)}
                    title="Jurassic Period: 201.3 - 145.0 Ma"
                  >
                    <span className="text-[11px] font-rounded font-extrabold leading-tight">Jurassic Period</span>
                    <span className="text-[8.5px] font-mono opacity-90">201 – 145 Ma</span>
                  </div>

                  {/* Cretaceous Period */}
                  <div 
                    style={{ width: `${focusCretaceousWidth}%` }}
                    className="bg-[#7FB844] text-white flex flex-col justify-center px-3 border-l border-white/30 cursor-pointer transition-all"
                    onClick={() => onSelectAgeMa?.(75)}
                    title="Cretaceous Period: 145.0 - 66.0 Ma"
                  >
                    <span className="text-[11px] font-rounded font-extrabold leading-tight">Cretaceous Period</span>
                    <span className="text-[8.5px] font-mono opacity-90">145 – 66 Ma</span>
                  </div>

                  {/* Cenozoic / Modern */}
                  <div 
                    style={{ width: `${focusCenozoicWidth}%` }}
                    className="bg-[#FD9A52] text-white flex flex-col justify-center px-3 border-l border-white/30 cursor-pointer transition-all opacity-85"
                    onClick={() => onSelectAgeMa?.(30)}
                    title="Cenozoic: Paleogene, Neogene, Quaternary (66 Ma - Present)"
                  >
                    <span className="text-[11px] font-rounded font-extrabold leading-tight">Cenozoic / Modern</span>
                    <span className="text-[8.5px] font-mono opacity-90">66 – 0 Ma</span>
                  </div>
                </>
              )}

              {/* TIER 2 SYNCHRONIZED RED TIME MARKER NEEDLE & RADAR BADGE */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-rose-600 shadow-[0_0_14px_rgba(225,29,72,1)] z-20 transition-all duration-300 pointer-events-none"
                style={{ left: `${Math.max(0.5, Math.min(99.5, activePeriodPercent))}%` }}
              >
                {/* Top needle head pin */}
                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center shadow-md animate-pulse">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>

                {/* Live timestamp callout badge */}
                <div className="absolute -bottom-5 -left-9 whitespace-nowrap bg-rose-950 text-white text-[8.5px] font-mono font-bold px-2 py-0.5 rounded shadow-md border border-rose-500/40">
                  {timeMarker.exactAgeMa} Ma
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TIER 3: SYNCHRONIZED EPOCH & STAGE CARDS TRACK (SCROLLABLE & SYNCHRONIZED) */}
        <div className="space-y-1 pt-1">
          <div 
            ref={epochScrollRef}
            onScroll={() => syncScrollPositions('epoch')}
            onMouseDown={(e) => handleMouseDown(e, 'epoch')}
            className={`w-full overflow-x-auto no-scrollbar scroll-smooth relative ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <div 
              style={{ width: `${TIMELINE_TRACK_WIDTH_PX}px` }}
              className="flex gap-2 py-1 select-none"
            >
              <div 
                onClick={() => onSelectAgeMa?.(234)}
                className="w-56 bg-purple-50 hover:bg-purple-100 border border-purple-200 p-2 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[10px] text-purple-900">Carnian Pluvial</span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-purple-200 text-purple-800">Triassic</span>
                </div>
                <span className="font-mono text-[9px] text-purple-700 block mt-0.5">2.34 × 10⁸ yr (234 Ma)</span>
              </div>

              <div 
                onClick={() => onSelectAgeMa?.(154)}
                className="w-56 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 p-2 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[10px] text-cyan-900">Kimmeridgian</span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-200 text-cyan-800">Jurassic</span>
                </div>
                <span className="font-mono text-[9px] text-cyan-700 block mt-0.5">1.54 × 10⁸ yr (154 Ma)</span>
              </div>

              <div 
                onClick={() => onSelectAgeMa?.(95)}
                className="w-56 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-2 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[10px] text-emerald-900">Cenomanian Mid-K</span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">Cretaceous</span>
                </div>
                <span className="font-mono text-[9px] text-emerald-700 block mt-0.5">9.50 × 10⁷ yr (95 Ma)</span>
              </div>

              <div 
                onClick={() => onSelectAgeMa?.(66)}
                className="w-56 bg-lime-50 hover:bg-lime-100 border border-lime-200 p-2 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[10px] text-lime-900">Maastrichtian K-Pg</span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-lime-200 text-lime-800">Terminal K</span>
                </div>
                <span className="font-mono text-[9px] text-lime-700 block mt-0.5">6.60 × 10⁷ yr (66 Ma)</span>
              </div>
            </div>
          </div>
        </div>

        {/* TIER 4: LIVE PRECISION CHRONO-SEEK SLIDER (SYNCHRONIZED REAL-TIME WORKSPACE CONTROL) */}
        <div className="p-2.5 bg-gradient-to-r from-rose-950 via-slate-900 to-emerald-950 text-white rounded-xl border border-rose-800/80 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-mono font-bold text-rose-300 uppercase flex items-center gap-1.5">
              <Sparkles size={11} className="text-amber-300" />
              <span>Live Stratigraphic Age Controller:</span>
            </span>
            <span className="font-mono font-extrabold text-amber-300 text-[11px] bg-rose-900/80 px-2 py-0.5 rounded border border-rose-700">
              {activeAge} Ma (Click / Slide to sync workspace)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono text-rose-300 font-bold shrink-0">541 Ma (Cambrian)</span>
            <input
              type="range"
              min="-541"
              max="0"
              step="1"
              value={-activeAge}
              onChange={(e) => {
                const newAge = Math.abs(Number(e.target.value));
                onSelectAgeMa?.(newAge);
              }}
              className="flex-1 accent-rose-500 cursor-pointer h-2 bg-rose-900/60 rounded-lg"
            />
            <span className="text-[9px] font-mono text-emerald-300 font-bold shrink-0">0 Ma (Present)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeScaleBar;
