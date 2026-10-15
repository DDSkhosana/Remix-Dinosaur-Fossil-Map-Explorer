import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useViewportDimensions } from './hooks/useViewportDimensions';
import { fetchPaleoData, fetchSitesForQuery, generateTaxaBlueprint, registerSyntheticDinosaur } from './services/geminiService';
import { PaleoData, SiteMarker, SpatioTemporalWaypoint } from './types';
import { DINOSAUR_DB } from './data/dinosaurData';
import { getDinosaurBlueprintFallback } from './utils/dinosaurIllustrations';
import { PERIOD_TABS, AREA_TABS, CLIMATE_TABS, filterTaxa } from './utils/taxaFilters';
import { GEOGRAPHIC_REGIONS, isSiteInArea, taxonHasArea } from './utils/geoRegions';
import TimeScaleBar from './components/TimeScaleBar';
import ScrollableTabGroup, { TabItem } from './components/ScrollableTabGroup';
import DinosaurTaxaTabs from './components/DinosaurTaxaTabs';
import ResizableSplitter from './components/ResizableSplitter';
import { PlottingLayerConfig, DEFAULT_PLOTTING_CONFIG } from './components/PlottingSpecializationLayer';
import InfoPanelLegendHeader from './components/InfoPanelLegendHeader';
import { TechIcon, DinoIcon } from './components/Icons';

// Dynamic code-split components for optimal initial payload and rapid rendering
const MapCanvas = React.lazy(() => import('./components/MapCanvas'));
const GoogleEarthViewer = React.lazy(() => import('./components/GoogleEarthViewer'));
const ClimateSpatioTemporal = React.lazy(() => import('./components/ClimateSpatioTemporal'));
const LocomotionVisualizer = React.lazy(() => import('./components/LocomotionVisualizer'));
const LifeCycleTemporalLapse = React.lazy(() => import('./components/LifeCycleTemporalLapse'));
const ElevationProfile = React.lazy(() => import('./components/ElevationProfile'));
const SpecimenBlueprintViewer = React.lazy(() => import('./components/SpecimenBlueprintViewer'));
const InteractiveOrganSystemViewer = React.lazy(() => import('./components/InteractiveOrganSystemViewer'));
const NeighbouringExcavationRadar = React.lazy(() => import('./components/NeighbouringExcavationRadar'));
const WorkspaceComparisonStudio = React.lazy(() => import('./components/WorkspaceComparisonStudio'));
const EvolutionaryChronologyMap = React.lazy(() => import('./components/EvolutionaryChronologyMap'));
const AnatomicalSynthesizerBuilder = React.lazy(() => import('./components/AnatomicalSynthesizerBuilder'));
const ScientificReasoningNexus = React.lazy(() => import('./components/ScientificReasoningNexus'));

const MapLoadingSkeleton: React.FC = () => (
  <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3 select-none">
    <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
    <span className="font-mono text-xs text-emerald-400 tracking-wider">INITIALIZING OBSERVATORY...</span>
  </div>
);

const TabLoadingSkeleton: React.FC = () => (
  <div className="p-6 bg-white rounded-2xl border border-park-card-border flex flex-col items-center justify-center text-center space-y-2 animate-pulse">
    <div className="w-7 h-7 rounded-full border-2 border-park-accent-green/40 border-t-park-accent-green animate-spin" />
    <span className="text-xs font-rounded text-park-ink-muted">Loading module telemetry...</span>
  </div>
);
import { 
  Loader2, 
  Map as MapIcon, 
  Globe, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  RotateCcw, 
  Activity, 
  Bone, 
  Trees, 
  Users, 
  User, 
  Bird, 
  Zap, 
  Component,
  Sparkles,
  Compass,
  Footprints,
  Layers,
  Clock,
  ShieldAlert,
  Leaf,
  MapPin,
  CloudSun,
  Flame,
  Mountain,
  Calendar,
  Filter,
  X,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  BookOpen,
  ArrowUp,
  ArrowUpToLine,
  Columns,
  Rows,
  SlidersHorizontal,
  Sliders,
  Type,
  ZoomIn,
  ZoomOut,
  Heart,
  Keyboard,
  Search,
  Command,
  LayoutGrid,
  Grid,
  Dna
} from 'lucide-react';

const TAXA = DINOSAUR_DB.map(d => d.name);

export type TabType = 'overview' | 'organs' | 'cardinal' | 'climate' | 'locomotion' | 'lifecycle' | 'evolution' | 'builder';
export type FilterCategory = 'taxa' | 'period' | 'area' | 'climate';
export type AppLayoutMode = 'split' | 'map_fullscreen' | 'dossier_fullscreen' | 'comparison' | 'builder';

const JOURNAL_TABS: TabItem[] = [
  { 
    id: 'overview', 
    label: '1. Locality & Formation', 
    icon: Globe, 
    badge: 'Horizon',
    description: 'Stratigraphic horizon, discovery formation, osteological completeness and AI blueprint reconstruction',
    keywords: ['stratum', 'formation', 'discovery', 'locality', 'osteology', 'blueprint', 'reconstruction', 'specimen', 'summary', 'completeness', 'horizon', 'chronology', 'sympatric', 'cohort']
  },
  { 
    id: 'organs', 
    label: '2. Organ Physiology', 
    icon: Heart, 
    badge: 'Viscera',
    description: '4-chambered heart, pulmonary air sacs, avian respiratory flow, x-ray viscera & thermoregulation',
    keywords: ['organs', 'viscera', 'heart', 'cardiovascular', 'lungs', 'respiration', 'pulmonary', 'air sacs', 'x-ray', 'brain', 'digestion', 'gizzard', 'thermoregulation', 'endothermy', 'physiology']
  },
  { 
    id: 'locomotion', 
    label: '3. Kinematics & Gait', 
    icon: Footprints, 
    badge: 'Motion',
    description: 'Bipedal/quadrupedal kinematics, stride frequency, footprint duty factor & top sprint velocities',
    keywords: ['locomotion', 'kinematics', 'gait', 'stride', 'speed', 'bipedal', 'quadrupedal', 'footprints', 'trackway', 'velocity', 'duty factor', 'running', 'biomechanics']
  },
  { 
    id: 'climate', 
    label: '4. Climate & Terrain Biome', 
    icon: CloudSun, 
    badge: 'Biome',
    description: 'Paleoclimate simulation, atmospheric CO2, mean temperatures, paleo-biomes & flora stratum',
    keywords: ['climate', 'biome', 'temperature', 'co2', 'rain', 'humidity', 'sea level', 'atmosphere', 'conifer', 'fern', 'greenhouse', 'elevation', 'terrain', 'vegetation', 'flora']
  },
  { 
    id: 'lifecycle', 
    label: '5. Ontogeny & Migration', 
    icon: Calendar, 
    badge: 'Growth',
    description: 'Hatchling to senescent growth curve, mass inflection milestones & seasonal migration tracks',
    keywords: ['lifecycle', 'ontogeny', 'migration', 'growth', 'hatchling', 'juvenile', 'subadult', 'adult', 'senescent', 'lag lines', 'seasonal', 'corridor', 'nesting', 'waypoint']
  },
  { 
    id: 'cardinal', 
    label: '6. Excavation Radar', 
    icon: Compass, 
    badge: 'Azimuth',
    description: 'Reciprocal azimuth, geodesic distance, bearings and excavation quarry triangulation',
    keywords: ['radar', 'excavation', 'azimuth', 'bearing', 'distance', 'quarry', 'geodesic', 'triangulation', 'locality', 'coordinates', 'compass', 'cardinal', 'dig sites']
  },
  { 
    id: 'evolution', 
    label: '7. Evolutionary Tectonics', 
    icon: Globe, 
    badge: 'Plates',
    description: 'Continental drift projections, Pangaea break-up, Laurasia/Gondwana rifting & phylogenetic lineages',
    keywords: ['evolution', 'drift', 'tectonics', 'plates', 'pangaea', 'laurasia', 'gondwana', 'continental', 'rifting', 'phylogeny', 'cladogram', 'timeline', 'epochs', 'triassic', 'jurassic', 'cretaceous']
  },
  { 
    id: 'builder', 
    label: '8. Fossil Assembly & Builder', 
    icon: Dna, 
    badge: 'Atlas',
    description: 'Interactive anatomical synthesizer, cranial/cervical/caudal morphometrics & hybrid synthesis studio',
    keywords: ['builder', 'synthesizer', 'fossil', 'assembly', 'cranial', 'skull', 'teeth', 'cervical', 'vertebrae', 'caudal', 'tail', 'claws', 'dna', 'reconstruction', 'morphology', 'atlas']
  }
];

const TAB_PROGRESSION_MAP: Record<TabType, { 
  stageIndex: number; 
  stageCategory: string; 
  currentTitle: string; 
  prevTab: TabType | null; 
  nextTab: TabType | null; 
  nextLabel: string; 
  nextSummary: string;
  compareMode: any;
}> = {
  overview: {
    stageIndex: 1,
    stageCategory: 'Stage 1: Discovery & Chronostratigraphy',
    currentTitle: 'Locality & Formation',
    prevTab: null,
    nextTab: 'organs',
    nextLabel: 'Proceed to Organ Physiology & Viscera',
    nextSummary: 'Inspect high-contrast anatomical X-Ray, 4-chambered heart & respiratory circuits',
    compareMode: 'organs'
  },
  organs: {
    stageIndex: 2,
    stageCategory: 'Stage 2: Paleophysiological Viscera',
    currentTitle: 'Organ Physiology & Viscera',
    prevTab: 'overview',
    nextTab: 'locomotion',
    nextLabel: 'Proceed to Kinematics & Locomotion',
    nextSummary: 'Analyze digitigrade bipedal gait cycle, stride length & ground reaction forces',
    compareMode: 'locomotion'
  },
  locomotion: {
    stageIndex: 3,
    stageCategory: 'Stage 3: Functional Biomechanics',
    currentTitle: 'Locomotion & Gait Kinematics',
    prevTab: 'organs',
    nextTab: 'climate',
    nextLabel: 'Proceed to Paleoclimate Matrix',
    nextSummary: 'Explore Mesozoic mean annual temperature, atmospheric pCO2 & seasonal climographs',
    compareMode: 'climate'
  },
  climate: {
    stageIndex: 4,
    stageCategory: 'Stage 4: Paleoenvironment & Atmosphere',
    currentTitle: 'Climate & Terrain Biome Matrix',
    prevTab: 'locomotion',
    nextTab: 'lifecycle',
    nextLabel: 'Proceed to Ontogeny & Life Cycle',
    nextSummary: 'Examine hatchling-to-adult growth curves, bone LAG histology & seasonal migration',
    compareMode: 'lifecycle'
  },
  lifecycle: {
    stageIndex: 5,
    stageCategory: 'Stage 5: Ontogenetic Dynamics',
    currentTitle: 'Ontogeny & Migration Cycle',
    prevTab: 'climate',
    nextTab: 'cardinal',
    nextLabel: 'Proceed to Excavation Radar',
    nextSummary: 'Survey neighbouring excavation horizons, reciprocal bearings & geodesic distances',
    compareMode: 'cardinal'
  },
  cardinal: {
    stageIndex: 6,
    stageCategory: 'Stage 6: Geodesic Horizon Survey',
    currentTitle: 'Excavation Sites Radar',
    prevTab: 'lifecycle',
    nextTab: 'evolution',
    nextLabel: 'Proceed to Evolutionary Tectonics & Continental Drift',
    nextSummary: 'Examine continental plate tectonics, major mass extinctions & dinosaur lineages',
    compareMode: 'evolution'
  },
  evolution: {
    stageIndex: 7,
    stageCategory: 'Stage 7: Deep-Time & Plate Tectonics',
    currentTitle: 'Evolutionary Tectonics & Continental Drift',
    prevTab: 'cardinal',
    nextTab: 'builder',
    nextLabel: 'Proceed to Fossil Assembly & Builder Studio',
    nextSummary: 'Assemble excavated fossil holotypes and biomechanically simulate custom synthesized morphotypes',
    compareMode: 'climate'
  },
  builder: {
    stageIndex: 8,
    stageCategory: 'Stage 8: Fossil Assembly & Synthesizer',
    currentTitle: 'Fossil Assembly & Builder Studio',
    prevTab: 'evolution',
    nextTab: 'overview',
    nextLabel: 'Return to Locality Dossier Overview',
    nextSummary: 'Return to Field Observatory and inspect fossil localities',
    compareMode: 'organs'
  }
};

const App: React.FC = () => {
  const [markers, setMarkers] = useState<SiteMarker[]>([]);
  const [selectedSite, setSelectedSite] = useState<PaleoData | null>(null);
  const [blueprintImage, setBlueprintImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [activeQuery, setActiveQuery] = useState('Tyrannosaurus Rex');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeWaypoint, setActiveWaypoint] = useState<SpatioTemporalWaypoint | null>(null);

  // Map Engine State: Google Earth 3D API vs Paleo Atlas
  const [mapEngine, setMapEngine] = useState<'google_earth' | 'paleo_atlas'>('google_earth');
  const [dinoDbVersion, setDinoDbVersion] = useState<number>(0);

  // Global repository of all known excavation quarries across all dinosaurs
  const allGlobalExcavationSites: SiteMarker[] = useMemo(() => {
    const list: SiteMarker[] = [];
    DINOSAUR_DB.forEach(dino => {
      dino.sites.forEach(s => {
        if (!list.some(existing => existing.name === s.name)) {
          list.push({
            id: `site-${s.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name: s.name,
            lat: s.coordinates.lat,
            lng: s.coordinates.lng,
            elevationM: 120,
            climateBiome: s.geologicalContext.climate
          });
        }
      });
    });
    return list;
  }, [dinoDbVersion]);

  // Filter States
  const [activeFilterCategory, setActiveFilterCategory] = useState<FilterCategory>('taxa');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedClimate, setSelectedClimate] = useState<string>('all');
  const [areaNavSignal, setAreaNavSignal] = useState<{ areaId: string; timestamp: number } | null>(null);
  const [siteNavSignal, setSiteNavSignal] = useState<{ site: SiteMarker; timestamp: number } | null>(null);
  
  // Resizable & Fullscreen Layout States: 'split' | 'map_fullscreen' | 'dossier_fullscreen' | 'comparison'
  const [layoutMode, setLayoutMode] = useState<AppLayoutMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dino_layout_mode');
      if (saved === 'map_fullscreen' || saved === 'dossier_fullscreen' || saved === 'split' || saved === 'comparison') {
        return saved as AppLayoutMode;
      }
    }
    return 'split';
  });

  const previousLayoutModeRef = useRef<AppLayoutMode>('split');
  const [initialComparisonMode, setInitialComparisonMode] = useState<any>('organs');

  const openComparisonMode = useCallback((targetMode?: any) => {
    if (layoutMode !== 'comparison') {
      previousLayoutModeRef.current = layoutMode;
    }
    if (targetMode) {
      setInitialComparisonMode(targetMode);
    }
    setLayoutMode('comparison');
    try {
      localStorage.setItem('dino_layout_mode', 'comparison');
    } catch {}
  }, [layoutMode]);

  const closeComparisonMode = useCallback(() => {
    const prev = previousLayoutModeRef.current || 'split';
    const target = prev === 'comparison' ? 'split' : prev;
    setLayoutMode(target);
    try {
      localStorage.setItem('dino_layout_mode', target);
    } catch {}
  }, []);

  // Top Atlases & Displays Panel Collapsible State
  const [isAtlasDisplaysCollapsed, setIsAtlasDisplaysCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dino_atlas_panel_collapsed') === 'true';
    }
    return false;
  });

  const toggleAtlasDisplays = useCallback(() => {
    setIsAtlasDisplaysCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('dino_atlas_panel_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Header Category & Species Filters Ribbon Collapsible State
  const [isHeaderFiltersCollapsed, setIsHeaderFiltersCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dino_header_filters_collapsed');
      if (saved !== null) return saved === 'true';
      return window.innerWidth < 768; // Default to collapsed on mobile/tablet to maximize viewport
    }
    return false;
  });

  const toggleHeaderFilters = useCallback(() => {
    setIsHeaderFiltersCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('dino_header_filters_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Dossier Top Control Bar Collapsible State
  const [isDossierControlBarCollapsed, setIsDossierControlBarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dino_dossier_controls_collapsed');
      if (saved !== null) return saved === 'true';
      return window.innerWidth < 768; // Default to compact on mobile
    }
    return true;
  });

  const toggleDossierControlBar = useCallback(() => {
    setIsDossierControlBarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('dino_dossier_controls_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dino_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 320 && parsed <= 900) return parsed;
      }
    }
    return 530;
  });

  // Dynamic Responsive Viewport Dimensions Hook
  const { width: windowWidth, height: windowHeight, isMobile, isTablet, isDesktop } = useViewportDimensions();
  const [mobileActivePane, setMobileActivePane] = useState<'map' | 'dossier'>('map');
  const [isMobileSwitcherMinimized, setIsMobileSwitcherMinimized] = useState<boolean>(false);

  // Dynamically computed effective sidebar width based on active viewport dimensions
  const effectiveSidebarWidth = useMemo(() => {
    if (isMobile) return windowWidth;
    if (isTablet) return Math.min(sidebarWidth, Math.round(windowWidth * 0.46), 420);
    return Math.min(sidebarWidth, Math.max(340, windowWidth - 340));
  }, [isMobile, isTablet, sidebarWidth, windowWidth]);

  // Keep sidebarWidth clamped if window is resized smaller
  useEffect(() => {
    if (isMobile) return;
    const maxAllowed = isTablet 
      ? Math.min(420, Math.round(windowWidth * 0.46)) 
      : Math.max(340, windowWidth - 340);
    if (sidebarWidth > maxAllowed) {
      setSidebarWidth(maxAllowed);
    }
  }, [windowWidth, isMobile, isTablet, sidebarWidth]);

  // Derived collapse states
  const isSidebarCollapsed = layoutMode === 'map_fullscreen';
  const isMapCollapsed = layoutMode === 'dossier_fullscreen';
  const isComparisonMode = layoutMode === 'comparison';

  // Side-by-Side Dual-Pane Compare Mode (Visual vs Information across all 8 modules)
  const [isSideBySideView, setIsSideBySideView] = useState<boolean>(true);

  // Dynamic Component Ordering in Field Dossier: promotes clicked components to top!
  const [dossierSectionOrder, setDossierSectionOrder] = useState<string[]>([
    'tabContent',
    'hero',
    'blueprint',
    'timescale',
    'overviewSummary',
    'overviewGeological',
    'overviewOsteology',
    'overviewNeighbours',
    'overviewSympatric',
    'legend'
  ]);

  const promoteSectionToTop = useCallback((sectionKey: string) => {
    setDossierSectionOrder(prev => {
      const remaining = prev.filter(k => k !== sectionKey);
      return [sectionKey, ...remaining];
    });
    // Uncollapse section if collapsed
    setCollapsedSections(prev => ({ ...prev, [sectionKey]: false }));
    // Smoothly scroll dossier to top
    if (journalScrollRef.current) {
      journalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const resetDossierSectionOrder = useCallback(() => {
    setDossierSectionOrder([
      'tabContent',
      'hero',
      'blueprint',
      'timescale',
      'overviewSummary',
      'overviewGeological',
      'overviewOsteology',
      'overviewNeighbours',
      'overviewSympatric',
      'legend'
    ]);
  }, []);

  const [dossierScale, setDossierScale] = useState<number>(1.0);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Plotting Specialization Layer & Legend Intelligence State
  const [plottingConfig, setPlottingConfig] = useState<PlottingLayerConfig>(DEFAULT_PLOTTING_CONFIG);
  const [isPlottingPanelOpen, setIsPlottingPanelOpen] = useState<boolean>(false);

  const handleUpdatePlottingConfig = useCallback((newConfig: Partial<PlottingLayerConfig>) => {
    setPlottingConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const handleTogglePlottingPanel = useCallback(() => {
    setIsPlottingPanelOpen(prev => !prev);
  }, []);

  // Collapsible Fields State for all sections of Info Panel (All Modes Default Collapsed)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('dino_info_panel_collapsed_sections');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      legend: true,
      hero: true,
      blueprint: true,
      timescale: true,
      tabContent: true,
      overviewSummary: true,
      overviewGeological: true,
      overviewOsteology: true,
      overviewNeighbours: true,
      overviewSympatric: true,
    };
  });

  const [isHotkeysModalOpen, setIsHotkeysModalOpen] = useState(false);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      try {
        localStorage.setItem('dino_info_panel_collapsed_sections', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const areAllSectionsCollapsed = useMemo(() => {
    const keys = ['legend', 'hero', 'blueprint', 'timescale', 'tabContent', 'overviewSummary', 'overviewGeological', 'overviewOsteology'];
    return keys.every(k => !!collapsedSections[k]);
  }, [collapsedSections]);

  const toggleAllSections = useCallback(() => {
    setCollapsedSections(prev => {
      const keys = ['legend', 'hero', 'blueprint', 'timescale', 'tabContent', 'overviewSummary', 'overviewGeological', 'overviewOsteology'];
      const allCurrentlyCollapsed = keys.every(k => !!prev[k]);
      const nextState = !allCurrentlyCollapsed;
      const newState: Record<string, boolean> = {
        legend: nextState,
        hero: nextState,
        blueprint: nextState,
        timescale: nextState,
        tabContent: nextState,
        overviewSummary: nextState,
        overviewGeological: nextState,
        overviewOsteology: nextState,
        overviewNeighbours: nextState,
      };
      try {
        localStorage.setItem('dino_info_panel_collapsed_sections', JSON.stringify(newState));
      } catch {}
      return newState;
    });
  }, []);
  
  const journalScrollRef = useRef<HTMLDivElement>(null);
  const currentBlueprintTaxa = useRef<string | null>(null);

  // Frame-throttled sidebar width changes with automatic fullscreen snapping
  const handleSidebarResize = useCallback((newWidth: number) => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const maxAllowed = Math.max(340, windowWidth - 320);
    const clamped = Math.min(newWidth, maxAllowed);
    if (clamped >= windowWidth - 180) {
      setLayoutMode('dossier_fullscreen');
      try {
        localStorage.setItem('dino_layout_mode', 'dossier_fullscreen');
      } catch {}
      return;
    }
    if (clamped <= 200) {
      setLayoutMode('map_fullscreen');
      try {
        localStorage.setItem('dino_layout_mode', 'map_fullscreen');
      } catch {}
      return;
    }
    setLayoutMode('split');
    setSidebarWidth(clamped);
    try {
      localStorage.setItem('dino_layout_mode', 'split');
      localStorage.setItem('dino_sidebar_width', Math.round(clamped).toString());
    } catch {}
  }, []);

  // CPU-sympathetic scroll handler: updates progress bar style directly via ref without React re-renders
  const handleJournalScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollableHeight = target.scrollHeight - target.clientHeight;
    if (scrollableHeight > 0) {
      const progress = (target.scrollTop / scrollableHeight) * 100;
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${progress}%`;
      }
      const shouldShowTop = target.scrollTop > 240;
      setShowScrollTop(prev => (prev !== shouldShowTop ? shouldShowTop : prev));
    } else {
      if (progressBarRef.current) {
        progressBarRef.current.style.width = '0%';
      }
      setShowScrollTop(prev => (prev ? false : prev));
    }
  }, []);

  const scrollToJournalTop = useCallback(() => {
    if (journalScrollRef.current) {
      journalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Filtered Taxa List based on active Period, Area, and Climate filters
  const filteredTaxa = useMemo(() => {
    return filterTaxa(selectedPeriod, selectedArea, selectedClimate);
  }, [selectedPeriod, selectedArea, selectedClimate, dinoDbVersion]);
 
  // Omnibox Quick Search filtered results across species, sites, and formation keywords
  const searchResults = useMemo(() => {
    if (!quickSearchQuery.trim()) {
      return DINOSAUR_DB.slice(0, 8).map(d => ({
        type: 'species' as const,
        name: d.name,
        subtitle: `${d.sites[0]?.geologicalContext.period || 'Mesozoic'} • ${d.metadata.diet} • ${d.sites.length} sites`,
        site: d.sites[0],
        diet: d.metadata.diet
      }));
    }

    const query = quickSearchQuery.toLowerCase().trim();
    const results: Array<{
      type: 'species' | 'site';
      name: string;
      subtitle: string;
      speciesName: string;
      site?: typeof DINOSAUR_DB[0]['sites'][0];
      diet?: string;
    }> = [];

    // Match dinosaur species
    DINOSAUR_DB.forEach(d => {
      const nameMatch = d.name.toLowerCase().includes(query);
      const dietMatch = d.metadata.diet.toLowerCase().includes(query);
      const summaryMatch = d.summary.toLowerCase().includes(query);
      const formationMatch = d.sites.some(s => s.name.toLowerCase().includes(query));

      if (nameMatch || dietMatch || summaryMatch || formationMatch) {
        results.push({
          type: 'species',
          name: d.name,
          subtitle: `${d.sites[0]?.geologicalContext.period || 'Mesozoic'} • ${d.metadata.diet} • ${d.sites[0]?.name.split(',')[0]}`,
          speciesName: d.name,
          site: d.sites[0],
          diet: d.metadata.diet
        });
      }

      // Match individual excavation sites
      d.sites.forEach(s => {
        if (s.name.toLowerCase().includes(query) || s.geologicalContext.climate.toLowerCase().includes(query)) {
          if (!results.some(r => r.name === s.name)) {
            results.push({
              type: 'site',
              name: s.name,
              subtitle: `${s.geologicalContext.period} • ${s.geologicalContext.age} • ${d.name}`,
              speciesName: d.name,
              site: s,
              diet: d.metadata.diet
            });
          }
        }
      });
    });

    return results.slice(0, 10);
  }, [quickSearchQuery, dinoDbVersion]);

  // Chronostratigraphic & Geographical Cohort: Sympatric species sharing the same horizon or formation
  const sympatricTaxa = useMemo(() => {
    if (!activeQuery || !selectedSite) return [];
    const activePeriod = selectedSite.geologicalContext.period.toLowerCase();
    const activeSiteName = selectedSite.name.toLowerCase();
    const baseSite = activeSiteName.split(',')[0].trim();

    return DINOSAUR_DB.filter(d => {
      if (d.name.toLowerCase() === activeQuery.toLowerCase()) return false;
      const sharesFormation = d.sites.some(s => {
        const sName = s.name.toLowerCase();
        return sName.includes(baseSite) || baseSite.includes(sName.split(',')[0].trim());
      });
      const sharesPeriod = d.sites.some(s => 
        s.geologicalContext.period.toLowerCase().includes(activePeriod) ||
        activePeriod.includes(s.geologicalContext.period.toLowerCase())
      );
      return sharesFormation || sharesPeriod;
    }).map(d => {
      const directFormation = d.sites.find(s => {
        const sName = s.name.toLowerCase();
        return sName.includes(baseSite) || baseSite.includes(sName.split(',')[0].trim());
      });
      return {
        name: d.name,
        diet: d.metadata.diet,
        sharedFormation: directFormation ? directFormation.name.split(',')[0] : null,
        period: d.sites[0]?.geologicalContext.period || 'Mesozoic',
        isDirectFormation: !!directFormation
      };
    }).sort((a, b) => (b.isDirectFormation ? 1 : 0) - (a.isDirectFormation ? 1 : 0)).slice(0, 6);
  }, [activeQuery, selectedSite, dinoDbVersion]);

  const updateBlueprint = async (taxa: string) => {
    if (currentBlueprintTaxa.current === taxa && blueprintImage) return;
    
    currentBlueprintTaxa.current = taxa;
    // Instant zero-latency render with scientifically authentic SVG blueprint
    const fallback = getDinosaurBlueprintFallback(taxa);
    setBlueprintImage(fallback);
    setImgLoading(false);
    setImgError(false);
    
    // Background async enhancement if live model image is generated
    try {
      const img = await generateTaxaBlueprint(taxa);
      if (currentBlueprintTaxa.current === taxa && img && img !== fallback) {
        setBlueprintImage(img);
      }
    } catch (err) {
      console.warn("Live blueprint check notice:", err);
    }
  };

  const handleQuerySelect = async (query: string, targetArea?: string) => {
    if (query === activeQuery && markers.length > 0 && !targetArea) return;
    setActiveQuery(query);
    setActiveWaypoint(null);
    currentBlueprintTaxa.current = null;
    
    // Always update blueprint for the taxon immediately (0ms)
    updateBlueprint(query);

    try {
      const results = await fetchSitesForQuery(query);
      setMarkers(results);
      if (results.length > 0) {
        let targetIdx = 0;
        const areaToMatch = targetArea || selectedArea;
        if (areaToMatch && areaToMatch !== 'all') {
          const matched = results.findIndex(s => isSiteInArea(s.name, areaToMatch));
          if (matched !== -1) {
            targetIdx = matched;
          }
        }
        setCurrentIndex(targetIdx);
        setSiteNavSignal({ site: results[targetIdx], timestamp: Date.now() });
        handleSiteSelect(results[targetIdx], true, query);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSiteSelect = async (marker: SiteMarker, skipBlueprintFetch: boolean = false, speciesName?: string) => {
    const taxaToSearch = speciesName || activeQuery;
    try {
      const details = await fetchPaleoData(marker.name, taxaToSearch);
      if (details) {
        setSelectedSite(details);
      }
      
      if (!skipBlueprintFetch && !blueprintImage && !imgLoading) {
        updateBlueprint(taxaToSearch);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Centralized Navigation Dispatcher: guarantees map camera flight and selection across all navigation elements
  const triggerSiteNavigation = useCallback((site: SiteMarker, index?: number, skipBlueprint: boolean = true) => {
    if (!site) return;
    let targetIdx = typeof index === 'number' && index >= 0
      ? index
      : markers.findIndex(m => 
          (m.id && site.id && m.id === site.id) || 
          m.name.toLowerCase().trim() === site.name.toLowerCase().trim() ||
          m.name.split(/[,(]/)[0].toLowerCase().trim() === site.name.split(/[,(]/)[0].toLowerCase().trim() ||
          (Math.abs(m.lat - site.lat) < 0.001 && Math.abs(m.lng - site.lng) < 0.001)
        );

    if (targetIdx === -1) {
      // If the navigated site was not in the current markers list (e.g. from neighbouring radar or external stratum),
      // add it so that index navigation and marker pins remain 100% synchronized
      const updatedMarkers = [...markers, site];
      setMarkers(updatedMarkers);
      targetIdx = updatedMarkers.length - 1;
    }

    setCurrentIndex(targetIdx);
    setSiteNavSignal({ site, timestamp: Date.now() });
    handleSiteSelect(site, skipBlueprint);
  }, [markers, handleSiteSelect]);

  const goToNextSite = useCallback(() => {
    if (markers.length === 0) return;
    const nextIdx = (currentIndex + 1) % markers.length;
    triggerSiteNavigation(markers[nextIdx], nextIdx, true);
  }, [markers, currentIndex, triggerSiteNavigation]);

  const goToPrevSite = useCallback(() => {
    if (markers.length === 0) return;
    const prevIdx = (currentIndex - 1 + markers.length) % markers.length;
    triggerSiteNavigation(markers[prevIdx], prevIdx, true);
  }, [markers, currentIndex, triggerSiteNavigation]);

  // Auto-scroll journal to top whenever active tab changes for immediate visual orientation
  useEffect(() => {
    if (journalScrollRef.current) {
      journalScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  // Global hotkey navigation: Excavation Sites (Left/Right), Species (Shift+Left/Right), Tabs (1-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      // Species navigation: Shift + ArrowRight / Shift + ArrowDown
      if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const availableTaxa = filteredTaxa.length > 0 ? filteredTaxa : TAXA;
        const currentTaxaIdx = availableTaxa.indexOf(activeQuery);
        const nextTaxaIdx = (currentTaxaIdx + 1) % availableTaxa.length;
        handleQuerySelect(availableTaxa[nextTaxaIdx]);
        return;
      }
      // Species navigation: Shift + ArrowLeft / Shift + ArrowUp
      if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) {
        e.preventDefault();
        const availableTaxa = filteredTaxa.length > 0 ? filteredTaxa : TAXA;
        const currentTaxaIdx = availableTaxa.indexOf(activeQuery);
        const prevTaxaIdx = (currentTaxaIdx - 1 + availableTaxa.length) % availableTaxa.length;
        handleQuerySelect(availableTaxa[prevTaxaIdx]);
        return;
      }

      // Excavation site navigation
      if (e.key === 'ArrowRight' || e.key === ']') {
        goToNextSite();
      } else if (e.key === 'ArrowLeft' || e.key === '[') {
        goToPrevSite();
      }

      // Quick Search / Command Palette: Cmd+K / Ctrl+K or /
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchPaletteOpen(prev => !prev);
        return;
      }
      if (e.key === '/' && !e.shiftKey) {
        e.preventDefault();
        setIsSearchPaletteOpen(true);
        return;
      }

      // Toggle Researcher Hotkeys Guide: ? or Shift+/
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsHotkeysModalOpen(prev => !prev);
        return;
      }
      if (e.key === 'Escape') {
        setIsHotkeysModalOpen(false);
        setIsSearchPaletteOpen(false);
      }

      // Direct Tab Switching: Keys 1 - 9
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key >= '1' && e.key <= '9') {
        const tabIndex = parseInt(e.key, 10) - 1;
        if (tabIndex < JOURNAL_TABS.length) {
          setActiveTab(JOURNAL_TABS[tabIndex].id as TabType);
          if (collapsedSections.tabContent) {
            setCollapsedSections(prev => ({ ...prev, tabContent: false }));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, markers, filteredTaxa, activeQuery, goToNextSite, goToPrevSite, collapsedSections.tabContent]);

  // Sync active dinosaur if filtered list changes and active is not in list
  useEffect(() => {
    if (filteredTaxa.length > 0 && !filteredTaxa.includes(activeQuery)) {
      handleQuerySelect(filteredTaxa[0], selectedArea);
    }
  }, [filteredTaxa]);

  useEffect(() => {
    handleQuerySelect("Tyrannosaurus Rex");
  }, []);

  // Format Taxa items for ScrollableTabGroup
  const taxaTabItems: TabItem[] = useMemo(() => {
    return (filteredTaxa.length > 0 ? filteredTaxa : TAXA).map(name => ({
      id: name,
      label: name
    }));
  }, [filteredTaxa]);

  const periodTabItems: TabItem[] = useMemo(() => {
    return PERIOD_TABS.map(p => ({
      id: p.id,
      label: p.label,
      subLabel: p.subLabel,
      badge: p.badge,
      icon: Clock
    }));
  }, []);

  const areaTabItems: TabItem[] = useMemo(() => {
    return AREA_TABS.map(a => ({
      id: a.id,
      label: a.label,
      subLabel: a.subLabel,
      badge: a.badge,
      icon: Compass
    }));
  }, []);

  const climateTabItems: TabItem[] = useMemo(() => {
    return CLIMATE_TABS.map(c => ({
      id: c.id,
      label: c.label,
      subLabel: c.subLabel,
      badge: c.badge,
      icon: CloudSun
    }));
  }, []);

  const handlePeriodSelect = useCallback((periodId: string) => {
    setSelectedPeriod(periodId);
  }, []);

  const handleAreaSelect = useCallback((areaId: string) => {
    setSelectedArea(areaId);
    setAreaNavSignal({ areaId, timestamp: Date.now() });

    if (areaId !== 'all') {
      const currentHasArea = taxonHasArea(activeQuery, areaId);
      if (currentHasArea) {
        const matchIdx = markers.findIndex(m => isSiteInArea(m.name, areaId));
        if (matchIdx !== -1 && matchIdx !== currentIndex) {
          triggerSiteNavigation(markers[matchIdx], matchIdx, true);
        }
      } else {
        const dinosInArea = DINOSAUR_DB.filter(d => taxonHasArea(d.name, areaId));
        if (dinosInArea.length > 0) {
          handleQuerySelect(dinosInArea[0].name, areaId);
        }
      }
    }
  }, [activeQuery, markers, currentIndex, triggerSiteNavigation, handleQuerySelect]);

  const handleClimateSelect = useCallback((climateId: string) => {
    setSelectedClimate(climateId);
  }, []);

  const handleAgeMaSelect = useCallback((ageMa: number) => {
    let targetPeriod = 'all';
    let targetTaxa = activeQuery;

    if (ageMa > 201.3) {
      targetPeriod = 'triassic';
      const match = TAXA.find(t => {
        const dino = DINOSAUR_DB.find(d => d.name === t);
        return dino?.sites[0]?.geologicalContext.period.toLowerCase().includes('triassic');
      });
      if (match) targetTaxa = match;
    } else if (ageMa > 145.0) {
      targetPeriod = 'jurassic';
      const match = TAXA.find(t => {
        const dino = DINOSAUR_DB.find(d => d.name === t);
        return dino?.sites[0]?.geologicalContext.period.toLowerCase().includes('jurassic');
      });
      if (match) targetTaxa = match;
    } else {
      targetPeriod = 'cretaceous';
      const match = TAXA.find(t => {
        const dino = DINOSAUR_DB.find(d => d.name === t);
        return dino?.sites[0]?.geologicalContext.period.toLowerCase().includes('cretaceous');
      });
      if (match) targetTaxa = match;
    }

    setSelectedPeriod(targetPeriod);

    // Update selectedSite timeMarker dynamically so all place value conversion cards update live
    setSelectedSite(prev => {
      if (!prev) return prev;
      const tera = (ageMa / 1e6).toFixed(6) + ' Ta';
      const giga = (ageMa / 1e3).toFixed(3) + ' Ga';
      const mega = ageMa.toFixed(1) + ' Ma';

      return {
        ...prev,
        timeMarker: {
          eon: 'Phanerozoic',
          era: ageMa > 251.9 ? 'Paleozoic' : ageMa > 66.0 ? 'Mesozoic' : 'Cenozoic',
          period: ageMa > 201.3 ? 'Triassic' : ageMa > 145.0 ? 'Jurassic' : ageMa > 66.0 ? 'Cretaceous' : 'Neogene',
          epoch: ageMa > 145.0 ? 'Mesozoic Stratum' : ageMa > 66.0 ? 'Late Cretaceous' : 'Paleogene',
          ageStage: ageMa === 234 ? 'Carnian Pluvial' : ageMa === 154 ? 'Kimmeridgian' : ageMa === 95 ? 'Cenomanian' : ageMa === 66 ? 'Maastrichtian K-Pg' : `${ageMa} Ma Stage`,
          exactAgeMa: ageMa,
          scientificYears: `${(ageMa * 10).toFixed(2)} × 10⁶ yr`,
          placeValueDenomination: `${ageMa.toFixed(1)} Million Years (${(ageMa / 1000).toFixed(3)} Billion)`,
          teraAnnum: tera,
          gigaAnnum: giga,
          megaAnnum: mega,
          kiloAnnum: `${(ageMa * 1000).toLocaleString()} ka`,
          icsPeriodColor: ageMa > 201.3 ? '#812B92' : ageMa > 145.0 ? '#34B2C9' : '#7FB844',
          icsEpochColor: ageMa > 201.3 ? '#A259A8' : ageMa > 145.0 ? '#5CC3D6' : '#A6D277'
        }
      };
    });

    if (targetTaxa && targetTaxa !== activeQuery) {
      handleQuerySelect(targetTaxa);
    }
  }, [activeQuery, handleQuerySelect]);

  const hasActiveFilters = selectedPeriod !== 'all' || selectedArea !== 'all' || selectedClimate !== 'all';

  const clearAllFilters = useCallback(() => {
    setSelectedPeriod('all');
    setSelectedArea('all');
    setSelectedClimate('all');
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-park-card text-park-ink font-sans overflow-hidden relative selection:bg-park-land/40">
      
      {/* Top Navigation Bar: Nature Park Guide Styling with Dynamic Scrolling Filters */}
      <header className="flex-none border-b border-park-card-border bg-[#faf8f2] z-40 flex flex-col shadow-xs">
        
        {/* Tier 1 (Main Header Bar): Logo firmly aligned to Top Left, Atlases & Tools aligned to Top Right */}
        <div className="px-4 sm:px-6 py-2 bg-[#faf8f2] border-b border-park-card-border/60 flex items-center justify-between w-full min-w-0 gap-3">
          
          {/* Logo & Brand - Strictly Top Left */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-park-land/30 border border-park-border-green/40 flex items-center justify-center text-park-tree shadow-xs">
              <DinoIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-park-tree" />
            </div>
            <div>
              <div className="text-[20px] sm:text-[23px] font-hand font-bold text-park-ink leading-none">
                Dino-Draft
              </div>
              <span className="text-[8.5px] font-rounded font-semibold text-park-ink-muted block mt-0.5 whitespace-nowrap">
                Paleo Field Observatory
              </span>
            </div>
          </div>

          {/* Atlases, Displays & Exploration Controls - Strictly Top Right with Smooth Overflow Scrolling */}
          <div 
            onWheel={(e) => {
              if (e.deltaY !== 0 && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            className="flex items-center gap-2 min-w-0 max-w-full overflow-x-auto no-scrollbar scroll-smooth touch-pan-x ml-auto py-0.5 overscroll-x-contain"
          >
            {isAtlasDisplaysCollapsed ? (
              /* Collapsed Minimal Status Pill */
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  onClick={toggleAtlasDisplays}
                  className="flex items-center gap-2 bg-park-card-muted/80 hover:bg-white text-park-ink px-3 py-1.5 rounded-xl border border-park-card-border shadow-xs cursor-pointer transition-all group shrink-0"
                  title="Expand Atlases & Displays panel"
                >
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      layoutMode === 'builder' ? 'bg-rose-500' : 'bg-emerald-600'
                    } animate-pulse`} />
                    <span className="text-[10.5px] font-rounded font-bold text-park-ink whitespace-nowrap">
                      {layoutMode === 'builder' ? 'Dino Builder Atlas' : mapEngine === 'google_earth' ? 'Google Earth 3D' : 'Paleo Atlas'}
                    </span>
                    {layoutMode === 'comparison' && (
                      <span className="text-[8.5px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300 shrink-0">
                        Compare
                      </span>
                    )}
                  </div>
                  <span className="text-park-card-border text-xs">|</span>
                  <span className="text-[9.5px] font-rounded font-semibold text-park-ink-muted group-hover:text-park-ink flex items-center gap-1 shrink-0">
                    <span className="hidden sm:inline">Atlases & Displays</span>
                    <ChevronDown size={12} className="text-park-ink-muted group-hover:text-park-ink group-hover:translate-y-0.5 transition-transform" />
                  </span>
                </button>
                <button
                  onClick={() => setIsSearchPaletteOpen(true)}
                  className="p-1.5 rounded-xl bg-park-card-muted/80 text-park-ink-muted hover:text-park-ink hover:bg-white border border-park-card-border cursor-pointer shadow-xs shrink-0"
                  title="Quick Search (⌘K)"
                >
                  <Search size={13} className="text-amber-600" />
                </button>
              </div>
            ) : (
              /* Expanded Unified Observatory Command Deck Aligned to Right Margin */
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                {/* UNIFIED OBSERVATORY COMMAND DECK CONTAINER */}
                <div className="flex items-center gap-1 bg-[#f0ebd9] p-1 rounded-2xl border border-park-card-border/90 shadow-2xs shrink-0 max-w-full overflow-x-auto no-scrollbar">
                  
                  {/* SEGMENT 1: VIEWPORT LAYOUT MODE CONTROL */}
                  <div className="flex items-center gap-0.5 bg-white/80 p-0.5 rounded-xl border border-park-card-border/60 shrink-0">
                    <span className="hidden xl:inline text-[8px] font-mono uppercase tracking-wider text-park-ink-muted font-extrabold px-1.5 border-r border-park-card-border/60">
                      View
                    </span>
                    {isMobile ? (
                      /* Mobile Viewport Toggle */
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => setMobileActivePane('map')}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-rounded font-bold transition-all cursor-pointer ${
                            mobileActivePane === 'map' ? 'bg-emerald-800 text-white shadow-xs font-extrabold' : 'text-park-ink-muted hover:text-park-ink hover:bg-white/40'
                          }`}
                          title="Switch to 3D Map View"
                        >
                          <Globe size={11} className={mobileActivePane === 'map' ? 'text-emerald-200' : 'text-park-ink-muted'} />
                          <span>3D Map</span>
                        </button>
                        <button
                          onClick={() => setMobileActivePane('dossier')}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-rounded font-bold transition-all cursor-pointer ${
                            mobileActivePane === 'dossier' ? 'bg-emerald-800 text-white shadow-xs font-extrabold' : 'text-park-ink-muted hover:text-park-ink hover:bg-white/40'
                          }`}
                          title="Switch to Field Dossier View"
                        >
                          <BookOpen size={11} className={mobileActivePane === 'dossier' ? 'text-amber-200' : 'text-park-ink-muted'} />
                          <span>Dossier</span>
                        </button>
                      </div>
                    ) : (
                      /* Desktop Viewport Layout Modes */
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => {
                            setLayoutMode('map_fullscreen');
                            try { localStorage.setItem('dino_layout_mode', 'map_fullscreen'); } catch {}
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-rounded font-bold transition-all cursor-pointer ${
                            layoutMode === 'map_fullscreen' ? 'bg-park-tree text-white shadow-xs font-extrabold' : 'text-park-ink-muted hover:text-park-ink hover:bg-white/40'
                          }`}
                          title="100% Viewport Map"
                        >
                          Map 100%
                        </button>
                        <button
                          onClick={() => {
                            setLayoutMode('split');
                            if (sidebarWidth < 340) setSidebarWidth(530);
                            try { localStorage.setItem('dino_layout_mode', 'split'); } catch {}
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-rounded font-bold transition-all cursor-pointer ${
                            layoutMode === 'split' ? 'bg-park-tree text-white shadow-xs font-extrabold' : 'text-park-ink-muted hover:text-park-ink hover:bg-white/40'
                          }`}
                          title="Split View (Map + Dossier)"
                        >
                          Split
                        </button>
                        <button
                          onClick={() => {
                            setLayoutMode('dossier_fullscreen');
                            try { localStorage.setItem('dino_layout_mode', 'dossier_fullscreen'); } catch {}
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-rounded font-bold transition-all cursor-pointer ${
                            layoutMode === 'dossier_fullscreen' ? 'bg-park-tree text-white shadow-xs font-extrabold' : 'text-park-ink-muted hover:text-park-ink hover:bg-white/40'
                          }`}
                          title="100% Viewport Dossier"
                        >
                          Dossier 100%
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SEGMENT 2: ATLASES & VISUAL DISPLAYS DECK */}
                  <div className="flex items-center gap-0.5 bg-white/80 p-0.5 rounded-xl border border-park-card-border/60 shrink-0">
                    <span className="hidden xl:inline text-[8px] font-mono uppercase tracking-wider text-park-ink-muted font-extrabold px-1.5 border-r border-park-card-border/60">
                      Atlases
                    </span>
                    <button
                      onClick={() => {
                        setMapEngine('google_earth');
                        if (layoutMode === 'builder') setLayoutMode('split');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-rounded font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                        mapEngine === 'google_earth' && layoutMode !== 'comparison' && layoutMode !== 'builder'
                          ? 'bg-park-tree text-white shadow-xs font-extrabold'
                          : 'text-park-ink-muted hover:text-park-ink hover:bg-white/40'
                      }`}
                      title="Google Earth API: Photorealistic 3D Globe, Terrain Elevations, Orbit & Satellite Views"
                    >
                      <Globe size={11} className={mapEngine === 'google_earth' && layoutMode !== 'builder' && layoutMode !== 'comparison' ? 'text-emerald-300 animate-pulse' : 'text-park-ink-muted'} />
                      <span className="hidden sm:inline">Google Earth 3D</span>
                      <span className="sm:hidden">Earth 3D</span>
                    </button>
                    <button
                      onClick={() => {
                        setMapEngine('paleo_atlas');
                        if (layoutMode === 'builder') setLayoutMode('split');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-rounded font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                        mapEngine === 'paleo_atlas' && layoutMode !== 'comparison' && layoutMode !== 'builder'
                          ? 'bg-amber-800 text-white shadow-xs font-extrabold'
                          : 'text-park-ink-muted hover:text-amber-900 hover:bg-amber-50'
                      }`}
                      title="Paleo Atlas: Mesozoic Continental Drift & Expedition Trails"
                    >
                      <Layers size={11} />
                      <span className="hidden sm:inline">Paleo Atlas</span>
                      <span className="sm:hidden">Paleo</span>
                    </button>
                    <button
                      onClick={() => {
                        if (layoutMode === 'builder') {
                          setLayoutMode('split');
                        } else {
                          setLayoutMode('builder');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-rounded font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs shrink-0 ${
                        layoutMode === 'builder'
                          ? 'bg-rose-700 text-white font-extrabold ring-1 ring-rose-400'
                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                      }`}
                      title="Open Gamified Dinosaur Builder Studio across Organ System Levels"
                    >
                      <Dna size={11} className={layoutMode === 'builder' ? 'text-white' : 'text-rose-600'} />
                      <span className="hidden sm:inline">{layoutMode === 'builder' ? 'Exit Builder' : 'Dino Builder Atlas'}</span>
                      <span className="sm:hidden">{layoutMode === 'builder' ? 'Exit' : 'Builder'}</span>
                    </button>
                  </div>

                  {/* SEGMENT 3: WORKSPACE TOOLS & UTILITIES */}
                  <div className="flex items-center gap-0.5 bg-white/80 p-0.5 rounded-xl border border-park-card-border/60 shrink-0">
                    <span className="hidden xl:inline text-[8px] font-mono uppercase tracking-wider text-park-ink-muted font-extrabold px-1.5 border-r border-park-card-border/60">
                      Tools
                    </span>
                    <button
                      onClick={() => {
                        if (layoutMode === 'comparison') {
                          closeComparisonMode();
                        } else {
                          openComparisonMode();
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-rounded font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs shrink-0 ${
                        layoutMode === 'comparison'
                          ? 'bg-emerald-800 text-white shadow-xs font-extrabold'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                      title="Compare Visual Displays Side-by-Side or in Responsive Flex-Grid"
                    >
                      <LayoutGrid size={11} className={layoutMode === 'comparison' ? 'text-white' : 'text-emerald-700'} />
                      <span className="hidden sm:inline">{layoutMode === 'comparison' ? 'Exit Compare' : 'Compare Displays'}</span>
                      <span className="sm:hidden">{layoutMode === 'comparison' ? 'Exit' : 'Compare'}</span>
                    </button>
                    <button
                      onClick={() => setIsSearchPaletteOpen(true)}
                      className="px-2 py-1 rounded-lg text-[10.5px] font-rounded font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-park-ink-muted hover:text-park-ink hover:bg-white/40 shrink-0"
                      title="Quick Search Taxa & Formations (Press ⌘K or /)"
                    >
                      <Search size={11} className="text-amber-600" />
                      <span className="hidden md:inline">Search</span>
                      <kbd className="text-[8px] font-mono bg-white/80 px-1 py-0.2 rounded border border-park-card-border text-park-ink-muted">⌘K</kbd>
                    </button>
                    <button
                      onClick={() => setIsHotkeysModalOpen(true)}
                      className="px-2 py-1 rounded-lg text-[10.5px] font-rounded font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-park-ink-muted hover:text-park-ink hover:bg-white/40 hidden sm:flex shrink-0"
                      title="Researcher Hotkeys Guide (Press ?)"
                    >
                      <Keyboard size={11} className="text-park-tree" />
                      <span className="hidden md:inline">Hotkeys</span>
                      <kbd className="text-[8px] font-mono bg-white/80 px-1 py-0.2 rounded border border-park-card-border text-park-ink-muted">?</kbd>
                    </button>
                    <button
                      onClick={toggleHeaderFilters}
                      className="px-2 py-1 rounded-lg text-[10.5px] font-rounded font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-park-tree hover:bg-white/60 bg-park-card-muted/80 border border-park-card-border shrink-0 shadow-2xs"
                      title={isHeaderFiltersCollapsed ? "Expand filters & species selection ribbon" : "Collapse filters ribbon to maximize viewport"}
                    >
                      <SlidersHorizontal size={11} className="text-park-tree" />
                      <span className="hidden sm:inline">{isHeaderFiltersCollapsed ? 'Filters' : 'Hide Filters'}</span>
                      {isHeaderFiltersCollapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                    </button>
                  </div>

                  {/* Collapse Panel Button */}
                  <button
                    onClick={toggleAtlasDisplays}
                    className="p-1.5 text-park-ink-muted hover:text-park-ink rounded-xl bg-white hover:bg-park-land/30 transition-all cursor-pointer shadow-2xs flex items-center justify-center shrink-0 border border-park-card-border/80"
                    title="Collapse Observatory Command Deck"
                    aria-label="Collapse Observatory Command Deck"
                  >
                    <ChevronUp size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tier 2 & Tier 3: Navigation Categories Strip & Dynamic Scrollable Ribbon (Collapsible) */}
        {!isHeaderFiltersCollapsed ? (
          <div className="border-b border-park-card-border/60 transition-all duration-300 animate-in fade-in">
            {/* Tier 2: Navigation Categories Strip */}
            <div className="px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3 sm:gap-4 w-full min-w-0 border-b border-park-card-border/60 bg-[#faf8f2]">
              
              {/* Navigation Category Switcher Tabs */}
              <div 
                onWheel={(e) => {
                  if (e.deltaY !== 0 && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
                className="flex items-center gap-1.5 bg-park-card-muted/80 p-1 rounded-xl border border-park-card-border shrink-0 max-w-full overflow-x-auto no-scrollbar scroll-smooth touch-pan-x overscroll-x-contain"
              >
                <button
                  onClick={() => setActiveFilterCategory('taxa')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-rounded font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    activeFilterCategory === 'taxa'
                      ? 'bg-white text-park-tree shadow-xs border border-park-card-border'
                      : 'text-park-ink-muted hover:text-park-ink hover:bg-white/40'
                  }`}
                >
                  <span>🦖 Dinosaurs ({taxaTabItems.length})</span>
                </button>
                <button
                  onClick={() => setActiveFilterCategory('period')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-rounded font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    activeFilterCategory === 'period'
                      ? 'bg-purple-900 text-white shadow-xs font-extrabold'
                      : 'text-park-ink-muted hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <Clock size={11} />
                  <span>Geological Periods</span>
                  {selectedPeriod !== 'all' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveFilterCategory('area')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-rounded font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    activeFilterCategory === 'area'
                      ? 'bg-emerald-800 text-white shadow-xs font-extrabold'
                      : 'text-park-ink-muted hover:text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <Compass size={11} />
                  <span>Geographic Areas</span>
                  {selectedArea !== 'all' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveFilterCategory('climate')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-rounded font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    activeFilterCategory === 'climate'
                      ? 'bg-amber-800 text-white shadow-xs font-extrabold'
                      : 'text-park-ink-muted hover:text-amber-900 hover:bg-amber-50'
                  }`}
                >
                  <CloudSun size={11} />
                  <span>Paleoclimate Biomes</span>
                  {selectedClimate !== 'all' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
              </div>

              {/* Action Tools & Prominent Collapse Button on Tier 2 */}
              <div className="flex items-center gap-2 shrink-0">
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-rounded font-bold hover:bg-rose-100 transition-all shrink-0 cursor-pointer"
                    title="Clear all active period, area, and climate filters"
                  >
                    <X size={11} />
                    <span>Reset Filters</span>
                  </button>
                )}

                <button
                  onClick={toggleHeaderFilters}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-park-card-muted/90 hover:bg-white border border-park-card-border text-park-tree text-[10.5px] font-rounded font-bold transition-all shrink-0 cursor-pointer shadow-3xs"
                  title="Collapse Dinosaurs & Filters Panel to maximize map viewport"
                >
                  <ChevronUp size={12} />
                  <span className="hidden sm:inline">Collapse Panel</span>
                </button>
              </div>
            </div>

            {/* Tier 3: Dynamic Scrollable Ribbon */}
            <div className="px-4 sm:px-6 py-1.5 flex flex-row items-center w-full min-w-0 bg-[#faf8f2]/90">
              {activeFilterCategory === 'taxa' && (
                <DinosaurTaxaTabs
                  taxaList={filteredTaxa}
                  activeTaxa={activeQuery}
                  onSelectTaxa={handleQuerySelect}
                  onToggleCollapse={toggleHeaderFilters}
                />
              )}

              {activeFilterCategory === 'period' && (
                <ScrollableTabGroup
                  items={periodTabItems}
                  activeId={selectedPeriod}
                  onSelect={handlePeriodSelect}
                  variant="period"
                  ariaLabel="Filter by Geological Period"
                />
              )}

              {activeFilterCategory === 'area' && (
                <ScrollableTabGroup
                  items={areaTabItems}
                  activeId={selectedArea}
                  onSelect={handleAreaSelect}
                  variant="area"
                  ariaLabel="Filter by Geographic Area"
                />
              )}

              {activeFilterCategory === 'climate' && (
                <ScrollableTabGroup
                  items={climateTabItems}
                  activeId={selectedClimate}
                  onSelect={handleClimateSelect}
                  variant="climate"
                  ariaLabel="Filter by Paleoclimate Biome"
                />
              )}
            </div>
          </div>
        ) : (
          /* Sleek Collapsed Bar that allows expanding in 1 click */
          <div className="px-4 sm:px-6 py-1.5 bg-[#faf8f2] border-b border-park-card-border/60 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-rounded font-extrabold text-park-tree min-w-0">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-park-tree text-white text-[11px] shadow-3xs shrink-0">
                <span>🦖 Active Taxa:</span>
                <strong className="underline underline-offset-2">{activeQuery}</strong>
              </span>
              {hasActiveFilters && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <span>Filtered ({filteredTaxa.length}/{taxaTabItems.length})</span>
                </span>
              )}
            </div>

            <button
              onClick={toggleHeaderFilters}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-park-tree text-white text-[10.5px] font-rounded font-bold hover:bg-park-tree/90 transition-all shrink-0 cursor-pointer shadow-2xs"
              title="Expand Dinosaurs & Filters Panel"
            >
              <ChevronDown size={12} />
              <span>Expand Dinosaurs & Filters ({filteredTaxa.length})</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area: Resizable Map Window + Resizable Info Panel OR Full-Screen Comparison Studio */}
      {layoutMode === 'comparison' ? (
        <div className="flex-1 w-full h-full relative overflow-hidden">
          <React.Suspense fallback={<MapLoadingSkeleton />}>
            <WorkspaceComparisonStudio
              primaryTaxa={activeQuery}
              primarySite={selectedSite}
              primaryMarkers={markers}
              primaryBlueprintImage={blueprintImage}
              primaryImgLoading={imgLoading}
              plottingConfig={plottingConfig}
              onUpdatePlottingConfig={handleUpdatePlottingConfig}
              isPlottingPanelOpen={isPlottingPanelOpen}
              onTogglePlottingPanel={handleTogglePlottingPanel}
              selectedArea={selectedArea}
              areaNavSignal={areaNavSignal}
              siteNavSignal={siteNavSignal}
              currentIndex={currentIndex}
              onPrevSite={goToPrevSite}
              onNextSite={goToNextSite}
              onMarkerClick={(site) => triggerSiteNavigation(site)}
              onSelectTab={(tab) => {
                setActiveTab(tab as TabType);
              }}
              onCloseComparison={closeComparisonMode}
              initialSecondaryMode={initialComparisonMode}
            />
          </React.Suspense>
        </div>
      ) : layoutMode === 'builder' ? (
        <div className="flex-1 w-full h-full relative overflow-y-auto p-4 sm:p-6 bg-[#faf8f2]">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-park-card-border shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                  DEDICATED WORKSPACE
                </span>
                <span className="text-xs font-rounded font-extrabold text-park-tree">
                  Anatomical Atlas & Organ System Synthesizer
                </span>
              </div>
              <button
                onClick={() => setLayoutMode('split')}
                className="px-3 py-1 rounded-xl bg-park-tree text-white text-xs font-rounded font-bold hover:bg-emerald-800 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>Return to Field Observatory</span>
                <ChevronRight size={13} />
              </button>
            </div>
            <React.Suspense fallback={<TabLoadingSkeleton />}>
              <AnatomicalSynthesizerBuilder
                onDeployToObservatory={(specimen) => {
                  if (specimen?.name && specimen?.metrics) {
                    const dietType = specimen.organState?.skullType === 'theropod_carnivore'
                      ? 'Carnivore'
                      : specimen.organState?.skullType === 'spinosaur_snout'
                        ? 'Piscivore / Carnivore'
                        : 'Herbivore';

                    const newEntry = {
                      name: specimen.name,
                      summary: `Synthesized anatomical specimen constructed in Dino Builder. Demonstrates calculated body mass of ${specimen.metrics.massKg.toLocaleString()} kg, peak bite force of ${specimen.metrics.biteForceN.toLocaleString()} N, and top sprint velocity of ${specimen.metrics.topSpeedKmh} km/h with ${specimen.metrics.respirationEff}% respiratory efficiency.`,
                      metadata: {
                        threatLevel: specimen.metrics.biteForceN > 35000 ? "APEX PREDATOR - EXTREME" : "SYNTHETIC SPECIMEN",
                        threatScore: specimen.metrics.biteForceN > 35000 ? 5 : 3,
                        diet: dietType,
                        packBehavior: "Synthesized Morphotype",
                        integument: specimen.organState?.integumentCoating ? specimen.organState.integumentCoating.replace(/_/g, ' ') : "Synthesized",
                        flight: "None",
                        osteologicalCompleteness: 100
                      },
                      sites: [
                        {
                          name: "Paleo Synthesizer Bio-Station Horizon",
                          coordinates: { lat: 44.5, lng: -108.5 },
                          geologicalContext: { era: "Mesozoic", period: "Late Cretaceous", climate: "Subtropical Floodplain", age: "68 Ma" },
                          inventory: [
                            { name: "Cranial Holotype", description: "Near-complete cranium showing synthesized jaw apparatus.", category: "skull" as const },
                            { name: "Postcranial Axial Framework", description: "Complete articulated axial skeleton and appendicular limbs.", category: "skeleton" as const }
                          ],
                          stats: [
                            { label: "BODY MASS", value: `${specimen.metrics.massKg.toLocaleString()} KG`, subtext: `${specimen.metrics.massTons} Tons`, iconType: "status" as const },
                            { label: "TOP SPEED", value: `${specimen.metrics.topSpeedKmh} KM/H`, subtext: "Digitigrade Sprint", iconType: "status" as const },
                            { label: "BITE FORCE", value: `${specimen.metrics.biteForceN.toLocaleString()} N`, subtext: "Biomechanical Peak", iconType: "status" as const }
                          ]
                        }
                      ]
                    };

                    registerSyntheticDinosaur(newEntry);
                    setDinoDbVersion(v => v + 1);
                    handleQuerySelect(specimen.name);
                  }
                  setLayoutMode('split');
                }}
                onNavigateToTab={(tab) => {
                  setActiveTab(tab as TabType);
                  setLayoutMode('split');
                }}
              />
            </React.Suspense>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-row overflow-hidden relative">
          
          {/* Left Column: Full Canvas Interactive Map */}
          <main 
            style={{ 
              display: (isMobile && layoutMode === 'split' && mobileActivePane === 'dossier') || isMapCollapsed ? 'none' : 'block',
              width: isMapCollapsed ? 0 : (isMobile ? '100%' : undefined)
            }}
            className="flex-1 h-full relative group/map overflow-hidden min-w-0"
          >
            {/* Top-Left Viewport Mode Selector Overlay */}
            <div className="absolute top-4 left-4 z-35 flex items-center bg-white/95 border-2 border-white/80 rounded-full shadow-md p-1 backdrop-blur-xs">
              <button
                onClick={() => {
                  setLayoutMode('map_fullscreen');
                  try { localStorage.setItem('dino_layout_mode', 'map_fullscreen'); } catch {}
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  layoutMode === 'map_fullscreen' ? 'bg-park-tree text-white shadow-xs' : 'text-park-ink-muted hover:text-park-tree'
                }`}
                title="100% Fullscreen Map (Collapse Field Dossier)"
              >
                <Maximize2 size={11} />
                <span>Map 100%</span>
              </button>
              <button
                onClick={() => {
                  setLayoutMode('split');
                  if (sidebarWidth < 340) setSidebarWidth(530);
                  try { localStorage.setItem('dino_layout_mode', 'split'); } catch {}
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  layoutMode === 'split' ? 'bg-park-tree text-white shadow-xs' : 'text-park-ink-muted hover:text-park-tree'
                }`}
                title="Split Map & Field Dossier View"
              >
                <Columns size={11} />
                <span>Split View</span>
              </button>
              <button
                onClick={() => {
                  setLayoutMode('dossier_fullscreen');
                  try { localStorage.setItem('dino_layout_mode', 'dossier_fullscreen'); } catch {}
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  layoutMode === 'dossier_fullscreen' ? 'bg-park-tree text-white shadow-xs' : 'text-park-ink-muted hover:text-park-tree'
                }`}
                title="100% Fullscreen Field Dossier (Collapse Map)"
              >
                <BookOpen size={11} />
                <span>Dossier 100%</span>
              </button>
              <button
                onClick={() => openComparisonMode()}
                className={`px-2.5 py-1 rounded-full text-[10px] font-rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  layoutMode === 'comparison' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-park-ink-muted hover:text-amber-700'
                }`}
                title="Compare Visual Displays Side-by-Side in Responsive Flex Grid"
              >
                <LayoutGrid size={11} />
                <span>Compare ⊞</span>
              </button>
            </div>

          <React.Suspense fallback={<MapLoadingSkeleton />}>
            {mapEngine === 'google_earth' ? (
              <GoogleEarthViewer 
                markers={markers}
                selectedMarkerId={siteNavSignal?.site?.name || markers[currentIndex]?.name || selectedSite?.name}
                onMarkerClick={(site) => {
                  triggerSiteNavigation(site);
                  if (layoutMode === 'map_fullscreen') setLayoutMode('split');
                }}
                activeTaxaName={activeQuery}
                paleoData={selectedSite}
                activeWaypoint={activeWaypoint}
                plottingConfig={plottingConfig}
                onChangePlottingConfig={handleUpdatePlottingConfig}
                isPlottingPanelOpen={isPlottingPanelOpen}
                onTogglePlottingPanel={handleTogglePlottingPanel}
                activeGeographicArea={selectedArea}
                areaNavSignal={areaNavSignal}
                siteNavSignal={siteNavSignal}
                currentIndex={currentIndex}
                onPrevSite={goToPrevSite}
                onNextSite={goToNextSite}
                onSelectTab={(tab) => {
                  setActiveTab(tab as TabType);
                  if (layoutMode === 'map_fullscreen') setLayoutMode('split');
                  if (isMobile) setMobileActivePane('dossier');
                }}
                onSwitchToPaleoMap={() => setMapEngine('paleo_atlas')}
              />
            ) : (
              <MapCanvas 
                markers={markers} 
                selectedMarkerId={siteNavSignal?.site?.name || markers[currentIndex]?.name || selectedSite?.name} 
                currentIndex={currentIndex}
                siteNavSignal={siteNavSignal}
                onMarkerClick={(site) => {
                  triggerSiteNavigation(site);
                  if (layoutMode === 'map_fullscreen') setLayoutMode('split');
                }} 
                activeTaxaName={activeQuery}
                paleoData={selectedSite}
                activeWaypoint={activeWaypoint}
                plottingConfig={plottingConfig}
                onChangePlottingConfig={handleUpdatePlottingConfig}
                isPlottingPanelOpen={isPlottingPanelOpen}
                onTogglePlottingPanel={handleTogglePlottingPanel}
                activeGeographicArea={selectedArea}
                areaNavSignal={areaNavSignal}
                onSwitchToGoogleEarth={() => setMapEngine('google_earth')}
                onPrevSite={goToPrevSite}
                onNextSite={goToNextSite}
                onSelectTab={(tab) => {
                  setActiveTab(tab as TabType);
                  if (layoutMode === 'map_fullscreen') setLayoutMode('split');
                  if (isMobile) setMobileActivePane('dossier');
                }}
              />
            )}
          </React.Suspense>
           
           {/* Previous Site Nav Button with Minimal Viewport Direction Tooltip */}
           {activeQuery && markers.length > 0 && (
             <>
               <div className="absolute inset-y-0 left-0 flex items-center px-4 pointer-events-none z-35">
                  <button 
                    onClick={(e) => { e.stopPropagation(); goToPrevSite(); }}
                    disabled={markers.length <= 1}
                    className="w-11 h-11 bg-white/95 border-2 border-white/80 rounded-full flex items-center justify-center text-park-tree pointer-events-auto hover:bg-park-land/30 hover:scale-110 active:scale-95 transition-all shadow-md disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed group"
                    title={`⬅ Viewport Direction: Previous Excavation Locality (${((currentIndex - 1 + markers.length) % markers.length) + 1} of ${markers.length}) • ${markers[(currentIndex - 1 + markers.length) % markers.length]?.name || ''}`}
                    aria-label="Navigate to previous excavation site"
                  >
                    <ChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
                  </button>
               </div>

               {/* Next Site Nav Button with Minimal Viewport Direction Tooltip */}
               <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none z-35">
                  <button 
                    onClick={(e) => { e.stopPropagation(); goToNextSite(); }}
                    disabled={markers.length <= 1}
                    className="w-11 h-11 bg-white/95 border-2 border-white/80 rounded-full flex items-center justify-center text-park-tree pointer-events-auto hover:bg-park-land/30 hover:scale-110 active:scale-95 transition-all shadow-md disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed group"
                    title={`➡ Viewport Direction: Next Excavation Locality (${((currentIndex + 1) % markers.length) + 1} of ${markers.length}) • ${markers[(currentIndex + 1) % markers.length]?.name || ''}`}
                    aria-label="Navigate to next excavation site"
                  >
                    <ChevronRight size={22} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
               </div>
               
               {/* Bottom Center Site Indicator Pill */}
               <div 
                 onClick={() => {
                   const currentMarker = markers[currentIndex] || markers[0];
                   if (currentMarker) {
                     triggerSiteNavigation(currentMarker, currentIndex);
                   }
                 }}
                 className="absolute bottom-5 left-1/2 -translate-x-1/2 scale-[1.2] origin-bottom flex items-center gap-2 bg-white/95 border-2 border-white/80 px-4 py-1.5 rounded-full shadow-md z-35 pointer-events-auto cursor-pointer hover:bg-park-land/30 hover:scale-[1.25] active:scale-[1.18] transition-all"
                 title={`Click to focus map camera on ${markers[currentIndex]?.name || 'current site'}`}
               >
                  <div className="w-2 h-2 rounded-full bg-park-accent-green animate-pulse"></div>
                  <span className="text-[11px] font-rounded font-extrabold text-park-ink tracking-wide">
                    Fossil Site {markers.length > 0 ? currentIndex + 1 : 0} of {markers.length}
                  </span>
                  <span className="text-[10px] font-hand font-bold text-park-ink-muted">
                    • {markers[currentIndex]?.name || 'Loading'}
                  </span>
               </div>
             </>
           )}

           {/* Floating Open Dossier Button when Panel is Collapsed */}
           {isSidebarCollapsed && (
             <div className="absolute top-5 right-5 z-40 animate-in">
               <button
                 onClick={() => {
                   setLayoutMode('split');
                   if (sidebarWidth < 340) setSidebarWidth(530);
                   try { localStorage.setItem('dino_layout_mode', 'split'); } catch {}
                 }}
                 className="flex items-center gap-2 px-3.5 py-2.5 bg-white/95 border-2 border-park-border-green/60 text-park-tree rounded-2xl shadow-lg hover:bg-park-land/20 hover:scale-105 active:scale-95 transition-all font-rounded font-bold text-[12px] cursor-pointer"
                 title="Open Scientific Field Dossier Panel"
               >
                 <BookOpen size={16} className="text-park-accent-green" />
                 <span>Open Field Dossier</span>
                 <ChevronLeft size={14} />
               </button>
             </div>
           )}
        </main>

        {/* Resizable Draggable Divider (Hidden on mobile) */}
        {!isSidebarCollapsed && !isMapCollapsed && !isMobile && (
          <ResizableSplitter
            currentWidth={effectiveSidebarWidth}
            onResize={handleSidebarResize}
            minWidth={320}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => {
              setLayoutMode('map_fullscreen');
              try { localStorage.setItem('dino_layout_mode', 'map_fullscreen'); } catch {}
            }}
            onResetDefault={() => handleSidebarResize(isTablet ? Math.round(windowWidth * 0.44) : 530)}
          />
        )}

        {/* Right Sidebar: Nature Field Journal / Scientific Dossier (Resizable, Scrollable, Zoomable) */}
        <aside 
          style={{ 
            width: isSidebarCollapsed || (isMobile && layoutMode === 'split' && mobileActivePane === 'map')
              ? 0 
              : isMapCollapsed || isMobile 
                ? '100%' 
                : `${effectiveSidebarWidth}px`,
            display: isSidebarCollapsed || (isMobile && layoutMode === 'split' && mobileActivePane === 'map')
              ? 'none' 
              : 'flex'
          }}
          className={`bg-[#faf8f3] flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-10 overflow-hidden relative border-l border-park-card-border ${
            isMapCollapsed || isMobile ? 'flex-1 w-full' : 'shrink-0'
          } transition-[width] duration-75 ease-out`}
        >
          {/* Floating Restore Map Button when Map is Collapsed into 100% Dossier Fullscreen */}
          {isMapCollapsed && (
            <div className="absolute top-3 left-3 z-40 animate-in">
              <button
                onClick={() => {
                  setLayoutMode('split');
                  setSidebarWidth(530);
                  try { localStorage.setItem('dino_layout_mode', 'split'); } catch {}
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/95 border-2 border-park-border-green/60 text-park-tree rounded-xl shadow-lg hover:bg-park-land/20 hover:scale-105 active:scale-95 transition-all font-rounded font-bold text-[11px] cursor-pointer"
                title="Restore Map & Dossier Split View"
              >
                <Globe size={14} className="text-park-accent-green" />
                <span>Restore Map View</span>
                <ChevronRight size={12} />
              </button>
            </div>
          )}

          {/* Top Dossier Control Bar: Progress, Layout Presets, and Font/View Zoom Stepper */}
          <div className="flex-none bg-[#faf8f2] border-b border-park-card-border px-3.5 py-1.5 flex items-center justify-between gap-2 z-20 flex-wrap">
            {/* Left: Journal Title & Species */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-hand text-sm font-bold text-park-tree tracking-wide truncate">
                Paleo Field Dossier
              </span>
              <span className="text-[8.5px] font-mono text-park-ink-muted font-bold bg-white px-1.5 py-0.5 rounded border border-park-card-border shrink-0">
                {activeQuery.replace(/\s+/g, '_').toUpperCase()}
              </span>
            </div>

            {/* Right: Layout Preset Controls & Expandable Controls Toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Mobile Integrated View Switcher in Top Navigation Panel */}
              {isMobile && (
                <div className="flex items-center bg-slate-900 text-white rounded-lg p-0.5 border border-slate-700 shadow-2xs shrink-0">
                  <button
                    onClick={() => setMobileActivePane('map')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[9.5px] font-rounded font-bold transition-all cursor-pointer ${
                      mobileActivePane === 'map' ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Switch to 3D Map View"
                  >
                    <Globe size={11} className={mobileActivePane === 'map' ? 'text-slate-950' : 'text-emerald-400'} />
                    <span>3D Map</span>
                  </button>
                  <button
                    onClick={() => setMobileActivePane('dossier')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[9.5px] font-rounded font-bold transition-all cursor-pointer ${
                      mobileActivePane === 'dossier' ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Switch to Field Dossier View"
                  >
                    <BookOpen size={11} className={mobileActivePane === 'dossier' ? 'text-slate-950' : 'text-amber-400'} />
                    <span>Dossier</span>
                  </button>
                </div>
              )}

              {/* Fullscreen & Split View Switcher */}
              <div className="hidden sm:flex items-center bg-white rounded-lg p-0.5 border border-park-card-border shadow-2xs">
                <button
                  onClick={() => {
                    setLayoutMode('map_fullscreen');
                    try { localStorage.setItem('dino_layout_mode', 'map_fullscreen'); } catch {}
                  }}
                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-rounded font-bold transition-colors ${
                    layoutMode === 'map_fullscreen' ? 'bg-park-tree text-white' : 'text-park-ink-muted hover:text-park-tree'
                  }`}
                  title="100% Viewport Map"
                >
                  Map 100%
                </button>
                <button
                  onClick={() => {
                    setLayoutMode('split');
                    if (sidebarWidth < 340) setSidebarWidth(530);
                    try { localStorage.setItem('dino_layout_mode', 'split'); } catch {}
                  }}
                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-rounded font-bold transition-colors ${
                    layoutMode === 'split' ? 'bg-park-tree text-white' : 'text-park-ink-muted hover:text-park-tree'
                  }`}
                  title="Split View (Map + Dossier)"
                >
                  Split
                </button>
                <button
                  onClick={() => {
                    setLayoutMode('dossier_fullscreen');
                    try { localStorage.setItem('dino_layout_mode', 'dossier_fullscreen'); } catch {}
                  }}
                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-rounded font-bold transition-colors ${
                    layoutMode === 'dossier_fullscreen' ? 'bg-park-tree text-white' : 'text-park-ink-muted hover:text-park-tree'
                  }`}
                  title="100% Viewport Dossier"
                >
                  Dossier 100%
                </button>
              </div>

              {/* Toggle Controls Drawer Button */}
              <button
                onClick={toggleDossierControlBar}
                className="px-2 py-1 bg-white rounded-lg border border-park-card-border flex items-center gap-1 text-[9px] font-rounded font-bold text-park-tree hover:bg-park-land/20 transition-all shadow-2xs cursor-pointer select-none shrink-0"
                title={isDossierControlBarCollapsed ? "Expand studio comparison and zoom controls" : "Collapse controls bar"}
              >
                <SlidersHorizontal size={10} className="text-park-accent-green" />
                <span className="hidden sm:inline">{isDossierControlBarCollapsed ? "Controls" : "Hide"}</span>
                {isDossierControlBarCollapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
              </button>
            </div>
          </div>

          {/* Secondary Dossier Toolbar Drawer (Visible when expanded) */}
          {!isDossierControlBarCollapsed && (
            <div className="flex-none bg-[#f4efe2] border-b border-park-card-border px-3.5 py-1.5 flex items-center justify-end gap-1.5 z-19 flex-wrap animate-in fade-in slide-in-from-top-1">
              {/* Side-by-Side Dual-Pane Compare Toggle */}
              <button
                onClick={() => {
                  if (layoutMode === 'comparison') {
                    setLayoutMode('split');
                    try { localStorage.setItem('dino_layout_mode', 'split'); } catch {}
                  } else {
                    const compareMode = activeTab === 'organs' ? 'organs'
                      : activeTab === 'locomotion' ? 'locomotion'
                      : activeTab === 'climate' ? 'climate'
                      : activeTab === 'elevation' ? 'elevation'
                      : activeTab === 'lifecycle' ? 'lifecycle'
                      : activeTab === 'cardinal' ? 'cardinal'
                      : 'blueprint';
                    openComparisonMode(compareMode as any);
                  }
                }}
                className={`px-2 py-1 rounded-lg border flex items-center gap-1 text-[9px] font-rounded font-bold transition-all shadow-2xs cursor-pointer ${
                  layoutMode === 'comparison'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                    : 'bg-white hover:bg-park-land/20 text-park-tree border-park-card-border'
                }`}
                title={layoutMode === 'comparison' ? "Exit Comparison Studio" : "Open Side-by-Side Multi-Viewport Studio"}
              >
                <Columns size={11} className={layoutMode === 'comparison' ? "text-amber-200" : "text-park-accent-green"} />
                <span>{layoutMode === 'comparison' ? 'Exit Side-by-Side' : 'Side-by-Side Studio'}</span>
              </button>

              {/* Reset Section Order Button */}
              <button
                onClick={resetDossierSectionOrder}
                className="px-1.5 py-1 bg-white rounded-lg border border-park-card-border flex items-center gap-1 text-[9px] font-rounded font-bold text-park-ink-muted hover:text-park-tree hover:bg-park-land/20 transition-all shadow-2xs cursor-pointer"
                title="Reset Field Dossier component order to default layout"
              >
                <RotateCcw size={10} />
                <span>Reset Order</span>
              </button>

              {/* Content Zoom Stepper (A- / 100% / A+) */}
              <div className="flex items-center bg-white rounded-lg p-0.5 border border-park-card-border shadow-2xs">
                <button
                  onClick={() => setDossierScale(prev => Math.max(0.85, Number((prev - 0.15).toFixed(2))))}
                  className="px-1.5 py-0.5 hover:bg-park-land/20 text-park-ink-muted hover:text-park-tree rounded text-[9.5px] font-rounded font-bold transition-colors"
                  title="Reduce Text & Content Density (Zoom Out)"
                  disabled={dossierScale <= 0.85}
                >
                  A-
                </button>
                <span 
                  onClick={() => setDossierScale(1.0)}
                  className="px-1 text-[9px] font-mono font-bold text-park-tree cursor-pointer hover:underline"
                  title="Click to reset to standard zoom (100%)"
                >
                  {Math.round(dossierScale * 100)}%
                </span>
                <button
                  onClick={() => setDossierScale(prev => Math.min(1.30, Number((prev + 0.15).toFixed(2))))}
                  className="px-1.5 py-0.5 hover:bg-park-land/20 text-park-ink-muted hover:text-park-tree rounded text-[9.5px] font-rounded font-bold transition-colors"
                  title="Enlarge Text & Content (Zoom In)"
                  disabled={dossierScale >= 1.30}
                >
                  A+
                </button>
              </div>

              {/* Expand / Collapse All Fields in Dossier */}
              <button
                onClick={toggleAllSections}
                className="px-2 py-1 bg-white rounded-lg border border-park-card-border flex items-center gap-1 text-[9px] font-rounded font-bold text-park-tree hover:bg-park-land/20 transition-all shadow-2xs cursor-pointer select-none"
                title={areAllSectionsCollapsed ? "Expand all fields in dossier" : "Collapse all fields in dossier"}
              >
                <ChevronsUpDown size={11} className="text-park-accent-green" />
                <span>{areAllSectionsCollapsed ? "Expand All" : "Collapse All"}</span>
              </button>

              {/* Collapse Button */}
              <button
                onClick={() => {
                  setLayoutMode('map_fullscreen');
                  try { localStorage.setItem('dino_layout_mode', 'map_fullscreen'); } catch {}
                }}
                className="w-7 h-7 bg-white rounded-lg border border-park-card-border flex items-center justify-center text-park-ink-muted hover:text-park-tree hover:bg-park-land/20 transition-all shadow-2xs cursor-pointer"
                title="Collapse Dossier to Full Map View"
              >
                <Minimize2 size={12} />
              </button>
            </div>
          )}

          {/* Reading Scroll Progress Bar */}
          <div className="w-full h-1 bg-park-card-border/50 overflow-hidden flex-none">
            <div 
              ref={progressBarRef}
              className="h-full bg-park-accent-green transition-all duration-75 ease-out"
              style={{ width: '0%' }}
            />
          </div>

          {/* Clean Non-Floating Dossier Navigation Header */}
          {!collapsedSections.tabBar ? (
            <div id="field-journal-tab-group" className="bg-[#faf8f2] px-3 py-1.5 border-b border-park-card-border flex items-center justify-between gap-2 shrink-0 z-20 shadow-2xs">
              <div className="flex-1 min-w-0">
                <ScrollableTabGroup
                  items={JOURNAL_TABS}
                  activeId={activeTab}
                  onSelect={(id) => {
                    setActiveTab(id as TabType);
                    if (collapsedSections.tabContent) {
                      setCollapsedSections(prev => ({ ...prev, tabContent: false }));
                    }
                  }}
                  variant="journal"
                  ariaLabel="Select Field Journal Dossier Tab"
                />
              </div>
              <button
                onClick={() => toggleSection('tabBar')}
                className="px-2 py-1 bg-white hover:bg-park-land/20 border border-park-card-border rounded-lg text-park-tree text-[10px] font-rounded font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-3xs"
                title="Collapse Navigation Bar to maximize viewport height"
              >
                <ChevronUp size={12} />
                <span className="hidden sm:inline">Hide Bar</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#faf8f2] px-3 py-1 border-b border-park-card-border flex items-center justify-between gap-2 shrink-0 z-20 text-xs font-rounded font-bold text-park-tree">
              <span className="text-[10.5px] text-park-tree flex items-center gap-1 min-w-0 truncate">
                <span>Module:</span>
                <strong className="text-emerald-800 truncate">{JOURNAL_TABS.find(t => t.id === activeTab)?.label}</strong>
              </span>
              <button
                onClick={() => toggleSection('tabBar')}
                className="px-2 py-0.5 bg-park-tree text-white rounded-md text-[10px] font-rounded font-bold hover:bg-emerald-800 transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-3xs"
                title="Show Dossier Navigation Bar"
              >
                <ChevronDown size={12} />
                <span>Show Tabs</span>
              </button>
            </div>
          )}

          {/* Scrollable Dossier Content Area */}
          {selectedSite ? (
            <div 
              ref={journalScrollRef}
              onScroll={handleJournalScroll}
              className="flex-1 overflow-auto custom-scrollbar p-3 sm:p-5 space-y-4 relative min-w-0"
            >
              <div 
                className="space-y-4 origin-top transition-transform duration-100"
                style={{
                  zoom: dossierScale,
                }}
              >
                {/* Top Specialized Plotting Legend & Live Intelligence Header */}
                <InfoPanelLegendHeader
                  config={plottingConfig}
                  onChangeConfig={handleUpdatePlottingConfig}
                  isIntervalsOpen={isPlottingPanelOpen}
                  onToggleIntervals={handleTogglePlottingPanel}
                  markers={markers}
                  activeSite={selectedSite}
                  activeTaxaName={activeQuery}
                  isCollapsed={collapsedSections.legend}
                  onToggleCollapse={() => toggleSection('legend')}
                  activeTab={activeTab}
                  onSelectTab={(tabId) => setActiveTab(tabId as TabType)}
                />

                {/* Compact Specimen Taxon Header (Clean taxonomic identity with zero-pill discipline) */}
                <div className="border border-emerald-900/60 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-2xl shadow-xs overflow-hidden p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={11} className="text-amber-400" />
                      <span>TAXONOMIC SPECIMEN RECORD</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-hand font-bold text-white leading-tight truncate mt-0.5">
                      {activeQuery}
                    </h3>
                    <div className="text-[10.5px] font-rounded text-slate-300 font-medium flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-emerald-300 font-mono font-bold">{selectedSite.metadata?.diet || 'Carnivore'}</span>
                      <span className="text-slate-500" aria-hidden="true">·</span>
                      <span className="text-slate-200">{selectedSite.geologicalContext?.period || 'Late Cretaceous'}</span>
                      {selectedSite.timeMarker?.exactAgeMa && (
                        <>
                          <span className="text-slate-500" aria-hidden="true">·</span>
                          <span className="text-amber-300 font-mono font-bold">{selectedSite.timeMarker.exactAgeMa} Ma</span>
                        </>
                      )}
                      {selectedSite.geologicalContext?.formation && (
                        <>
                          <span className="text-slate-500" aria-hidden="true">·</span>
                          <span className="text-slate-400 text-[10px]">{selectedSite.geologicalContext.formation} Formation</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => openComparisonMode('organs')}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/15 text-[10px] font-rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs active:scale-95"
                      title="Open Side-by-Side Visual Comparison Studio"
                    >
                      <Columns size={12} className="text-amber-400" />
                      <span>Compare Studio</span>
                    </button>
                  </div>
                </div>

                {/* Tab Content Container */}
                {!collapsedSections.tabContent && (
                  <div className="border-t border-park-card-border pt-2 animate-in space-y-4">
                    
                    {/* OVERVIEW & BLUEPRINT TAB */}
                    {activeTab === 'overview' && (
                      <div className="animate-in space-y-4">
                        
                        {/* Unified Locality, Stratum Context & Osteology Panel (Top Panel right after navigation tab) */}
                        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-park-card-border shadow-xs space-y-4">
                          {/* Header: Location & Summary */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[13px] font-rounded font-extrabold text-park-tree flex items-center gap-1.5">
                                <MapPin size={14} className="text-park-accent-orange shrink-0" />
                                <span>{selectedSite.name}</span>
                              </h4>
                              <span className="text-[9.5px] font-mono font-bold bg-park-sand/80 text-park-tree px-2 py-0.5 rounded-md border border-park-card-border">
                                {selectedSite.timeMarker?.exactAgeMa ? `${selectedSite.timeMarker.exactAgeMa} Ma` : 'Stratum'}
                              </span>
                            </div>
                            <p className="text-[12px] font-rounded leading-relaxed text-park-ink/90">
                              {selectedSite.summary}
                            </p>
                          </div>

                          {/* Divider */}
                          <div className="h-px bg-park-card-border/60" />

                          {/* Stratum Context & Osteology Metrics Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 bg-park-sand/30 rounded-xl border border-park-card-border/60 flex flex-col justify-between">
                              <p className="text-[9px] font-rounded font-bold text-park-ink-muted uppercase tracking-wider">Period Index</p>
                              <p className="text-[12.5px] font-rounded font-bold text-park-tree mt-1">{selectedSite.geologicalContext.period}</p>
                            </div>

                            <div className="p-3 bg-park-sand/30 rounded-xl border border-park-card-border/60 flex flex-col justify-between">
                              <p className="text-[9px] font-rounded font-bold text-park-ink-muted uppercase tracking-wider">Climate Vector</p>
                              <p className="text-[12.5px] font-rounded font-bold text-park-tree mt-1">{selectedSite.geologicalContext.climate}</p>
                            </div>

                            <div className="p-3 bg-park-sand/30 rounded-xl border border-park-card-border/60 flex flex-col justify-between space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] font-rounded font-bold text-park-ink-muted uppercase tracking-wider">Completeness</p>
                                <span className="text-[11px] font-mono font-bold text-emerald-700">{selectedSite.metadata.osteologicalCompleteness}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${selectedSite.metadata.osteologicalCompleteness}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Systemic Causal Reasoning Nexus (Abduct -> Adduct -> Deduct -> Induct) */}
                        <ScientificReasoningNexus
                          site={selectedSite}
                          taxaName={activeQuery}
                          onNavigateToTab={(targetTab) => {
                            setActiveTab(targetTab as TabType);
                            if (collapsedSections.tabContent) {
                              setCollapsedSections(prev => ({ ...prev, tabContent: false }));
                            }
                          }}
                        />

                        {/* ZOOMABLE AI Anatomical Reconstruction Field Specimen Viewer (Collapsible) */}
                        <div className="rounded-2xl border border-park-card-border bg-white shadow-xs overflow-hidden transition-all">
                          <div 
                            onClick={() => toggleSection('blueprint')}
                            className="p-3 bg-park-sand/30 flex items-center justify-between border-b border-park-card-border/60 cursor-pointer hover:bg-park-sand/50 transition-colors select-none"
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles size={13} className="text-park-accent-yellow" />
                              <span className="text-[10.5px] font-rounded font-bold text-park-tree">
                                Specimen Blueprint & Anatomical Reconstruction
                              </span>
                              {blueprintImage && (
                                <span className="text-[8.5px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                                  Interactive
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSection('blueprint');
                              }}
                              className="p-1 text-park-ink-muted hover:text-park-tree rounded hover:bg-park-land/20 cursor-pointer"
                              title={collapsedSections.blueprint ? "Expand Blueprint Viewer" : "Collapse Blueprint Viewer"}
                            >
                              {collapsedSections.blueprint ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>
                          </div>
                          {!collapsedSections.blueprint && (
                            <div className="p-2 animate-in">
                              <React.Suspense fallback={<TabLoadingSkeleton />}>
                                <SpecimenBlueprintViewer
                                  blueprintImage={blueprintImage}
                                  imgLoading={imgLoading}
                                  activeTaxa={activeQuery}
                                  onRefresh={() => {
                                    currentBlueprintTaxa.current = null;
                                    updateBlueprint(activeQuery);
                                  }}
                                  onNavigateToTab={(targetTab) => {
                                    if (targetTab === 'builder') {
                                      setLayoutMode('builder');
                                    } else {
                                      setActiveTab(targetTab as TabType);
                                      if (collapsedSections.tabContent) {
                                        setCollapsedSections(prev => ({ ...prev, tabContent: false }));
                                      }
                                    }
                                  }}
                                />
                              </React.Suspense>
                            </div>
                          )}
                        </div>

                        {/* Timescale Bar (Collapsible) */}
                        <div className="rounded-2xl border border-park-card-border bg-white shadow-xs overflow-hidden transition-all">
                          <div 
                            onClick={() => toggleSection('timescale')}
                            className="p-3 bg-park-sand/30 flex items-center justify-between border-b border-park-card-border/60 cursor-pointer hover:bg-park-sand/50 transition-colors select-none"
                          >
                            <div className="flex items-center gap-2">
                              <Clock size={13} className="text-park-tree" />
                              <span className="text-[10.5px] font-rounded font-bold text-park-tree">
                                Geological Chrono-Stratigraphy
                              </span>
                              <span className="text-[8.5px] font-mono font-bold bg-park-sand/80 text-park-tree px-1.5 py-0.2 rounded border border-park-card-border">
                                {selectedSite.timeMarker?.exactAgeMa ? `${selectedSite.timeMarker.exactAgeMa} Ma` : 'Timescale'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSection('timescale');
                              }}
                              className="p-1 text-park-ink-muted hover:text-park-tree rounded hover:bg-park-land/20 cursor-pointer"
                              title={collapsedSections.timescale ? "Expand Chrono-Stratigraphy" : "Collapse Chrono-Stratigraphy"}
                            >
                              {collapsedSections.timescale ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>
                          </div>
                          {!collapsedSections.timescale && (
                            <div className="p-2 animate-in">
                              <TimeScaleBar 
                                timeMarker={selectedSite.timeMarker} 
                                onSelectAgeMa={handleAgeMaSelect}
                              />
                            </div>
                          )}
                        </div>

                        {/* Sympatric & Contemporaneous Fauna (Chronostratigraphic Cohort) */}
                        {sympatricTaxa.length > 0 && (
                          <div className="p-3.5 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/60 rounded-2xl border border-amber-200/80 shadow-xs space-y-2.5 transition-all">
                            <div className="flex items-center justify-between">
                              <div 
                                onClick={() => toggleSection('overviewSympatric')}
                                className="flex items-center gap-2 cursor-pointer flex-1 select-none"
                              >
                                <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                                  <Layers size={14} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h5 className="text-[11.5px] font-rounded font-extrabold text-amber-950">
                                      Sympatric & Contemporaneous Fauna
                                    </h5>
                                    <span className="text-[8px] font-mono font-bold uppercase bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300">
                                      Cohort
                                    </span>
                                  </div>
                                  <p className="text-[9px] font-rounded text-amber-800">
                                    Species sharing the {selectedSite.geologicalContext.period} horizon or excavation formation
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleSection('overviewSympatric')}
                                className="p-1 text-amber-800 hover:text-amber-950 cursor-pointer"
                                title={collapsedSections.overviewSympatric ? "Expand Sympatric Fauna" : "Collapse Sympatric Fauna"}
                              >
                                {collapsedSections.overviewSympatric ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                              </button>
                            </div>

                            {!collapsedSections.overviewSympatric && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 animate-in">
                                {sympatricTaxa.map((st) => (
                                  <button
                                    key={st.name}
                                    onClick={() => handleQuerySelect(st.name)}
                                    className="p-2.5 bg-white hover:bg-amber-50 rounded-xl border border-amber-200/60 hover:border-amber-400 text-left transition-all group cursor-pointer flex items-center justify-between shadow-2xs"
                                    title={`Switch observatory focus to sympatric species: ${st.name}`}
                                  >
                                    <div className="space-y-0.5 min-w-0 pr-1">
                                      <span className="text-[11px] font-rounded font-bold text-park-tree group-hover:text-amber-900 block truncate">
                                        {st.name}
                                      </span>
                                      <div className="flex items-center gap-1 text-[8.5px] font-rounded text-park-ink-muted">
                                        <span className={`font-semibold ${
                                          st.diet === 'Carnivore' ? 'text-rose-700' : 'text-emerald-700'
                                        }`}>
                                          {st.diet}
                                        </span>
                                        <span>•</span>
                                        <span className="truncate">{st.sharedFormation || st.period}</span>
                                      </div>
                                    </div>
                                    <ChevronRight size={13} className="text-amber-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  <React.Suspense fallback={<TabLoadingSkeleton />}>
                    {/* FEATURE: INTERACTIVE ORGAN SYSTEMS & VISCERA */}
                    {activeTab === 'organs' && (
                      <div className="animate-in">
                        <InteractiveOrganSystemViewer 
                          taxaName={activeQuery} 
                          onNavigateToTab={(targetTab) => {
                            setActiveTab(targetTab as TabType);
                            if (collapsedSections.tabContent) {
                              setCollapsedSections(prev => ({ ...prev, tabContent: false }));
                            }
                          }}
                          onClose={() => setActiveTab('overview')}
                        />
                      </div>
                    )}

                    {/* FEATURE: CARDINAL DIRECTIONALITY & NEIGHBOURING SITES RADAR */}
                    {activeTab === 'cardinal' && selectedSite && (
                      <div className="animate-in">
                        <NeighbouringExcavationRadar
                          currentSite={
                            markers[currentIndex] || 
                            markers.find(m => m.name === selectedSite.name) || {
                              id: `site-${selectedSite.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                              name: selectedSite.name,
                              lat: selectedSite.coordinates.lat,
                              lng: selectedSite.coordinates.lng,
                              elevationM: selectedSite.elevation?.paleoElevationM || 120,
                              climateBiome: selectedSite.geologicalContext?.climate
                            }
                          }
                          allSites={markers.length > 1 ? markers : allGlobalExcavationSites}
                          onSelectSite={(targetSite) => {
                            triggerSiteNavigation(targetSite);
                          }}
                          taxaName={activeQuery}
                          onClose={() => setActiveTab('overview')}
                        />
                      </div>
                    )}

                    {/* FEATURE 2: INTEGRATED CLIMATE & TERRAIN BIOME TAB */}
                    {activeTab === 'climate' && (
                      <div className="animate-in space-y-4">
                        <ClimateSpatioTemporal 
                          climate={selectedSite.climateVariables} 
                          periodName={selectedSite.geologicalContext?.period || selectedSite.timeMarker?.period || 'Late Cretaceous'}
                          exactAgeMa={selectedSite.timeMarker?.exactAgeMa || 68}
                          siteName={selectedSite.name}
                          taxaName={activeQuery}
                          onSelectTaxon={(dinoName) => handleQuerySelect(dinoName)}
                          onSelectTimePoint={(ageMa) => handleAgeMaSelect(ageMa)}
                        />
                      </div>
                    )}

                    {/* FEATURE 3: LOCOMOTION TYPE VISUALIZATION TAB */}
                    {activeTab === 'locomotion' && (
                      <div className="animate-in">
                        <LocomotionVisualizer locomotion={selectedSite.locomotion} taxaName={activeQuery} />
                      </div>
                    )}

                    {/* FEATURE 4: SPECIES LIFE CYCLE SPATIO-TEMPORAL LAPSE TAB */}
                    {activeTab === 'lifecycle' && (
                      <div className="animate-in">
                        <LifeCycleTemporalLapse 
                          ontogeny={selectedSite.ontogeny} 
                          migrationLapse={selectedSite.migrationLapse} 
                          taxaName={activeQuery}
                          onSelectWaypoint={(wp) => setActiveWaypoint(wp)}
                        />
                      </div>
                    )}

                    {/* FEATURE 10: EVOLUTIONARY CONTINUUM & DRIFT MAP */}
                    {activeTab === 'evolution' && (
                      <div className="animate-in">
                        <EvolutionaryChronologyMap
                          activeAgeMa={selectedSite.timeMarker?.exactAgeMa || 68}
                          onSelectAgeMa={handleAgeMaSelect}
                          timeMarker={selectedSite.timeMarker}
                          activeTaxaName={activeQuery}
                          onSelectTaxon={(dinoName) => handleQuerySelect(dinoName)}
                        />
                      </div>
                    )}

                    {/* FEATURE 11: ANATOMICAL SYNTHESIZER & DINOSAUR BUILDER */}
                    {activeTab === 'builder' && (
                      <div className="animate-in">
                        <AnatomicalSynthesizerBuilder
                          onDeployToObservatory={(specimen) => {
                            if (specimen?.name) {
                              handleQuerySelect(specimen.name);
                            }
                          }}
                          onNavigateToTab={(tab) => {
                            setActiveTab(tab as TabType);
                          }}
                          fossilFeatures={selectedSite.features}
                          activeTaxaName={activeQuery}
                        />
                      </div>
                    )}
                  </React.Suspense>

                  {/* Guided Progression Bar: Next Natural Step in Specimen Investigation */}
                  {(() => {
                    const stepInfo = TAB_PROGRESSION_MAP[activeTab];
                    if (!stepInfo) return null;
                    return (
                      <div className="mt-4 pt-3 border-t border-park-card-border/80 space-y-2">
                        <div className="flex items-center justify-between text-[9px] font-mono text-park-ink-muted uppercase tracking-wider font-bold">
                          <span className="flex items-center gap-1 text-emerald-800">
                            <Sparkles size={11} className="text-amber-500" />
                            <span>{stepInfo.stageCategory}</span>
                          </span>
                          <span>{stepInfo.stageIndex} of 9 Stages</span>
                        </div>

                        <div className="p-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl border border-emerald-500/40 shadow-md space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wide block">
                                Next Recommended Natural Step:
                              </span>
                              <h5 className="text-[12px] font-rounded font-extrabold text-white leading-tight truncate">
                                {stepInfo.nextLabel}
                              </h5>
                              <p className="text-[10px] text-slate-300 leading-snug font-rounded">
                                {stepInfo.nextSummary}
                              </p>
                            </div>
                            
                            {/* Quick Jump to Next Step Button */}
                            {stepInfo.nextTab && (
                              <button
                                onClick={() => {
                                  setActiveTab(stepInfo.nextTab as TabType);
                                  scrollToJournalTop();
                                }}
                                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-rounded font-extrabold text-[11px] flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer shrink-0 ml-2"
                                title={`Proceed to ${stepInfo.nextLabel}`}
                              >
                                <span>Next Step</span>
                                <ChevronRight size={13} strokeWidth={3} />
                              </button>
                            )}
                          </div>

                          {/* Secondary Stage Navigation: Previous Stage & Compare in Studio */}
                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-rounded flex-wrap gap-1.5">
                            {stepInfo.prevTab ? (
                              <button
                                onClick={() => {
                                  setActiveTab(stepInfo.prevTab as TabType);
                                  scrollToJournalTop();
                                }}
                                className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                                title="Go back to previous investigation stage"
                              >
                                <ChevronLeft size={12} />
                                <span>Back to {TAB_PROGRESSION_MAP[stepInfo.prevTab]?.currentTitle || 'Previous Stage'}</span>
                              </button>
                            ) : (
                              <span className="text-[9px] font-mono text-slate-500">First Investigation Stage</span>
                            )}

                            <button
                              onClick={() => openComparisonMode(stepInfo.compareMode)}
                              className="px-2 py-0.8 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1 cursor-pointer transition-all hover:scale-102"
                              title="Compare this module side-by-side with another display in the Flex-Grid Studio"
                            >
                              <LayoutGrid size={11} className="text-amber-400" />
                              <span>Compare Side-by-Side ⊞</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                )}
              </div>

              {/* Floating Scroll to Top Button */}
              {showScrollTop && (
                <div className="sticky bottom-3 right-3 flex justify-end pointer-events-none">
                  <button
                    onClick={scrollToJournalTop}
                    className="p-2.5 rounded-full bg-white/95 text-park-tree border border-park-card-border shadow-lg hover:bg-park-land/30 hover:scale-110 active:scale-95 transition-all pointer-events-auto flex items-center gap-1.5 text-[10px] font-rounded font-bold"
                    title="Scroll to Top of Dossier"
                  >
                    <ArrowUp size={13} strokeWidth={2.5} />
                    <span>Top</span>
                  </button>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
               <Loader2 size={48} className="text-park-tree mb-4 animate-spin opacity-80" />
               <h3 className="text-2xl font-hand font-bold text-park-tree mb-1">Surveying Global Sites</h3>
               <p className="text-[10px] font-rounded mt-1.5 text-park-ink-muted">Accessing satellite geological data...</p>
            </div>
          ) : (
            <div className="h-full flex flex-col p-4 overflow-y-auto custom-scrollbar space-y-4">
              <InfoPanelLegendHeader
                config={plottingConfig}
                onChangeConfig={handleUpdatePlottingConfig}
                isIntervalsOpen={isPlottingPanelOpen}
                onToggleIntervals={handleTogglePlottingPanel}
                markers={markers}
                activeSite={null}
                activeTaxaName={activeQuery}
              />
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/70 rounded-2xl border border-park-card-border">
                <Globe size={44} className="text-park-tree/40 mb-3" />
                <h3 className="text-2xl font-hand font-bold text-park-tree mb-2">Select a Fossil Locality</h3>
                <p className="text-[12px] font-rounded text-park-ink-muted leading-relaxed max-w-sm">
                  Click any excavation site on the interactive map or timescale to view detailed osteology, taphonomic preservation, and paleoclimatology.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
      )}

      {/* Researcher Keyboard Shortcuts Reference Modal */}
      {isHotkeysModalOpen && (
        <div 
          onClick={() => setIsHotkeysModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-park-card-border shadow-2xl max-w-md w-full overflow-hidden text-park-ink"
          >
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-inner">
                  <Keyboard size={16} />
                </div>
                <div>
                  <h4 className="text-[13px] font-rounded font-extrabold text-white">Researcher Keyboard Hotkeys</h4>
                  <p className="text-[9.5px] font-rounded text-slate-300">Quick-navigation shortcuts across the Observatory</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHotkeysModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Shortcuts Modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-[11px] font-rounded">
              <div className="space-y-2">
                <div className="text-[9px] font-bold uppercase text-park-ink-muted tracking-wider">Species & Sites Navigation</div>
                <div className="flex items-center justify-between p-2.5 bg-park-sand/20 rounded-xl border border-park-card-border/60">
                  <span className="font-semibold text-park-tree">Next / Previous Dinosaur</span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <kbd className="px-1.5 py-0.5 bg-white border border-park-card-border rounded shadow-2xs font-bold text-park-tree">Shift</kbd>
                    <span className="text-slate-400">+</span>
                    <kbd className="px-1.5 py-0.5 bg-white border border-park-card-border rounded shadow-2xs font-bold text-park-tree">←</kbd>
                    <kbd className="px-1.5 py-0.5 bg-white border border-park-card-border rounded shadow-2xs font-bold text-park-tree">→</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-park-sand/20 rounded-xl border border-park-card-border/60">
                  <span className="font-semibold text-park-tree">Next / Previous Excavation Site</span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <kbd className="px-1.5 py-0.5 bg-white border border-park-card-border rounded shadow-2xs font-bold text-park-tree">←</kbd>
                    <kbd className="px-1.5 py-0.5 bg-white border border-park-card-border rounded shadow-2xs font-bold text-park-tree">→</kbd>
                    <span className="text-slate-400">or</span>
                    <kbd className="px-1.5 py-0.5 bg-white border border-park-card-border rounded shadow-2xs font-bold text-park-tree">[</kbd>
                    <kbd className="px-1.5 py-0.5 bg-white border border-park-card-border rounded shadow-2xs font-bold text-park-tree">]</kbd>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[9px] font-bold uppercase text-park-ink-muted tracking-wider">Field Journal Modules</div>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                  <div className="p-2 bg-park-sand/20 rounded-lg flex items-center justify-between border border-park-card-border/40">
                    <span className="font-rounded text-[10px] text-park-tree">1. Locality & Formation</span>
                    <kbd className="px-1.5 py-0.2 bg-white border border-park-card-border rounded shadow-2xs font-bold">1</kbd>
                  </div>
                  <div className="p-2 bg-park-sand/20 rounded-lg flex items-center justify-between border border-park-card-border/40">
                    <span className="font-rounded text-[10px] text-park-tree">2. Organ Physiology</span>
                    <kbd className="px-1.5 py-0.2 bg-white border border-park-card-border rounded shadow-2xs font-bold">2</kbd>
                  </div>
                  <div className="p-2 bg-park-sand/20 rounded-lg flex items-center justify-between border border-park-card-border/40">
                    <span className="font-rounded text-[10px] text-park-tree">3. Kinematics & Gait</span>
                    <kbd className="px-1.5 py-0.2 bg-white border border-park-card-border rounded shadow-2xs font-bold">3</kbd>
                  </div>
                  <div className="p-2 bg-park-sand/20 rounded-lg flex items-center justify-between border border-park-card-border/40">
                    <span className="font-rounded text-[10px] text-park-tree">4. Paleoclimate</span>
                    <kbd className="px-1.5 py-0.2 bg-white border border-park-card-border rounded shadow-2xs font-bold">4</kbd>
                  </div>
                  <div className="p-2 bg-park-sand/20 rounded-lg flex items-center justify-between border border-park-card-border/40">
                    <span className="font-rounded text-[10px] text-park-tree">5. Hypsometry</span>
                    <kbd className="px-1.5 py-0.2 bg-white border border-park-card-border rounded shadow-2xs font-bold">5</kbd>
                  </div>
                  <div className="p-2 bg-park-sand/20 rounded-lg flex items-center justify-between border border-park-card-border/40">
                    <span className="font-rounded text-[10px] text-park-tree">6. Ontogeny & Migration</span>
                    <kbd className="px-1.5 py-0.2 bg-white border border-park-card-border rounded shadow-2xs font-bold">6</kbd>
                  </div>
                  <div className="p-2 bg-park-sand/20 rounded-lg flex items-center justify-between border border-park-card-border/40">
                    <span className="font-rounded text-[10px] text-park-tree">7. Excavation Radar</span>
                    <kbd className="px-1.5 py-0.2 bg-white border border-park-card-border rounded shadow-2xs font-bold">7</kbd>
                  </div>
                  <div className="p-2 bg-park-sand/20 rounded-lg flex items-center justify-between border border-park-card-border/40">
                    <span className="font-rounded text-[10px] text-park-tree">8. Fossil Stratum</span>
                    <kbd className="px-1.5 py-0.2 bg-white border border-park-card-border rounded shadow-2xs font-bold">8</kbd>
                  </div>
                  <div className="p-2 bg-park-sand/20 rounded-lg flex items-center justify-between border border-park-card-border/40">
                    <span className="font-rounded text-[10px] text-park-tree">9. Vital Metrics</span>
                    <kbd className="px-1.5 py-0.2 bg-white border border-park-card-border rounded shadow-2xs font-bold">9</kbd>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[9px] font-bold uppercase text-park-ink-muted tracking-wider">Quick Search & Tools</div>
                <div className="flex items-center justify-between p-2.5 bg-park-sand/20 rounded-xl border border-park-card-border/60">
                  <span className="font-semibold text-park-tree">Open Search / Command Palette</span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <kbd className="px-1.5 py-0.5 bg-white border border-park-card-border rounded shadow-2xs font-bold text-park-tree">⌘</kbd>
                    <span className="text-slate-400">+</span>
                    <kbd className="px-1.5 py-0.5 bg-white border border-park-card-border rounded shadow-2xs font-bold text-park-tree">K</kbd>
                    <span className="text-slate-400">or</span>
                    <kbd className="px-1.5 py-0.5 bg-white border border-park-card-border rounded shadow-2xs font-bold text-park-tree">/</kbd>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-park-card-border/60 flex items-center justify-between text-[10px] text-park-ink-muted">
                <span>Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-mono font-bold">?</kbd> to toggle</span>
                <span>Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-mono font-bold">Esc</kbd> to close</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Omnibox / Quick Search Command Palette Modal */}
      {isSearchPaletteOpen && (
        <div 
          onClick={() => {
            setIsSearchPaletteOpen(false);
            setQuickSearchQuery('');
          }}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-park-card-border shadow-2xl max-w-lg w-full overflow-hidden text-park-ink flex flex-col max-h-[80vh]"
          >
            {/* Search Input Bar */}
            <div className="p-3 bg-gradient-to-r from-[#faf8f2] to-white border-b border-park-card-border flex items-center gap-3">
              <Search size={18} className="text-park-tree shrink-0" />
              <input
                ref={searchInputRef}
                autoFocus
                type="text"
                value={quickSearchQuery}
                onChange={(e) => {
                  setQuickSearchQuery(e.target.value);
                  setSelectedSearchIndex(0);
                }}
                placeholder="Search dinosaurs, excavation sites, formations, or periods..."
                className="w-full bg-transparent border-none outline-none font-rounded font-semibold text-sm text-park-tree placeholder:text-park-ink-muted"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSearchPaletteOpen(false);
                    setQuickSearchQuery('');
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (searchResults.length > 0) {
                      setSelectedSearchIndex(prev => (prev + 1) % searchResults.length);
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (searchResults.length > 0) {
                      setSelectedSearchIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
                    }
                  } else if (e.key === 'Enter' && searchResults.length > 0) {
                    const target = searchResults[selectedSearchIndex] || searchResults[0];
                    if (target.type === 'species') {
                      handleQuerySelect(target.name);
                    } else if (target.site) {
                      handleQuerySelect(target.speciesName);
                      triggerSiteNavigation(target.site);
                    }
                    setIsSearchPaletteOpen(false);
                    setQuickSearchQuery('');
                  }
                }}
              />
              {quickSearchQuery && (
                <button
                  onClick={() => {
                    setQuickSearchQuery('');
                    setSelectedSearchIndex(0);
                  }}
                  className="p-1 hover:bg-slate-200 text-slate-500 rounded-md cursor-pointer transition-colors"
                  title="Clear search text"
                >
                  <X size={14} />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-100 text-slate-500 rounded border border-slate-300 shrink-0">
                ESC
              </kbd>
            </div>

            {/* Results Roster */}
            <div className="overflow-y-auto custom-scrollbar p-2 divide-y divide-park-card-border/40 max-h-96">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-park-ink-muted text-xs font-rounded space-y-1">
                  <p className="font-bold text-park-tree">No specimens or formations found</p>
                  <p className="text-[11px]">Try searching for &quot;Cretaceous&quot;, &quot;Hell Creek&quot;, &quot;Carnivore&quot;, or &quot;Morrison&quot;</p>
                </div>
              ) : (
                searchResults.map((result, idx) => {
                  const isSelected = idx === selectedSearchIndex;
                  return (
                    <div
                      key={`${result.type}-${result.name}-${idx}`}
                      onMouseEnter={() => setSelectedSearchIndex(idx)}
                      onClick={() => {
                        if (result.type === 'species') {
                          handleQuerySelect(result.name);
                        } else if (result.site) {
                          handleQuerySelect(result.speciesName);
                          triggerSiteNavigation(result.site);
                        }
                        setIsSearchPaletteOpen(false);
                        setQuickSearchQuery('');
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-park-land/30 ring-1 ring-park-border-green/60 shadow-xs' 
                          : 'hover:bg-park-land/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform ${
                          isSelected ? 'scale-105 shadow-xs' : ''
                        } ${
                          result.type === 'species'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {result.type === 'species' ? <span>🦖</span> : <MapPin size={13} />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-rounded font-bold text-park-tree group-hover:text-emerald-950 truncate flex items-center gap-1.5">
                            <span>{result.name}</span>
                            <span className={`text-[8px] font-mono px-1 py-0.1 rounded border uppercase ${
                              result.type === 'species'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {result.type}
                            </span>
                          </div>
                          <div className="text-[9.5px] font-rounded text-park-ink-muted truncate">
                            {result.subtitle}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className={`transition-all shrink-0 ${
                        isSelected ? 'text-park-tree translate-x-0.5' : 'text-slate-400 group-hover:text-park-tree'
                      }`} />
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Tip */}
            <div className="p-2.5 bg-[#faf8f2] border-t border-park-card-border flex items-center justify-between text-[10px] font-rounded text-park-ink-muted">
              <span className="flex items-center gap-1">
                <span>Navigate with</span>
                <kbd className="px-1 py-0.2 bg-white rounded border border-slate-300 font-mono font-bold">↑</kbd>
                <kbd className="px-1 py-0.2 bg-white rounded border border-slate-300 font-mono font-bold">↓</kbd>
                <span>• Press</span>
                <kbd className="px-1 py-0.2 bg-white rounded border border-slate-300 font-mono font-bold">↵ Enter</kbd>
              </span>
              <span>{searchResults.length} matching entries</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #faf8f2;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d8d3c3;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2b585c;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes journalTabSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        #field-journal-tab-group {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default App;
