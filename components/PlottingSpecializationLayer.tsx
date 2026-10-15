import React from 'react';
import { 
  Navigation, 
  Calendar, 
  Mountain, 
  Footprints, 
  Activity, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Minus, 
  RotateCcw,
  Sparkles,
  Layers,
  Compass,
  Gauge
} from 'lucide-react';

export type PlottingSpecializationMode = 'trails' | 'migration' | 'hypsometry' | 'locomotion' | 'density' | 'cardinal';

export interface PlottingLayerConfig {
  mode: PlottingSpecializationMode;
  
  // 1. Trails & Buffer Specialization
  bufferRadiusKm: number;          // e.g. 150 km
  bufferRadiusInterval: number;    // interval step: 25 km, 50 km, 100 km
  minRecoveryPercent: number;      // e.g. 30%
  recoveryPercentInterval: number; // interval step: 5%, 10%, 20%
  
  // 2. Migration Flow Specialization
  timeSliceMa: number;             // e.g. 66.0 Ma
  timeSliceInterval: number;       // interval step: 1.0 Ma, 2.5 Ma, 5.0 Ma, 10.0 Ma
  corridorWidthKm: number;         // e.g. 140 km
  corridorWidthInterval: number;   // interval step: 20 km, 50 km, 100 km
  flowVelocityScale: number;       // e.g. 1.0x
  flowVelocityInterval: number;    // interval step: 0.25x, 0.5x
  
  // 3. Hypsometry Contours Specialization
  contourIntervalM: number;        // e.g. 100 m
  contourStepInterval: number;     // interval step: 50 m, 100 m, 250 m, 500 m
  minElevationM: number;           // e.g. 0 m
  maxElevationM: number;           // e.g. 1800 m
  elevationRangeInterval: number;  // interval step: 100 m, 200 m, 500 m
  
  // 4. Locomotion & Gait Kinematics Specialization
  strideLengthM: number;           // e.g. 2.4 m
  strideLengthInterval: number;    // interval step: 0.1 m, 0.2 m, 0.5 m
  cadenceStepsPerMin: number;      // e.g. 70 steps/min
  cadenceInterval: number;         // interval step: 5, 10, 20
  gaitSpeedKmh: number;            // e.g. 14 km/h
  gaitSpeedInterval: number;       // interval step: 2 km/h, 5 km/h
  
  // 5. Kernel Density Isopleths Specialization
  kernelBandwidthKm: number;       // e.g. 350 km
  bandwidthInterval: number;       // interval step: 50 km, 100 km, 250 km
  densityQuantileBands: number;    // e.g. 5
  quantileBandsInterval: number;   // interval step: 1, 2

  // 6. Cardinal Directionality & Neighbouring Relational Vectors
  maxNeighbourRadiusKm: number;      // e.g. 1000 km (0 for all)
  neighbourRadiusInterval: number;   // interval step: 100 km, 250 km, 500 km
  vectorLineWidthPx: number;         // e.g. 2 px
  vectorLineWidthInterval: number;   // interval step: 0.5 px, 1 px
  cardinalBearingMode: 'both' | 'cardinal' | 'degrees';
}

export const DEFAULT_PLOTTING_CONFIG: PlottingLayerConfig = {
  mode: 'trails',
  bufferRadiusKm: 150,
  bufferRadiusInterval: 25,
  minRecoveryPercent: 25,
  recoveryPercentInterval: 5,
  
  timeSliceMa: 68.0,
  timeSliceInterval: 2.0,
  corridorWidthKm: 140,
  corridorWidthInterval: 20,
  flowVelocityScale: 1.0,
  flowVelocityInterval: 0.25,
  
  contourIntervalM: 100,
  contourStepInterval: 50,
  minElevationM: 0,
  maxElevationM: 1600,
  elevationRangeInterval: 100,
  
  strideLengthM: 2.4,
  strideLengthInterval: 0.2,
  cadenceStepsPerMin: 65,
  cadenceInterval: 5,
  gaitSpeedKmh: 14,
  gaitSpeedInterval: 2,
  
  kernelBandwidthKm: 350,
  bandwidthInterval: 50,
  densityQuantileBands: 5,
  quantileBandsInterval: 1,

  maxNeighbourRadiusKm: 1000,
  neighbourRadiusInterval: 250,
  vectorLineWidthPx: 2,
  vectorLineWidthInterval: 0.5,
  cardinalBearingMode: 'both',
};

