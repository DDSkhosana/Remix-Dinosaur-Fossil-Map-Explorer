import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  Layers, 
  Activity, 
  Heart, 
  Footprints, 
  CloudSun, 
  Globe, 
  Compass, 
  Dna, 
  CheckCircle2, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Scale
} from 'lucide-react';
import { PaleoData } from '../types';

interface ScientificReasoningNexusProps {
  site: PaleoData;
  taxaName: string;
  onNavigateToTab: (tabId: string) => void;
}

export const ScientificReasoningNexus: React.FC<ScientificReasoningNexusProps> = ({
  site,
  taxaName,
  onNavigateToTab
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeStage, setActiveStage] = useState<'abduct' | 'adduct' | 'deduct' | 'induct'>('deduct');
  const [activeCotStep, setActiveCotStep] = useState<number>(5); // 0: perceive, 1: quantify, 2: attributes, 3: commonality, 4: classification, 5: understand, 6: test, 7: synthesize

  const ageMa = site.timeMarker?.exactAgeMa || 68;
  const diet = site.metadata?.diet || 'Carnivore';
  const completeness = site.metadata?.osteologicalCompleteness || 85;
  const period = site.geologicalContext?.period || 'Late Cretaceous';
  const climate = site.geologicalContext?.climate || 'Subtropical';

  const COT_STEPS = [
    { id: 0, label: '1. Perceive', desc: 'Fossil discovery & taphonomic bed recovery', tab: 'overview' },
    { id: 1, label: '2. Quantify', desc: `${completeness}% completeness, ${ageMa} Ma isotope age`, tab: 'overview' },
    { id: 2, label: '3. Attributes', desc: 'Lithology, CO₂ ppm & kinematic speed limits', tab: 'climate' },
    { id: 3, label: '4. Commonality', desc: 'Sympatric fauna & paleoclimatic overlap', tab: 'radar' },
    { id: 4, label: '5. Classification', desc: `${diet} guild, ${period} formation horizon`, tab: 'evolution' },
    { id: 5, label: '6. Understand', desc: '4-chambered heart & unidirectional respiration', tab: 'organs' },
    { id: 6, label: '7. Test', desc: 'Interactive parameter sliders & lapse simulation', tab: 'climate' },
    { id: 7, label: '8. Synthesize', desc: 'Macro-evolutionary radiation & tectonic drift', tab: 'evolution' }
  ];

  return (
    <div className="bg-gradient-to-br from-white via-[#faf8f2] to-emerald-50/40 rounded-2xl border border-emerald-900/20 p-3.5 sm:p-4 shadow-xs space-y-3 transition-all text-park-ink">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-park-card-border/60 pb-2.5 select-none">
        <div 
          onClick={() => setIsExpanded(prev => !prev)}
          className="flex items-center gap-2.5 cursor-pointer flex-1"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-800 to-teal-900 text-amber-300 flex items-center justify-center shadow-2xs shrink-0 border border-emerald-700/60">
            <Zap size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-300/80">
                Epistemological Nexus
              </span>
              <span className="text-slate-400 text-[10px]" aria-hidden="true">·</span>
              <span className="text-[9px] font-rounded font-extrabold text-park-tree">
                Chain of Reasoning & Thought
              </span>
            </div>
            <h4 className="text-[13px] font-rounded font-extrabold text-park-tree leading-snug">
              Systemic Paleobiological Reasoning Flow
            </h4>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="p-1 text-park-ink-muted hover:text-park-tree rounded-lg hover:bg-park-sand/40 transition-colors cursor-pointer"
          title={isExpanded ? "Collapse Reasoning Nexus" : "Expand Reasoning Nexus"}
        >
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 animate-in">
          {/* 8-Step Chain of Thought Stepper Pipeline */}
          <div className="bg-emerald-950 text-white p-2.5 rounded-xl border border-emerald-900/80 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-[9.5px] font-mono text-emerald-300">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                <span>Chain of Thought Pipeline:</span>
              </span>
              <span className="text-amber-300 font-extrabold">{COT_STEPS[activeCotStep].label} — {COT_STEPS[activeCotStep].desc}</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
              {COT_STEPS.map((step) => {
                const isActive = activeCotStep === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      setActiveCotStep(step.id);
                      if (step.tab === 'climate') setActiveStage('adduct');
                      else if (step.tab === 'organs') setActiveStage('deduct');
                      else if (step.tab === 'evolution') setActiveStage('induct');
                      else setActiveStage('abduct');
                      onNavigateToTab(step.tab);
                    }}
                    className={`p-1 rounded-md text-[8.5px] font-mono font-bold text-center transition-all cursor-pointer truncate ${
                      isActive 
                        ? 'bg-amber-400 text-emerald-950 font-black shadow-xs ring-1 ring-white/80' 
                        : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                    }`}
                    title={`${step.label}: ${step.desc}`}
                  >
                    <span>{step.label.split(' ')[1]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4-Stage Methodological Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-white/90 rounded-xl border border-park-card-border/80 text-[10px] font-rounded font-bold shadow-3xs">
            {[
              { id: 'abduct', stage: '1. Abduct', title: 'Taphonomic Clues', color: 'from-amber-600 to-amber-700' },
              { id: 'adduct', stage: '2. Adduct', title: 'Multi-Data Synthesis', color: 'from-blue-600 to-indigo-700' },
              { id: 'deduct', stage: '3. Deduct', title: 'Biomechanical Laws', color: 'from-emerald-700 to-teal-800' },
              { id: 'induct', stage: '4. Induct', title: 'Macro-Evolution', color: 'from-purple-700 to-purple-800' }
            ].map((st) => {
              const isActive = activeStage === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setActiveStage(st.id as any)}
                  className={`p-1.5 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive 
                      ? 'bg-gradient-to-r text-white shadow-xs font-black ring-1 ring-white/50 ' + st.color
                      : 'hover:bg-park-card-muted/60 text-park-ink-muted hover:text-park-tree'
                  }`}
                >
                  <span className="text-[8.5px] font-mono opacity-80 uppercase">{st.stage}</span>
                  <span className="truncate">{st.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Stage Reasoning Card */}
          <div className="bg-white p-3 rounded-xl border border-park-card-border/80 space-y-2 shadow-3xs">
            {activeStage === 'abduct' && (
              <div className="space-y-2 animate-in text-[11px] font-rounded">
                <div className="flex items-center justify-between border-b border-park-card-border/60 pb-1.5">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                    <Layers size={13} className="text-amber-600" />
                    <span>Stage 1: Abductive Taphonomic Inference</span>
                  </div>
                  <button
                    onClick={() => onNavigateToTab('overview')}
                    className="text-[9.5px] font-mono font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Inspect Stratum</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
                <p className="text-park-ink leading-relaxed">
                  From the empirical recovery of <strong className="text-amber-950">{completeness}% complete skeletal elements</strong> at {site.name}, we abduce a rapid fluvial burial regime in {site.geologicalContext?.formation || 'fluvial channel'} sandstone, preventing post-mortem scavenge disarticulation.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9.5px] font-mono pt-1">
                  <div className="p-1.5 bg-amber-50/70 rounded-lg border border-amber-200">
                    <span className="text-amber-800 block">Completeness:</span>
                    <strong className="text-amber-950">{completeness}% Articulated</strong>
                  </div>
                  <div className="p-1.5 bg-amber-50/70 rounded-lg border border-amber-200">
                    <span className="text-amber-800 block">Chronology:</span>
                    <strong className="text-amber-950">{ageMa} Ma ({period})</strong>
                  </div>
                  <div className="p-1.5 bg-amber-50/70 rounded-lg border border-amber-200 col-span-2 sm:col-span-1">
                    <span className="text-amber-800 block">Dietary Guild:</span>
                    <strong className="text-amber-950">{diet} Apex</strong>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 'adduct' && (
              <div className="space-y-2 animate-in text-[11px] font-rounded">
                <div className="flex items-center justify-between border-b border-park-card-border/60 pb-1.5">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                    <CloudSun size={13} className="text-indigo-600" />
                    <span>Stage 2: Adductive Multi-Disciplinary Synthesis</span>
                  </div>
                  <button
                    onClick={() => onNavigateToTab('climate')}
                    className="text-[9.5px] font-mono font-bold text-indigo-800 hover:text-indigo-950 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Inspect Paleoclimate</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
                <p className="text-park-ink leading-relaxed">
                  Cross-synthesizing paleoclimatic data (mean surface temperature <strong className="text-indigo-950">{site.climateVariables?.meanTempC || 22}°C</strong>, atmospheric <strong className="text-indigo-950">{site.climateVariables?.co2Ppm || 1500} ppm CO₂</strong>) with paleobotanical conifer canopy strata establishes an energized greenhouse ecosystem supporting massive herbivorous primary consumers.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9.5px] font-mono pt-1">
                  <div className="p-1.5 bg-indigo-50/70 rounded-lg border border-indigo-200">
                    <span className="text-indigo-800 block">Atmosphere:</span>
                    <strong className="text-indigo-950">{site.climateVariables?.co2Ppm || 1500} ppm CO₂</strong>
                  </div>
                  <div className="p-1.5 bg-indigo-50/70 rounded-lg border border-indigo-200">
                    <span className="text-indigo-800 block">Köppen Zone:</span>
                    <strong className="text-indigo-950">{climate}</strong>
                  </div>
                  <div className="p-1.5 bg-indigo-50/70 rounded-lg border border-indigo-200 col-span-2 sm:col-span-1">
                    <span className="text-indigo-800 block">Elevation:</span>
                    <strong className="text-indigo-950">{site.elevation?.paleoElevationM || 120}m ASL</strong>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 'deduct' && (
              <div className="space-y-2 animate-in text-[11px] font-rounded">
                <div className="flex items-center justify-between border-b border-park-card-border/60 pb-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                    <Activity size={13} className="text-emerald-700" />
                    <span>Stage 3: Deductive Biomechanical & Physiological Invariants</span>
                  </div>
                  <button
                    onClick={() => onNavigateToTab('organs')}
                    className="text-[9.5px] font-mono font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Inspect Organs & Viscera</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
                <p className="text-park-ink leading-relaxed">
                  Deducing from avian unidirectional respiratory flow and 4-chambered cardiac separation: oxygenation efficiency enables elevated resting metabolic rates. Dynamic Froude calculations (<strong className="text-emerald-950">Fr = v² / gh = 1.48</strong>) dictate an optimal sprint velocity ceiling of <strong className="text-emerald-950">{site.locomotion?.topSpeedKmh || 27} km/h</strong>.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9.5px] font-mono pt-1">
                  <div className="p-1.5 bg-emerald-50/70 rounded-lg border border-emerald-200">
                    <span className="text-emerald-800 block">Kinematic Limit:</span>
                    <strong className="text-emerald-950">{site.locomotion?.topSpeedKmh || 27.4} km/h</strong>
                  </div>
                  <div className="p-1.5 bg-emerald-50/70 rounded-lg border border-emerald-200">
                    <span className="text-emerald-800 block">Heart Anatomy:</span>
                    <strong className="text-emerald-950">4-Chambered Complete</strong>
                  </div>
                  <div className="p-1.5 bg-emerald-50/70 rounded-lg border border-emerald-200 col-span-2 sm:col-span-1">
                    <span className="text-emerald-800 block">Air Sacs:</span>
                    <strong className="text-emerald-950">Continuous Unidirectional</strong>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 'induct' && (
              <div className="space-y-2 animate-in text-[11px] font-rounded">
                <div className="flex items-center justify-between border-b border-park-card-border/60 pb-1.5">
                  <div className="flex items-center gap-1.5 text-purple-900 font-bold">
                    <Globe size={13} className="text-purple-700" />
                    <span>Stage 4: Inductive Macro-Evolutionary Generalization</span>
                  </div>
                  <button
                    onClick={() => onNavigateToTab('evolution')}
                    className="text-[9.5px] font-mono font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Inspect Evolutionary Tectonics</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
                <p className="text-park-ink leading-relaxed">
                  Inductively generalizing across contemporaneous Late Cretaceous faunal cohorts: continental rifting of Laurasia and inland Western Interior Seaway regression created isolated evolutionary radiation corridors, driving extreme cranial hyper-carnivory and ceratopsian frill armor diversification.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9.5px] font-mono pt-1">
                  <div className="p-1.5 bg-purple-50/70 rounded-lg border border-purple-200">
                    <span className="text-purple-800 block">Continental Realm:</span>
                    <strong className="text-purple-950">Laramidia / Laurasia</strong>
                  </div>
                  <div className="p-1.5 bg-purple-50/70 rounded-lg border border-purple-200">
                    <span className="text-purple-800 block">Extinction Horizon:</span>
                    <strong className="text-purple-950">K-Pg Boundary (66 Ma)</strong>
                  </div>
                  <div className="p-1.5 bg-purple-50/70 rounded-lg border border-purple-200 col-span-2 sm:col-span-1">
                    <span className="text-purple-800 block">Clade Radiation:</span>
                    <strong className="text-purple-950">Theropoda / Coelurosauria</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScientificReasoningNexus;
