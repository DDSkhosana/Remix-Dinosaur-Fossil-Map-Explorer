import React, { useState, useEffect, useRef } from 'react';
import { LocomotionMetrics } from '../types';
import { getLocomotionMetricsForDino } from '../utils/locomotionKinematics';
import { Footprints, Activity, Zap, Play, Pause, RotateCcw, ArrowRight, ShieldAlert, Sparkles, SlidersHorizontal, Plus, Minus } from 'lucide-react';

interface LocomotionVisualizerProps {
  metrics?: LocomotionMetrics;
  locomotion?: LocomotionMetrics;
  taxaName: string;
}

const LocomotionVisualizer: React.FC<LocomotionVisualizerProps> = ({ 
  metrics: metricsProp, 
  locomotion: locomotionProp, 
  taxaName 
}) => {
  const baseMetrics = metricsProp || locomotionProp || getLocomotionMetricsForDino(taxaName, 'Carnivore', 4);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [activeGait, setActiveGait] = useState<string>(baseMetrics.gaitMode);
  const animationFrameRef = useRef<number | null>(null);
  const [gaitPhase, setGaitPhase] = useState(0); // 0.0 to 1.0

  // Interactive Numerical State with Relevant Interval Manipulation
  const [activeVelocityKmh, setActiveVelocityKmh] = useState<number>(baseMetrics.topSpeedKmh);
  const [velocityInterval, setVelocityInterval] = useState<number>(2); // ±2, ±5, ±10 km/h

  const [activeStrideM, setActiveStrideM] = useState<number>(baseMetrics.strideLengthM);
  const [strideInterval, setStrideInterval] = useState<number>(0.2); // ±0.1, ±0.2, ±0.5, ±1.0 m

  const [activeGaugeWidthCm, setActiveGaugeWidthCm] = useState<number>(baseMetrics.trackGaugeWidthCm);
  const [gaugeInterval, setGaugeInterval] = useState<number>(5); // ±2, ±5, ±10 cm

  // Interactive Anatomical Joint Selection & Velocity Unit
  const [selectedAnatomyPart, setSelectedAnatomyPart] = useState<'com' | 'hindleg' | 'forelimb' | 'neck' | 'tail' | null>(null);
  const [velocityUnit, setVelocityUnit] = useState<'kmh' | 'mph' | 'ms'>('kmh');

  // Re-sync when taxaName changes
  useEffect(() => {
    setActiveVelocityKmh(baseMetrics.topSpeedKmh);
    setActiveStrideM(baseMetrics.strideLengthM);
    setActiveGaugeWidthCm(baseMetrics.trackGaugeWidthCm);
  }, [baseMetrics.topSpeedKmh, baseMetrics.strideLengthM, baseMetrics.trackGaugeWidthCm]);

  // Derived kinematic metrics
  const velMs = activeVelocityKmh / 3.6;
  const calculatedFroude = Number(((velMs * velMs) / (9.81 * Math.max(0.5, baseMetrics.hipHeightM))).toFixed(2));
  const strideRatio = (activeStrideM / Math.max(0.5, baseMetrics.hipHeightM)).toFixed(2);
  const dynamicDutyFactorPercent = Math.max(25, Math.min(85, Math.round(baseMetrics.dutyFactorPercent - (calculatedFroude * 8))));
  const dutyFactor = dynamicDutyFactorPercent / 100;

  const stepVelocity = (sign: 1 | -1) => {
    setActiveVelocityKmh(prev => Math.max(2, Math.min(80, Math.round((prev + sign * velocityInterval) * 10) / 10)));
  };

  const stepStride = (sign: 1 | -1) => {
    setActiveStrideM(prev => Math.max(0.4, Math.min(10, Math.round((prev + sign * strideInterval) * 10) / 10)));
  };

  const stepGauge = (sign: 1 | -1) => {
    setActiveGaugeWidthCm(prev => Math.max(10, Math.min(150, prev + sign * gaugeInterval)));
  };

  const resetToTaxonBaseline = () => {
    setActiveVelocityKmh(baseMetrics.topSpeedKmh);
    setActiveStrideM(baseMetrics.strideLengthM);
    setActiveGaugeWidthCm(baseMetrics.trackGaugeWidthCm);
    setSpeedMultiplier(1.0);
  };

  useEffect(() => {
    if (!isPlaying) return;
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Base cadence dynamically driven by interactive velocity
      const cycleSpeed = (activeVelocityKmh / 20) * speedMultiplier;
      setGaitPhase(prev => (prev + delta * cycleSpeed) % 1.0);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, speedMultiplier, activeVelocityKmh]);

  // Derive dynamic kinematic leg angles for 2D visualizer canvas
  const angleRad = gaitPhase * Math.PI * 2;
  const leg1Angle = Math.sin(angleRad) * 28;
  const leg2Angle = Math.sin(angleRad + Math.PI) * 28;
  const bodyBobY = Math.abs(Math.sin(angleRad * 2)) * 4;
  const tailSwayAngle = Math.sin(angleRad) * 12;

  const isBiped = baseMetrics.category === 'bipedal_cursorial' || baseMetrics.category === 'facultative_biped';
  const isQuad = baseMetrics.category === 'quadrupedal_graviportal' || baseMetrics.category === 'armored_quadruped';
  const isAquatic = baseMetrics.category === 'semi_aquatic_propulsion';

  return (
    <div className="bg-white rounded-2xl border border-park-card-border p-3.5 sm:p-4 shadow-xs space-y-3.5">
      {/* Master Module Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-park-card-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
            <Footprints size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-rounded font-extrabold text-park-accent-green uppercase tracking-wider">
                Biomechanics & Gait Dynamics
              </span>
              <span className="text-slate-400 text-[10px]" aria-hidden="true">·</span>
              <span className="text-[9.5px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded-md border border-emerald-200">
                {baseMetrics.categoryLabel}
              </span>
            </div>
            <h4 className="text-[13px] sm:text-[14px] font-rounded font-extrabold text-park-tree leading-snug">
              Locomotion Kinematics & Trackway Visualizer
            </h4>
            <p className="text-[10px] font-rounded text-park-ink-muted leading-tight">
              Dynamic gait stride, Froude dimensionless number & center-of-mass kinematics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-rounded font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isPlaying
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-white border border-park-card-border text-slate-700 hover:bg-slate-50'
            }`}
            title={isPlaying ? "Pause Simulation" : "Play Simulation"}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Simulation Active' : 'Paused'}</span>
          </button>
          <button
            onClick={resetToTaxonBaseline}
            className="p-1.5 rounded-xl bg-white hover:bg-park-card-muted/60 border border-park-card-border text-slate-600 transition-all cursor-pointer shadow-3xs active:scale-95"
            title="Reset to Taxon Baseline Metrics"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Top Stage: Live 2D Kinematic Animation on Left, Compact Sliders on Right (Compact & Synchronized) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch min-w-0">
        
        {/* Left Column (Canvas): Animated Dinosaur Gait Simulation */}
        <div className="md:col-span-7 flex flex-col space-y-2 overflow-auto custom-scrollbar min-w-0">
          <div className="relative bg-gradient-to-b from-park-sand/20 to-park-sand/40 rounded-2xl p-3 border border-park-card-border overflow-hidden flex-1 min-h-[220px] flex flex-col justify-between shadow-inner">
            
            {/* Top Canvas Badges: Live speed, Gait status, Play/Pause/Reset */}
            <div className="flex items-center justify-between z-10 gap-1.5 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-mono text-[10px] font-bold shadow-2xs flex items-center gap-1">
                  <Zap size={11} />
                  <span>{activeVelocityKmh} km/h</span>
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-white/90 text-slate-700 font-mono text-[9.5px] font-bold border border-slate-200">
                  λ {activeStrideM.toFixed(1)}m
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-rounded text-[9px] font-bold">
                  {dutyFactor > 0.5 ? 'Walking' : 'Running'}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-rounded font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                    isPlaying ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                  title={isPlaying ? "Pause Simulation" : "Play Simulation"}
                >
                  {isPlaying ? <Pause size={11} /> : <Play size={11} />}
                  <span>{isPlaying ? 'Live' : 'Paused'}</span>
                </button>
                <button
                  onClick={resetToTaxonBaseline}
                  className="p-1 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-all cursor-pointer"
                  title="Reset to Taxon Baseline Metrics"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            {/* SVG Kinematic Canvas */}
            <div className="w-full h-36 sm:h-40 flex items-center justify-center my-1">
              <svg className="w-full h-full" viewBox="0 0 320 120">
                {/* 3D Perspective Ground Grid Background */}
                <g stroke="#a89f91" strokeWidth="0.6" opacity="0.38" fill="none">
                  {/* Horizon line */}
                  <line x1="10" y1="75" x2="310" y2="75" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="none" />
                  
                  {/* Converging vanishing lines to center horizon */}
                  {Array.from({ length: 9 }).map((_, i) => {
                    const xStart = 20 + i * 35;
                    return (
                      <line 
                        key={i} 
                        x1={xStart} 
                        y1="115" 
                        x2={160 + (xStart - 160) * 0.18} 
                        y2="75" 
                      />
                    );
                  })}
                  {/* Transverse grid lines */}
                  {[75, 78, 83, 91, 102, 115].map((y, i) => (
                    <line key={i} x1="10" y1={y} x2="310" y2={y} />
                  ))}
                </g>

                {/* Ground Plane line */}
                <line x1="10" y1="105" x2="310" y2="105" stroke="#a89f91" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />

                {/* 3D Volumetric Soft Shadow Cast beneath Dinosaur COM */}
                <ellipse 
                  cx="150" 
                  cy="105" 
                  rx={isQuad ? "32" : "24"} 
                  ry="4.5" 
                  fill="#000000" 
                  fillOpacity="0.22" 
                />

                {/* Alternating Footprints on Ground */}
                {[-60, -20, 20, 60, 100, 140].map((offset, idx) => {
                  const xPos = ((gaitPhase * 160 + offset + 320) % 300) + 10;
                  return (
                    <ellipse 
                      key={idx} 
                      cx={xPos} 
                      cy="105" 
                      rx={Math.max(4, activeStrideM * 2)} 
                      ry="1.8" 
                      fill="#735238" 
                      opacity="0.35" 
                    />
                  );
                })}

                {/* Dinosaur Kinematics Center Node with Interactive Joint Selection */}
                <g transform={`translate(150, ${50 + bodyBobY})`}>
                  {/* Aquatic Propulsion Tail Ribbon */}
                  {isAquatic && (
                    <path
                      d={`M -40,0 Q -80,${tailSwayAngle * 1.5} -120,${-tailSwayAngle * 2}`}
                      fill="none"
                      stroke={selectedAnatomyPart === 'tail' ? "#38bdf8" : "#0284c7"}
                      strokeWidth={selectedAnatomyPart === 'tail' ? "10" : "8"}
                      strokeLinecap="round"
                      opacity="0.85"
                      className="cursor-pointer transition-all hover:opacity-100"
                      onClick={() => setSelectedAnatomyPart(prev => prev === 'tail' ? null : 'tail')}
                    />
                  )}

                  {/* Theropod / Sauropod Tail */}
                  {!isAquatic && (
                    <path
                      d={`M -30, -5 Q -70, ${-tailSwayAngle * 0.8} -110, ${-tailSwayAngle * 1.2}`}
                      fill="none"
                      stroke={selectedAnatomyPart === 'tail' ? "#10b981" : "#2b585c"}
                      strokeWidth={isQuad ? (selectedAnatomyPart === 'tail' ? "12" : "9") : (selectedAnatomyPart === 'tail' ? "8" : "6")}
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:stroke-emerald-500"
                      onClick={() => setSelectedAnatomyPart(prev => prev === 'tail' ? null : 'tail')}
                    />
                  )}

                  {/* Pelvis / Center of Mass (COM) Node */}
                  <g 
                    className="cursor-pointer group"
                    onClick={() => setSelectedAnatomyPart(prev => prev === 'com' ? null : 'com')}
                  >
                    <circle 
                      cx="0" 
                      cy="0" 
                      r={isQuad ? "15" : "11"} 
                      fill="#10b981" 
                      fillOpacity={selectedAnatomyPart === 'com' ? "0.6" : "0.3"} 
                      stroke={selectedAnatomyPart === 'com' ? "#047857" : "#10b981"} 
                      strokeWidth={selectedAnatomyPart === 'com' ? "3" : "2"} 
                      className="transition-transform group-hover:scale-110"
                    />
                    <circle cx="0" cy="0" r="3.5" fill="#047857" />
                  </g>

                  {/* Torso / Backbone */}
                  <path
                    d={isQuad ? "M -35,-5 C -10,-10 30,-10 50, -5" : "M -30,-5 C -10,-8 20,-12 40, -15"}
                    fill="none"
                    stroke="#2b585c"
                    strokeWidth={isQuad ? "16" : "10"}
                    strokeLinecap="round"
                  />

                  {/* Neck & Head */}
                  <g 
                    className="cursor-pointer group"
                    onClick={() => setSelectedAnatomyPart(prev => prev === 'neck' ? null : 'neck')}
                  >
                    <path
                      d={isQuad ? "M 50,-5 C 70,-25 80,-45 95, -45" : "M 40,-15 C 55,-25 65,-28 75, -25"}
                      fill="none"
                      stroke={selectedAnatomyPart === 'neck' ? "#f59e0b" : "#2b585c"}
                      strokeWidth={isQuad ? "10" : "7"}
                      strokeLinecap="round"
                      className="transition-colors group-hover:stroke-amber-500"
                    />
                    <circle 
                      cx={isQuad ? 95 : 75} 
                      cy={isQuad ? -45 : -25} 
                      r={isQuad ? (selectedAnatomyPart === 'neck' ? 11 : 9) : (selectedAnatomyPart === 'neck' ? 10 : 8)} 
                      fill={selectedAnatomyPart === 'neck' ? "#f59e0b" : "#2b585c"} 
                      className="transition-all"
                    />
                  </g>

                  {/* Hind Leg 1 (Left / Back) */}
                  <g 
                    transform={`rotate(${leg1Angle}, 0, 0)`}
                    className="cursor-pointer"
                    onClick={() => setSelectedAnatomyPart(prev => prev === 'hindleg' ? null : 'hindleg')}
                  >
                    <line x1="0" y1="0" x2="-8" y2="28" stroke="#1f3835" strokeWidth="6" strokeLinecap="round" />
                    <line x1="-8" y1="28" x2="2" y2="52" stroke="#1f3835" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M 2,52 L 14,52" stroke="#f5a623" strokeWidth="3" strokeLinecap="round" />
                  </g>

                  {/* Hind Leg 2 (Right / Forefront) */}
                  <g 
                    transform={`rotate(${leg2Angle}, 0, 0)`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedAnatomyPart(prev => prev === 'hindleg' ? null : 'hindleg')}
                  >
                    <line 
                      x1="0" 
                      y1="0" 
                      x2="-8" 
                      y2="28" 
                      stroke={selectedAnatomyPart === 'hindleg' ? "#10b981" : "#2b585c"} 
                      strokeWidth={selectedAnatomyPart === 'hindleg' ? "8.5" : "7"} 
                      strokeLinecap="round" 
                      className="transition-colors"
                    />
                    <line 
                      x1="-8" 
                      y1="28" 
                      x2="2" 
                      y2="52" 
                      stroke={selectedAnatomyPart === 'hindleg' ? "#10b981" : "#2b585c"} 
                      strokeWidth={selectedAnatomyPart === 'hindleg' ? "6.5" : "5.5"} 
                      strokeLinecap="round" 
                    />
                    <path d="M 2,52 L 16,52" stroke="#ea580c" strokeWidth={selectedAnatomyPart === 'hindleg' ? "5" : "4"} strokeLinecap="round" />
                  </g>

                  {/* Forelimbs for Quadrupedal species */}
                  {isQuad && (
                    <g 
                      className="cursor-pointer"
                      onClick={() => setSelectedAnatomyPart(prev => prev === 'forelimb' ? null : 'forelimb')}
                    >
                      <g transform={`translate(45, -5) rotate(${-leg2Angle * 0.9}, 0, 0)`}>
                        <line x1="0" y1="0" x2="4" y2="28" stroke={selectedAnatomyPart === 'forelimb' ? "#f59e0b" : "#2b585c"} strokeWidth="6" strokeLinecap="round" />
                        <line x1="4" y1="28" x2="2" y2="54" stroke={selectedAnatomyPart === 'forelimb' ? "#f59e0b" : "#2b585c"} strokeWidth="5" strokeLinecap="round" />
                        <circle cx="2" cy="54" r="3.5" fill="#f5a623" />
                      </g>
                      <g transform={`translate(45, -5) rotate(${-leg1Angle * 0.9}, 0, 0)`}>
                        <line x1="0" y1="0" x2="4" y2="28" stroke="#1f3835" strokeWidth="5" strokeLinecap="round" />
                        <line x1="4" y1="28" x2="2" y2="54" stroke="#1f3835" strokeWidth="4" strokeLinecap="round" />
                        <circle cx="2" cy="54" r="3" fill="#ea580c" />
                      </g>
                    </g>
                  )}

                  {/* Forelimbs for Theropods (Arms) */}
                  {!isQuad && !isAquatic && (
                    <g 
                      transform="translate(35, -10)"
                      className="cursor-pointer group"
                      onClick={() => setSelectedAnatomyPart(prev => prev === 'forelimb' ? null : 'forelimb')}
                    >
                      <line 
                        x1="0" 
                        y1="0" 
                        x2="8" 
                        y2="12" 
                        stroke={selectedAnatomyPart === 'forelimb' ? "#f59e0b" : "#2b585c"} 
                        strokeWidth={selectedAnatomyPart === 'forelimb' ? "4.5" : "3"} 
                        strokeLinecap="round" 
                      />
                      <line 
                        x1="8" 
                        y1="12" 
                        x2="14" 
                        y2="8" 
                        stroke={selectedAnatomyPart === 'forelimb' ? "#f59e0b" : "#2b585c"} 
                        strokeWidth={selectedAnatomyPart === 'forelimb' ? "3.5" : "2.5"} 
                        strokeLinecap="round" 
                      />
                    </g>
                  )}
                </g>
              </svg>
            </div>

            {/* Selected Anatomical Joint Readout Banner */}
            {selectedAnatomyPart && (
              <div className="mb-2 p-2 rounded-lg bg-emerald-950 text-white text-[9.5px] flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-rounded font-extrabold uppercase text-emerald-300">
                    {selectedAnatomyPart === 'com' && "Center of Mass (COM) Pelvic Pivot"}
                    {selectedAnatomyPart === 'hindleg' && "Femur / Tibia / Metatarsal Kinematic Chain"}
                    {selectedAnatomyPart === 'forelimb' && (isQuad ? "Pectoral Girdle & Columnar Forelimb" : "Reduced Theropod Manipulator")}
                    {selectedAnatomyPart === 'neck' && "Cervical Retractor & Cranial Kinetic Joint"}
                    {selectedAnatomyPart === 'tail' && "Caudofemoralis Counterbalance Stabilizer"}
                  </span>
                </div>
                <span className="font-mono text-emerald-200">
                  {selectedAnatomyPart === 'com' && "Pitch Oscillation: ±2.4°"}
                  {selectedAnatomyPart === 'hindleg' && `Phase Arc: ${Math.round(leg1Angle)}° / ${Math.round(leg2Angle)}°`}
                  {selectedAnatomyPart === 'forelimb' && (isQuad ? "Duty Load: 40% mass" : "Non-locomotor grasping")}
                  {selectedAnatomyPart === 'neck' && "Head Inertia Damper: 0.94"}
                  {selectedAnatomyPart === 'tail' && `Yaw Angular Deflection: ${tailSwayAngle.toFixed(1)}°`}
                </span>
              </div>
            )}

            {/* Canvas Footer: Quick speed multiplier pills */}
            <div className="flex items-center justify-between text-[9px] font-rounded text-slate-500 pt-1 border-t border-slate-200/60">
              <span className="truncate">Click skeleton parts to inspect kinematic levers</span>
              <div className="flex items-center gap-1 shrink-0">
                {[0.5, 1.0, 1.5, 2.0].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeedMultiplier(s)}
                    className={`px-1.5 py-0.2 rounded font-mono font-bold cursor-pointer transition-colors ${
                      speedMultiplier === s ? 'bg-park-tree text-white shadow-2xs' : 'bg-white/80 hover:bg-white text-slate-600'
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Compact, High-Density Sliders Next to Animation */}
        {/* Right Column (Controls): Biomechanical Matrix */}
        <div className="md:col-span-5 bg-slate-900 text-white rounded-2xl p-3 sm:p-3.5 border border-slate-800 flex flex-col justify-between space-y-2.5 shadow-sm overflow-y-auto custom-scrollbar min-w-0">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
              <SlidersHorizontal size={11} />
              <span>Biomechanical Sliders</span>
            </span>
            <span className="text-[8.5px] font-mono text-slate-400">Live Feedback</span>
          </div>

          {/* Slider 1: Velocity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
              <span className="text-emerald-400 flex items-center gap-1">
                <Zap size={11} />
                <span>Cursorial Velocity</span>
              </span>
              <span className="text-white font-mono text-xs font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {activeVelocityKmh} km/h ({velMs.toFixed(1)} m/s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepVelocity(-1)}
                disabled={activeVelocityKmh <= 2}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                title="Decrease Velocity"
              >
                <Minus size={10} />
              </button>
              <input
                type="range"
                min="2"
                max="70"
                step="0.5"
                value={activeVelocityKmh}
                onChange={(e) => setActiveVelocityKmh(Number(e.target.value))}
                className="flex-1 accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
              />
              <button
                onClick={() => stepVelocity(1)}
                disabled={activeVelocityKmh >= 70}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                title="Increase Velocity"
              >
                <Plus size={10} />
              </button>
            </div>
          </div>

          {/* Slider 2: Stride Length */}
          <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
              <span className="text-amber-400 flex items-center gap-1">
                <Footprints size={11} />
                <span>Stride Length (λ)</span>
              </span>
              <span className="text-white font-mono text-xs font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {activeStrideM.toFixed(1)} m ({strideRatio} λ/h)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepStride(-1)}
                disabled={activeStrideM <= 0.4}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
              >
                <Minus size={10} />
              </button>
              <input
                type="range"
                min="0.4"
                max="8.0"
                step="0.05"
                value={activeStrideM}
                onChange={(e) => setActiveStrideM(Number(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
              />
              <button
                onClick={() => stepStride(1)}
                disabled={activeStrideM >= 8.0}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
              >
                <Plus size={10} />
              </button>
            </div>
          </div>

          {/* Slider 3: Track Gauge Width */}
          <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
              <span className="text-orange-400 flex items-center gap-1">
                <SlidersHorizontal size={11} />
                <span>Trackway Gauge</span>
              </span>
              <span className="text-white font-mono text-xs font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {activeGaugeWidthCm} cm
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepGauge(-1)}
                disabled={activeGaugeWidthCm <= 10}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
              >
                <Minus size={10} />
              </button>
              <input
                type="range"
                min="10"
                max="120"
                step="1"
                value={activeGaugeWidthCm}
                onChange={(e) => setActiveGaugeWidthCm(Number(e.target.value))}
                className="flex-1 accent-orange-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
              />
              <button
                onClick={() => stepGauge(1)}
                disabled={activeGaugeWidthCm >= 120}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
              >
                <Plus size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Biomechanical Physical Formula Calculations (Interactive Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
        {/* 1. Interactive Velocity Card with Unit Cycling */}
        <button
          onClick={() => setVelocityUnit(u => u === 'kmh' ? 'mph' : u === 'mph' ? 'ms' : 'kmh')}
          className="p-2.5 bg-park-sand/40 hover:bg-park-sand/70 border border-park-card-border rounded-xl transition-all active:scale-[0.98] text-left"
          title="Click to cycle speed unit (km/h, mph, m/s)"
        >
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-rounded font-bold text-park-ink-muted uppercase block">Velocity</span>
            <span className="text-[8px] font-mono font-bold bg-park-tree/10 text-park-tree px-1 rounded">
              {velocityUnit}
            </span>
          </div>
          <span className="text-sm font-mono font-extrabold text-park-tree block mt-0.5">
            {velocityUnit === 'kmh' && `${activeVelocityKmh} km/h`}
            {velocityUnit === 'mph' && `${(activeVelocityKmh * 0.621371).toFixed(1)} mph`}
            {velocityUnit === 'ms' && `${velMs.toFixed(1)} m/s`}
          </span>
          <span className="text-[9px] font-mono text-park-ink-muted block mt-0.5">
            {velocityUnit === 'kmh' ? `${velMs.toFixed(1)} m/s` : `${activeVelocityKmh} km/h`}
          </span>
        </button>

        {/* 2. Froude Number Card with Gait Preset Snapping */}
        <button
          onClick={() => {
            // Snap to next gait regime
            if (calculatedFroude <= 0.5) {
              setActiveVelocityKmh(14); // trot
            } else if (calculatedFroude <= 1.5) {
              setActiveVelocityKmh(28); // sprint
            } else {
              setActiveVelocityKmh(6); // walk
            }
          }}
          className="p-2.5 bg-park-sand/40 hover:bg-park-sand/70 border border-park-card-border rounded-xl transition-all active:scale-[0.98] text-left"
          title="Click to snap between Walk, Trot, and Cursorial Sprint presets"
        >
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-rounded font-bold text-park-ink-muted uppercase block">Froude (Fr = v²/gh)</span>
            <span className="text-[8px] font-mono font-bold bg-amber-200/60 text-amber-900 px-1 rounded">
              Snap Gait
            </span>
          </div>
          <span className="text-sm font-mono font-extrabold text-amber-800 block mt-0.5">{calculatedFroude}</span>
          <span className="text-[9px] font-rounded text-park-ink-muted block mt-0.5">
            {calculatedFroude > 2.0 ? 'High Cursorial Sprint' : calculatedFroude > 0.5 ? 'Moderate Trot' : 'Graviportal Walk'}
          </span>
        </button>

        {/* 3. Stride Length & Hip Height Card with Interval Slicer */}
        <button
          onClick={() => setStrideInterval(s => s === 0.1 ? 0.2 : s === 0.2 ? 0.5 : s === 0.5 ? 1.0 : 0.1)}
          className="p-2.5 bg-park-sand/40 hover:bg-park-sand/70 border border-park-card-border rounded-xl transition-all active:scale-[0.98] text-left"
          title="Click to cycle Stride interval (Δs)"
        >
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-rounded font-bold text-park-ink-muted uppercase block">Stride & Hip</span>
            <span className="text-[8px] font-mono font-bold bg-emerald-200/60 text-emerald-900 px-1 rounded">
              ±{strideInterval}m
            </span>
          </div>
          <span className="text-sm font-mono font-extrabold text-park-tree block mt-0.5">
            {activeStrideM.toFixed(1)} m / {baseMetrics.hipHeightM} m
          </span>
          <span className="text-[9px] font-rounded text-park-ink-muted block mt-0.5">Ratio: {strideRatio}λ/h</span>
        </button>
      </div>

      {/* Trackway Morphometrics (Gauge Width, Pace Angulation, Manus-Pes) */}
      <div className="bg-white p-3 rounded-xl border border-park-card-border space-y-2">
        <div className="flex justify-between items-center text-[10px] font-rounded font-extrabold text-park-tree uppercase">
          <span>Trackway Morphometrics & Footprint Track Geometry</span>
          <span className="text-park-accent-orange font-mono">Pace Angle: {baseMetrics.paceAngulationDeg}°</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button 
            onClick={() => setActiveGaugeWidthCm(prev => prev <= 25 ? 45 : prev <= 50 ? 75 : 20)}
            className="p-2 bg-park-sand/20 hover:bg-park-sand/40 rounded-lg border border-park-card-border/60 text-left transition-all"
            title="Click to cycle gauge width preset"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-rounded font-bold text-park-ink-muted uppercase block">Track Gauge Width</span>
              <span className="text-[8px] font-mono font-bold text-park-tree">Preset</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-park-ink">{activeGaugeWidthCm} cm inter-track</span>
          </button>
          <div className="p-2 bg-park-sand/20 rounded-lg border border-park-card-border/60">
            <span className="text-[9px] font-rounded font-bold text-park-ink-muted uppercase block">Duty Factor (β)</span>
            <span className="text-[11px] font-mono font-bold text-park-ink">{baseMetrics.dutyFactorPercent}% Stance Phase</span>
          </div>
        </div>

        {/* Locomotion Adaptations Checklist with Interactive Joint Highlighting */}
        <div className="pt-2 border-t border-dotted border-park-card-border space-y-1.5">
          <span className="text-[9px] font-rounded font-bold text-park-ink-muted uppercase block">
            Osteological & Kinematic Adaptations (Click to highlight joint):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {baseMetrics.locomotionFeatures.map((feat, i) => {
              const featLower = feat.toLowerCase();
              const targetPart = featLower.includes('tail') ? 'tail' : featLower.includes('femur') || featLower.includes('pes') || featLower.includes('foot') || featLower.includes('stride') ? 'hindleg' : featLower.includes('neck') || featLower.includes('cranial') ? 'neck' : featLower.includes('center of mass') || featLower.includes('pelvi') ? 'com' : 'forelimb';
              const isSelected = selectedAnatomyPart === targetPart;

              return (
                <button 
                  key={i} 
                  onClick={() => setSelectedAnatomyPart(isSelected ? null : targetPart)}
                  className={`flex items-center gap-1.5 text-[9.5px] font-rounded px-2 py-1 rounded-lg border transition-all text-left ${
                    isSelected 
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-xs' 
                      : 'bg-park-sand/20 border-park-card-border/60 text-park-ink hover:border-park-card-border'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-emerald-600 animate-ping' : 'bg-emerald-500'}`}></span>
                  <span>{feat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocomotionVisualizer;
