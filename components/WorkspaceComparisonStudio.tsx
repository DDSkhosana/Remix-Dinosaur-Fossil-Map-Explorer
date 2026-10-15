import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  X, 
  Columns, 
  Rows, 
  Grid, 
  Maximize2, 
  Minimize2, 
  Lock, 
  Unlock, 
  Move, 
  GripVertical, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  RotateCcw, 
  Globe, 
  Layers, 
  Heart, 
  Bone, 
  Footprints, 
  CloudSun, 
  Mountain, 
  Calendar, 
  Compass, 
  Activity, 
  BookOpen, 
  Sparkles, 
  SlidersHorizontal,
  ChevronsRight,
  ArrowRightLeft,
  Search,
  Check,
  LayoutGrid,
  Dna
} from 'lucide-react';
import { PaleoData, SiteMarker, SpatioTemporalWaypoint } from '../types';
import { DINOSAUR_DB } from '../data/dinosaurData';
import { PlottingLayerConfig } from './PlottingSpecializationLayer';

// Lazy load visualization components
const MapCanvas = React.lazy(() => import('./MapCanvas'));
const GoogleEarthViewer = React.lazy(() => import('./GoogleEarthViewer'));
const ClimateSpatioTemporal = React.lazy(() => import('./ClimateSpatioTemporal'));
const LocomotionVisualizer = React.lazy(() => import('./LocomotionVisualizer'));
const LifeCycleTemporalLapse = React.lazy(() => import('./LifeCycleTemporalLapse'));
const ElevationProfile = React.lazy(() => import('./ElevationProfile'));
const SpecimenBlueprintViewer = React.lazy(() => import('./SpecimenBlueprintViewer'));
const InteractiveOrganSystemViewer = React.lazy(() => import('./InteractiveOrganSystemViewer').then(m => ({ default: m.InteractiveOrganSystemViewer })));
const NeighbouringExcavationRadar = React.lazy(() => import('./NeighbouringExcavationRadar').then(m => ({ default: m.NeighbouringExcavationRadar })));
const EvolutionaryChronologyMap = React.lazy(() => import('./EvolutionaryChronologyMap'));
const AnatomicalSynthesizerBuilder = React.lazy(() => import('./AnatomicalSynthesizerBuilder'));

export type ViewportMode = 
  | 'google_earth' 
  | 'paleo_atlas' 
  | 'organs' 
  | 'blueprint' 
  | 'locomotion' 
  | 'climate' 
  | 'elevation' 
  | 'lifecycle' 
  | 'cardinal' 
  | 'inventory' 
  | 'metrics' 
  | 'evolution'
  | 'builder'
  | 'dossier';

export interface ViewportConfig {
  id: string;
  mode: ViewportMode;
  taxaName: string;
  title: string;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  isCollapsed?: boolean;
  isLocked?: boolean;
  widthRatio?: number; // for split sizing
}

export interface WorkspaceComparisonStudioProps {
  primaryTaxa: string;
  primarySite: PaleoData | null;
  primaryMarkers: SiteMarker[];
  primaryBlueprintImage: string | null;
  primaryImgLoading: boolean;
  plottingConfig: PlottingLayerConfig;
  onUpdatePlottingConfig: (newConfig: Partial<PlottingLayerConfig>) => void;
  isPlottingPanelOpen: boolean;
  onTogglePlottingPanel: () => void;
  selectedArea: string;
  areaNavSignal: { areaId: string; timestamp: number } | null;
  siteNavSignal: { site: SiteMarker; timestamp: number } | null;
  currentIndex: number;
  onPrevSite: () => void;
  onNextSite: () => void;
  onMarkerClick: (site: SiteMarker) => void;
  onSelectTab: (tab: string) => void;
  onCloseComparison: () => void;
  initialSecondaryMode?: ViewportMode;
}

export const MODE_METADATA: Record<ViewportMode, { label: string; icon: React.ElementType; color: string; badge: string; desc: string }> = {
  google_earth: {
    label: 'Google Earth 3D',
    icon: Globe,
    color: 'text-emerald-400',
    badge: '3D Globe',
    desc: 'Photorealistic Google Earth satellite & terrain API'
  },
  paleo_atlas: {
    label: 'Paleo Atlas Map',
    icon: Layers,
    color: 'text-amber-400',
    badge: 'Mesozoic Drift',
    desc: 'Continental drift projection & expedition trails'
  },
  organs: {
    label: 'Organ Systems & Viscera',
    icon: Heart,
    color: 'text-rose-400',
    badge: 'Physiology',
    desc: 'Cardiovascular, parabronchial respiration & visceral circuits'
  },
  blueprint: {
    label: 'Osteology Blueprint',
    icon: Bone,
    color: 'text-cyan-400',
    badge: 'Anatomy',
    desc: 'Scientific specimen skeletal wireframe & biometric scans'
  },
  locomotion: {
    label: 'Locomotion Kinematics',
    icon: Footprints,
    color: 'text-orange-400',
    badge: 'Biomechanics',
    desc: 'Gait cycle, stride length & ground reaction forces'
  },
  climate: {
    label: 'Paleoclimate Matrix',
    icon: CloudSun,
    color: 'text-blue-400',
    badge: 'Atmosphere',
    desc: 'Paleo-temperature, pCO2, rainfall & biome climographs'
  },
  elevation: {
    label: 'Hypsometric Profile',
    icon: Mountain,
    color: 'text-teal-400',
    badge: 'Topography',
    desc: 'Paleo-elevation, taphonomy & cross-sectional terrain'
  },
  lifecycle: {
    label: 'Ontogeny & Life Cycle',
    icon: Calendar,
    color: 'text-purple-400',
    badge: 'Growth Curves',
    desc: 'Hatchling to adult growth rates & LAG histology'
  },
  cardinal: {
    label: 'Excavation Sites Radar',
    icon: Compass,
    color: 'text-amber-300',
    badge: 'Azimuths',
    desc: 'Neighbouring excavation relative bearings & distances'
  },
  inventory: {
    label: 'Fossil Stratum',
    icon: Bone,
    color: 'text-emerald-300',
    badge: 'Specimens',
    desc: 'Excavation inventory, taphonomy & skeletal recovery'
  },
  metrics: {
    label: 'Comparative Metrics',
    icon: Activity,
    color: 'text-indigo-400',
    badge: 'Scoreboard',
    desc: 'Vital statistics & anatomical proportions comparison'
  },
  evolution: {
    label: 'Evolution & Continental Drift',
    icon: Globe,
    color: 'text-amber-400',
    badge: 'Tectonics',
    desc: 'Continental drift map, mass extinctions & dinosaur lineages'
  },
  builder: {
    label: 'Anatomical Synthesizer Builder',
    icon: Dna,
    color: 'text-rose-400',
    badge: 'Builder Atlas',
    desc: 'Gamified organ-system synthesis & biomechanical simulation'
  },
  dossier: {
    label: 'Field Dossier',
    icon: BookOpen,
    color: 'text-amber-200',
    badge: 'Field Guide',
    desc: 'Comprehensive taxonomic synthesis & expedition notes'
  }
};

const ALL_TAXA_NAMES = DINOSAUR_DB.map(d => d.name);

export const WorkspaceComparisonStudio: React.FC<WorkspaceComparisonStudioProps> = ({
  primaryTaxa,
  primarySite,
  primaryMarkers,
  primaryBlueprintImage,
  primaryImgLoading,
  plottingConfig,
  onUpdatePlottingConfig,
  isPlottingPanelOpen,
  onTogglePlottingPanel,
  selectedArea,
  areaNavSignal,
  siteNavSignal,
  currentIndex,
  onPrevSite,
  onNextSite,
  onMarkerClick,
  onSelectTab,
  onCloseComparison,
  initialSecondaryMode = 'organs'
}) => {
  // Viewports state
  const [viewports, setViewports] = useState<ViewportConfig[]>(() => [
    {
      id: 'vp-1',
      mode: 'google_earth',
      taxaName: primaryTaxa,
      title: `${primaryTaxa} • Google Earth 3D`,
      colSpan: 1,
      rowSpan: 1,
      isCollapsed: false,
      isLocked: false
    },
    {
      id: 'vp-2',
      mode: initialSecondaryMode,
      taxaName: primaryTaxa,
      title: `${primaryTaxa} • ${MODE_METADATA[initialSecondaryMode]?.label || 'Module'}`,
      colSpan: 1,
      rowSpan: 1,
      isCollapsed: false,
      isLocked: false
    }
  ]);

  // Layout topology: 'split_horizontal' | 'split_vertical' | 'quad_grid' | 'triple_columns' | 'all_modes'
  const [layoutTopology, setLayoutTopology] = useState<'split_horizontal' | 'split_vertical' | 'quad_grid' | 'triple_columns' | 'all_modes'>('split_horizontal');
  
  // Collapsible Inter-Intention Workbench Drawer State (Defaults to Collapsed)
  const [isWorkbenchCollapsed, setIsWorkbenchCollapsed] = useState<boolean>(true);

  // Custom split proportion (percentage for first column/row)
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [isResizingSplit, setIsResizingSplit] = useState<boolean>(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Drag and drop state for intent setting
  const [draggingMode, setDraggingMode] = useState<ViewportMode | null>(null);
  const [draggedViewportId, setDraggedViewportId] = useState<string | null>(null);
  const [hoverDropTarget, setHoverDropTarget] = useState<string | null>(null);

  // Secondary comparative dinosaur selection for rapid interspecies comparison
  const [secondaryTaxa, setSecondaryTaxa] = useState<string>(() => {
    const nextDino = ALL_TAXA_NAMES.find(n => n !== primaryTaxa) || 'Spinosaurus';
    return nextDino;
  });

  // Keep primary taxa in sync for viewports using primary
  useEffect(() => {
    setViewports(prev => prev.map((vp, idx) => {
      if (idx === 0) {
        return {
          ...vp,
          taxaName: primaryTaxa,
          title: `${primaryTaxa} • ${MODE_METADATA[vp.mode]?.label}`
        };
      }
      return vp;
    }));
  }, [primaryTaxa]);

  // Handle Splitter Dragging (Fluid real-time resizing with zero dead space)
  const handleSplitterPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsResizingSplit(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizingSplit) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      let ratio = 50;
      if (layoutTopology === 'split_horizontal' || layoutTopology === 'triple_columns') {
        const offset = e.clientX - rect.left;
        ratio = (offset / rect.width) * 100;
      } else if (layoutTopology === 'split_vertical') {
        const offset = e.clientY - rect.top;
        ratio = (offset / rect.height) * 100;
      }
      // Clamp between 20% and 80% to avoid crushing viewports
      setSplitRatio(Math.max(20, Math.min(80, ratio)));
    };

    const handlePointerUp = () => {
      setIsResizingSplit(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isResizingSplit, layoutTopology]);

  // Viewport action handlers
  const handleRemoveViewport = useCallback((id: string) => {
    setViewports(prev => {
      const next = prev.filter(vp => vp.id !== id);
      if (next.length === 0) {
        onCloseComparison();
        return prev;
      }
      return next;
    });
  }, [onCloseComparison]);

  const handleToggleCollapse = useCallback((id: string) => {
    setViewports(prev => prev.map(vp => vp.id === id ? { ...vp, isCollapsed: !vp.isCollapsed } : vp));
  }, []);

  const handleToggleLock = useCallback((id: string) => {
    setViewports(prev => prev.map(vp => vp.id === id ? { ...vp, isLocked: !vp.isLocked } : vp));
  }, []);

  const handleToggleSpan = useCallback((id: string) => {
    setViewports(prev => prev.map(vp => {
      if (vp.id === id) {
        const currentCol = vp.colSpan || 1;
        const nextCol = currentCol === 1 ? 2 : 1;
        return { ...vp, colSpan: nextCol as 1 | 2 };
      }
      return vp;
    }));
  }, []);

  const handleChangeMode = useCallback((id: string, newMode: ViewportMode) => {
    setViewports(prev => prev.map(vp => {
      if (vp.id === id) {
        return {
          ...vp,
          mode: newMode,
          title: `${vp.taxaName} • ${MODE_METADATA[newMode]?.label || newMode}`
        };
      }
      return vp;
    }));
  }, []);

  const handleChangeTaxa = useCallback((id: string, newTaxa: string) => {
    setViewports(prev => prev.map(vp => {
      if (vp.id === id) {
        return {
          ...vp,
          taxaName: newTaxa,
          title: `${newTaxa} • ${MODE_METADATA[vp.mode]?.label || vp.mode}`
        };
      }
      return vp;
    }));
  }, []);

  // Quick Preset Intent Selectors
  const applyPresetIntent = (presetType: 'anatomy_kinematics' | 'dual_maps' | 'physiology_climate' | 'interspecies' | 'quad' | 'all_modes') => {
    if (presetType === 'anatomy_kinematics') {
      setLayoutTopology('split_horizontal');
      setSplitRatio(50);
      setViewports([
        { id: 'vp-blueprint', mode: 'blueprint', taxaName: primaryTaxa, title: `${primaryTaxa} • Osteology Blueprint`, colSpan: 1, rowSpan: 1 },
        { id: 'vp-locomotion', mode: 'locomotion', taxaName: primaryTaxa, title: `${primaryTaxa} • Locomotion Kinematics`, colSpan: 1, rowSpan: 1 }
      ]);
    } else if (presetType === 'dual_maps') {
      setLayoutTopology('split_horizontal');
      setSplitRatio(50);
      setViewports([
        { id: 'vp-ge', mode: 'google_earth', taxaName: primaryTaxa, title: `${primaryTaxa} • Google Earth 3D`, colSpan: 1, rowSpan: 1 },
        { id: 'vp-atlas', mode: 'paleo_atlas', taxaName: primaryTaxa, title: `${primaryTaxa} • Paleo Atlas Drift`, colSpan: 1, rowSpan: 1 }
      ]);
    } else if (presetType === 'physiology_climate') {
      setLayoutTopology('split_horizontal');
      setSplitRatio(50);
      setViewports([
        { id: 'vp-organs', mode: 'organs', taxaName: primaryTaxa, title: `${primaryTaxa} • Organ Systems & Viscera`, colSpan: 1, rowSpan: 1 },
        { id: 'vp-climate', mode: 'climate', taxaName: primaryTaxa, title: `${primaryTaxa} • Paleoclimate Matrix`, colSpan: 1, rowSpan: 1 }
      ]);
    } else if (presetType === 'interspecies') {
      setLayoutTopology('split_horizontal');
      setSplitRatio(50);
      setViewports([
        { id: 'vp-dino1', mode: 'blueprint', taxaName: primaryTaxa, title: `${primaryTaxa} (Primary Specimen)`, colSpan: 1, rowSpan: 1 },
        { id: 'vp-dino2', mode: 'blueprint', taxaName: secondaryTaxa, title: `${secondaryTaxa} (Comparative Cohort)`, colSpan: 1, rowSpan: 1 }
      ]);
    } else if (presetType === 'quad') {
      setLayoutTopology('quad_grid');
      setViewports([
        { id: 'vp-q1', mode: 'google_earth', taxaName: primaryTaxa, title: `${primaryTaxa} • Google Earth 3D`, colSpan: 1, rowSpan: 1 },
        { id: 'vp-q2', mode: 'blueprint', taxaName: primaryTaxa, title: `${primaryTaxa} • Osteology Blueprint`, colSpan: 1, rowSpan: 1 },
        { id: 'vp-q3', mode: 'organs', taxaName: primaryTaxa, title: `${primaryTaxa} • Organ Systems`, colSpan: 1, rowSpan: 1 },
        { id: 'vp-q4', mode: 'locomotion', taxaName: primaryTaxa, title: `${primaryTaxa} • Locomotion Kinematics`, colSpan: 1, rowSpan: 1 }
      ]);
    } else if (presetType === 'all_modes') {
      setLayoutTopology('all_modes');
      const allModes: ViewportMode[] = ['google_earth', 'organs', 'blueprint', 'locomotion', 'climate', 'elevation'];
      setViewports(allModes.map((m, i) => ({
        id: `vp-all-${i}`,
        mode: m,
        taxaName: primaryTaxa,
        title: `${primaryTaxa} • ${MODE_METADATA[m]?.label}`,
        colSpan: 1,
        rowSpan: 1
      })));
    }
  };

  // Add a new viewport tile with intent
  const addViewportTile = (mode: ViewportMode, customTaxa?: string) => {
    const targetTaxa = customTaxa || primaryTaxa;
    const newId = `vp-${Date.now()}`;
    const newVp: ViewportConfig = {
      id: newId,
      mode,
      taxaName: targetTaxa,
      title: `${targetTaxa} • ${MODE_METADATA[mode]?.label}`,
      colSpan: 1,
      rowSpan: 1
    };

    setViewports(prev => {
      const next = [...prev, newVp];
      if (next.length > 2 && layoutTopology === 'split_horizontal') {
        setLayoutTopology('quad_grid');
      }
      return next;
    });
  };

  // Drag and drop intent drop handlers
  const handleDropOnZone = (zoneType: 'split_left' | 'split_right' | 'add_new' | 'replace', targetVpId?: string) => {
    if (!draggingMode) return;

    if (zoneType === 'add_new') {
      addViewportTile(draggingMode);
    } else if (zoneType === 'replace' && targetVpId) {
      handleChangeMode(targetVpId, draggingMode);
    } else if (zoneType === 'split_left') {
      setViewports(prev => [
        {
          id: `vp-split-${Date.now()}`,
          mode: draggingMode,
          taxaName: primaryTaxa,
          title: `${primaryTaxa} • ${MODE_METADATA[draggingMode]?.label}`,
          colSpan: 1,
          rowSpan: 1
        },
        ...prev
      ]);
    } else if (zoneType === 'split_right') {
      setViewports(prev => [
        ...prev,
        {
          id: `vp-split-${Date.now()}`,
          mode: draggingMode,
          taxaName: primaryTaxa,
          title: `${primaryTaxa} • ${MODE_METADATA[draggingMode]?.label}`,
          colSpan: 1,
          rowSpan: 1
        }
      ]);
    }

    setDraggingMode(null);
    setHoverDropTarget(null);
  };

  // Render individual viewport content based on mode
  const renderViewportModule = (vp: ViewportConfig) => {
    const dinoData = DINOSAUR_DB.find(d => d.name.toLowerCase() === vp.taxaName.toLowerCase().trim()) || DINOSAUR_DB[0];
    const dinoSites = dinoData.sites;
    const activeSiteItem = dinoSites[0];
    const dinoMarkers: SiteMarker[] = dinoSites.map((s, i) => ({
      id: `site-${vp.taxaName}-${i}`,
      name: s.name,
      lat: s.coordinates.lat,
      lng: s.coordinates.lng,
      climateBiome: s.geologicalContext.climate
    }));
    
    // Synthetic PaleoData representation for non-primary dinosaurs
    const synthesizedPaleoData: PaleoData = (vp.taxaName === primaryTaxa && primarySite) ? primarySite : {
      name: dinoData.name,
      coordinates: { lat: activeSiteItem?.coordinates.lat || 45.0, lng: activeSiteItem?.coordinates.lng || -105.0 },
      summary: dinoData.summary,
      stats: [
        { label: 'Geological Period', value: activeSiteItem?.geologicalContext.period || 'Mesozoic', subtext: activeSiteItem?.geologicalContext.age || '68 Ma', iconType: 'geology' },
        { label: 'Dietary Guild', value: dinoData.metadata.diet, subtext: dinoData.metadata.packBehavior, iconType: 'discovery' }
      ],
      features: [
        { name: 'Cranial Morphology', description: `${dinoData.name} specialized dentition & skull architecture`, category: 'skull' }
      ],
      geologicalContext: {
        era: 'Mesozoic',
        period: activeSiteItem?.geologicalContext.period || 'Late Cretaceous',
        climate: activeSiteItem?.geologicalContext.climate || 'Subtropical',
        age: activeSiteItem?.geologicalContext.age || '68 Ma'
      },
      locomotion: {
        category: dinoData.metadata.diet.toLowerCase().includes('carnivore') ? 'bipedal_cursorial' : 'quadrupedal_graviportal',
        categoryLabel: dinoData.metadata.diet.toLowerCase().includes('carnivore') ? 'Cursorial Biped' : 'Graviportal Quadruped',
        posture: 'Digitigrade',
        topSpeedKmh: dinoData.metadata.diet.toLowerCase().includes('carnivore') ? 32 : 18,
        cruisingSpeedKmh: 12,
        strideLengthM: 3.8,
        hipHeightM: 3.5,
        froudeNumber: 0.85,
        gaitMode: 'Walk',
        dutyFactorPercent: 62,
        paceAngulationDeg: 165,
        trackGaugeWidthCm: 60,
        manusPesRatio: '1:3',
        centerOfMassPosition: 'Pelvic Girdle Axis',
        groundReactionForceKn: 45,
        locomotionFeatures: ['Robust femur biomechanics', 'Digitigrade pes balance']
      },
      ontogeny: {
        stages: [],
        growthCurve: []
      },
      elevation: {
        paleoElevationM: 140,
        paleoElevationFt: 460,
        modernElevationM: 650,
        hypsometryZone: 'Inland Floodplain Basin',
        depositionalEnvironment: 'Fluvial Sandstone Channel',
        taphonomicBurialDepthM: 45,
        stratigraphicMember: `${activeSiteItem?.name.split(',')[0]} Member`,
        reliefGradientPercent: 3.2,
        crossSectionProfile: [
          { distanceKm: 0, altitudeM: 100, terrainLabel: 'Coastal Lowland' },
          { distanceKm: 40, altitudeM: 140, terrainLabel: 'Excavation Site', isSiteLocation: true },
          { distanceKm: 80, altitudeM: 280, terrainLabel: 'Highland Ridge' }
        ]
      },
      metadata: dinoData.metadata
    };

    switch (vp.mode) {
      case 'google_earth':
        return (
          <GoogleEarthViewer
            markers={vp.taxaName === primaryTaxa ? primaryMarkers : dinoMarkers}
            selectedMarkerId={vp.taxaName === primaryTaxa ? (siteNavSignal?.site?.name || primaryMarkers[currentIndex]?.name) : dinoMarkers[0]?.name}
            onMarkerClick={onMarkerClick}
            activeTaxaName={vp.taxaName}
            paleoData={synthesizedPaleoData}
            plottingConfig={plottingConfig}
            onChangePlottingConfig={onUpdatePlottingConfig}
            isPlottingPanelOpen={false}
            activeGeographicArea={selectedArea}
            areaNavSignal={areaNavSignal}
            siteNavSignal={siteNavSignal}
            currentIndex={vp.taxaName === primaryTaxa ? currentIndex : 0}
            onPrevSite={onPrevSite}
            onNextSite={onNextSite}
            onSelectTab={onSelectTab}
            onSwitchToPaleoMap={() => handleChangeMode(vp.id, 'paleo_atlas')}
          />
        );

      case 'paleo_atlas':
        return (
          <MapCanvas
            markers={vp.taxaName === primaryTaxa ? primaryMarkers : dinoMarkers}
            selectedMarkerId={vp.taxaName === primaryTaxa ? (siteNavSignal?.site?.name || primaryMarkers[currentIndex]?.name) : dinoMarkers[0]?.name}
            currentIndex={vp.taxaName === primaryTaxa ? currentIndex : 0}
            siteNavSignal={siteNavSignal}
            onMarkerClick={onMarkerClick}
            activeTaxaName={vp.taxaName}
            paleoData={synthesizedPaleoData}
            plottingConfig={plottingConfig}
            onChangePlottingConfig={onUpdatePlottingConfig}
            isPlottingPanelOpen={false}
            activeGeographicArea={selectedArea}
            areaNavSignal={areaNavSignal}
            onSwitchToGoogleEarth={() => handleChangeMode(vp.id, 'google_earth')}
            onPrevSite={onPrevSite}
            onNextSite={onNextSite}
            onSelectTab={onSelectTab}
          />
        );

      case 'organs':
        return (
          <div className="w-full h-full overflow-auto custom-scrollbar bg-slate-950 p-2 sm:p-3">
            <InteractiveOrganSystemViewer
              taxaName={vp.taxaName}
              initialSystem="all"
              onNavigateToTab={onSelectTab}
            />
          </div>
        );

      case 'blueprint':
        return (
          <div className="w-full h-full overflow-auto custom-scrollbar bg-slate-950">
            <SpecimenBlueprintViewer
              blueprintImage={vp.taxaName === primaryTaxa ? primaryBlueprintImage : null}
              imgLoading={vp.taxaName === primaryTaxa ? primaryImgLoading : false}
              activeTaxa={vp.taxaName}
              onRefresh={() => {}}
              onNavigateToTab={onSelectTab}
            />
          </div>
        );

      case 'locomotion':
        return (
          <div className="w-full h-full overflow-auto custom-scrollbar bg-[#faf8f2] p-2 sm:p-3">
            <LocomotionVisualizer
              taxaName={vp.taxaName}
              locomotion={synthesizedPaleoData.locomotion}
            />
          </div>
        );

      case 'climate':
        return (
          <div className="w-full h-full overflow-auto custom-scrollbar bg-[#faf8f2] p-2 sm:p-3">
            <ClimateSpatioTemporal
              taxaName={vp.taxaName}
              siteName={activeSiteItem?.name}
              periodName={activeSiteItem?.geologicalContext.period}
              climate={synthesizedPaleoData.climateVariables}
            />
          </div>
        );

      case 'elevation':
        return (
          <div className="w-full h-full overflow-auto custom-scrollbar bg-[#faf8f2] p-2 sm:p-3">
            <ElevationProfile
              siteName={activeSiteItem?.name || 'Excavation Site'}
              elevation={synthesizedPaleoData.elevation}
            />
          </div>
        );

      case 'lifecycle':
        return (
          <div className="w-full h-full overflow-auto custom-scrollbar bg-[#faf8f2] p-2 sm:p-3">
            <LifeCycleTemporalLapse
              taxaName={vp.taxaName}
              ontogeny={synthesizedPaleoData.ontogeny}
            />
          </div>
        );

      case 'cardinal':
        return (
          <div className="w-full h-full overflow-auto custom-scrollbar bg-white p-2 sm:p-3">
            <NeighbouringExcavationRadar
              taxaName={vp.taxaName}
              currentSite={activeSiteItem || primaryMarkers[0]}
              allSites={vp.taxaName === primaryTaxa ? primaryMarkers : dinoSites}
              onSelectSite={onMarkerClick}
            />
          </div>
        );

      case 'evolution':
        return (
          <div className="w-full h-full overflow-auto custom-scrollbar bg-[#faf8f2] p-2 sm:p-3">
            <EvolutionaryChronologyMap
              activeAgeMa={synthesizedPaleoData.timeMarker?.exactAgeMa || 68}
              onSelectAgeMa={() => {}}
              timeMarker={synthesizedPaleoData.timeMarker}
              activeTaxaName={vp.taxaName}
            />
          </div>
        );

      case 'builder':
        return (
          <div className="w-full h-full overflow-auto custom-scrollbar bg-[#faf8f2] p-2 sm:p-3">
            <AnatomicalSynthesizerBuilder
              onDeployToObservatory={() => {}}
              onNavigateToTab={onSelectTab}
            />
          </div>
        );

      case 'metrics':
      case 'inventory':
      case 'dossier':
      default:
        return (
          <div className="w-full h-full overflow-auto custom-scrollbar bg-[#faf8f2] p-4 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">{dinoData.name}</h3>
                <span className="text-xs font-mono text-slate-600">{activeSiteItem?.geologicalContext.period} • {activeSiteItem?.geologicalContext.age}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                {dinoData.metadata.diet}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-700">{dinoData.summary}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-600 block uppercase font-mono">Osteological Completeness</span>
                <span className="text-sm font-bold text-emerald-700">{dinoData.metadata.osteologicalCompleteness}%</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-600 block uppercase font-mono">Excavation Localities</span>
                <span className="text-sm font-bold text-indigo-700">{dinoSites.length} Horizons</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none relative z-30">
      
      {/* Top Header Control Ribbon: Intent Selector, Layout Switcher & Close Button */}
      <header className="flex-none bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-md">
        
        {/* Left: Branding & Quick Intent Presets */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700">
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Multi-Viewport Studio</span>
          </div>

          {/* Quick Intention Presets */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => applyPresetIntent('anatomy_kinematics')}
              className="px-2 py-1 rounded text-[10.5px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
              title="Compare Skeletal Blueprint vs Locomotion Kinematics"
            >
              <Bone size={11} className="text-cyan-400" />
              <span>Anatomy vs Gait</span>
            </button>
            <button
              onClick={() => applyPresetIntent('dual_maps')}
              className="px-2 py-1 rounded text-[10.5px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
              title="Compare Google Earth 3D vs Mesozoic Paleo-Atlas"
            >
              <Globe size={11} className="text-emerald-400" />
              <span>Dual Maps</span>
            </button>
            <button
              onClick={() => applyPresetIntent('physiology_climate')}
              className="px-2 py-1 rounded text-[10.5px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
              title="Compare Organ Systems vs Paleoclimate"
            >
              <Heart size={11} className="text-rose-400" />
              <span>Viscera vs Climate</span>
            </button>
            <button
              onClick={() => applyPresetIntent('interspecies')}
              className="px-2 py-1 rounded text-[10.5px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
              title={`Compare ${primaryTaxa} vs ${secondaryTaxa} Side-by-Side`}
            >
              <ArrowRightLeft size={11} className="text-amber-400" />
              <span>Interspecies vs {secondaryTaxa.split(' ')[0]}</span>
            </button>
            <button
              onClick={() => applyPresetIntent('quad')}
              className="px-2 py-1 rounded text-[10.5px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
              title="2x2 Quad Matrix Viewport Grid"
            >
              <Grid size={11} className="text-purple-400" />
              <span>Quad Grid</span>
            </button>
            <button
              onClick={() => applyPresetIntent('all_modes')}
              className="px-2 py-1 rounded text-[10.5px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
              title="Compare All Workspaces Simultaneously"
            >
              <Layers size={11} className="text-blue-400" />
              <span>All Modes</span>
            </button>
          </div>
        </div>

        {/* Right: Layout Grid Switchers & Close Comparison Button */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Layout Topologies */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setLayoutTopology('split_horizontal')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                layoutTopology === 'split_horizontal' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Side-by-Side Split Horizontal"
            >
              <Columns size={13} />
            </button>
            <button
              onClick={() => setLayoutTopology('split_vertical')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                layoutTopology === 'split_vertical' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Stacked Split Vertical"
            >
              <Rows size={13} />
            </button>
            <button
              onClick={() => setLayoutTopology('quad_grid')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                layoutTopology === 'quad_grid' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Quad 2x2 Grid"
            >
              <Grid size={13} />
            </button>
          </div>

          {/* Add Viewport Dropdown */}
          <div className="relative group">
            <button
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Add a new comparative viewport panel"
            >
              <Plus size={13} className="text-emerald-400" />
              <span>Add Viewport</span>
              <ChevronDown size={11} className="text-slate-400" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 hidden group-hover:block divide-y divide-slate-800/80">
              <div className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">Select Display Mode</div>
              <div className="py-1">
                {(Object.keys(MODE_METADATA) as ViewportMode[]).map(modeKey => {
                  const meta = MODE_METADATA[modeKey];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={modeKey}
                      onClick={() => addViewportTile(modeKey)}
                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Icon size={13} className={meta.color} />
                      <span className="flex-1 truncate">{meta.label}</span>
                      <span className="text-[9px] font-mono text-slate-500">{meta.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interspecies Secondary Taxa Selector */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono">Vs Taxon:</span>
            <select
              value={secondaryTaxa}
              onChange={(e) => setSecondaryTaxa(e.target.value)}
              className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs font-semibold text-amber-300 focus:outline-hidden focus:border-amber-400 cursor-pointer"
            >
              {ALL_TAXA_NAMES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Close Comparison Button - Resumes workspace smoothly */}
          <button
            onClick={onCloseComparison}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ml-1"
            title="Close Comparison Panel and Resume Previous Workspace Configuration"
          >
            <X size={13} />
            <span>Close Comparison</span>
          </button>
        </div>
      </header>

      {/* Collapsible Inter-Intention Workbench Drawer */}
      <div className="flex-none bg-slate-900 border-b border-slate-800 px-3 py-1 flex items-center justify-between gap-2 z-20">
        <button
          onClick={() => setIsWorkbenchCollapsed(prev => !prev)}
          className="flex items-center gap-2 text-[10.5px] font-rounded font-extrabold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer select-none"
        >
          <Sparkles size={12} className="text-amber-400" />
          <span className="uppercase tracking-wider">Visual Display Comparison & Inter-Intention Workbench</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800 font-semibold">
            {isWorkbenchCollapsed ? 'Collapsed' : 'Expanded'}
          </span>
        </button>

        <button
          onClick={() => setIsWorkbenchCollapsed(prev => !prev)}
          className="p-1 px-2 rounded-md bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[9.5px] font-mono transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          title={isWorkbenchCollapsed ? "Expand Inter-Intention Drag & Preset Workbench" : "Collapse Inter-Intention Workbench"}
        >
          <span>{isWorkbenchCollapsed ? 'Expand Workbench' : 'Collapse Workbench'}</span>
          {isWorkbenchCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
      </div>

      {!isWorkbenchCollapsed && (
        <div className="flex-none bg-slate-900/80 border-b border-slate-800 px-3 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar animate-in">
          <span className="text-[10px] font-mono text-slate-400 shrink-0 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={11} className="text-amber-400" />
            <span>Drag To Compare:</span>
          </span>
          {(Object.keys(MODE_METADATA) as ViewportMode[]).map(modeKey => {
            const meta = MODE_METADATA[modeKey];
            const Icon = meta.icon;
            return (
              <div
                key={`drag-${modeKey}`}
                draggable
                onDragStart={(e) => {
                  setDraggingMode(modeKey);
                  e.dataTransfer.setData('text/plain', modeKey);
                }}
                onDragEnd={() => setDraggingMode(null)}
                onClick={() => addViewportTile(modeKey)}
                className="px-2 py-0.8 rounded-md bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10.5px] font-medium flex items-center gap-1.5 shrink-0 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-all"
                title={`Drag onto any viewport to compare, or click to add ${meta.label}`}
              >
                <Icon size={11} className={meta.color} />
                <span>{meta.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Responsive Zero-Dead-Space Flex-Grid Viewports Container */}
      <div 
        ref={splitContainerRef}
        className="flex-1 w-full h-full relative overflow-hidden bg-slate-950 flex"
      >
        {/* Dynamic Topology Layout Engine */}
        {layoutTopology === 'split_horizontal' && (
          <div className="w-full h-full flex flex-row overflow-hidden">
            {/* Viewport 1 */}
            {viewports[0] && (
              <div 
                style={{ width: `${viewports[0].isCollapsed ? 42 : (viewports.length > 1 ? splitRatio : 100)}%` }}
                className="h-full flex flex-col border-r border-slate-800 relative transition-[width] duration-100 min-w-0"
              >
                {renderViewportHeader(viewports[0])}
                {!viewports[0].isCollapsed && (
                  <div className="flex-1 relative overflow-auto custom-scrollbar">
                    <React.Suspense fallback={<ViewportSkeleton />}>
                      {renderViewportModule(viewports[0])}
                    </React.Suspense>
                  </div>
                )}
              </div>
            )}

            {/* Fluid Splitter Handle */}
            {viewports.length > 1 && !viewports[0]?.isCollapsed && !viewports[1]?.isCollapsed && (
              <div
                onPointerDown={handleSplitterPointerDown}
                className="w-1.5 hover:w-2 bg-slate-800/80 hover:bg-amber-400 cursor-col-resize transition-all shrink-0 relative group z-20 flex items-center justify-center select-none touch-none"
                title="Drag left/right to resize viewports freely"
              >
                <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-slate-950 rounded-full" />
              </div>
            )}

            {/* Viewport 2 */}
            {viewports[1] && (
              <div 
                style={{ width: `${viewports[1].isCollapsed ? 42 : (viewports.length > 1 ? 100 - splitRatio : 100)}%` }}
                className="h-full flex-1 flex flex-col relative transition-[width] duration-100 min-w-0"
              >
                {renderViewportHeader(viewports[1])}
                {!viewports[1].isCollapsed && (
                  <div className="flex-1 relative overflow-auto custom-scrollbar">
                    <React.Suspense fallback={<ViewportSkeleton />}>
                      {renderViewportModule(viewports[1])}
                    </React.Suspense>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {layoutTopology === 'split_vertical' && (
          <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Viewport 1 (Top) */}
            {viewports[0] && (
              <div 
                style={{ height: `${viewports[0].isCollapsed ? 36 : (viewports.length > 1 ? splitRatio : 100)}%` }}
                className="w-full flex flex-col border-b border-slate-800 relative transition-[height] duration-100 min-h-0"
              >
                {renderViewportHeader(viewports[0])}
                {!viewports[0].isCollapsed && (
                  <div className="flex-1 relative overflow-auto custom-scrollbar">
                    <React.Suspense fallback={<ViewportSkeleton />}>
                      {renderViewportModule(viewports[0])}
                    </React.Suspense>
                  </div>
                )}
              </div>
            )}

            {/* Fluid Vertical Splitter Handle */}
            {viewports.length > 1 && !viewports[0]?.isCollapsed && !viewports[1]?.isCollapsed && (
              <div
                onPointerDown={handleSplitterPointerDown}
                className="h-1.5 hover:h-2 bg-slate-800/80 hover:bg-amber-400 cursor-row-resize transition-all shrink-0 relative group z-20 flex items-center justify-center select-none touch-none"
                title="Drag up/down to resize viewports freely"
              >
                <div className="h-0.5 w-8 bg-slate-600 group-hover:bg-slate-950 rounded-full" />
              </div>
            )}

            {/* Viewport 2 (Bottom) */}
            {viewports[1] && (
              <div 
                style={{ height: `${viewports[1].isCollapsed ? 36 : (viewports.length > 1 ? 100 - splitRatio : 100)}%` }}
                className="w-full flex-1 flex flex-col relative transition-[height] duration-100 min-h-0"
              >
                {renderViewportHeader(viewports[1])}
                {!viewports[1].isCollapsed && (
                  <div className="flex-1 relative overflow-auto custom-scrollbar">
                    <React.Suspense fallback={<ViewportSkeleton />}>
                      {renderViewportModule(viewports[1])}
                    </React.Suspense>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(layoutTopology === 'quad_grid' || layoutTopology === 'all_modes' || layoutTopology === 'triple_columns') && (
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 overflow-auto custom-scrollbar">
            {viewports.map((vp) => (
              <div
                key={vp.id}
                className={`flex flex-col border border-slate-800/80 bg-slate-950 min-h-[320px] lg:min-h-[420px] relative ${
                  vp.colSpan === 2 ? 'md:col-span-2' : ''
                } ${vp.isCollapsed ? 'max-h-[38px] min-h-[38px] overflow-hidden' : ''}`}
              >
                {renderViewportHeader(vp)}
                {!vp.isCollapsed && (
                  <div className="flex-1 relative overflow-auto custom-scrollbar">
                    <React.Suspense fallback={<ViewportSkeleton />}>
                      {renderViewportModule(vp)}
                    </React.Suspense>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Drag Over Overlay Drop Target Intent Indicator */}
        {draggingMode && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-6 pointer-events-auto">
            <div className="grid grid-cols-2 gap-4 max-w-xl w-full">
              <div
                onDragOver={(e) => { e.preventDefault(); setHoverDropTarget('split_left'); }}
                onDragLeave={() => setHoverDropTarget(null)}
                onDrop={() => handleDropOnZone('split_left')}
                onClick={() => handleDropOnZone('split_left')}
                className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                  hoverDropTarget === 'split_left' ? 'border-amber-400 bg-amber-500/20 text-white scale-105' : 'border-slate-700 bg-slate-900/60 text-slate-400'
                }`}
              >
                <Columns size={28} className="text-amber-400" />
                <span className="font-bold text-sm text-slate-100">Drop on Left Split</span>
                <span className="text-[11px] text-slate-400">Position on the primary left pane</span>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setHoverDropTarget('split_right'); }}
                onDragLeave={() => setHoverDropTarget(null)}
                onDrop={() => handleDropOnZone('split_right')}
                onClick={() => handleDropOnZone('split_right')}
                className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                  hoverDropTarget === 'split_right' ? 'border-emerald-400 bg-emerald-500/20 text-white scale-105' : 'border-slate-700 bg-slate-900/60 text-slate-400'
                }`}
              >
                <Columns size={28} className="text-emerald-400" />
                <span className="font-bold text-sm text-slate-100">Drop on Right Split</span>
                <span className="text-[11px] text-slate-400">Position on the secondary right pane</span>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setHoverDropTarget('add_new'); }}
                onDragLeave={() => setHoverDropTarget(null)}
                onDrop={() => handleDropOnZone('add_new')}
                onClick={() => handleDropOnZone('add_new')}
                className={`col-span-2 p-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 cursor-pointer transition-all ${
                  hoverDropTarget === 'add_new' ? 'border-cyan-400 bg-cyan-500/20 text-white scale-102' : 'border-slate-700 bg-slate-900/60 text-slate-400'
                }`}
              >
                <Grid size={22} className="text-cyan-400" />
                <span className="font-bold text-sm text-slate-100">Add as New Grid Tile ({MODE_METADATA[draggingMode]?.label})</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  // Helper: Render Viewport Title Bar & Header Controls
  function renderViewportHeader(vp: ViewportConfig) {
    const meta = MODE_METADATA[vp.mode] || MODE_METADATA.google_earth;
    const Icon = meta.icon;

    return (
      <div className="flex-none bg-slate-900 px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between gap-2 z-10">
        
        {/* Left: Drag Handle, Mode Icon & Mode Dropdown */}
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical size={13} className="text-slate-500 shrink-0 cursor-grab" />
          <Icon size={14} className={`${meta.color} shrink-0`} />

          {/* Mode Switcher Dropdown */}
          <select
            value={vp.mode}
            onChange={(e) => handleChangeMode(vp.id, e.target.value as ViewportMode)}
            disabled={vp.isLocked}
            className="bg-slate-950 text-xs font-bold text-slate-200 border border-slate-700/80 rounded px-1.5 py-0.5 focus:outline-hidden focus:border-amber-400 cursor-pointer disabled:opacity-50"
          >
            {(Object.keys(MODE_METADATA) as ViewportMode[]).map(mKey => (
              <option key={mKey} value={mKey}>{MODE_METADATA[mKey].label}</option>
            ))}
          </select>

          {/* Taxon Switcher Dropdown */}
          <select
            value={vp.taxaName}
            onChange={(e) => handleChangeTaxa(vp.id, e.target.value)}
            disabled={vp.isLocked}
            className="bg-slate-950 text-[11px] font-mono text-amber-300 border border-slate-700/80 rounded px-1.5 py-0.5 focus:outline-hidden focus:border-amber-400 cursor-pointer disabled:opacity-50 max-w-[130px] sm:max-w-none truncate"
          >
            {ALL_TAXA_NAMES.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Right: Spannable, Lock, Collapse, and Close Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Span 2 Cols / 1 Col */}
          <button
            onClick={() => handleToggleSpan(vp.id)}
            className={`p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${
              vp.colSpan === 2 ? 'text-amber-400 font-bold bg-amber-950/40' : ''
            }`}
            title={vp.colSpan === 2 ? "Restore single column width" : "Span across 2 grid columns"}
          >
            <Maximize2 size={11} />
          </button>

          {/* Lock / Unlock */}
          <button
            onClick={() => handleToggleLock(vp.id)}
            className={`p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${
              vp.isLocked ? 'text-emerald-400 bg-emerald-950/40' : ''
            }`}
            title={vp.isLocked ? "Unlock viewport modifications" : "Lock / Pin viewport configuration"}
          >
            {vp.isLocked ? <Lock size={11} /> : <Unlock size={11} />}
          </button>

          {/* Collapse / Expand */}
          <button
            onClick={() => handleToggleCollapse(vp.id)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={vp.isCollapsed ? "Expand viewport" : "Collapse viewport"}
          >
            {vp.isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>

          {/* Close Panel */}
          {!vp.isLocked && (
            <button
              onClick={() => handleRemoveViewport(vp.id)}
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Close this viewport"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    );
  }
};

const ViewportSkeleton: React.FC = () => (
  <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-2">
    <div className="w-8 h-8 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin" />
    <span className="font-mono text-xs text-slate-400">Loading module workspace...</span>
  </div>
);

export default WorkspaceComparisonStudio;