interface PlottingSpecializationLayerProps {
  config: PlottingLayerConfig;
  onChangeConfig: (newConfig: Partial<PlottingLayerConfig>) => void;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  markersCount?: number;
}

export const PlottingSpecializationLayer: React.FC<PlottingSpecializationLayerProps> = ({
  config,
  onChangeConfig,
  isPanelOpen,
  onTogglePanel,
  markersCount = 0
}) => {
  const setMode = (mode: PlottingSpecializationMode) => {
    onChangeConfig({ mode });
  };

  // Helper for stepping a numerical value by its relevant interval
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
    
    // Round to avoid floating point imprecision
    const factor = Math.pow(10, precision);
    nextVal = Math.round(nextVal * factor) / factor;
    
    onChangeConfig({ [field]: nextVal } as Partial<PlottingLayerConfig>);
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-[580px]">
      {/* 2-Row Specialized Legend Container matching Reference Image */}
      <div className="flex flex-col gap-1.5 w-full">
        {/* Row 1: Sites & Buffer | Migration Flow [pill: Δt 2Ma] | Hypsometry | Gait Tracks */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Mode 1: Fossil Sites & Buffers */}
          <button
            onClick={() => setMode('trails')}
            className={`flex items-center gap-1.5 transition-all select-none cursor-pointer ${
              config.mode === 'trails' 
                ? 'bg-emerald-700 text-white shadow-xs px-3.5 py-1.5 rounded-full font-rounded font-bold text-[11.5px]' 
                : 'text-slate-700 hover:text-slate-950 font-rounded font-bold text-[11.5px] px-1 py-1'
            }`}
            title="Fossil Sites with Geospatial Survey Buffer Intervals"
          >
            <Navigation size={14} className={config.mode === 'trails' ? 'text-white' : 'text-slate-600'} />
            <span>Sites & Buffer</span>
            {config.mode === 'trails' && (
              <span className="text-[9.5px] font-mono bg-white/25 text-white px-2 py-0.5 rounded-full font-bold ml-0.5">
                Δr {config.bufferRadiusKm}km
              </span>
            )}
          </button>

          {/* Mode 2: Migration Corridor Flow */}
          <button
            onClick={() => setMode('migration')}
            className={`flex items-center gap-1.5 transition-all select-none cursor-pointer ${
              config.mode === 'migration' 
                ? 'bg-blue-600 text-white shadow-xs px-3.5 py-1.5 rounded-full font-rounded font-bold text-[11.5px]' 
                : 'text-slate-700 hover:text-slate-950 font-rounded font-bold text-[11.5px] px-1 py-1'
            }`}
            title="Spatio-Temporal Migration Corridor & Vector Velocity Flow"
          >
            <Calendar size={14} className={config.mode === 'migration' ? 'text-white' : 'text-slate-600'} />
            <span>Migration Flow</span>
            {config.mode === 'migration' && (
              <span className="text-[9.5px] font-mono bg-blue-500/70 text-white px-2 py-0.5 rounded-full font-bold ml-0.5">
                Δt {config.timeSliceInterval}Ma
              </span>
            )}
          </button>

          {/* Mode 3: Hypsometric Elevation Contours */}
          <button
            onClick={() => setMode('hypsometry')}
            className={`flex items-center gap-1.5 transition-all select-none cursor-pointer ${
              config.mode === 'hypsometry' 
                ? 'bg-emerald-800 text-white shadow-xs px-3.5 py-1.5 rounded-full font-rounded font-bold text-[11.5px]' 
                : 'text-slate-700 hover:text-slate-950 font-rounded font-bold text-[11.5px] px-1 py-1'
            }`}
            title="Paleo-Elevation Hypsometric Contours & Isoline Interval Slicing"
          >
            <Mountain size={14} className={config.mode === 'hypsometry' ? 'text-white' : 'text-slate-600'} />
            <span>Hypsometry</span>
            {config.mode === 'hypsometry' && (
              <span className="text-[9.5px] font-mono bg-white/25 text-white px-2 py-0.5 rounded-full font-bold ml-0.5">
                Δh {config.contourIntervalM}m
              </span>
            )}
          </button>

          {/* Mode 4: Gait Trackways Kinematics */}
          <button
            onClick={() => setMode('locomotion')}
            className={`flex items-center gap-1.5 transition-all select-none cursor-pointer ${
              config.mode === 'locomotion' 
                ? 'bg-amber-700 text-white shadow-xs px-3.5 py-1.5 rounded-full font-rounded font-bold text-[11.5px]' 
                : 'text-slate-700 hover:text-slate-950 font-rounded font-bold text-[11.5px] px-1 py-1'
            }`}
            title="Biomechanical Gait Kinematics & Stride Length Interval"
          >
            <Footprints size={14} className={config.mode === 'locomotion' ? 'text-white' : 'text-slate-600'} />
            <span>Gait Tracks</span>
            {config.mode === 'locomotion' && (
              <span className="text-[9.5px] font-mono bg-white/25 text-white px-2 py-0.5 rounded-full font-bold ml-0.5">
                Δs {config.strideLengthM}m
              </span>
            )}
          </button>
        </div>

        {/* Row 2: Density Isopleths | Cardinal Vectors ... (right-aligned) Intervals ⌵ */}
        <div className="flex items-center justify-between gap-3 w-full pt-1">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Mode 5: Kernel Density Isopleths */}
            <button
              onClick={() => setMode('density')}
              className={`flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                config.mode === 'density' 
                  ? 'bg-rose-700 text-white shadow-xs px-3.5 py-1.5 rounded-full font-rounded font-bold text-[11.5px]' 
                : 'text-slate-700 hover:text-slate-950 font-rounded font-bold text-[11.5px] px-1 py-1'
              }`}
              title="Paleo-Biodiversity Kernel Density Estimation & Quantile Intervals"
            >
              <Activity size={14} className={config.mode === 'density' ? 'text-white' : 'text-slate-600'} />
              <span>Density Isopleths</span>
              {config.mode === 'density' && (
                <span className="text-[9.5px] font-mono bg-white/25 text-white px-2 py-0.5 rounded-full font-bold ml-0.5">
                  {config.densityQuantileBands} bands
                </span>
              )}
            </button>

            {/* Mode 6: Cardinal Directionality & Relative Locality Vectors */}
            <button
              onClick={() => setMode('cardinal')}
              className={`flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                config.mode === 'cardinal' 
                  ? 'bg-teal-700 text-white shadow-xs px-3.5 py-1.5 rounded-full font-rounded font-bold text-[11.5px]' 
                : 'text-slate-700 hover:text-slate-950 font-rounded font-bold text-[11.5px] px-1 py-1'
              }`}
              title="Cardinal Directionality & Relative Locality Vectors to Neighbouring Excavation Sites"
            >
              <Compass size={14} className={config.mode === 'cardinal' ? 'text-white' : 'text-slate-600'} />
              <span>Cardinal Vectors</span>
              {config.mode === 'cardinal' && (
                <span className="text-[9.5px] font-mono bg-white/25 text-white px-2 py-0.5 rounded-full font-bold ml-0.5">
                  {config.maxNeighbourRadiusKm === 0 ? 'All' : `≤${config.maxNeighbourRadiusKm}km`}
                </span>
              )}
            </button>
          </div>

          {/* Expand / Collapse Plotting Interval Controller - with clear explanation badge */}
          <button
            onClick={onTogglePanel}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-rounded font-bold transition-all border select-none cursor-pointer shadow-2xs ${
              isPanelOpen
                ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                : 'bg-[#f7f4ed] hover:bg-[#ece7db] text-slate-700 border-stone-200/90'
            }`}
            title="Intervals & Slicing: Adjust chronostratigraphic time-slices, survey buffer radii, contour altitude steps, and kernel bandwidths"
          >
            <SlidersHorizontal size={13} className={isPanelOpen ? "text-emerald-400" : "text-slate-600"} />
            <span>Intervals & Slicing</span>
            {isPanelOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Expandable Plotting Specialization & Numerical Interval Manipulation Drawer */}
      {isPanelOpen && (
        <div className="w-full max-h-[320px] overflow-y-auto bg-slate-950/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl p-3 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 scrollbar-thin">
          {/* Sub-Header / Status bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                <SlidersHorizontal size={13} />
              </div>
              <div>
                <h4 className="text-[11px] font-rounded font-extrabold text-white uppercase tracking-wider">
                  Plotting Specialization Engine • Interval Slicing
                </h4>
                <span className="text-[9px] font-rounded text-slate-400">
                  Continuous responsive scrubbing with customizable interval step buttons
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-bold">
                Mode: {config.mode.toUpperCase()}
              </span>
              <button
                onClick={() => onChangeConfig(DEFAULT_PLOTTING_CONFIG)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Reset Plotting Intervals to Default"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          {/* Educational Explainer Banner: What do Intervals do? */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/50 border border-emerald-500/30 text-[9.5px] space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-300 font-rounded font-bold text-[10.5px]">
              <Sparkles size={12} />
              <span>What do the Intervals control?</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Intervals define the <strong>mathematical bin step sizes</strong> for cartographic layers. Use the range sliders for fluid 60fps real-time inspection, or click the <span className="font-mono text-emerald-300">±Step</span> buttons to increment precisely by standard geological intervals.
            </p>
          </div>

          {/* MODE-SPECIFIC NUMERICAL CONTROLS WITH RELEVANT INTERVAL MANIPULATION */}
          
          {/* 1. SITES & BUFFER INTERVAL CONTROLS */}
          {config.mode === 'trails' && (
            <div className="space-y-3">
              {/* Parameter 1: Survey Buffer Radius */}
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                  <span className="text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Navigation size={12} />
                    <span>Geospatial Survey Buffer Radius</span>
                  </span>
                  <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {config.bufferRadiusKm} km
                  </span>
                </div>

                {/* Interval manipulation chips */}
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-slate-400">Step Interval (Δr):</span>
                  <div className="flex items-center gap-1">
                    {[10, 25, 50, 100].map((intVal) => (
                      <button
                        key={intVal}
                        onClick={() => onChangeConfig({ bufferRadiusInterval: intVal })}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          config.bufferRadiusInterval === intVal
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{intVal} km
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stepper + Slider */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => stepValue('bufferRadiusKm', -1, 'bufferRadiusInterval', 0, 800, 0)}
                    disabled={config.bufferRadiusKm <= 0}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                    title={`Decrease by interval ${config.bufferRadiusInterval} km`}
                  >
                    <Minus size={13} />
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="800"
                    step="1"
                    value={config.bufferRadiusKm}
                    onChange={(e) => onChangeConfig({ bufferRadiusKm: Number(e.target.value) })}
                    className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  <button
                    onClick={() => stepValue('bufferRadiusKm', 1, 'bufferRadiusInterval', 0, 800, 0)}
                    disabled={config.bufferRadiusKm >= 800}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                    title={`Increase by interval ${config.bufferRadiusInterval} km`}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Parameter 2: Recovery Confidence Threshold */}
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                  <span className="text-sky-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Activity size={12} />
                    <span>Osteological Recovery Threshold Filter</span>
                  </span>
                  <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    ≥ {config.minRecoveryPercent}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-slate-400">Step Interval (Δ%):</span>
                  <div className="flex items-center gap-1">
                    {[5, 10, 20].map((intVal) => (
                      <button
                        key={intVal}
                        onClick={() => onChangeConfig({ recoveryPercentInterval: intVal })}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          config.recoveryPercentInterval === intVal
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{intVal}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => stepValue('minRecoveryPercent', -1, 'recoveryPercentInterval', 0, 95, 0)}
                    disabled={config.minRecoveryPercent <= 0}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Minus size={13} />
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="95"
                    step="1"
                    value={config.minRecoveryPercent}
                    onChange={(e) => onChangeConfig({ minRecoveryPercent: Number(e.target.value) })}
                    className="flex-1 accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  <button
                    onClick={() => stepValue('minRecoveryPercent', 1, 'recoveryPercentInterval', 0, 95, 0)}
                    disabled={config.minRecoveryPercent >= 95}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. MIGRATION VECTOR FLOW CONTROLS */}
          {config.mode === 'migration' && (
            <div className="space-y-3">
              {/* Parameter 1: Corridor Swath Width Interval */}
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                  <span className="text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>Corridor Boundary Swath Width</span>
                  </span>
                  <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {config.corridorWidthKm} km
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-slate-400">Step Interval (Δw):</span>
                  <div className="flex items-center gap-1">
                    {[10, 20, 50, 100].map((intVal) => (
                      <button
                        key={intVal}
                        onClick={() => onChangeConfig({ corridorWidthInterval: intVal })}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          config.corridorWidthInterval === intVal
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{intVal} km
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => stepValue('corridorWidthKm', -1, 'corridorWidthInterval', 20, 600, 0)}
                    disabled={config.corridorWidthKm <= 20}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Minus size={13} />
                  </button>

                  <input
                    type="range"
                    min="20"
                    max="600"
                    step="1"
                    value={config.corridorWidthKm}
                    onChange={(e) => onChangeConfig({ corridorWidthKm: Number(e.target.value) })}
                    className="flex-1 accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  <button
                    onClick={() => stepValue('corridorWidthKm', 1, 'corridorWidthInterval', 20, 600, 0)}
                    disabled={config.corridorWidthKm >= 600}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Parameter 2: Flow Velocity Animation Speed */}
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                  <span className="text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Gauge size={12} />
                    <span>Vector Velocity Flow Rate</span>
                  </span>
                  <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {config.flowVelocityScale.toFixed(2)}× Rate
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-slate-400">Step Interval (Δv):</span>
                  <div className="flex items-center gap-1">
                    {[0.1, 0.25, 0.5].map((intVal) => (
                      <button
                        key={intVal}
                        onClick={() => onChangeConfig({ flowVelocityInterval: intVal })}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          config.flowVelocityInterval === intVal
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{intVal}×
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => stepValue('flowVelocityScale', -1, 'flowVelocityInterval', 0.25, 3.0, 2)}
                    disabled={config.flowVelocityScale <= 0.25}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Minus size={13} />
                  </button>

                  <input
                    type="range"
                    min="0.25"
                    max="3.0"
                    step="0.05"
                    value={config.flowVelocityScale}
                    onChange={(e) => onChangeConfig({ flowVelocityScale: Number(e.target.value) })}
                    className="flex-1 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  <button
                    onClick={() => stepValue('flowVelocityScale', 1, 'flowVelocityInterval', 0.25, 3.0, 2)}
                    disabled={config.flowVelocityScale >= 3.0}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. HYPSOMETRY CONTOURS CONTROLS */}
          {config.mode === 'hypsometry' && (
            <div className="space-y-3">
              {/* Parameter 1: Contour Interval (Δh) */}
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                  <span className="text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Mountain size={12} />
                    <span>Topographic Contour Interval (Δh)</span>
                  </span>
                  <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {config.contourIntervalM} meters
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-slate-400">Step Interval (Δ):</span>
                  <div className="flex items-center gap-1">
                    {[25, 50, 100, 250].map((intVal) => (
                      <button
                        key={intVal}
                        onClick={() => onChangeConfig({ contourStepInterval: intVal })}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          config.contourStepInterval === intVal
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{intVal}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => stepValue('contourIntervalM', -1, 'contourStepInterval', 25, 1000, 0)}
                    disabled={config.contourIntervalM <= 25}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Minus size={13} />
                  </button>

                  <input
                    type="range"
                    min="25"
                    max="1000"
                    step="5"
                    value={config.contourIntervalM}
                    onChange={(e) => onChangeConfig({ contourIntervalM: Number(e.target.value) })}
                    className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  <button
                    onClick={() => stepValue('contourIntervalM', 1, 'contourStepInterval', 25, 1000, 0)}
                    disabled={config.contourIntervalM >= 1000}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Quick Standard Contour Presets */}
                <div className="flex items-center justify-between text-[8.5px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Cartographic Presets:</span>
                  <div className="flex items-center gap-1 font-mono">
                    {[50, 100, 200, 500].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => onChangeConfig({ contourIntervalM: preset })}
                        className={`px-1.5 py-0.2 rounded ${
                          config.contourIntervalM === preset
                            ? 'bg-emerald-800 text-emerald-100 font-bold'
                            : 'hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {preset}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Parameter 2: Maximum Display Elevation Range */}
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                  <span className="text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers size={12} />
                    <span>Altitude Isoline Ceiling Range</span>
                  </span>
                  <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {config.maxElevationM} m a.s.l.
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-slate-400">Step Interval (Δ):</span>
                  <div className="flex items-center gap-1">
                    {[100, 200, 500].map((intVal) => (
                      <button
                        key={intVal}
                        onClick={() => onChangeConfig({ elevationRangeInterval: intVal })}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          config.elevationRangeInterval === intVal
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{intVal}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => stepValue('maxElevationM', -1, 'elevationRangeInterval', 200, 3000, 0)}
                    disabled={config.maxElevationM <= 200}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Minus size={13} />
                  </button>

                  <input
                    type="range"
                    min="200"
                    max="3000"
                    step="10"
                    value={config.maxElevationM}
                    onChange={(e) => onChangeConfig({ maxElevationM: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  <button
                    onClick={() => stepValue('maxElevationM', 1, 'elevationRangeInterval', 200, 3000, 0)}
                    disabled={config.maxElevationM >= 3000}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. GAIT TRACKWAYS KINEMATICS CONTROLS */}
          {config.mode === 'locomotion' && (
            <div className="space-y-3">
              {/* Parameter 1: Stride Length Interval (Δs) */}
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                  <span className="text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Footprints size={12} />
                    <span>Kinematic Stride Length (λ)</span>
                  </span>
                  <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {config.strideLengthM.toFixed(1)} meters
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-slate-400">Step Interval (Δs):</span>
                  <div className="flex items-center gap-1">
                    {[0.1, 0.2, 0.5, 1.0].map((intVal) => (
                      <button
                        key={intVal}
                        onClick={() => onChangeConfig({ strideLengthInterval: intVal })}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          config.strideLengthInterval === intVal
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{intVal}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => stepValue('strideLengthM', -1, 'strideLengthInterval', 0.5, 8.0, 1)}
                    disabled={config.strideLengthM <= 0.5}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Minus size={13} />
                  </button>

                  <input
                    type="range"
                    min="0.5"
                    max="8.0"
                    step="0.05"
                    value={config.strideLengthM}
                    onChange={(e) => onChangeConfig({ strideLengthM: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  <button
                    onClick={() => stepValue('strideLengthM', 1, 'strideLengthInterval', 0.5, 8.0, 1)}
                    disabled={config.strideLengthM >= 8.0}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Parameter 2: Estimated Gait Velocity */}
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                  <span className="text-orange-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Gauge size={12} />
                    <span>Estimated Cursorial Velocity</span>
                  </span>
                  <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {config.gaitSpeedKmh} km/h ({(config.gaitSpeedKmh / 3.6).toFixed(1)} m/s)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-slate-400">Step Interval (Δv):</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 5, 10].map((intVal) => (
                      <button
                        key={intVal}
                        onClick={() => onChangeConfig({ gaitSpeedInterval: intVal })}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          config.gaitSpeedInterval === intVal
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{intVal} km/h
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => stepValue('gaitSpeedKmh', -1, 'gaitSpeedInterval', 2, 60, 0)}
                    disabled={config.gaitSpeedKmh <= 2}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Minus size={13} />
                  </button>

                  <input
                    type="range"
                    min="2"
                    max="60"
                    step="0.5"
                    value={config.gaitSpeedKmh}
                    onChange={(e) => onChangeConfig({ gaitSpeedKmh: Number(e.target.value) })}
                    className="flex-1 accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  <button
                    onClick={() => stepValue('gaitSpeedKmh', 1, 'gaitSpeedInterval', 2, 60, 0)}
                    disabled={config.gaitSpeedKmh >= 60}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. KERNEL DENSITY ISOPLETHS CONTROLS */}
          {config.mode === 'density' && (
            <div className="space-y-3">
              {/* Parameter 1: Kernel Bandwidth (Δk) */}
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                  <span className="text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Activity size={12} />
                    <span>Kernel Density Smoothing Bandwidth (h)</span>
                  </span>
                  <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {config.kernelBandwidthKm} km
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-slate-400">Step Interval (Δk):</span>
                  <div className="flex items-center gap-1">
                    {[25, 50, 100, 200].map((intVal) => (
                      <button
                        key={intVal}
                        onClick={() => onChangeConfig({ bandwidthInterval: intVal })}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          config.bandwidthInterval === intVal
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{intVal} km
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => stepValue('kernelBandwidthKm', -1, 'bandwidthInterval', 50, 1000, 0)}
                    disabled={config.kernelBandwidthKm <= 50}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Minus size={13} />
                  </button>

                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="5"
                    value={config.kernelBandwidthKm}
                    onChange={(e) => onChangeConfig({ kernelBandwidthKm: Number(e.target.value) })}
                    className="flex-1 accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  <button
                    onClick={() => stepValue('kernelBandwidthKm', 1, 'bandwidthInterval', 50, 1000, 0)}
                    disabled={config.kernelBandwidthKm >= 1000}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Parameter 2: Quantile Iso-Density Bands Interval */}
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                  <span className="text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers size={12} />
                    <span>Quantile Iso-Density Level Contours</span>
                  </span>
                  <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {config.densityQuantileBands} Level Bands
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-slate-400">Step Interval:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2].map((intVal) => (
                      <button
                        key={intVal}
                        onClick={() => onChangeConfig({ quantileBandsInterval: intVal })}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          config.quantileBandsInterval === intVal
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{intVal} band
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => stepValue('densityQuantileBands', -1, 'quantileBandsInterval', 2, 10, 0)}
                    disabled={config.densityQuantileBands <= 2}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Minus size={13} />
                  </button>

                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="1"
                    value={config.densityQuantileBands}
                    onChange={(e) => onChangeConfig({ densityQuantileBands: Number(e.target.value) })}
                    className="flex-1 accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  <button
                    onClick={() => stepValue('densityQuantileBands', 1, 'quantileBandsInterval', 2, 10, 0)}
                    disabled={config.densityQuantileBands >= 10}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 6 CONTROLS: CARDINAL DIRECTIONALITY & RELATIVE NEIGHBOURING VECTORS */}
          {config.mode === 'cardinal' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] text-teal-300 font-rounded font-bold border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Compass size={14} />
                  <span>Cardinal Directionality & Relative Locality Vectors</span>
                </span>
                <span className="text-[9px] font-mono text-slate-400">16-Pt Geodesic Azimuth</span>
              </div>

              {/* Parameter 1: Max Neighbour Distance Radius Interval */}
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                  <span className="text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Navigation size={12} />
                    <span>Max Neighbour Proximity Threshold</span>
                  </span>
                  <span className="text-white font-mono text-xs font-extrabold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {config.maxNeighbourRadiusKm === 0 ? 'All Neighbours' : `≤ ${config.maxNeighbourRadiusKm} km`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-slate-400">Step Interval:</span>
                  <div className="flex items-center gap-1">
                    {[100, 250, 500].map((intVal) => (
                      <button
                        key={intVal}
                        onClick={() => onChangeConfig({ neighbourRadiusInterval: intVal })}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          config.neighbourRadiusInterval === intVal
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ±{intVal}km
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => stepValue('maxNeighbourRadiusKm', -1, 'neighbourRadiusInterval', 100, 3000, 0)}
                    disabled={config.maxNeighbourRadiusKm <= 100}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Minus size={13} />
                  </button>

                  <input
                    type="range"
                    min="100"
                    max="3000"
                    step="10"
                    value={config.maxNeighbourRadiusKm}
                    onChange={(e) => onChangeConfig({ maxNeighbourRadiusKm: Number(e.target.value) })}
                    className="flex-1 accent-teal-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  <button
                    onClick={() => stepValue('maxNeighbourRadiusKm', 1, 'neighbourRadiusInterval', 100, 3000, 0)}
                    disabled={config.maxNeighbourRadiusKm >= 3000}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Parameter 2: Cardinal Notation & Vector Line Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-rounded font-bold text-teal-400 uppercase tracking-wide block">
                    Cardinal Notation
                  </span>
                  <div className="flex flex-col gap-1">
                    {(['both', 'cardinal', 'degrees'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => onChangeConfig({ cardinalBearingMode: mode })}
                        className={`px-2 py-1 rounded text-[9px] font-rounded font-bold capitalize text-left transition-all ${
                          config.cardinalBearingMode === mode
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {mode === 'both' ? 'WNW (294°)' : mode === 'cardinal' ? 'WNW (16-Pt)' : '294° (Azimuth)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-rounded font-bold text-teal-400 uppercase tracking-wide">
                    <span>Vector Width</span>
                    <span className="text-white font-mono text-xs">{config.vectorLineWidthPx}px</span>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    {[1, 2, 3, 4].map((w) => (
                      <button
                        key={w}
                        onClick={() => onChangeConfig({ vectorLineWidthPx: w })}
                        className={`flex-1 py-1 rounded font-mono text-[9px] font-bold transition-all ${
                          config.vectorLineWidthPx === w
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {w}px
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Telemetry */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Plotted Localities: {markersCount} sites
            </span>
            <span>Projection: Natural Earth I (Geodesic Δ)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlottingSpecializationLayer;
