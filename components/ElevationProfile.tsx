import React, { useState } from 'react';
import { ElevationData } from '../types';
import { getElevationDataForSite } from '../utils/paleoElevation';
import { Mountain, Layers, ArrowUpRight, Compass, ArrowDown, MapPin, CheckCircle2, SlidersHorizontal, Plus, Minus, RotateCcw, Activity } from 'lucide-react';

interface ElevationProfileProps {
  elevation?: ElevationData;
  siteName: string;
}

const ElevationProfile: React.FC<ElevationProfileProps> = ({ elevation: elevationProp, siteName }) => {
  const elevation = elevationProp || getElevationDataForSite(siteName, { lat: 45.0, lng: -105.0 }, 'Subtropical');
  const profile = elevation.crossSectionProfile;
  const maxAlt = Math.max(...profile.map(p => p.altitudeM), 500);

  // Interactive Numerical State with Relevant Interval Manipulation
  const [sliceInterval, setSliceInterval] = useState<number>(50); // ±25m, ±50m, ±100m, ±250m
  const [activeDatumCutM, setActiveDatumCutM] = useState<number>(elevation.paleoElevationM);
  
  const [depthInterval, setDepthInterval] = useState<number>(10); // ±5m, ±10m, ±25m, ±50m
  const [activeDepthM, setActiveDepthM] = useState<number>(elevation.taphonomicBurialDepthM);

  // Interactive Node Selection on Cross-Section SVG
  const defaultSiteIdx = profile.findIndex(p => p.isSiteLocation);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(defaultSiteIdx >= 0 ? defaultSiteIdx : 0);
  const [pressureUnit, setPressureUnit] = useState<'MPa' | 'bar' | 'psi'>('MPa');

  const stepDatumCut = (sign: 1 | -1) => {
    setActiveDatumCutM(prev => Math.max(0, Math.min(1500, prev + sign * sliceInterval)));
  };

  const stepDepth = (sign: 1 | -1) => {
    setActiveDepthM(prev => Math.max(5, Math.min(600, prev + sign * depthInterval)));
  };

  const resetValues = () => {
    setActiveDatumCutM(elevation.paleoElevationM);
    setActiveDepthM(elevation.taphonomicBurialDepthM);
    setSelectedPointIndex(defaultSiteIdx >= 0 ? defaultSiteIdx : 0);
  };

  // Lithostatic overburden pressure calculation (P = rho * g * h)
  // Average sediment density rho ≈ 2400 kg/m³
  const rawMpa = (2400 * 9.81 * activeDepthM) / 1e6;
  const overburdenPressureFormatted = pressureUnit === 'MPa'
    ? `${rawMpa.toFixed(2)} MPa`
    : pressureUnit === 'bar'
    ? `${(rawMpa * 10).toFixed(1)} bar`
    : `${(rawMpa * 145.038).toFixed(0)} psi`;

  // Percentage of cross-section points exceeding active datum cut
  const pointsAboveDatum = profile.filter(p => p.altitudeM >= activeDatumCutM).length;
  const percentAbove = Math.round((pointsAboveDatum / profile.length) * 100);

  const selectedPt = profile[selectedPointIndex] || profile[0];

  return (
    <div className="bg-white/95 rounded-2xl border border-park-card-border p-4 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-park-card-border pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-600/10 border border-amber-600/20 flex items-center justify-center text-amber-700">
            <Mountain size={15} />
          </div>
          <div>
            <h4 className="text-[12px] font-rounded font-extrabold text-park-tree uppercase tracking-wider">
              Paleo-Hypsometry & Topographic Relief Profile
            </h4>
            <span className="text-[10px] font-rounded text-park-ink-muted font-medium">
              Depositional Elevation, Tectonic Uplift & Interactive Interval Slicing
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
            {elevation.hypsometryZone}
          </span>
          <button
            onClick={resetValues}
            className="p-1 rounded-md text-park-ink-muted hover:text-park-tree hover:bg-park-sand/50 transition-colors"
            title="Reset Numerical Intervals"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Side-by-Side Module Layout: Cross-Section Chart + Interactive Altimetry Slicers (Synchronized & Compact) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch min-w-0">
        
        {/* Cross-Section Terrain Elevation Chart (Left Column) */}
        <div className="bg-park-card-muted/60 p-2.5 rounded-xl border border-park-card-border space-y-1.5 flex flex-col justify-between overflow-auto custom-scrollbar min-w-0">
          <div className="flex justify-between items-center text-[10px] font-rounded font-extrabold text-park-tree uppercase">
            <span>Regional Paleogeographic Cross-Section Profile</span>
            <span className="text-[9px] font-mono text-emerald-700 font-bold">
              Datum Cut: {activeDatumCutM}m ({percentAbove}% above)
            </span>
          </div>

          <div className="relative w-full h-36 bg-white rounded-lg border border-park-card-border p-2 flex flex-col justify-between">
            <svg className="w-full h-full overflow-visible cursor-pointer" viewBox="0 0 380 85">
              {/* Sea level baseline */}
              <line x1="0" y1="70" x2="380" y2="70" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,3" />
              <text x="10" y="77" fontSize="6" fill="#0284c7" fontFamily="monospace">0m Paleo-Sea Level</text>

              {/* Height gridlines */}
              <line x1="0" y1="40" x2="380" y2="40" stroke="#f0ece1" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="0" y1="15" x2="380" y2="15" stroke="#f0ece1" strokeWidth="1" strokeDasharray="2,2" />

              {/* Dynamic Interactive Datum Slicer Line */}
              {(() => {
                const datumY = Math.max(10, Math.min(70, 70 - (activeDatumCutM / maxAlt) * 55));
                return (
                  <g>
                    <line
                      x1="0"
                      y1={datumY}
                      x2="380"
                      y2={datumY}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4,2"
                    />
                    <rect x="310" y={datumY - 8} width="65" height="10" rx="2" fill="#064e3b" />
                    <text
                      x="342"
                      y={datumY - 1}
                      textAnchor="middle"
                      fontSize="5.5"
                      fill="#a7f3d0"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      Cut: {activeDatumCutM}m
                    </text>
                  </g>
                );
              })()}

              {(() => {
                const maxDist = profile[profile.length - 1]?.distanceKm || 140;
                const points = profile.map((p, idx) => {
                  const x = 20 + (p.distanceKm / maxDist) * 340;
                  const y = 70 - (p.altitudeM / maxAlt) * 55;
                  return { x, y, p, idx };
                });

                const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                const areaD = `${pathD} L ${points[points.length - 1].x} 70 L ${points[0].x} 70 Z`;

                return (
                  <>
                    <defs>
                      <linearGradient id="topo-relief-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#84cc16" stopOpacity="0.6" />
                        <stop offset="60%" stopColor="#b5d774" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#e5e7eb" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>

                    <path d={areaD} fill="url(#topo-relief-grad)" />
                    <path d={pathD} fill="none" stroke="#65a30d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {points.map((pt) => {
                      const isSite = pt.p.isSiteLocation;
                      const isAbove = pt.p.altitudeM >= activeDatumCutM;
                      const isSel = selectedPointIndex === pt.idx;

                      return (
                        <g 
                          key={pt.idx} 
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedPointIndex(pt.idx);
                            setActiveDatumCutM(pt.p.altitudeM);
                          }}
                        >
                          <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />
                          {isSite ? (
                            <g>
                              <circle cx={pt.x} cy={pt.y} r={isSel ? 7 : 5} fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                              <line x1={pt.x} y1={pt.y} x2={pt.x} y2="70" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2,2" />
                              <rect x={pt.x - 32} y={pt.y - 17} width="64" height="13" rx="3" fill="#1f3835" />
                              <text x={pt.x} y={pt.y - 8} textAnchor="middle" fontSize="6.5" fill="#ffffff" fontWeight="bold" fontFamily="sans-serif">
                                Site: {pt.p.altitudeM}m
                              </text>
                            </g>
                          ) : (
                            <circle 
                              cx={pt.x} 
                              cy={pt.y} 
                              r={isSel ? 5 : 3.2} 
                              fill={isSel ? "#f59e0b" : isAbove ? "#10b981" : "#ffffff"} 
                              stroke={isSel ? "#b45309" : isAbove ? "#047857" : "#65a30d"} 
                              strokeWidth={isSel ? 2.5 : 1.8} 
                            />
                          )}
                          <text x={pt.x} y="82" textAnchor="middle" fontSize="5.5" fill={isSel ? "#b45309" : "#9ca3af"} fontWeight={isSel ? "bold" : "normal"} fontFamily="monospace">
                            {pt.p.distanceKm}km
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Selected Cross-Section Point Readout */}
          <div className="p-2 bg-emerald-50/80 border border-emerald-200/80 rounded-lg flex items-center justify-between text-[10px] font-rounded">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
              <span className="font-bold text-emerald-950 truncate">
                {selectedPt.description}
              </span>
            </div>
            <button
              onClick={() => setActiveDatumCutM(selectedPt.altitudeM)}
              className="px-2 py-0.5 bg-emerald-700 text-white rounded font-mono font-bold text-[9px] hover:bg-emerald-800 shrink-0 cursor-pointer shadow-2xs"
            >
              Snap Datum to Node ({selectedPt.altitudeM}m)
            </button>
          </div>
        </div>

        {/* Right Panel: Interactive Sliders + Altimetry Cards (Independently Scrollable) */}
        <div className="space-y-3 flex flex-col justify-between overflow-y-auto custom-scrollbar max-h-[580px] min-w-0">
          {/* Interactive Numerical Interval Manipulation Slicers */}
          <div className="bg-slate-900 text-white rounded-xl p-3 border border-slate-800 space-y-3">
            {/* Altimetry Datum Slice Parameter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                <span className="text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                  <SlidersHorizontal size={11} />
                  <span>Cross-Section Altimetry Datum Slice</span>
                </span>
                <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {activeDatumCutM} m a.s.l.
                </span>
              </div>

              {/* Interval Selector Chips */}
              <div className="flex items-center justify-between text-[8.5px]">
                <span className="text-slate-400">Interval (Δh):</span>
                <div className="flex items-center gap-1">
                  {[25, 50, 100, 250].map((intVal) => (
                    <button
                      key={intVal}
                      onClick={() => setSliceInterval(intVal)}
                      className={`px-1.5 py-0.2 rounded font-mono font-bold transition-all cursor-pointer ${
                        sliceInterval === intVal
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      ±{intVal}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Steppers + Slider */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => stepDatumCut(-1)}
                  disabled={activeDatumCutM <= 0}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                  title={`Step down by ${sliceInterval}m`}
                >
                  <Minus size={11} />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1200"
                  step="5"
                  value={activeDatumCutM}
                  onChange={(e) => setActiveDatumCutM(Number(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
                />
                <button
                  onClick={() => stepDatumCut(1)}
                  disabled={activeDatumCutM >= 1200}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                  title={`Step up by ${sliceInterval}m`}
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>

            {/* Taphonomic Stratum Depth Parameter */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                <span className="text-purple-400 uppercase tracking-wide flex items-center gap-1">
                  <Activity size={11} />
                  <span>Taphonomic Strata Burial Depth</span>
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {activeDepthM} meters ({overburdenPressureFormatted})
                  </span>
                  <button
                    onClick={() => setPressureUnit(p => p === 'MPa' ? 'bar' : p === 'bar' ? 'psi' : 'MPa')}
                    className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 cursor-pointer"
                    title="Toggle Pressure Unit (MPa / bar / psi)"
                  >
                    Unit: {pressureUnit}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[8.5px]">
                <span className="text-slate-400">Interval (Δd):</span>
                <div className="flex items-center gap-1">
                  {[5, 10, 25, 50].map((intVal) => (
                    <button
                      key={intVal}
                      onClick={() => setDepthInterval(intVal)}
                      className={`px-1.5 py-0.2 rounded font-mono font-bold transition-all cursor-pointer ${
                        depthInterval === intVal
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      ±{intVal}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => stepDepth(-1)}
                  disabled={activeDepthM <= 5}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                >
                  <Minus size={11} />
                </button>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="1"
                  value={activeDepthM}
                  onChange={(e) => setActiveDepthM(Number(e.target.value))}
                  className="flex-1 accent-purple-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
                />
                <button
                  onClick={() => stepDepth(1)}
                  disabled={activeDepthM >= 500}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* Altimetry Comparison Cards */}
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Paleo-Elevation at Deposition */}
            <button 
              onClick={() => setActiveDatumCutM(elevation.paleoElevationM)}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                activeDatumCutM === elevation.paleoElevationM
                  ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-400/40 shadow-xs'
                  : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:border-emerald-300'
              }`}
              title="Click to set Active Datum Cut to Paleo-Elevation"
            >
              <div className="flex items-center justify-between">
                <span className="text-[7.5px] font-rounded font-bold text-emerald-800 uppercase block">
                  Paleo-Elevation
                </span>
                <span className="text-[7.5px] font-mono font-bold bg-emerald-200/60 text-emerald-900 px-1 rounded">
                  Apply
                </span>
              </div>
              <div className="text-xs font-mono font-extrabold text-emerald-950 mt-0.5">
                {elevation.paleoElevationM} m
              </div>
              <span className="text-[8px] font-mono text-emerald-700 block truncate">
                {elevation.paleoElevationFt} ft
              </span>
            </button>

            {/* 2. Modern Surface Elevation */}
            <button 
              onClick={() => setActiveDatumCutM(Math.min(1200, elevation.modernElevationM))}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                activeDatumCutM === Math.min(1200, elevation.modernElevationM)
                  ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400/40 shadow-xs'
                  : 'bg-gradient-to-br from-amber-50 to-white border-amber-100 hover:border-amber-300'
              }`}
              title="Click to set Active Datum Cut to Modern Surface Altitude"
            >
              <div className="flex items-center justify-between">
                <span className="text-[7.5px] font-rounded font-bold text-amber-800 uppercase block">
                  Modern Altitude
                </span>
                <span className="text-[7.5px] font-mono font-bold bg-amber-200/60 text-amber-900 px-1 rounded">
                  Apply
                </span>
              </div>
              <div className="text-xs font-mono font-extrabold text-amber-950 mt-0.5">
                {elevation.modernElevationM} m
              </div>
              <span className="text-[8px] font-mono text-amber-700 block truncate">
                +{elevation.modernElevationM - elevation.paleoElevationM}m Uplift
              </span>
            </button>

            {/* 3. Taphonomic Burial Stratum Depth */}
            <button 
              onClick={() => setPressureUnit(p => p === 'MPa' ? 'bar' : p === 'bar' ? 'psi' : 'MPa')}
              className="p-2 bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:border-purple-300 rounded-xl text-left transition-all cursor-pointer"
              title="Click to cycle pressure units"
            >
              <div className="flex items-center justify-between">
                <span className="text-[7.5px] font-rounded font-bold text-purple-800 uppercase block">
                  Burial Depth
                </span>
                <span className="text-[7.5px] font-mono font-bold bg-purple-200/60 text-purple-900 px-1 rounded">
                  {pressureUnit}
                </span>
              </div>
              <div className="text-xs font-mono font-extrabold text-purple-950 mt-0.5">
                {activeDepthM} m
              </div>
              <span className="text-[8px] font-rounded text-purple-700 block truncate">
                {overburdenPressureFormatted}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Depositional Environment & Facies Summary (Interactive Chips) */}
      <div className="p-3 bg-white rounded-xl border border-park-card-border space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-rounded font-extrabold text-park-tree uppercase">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-park-accent-yellow" />
            <span>Facies & Depositional Paleo-Environment</span>
          </div>
          <span className="text-[8.5px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
            Sedimentary Stratum
          </span>
        </div>
        <p className="text-[11px] font-rounded text-park-ink leading-relaxed">
          {elevation.depositionalEnvironment}
        </p>
        <div className="pt-1.5 border-t border-dotted border-park-card-border flex items-center justify-between text-[9px] font-mono text-park-ink-muted">
          <button
            onClick={() => setSliceInterval(prev => prev === 25 ? 50 : prev === 50 ? 100 : 25)}
            className="hover:text-park-tree transition-colors flex items-center gap-1"
            title="Click to cycle slice interval"
          >
            <span>Relief Gradient:</span>
            <span className="font-bold text-park-tree underline decoration-dotted">{elevation.reliefGradientPercent}%</span>
          </button>
          <span className="truncate max-w-[200px]">
            Member: <span className="font-bold text-park-tree">{elevation.stratigraphicMember}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ElevationProfile;
