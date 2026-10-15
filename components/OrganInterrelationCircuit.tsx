import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  ArrowRight, 
  Sparkles, 
  ExternalLink, 
  CloudSun, 
  Footprints, 
  Calendar, 
  Mountain, 
  Bone, 
  Activity, 
  Globe, 
  Compass, 
  Heart,
  ChevronRight,
  ShieldAlert,
  X
} from 'lucide-react';
import { OrganDetail } from '../data/organSystemsData';
import { CrossDomainInterrelation, AbstractionTier } from '../types';

interface OrganInterrelationCircuitProps {
  organ: OrganDetail;
  taxaName: string;
  onNavigateToTab?: (tab: string) => void;
  onClose?: () => void;
  onSelectTier?: (tier: AbstractionTier) => void;
}

const DOMAIN_ICONS: Record<string, any> = {
  climate: CloudSun,
  locomotion: Footprints,
  lifecycle: Calendar,
  elevation: Mountain,
  inventory: Bone,
  metrics: Activity,
  overview: Globe,
  cardinal: Compass,
  organs: Heart
};

const TIER_META: Record<AbstractionTier, { label: string; color: string; bg: string; border: string }> = {
  macro_ecological: {
    label: "Macro-Ecological Abstraction",
    color: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-500/30"
  },
  organismal_biomechanic: {
    label: "Organismal Biomechanical Abstraction",
    color: "text-emerald-400",
    bg: "bg-emerald-950/40",
    border: "border-emerald-500/30"
  },
  systemic_physiological: {
    label: "Systemic Physiological Abstraction",
    color: "text-sky-400",
    bg: "bg-sky-950/40",
    border: "border-sky-500/30"
  },
  micro_histological: {
    label: "Micro-Histological & Taphonomic Abstraction",
    color: "text-purple-400",
    bg: "bg-purple-950/40",
    border: "border-purple-500/30"
  }
};

const FEEDBACK_BADGES: Record<string, { label: string; color: string }> = {
  metabolic_coupling: { label: "Metabolic Coupling", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
  biomechanical_leverage: { label: "Biomechanical Leverage", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  climatic_adaptation: { label: "Climatic Adaptation", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  taphonomic_signature: { label: "Taphonomic Signature", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  developmental_progression: { label: "Developmental Progression", color: "bg-sky-500/20 text-sky-300 border-sky-500/40" }
};

export const OrganInterrelationCircuit: React.FC<OrganInterrelationCircuitProps> = ({
  organ,
  taxaName,
  onNavigateToTab,
  onClose,
  onSelectTier
}) => {
  const [activeInterrelationIndex, setActiveInterrelationIndex] = useState<number>(0);
  const interrelations = organ.interrelations || [];
  const activeInterrelation = interrelations[activeInterrelationIndex] || interrelations[0];

  // Universal Escape key listener for circuit view
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

  const tierKey: AbstractionTier = organ.abstractionTier || 'systemic_physiological';
  const currentTier = TIER_META[tierKey] || TIER_META.systemic_physiological;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 text-slate-100 flex flex-col gap-3 shadow-inner">
      {/* Circuit Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Share2 size={15} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-mono font-bold text-white uppercase tracking-wider">
                Cross-Domain Interrelation Circuit
              </span>
              <button
                onClick={() => onSelectTier?.(tierKey)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-all cursor-pointer hover:scale-105 active:scale-95 ${currentTier.bg} ${currentTier.color} ${currentTier.border}`}
                title="Click to categorize data by this abstraction tier"
              >
                {currentTier.label}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 font-rounded block">
              Multi-tiered physiological cross-talk linking organs to locomotion, climate, ontogeny, and taphonomy
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Skeletal Correlate Chip */}
          {organ.skeletalCorrelate && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-[10px] font-mono text-slate-300">
              <Bone size={12} className="text-amber-400" />
              <span className="text-slate-400">Osteology:</span>
              <strong className="text-white">{organ.skeletalCorrelate.boneName}</strong>
            </div>
          )}

          {/* Quick Exit Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-lg text-[10.5px] font-rounded font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              title="Exit Circuit View (Esc)"
            >
              <X size={12} strokeWidth={2.5} />
              <span>Exit Circuit</span>
              <span className="text-[8.5px] font-mono bg-black/25 px-1 py-0.2 rounded text-white/90">Esc</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Circuit Flow Visualizer */}
      <div className="relative w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 overflow-hidden">
        {/* Visual Circuit Diagram connecting Central Organ Node to Interrelated Domains */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          {/* Central Source Organ Node */}
          <div className="w-full md:w-5/12 bg-slate-950/90 border-2 border-sky-500/50 rounded-xl p-3.5 flex flex-col gap-1.5 shadow-xl relative group">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase text-sky-400 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                PHYSIOLOGICAL GENERATOR
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {taxaName}
              </span>
            </div>

            <div className="flex items-center gap-2.5 mt-0.5">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                style={{ backgroundColor: organ.color }}
              >
                <Heart size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-bold text-white leading-snug truncate">
                  {organ.name}
                </h4>
                <span className="text-[10px] font-mono italic text-slate-400 truncate block">
                  {organ.latinTerm}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-rounded mt-1 line-clamp-2 leading-relaxed">
              {organ.physiologicalRole}
            </p>
          </div>

          {/* Bi-directional Flow Vector */}
          <div className="hidden md:flex flex-col items-center justify-center px-2">
            <div className="flex items-center gap-1 text-sky-400 animate-pulse">
              <div className="w-6 h-0.5 bg-gradient-to-r from-sky-500 to-amber-500" />
              <ArrowRight size={16} />
            </div>
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest mt-1">
              COUPLING
            </span>
          </div>

          {/* Interrelated Target Domains List */}
          <div className="w-full md:w-6/12 flex flex-col gap-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>CONNECTED ABSTRACTION DOMAINS:</span>
              <span className="text-slate-400">{interrelations.length} Direct Pathways</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {interrelations.map((link, idx) => {
                const IconComponent = DOMAIN_ICONS[link.targetDomain] || Activity;
                const isSelected = idx === activeInterrelationIndex;
                const badge = FEEDBACK_BADGES[link.feedbackType] || { label: "Coupled", color: "bg-slate-800 text-slate-300 border-slate-700" };

                return (
                  <button
                    key={idx}
                    onClick={() => setActiveInterrelationIndex(idx)}
                    className={`text-left p-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected 
                        ? 'bg-sky-950/80 border-sky-400 shadow-md ring-1 ring-sky-500/30' 
                        : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <IconComponent size={13} className={isSelected ? 'text-sky-400' : 'text-slate-400'} />
                        <span className="text-[11px] font-bold text-slate-200 truncate">
                          {link.domainLabel}
                        </span>
                      </div>
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded border ${badge.color} shrink-0`}>
                        {badge.label}
                      </span>
                    </div>

                    <span className="text-[10px] font-rounded text-slate-400 line-clamp-1">
                      {link.relationshipTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Background Interrelation Grid Mesh */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Selected Interrelation Deep-Dive Card */}
      {activeInterrelation && (
        <div className="bg-slate-900 border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40">
                ACTIVE PATHWAY
              </span>
              <h5 className="text-[12px] font-bold text-white flex items-center gap-1.5">
                {activeInterrelation.relationshipTitle}
              </h5>
            </div>

            {/* Jump to Dossier Tab Navigation Button */}
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab(activeInterrelation.targetDomain)}
                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-rounded font-bold text-[11px] flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                title={`Jump to ${activeInterrelation.domainLabel} in Field Journal`}
              >
                <span>Inspect in {activeInterrelation.domainLabel}</span>
                <ExternalLink size={12} />
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-300 font-rounded leading-relaxed">
            {activeInterrelation.relationshipDescription}
          </p>

          {/* Telemetry Metric Pill */}
          {activeInterrelation.telemetryMetric && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400">
                {activeInterrelation.telemetryMetric.label}:
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                {activeInterrelation.telemetryMetric.value}
              </span>
              <span className="text-[10px] text-slate-500 italic ml-auto hidden sm:inline">
                Interrelated feedback verified via biomechanical scaling laws
              </span>
            </div>
          )}

          {/* Quick Exit & Return Strip */}
          {onClose && (
            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="text-rose-400 hover:text-rose-300 active:scale-95 text-[10.5px] font-rounded font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Exit Circuit View (Esc)"
              >
                <X size={12} strokeWidth={2.5} />
                <span>Exit Interrelation Circuit</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganInterrelationCircuit;
