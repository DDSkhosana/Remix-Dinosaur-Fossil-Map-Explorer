import React, { useState, useMemo, useEffect } from 'react';
import { 
  Compass, 
  Navigation, 
  MapPin, 
  ArrowUpRight, 
  ArrowRight, 
  SlidersHorizontal, 
  ChevronRight, 
  CheckCircle2, 
  RotateCw, 
  LocateFixed, 
  Globe2, 
  Route,
  X,
  ArrowLeft,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { SiteMarker } from '../types';
import { 
  RelativeLocationInfo, 
  computeAllNeighbouringRelativeLocations,
  formatBearingDisplay,
  Cardinal16
} from '../utils/cardinalDirection';

interface NeighbouringExcavationRadarProps {
  currentSite: SiteMarker;
  allSites: SiteMarker[];
  onSelectSite: (site: SiteMarker) => void;
  taxaName: string;
  onClose?: () => void;
}

export const NeighbouringExcavationRadar: React.FC<NeighbouringExcavationRadarProps> = ({
  currentSite,
  allSites,
  onSelectSite,
  taxaName,
  onClose
}) => {
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi' | 'nm'>('km');
  const [bearingNotation, setBearingNotation] = useState<'both' | 'cardinal' | 'degrees'>('both');
  const [sortBy, setSortBy] = useState<'distance' | 'azimuth'>('distance');
  const [hoveredNeighbourId, setHoveredNeighbourId] = useState<string | null>(null);
  const [showHelpTooltips, setShowHelpTooltips] = useState(false);
  const [displayMode, setDisplayMode] = useState<'globe3d' | 'horizon3d'>('globe3d');
  const [globeRotation, setGlobeRotation] = useState(-currentSite.coordinates.lng);
  const [globeTilt, setGlobeTilt] = useState(Math.max(-45, Math.min(45, currentSite.coordinates.lat * 0.45)));
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [radarRotation, setRadarRotation] = useState(30);

  // Auto-spin the 3D globe or radar dome when enabled
  useEffect(() => {
    if (!isAutoSpinning || isDragging) return;
    const timer = setInterval(() => {
      setGlobeRotation(r => (r + 0.45) % 360);
      setRadarRotation(r => (r + 0.55) % 360);
    }, 45);
    return () => clearInterval(timer);
  }, [isAutoSpinning, isDragging]);

  const handleGlobeMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  const handleGlobeMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setGlobeRotation(r => (r + dx * 0.75) % 360);
    setGlobeTilt(t => Math.max(-65, Math.min(65, t - dy * 0.5)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  const handleGlobeMouseUp = () => {
    setIsDragging(false);
  };

  const handleGlobeTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };
  const handleGlobeTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    setGlobeRotation(r => (r + dx * 0.75) % 360);
    setGlobeTilt(t => Math.max(-65, Math.min(65, t - dy * 0.5)));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const recenterGlobe = () => {
    setGlobeRotation(-currentSite.coordinates.lng);
    setGlobeTilt(Math.max(-45, Math.min(45, currentSite.coordinates.lat * 0.45)));
  };

  // Universal Escape key exit listener
  useEffect(() => {
    if (!onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Compute relative location and cardinal bearings from the current site to all neighbours
  const neighbours: RelativeLocationInfo[] = useMemo(() => {
    const computed = computeAllNeighbouringRelativeLocations(currentSite, allSites);
    if (sortBy === 'azimuth') {
      return [...computed].sort((a, b) => a.azimuthDeg - b.azimuthDeg);
    }
    return computed;
  }, [currentSite, allSites, sortBy]);

  // Max distance for radar radial scaling (minimum 250km to avoid division by zero)
  const maxDistanceKm = useMemo(() => {
    if (neighbours.length === 0) return 500;
    const max = Math.max(...neighbours.map(n => n.distanceKm));
    return Math.max(200, Math.ceil(max / 100) * 100);
  }, [neighbours]);

  // Dynamic Map Transform based on hovered site for target zoom & pan
  const mapTransform = useMemo(() => {
    if (!hoveredNeighbourId) {
      return "translate(0, 0) scale(1)";
    }
    const targetNeighbour = neighbours.find(n => n.targetSiteId === hoveredNeighbourId);
    if (!targetNeighbour) return "translate(0, 0) scale(1)";
    
    // Pan slightly opposite to neighbor direction to bring it into focal view
    const radAngle = (targetNeighbour.azimuthDeg * Math.PI) / 180;
    const distanceRatio = Math.min(0.6, targetNeighbour.distanceKm / maxDistanceKm);
    const panX = -45 * distanceRatio * Math.sin(radAngle);
    const panY = 45 * distanceRatio * Math.cos(radAngle);
    return `translate(${panX}, ${panY}) scale(1.18)`;
  }, [hoveredNeighbourId, neighbours, maxDistanceKm]);

  const formatDistance = (n: RelativeLocationInfo) => {
    if (distanceUnit === 'mi') return `${n.distanceMiles.toFixed(1)} mi`;
    if (distanceUnit === 'nm') return `${n.distanceNauticalMiles.toFixed(1)} nm`;
    return `${n.distanceKm.toFixed(1)} km`;
  };

  const getQuadrantColor = (cardinal: Cardinal16) => {
    if (cardinal.includes('N') && cardinal.includes('E')) return 'border-emerald-500 text-emerald-800 bg-emerald-50';
    if (cardinal.includes('N') && cardinal.includes('W')) return 'border-sky-500 text-sky-800 bg-sky-50';
    if (cardinal.includes('S') && cardinal.includes('E')) return 'border-amber-500 text-amber-800 bg-amber-50';
    if (cardinal.includes('S') && cardinal.includes('W')) return 'border-rose-500 text-rose-800 bg-rose-50';
    if (cardinal.includes('N')) return 'border-emerald-500 text-emerald-800 bg-emerald-50';
    if (cardinal.includes('S')) return 'border-rose-500 text-rose-800 bg-rose-50';
    if (cardinal.includes('E')) return 'border-amber-500 text-amber-800 bg-amber-50';
    return 'border-sky-500 text-sky-800 bg-sky-50';
  };

  if (allSites.length <= 1) {
    return (
      <div className="p-4 bg-park-sand/40 border border-park-card-border rounded-2xl text-center">
        <Compass size={24} className="text-park-tree/50 mx-auto mb-2" />
        <h4 className="text-[12px] font-rounded font-bold text-park-tree">Single Expedition Locality</h4>
        <p className="text-[11px] font-rounded text-park-ink-muted mt-1">
          Only one excavation locality recorded for {taxaName}. No neighbouring sites in this stratum.
        </p>
      </div>
    );
  }

  // Radar & 3D Globe Dimensions
  const radarSize = 280;
  const center = radarSize / 2;
  const radius = center - 24;

  const globeR = 98;
  const globeCx = radarSize / 2;
  const globeCy = radarSize / 2;

  const projectGlobePoint = (latDeg: number, lngDeg: number) => {
    const lat = (latDeg * Math.PI) / 180;
    const lng = ((lngDeg + globeRotation) * Math.PI) / 180;
    const tiltRad = (globeTilt * Math.PI) / 180;

    const x0 = Math.cos(lat) * Math.sin(lng);
    const y0 = Math.sin(lat);
    const z0 = Math.cos(lat) * Math.cos(lng);

    // Rotate by tilt around X-axis
    const x1 = x0;
    const y1 = y0 * Math.cos(tiltRad) - z0 * Math.sin(tiltRad);
    const z1 = y0 * Math.sin(tiltRad) + z0 * Math.cos(tiltRad);

    return {
      x: globeCx + globeR * x1,
      y: globeCy - globeR * y1,
      z: z1,
      visible: z1 > -0.06
    };
  };

  const latLonToVec = (latDeg: number, lonDeg: number) => {
    const lat = (latDeg * Math.PI) / 180;
    const lon = (lonDeg * Math.PI) / 180;
    return {
      x: Math.cos(lat) * Math.sin(lon),
      y: Math.sin(lat),
      z: Math.cos(lat) * Math.cos(lon)
    };
  };

  const getGreatCircleArcPoints = (lat1: number, lon1: number, lat2: number, lon2: number, steps = 18) => {
    const v1 = latLonToVec(lat1, lon1);
    const v2 = latLonToVec(lat2, lon2);
    const dot = Math.max(-1, Math.min(1, v1.x * v2.x + v1.y * v2.y + v1.z * v2.z));
    const omega = Math.acos(dot);
    const pts = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let vx, vy, vz;
      if (omega < 0.001) {
        vx = v1.x; vy = v1.y; vz = v1.z;
      } else {
        const sinOmega = Math.sin(omega);
        const a = Math.sin((1 - t) * omega) / sinOmega;
        const b = Math.sin(t * omega) / sinOmega;
        vx = a * v1.x + b * v2.x;
        vy = a * v1.y + b * v2.y;
        vz = a * v1.z + b * v2.z;
      }
      const lat = Math.asin(Math.max(-1, Math.min(1, vy))) * (180 / Math.PI);
      const lon = Math.atan2(vx, vz) * (180 / Math.PI);
      pts.push(projectGlobePoint(lat, lon));
    }
    return pts;
  };

  // Continents on 3D globe
  const globeContinents = [
    // North America
    [
      { lat: 15, lng: -90 }, { lat: 25, lng: -80 }, { lat: 30, lng: -85 },
      { lat: 40, lng: -74 }, { lat: 50, lng: -60 }, { lat: 60, lng: -65 },
      { lat: 70, lng: -100 }, { lat: 70, lng: -140 }, { lat: 60, lng: -165 },
      { lat: 55, lng: -130 }, { lat: 45, lng: -125 }, { lat: 30, lng: -115 },
      { lat: 20, lng: -105 }
    ],
    // South America
    [
      { lat: 10, lng: -75 }, { lat: 5, lng: -55 }, { lat: -5, lng: -35 },
      { lat: -20, lng: -40 }, { lat: -35, lng: -55 }, { lat: -55, lng: -68 },
      { lat: -45, lng: -75 }, { lat: -20, lng: -70 }, { lat: -5, lng: -80 }
    ],
    // Eurasia
    [
      { lat: 36, lng: -5 }, { lat: 44, lng: 10 }, { lat: 40, lng: 30 },
      { lat: 30, lng: 50 }, { lat: 22, lng: 70 }, { lat: 10, lng: 80 },
      { lat: 20, lng: 105 }, { lat: 35, lng: 120 }, { lat: 40, lng: 130 },
      { lat: 60, lng: 140 }, { lat: 70, lng: 110 }, { lat: 72, lng: 60 },
      { lat: 65, lng: 25 }, { lat: 55, lng: 5 }
    ],
    // Africa
    [
      { lat: 35, lng: -5 }, { lat: 30, lng: 32 }, { lat: 12, lng: 43 },
      { lat: 0, lng: 42 }, { lat: -20, lng: 35 }, { lat: -34, lng: 20 },
      { lat: -20, lng: 12 }, { lat: 5, lng: 2 }, { lat: 15, lng: -17 }
    ],
    // Australia
    [
      { lat: -12, lng: 132 }, { lat: -15, lng: 145 }, { lat: -25, lng: 153 },
      { lat: -38, lng: 145 }, { lat: -35, lng: 115 }, { lat: -22, lng: 114 }
    ]
  ];

  const project3DPolar = (deg: number, distanceFrac: number) => {
    // Map polar coordinate to a 3D spherical lens dome surface
    const thetaRad = (deg * Math.PI) / 180;
    const phiRad = distanceFrac * (Math.PI / 2.5); // Spherical dip angle

    // Polar points mapped to a 3D hemisphere
    const x3d = Math.sin(phiRad) * Math.sin(thetaRad);
    const y3d = Math.sin(phiRad) * Math.cos(thetaRad);
    const z3d = Math.cos(phiRad);

    // Apply rotation around the Z-axis (spinning)
    const rotRad = (radarRotation * Math.PI) / 180;
    const xRot = x3d * Math.cos(rotRad) - y3d * Math.sin(rotRad);
    const yRot = x3d * Math.sin(rotRad) + y3d * Math.cos(rotRad);

    return {
      x: center + radius * xRot,
      y: center - radius * yRot,
      z: z3d
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-park-card-border p-3.5 sm:p-4 shadow-xs space-y-3.5">
      {/* Master Module Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-park-card-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-700 shadow-2xs shrink-0">
            <Compass size={16} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-rounded font-extrabold text-park-accent-green uppercase tracking-wider">
                Geodesic Navigation & Azimuth
              </span>
              <span className="text-slate-400 text-[10px]" aria-hidden="true">·</span>
              <span className="text-[9.5px] font-mono font-bold text-teal-900 bg-teal-50 px-2 py-0.2 rounded-md border border-teal-200">
                {currentSite.lat.toFixed(4)}°N, {Math.abs(currentSite.lng).toFixed(4)}°{currentSite.lng >= 0 ? 'E' : 'W'}
              </span>
            </div>
            <h4 className="text-[13px] sm:text-[14px] font-rounded font-extrabold text-park-tree leading-snug">
              {currentSite.name} — Neighbouring Excavation Radar
            </h4>
            <p className="text-[10px] font-rounded text-park-ink-muted leading-tight">
              3D spherical geodetic compass, true-north bearings & great-circle distances
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Proximity Count Badge */}
          <div className="flex items-center gap-1.5 bg-teal-50/80 px-2.5 py-1 rounded-xl border border-teal-200/80">
            <Route size={13} className="text-teal-700" />
            <span className="text-[10px] font-rounded font-bold text-teal-900">
              {neighbours.length} {neighbours.length === 1 ? 'Site' : 'Sites'} Detected
            </span>
          </div>

          {/* Dedicated Exit Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-rounded font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Exit Radar & Return to Overview (Esc)"
            >
              <X size={13} strokeWidth={2.5} />
              <span>Exit Radar</span>
              <span className="text-[9px] font-mono bg-black/25 px-1 py-0.2 rounded text-white/90">Esc</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Controls Bar: Units, Bearing Display, and Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-park-card-muted/80 p-1.5 sm:p-2 rounded-xl border border-park-card-border/60">
        {/* Distance Unit Toggle */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-rounded font-bold text-park-ink-muted uppercase mr-1">Unit:</span>
          <div className="flex items-center gap-0.5 bg-white/90 p-0.5 rounded-lg border border-park-card-border/60">
            {(['km', 'mi', 'nm'] as const).map(u => (
              <button
                key={u}
                onClick={() => setDistanceUnit(u)}
                className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  distanceUnit === u
                    ? 'bg-park-tree text-white shadow-2xs'
                    : 'text-park-ink-muted hover:text-park-tree hover:bg-park-sand/40'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Bearing Notation Toggle */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-rounded font-bold text-park-ink-muted uppercase mr-1">Bearing:</span>
          <div className="flex items-center gap-0.5 bg-white/90 p-0.5 rounded-lg border border-park-card-border/60">
            {(['both', 'cardinal', 'degrees'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setBearingNotation(mode)}
                className={`px-2 py-0.5 rounded-md text-[9px] font-rounded font-bold capitalize transition-all cursor-pointer ${
                  bearingNotation === mode
                    ? 'bg-park-tree text-white shadow-2xs'
                    : 'text-park-ink-muted hover:text-park-tree hover:bg-park-sand/40'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Tooltips Button */}
        <button
          onClick={() => setShowHelpTooltips(!showHelpTooltips)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[9.5px] font-rounded font-bold transition-all cursor-pointer shadow-3xs ${
            showHelpTooltips
              ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
              : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200'
          }`}
          title="Toggle interactive explanatory guide tooltips across the radar"
        >
          <BookOpen size={11} />
          <span>Guide: {showHelpTooltips ? 'Active' : 'Off'}</span>
        </button>

        {/* Sort order toggle */}
        <button
          onClick={() => setSortBy(prev => prev === 'distance' ? 'azimuth' : 'distance')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-park-sand/40 border border-park-card-border text-[9.5px] font-rounded font-bold text-park-tree transition-all ml-auto shadow-3xs cursor-pointer"
          title="Toggle sorting between nearest distance or clockwise compass azimuth"
        >
          <SlidersHorizontal size={11} />
          <span>Sort: {sortBy === 'distance' ? 'Proximity' : 'Azimuth 0°-360°'}</span>
        </button>
      </div>

      {/* 2-Column or Stacked View: Interactive Polar Compass Radar + Neighbour Cards (Independently Scrollable) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-w-0">
        
        {/* Left / Top: Interactive 3D Spherical Geodetic Compass Globe & Horizon Viewport */}
        <div className="lg:col-span-5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-xl flex flex-col items-center justify-between text-white min-w-0">
          {/* Top Control Bar of 3D Globe */}
          <div className="w-full flex justify-between items-center mb-2 text-[9.5px] font-mono border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider">
              <Globe2 size={13} className="text-cyan-400 animate-pulse" />
              <span>3D Geodetic Compass Globe</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsAutoSpinning(!isAutoSpinning)}
                className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold border transition-all cursor-pointer ${
                  isAutoSpinning 
                    ? 'bg-cyan-900/60 text-cyan-300 border-cyan-700' 
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Toggle continuous 3D Earth auto-rotation"
              >
                {isAutoSpinning ? 'Auto: ON' : 'Auto: OFF'}
              </button>
              <button
                onClick={recenterGlobe}
                className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 text-[8.5px] font-mono font-bold transition-all cursor-pointer"
                title="Recenter 3D view on current excavation site"
              >
                Recenter
              </button>
            </div>
          </div>

          {/* Interactive 3D Globe Canvas Container */}
          <div 
            className="relative w-[280px] h-[280px] my-1 select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
            onMouseDown={handleGlobeMouseDown}
            onMouseMove={handleGlobeMouseMove}
            onMouseUp={handleGlobeMouseUp}
            onMouseLeave={handleGlobeMouseUp}
            onTouchStart={handleGlobeTouchStart}
            onTouchMove={handleGlobeTouchMove}
            onTouchEnd={handleGlobeMouseUp}
          >
            {/* Gesture Hint Badge */}
            <div className="absolute top-2 left-2 z-10 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-800 pointer-events-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>3D Globe: Drag to Rotate & Spin</span>
            </div>

            {/* SVG 3D Spherical Rendering */}
            <svg viewBox={`0 0 ${radarSize} ${radarSize}`} className="w-full h-full relative z-10 drop-shadow-[0_0_25px_rgba(6,182,212,0.18)]">
              <defs>
                <radialGradient id="azimuth-globe-ocean" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="60%" stopColor="#070c18" />
                  <stop offset="100%" stopColor="#02040a" />
                </radialGradient>

                <radialGradient id="azimuth-globe-atmosphere" cx="50%" cy="50%" r="50%">
                  <stop offset="85%" stopColor="#000000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.45" />
                </radialGradient>

                <clipPath id="azimuth-globe-clip">
                  <circle cx={globeCx} cy={globeCy} r={globeR} />
                </clipPath>

                {/* Animated dash pattern for active geodesic vector */}
                <linearGradient id="active-geodesic-flow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Outer Cardinal Geodetic Compass Rose Ring */}
              <circle cx={globeCx} cy={globeCy} r={globeR + 14} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
              <circle cx={globeCx} cy={globeCy} r={globeR + 5} fill="none" stroke="#1e293b" strokeWidth="1.5" />

              {/* 3D Cardinal Compass Directions around Rim */}
              {(() => {
                const rCompass = globeR + 18;
                return (
                  <g fontSize="7.5" fontWeight="extrabold" fontFamily="monospace" fill="#38bdf8">
                    <text x={globeCx} y={globeCy - rCompass + 4} textAnchor="middle">N 000°</text>
                    <text x={globeCx + rCompass} y={globeCy + 3} textAnchor="start">E 090°</text>
                    <text x={globeCx} y={globeCy + rCompass + 2} textAnchor="middle">S 180°</text>
                    <text x={globeCx - rCompass} y={globeCy + 3} textAnchor="end">W 270°</text>
                  </g>
                );
              })()}

              {/* 3D Spherical Globe Ocean Base (Clipped) */}
              <g clipPath="url(#azimuth-globe-clip)">
                <circle cx={globeCx} cy={globeCy} r={globeR} fill="url(#azimuth-globe-ocean)" />

                {/* 3D Graticule: Parallels (Latitudes) */}
                {[-60, -30, 0, 30, 60].map((lat, idx) => {
                  const pts = Array.from({ length: 49 }).map((_, i) => {
                    const lng = -180 + i * 7.5;
                    return projectGlobePoint(lat, lng);
                  });
                  const pathD = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  const isEquator = lat === 0;
                  return (
                    <path
                      key={idx}
                      d={pathD}
                      fill="none"
                      stroke={isEquator ? "#10b981" : "#334155"}
                      strokeWidth={isEquator ? 1.2 : 0.6}
                      strokeDasharray={isEquator ? "3,2" : "2,3"}
                      opacity={isEquator ? 0.6 : 0.35}
                    />
                  );
                })}

                {/* 3D Graticule: Meridians (Longitudes every 30°) */}
                {Array.from({ length: 12 }).map((_, idx) => {
                  const lng = idx * 30;
                  const pts = Array.from({ length: 37 }).map((_, i) => {
                    const lat = -90 + i * 5;
                    return projectGlobePoint(lat, lng);
                  });
                  const pathD = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  return (
                    <path
                      key={idx}
                      d={pathD}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="0.6"
                      strokeDasharray="2,3"
                      opacity="0.35"
                    />
                  );
                })}

                {/* 3D Continental Landmass Silhouettes */}
                {globeContinents.map((continent, cIdx) => {
                  const pts = continent.map(c => projectGlobePoint(c.lat, c.lng));
                  const avgZ = pts.reduce((s, p) => s + p.z, 0) / pts.length;
                  const isFront = avgZ > -0.05;
                  const d = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '') + ' Z';
                  return (
                    <path
                      key={cIdx}
                      d={d}
                      fill="#065f46"
                      fillOpacity={isFront ? 0.35 : 0.08}
                      stroke="#10b981"
                      strokeWidth="0.8"
                      strokeOpacity={isFront ? 0.6 : 0.15}
                    />
                  );
                })}

                {/* 3D Great-Circle Geodesic Arcs connecting Origin to Neighbours */}
                {neighbours.map((n) => {
                  const targetSite = allSites.find(s => s.id === n.targetSiteId);
                  if (!targetSite) return null;
                  const isHovered = hoveredNeighbourId === n.targetSiteId;
                  const arcPts = getGreatCircleArcPoints(
                    currentSite.coordinates.lat,
                    currentSite.coordinates.lng,
                    targetSite.coordinates.lat,
                    targetSite.coordinates.lng,
                    22
                  );

                  // Only render visible segments on front of globe
                  const visiblePts = arcPts.filter(p => p.visible);
                  if (visiblePts.length < 2) return null;

                  const pathD = arcPts.reduce((acc, p) => {
                    if (!p.visible) return acc;
                    return `${acc} ${acc === '' ? 'M' : 'L'} ${p.x} ${p.y}`;
                  }, '');

                  if (!pathD) return null;

                  return (
                    <g key={n.targetSiteId}>
                      {/* Glow halo behind geodesic arc if hovered */}
                      {isHovered && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="4"
                          strokeLinecap="round"
                          opacity="0.45"
                        />
                      )}
                      {/* Primary Geodesic Great-Circle Arc Line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isHovered ? "url(#active-geodesic-flow)" : "#059669"}
                        strokeWidth={isHovered ? 2.5 : 1.2}
                        strokeDasharray={isHovered ? "4,2" : "2,2"}
                        strokeLinecap="round"
                        opacity={isHovered ? 1 : 0.75}
                      />
                    </g>
                  );
                })}

                {/* Origin Site 3D Beacon Node */}
                {(() => {
                  const orig3d = projectGlobePoint(currentSite.coordinates.lat, currentSite.coordinates.lng);
                  if (!orig3d.visible) return null;
                  return (
                    <g className="pointer-events-none">
                      {/* Pulsing Beacon Ring */}
                      <circle cx={orig3d.x} cy={orig3d.y} r="12" fill="#10b981" fillOpacity="0.25" className="animate-ping" />
                      <circle cx={orig3d.x} cy={orig3d.y} r="8" fill="#047857" fillOpacity="0.5" />
                      <circle cx={orig3d.x} cy={orig3d.y} r="4" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
                      
                      {/* Origin Site Label Pill */}
                      <g transform={`translate(${orig3d.x}, ${orig3d.y + 11})`}>
                        <rect x="-18" y="0" width="36" height="11" rx="3" fill="#047857" fillOpacity="0.9" stroke="#34d399" strokeWidth="0.6" />
                        <text x="0" y="8" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#ffffff" fontFamily="sans-serif">
                          ORIGIN
                        </text>
                      </g>
                    </g>
                  );
                })()}

                {/* Neighbour Site 3D Nodes & Interactive Click Targets */}
                {neighbours.map((n) => {
                  const targetSite = allSites.find(s => s.id === n.targetSiteId);
                  if (!targetSite) return null;
                  const node3d = projectGlobePoint(targetSite.coordinates.lat, targetSite.coordinates.lng);
                  if (!node3d.visible) return null;
                  const isHovered = hoveredNeighbourId === n.targetSiteId;

                  return (
                    <g
                      key={n.targetSiteId}
                      className="cursor-pointer"
                      onClick={() => onSelectSite(targetSite)}
                      onMouseEnter={() => setHoveredNeighbourId(n.targetSiteId)}
                      onMouseLeave={() => setHoveredNeighbourId(null)}
                    >
                      {/* Generous touch / hit circle */}
                      <circle cx={node3d.x} cy={node3d.y} r="14" fill="transparent" />

                      {/* Outer pulse when hovered */}
                      {isHovered && (
                        <circle cx={node3d.x} cy={node3d.y} r="12" fill="#38bdf8" fillOpacity="0.4" className="animate-pulse" />
                      )}

                      {/* Node Marker Dot */}
                      <circle
                        cx={node3d.x}
                        cy={node3d.y}
                        r={isHovered ? 6 : 4}
                        fill={isHovered ? "#38bdf8" : "#f59e0b"}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />

                      {/* Dynamic Azimuth / Distance Pill Label */}
                      <g className="pointer-events-none">
                        <rect
                          x={node3d.x > globeCx ? node3d.x + 5 : node3d.x - 55}
                          y={node3d.y - 7}
                          width="50"
                          height="13"
                          rx="3"
                          fill={isHovered ? "#1e3a8a" : "#0f172a"}
                          fillOpacity="0.92"
                          stroke={isHovered ? "#60a5fa" : "#475569"}
                          strokeWidth="0.8"
                        />
                        <text
                          x={node3d.x > globeCx ? node3d.x + 30 : node3d.x - 30}
                          y={node3d.y + 2.5}
                          textAnchor="middle"
                          fontSize="6.5"
                          fontWeight="bold"
                          fill="#ffffff"
                          fontFamily="monospace"
                        >
                          {n.cardinal} • {Math.round(n.distanceKm)}km
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* 3D Atmosphere Rim Highlight (Front of globe) */}
                <circle cx={globeCx} cy={globeCy} r={globeR} fill="url(#azimuth-globe-atmosphere)" pointerEvents="none" />
              </g>
            </svg>
          </div>

          {/* Bottom Globe Status & Bearing Legend */}
          <div className="w-full pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Compass size={11} className="text-emerald-400" />
              <span>Rot: {Math.round(globeRotation % 360)}° • Tilt: {Math.round(globeTilt)}°</span>
            </span>
            <span className="text-amber-400 font-bold">
              {neighbours.length} Geodesic Targets
            </span>
          </div>

          {/* Toggleable Tooltips Overlay Legend */}
          {showHelpTooltips && (
            <div className="mt-2.5 p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[10px] leading-relaxed space-y-1 w-full animate-fade-in text-slate-300 font-mono">
              <div className="font-extrabold text-cyan-400 flex items-center gap-1">
                <Sparkles size={11} className="text-cyan-400 animate-pulse" />
                <span>3D Geodetic Compass Globe Guide</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[9px]">
                <li><strong className="text-slate-200">Drag to Spin in 3D</strong>: Freely rotate the 3D globe horizontally and vertically to inspect geodesic vectors across Earth.</li>
                <li><strong className="text-slate-200">Great-Circle Arcs</strong>: Dynamic curved lines represent shortest true geodesic paths across Earth's curvature.</li>
                <li><strong className="text-slate-200">Recenter</strong>: Quickly orient the globe to center directly on your active excavation site.</li>
              </ul>
            </div>
          )}

          <div className="text-center text-[9px] font-mono text-slate-400 mt-2">
            Click any 3D node on globe to target & examine bearing
          </div>
        </div>

        {/* Right / Bottom: Proximity & Directionality Cards List (Independently Scrollable) */}
        <div className="lg:col-span-7 space-y-2.5 overflow-y-auto custom-scrollbar max-h-[620px] min-w-0 pr-0.5">
          <div className="flex justify-between items-center text-[10px] font-rounded font-bold text-park-ink-muted px-1">
            <span>NEIGHBOURING EXCAVATION SITES</span>
            <span>BEARING • DISTANCE</span>
          </div>

          {neighbours.map((n, idx) => {
            const isHovered = hoveredNeighbourId === n.targetSiteId;
            const quadrantStyle = getQuadrantColor(n.cardinal);
            const targetMarker = allSites.find(s => s.id === n.targetSiteId || s.name === n.targetSiteName);

            return (
              <div
                key={n.targetSiteId}
                onMouseEnter={() => setHoveredNeighbourId(n.targetSiteId)}
                onMouseLeave={() => setHoveredNeighbourId(null)}
                className={`p-3 bg-white rounded-2xl border transition-all duration-150 ${
                  isHovered 
                    ? 'border-blue-400 ring-2 ring-blue-100 shadow-md' 
                    : 'border-park-card-border shadow-2xs hover:border-park-card-border/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-start gap-2">
                    {/* Rotating Compass Indicator Icon with Exact Azimuth Bearing */}
                    <div 
                      className="w-8 h-8 rounded-xl bg-park-sand/60 border border-park-card-border flex items-center justify-center shrink-0 shadow-2xs"
                      title={`Bearing: ${n.azimuthDeg}° ${n.cardinalFullName}`}
                    >
                      <Navigation 
                        size={15} 
                        style={{ transform: `rotate(${n.azimuthDeg}deg)` }}
                        className="text-park-tree transition-transform duration-300" 
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-park-ink-muted">
                          #{idx + 1}
                        </span>
                        <h5 className="text-[12px] font-rounded font-extrabold text-park-tree">
                          {n.targetSiteName}
                        </h5>
                      </div>
                      <span className="text-[9px] font-mono text-park-ink-muted block">
                        {n.targetLat.toFixed(3)}°N, {Math.abs(n.targetLng).toFixed(3)}°{n.targetLng >= 0 ? 'E' : 'W'}
                      </span>
                    </div>
                  </div>

                  {/* Cardinal Badge & Distance */}
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded-lg border text-[10px] font-mono font-extrabold ${quadrantStyle}`}>
                      {formatBearingDisplay(n.azimuthDeg, n.cardinal, bearingNotation)}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-park-tree block mt-0.5">
                      {formatDistance(n)}
                    </span>
                  </div>
                </div>

                {/* Relative Coordinate Offsets & Vector Specs */}
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-park-card-border/60 text-[9px] font-mono text-park-ink-muted">
                  <div className="bg-park-sand/30 p-1.5 rounded-lg">
                    <span className="text-[8px] font-rounded font-bold uppercase text-slate-500 block">Relative Lat/Lng</span>
                    <span className="text-slate-800 font-bold">
                      ΔLat: {n.deltaLatDeg >= 0 ? `+${n.deltaLatDeg}°` : `${n.deltaLatDeg}°`} ({n.deltaLatKm >= 0 ? `+${n.deltaLatKm}km` : `${n.deltaLatKm}km`})
                    </span>
                    <span className="block text-slate-700">
                      ΔLng: {n.deltaLngDeg >= 0 ? `+${n.deltaLngDeg}°` : `${n.deltaLngDeg}°`} ({n.deltaLngKm >= 0 ? `+${n.deltaLngKm}km` : `${n.deltaLngKm}km`})
                    </span>
                  </div>

                  <div className="bg-park-sand/30 p-1.5 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-rounded font-bold uppercase text-slate-500 block">Reciprocal Bearing</span>
                      <span className="text-slate-800 font-bold">
                        Return: {n.reciprocalCardinal} ({n.reciprocalAzimuthDeg}°)
                      </span>
                    </div>
                    {targetMarker && (
                      <button
                        onClick={() => onSelectSite(targetMarker)}
                        className="mt-1 w-full flex items-center justify-center gap-1 py-1 rounded bg-park-tree text-white hover:bg-park-tree/90 text-[8.5px] font-rounded font-bold transition-all active:scale-95 shadow-2xs"
                      >
                        <span>Set as Origin</span>
                        <ArrowRight size={10} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Vector description string */}
                <div className="mt-1.5 text-[8.5px] font-rounded text-slate-600 flex items-center gap-1 italic">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{n.cardinalVectorDescription}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NeighbouringExcavationRadar;
