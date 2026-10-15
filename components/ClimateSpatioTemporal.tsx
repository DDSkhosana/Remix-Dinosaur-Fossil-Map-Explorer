import React, { useState, useEffect, useMemo } from 'react';
import { ClimateVariables } from '../types';
import { MESOZOIC_CLIMATE_CURVE, PALEO_BIOMES, PaleoBiome, FloraPlant } from '../utils/paleoClimate';
import ScrollableTabGroup, { TabItem } from './ScrollableTabGroup';
import RockStrataLithologyColumn from './RockStrataLithologyColumn';
import { 
  Thermometer, Wind, CloudRain, Activity, CheckCircle2, ChevronRight, 
  Waves, Plus, Minus, RotateCcw, TreePine, Leaf, Flower2, 
  Sparkles, Layers, Info, Filter, ArrowRight, ExternalLink, Check, 
  ChevronDown, ChevronUp, Compass, Sliders, Mountain, Play, Pause, TrendingUp,
  LayoutGrid, Eye
} from 'lucide-react';

interface ClimateSpatioTemporalProps {
  climate?: ClimateVariables;
  climateData?: ClimateVariables;
  periodName?: string;
  exactAgeMa?: number;
  siteName?: string;
  taxaName?: string;
  onSelectTimePoint?: (ageMa: number) => void;
  onSelectTaxon?: (taxonName: string) => void;
  onSelectBiome?: (biomeId: string) => void;
}

const DEFAULT_CLIMATE: ClimateVariables = {
  meanTempC: 22.0,
  tempAnomalyC: 7.0,
  co2Ppm: 1500,
  oxygenPercent: 26.0,
  precipitationMmYr: 1200,
  humidityIndex: 'Humid',
  biome: 'Warm Temperate Coastal Plains',
  koppenEquivalent: 'Cwa (Monsoonal Subtropical)',
  solarInsolationWpm2: 240,
  seaLevelAnomalyM: 100
};

const CLIMATE_METRIC_TABS: TabItem[] = [
  { id: 'temp', label: 'Global Surface Temp', badge: '°C & K', icon: Thermometer },
  { id: 'co2', label: 'Atmospheric pCO₂', badge: 'ppm', icon: Wind },
  { id: 'sealevel', label: 'Eustatic Sea Level', badge: 'm', icon: Waves },
  { id: 'o2', label: 'Atmospheric O₂ Ratio', badge: '%', icon: Activity },
  { id: 'precipitation', label: 'Precipitation Index', badge: 'mm/yr', icon: CloudRain }
];

const ClimateSpatioTemporal: React.FC<ClimateSpatioTemporalProps> = ({ 
  climate: climateProp, 
  climateData,
  periodName = 'Mesozoic Epoch', 
  exactAgeMa = 70,
  siteName,
  taxaName,
  onSelectTimePoint,
  onSelectTaxon,
  onSelectBiome
}) => {
  const [activeMetric, setActiveMetric] = useState<string>('temp');
  const [subViewMode, setSubViewMode] = useState<'all' | 'climate' | 'strata' | 'biomes'>('all');

  // Subpanel collapsibility state
  const [isBiomesCollapsed, setIsBiomesCollapsed] = useState<boolean>(true);
  const [isClimatePanelCollapsed, setIsClimatePanelCollapsed] = useState<boolean>(true);

  // Fallback safe climate object
  const baselineClimate = climateProp || climateData || DEFAULT_CLIMATE;

  // Determine initial matching biome from specimen locality
  const initialBiome = useMemo(() => {
    const biomeDesc = (baselineClimate.biome || '').toLowerCase();
    return PALEO_BIOMES.find(b => {
      const bKey = b.name.toLowerCase().split(' ')[0];
      return biomeDesc.includes(bKey) || b.name.toLowerCase().includes(biomeDesc.split(' ')[0]);
    }) || PALEO_BIOMES[1];
  }, [baselineClimate.biome]);

  // Active simulated biome state (allows testing any paleo-biome interactively)
  const [activeBiome, setActiveBiome] = useState<PaleoBiome>(initialBiome);
  const [expandedBiomeId, setExpandedBiomeId] = useState<string | null>(initialBiome.id);
  const [selectedPlant, setSelectedPlant] = useState<FloraPlant | null>(null);
  const [biomeFilter, setBiomeFilter] = useState<string>('all');
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  // Interactive Numerical State with Relevant Interval Manipulation
  const [activeTempC, setActiveTempC] = useState<number>(baselineClimate.meanTempC ?? 22.0);
  const [tempInterval, setTempInterval] = useState<number>(1.0); // ±0.5, ±1.0, ±2.5, ±5.0 °C

  const [activeCo2Ppm, setActiveCo2Ppm] = useState<number>(baselineClimate.co2Ppm ?? 1500);
  const [co2Interval, setCo2Interval] = useState<number>(100); // ±50, ±100, ±250, ±500 ppm

  const [activeSeaLevelM, setActiveSeaLevelM] = useState<number>(baselineClimate.seaLevelAnomalyM ?? 100);
  const [seaLevelInterval, setSeaLevelInterval] = useState<number>(25); // ±10, ±25, ±50 m

  const [activeElevationM, setActiveElevationM] = useState<number>(120); // 0m to 2500m ASL
  const [elevationInterval, setElevationInterval] = useState<number>(50); // ±25m, ±50m, ±100m, ±250m

  const [activeHumidity, setActiveHumidity] = useState<string>(baselineClimate.humidityIndex ?? 'Humid');
  const [isPlayingEpochSweep, setIsPlayingEpochSweep] = useState<boolean>(false);

  // Automated Mesozoic Timeline Sweep
  useEffect(() => {
    if (!isPlayingEpochSweep) return;
    const interval = setInterval(() => {
      const nextAge = exactAgeMa <= 66 ? 245 : exactAgeMa - 5;
      onSelectTimePoint?.(nextAge);
      const closest = MESOZOIC_CLIMATE_CURVE.reduce((prev, curr) => 
        Math.abs(curr.ageMa - nextAge) < Math.abs(prev.ageMa - nextAge) ? curr : prev
      );
      setActiveTempC(closest.meanTempC);
      setActiveCo2Ppm(closest.co2Ppm);
      setActiveSeaLevelM(closest.seaLevelM);
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlayingEpochSweep, exactAgeMa, onSelectTimePoint]);

  // Sync when baseline changes
  useEffect(() => {
    setActiveTempC(baselineClimate.meanTempC ?? 22.0);
    setActiveCo2Ppm(baselineClimate.co2Ppm ?? 1500);
    setActiveSeaLevelM(baselineClimate.seaLevelAnomalyM ?? 100);
    setActiveHumidity(baselineClimate.humidityIndex ?? 'Humid');
    setActiveBiome(initialBiome);
    setExpandedBiomeId(initialBiome.id);
  }, [baselineClimate.meanTempC, baselineClimate.co2Ppm, baselineClimate.seaLevelAnomalyM, baselineClimate.humidityIndex, initialBiome]);

  const stepTemp = (sign: 1 | -1) => {
    setActiveTempC(prev => Math.max(5, Math.min(45, Math.round((prev + sign * tempInterval) * 10) / 10)));
  };

  const stepCo2 = (sign: 1 | -1) => {
    setActiveCo2Ppm(prev => Math.max(300, Math.min(4000, prev + sign * co2Interval)));
  };

  const stepSeaLevel = (sign: 1 | -1) => {
    setActiveSeaLevelM(prev => Math.max(-50, Math.min(300, prev + sign * seaLevelInterval)));
  };

  const stepElevation = (sign: 1 | -1) => {
    setActiveElevationM(prev => Math.max(0, Math.min(2500, prev + sign * elevationInterval)));
  };

  const resetToBaseline = () => {
    setActiveTempC(baselineClimate.meanTempC ?? 22.0);
    setActiveCo2Ppm(baselineClimate.co2Ppm ?? 1500);
    setActiveSeaLevelM(baselineClimate.seaLevelAnomalyM ?? 100);
    setActiveElevationM(120);
    setActiveHumidity(baselineClimate.humidityIndex ?? 'Humid');
    setActiveBiome(initialBiome);
    setExpandedBiomeId(initialBiome.id);
    setSelectedPlant(null);
    setIsPlayingEpochSweep(false);
    setSimulationToast(`Restored ${siteName || 'Locality'} Baseline (${initialBiome.name})`);
    setTimeout(() => setSimulationToast(null), 3000);
  };

  // Full Interactive Simulation of a selected Biome
  const handleSimulateBiome = (biome: PaleoBiome) => {
    setActiveBiome(biome);
    setExpandedBiomeId(biome.id);
    setActiveTempC(biome.typicalTempC);
    setActiveCo2Ppm(biome.typicalCo2Ppm);
    setActiveSeaLevelM(biome.typicalSeaLevelM);
    setActiveHumidity(biome.humidityIndex);
    
    // Automatically synchronize elevation based on selected biome type!
    let targetElev = 120; // default
    if (biome.category === 'Wetland & Coastal') targetElev = 15;
    else if (biome.category === 'Floodplain & Lowland') targetElev = 120;
    else if (biome.category === 'Savanna & Prairie') targetElev = 450;
    else if (biome.category === 'Arid & Desert') targetElev = 320;
    else if (biome.category === 'Polar & Boreal') targetElev = 1150;
    setActiveElevationM(targetElev);

    setSelectedPlant(biome.floraStratum.canopy[0] || null);
    onSelectBiome?.(biome.id);
    setSimulationToast(`Simulating ${biome.name} • ${biome.typicalTempC}°C • Alt: ${targetElev}m ASL`);
    setTimeout(() => setSimulationToast(null), 3500);
  };

  // Quick Adopt Temperature Preset
  const handleAdoptTempPreset = (tempVal: number, biomeName: string) => {
    setActiveTempC(tempVal);
    setSimulationToast(`Applied ${biomeName} Temperature: ${tempVal}°C`);
    setTimeout(() => setSimulationToast(null), 2500);
  };

  // Quick Adopt Terrain Eco-Zone Preset
  const handleAdoptTerrainPreset = (preset: { name: string; altM: number; tempC: number; seaM: number; biomeKey: string }) => {
    setActiveElevationM(preset.altM);
    setActiveTempC(preset.tempC);
    setActiveSeaLevelM(preset.seaM);
    const targetBiome = PALEO_BIOMES.find(b => b.id.includes(preset.biomeKey) || b.name.toLowerCase().includes(preset.biomeKey)) || activeBiome;
    setActiveBiome(targetBiome);
    setExpandedBiomeId(targetBiome.id);
    setSimulationToast(`Calibrated Terrain & Biome: ${preset.name} (${preset.altM}m ASL)`);
    setTimeout(() => setSimulationToast(null), 3000);
  };

  // Convert temperature to Kelvin safely & calculate altitude lapse rate
  const tempKelvin = (activeTempC + 273.15).toFixed(1);
  const modernDeltaC = (activeTempC - 15.0).toFixed(1);
  const co2Multiple = (activeCo2Ppm / 420).toFixed(1);
  const dynamicPrecipitation = Math.round(activeTempC * 54 + (activeCo2Ppm * 0.15));
  
  // Adiabatic Lapse Rate Temperature: -6.5°C per 1,000m elevation
  const lapseAdjustedTempC = Math.max(0, Math.round((activeTempC - (activeElevationM / 1000) * 6.5) * 10) / 10);
  // Orographic precipitation enhancement
  const orographicPrecipitationMm = Math.round(dynamicPrecipitation * (1 + (activeElevationM / 2500) * 0.40));

  // Filtered biomes
  const filteredBiomes = useMemo(() => {
    if (biomeFilter === 'all') return PALEO_BIOMES;
    return PALEO_BIOMES.filter(b => b.category === biomeFilter);
  }, [biomeFilter]);

  const isSimulatingDifferentBiome = activeBiome.id !== initialBiome.id;

  // Active Biome Card Element: Richly detailed card rendered inside the Left Column of the Rock Strata Layout
  const activeBiomeCardElement = activeBiome ? (
    <div 
      className="p-4 rounded-2xl border bg-gradient-to-br from-white via-emerald-50/30 to-park-sand/40 shadow-md space-y-3 relative overflow-hidden transition-all text-park-ink"
      style={{ borderColor: activeBiome.fillHex }}
    >
      {/* Top Bar: Active Indicator, Name, Köppen Code & Master Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-park-card-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span 
            className="w-4 h-4 rounded-full shrink-0 shadow-xs" 
            style={{ backgroundColor: activeBiome.fillHex }} 
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h5 className="text-sm font-rounded font-black text-park-tree leading-tight">
                {activeBiome.name}
              </h5>
              <span 
                className="text-[8.5px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider text-white flex items-center gap-1 shadow-2xs whitespace-nowrap"
                style={{ backgroundColor: activeBiome.color }}
              >
                <Check size={10} strokeWidth={3} />
                <span>Active Top Biome</span>
              </span>
            </div>
            <span className="text-[10px] font-rounded text-park-ink-muted font-medium block mt-0.5">
              {activeBiome.category} • Köppen: {activeBiome.koppenEquivalent}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAdoptTempPreset(activeBiome.typicalTempC, activeBiome.name)}
            className="px-3 py-1 rounded-xl bg-park-tree text-white hover:bg-park-tree-dark text-[10px] font-rounded font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles size={12} className="text-amber-300" />
            <span>Adopt {activeBiome.typicalTempC}°C Climate Matrix</span>
          </button>
        </div>
      </div>

      {/* Description & Characteristics */}
      <p className="text-[11px] font-rounded text-park-ink leading-relaxed">
        {activeBiome.characteristics}
      </p>

      {/* Key Metrics Quick Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
        <div className="p-2 bg-white/90 rounded-xl border border-park-card-border/60 flex flex-col justify-between">
          <span className="text-[8.5px] font-rounded text-park-ink-muted uppercase">Temp Range</span>
          <span className="font-bold text-rose-900 text-[11px]">{activeBiome.tempRangeC}</span>
        </div>

        <div className="p-2 bg-white/90 rounded-xl border border-park-card-border/60 flex flex-col justify-between">
          <span className="text-[8.5px] font-rounded text-park-ink-muted uppercase">Annual Rainfall</span>
          <span className="font-bold text-emerald-900 text-[11px]">{activeBiome.annualRainfallMm}</span>
        </div>

        <div className="p-2 bg-white/90 rounded-xl border border-park-card-border/60 flex flex-col justify-between">
          <span className="text-[8.5px] font-rounded text-park-ink-muted uppercase">Typical pCO₂</span>
          <span className="font-bold text-amber-900 text-[11px]">{activeBiome.typicalCo2Ppm} ppm</span>
        </div>

        <div className="p-2 bg-white/90 rounded-xl border border-park-card-border/60 flex flex-col justify-between">
          <span className="text-[8.5px] font-rounded text-park-ink-muted uppercase">Sea Level Anomaly</span>
          <span className="font-bold text-sky-900 text-[11px]">+{activeBiome.typicalSeaLevelM}m</span>
        </div>
      </div>

      {/* FULL VERTICAL FLORA STRATUM IN TOP ACTIVE PANEL */}
      <div className="space-y-2 bg-white/80 p-3 rounded-xl border border-park-card-border/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-emerald-700" />
            <span className="text-[10.5px] font-rounded font-extrabold text-park-tree uppercase">
              Vertical Flora Stratification & Paleobotany
            </span>
          </div>
          <span className="text-[9px] font-rounded text-park-ink-muted">
            Click plant to inspect browse significance
          </span>
        </div>

        {/* Stratum 1: Canopy Layer */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[9px] font-rounded font-bold text-park-tree">
            <TreePine size={11} className="text-emerald-700" />
            <span>High Canopy & Emergent Crown (15m – 45m)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeBiome.floraStratum.canopy.map((p, idx) => {
              const isPlantSelected = selectedPlant?.name === p.name;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedPlant(isPlantSelected ? null : p)}
                  className={`px-2.5 py-1 rounded-lg text-[9.5px] font-rounded transition-all cursor-pointer flex items-center gap-1 ${
                    isPlantSelected
                      ? 'bg-emerald-700 text-white font-bold shadow-xs'
                      : 'bg-white hover:bg-emerald-50 text-emerald-950 border border-emerald-200'
                  }`}
                >
                  <span>{p.name}</span>
                  <span className="text-[8px] opacity-75 font-mono">({p.height})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stratum 2: Understory Layer */}
        <div className="space-y-1 pt-1.5 border-t border-park-card-border/40">
          <div className="flex items-center gap-1 text-[9px] font-rounded font-bold text-park-tree">
            <Flower2 size={11} className="text-amber-700" />
            <span>Sub-Canopy & Understory Shrubs (2m – 10m)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeBiome.floraStratum.understory.map((p, idx) => {
              const isPlantSelected = selectedPlant?.name === p.name;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedPlant(isPlantSelected ? null : p)}
                  className={`px-2.5 py-1 rounded-lg text-[9.5px] font-rounded transition-all cursor-pointer flex items-center gap-1 ${
                    isPlantSelected
                      ? 'bg-amber-700 text-white font-bold shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-amber-950 border border-amber-200'
                  }`}
                >
                  <span>{p.name}</span>
                  <span className="text-[8px] opacity-75 font-mono">({p.height})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stratum 3: Ground Layer */}
        <div className="space-y-1 pt-1.5 border-t border-park-card-border/40">
          <div className="flex items-center gap-1 text-[9px] font-rounded font-bold text-park-tree">
            <Leaf size={11} className="text-lime-700" />
            <span>Ground Layer, Fern Spikes & Wetlands (0.2m – 1.5m)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeBiome.floraStratum.ground.map((p, idx) => {
              const isPlantSelected = selectedPlant?.name === p.name;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedPlant(isPlantSelected ? null : p)}
                  className={`px-2.5 py-1 rounded-lg text-[9.5px] font-rounded transition-all cursor-pointer flex items-center gap-1 ${
                    isPlantSelected
                      ? 'bg-lime-800 text-white font-bold shadow-xs'
                      : 'bg-white hover:bg-lime-50 text-lime-950 border border-lime-200'
                  }`}
                >
                  <span>{p.name}</span>
                  <span className="text-[8px] opacity-75 font-mono">({p.height})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inspected Plant Detail Card */}
        {selectedPlant && (
          <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-300 shadow-2xs space-y-1.5 animate-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <h6 className="text-[11px] font-rounded font-extrabold text-emerald-950">
                  {selectedPlant.name}
                </h6>
                <span className="text-[9px] font-mono italic text-emerald-700">
                  ({selectedPlant.scientific})
                </span>
              </div>
              <button 
                onClick={() => setSelectedPlant(null)}
                className="text-emerald-800 hover:text-emerald-950 text-[10px] font-bold p-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[9.5px] font-rounded text-emerald-900 leading-relaxed">
              {selectedPlant.paleoNote}
            </p>
            <div className="text-[9px] font-rounded font-bold text-emerald-800 bg-emerald-100/70 p-1.5 rounded-lg flex items-center gap-1">
              <span className="uppercase text-[8px] bg-emerald-800 text-white px-1 py-0.2 rounded shrink-0">Herbivory</span>
              <span>{selectedPlant.browseSignificance}</span>
            </div>
          </div>
        )}
      </div>

      {/* Associated Taxa Quick Switcher Links */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-[9px] pt-1">
        <span className="font-bold text-park-tree uppercase">Known Fossils in this Biome:</span>
        <div className="flex flex-wrap gap-1">
          {activeBiome.associatedTaxa.map((dino, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectTaxon?.(dino);
                setSimulationToast(`Switching active taxon to ${dino}...`);
                setTimeout(() => setSimulationToast(null), 2500);
              }}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-park-tree hover:text-white text-park-tree border border-park-card-border font-rounded font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <span>🦖 {dino}</span>
              <ExternalLink size={9} className="opacity-60" />
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="bg-white rounded-2xl border border-park-card-border p-3.5 sm:p-4 shadow-xs space-y-3.5 text-park-ink">
      {/* UNIFIED SINGLE MASTER HEADER (Sub-View Tabs + Live Metrics + Reset + Collapsible Toggle) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-park-card-border pb-3 select-none">
        {/* Title & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-500/30 flex items-center justify-center text-amber-800 shadow-2xs shrink-0">
            <Thermometer size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-rounded font-extrabold text-park-accent-green uppercase tracking-wider">
                Paleoenvironment & Atmosphere
              </span>
              {isSimulatingDifferentBiome && (
                <span className="text-[9px] font-mono font-bold bg-amber-500 text-white px-1.5 py-0.2 rounded-md uppercase">
                  Simulated
                </span>
              )}
            </div>
            <h4 className="text-[13.5px] font-rounded font-extrabold text-park-tree leading-snug">
              Climate & Terrain Biome Matrix Studio
            </h4>
          </div>
        </div>

        {/* Sub-View Mode Tabs */}
        <div className="flex items-center gap-1 bg-[#faf8f2] p-0.5 rounded-lg border border-park-card-border shadow-3xs">
          {[
            { id: 'all', label: 'All-in-One', icon: LayoutGrid },
            { id: 'climate', label: 'Climate & Sliders', icon: Thermometer },
            { id: 'strata', label: 'Rock Strata', icon: Layers },
            { id: 'biomes', label: 'Biomes & Flora', icon: Leaf }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subViewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubViewMode(tab.id as any)}
                className={`px-2 py-1 rounded-md transition-all font-bold text-[9.5px] flex items-center gap-1 cursor-pointer ${
                  isActive 
                    ? 'bg-park-tree text-white shadow-2xs' 
                    : 'text-park-ink-muted hover:text-park-tree hover:bg-white'
                }`}
              >
                <Icon size={11} className={isActive ? 'text-amber-300' : 'text-park-tree/70'} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Live Synchronized HUD Indicators */}
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-park-tree flex-wrap">
          <span className="bg-[#faf8f2] px-1.5 py-0.5 rounded border border-park-card-border font-bold">
            📅 {exactAgeMa} Ma
          </span>
          <span className="bg-[#faf8f2] px-1.5 py-0.5 rounded border border-park-card-border font-bold text-rose-700">
            🌡️ {activeTempC}°C
          </span>
          <span className="bg-[#faf8f2] px-1.5 py-0.5 rounded border border-park-card-border font-bold text-amber-700">
            💨 {activeCo2Ppm} ppm
          </span>
          <span className="bg-[#faf8f2] px-1.5 py-0.5 rounded border border-park-card-border font-bold text-sky-700">
            🌊 {activeSeaLevelM >= 0 ? `+${activeSeaLevelM}` : activeSeaLevelM}m
          </span>
          <span className="bg-[#faf8f2] px-1.5 py-0.5 rounded border border-park-card-border font-bold text-emerald-800">
            ⛰️ {activeElevationM}m
          </span>
        </div>

        {/* Master Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={resetToBaseline}
            className={`px-2 py-1 rounded-lg text-[9.5px] font-rounded font-bold transition-all flex items-center gap-1 cursor-pointer shadow-3xs active:scale-95 ${
              isSimulatingDifferentBiome 
                ? 'bg-amber-500 text-white hover:bg-amber-600 border border-amber-600' 
                : 'bg-white text-park-ink-muted hover:text-park-tree hover:bg-park-card-muted/60 border border-park-card-border'
            }`}
            title="Reset to Fossil Locality Baseline"
          >
            <RotateCcw size={11} className={isSimulatingDifferentBiome ? 'animate-spin-slow' : ''} />
            <span>Reset</span>
          </button>

          <button
            onClick={() => setIsClimatePanelCollapsed(prev => !prev)}
            className="px-2 py-1 rounded-lg bg-white hover:bg-park-sand/50 text-park-ink-muted hover:text-park-tree border border-park-card-border text-[9.5px] font-rounded font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-3xs"
            title={isClimatePanelCollapsed ? "Expand Climate Matrix" : "Collapse Climate Matrix"}
          >
            <span>{isClimatePanelCollapsed ? 'Expand Studio' : 'Collapse Studio'}</span>
            {isClimatePanelCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* Dynamic Simulation Toast Notification */}
      {simulationToast && (
        <div className="animate-in bg-park-tree text-white px-3 py-1.5 rounded-xl text-[10.5px] font-rounded font-semibold flex items-center justify-between shadow-xs border border-park-tree-dark">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-300 shrink-0" />
            <span>{simulationToast}</span>
          </div>
          <button 
            onClick={() => setSimulationToast(null)}
            className="text-white/70 hover:text-white text-[10px] font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Biome Comparison Alert when Testing Other Environments */}
      {isSimulatingDifferentBiome && (
        <div className="p-2.5 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-xl border border-amber-200/80 text-[10.5px] font-rounded text-amber-950 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activeBiome.color }} />
            <div>
              <span className="font-bold">Simulating Biome: </span>
              <span className="underline decoration-dotted font-extrabold">{activeBiome.name}</span>
              <span className="text-park-ink-muted ml-1.5">
                (Locality Baseline: {initialBiome.name})
              </span>
            </div>
          </div>
          <button
            onClick={resetToBaseline}
            className="px-2 py-0.5 bg-white rounded-md border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition-colors text-[9px] flex items-center gap-1 shadow-2xs"
          >
            <RotateCcw size={10} />
            <span>Restore Specimen Baseline</span>
          </button>
        </div>
      )}

      {/* Merged Expandable Content Area */}
      {!isClimatePanelCollapsed && (subViewMode === 'all' || subViewMode === 'climate') && (
        <div className="space-y-3.5 pt-1 animate-in">
              {/* Side-by-Side Module Layout: Mesozoic Temporal Climate Curve + Interactive Atmospheric Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch min-w-0">
        
        {/* Temporal Climate Curve Graph (Left Column) */}
        <div className="bg-park-card-muted/60 p-2.5 rounded-xl border border-park-card-border space-y-1.5 flex flex-col justify-between overflow-auto custom-scrollbar min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <span className="text-[10px] font-rounded font-extrabold text-park-tree uppercase shrink-0">
              Mesozoic Temporal Climate Curve
            </span>

            {/* Clearly Named & Scrollable Metric Tabs */}
            <div className="min-w-0 flex-1 sm:max-w-xs">
              <ScrollableTabGroup
                items={CLIMATE_METRIC_TABS}
                activeId={activeMetric}
                onSelect={(id) => setActiveMetric(id)}
                variant="metric"
                ariaLabel="Select Climate Curve Metric"
              />
            </div>
          </div>

          {/* Dynamic Interactive SVG Sparkline Graph with Drag & Click Seek */}
          <div className="relative w-full h-32 bg-white rounded-lg border border-park-card-border p-2 flex flex-col justify-between select-none">
            <svg 
              className="w-full h-24 overflow-visible cursor-pointer" 
              viewBox="0 0 400 70"
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, (clickX - 20) / 360));
                const newAge = Math.round(250 - ratio * (250 - 66));
                onSelectTimePoint?.(newAge);
                const closest = MESOZOIC_CLIMATE_CURVE.reduce((prev, curr) => 
                  Math.abs(curr.ageMa - newAge) < Math.abs(prev.ageMa - newAge) ? curr : prev
                );
                setActiveTempC(closest.meanTempC);
                setActiveCo2Ppm(closest.co2Ppm);
                setActiveSeaLevelM(closest.seaLevelM);
              }}
            >
              {/* Grid lines */}
              <line x1="0" y1="15" x2="400" y2="15" stroke="#f0ece1" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="0" y1="35" x2="400" y2="35" stroke="#f0ece1" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="0" y1="55" x2="400" y2="55" stroke="#f0ece1" strokeWidth="1" strokeDasharray="3,3" />

              {/* Compute path based on metric */}
              {(() => {
                const points = MESOZOIC_CLIMATE_CURVE.map(pt => {
                  const x = 20 + ((250 - pt.ageMa) / (250 - 66)) * 360;
                  let y = 35;

                  if (activeMetric === 'temp') {
                    y = 65 - ((pt.meanTempC - 18) / (30 - 18)) * 55;
                  } else if (activeMetric === 'co2') {
                    y = 65 - ((pt.co2Ppm - 1000) / (2500 - 1000)) * 55;
                  } else if (activeMetric === 'o2') {
                    y = 65 - ((pt.oxygenPercent - 14) / (32 - 14)) * 55;
                  } else if (activeMetric === 'precipitation') {
                    y = 65 - (((pt.meanTempC * 60) - 800) / (2000 - 800)) * 55;
                  } else {
                    y = 65 - ((pt.seaLevelM - 0) / (250 - 0)) * 55;
                  }
                  return { x, y, pt };
                });

                const d = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                const strokeColor = activeMetric === 'temp' ? '#f43f5e' : activeMetric === 'co2' ? '#f59e0b' : activeMetric === 'o2' ? '#0284c7' : activeMetric === 'precipitation' ? '#10b981' : '#0284c7';
                const fillColor = activeMetric === 'temp' ? '#ffe4e6' : activeMetric === 'co2' ? '#fef3c7' : activeMetric === 'o2' ? '#e0f2fe' : activeMetric === 'precipitation' ? '#d1fae5' : '#e0f2fe';

                const areaD = `${d} L ${points[points.length - 1].x} 68 L ${points[0].x} 68 Z`;

                return (
                  <>
                    <path d={areaD} fill={fillColor} opacity="0.4" />
                    <path d={d} fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {points.map((p, i) => {
                      const isPtActive = Math.abs(exactAgeMa - p.pt.ageMa) < 12;
                      return (
                        <g 
                          key={i} 
                          className="cursor-pointer" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTimePoint?.(p.pt.ageMa);
                            setActiveTempC(p.pt.meanTempC);
                            setActiveCo2Ppm(p.pt.co2Ppm);
                            setActiveSeaLevelM(p.pt.seaLevelM);
                            setSimulationToast(`Selected Age: ${p.pt.ageMa} Ma (${p.pt.period})`);
                            setTimeout(() => setSimulationToast(null), 2500);
                          }}
                        >
                          <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
                          <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r={isPtActive ? 5.5 : 3.5} 
                            fill={isPtActive ? strokeColor : "#ffffff"} 
                            stroke={strokeColor} 
                            strokeWidth={isPtActive ? 2.5 : 2} 
                          />
                          <text x={p.x} y="68" textAnchor="middle" fontSize="6.5" fill={isPtActive ? "#1f3835" : "#6b7280"} fontWeight={isPtActive ? "bold" : "normal"} fontFamily="monospace">
                            {p.pt.ageMa}Ma
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}

              {/* Interactive Perforated Red Marker Line & Thumb */}
              {(() => {
                const markerX = 20 + ((250 - exactAgeMa) / (250 - 66)) * 360;
                if (markerX < 0 || markerX > 400) return null;
                return (
                  <g className="cursor-ew-resize">
                    {/* Perforated Red Vertical Dashed Line */}
                    <line x1={markerX} y1="0" x2={markerX} y2="65" stroke="#e11d48" strokeWidth="2" strokeDasharray="3,2" />
                    {/* Draggable Red Thumb / Button */}
                    <circle cx={markerX} cy="30" r="7" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" className="shadow-md animate-pulse" />
                    <rect x={markerX - 26} y="0" width="52" height="13" rx="3" fill="#881337" stroke="#f43f5e" strokeWidth="0.8" />
                    <text x={markerX} y="8.5" textAnchor="middle" fontSize="6.5" fill="#ffffff" fontWeight="bold" fontFamily="monospace">
                      {exactAgeMa} Ma
                    </text>
                  </g>
                );
              })()}
            </svg>

            {/* Interactive Perforated Red Slider Controller - Synchronized 1:1 with Graph Direction */}
            <div className="pt-1 flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold text-rose-700 uppercase shrink-0">Perforated Age Slider:</span>
              <input 
                type="range"
                min="-250"
                max="-66"
                step="1"
                value={-exactAgeMa}
                onChange={(e) => {
                  const newAge = -Number(e.target.value);
                  onSelectTimePoint?.(newAge);
                  // Find nearest climate point to synchronize workspace
                  const closest = MESOZOIC_CLIMATE_CURVE.reduce((prev, curr) => 
                    Math.abs(curr.ageMa - newAge) < Math.abs(prev.ageMa - newAge) ? curr : prev
                  );
                  setActiveTempC(closest.meanTempC);
                  setActiveCo2Ppm(closest.co2Ppm);
                  setActiveSeaLevelM(closest.seaLevelM);
                }}
                className="flex-1 accent-rose-600 cursor-pointer h-1.5 bg-rose-100 rounded-lg"
              />
              <span className="text-[10px] font-mono font-extrabold text-rose-900 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                {exactAgeMa} Ma
              </span>
            </div>
          </div>
        </div>

        {/* Streamlined Atmospheric Parameter Sliders (Right Column - Independently Scrollable) */}
        <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-3.5 border border-slate-800 space-y-3 shadow-sm flex flex-col justify-between overflow-y-auto custom-scrollbar max-h-[620px] min-w-0">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Sliders size={12} />
                <span>Atmospheric & Terrain Matrix</span>
              </span>
              <p className="text-[8.5px] font-rounded text-slate-400">
                Multi-variable slider simulation with topographic adiabatic coupling
              </p>
            </div>
            
            {/* Auto-Sweep Timeline Simulation Toggle */}
            <button
              onClick={() => setIsPlayingEpochSweep(prev => !prev)}
              className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-3xs ${
                isPlayingEpochSweep 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Auto-sweep timeline across Triassic, Jurassic & Cretaceous"
            >
              {isPlayingEpochSweep ? <Pause size={10} /> : <Play size={10} />}
              <span>{isPlayingEpochSweep ? 'Sweeping...' : 'Auto Sweep'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Parameter 1: Surface Temperature */}
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                <span className="text-rose-400 flex items-center gap-1">
                  <Thermometer size={11} />
                  <span>Surface Temp</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {/* Step Interval Pills */}
                  <div className="flex items-center gap-0.5 text-[8px] font-mono">
                    {[0.5, 1.0, 2.5, 5.0].map((stepVal) => (
                      <button
                        key={stepVal}
                        onClick={() => setTempInterval(stepVal)}
                        className={`px-1 py-0.2 rounded ${
                          tempInterval === stepVal 
                            ? 'bg-rose-500 text-white font-bold' 
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ±{stepVal}°
                      </button>
                    ))}
                  </div>
                  <span className="text-white font-mono text-xs font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {activeTempC}°C
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => stepTemp(-1)}
                  disabled={activeTempC <= 5}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                  title={`Decrease Temp by ${tempInterval}°C`}
                >
                  <Minus size={10} />
                </button>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step={tempInterval}
                  value={activeTempC}
                  onChange={(e) => setActiveTempC(Number(e.target.value))}
                  className="flex-1 accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <button
                  onClick={() => stepTemp(1)}
                  disabled={activeTempC >= 45}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                  title={`Increase Temp by ${tempInterval}°C`}
                >
                  <Plus size={10} />
                </button>
              </div>
            </div>

            {/* Parameter 2: Atmospheric pCO₂ */}
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                <span className="text-amber-400 flex items-center gap-1">
                  <Wind size={11} />
                  <span>Atmospheric pCO₂</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 text-[8px] font-mono">
                    {[50, 100, 250, 500].map((stepVal) => (
                      <button
                        key={stepVal}
                        onClick={() => setCo2Interval(stepVal)}
                        className={`px-1 py-0.2 rounded ${
                          co2Interval === stepVal 
                            ? 'bg-amber-500 text-white font-bold' 
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ±{stepVal}
                      </button>
                    ))}
                  </div>
                  <span className="text-white font-mono text-xs font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {activeCo2Ppm} ppm
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => stepCo2(-1)}
                  disabled={activeCo2Ppm <= 300}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                >
                  <Minus size={10} />
                </button>
                <input
                  type="range"
                  min="300"
                  max="3500"
                  step={co2Interval}
                  value={activeCo2Ppm}
                  onChange={(e) => setActiveCo2Ppm(Number(e.target.value))}
                  className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <button
                  onClick={() => stepCo2(1)}
                  disabled={activeCo2Ppm >= 3500}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                >
                  <Plus size={10} />
                </button>
              </div>
            </div>

            {/* Parameter 3: Eustatic Sea Level Anomaly */}
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                <span className="text-sky-400 flex items-center gap-1">
                  <Waves size={11} />
                  <span>Sea Level Anomaly</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 text-[8px] font-mono">
                    {[10, 25, 50].map((stepVal) => (
                      <button
                        key={stepVal}
                        onClick={() => setSeaLevelInterval(stepVal)}
                        className={`px-1 py-0.2 rounded ${
                          seaLevelInterval === stepVal 
                            ? 'bg-sky-500 text-white font-bold' 
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ±{stepVal}m
                      </button>
                    ))}
                  </div>
                  <span className="text-white font-mono text-xs font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {activeSeaLevelM >= 0 ? `+${activeSeaLevelM}` : activeSeaLevelM} m
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => stepSeaLevel(-1)}
                  disabled={activeSeaLevelM <= -50}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                >
                  <Minus size={10} />
                </button>
                <input
                  type="range"
                  min="-50"
                  max="300"
                  step={seaLevelInterval}
                  value={activeSeaLevelM}
                  onChange={(e) => setActiveSeaLevelM(Number(e.target.value))}
                  className="flex-1 accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <button
                  onClick={() => stepSeaLevel(1)}
                  disabled={activeSeaLevelM >= 300}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                >
                  <Plus size={10} />
                </button>
              </div>
            </div>

            {/* Parameter 4: Topographic Relief & Terrain Altitude (Cross-Coupled with Biome) */}
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-rounded font-bold">
                <span className="text-emerald-400 flex items-center gap-1">
                  <Mountain size={11} />
                  <span>Terrain Altitude & Relief</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 text-[8px] font-mono">
                    {[25, 50, 100, 250].map((stepVal) => (
                      <button
                        key={stepVal}
                        onClick={() => setElevationInterval(stepVal)}
                        className={`px-1 py-0.2 rounded ${
                          elevationInterval === stepVal 
                            ? 'bg-emerald-500 text-white font-bold' 
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ±{stepVal}m
                      </button>
                    ))}
                  </div>
                  <span className="text-white font-mono text-xs font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {activeElevationM} m ASL
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => stepElevation(-1)}
                  disabled={activeElevationM <= 0}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                >
                  <Minus size={10} />
                </button>
                <input
                  type="range"
                  min="0"
                  max="2500"
                  step={elevationInterval}
                  value={activeElevationM}
                  onChange={(e) => setActiveElevationM(Number(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <button
                  onClick={() => stepElevation(1)}
                  disabled={activeElevationM >= 2500}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-white shrink-0 cursor-pointer"
                >
                  <Plus size={10} />
                </button>
              </div>

              {/* Real-time Adiabatic Lapse Rate & Orographic Feedback */}
              <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 pt-0.5">
                <span>Lapse Temp: <strong className="text-rose-300">{lapseAdjustedTempC}°C</strong> (-6.5°/km)</span>
                <span>Orographic Rain: <strong className="text-emerald-300">{orographicPrecipitationMm} mm/yr</strong></span>
              </div>
            </div>

            {/* Quick 1-Click Biome-Terrain Calibration Presets */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <span className="text-[9px] font-mono text-amber-300/90 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={10} />
                <span>1-Click Paleo-Terrain Eco-Presets</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { name: 'Coastal Delta', altM: 15, tempC: 24, seaM: 120, biomeKey: 'coastal' },
                  { name: 'Floodplain Basin', altM: 120, tempC: 22, seaM: 80, biomeKey: 'floodplain' },
                  { name: 'Savanna Plateau', altM: 450, tempC: 26, seaM: 50, biomeKey: 'savanna' },
                  { name: 'Conifer Uplands', altM: 1150, tempC: 14, seaM: 20, biomeKey: 'polar' },
                  { name: 'Inland Dunefield', altM: 320, tempC: 32, seaM: 30, biomeKey: 'desert' }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleAdoptTerrainPreset(preset)}
                    className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 hover:border-amber-400/50 border border-slate-700/80 text-left transition-all text-[9px] font-rounded cursor-pointer flex flex-col justify-between group"
                  >
                    <span className="font-bold text-slate-200 group-hover:text-amber-300 truncate">{preset.name}</span>
                    <span className="text-[8px] font-mono text-slate-400">{preset.altM}m • {preset.tempC}°C</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Climate Variables KPI Grid (Interactive Clickable Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* 1. Global Mean Temp & Anomaly */}
        <button 
          onClick={() => setActiveMetric('temp')}
          className={`p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
            activeMetric === 'temp'
              ? 'bg-rose-100/90 border-rose-400 ring-2 ring-rose-400/40 shadow-xs'
              : 'bg-gradient-to-br from-rose-50 to-white border-rose-100 hover:border-rose-300'
          }`}
          title="Click to inspect Temperature Curve"
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[9px] font-rounded font-bold uppercase">Surface & Altitude Temp</span>
            <Thermometer size={13} />
          </div>
          <div className="text-base font-mono font-extrabold text-rose-950">
            {activeTempC}°C
          </div>
          <div className="text-[9px] font-mono text-rose-700 flex items-center justify-between mt-0.5">
            <span>+{modernDeltaC}°C (Mod)</span>
            <span className="font-bold text-rose-900">{lapseAdjustedTempC}°C @ {activeElevationM}m</span>
          </div>
        </button>

        {/* 2. Atmospheric CO2 Concentration */}
        <button 
          onClick={() => setActiveMetric('co2')}
          className={`p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
            activeMetric === 'co2'
              ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-gradient-to-br from-amber-50 to-white border-amber-100 hover:border-amber-300'
          }`}
          title="Click to inspect CO2 Curve"
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[9px] font-rounded font-bold uppercase">Atmospheric pCO₂</span>
            <Wind size={13} />
          </div>
          <div className="text-base font-mono font-extrabold text-amber-950">
            {activeCo2Ppm} ppm
          </div>
          <div className="text-[9px] font-rounded text-amber-700 mt-0.5">
            {co2Multiple}× Modern Baseline
          </div>
        </button>

        {/* 3. Atmospheric Oxygen (O2 %) & Sea Level */}
        <button 
          onClick={() => setActiveMetric('sealevel')}
          className={`p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
            activeMetric === 'sealevel'
              ? 'bg-sky-100/90 border-sky-400 ring-2 ring-sky-400/40 shadow-xs'
              : 'bg-gradient-to-br from-sky-50 to-white border-sky-100 hover:border-sky-300'
          }`}
          title="Click to inspect Sea Level Curve"
        >
          <div className="flex items-center justify-between text-sky-700 mb-1">
            <span className="text-[9px] font-rounded font-bold uppercase">Sea Level Anomaly</span>
            <Waves size={13} />
          </div>
          <div className="text-base font-mono font-extrabold text-sky-950">
            {activeSeaLevelM >= 0 ? `+${activeSeaLevelM}` : activeSeaLevelM} m
          </div>
          <div className="text-[9px] font-rounded text-sky-700 mt-0.5">
            {baselineClimate.oxygenPercent}% O₂ ratio
          </div>
        </button>

        {/* 4. Paleo-Precipitation & Orographic Humidity */}
        <button 
          onClick={() => setActiveMetric('precipitation')}
          className={`p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
            activeMetric === 'precipitation'
              ? 'bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:border-emerald-300'
          }`}
          title="Click to inspect Precipitation Curve"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[9px] font-rounded font-bold uppercase">Precipitation Index</span>
            <CloudRain size={13} />
          </div>
          <div className="text-base font-mono font-extrabold text-emerald-950">
            {orographicPrecipitationMm} mm/yr
          </div>
          <div className="text-[9px] font-rounded text-emerald-700 font-bold mt-0.5">
            {activeHumidity} • {activeElevationM > 500 ? 'Orographic' : 'Lowland'}
          </div>
        </button>
      </div>
    </div>
    )}

    {/* FEATURE: LITHOSTRATIGRAPHIC ROCK COLUMN & ROCK TYPES GRAPHIC */}
    {(subViewMode === 'all' || subViewMode === 'strata') && (
      <div className="pt-1 animate-in">
        <RockStrataLithologyColumn
          currentBurialDepthM={activeElevationM > 200 ? 75 : 45}
          currentElevationM={activeElevationM}
          siteName={siteName}
          formationName={periodName ? `${periodName} Horizon` : 'Hell Creek / Morrison Formation'}
          collapsible={true}
          isPlaying={isPlayingEpochSweep}
          onTogglePlay={() => setIsPlayingEpochSweep(prev => !prev)}
          onElevationChange={(elev) => setActiveElevationM(elev)}
          activeBiomeCard={activeBiomeCardElement}
        />
      </div>
    )}

    {/* FEATURE: INTERACTIVE GLOBAL SPATIAL PALEO-BIOMES & FLORA STRATUM */}
    {(subViewMode === 'all' || subViewMode === 'biomes') && (
      <div className="bg-white rounded-2xl border border-park-card-border p-3.5 space-y-3 pt-1 animate-in">
        {/* Section Header with Stats & Collapsible Toggle */}
        <div 
          onClick={() => setIsBiomesCollapsed(prev => !prev)}
          className="flex items-center justify-between gap-2 border-b border-park-card-border pb-2 cursor-pointer select-none hover:bg-park-sand/30 p-1 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-700 shrink-0">
              <Leaf size={14} />
            </div>
            <div>
              <span className="text-[11px] font-rounded font-extrabold text-park-tree uppercase flex items-center gap-1.5">
                <span>Global Spatial Paleo-Biomes & Flora Stratum</span>
              </span>
              <p className="text-[9.5px] font-rounded text-park-ink-muted leading-tight">
                Simulate atmospheric parameters, inspect vertical flora stratification & browse paleobotany
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Minimal Synchronized Play/Pause Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPlayingEpochSweep(prev => !prev);
              }}
              className={`px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer shadow-3xs active:scale-95 ${
                isPlayingEpochSweep 
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-1 ring-emerald-400' 
                  : 'bg-white text-park-tree border border-park-card-border hover:bg-park-sand/50'
              }`}
              title={isPlayingEpochSweep ? "Pause Epoch Time-Lapse" : "Play Epoch Time-Lapse"}
            >
              {isPlayingEpochSweep ? <Pause size={11} /> : <Play size={11} />}
              <span>{isPlayingEpochSweep ? 'Lapse Active' : 'Play Lapse'}</span>
            </button>

            <span className="text-[9px] font-mono font-bold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
              {filteredBiomes.length} Biomes
            </span>
            <button
              className="p-1 rounded-lg bg-white text-park-ink-muted hover:text-park-tree border border-park-card-border transition-colors cursor-pointer"
              title={isBiomesCollapsed ? "Expand Biomes" : "Collapse Biomes"}
            >
              {isBiomesCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>
          </div>
        </div>

        {isBiomesCollapsed ? (
          <div 
            onClick={() => setIsBiomesCollapsed(false)}
            className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-200 text-[10.5px] font-mono text-emerald-950 flex items-center justify-between cursor-pointer hover:bg-emerald-100/80 transition-colors"
          >
            <span>🌿 Active Biome: <strong>{activeBiome.name}</strong> ({activeBiome.koppenEquivalent})</span>
            <span className="text-[9.5px] font-rounded font-extrabold text-emerald-800 underline">Click to Expand Biomes Panel ▾</span>
          </div>
        ) : (
          <div className="space-y-3 animate-in">

        {/* Biome Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[9.5px] font-rounded font-bold">
          <span className="text-[9px] text-park-ink-muted uppercase mr-0.5 shrink-0 flex items-center gap-1">
            <Filter size={10} /> Zone:
          </span>
          {[
            { id: 'all', label: 'All Biomes' },
            { id: 'Wetland & Coastal', label: 'Wetlands & Delta' },
            { id: 'Floodplain & Lowland', label: 'Floodplains' },
            { id: 'Savanna & Prairie', label: 'Savannas' },
            { id: 'Arid & Desert', label: 'Deserts & Ergs' },
            { id: 'Polar & Boreal', label: 'Polar Woodlands' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setBiomeFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                biomeFilter === tab.id
                  ? 'bg-park-tree text-white shadow-xs'
                  : 'bg-park-card-muted/80 text-park-ink-muted hover:text-park-tree hover:bg-park-sand/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Full-Width Reflow Grid Catalog for Paleo-Biomes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10.5px] font-rounded font-bold text-park-ink-muted px-0.5 border-b border-park-card-border/60 pb-1.5">
            <span className="uppercase tracking-wider">Paleo-Biomes Catalog (Select any Biome to calibrate the entire workspace)</span>
            <span className="font-mono text-[10px] bg-park-card-muted px-2 py-0.5 rounded border border-park-card-border">{filteredBiomes.length} Biomes Available</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredBiomes.map((b) => {
              const isActive = b.id === activeBiome?.id;
              const totalFloraCount = b.floraStratum.canopy.length + b.floraStratum.understory.length + b.floraStratum.ground.length;

              return (
                <div 
                  key={b.id}
                  onClick={() => handleSimulateBiome(b)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 group relative overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 border-emerald-400 shadow-md ring-2 ring-emerald-400/20' 
                      : 'bg-white border-park-card-border hover:border-park-tree hover:shadow-md'
                  }`}
                >
                  {/* Subtle decorative active corner tag */}
                  {isActive && (
                    <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 text-white flex items-center justify-center rotate-45 translate-x-3.5 -translate-y-3.5 shadow-sm">
                      <Check size={9} strokeWidth={4} />
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-1 pr-4">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 group-hover:scale-110 transition-transform" 
                          style={{ backgroundColor: b.fillHex }} 
                        />
                        <h6 className="text-[11.5px] font-rounded font-extrabold text-park-tree leading-tight truncate">
                          {b.name}
                        </h6>
                      </div>

                      <span className="text-[8.5px] font-mono text-park-ink-muted bg-park-card-muted px-1.5 py-0.2 rounded border border-park-card-border shrink-0">
                        {b.koppenEquivalent.split(' ')[0]}
                      </span>
                    </div>

                    <p className="text-[9.5px] font-rounded text-park-ink-muted leading-snug line-clamp-2">
                      {b.characteristics}
                    </p>
                  </div>

                  {/* Stats & Make Active Button */}
                  <div className="pt-2 border-t border-park-card-border/60 flex items-center justify-between text-[9px] font-mono">
                    <div className="flex items-center gap-1.5 text-park-ink-muted">
                      <span>{b.tempRangeC}</span>
                      <span>•</span>
                      <span>{totalFloraCount} Plants</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulateBiome(b);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[8.5px] font-rounded font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                        isActive
                          ? 'bg-emerald-600 text-white border border-emerald-700'
                          : 'bg-park-card-muted group-hover:bg-park-tree group-hover:text-white text-park-tree border border-park-card-border'
                      }`}
                    >
                      <Sparkles size={9} />
                      <span>{isActive ? 'Active' : 'Make Active'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
  </div>
)}
</div>
);
};

export default ClimateSpatioTemporal;
