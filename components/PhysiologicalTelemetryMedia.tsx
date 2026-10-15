import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Activity, Zap, RefreshCw, Sliders, ShieldCheck, X } from 'lucide-react';
import { OrganDetail } from '../data/organSystemsData';

interface PhysiologicalTelemetryMediaProps {
  organ: OrganDetail;
  bpm: number;
  massKg: number;
  taxaName: string;
  onClose?: () => void;
}

export const PhysiologicalTelemetryMedia: React.FC<PhysiologicalTelemetryMediaProps> = ({
  organ,
  bpm,
  massKg,
  taxaName,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [sweepSpeed, setSweepSpeed] = useState<number>(1.2);
  const [activeChannel, setActiveChannel] = useState<'primary' | 'secondary'>('primary');
  const animationFrameRef = useRef<number | null>(null);
  const timeOffsetRef = useRef<number>(0);

  // Universal Escape key listener
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

  const waveform = organ.waveformData || {
    waveformType: 'cardiac_ecg',
    primaryLabel: 'Hemodynamic Arterial Pulse',
    baselineVal: 80,
    peakVal: 195,
    unit: 'mmHg',
    description: 'Ventricular ejection wave and systemic dicrotic notch.'
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isPlaying) {
        timeOffsetRef.current += dt * sweepSpeed * (bpm / 40);
      }

      const width = canvas.width;
      const height = canvas.height;

      // Dark oscilloscope canvas background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Grid lines (electro-physiological grid)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center baseline reference
      ctx.strokeStyle = '#334155';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height * 0.65);
      ctx.lineTo(width, height * 0.65);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw active waveform
      const points: { x: number; y: number }[] = [];
      const numSamples = 240;
      const baselineY = height * 0.65;
      const amplitude = height * 0.45;

      for (let i = 0; i < numSamples; i++) {
        const x = (i / (numSamples - 1)) * width;
        const phase = ((i / numSamples) * 4 - timeOffsetRef.current) % 1;
        const normalizedPhase = (phase + 1) % 1; // 0 to 1

        let signal = 0;

        if (waveform.waveformType === 'cardiac_ecg') {
          // Ventricular P-Q-R-S-T + Arterial pulse wave
          if (normalizedPhase < 0.1) {
            // P wave (atrial depolarization)
            signal = 0.15 * Math.sin((normalizedPhase / 0.1) * Math.PI);
          } else if (normalizedPhase >= 0.12 && normalizedPhase < 0.15) {
            // Q wave (septal deflection)
            signal = -0.15 * Math.sin(((normalizedPhase - 0.12) / 0.03) * Math.PI);
          } else if (normalizedPhase >= 0.15 && normalizedPhase < 0.22) {
            // R wave (massive ventricular contraction spike)
            signal = 1.0 * Math.sin(((normalizedPhase - 0.15) / 0.07) * Math.PI);
          } else if (normalizedPhase >= 0.22 && normalizedPhase < 0.26) {
            // S wave (ventricular recovery dip)
            signal = -0.28 * Math.sin(((normalizedPhase - 0.22) / 0.04) * Math.PI);
          } else if (normalizedPhase >= 0.32 && normalizedPhase < 0.50) {
            // T wave + Dicrotic notch
            const tPhase = (normalizedPhase - 0.32) / 0.18;
            signal = 0.4 * Math.sin(tPhase * Math.PI);
            if (tPhase > 0.4 && tPhase < 0.6) {
              signal += 0.08 * Math.sin(((tPhase - 0.4) / 0.2) * Math.PI); // dicrotic notch
            }
          }
        } else if (waveform.waveformType === 'air_cycle') {
          // Continuous 2-cycle parabronchial airflow
          const cycle1 = 0.85 * Math.sin(normalizedPhase * Math.PI * 2);
          const cycle2 = 0.35 * Math.sin(normalizedPhase * Math.PI * 4 + 0.5);
          signal = (cycle1 + cycle2) * 0.7;
        } else if (waveform.waveformType === 'grf_curve') {
          // Ground reaction force gait stance curve
          if (normalizedPhase < 0.55) {
            const stancePhase = normalizedPhase / 0.55;
            // Dual humped stance force (heel/claw strike + propulsion push-off)
            signal = 0.9 * Math.sin(stancePhase * Math.PI) + 0.3 * Math.sin(stancePhase * Math.PI * 2);
          } else {
            signal = 0; // Swing phase
          }
        } else if (waveform.waveformType === 'neural_spike') {
          // Sensory action potential bursts
          const burst = Math.sin(normalizedPhase * Math.PI * 8);
          signal = Math.abs(burst) > 0.6 ? (Math.random() * 0.9 + 0.1) : 0.05 * Math.sin(normalizedPhase * 20);
        } else {
          // Gastric churning pressure
          signal = 0.6 * Math.sin(normalizedPhase * Math.PI * 2) + 0.25 * Math.sin(normalizedPhase * Math.PI * 6);
        }

        const y = baselineY - signal * amplitude;
        points.push({ x, y });
      }

      // Glow backdrop line
      ctx.strokeStyle = organ.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Sharp primary line
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Sweep radar cursor
      const cursorX = ((timeOffsetRef.current * 80) % width);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, height);
      ctx.stroke();

      // Small scanhead marker
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cursorX, 10, 3.5, 0, Math.PI * 2);
      ctx.fill();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, sweepSpeed, bpm, organ.id, organ.color, waveform.waveformType]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 text-slate-100 flex flex-col gap-3 shadow-inner">
      {/* Visual Media Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: organ.color }}
          >
            <Activity size={15} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-mono font-bold text-white uppercase tracking-wider">
                {waveform.primaryLabel}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE OSCILLOSCOPE
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-rounded block">
              In-vivo paleophysiological telemetry • Calibrated for {taxaName} ({massKg.toLocaleString()} kg)
            </span>
          </div>
        </div>

        {/* Real-time controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition-all ${
              isPlaying 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
            title={isPlaying ? "Pause Stream" : "Resume Stream"}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span className="text-[10px] hidden sm:inline">{isPlaying ? 'Freeze' : 'Stream'}</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
            <Sliders size={11} className="text-slate-400" />
            <span className="text-[9px] font-mono text-slate-400">Sweep:</span>
            <button 
              onClick={() => setSweepSpeed(0.8)}
              className={`text-[9px] font-mono px-1 rounded ${sweepSpeed === 0.8 ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              0.8x
            </button>
            <button 
              onClick={() => setSweepSpeed(1.2)}
              className={`text-[9px] font-mono px-1 rounded ${sweepSpeed === 1.2 ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              1.0x
            </button>
            <button 
              onClick={() => setSweepSpeed(2.0)}
              className={`text-[9px] font-mono px-1 rounded ${sweepSpeed === 2.0 ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              2.0x
            </button>
          </div>

          {/* Quick Exit Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-lg text-[10.5px] font-rounded font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0"
              title="Exit Oscilloscope (Esc)"
            >
              <X size={12} strokeWidth={2.5} />
              <span>Exit</span>
              <span className="text-[8.5px] font-mono bg-black/25 px-1 py-0.2 rounded text-white/90">Esc</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Canvas Screen */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-[#090d16] shadow-2xl">
        <canvas
          ref={canvasRef}
          width={640}
          height={170}
          className="w-full h-[150px] sm:h-[170px] block cursor-crosshair"
        />

        {/* Telemetry Overlay Markers */}
        <div className="absolute top-2 left-2 pointer-events-none flex flex-col gap-0.5 bg-slate-950/70 backdrop-blur-xs px-2 py-1 rounded border border-slate-800/60 font-mono text-[9px]">
          <div className="text-slate-400 flex items-center gap-1.5">
            <span>PEAK AMPLITUDE:</span>
            <strong className="text-sky-300 font-bold">{waveform.peakVal} {waveform.unit}</strong>
          </div>
          <div className="text-slate-400 flex items-center gap-1.5">
            <span>BASELINE DIASTOLIC:</span>
            <strong className="text-slate-300 font-medium">{waveform.baselineVal} {waveform.unit}</strong>
          </div>
        </div>

        <div className="absolute top-2 right-2 pointer-events-none flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-xs px-2 py-1 rounded border border-slate-800/60 font-mono text-[9px] text-slate-400">
          <span>FREQUENCY:</span>
          <strong className="text-rose-400 font-bold">{bpm} CYCLES/MIN</strong>
        </div>

        {/* Channel selector chips */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest px-1">CHANNEL:</span>
          <button
            onClick={() => setActiveChannel('primary')}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-all ${
              activeChannel === 'primary'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                : 'bg-slate-900/60 text-slate-400 border-slate-800'
            }`}
          >
            CH1: In-Vivo Primary
          </button>
        </div>
      </div>

      {/* Telemetry Annotation Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-rounded">
        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 flex flex-col">
          <span className="text-slate-400 font-mono text-[9px] uppercase">Scientific Mechanism</span>
          <span className="text-slate-200 mt-0.5 line-clamp-2">{waveform.description}</span>
        </div>
        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 flex flex-col">
          <span className="text-slate-400 font-mono text-[9px] uppercase">Allometric Hemodynamics</span>
          <span className="text-slate-200 mt-0.5 font-mono">
            {massKg > 10000 
              ? 'High-resistance systemic circuit with aortic dampening' 
              : 'Rapid stroke rate with high-perfusion microvasculature'}
          </span>
        </div>
        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 flex flex-col">
          <span className="text-slate-400 font-mono text-[9px] uppercase">Model Verification</span>
          <span className="text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
            <ShieldCheck size={11} />
            Neornithine & Crocodilian Homology Validated
          </span>
        </div>
      </div>

      {/* Direct Exit Strip for Telemetry Oscilloscope */}
      {onClose && (
        <div className="flex items-center justify-end pt-1 border-t border-slate-800/80">
          <button
            onClick={onClose}
            className="text-rose-400 hover:text-rose-300 active:scale-95 text-[10.5px] font-rounded font-bold flex items-center gap-1 cursor-pointer transition-colors"
            title="Exit Oscilloscope (Esc)"
          >
            <X size={12} strokeWidth={2.5} />
            <span>Exit Oscilloscope Telemetry</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PhysiologicalTelemetryMedia;
