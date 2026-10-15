import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { SiteMarker, PaleoData, SpatioTemporalWaypoint } from '../types';
import { DINOSAUR_DB } from '../data/dinosaurData';
import { getDinoSilhouette } from '../utils/dinosaurIllustrations';
import { 
  Plus, 
  Minus, 
  Play,
  Pause,
  Compass, 
  Navigation, 
  Trees, 
  MapPin, 
  Footprints, 
  Wind, 
  Mountain, 
  Calendar, 
  Sun, 
  CloudRain, 
  Waves, 
  Flame, 
  Droplets, 
  Snowflake, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Clock, 
  CheckCircle2, 
  Layers2, 
  Compass as CompassIcon,
  Sparkles,
  Activity,
  LocateFixed,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Info,
  X,
  GripVertical,
  Move,
  RotateCcw,
  Globe,
  SlidersHorizontal,
  ArrowDownToLine,
  Layers,
  BookOpen
} from 'lucide-react';
import { ViewportElementsContainer, ViewportElementId } from './ViewportElementsContainer';

import PlottingSpecializationLayer, { 
  PlottingLayerConfig, 
  DEFAULT_PLOTTING_CONFIG, 
  PlottingSpecializationMode 
} from './PlottingSpecializationLayer';

import { 
  computeRelativeLocation, 
  computeAllNeighbouringRelativeLocations, 
  formatBearingDisplay,
  RelativeLocationInfo 
} from '../utils/cardinalDirection';
import { GEOGRAPHIC_REGIONS, isSiteInArea } from '../utils/geoRegions';

// Human-friendly labels for plotting specialization modes
const PLOTTING_MODE_LABELS: Record<PlottingSpecializationMode, string> = {
  trails: 'Sites & Buffer',
  migration: 'Migration Flow',
  hypsometry: 'Hypsometry',
  locomotion: 'Gait Tracks',
  density: 'Density Isopleths',
  cardinal: 'Cardinal Vectors'
};

// Dino footprint path data
const DINO_FOOTPRINT_PATH = "M511.517,370.284c-5.971-20.294-92.954-22.906-113.159-18.866c-20.216,4.041-76.79,2.68-88.913-9.443c-12.124-12.124,4.041-32.329,16.175-44.451c12.124-12.124,38.389-50.524,46.472-58.606c8.082-8.082,50.166-50.378,65.325-74.758c30.988-49.843,41.437-98.68,25.262-114.845c-16.164-16.164-65.003-5.727-114.834,25.262c-24.38,15.17-66.688,57.244-74.769,65.325c-8.083,8.083-46.472,34.36-58.606,46.483c-12.122,12.124-32.328,28.287-44.451,16.164c-12.122-12.124-13.474-68.698-9.433-88.902c4.041-20.205,1.419-107.187-18.866-113.16C121.438-5.483,83.798,44.94,68.984,87.37c-8.685,24.871-82.852,141.446-66.688,226.319c16.175,84.872,31,127.982,49.507,146.503c18.519,18.519,61.642,33.343,146.503,49.507c84.872,16.164,201.448-57.991,226.319-66.676C467.056,428.198,517.478,390.557,511.517,370.284z";

// Predefined decorative tree cluster coordinates for natural continents
const DECORATIVE_TREES = [
  { lat: 48.5, lng: -110.0, scale: 1.1 },
  { lat: 44.0, lng: -103.0, scale: 0.9 },
  { lat: 53.0, lng: -115.0, scale: 1.2 },
  { lat: 38.0, lng: -105.0, scale: 1.0 },
  { lat: 32.0, lng: -90.0, scale: 1.0 },
  { lat: 45.0, lng: -75.0, scale: 0.9 },
  { lat: 58.0, lng: -120.0, scale: 1.1 },
  { lat: 35.0, lng: -118.0, scale: 0.8 },
  { lat: -5.0, lng: -60.0, scale: 1.3 },
  { lat: -15.0, lng: -55.0, scale: 1.1 },
  { lat: -35.0, lng: -65.0, scale: 1.0 },
  { lat: -25.0, lng: -50.0, scale: 0.9 },
  { lat: 5.0, lng: -70.0, scale: 0.8 },
  { lat: 48.0, lng: 10.0, scale: 1.0 },
  { lat: 42.0, lng: -3.0, scale: 0.9 },
  { lat: 55.0, lng: 15.0, scale: 1.1 },
  { lat: 45.0, lng: 25.0, scale: 1.0 },
  { lat: 60.0, lng: 10.0, scale: 1.1 },
  { lat: 5.0, lng: 25.0, scale: 1.2 },
  { lat: -5.0, lng: 30.0, scale: 1.1 },
  { lat: -20.0, lng: 28.0, scale: 1.0 },
  { lat: 28.0, lng: 30.0, scale: 0.8 },
  { lat: 10.0, lng: 10.0, scale: 0.9 },
  { lat: 55.0, lng: 80.0, scale: 1.2 },
  { lat: 42.0, lng: 105.0, scale: 1.0 },
  { lat: 30.0, lng: 110.0, scale: 1.1 },
  { lat: 20.0, lng: 80.0, scale: 1.0 },
  { lat: 60.0, lng: 110.0, scale: 1.2 },
  { lat: 35.0, lng: 135.0, scale: 0.9 },
  { lat: 45.0, lng: 125.0, scale: 1.0 },
  { lat: -25.0, lng: 135.0, scale: 1.0 },
  { lat: -32.0, lng: 145.0, scale: 1.1 },
  { lat: -18.0, lng: 140.0, scale: 0.9 }
];

// Decorative ocean clouds
const DECORATIVE_CLOUDS = [
  { lat: 25.0, lng: -155.0, size: 45 },
  { lat: -20.0, lng: -140.0, size: 55 },
  { lat: 10.0, lng: -35.0, size: 40 },
  { lat: -45.0, lng: -20.0, size: 50 },
  { lat: -10.0, lng: 75.0, size: 48 },
  { lat: 35.0, lng: 165.0, size: 52 },
  { lat: -35.0, lng: 110.0, size: 42 },
  { lat: 60.0, lng: -40.0, size: 38 }
];

// Decorative expedition sailboats
const DECORATIVE_BOATS = [
  { lat: 18.0, lng: -160.0, angle: -15, label: "Expedition Vessel" },
  { lat: -15.0, lng: -30.0, angle: 20, label: "Survey Sloop" },
  { lat: 5.0, lng: 85.0, angle: -10, label: "Paleo Boat" },
  { lat: 28.0, lng: 155.0, angle: 12, label: "Isle Research" }
];

export type MapOverlayMode = 'trails' | 'migration' | 'hypsometry' | 'locomotion' | 'density' | 'cardinal';
export type LegendLayerFilter = 'climate' | 'stratigraphy' | 'taphonomy' | 'cardinal';

interface MapCanvasProps {
  markers: SiteMarker[];
  selectedMarkerId?: string;
  currentIndex?: number;
  onMarkerClick: (marker: SiteMarker) => void;
  activeTaxaName?: string;
  paleoData?: PaleoData | null;
  activeWaypoint?: SpatioTemporalWaypoint | null;
  plottingConfig?: PlottingLayerConfig;
  onChangePlottingConfig?: (newConfig: Partial<PlottingLayerConfig>) => void;
  isPlottingPanelOpen?: boolean;
  onTogglePlottingPanel?: () => void;
  activeGeographicArea?: string;
  areaNavSignal?: { areaId: string; timestamp: number } | null;
  siteNavSignal?: { site: SiteMarker; timestamp: number } | null;
  onSwitchToGoogleEarth?: () => void;
  onPrevSite?: () => void;
  onNextSite?: () => void;
  onSelectTab?: (tab: string) => void;
}

import { SitePhenomenaInfo, getSitePhenomenaDetails } from '../utils/sitePhenomena';
export type { SitePhenomenaInfo };
export { getSitePhenomenaDetails };

const MapCanvas: React.FC<MapCanvasProps> = ({ 
  markers, 
  selectedMarkerId, 
  currentIndex,
  onMarkerClick,
  activeTaxaName = "Tyrannosaurus Rex",
  paleoData,
  activeWaypoint,
  plottingConfig: externalPlottingConfig,
  onChangePlottingConfig: externalOnChangePlottingConfig,
  isPlottingPanelOpen: externalIsPlottingPanelOpen,
  onTogglePlottingPanel: externalOnTogglePlottingPanel,
  activeGeographicArea = "all",
  areaNavSignal,
  siteNavSignal,
  onSwitchToGoogleEarth,
  onPrevSite,
  onNextSite,
  onSelectTab
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null);

  // Option: Show info on hover & detail level (persisted)
  const [showInfoOnHover, setShowInfoOnHover] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('paleo_map_show_info_on_hover');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [hoverDetailMode, setHoverDetailMode] = useState<'full' | 'compact'>(() => {
    try {
      const saved = localStorage.getItem('paleo_map_hover_detail_level');
      return saved === 'compact' ? 'compact' : 'full';
    } catch {
      return 'full';
    }
  });

  // Historical Species Migratory Footprint Trails Visual Toggle & Time-Lapse Runner State
  const [showFootprintTrails, setShowFootprintTrails] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('paleo_atlas_show_footprint_trails');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [trackwayAnimIdx, setTrackwayAnimIdx] = useState<number>(0);
  const [isTrackwayPlaying, setIsTrackwayPlaying] = useState<boolean>(false);

  const toggleFootprintTrails = useCallback(() => {
    setShowFootprintTrails(prev => {
      const next = !prev;
      try {
        localStorage.setItem('paleo_atlas_show_footprint_trails', String(next));
      } catch {}
      return next;
    });
  }, []);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleShowInfoOnHover = () => {
    setShowInfoOnHover(prev => {
      const next = !prev;
      try {
        localStorage.setItem('paleo_map_show_info_on_hover', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleHoverDetailMode = () => {
    setHoverDetailMode(prev => {
      const next = prev === 'full' ? 'compact' : 'full';
      try {
        localStorage.setItem('paleo_map_hover_detail_level', next);
      } catch {}
      return next;
    });
  };

  const handlePinMouseEnter = (siteId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredSiteId(siteId);
  };

  const handlePinMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSiteId(null);
    }, 220);
  };

  const handleTooltipMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSiteId(null);
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Dynamic moving excavation focal pin states & animation loop
  const [animatedPinCoords, setAnimatedPinCoords] = useState<{ x: number; y: number } | null>(null);
  const [isPinGliding, setIsPinGliding] = useState<boolean>(false);
  const [flightTrail, setFlightTrail] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const pinPosRef = useRef<{ x: number; y: number } | null>(null);
  const pinAnimFrameRef = useRef<number | null>(null);

  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [internalPlottingConfig, setInternalPlottingConfig] = useState<PlottingLayerConfig>(DEFAULT_PLOTTING_CONFIG);
  const [internalIsPlottingPanelOpen, setInternalIsPlottingPanelOpen] = useState<boolean>(false);

  const plottingConfig = externalPlottingConfig ?? internalPlottingConfig;
  const isPlottingPanelOpen = externalIsPlottingPanelOpen ?? internalIsPlottingPanelOpen;

  const handleUpdatePlottingConfig = (newConfig: Partial<PlottingLayerConfig>) => {
    if (externalOnChangePlottingConfig) {
      externalOnChangePlottingConfig(newConfig);
    } else {
      setInternalPlottingConfig(prev => {
        const updated = { ...prev, ...newConfig };
        return updated;
      });
    }
  };

  const handleTogglePlottingPanel = () => {
    if (externalOnTogglePlottingPanel) {
      externalOnTogglePlottingPanel();
    } else {
      setInternalIsPlottingPanelOpen(prev => !prev);
    }
  };

  const [isPlottingExpanded, setIsPlottingExpanded] = useState<boolean>(false);

  const [legendFilter, setLegendFilter] = useState<LegendLayerFilter>('climate');
  const [isLegendExpanded, setIsLegendExpanded] = useState<boolean>(true);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const isFirstLoadRef = useRef(true);
  const prevSelectedMarkerId = useRef<string | undefined>(undefined);
  const prevIndexRef = useRef<number | undefined>(currentIndex);
  const prevTaxaRef = useRef<string>(activeTaxaName);
  const prevAreaNavTimestamp = useRef<number>(0);

  // Viewport Container Docked State (Tracks which elements are in the master container vs extracted on map)
  const [dockedState, setDockedState] = useState<Record<ViewportElementId, boolean>>(() => {
    try {
      const saved = localStorage.getItem('paleo_atlas_docked_elements');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      locality_card: true,
      camera_nav: true,
      layer_toggles: true,
      plotting_ribbon: true,
      pin_banner: true,
      mode_switcher: true,
    };
  });

  const handleSnipOut = useCallback((id: ViewportElementId) => {
    setDockedState(prev => {
      const next = { ...prev, [id]: false };
      try {
        localStorage.setItem('paleo_atlas_docked_elements', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleDockIn = useCallback((id: ViewportElementId) => {
    setDockedState(prev => {
      const next = { ...prev, [id]: true };
      try {
        localStorage.setItem('paleo_atlas_docked_elements', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleSnipAllOut = useCallback(() => {
    const next: Record<ViewportElementId, boolean> = {
      locality_card: false,
      camera_nav: false,
      layer_toggles: false,
      plotting_ribbon: false,
      pin_banner: false,
      mode_switcher: false,
    };
    setDockedState(next);
    try {
      localStorage.setItem('paleo_atlas_docked_elements', JSON.stringify(next));
    } catch {}
  }, []);

  const handleDockAllIn = useCallback(() => {
    const next: Record<ViewportElementId, boolean> = {
      locality_card: true,
      camera_nav: true,
      layer_toggles: true,
      plotting_ribbon: true,
      pin_banner: true,
      mode_switcher: true,
    };
    setDockedState(next);
    try {
      localStorage.setItem('paleo_atlas_docked_elements', JSON.stringify(next));
    } catch {}
  }, []);

  // 1. Trail Legend Positioning & Resizing State
  const [legendPos, setLegendPos] = useState<{ x: number; y: number } | null>(null);
  const [legendSize, setLegendSize] = useState<{ width: number; height: number } | null>(null);
  const [isDraggingLegend, setIsDraggingLegend] = useState<boolean>(false);
  const [isResizingLegend, setIsResizingLegend] = useState<boolean>(false);
  const legendRef = useRef<HTMLDivElement>(null);
  const legendDragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    containerWidth: number;
    containerHeight: number;
    elementWidth: number;
    elementHeight: number;
  } | null>(null);
  const legendResizeStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    containerWidth: number;
    containerHeight: number;
  } | null>(null);

  // 2. Plotting Layer Positioning & Resizing State
  const [plottingPos, setPlottingPos] = useState<{ x: number; y: number } | null>(null);
  const [plottingSize, setPlottingSize] = useState<{ width: number; height: number } | null>(null);
  const [isDraggingPlotting, setIsDraggingPlotting] = useState<boolean>(false);
  const [isResizingPlotting, setIsResizingPlotting] = useState<boolean>(false);
  const plottingRef = useRef<HTMLDivElement>(null);
  const plottingDragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    containerWidth: number;
    containerHeight: number;
    elementWidth: number;
    elementHeight: number;
  } | null>(null);
  const plottingResizeStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    containerWidth: number;
    containerHeight: number;
  } | null>(null);

  // 3. Viewport Direction & Zoom HUD Positioning & Scaling State
  const [zoomHudPos, setZoomHudPos] = useState<{ x: number; y: number } | null>(null);
  const [zoomHudScale, setZoomHudScale] = useState<number>(1.0);
  const [isDraggingZoomHud, setIsDraggingZoomHud] = useState<boolean>(false);
  const [isResizingZoomHud, setIsResizingZoomHud] = useState<boolean>(false);
  const zoomHudRef = useRef<HTMLDivElement>(null);
  const zoomHudDragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    containerWidth: number;
    containerHeight: number;
    elementWidth: number;
    elementHeight: number;
  } | null>(null);
  const zoomHudResizeStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialScale: number;
  } | null>(null);

  // 4. Interactive Compass Rose Positioning & Scaling State
  const [compassPos, setCompassPos] = useState<{ x: number; y: number } | null>(null);
  const [compassScale, setCompassScale] = useState<number>(1.0);
  const [isDraggingCompass, setIsDraggingCompass] = useState<boolean>(false);
  const [isResizingCompass, setIsResizingCompass] = useState<boolean>(false);
  const compassRef = useRef<HTMLDivElement>(null);
  const compassDragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    containerWidth: number;
    containerHeight: number;
    elementWidth: number;
    elementHeight: number;
  } | null>(null);
  const compassResizeStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialScale: number;
  } | null>(null);

  // --- Handlers: Trail Legend (Window-level fluid dragging & resizing) ---
  const handleLegendPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, a, [role="button"], [data-legend-resize]')) {
      return;
    }
    if (!legendRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const legendRect = legendRef.current.getBoundingClientRect();

    legendDragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: legendRect.left - containerRect.left,
      initialTop: legendRect.top - containerRect.top,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height,
      elementWidth: legendRect.width,
      elementHeight: legendRect.height
    };

    setIsDraggingLegend(true);
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDraggingLegend) return;
    const handleMove = (e: PointerEvent) => {
      if (!legendDragStartRef.current) return;
      const { startX, startY, initialLeft, initialTop, containerWidth, containerHeight, elementWidth, elementHeight } = legendDragStartRef.current;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let nextX = initialLeft + deltaX;
      let nextY = initialTop + deltaY;

      const minX = 8;
      const minY = 8;
      const maxX = Math.max(minX, containerWidth - elementWidth - 8);
      const maxY = Math.max(minY, containerHeight - elementHeight - 8);

      nextX = Math.max(minX, Math.min(nextX, maxX));
      nextY = Math.max(minY, Math.min(nextY, maxY));

      setLegendPos({ x: nextX, y: nextY });
    };

    const handleUp = () => {
      legendDragStartRef.current = null;
      setIsDraggingLegend(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isDraggingLegend]);

  const handleLegendResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (!legendRef.current || !containerRef.current) return;
    const legendRect = legendRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    legendResizeStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: legendRect.width,
      initialHeight: legendRect.height,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height,
    };
    setIsResizingLegend(true);
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isResizingLegend) return;
    const handleMove = (e: PointerEvent) => {
      if (!legendResizeStartRef.current) return;
      const { startX, startY, initialWidth, initialHeight, containerWidth, containerHeight } = legendResizeStartRef.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const minW = 260;
      const minH = 140;
      const maxW = Math.max(minW, containerWidth - (legendPos?.x ?? 20) - 10);
      const maxH = Math.max(minH, containerHeight - (legendPos?.y ?? 20) - 10);

      const newW = Math.max(minW, Math.min(maxW, initialWidth + deltaX));
      const newH = Math.max(minH, Math.min(maxH, initialHeight + deltaY));

      setLegendSize({ width: newW, height: newH });
    };

    const handleUp = () => {
      legendResizeStartRef.current = null;
      setIsResizingLegend(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isResizingLegend, legendPos]);

  const handleResetLegend = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLegendPos(null);
    setLegendSize(null);
  };

  // --- Handlers: Plotting Layer ---
  const handlePlottingPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, a, [role="button"], [data-plotting-resize]')) return;
    if (!plottingRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = plottingRef.current.getBoundingClientRect();

    plottingDragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left - containerRect.left,
      initialTop: rect.top - containerRect.top,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height,
      elementWidth: rect.width,
      elementHeight: rect.height,
    };

    setIsDraggingPlotting(true);
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDraggingPlotting) return;
    const handleMove = (e: PointerEvent) => {
      if (!plottingDragStartRef.current) return;
      const { startX, startY, initialLeft, initialTop, containerWidth, containerHeight, elementWidth, elementHeight } = plottingDragStartRef.current;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let nextX = initialLeft + deltaX;
      let nextY = initialTop + deltaY;

      const minX = 8;
      const minY = 8;
      const maxX = Math.max(minX, containerWidth - elementWidth - 8);
      const maxY = Math.max(minY, containerHeight - elementHeight - 8);

      nextX = Math.max(minX, Math.min(nextX, maxX));
      nextY = Math.max(minY, Math.min(nextY, maxY));

      setPlottingPos({ x: nextX, y: nextY });
    };

    const handleUp = () => {
      plottingDragStartRef.current = null;
      setIsDraggingPlotting(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isDraggingPlotting]);

  const handlePlottingResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (!plottingRef.current || !containerRef.current) return;
    const rect = plottingRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    plottingResizeStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: rect.width,
      initialHeight: rect.height,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height,
    };
    setIsResizingPlotting(true);
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isResizingPlotting) return;
    const handleMove = (e: PointerEvent) => {
      if (!plottingResizeStartRef.current) return;
      const { startX, startY, initialWidth, initialHeight, containerWidth, containerHeight } = plottingResizeStartRef.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const minW = 280;
      const minH = 70;
      const maxW = Math.max(minW, containerWidth - (plottingPos?.x ?? 16) - 10);
      const maxH = Math.max(minH, containerHeight - (plottingPos?.y ?? 16) - 10);

      const newW = Math.max(minW, Math.min(maxW, initialWidth + deltaX));
      const newH = Math.max(minH, Math.min(maxH, initialHeight + deltaY));

      setPlottingSize({ width: newW, height: newH });
    };

    const handleUp = () => {
      plottingResizeStartRef.current = null;
      setIsResizingPlotting(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isResizingPlotting, plottingPos]);

  const handleResetPlotting = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlottingPos(null);
    setPlottingSize(null);
  };

  // --- Handlers: Viewport Zoom HUD ---
  const handleZoomHudPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, a, [role="button"], [data-zoomhud-resize]')) return;
    if (!zoomHudRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = zoomHudRef.current.getBoundingClientRect();

    zoomHudDragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left - containerRect.left,
      initialTop: rect.top - containerRect.top,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height,
      elementWidth: rect.width,
      elementHeight: rect.height,
    };

    setIsDraggingZoomHud(true);
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDraggingZoomHud) return;
    const handleMove = (e: PointerEvent) => {
      if (!zoomHudDragStartRef.current) return;
      const { startX, startY, initialLeft, initialTop, containerWidth, containerHeight, elementWidth, elementHeight } = zoomHudDragStartRef.current;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let nextX = initialLeft + deltaX;
      let nextY = initialTop + deltaY;

      const minX = 8;
      const minY = 8;
      const maxX = Math.max(minX, containerWidth - elementWidth - 8);
      const maxY = Math.max(minY, containerHeight - elementHeight - 8);

      nextX = Math.max(minX, Math.min(nextX, maxX));
      nextY = Math.max(minY, Math.min(nextY, maxY));

      setZoomHudPos({ x: nextX, y: nextY });
    };

    const handleUp = () => {
      zoomHudDragStartRef.current = null;
      setIsDraggingZoomHud(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isDraggingZoomHud]);

  const handleZoomHudResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    zoomHudResizeStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialScale: zoomHudScale,
    };
    setIsResizingZoomHud(true);
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isResizingZoomHud) return;
    const handleMove = (e: PointerEvent) => {
      if (!zoomHudResizeStartRef.current) return;
      const delta = (e.clientX - zoomHudResizeStartRef.current.startX + (e.clientY - zoomHudResizeStartRef.current.startY)) / 200;
      const nextScale = Math.max(0.75, Math.min(1.45, zoomHudResizeStartRef.current.initialScale + delta));
      setZoomHudScale(nextScale);
    };

    const handleUp = () => {
      zoomHudResizeStartRef.current = null;
      setIsResizingZoomHud(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isResizingZoomHud]);

  const handleResetZoomHud = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setZoomHudPos(null);
    setZoomHudScale(1.0);
  };

  // --- Handlers: Compass Rose ---
  const handleCompassPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-compass-resize]')) return;
    if (!compassRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = compassRef.current.getBoundingClientRect();

    compassDragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left - containerRect.left,
      initialTop: rect.top - containerRect.top,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height,
      elementWidth: rect.width,
      elementHeight: rect.height,
    };

    setIsDraggingCompass(true);
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDraggingCompass) return;
    const handleMove = (e: PointerEvent) => {
      if (!compassDragStartRef.current) return;
      const { startX, startY, initialLeft, initialTop, containerWidth, containerHeight, elementWidth, elementHeight } = compassDragStartRef.current;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let nextX = initialLeft + deltaX;
      let nextY = initialTop + deltaY;

      const minX = 8;
      const minY = 8;
      const maxX = Math.max(minX, containerWidth - elementWidth - 8);
      const maxY = Math.max(minY, containerHeight - elementHeight - 8);

      nextX = Math.max(minX, Math.min(nextX, maxX));
      nextY = Math.max(minY, Math.min(nextY, maxY));

      setCompassPos({ x: nextX, y: nextY });
    };

    const handleUp = () => {
      compassDragStartRef.current = null;
      setIsDraggingCompass(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isDraggingCompass]);

  const handleCompassResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    compassResizeStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialScale: compassScale,
    };
    setIsResizingCompass(true);
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isResizingCompass) return;
    const handleMove = (e: PointerEvent) => {
      if (!compassResizeStartRef.current) return;
      const delta = (e.clientX - compassResizeStartRef.current.startX + (e.clientY - compassResizeStartRef.current.startY)) / 150;
      const nextScale = Math.max(0.7, Math.min(2.0, compassResizeStartRef.current.initialScale + delta));
      setCompassScale(nextScale);
    };

    const handleUp = () => {
      compassResizeStartRef.current = null;
      setIsResizingCompass(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isResizingCompass]);

  const handleResetCompass = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompassPos(null);
    setCompassScale(1.0);
  };

  // Reset all customized viewport overlay layouts
  const handleResetAllViewportOverlays = () => {
    setLegendPos(null);
    setLegendSize(null);
    setPlottingPos(null);
    setPlottingSize(null);
    setZoomHudPos(null);
    setZoomHudScale(1.0);
    setCompassPos(null);
    setCompassScale(1.0);
  };

  const hasAnyCustomViewportLayout = !!(
    legendPos || legendSize || 
    plottingPos || plottingSize || 
    zoomHudPos || zoomHudScale !== 1.0 || 
    compassPos || compassScale !== 1.0
  );

  // Keep all draggable overlays within map container bounds when window or sidebar resizes
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    if (legendPos && legendRef.current) {
      const rect = legendRef.current.getBoundingClientRect();
      const maxX = Math.max(8, dimensions.width - rect.width - 8);
      const maxY = Math.max(8, dimensions.height - rect.height - 8);
      if (legendPos.x > maxX || legendPos.y > maxY) {
        setLegendPos({ x: Math.min(legendPos.x, maxX), y: Math.min(legendPos.y, maxY) });
      }
    }

    if (plottingPos && plottingRef.current) {
      const rect = plottingRef.current.getBoundingClientRect();
      const maxX = Math.max(8, dimensions.width - rect.width - 8);
      const maxY = Math.max(8, dimensions.height - rect.height - 8);
      if (plottingPos.x > maxX || plottingPos.y > maxY) {
        setPlottingPos({ x: Math.min(plottingPos.x, maxX), y: Math.min(plottingPos.y, maxY) });
      }
    }

    if (zoomHudPos && zoomHudRef.current) {
      const rect = zoomHudRef.current.getBoundingClientRect();
      const maxX = Math.max(8, dimensions.width - rect.width - 8);
      const maxY = Math.max(8, dimensions.height - rect.height - 8);
      if (zoomHudPos.x > maxX || zoomHudPos.y > maxY) {
        setZoomHudPos({ x: Math.min(zoomHudPos.x, maxX), y: Math.min(zoomHudPos.y, maxY) });
      }
    }

    if (compassPos && compassRef.current) {
      const rect = compassRef.current.getBoundingClientRect();
      const maxX = Math.max(8, dimensions.width - rect.width - 8);
      const maxY = Math.max(8, dimensions.height - rect.height - 8);
      if (compassPos.x > maxX || compassPos.y > maxY) {
        setCompassPos({ x: Math.min(compassPos.x, maxX), y: Math.min(compassPos.y, maxY) });
      }
    }
  }, [dimensions.width, dimensions.height, legendPos, plottingPos, zoomHudPos, compassPos]);

  // Floating HUD banner for area navigation
  const [navBanner, setNavBanner] = useState<{ title: string; badge: string; detail: string } | null>(null);
  const navBannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showRegionBanner = (title: string, badge: string, detail: string) => {
    if (navBannerTimeoutRef.current) {
      clearTimeout(navBannerTimeoutRef.current);
    }
    setNavBanner({ title, badge, detail });
    navBannerTimeoutRef.current = setTimeout(() => {
      setNavBanner(null);
    }, 4500);
  };

  // Dinosaur silhouette avatar for square pins
  const dinoSilhouette = useMemo(() => {
    return getDinoSilhouette(activeTaxaName);
  }, [activeTaxaName]);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then(data => setWorldData(data))
      .catch(err => console.error("Map Data Fetch Error:", err));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        setDimensions({
          width: newW,
          height: newH
        });
        setZoomHudPos(prev => {
          if (!prev) return null;
          return {
            x: Math.max(10, Math.min(prev.x, newW - 280)),
            y: Math.max(10, Math.min(prev.y, newH - 60))
          };
        });
        setCompassPos(prev => {
          if (!prev) return null;
          return {
            x: Math.max(10, Math.min(prev.x, newW - 120)),
            y: Math.max(10, Math.min(prev.y, newH - 120))
          };
        });
      }
    });

    ro.observe(el);
    
    const rect = el.getBoundingClientRect();
    if (rect.width > 0) {
      setDimensions({ width: rect.width, height: rect.height });
    }

    return () => ro.disconnect();
  }, []);

  // Initialize Zoom behavior
  useEffect(() => {
    if (!svgRef.current || !gRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 24])
      .on('zoom', (event) => {
        setZoomTransform(event.transform);
        d3.select(gRef.current).attr('transform', event.transform.toString());
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;
  }, [dimensions, worldData]);

  const mapData = useMemo(() => {
    if (!worldData || dimensions.width === 0 || dimensions.height === 0) return null;

    const padding = 28;
    const projection = d3.geoNaturalEarth1()
      .fitExtent([[padding, padding], [dimensions.width - padding, dimensions.height - padding]], { type: "Sphere" } as any);

    const pathGenerator = d3.geoPath().projection(projection);
    const countries = topojson.feature(worldData, worldData.objects.countries) as any;
    const land = topojson.feature(worldData, worldData.objects.land || worldData.objects.countries) as any;
    const graticule = d3.geoGraticule()();

    return { countries, land, graticule, projection, pathGenerator };
  }, [worldData, dimensions]);

  // Camera and Viewport Navigation Controller: handles area navigation, site focus, and taxa updates
  useEffect(() => {
    if (!mapData || !svgRef.current || !zoomBehaviorRef.current || dimensions.width === 0) return;

    // 1. Initial Load: center on active site or world view
    if (isFirstLoadRef.current) {
      const svg = d3.select(svgRef.current);
      isFirstLoadRef.current = false;
      prevSelectedMarkerId.current = selectedMarkerId;
      prevIndexRef.current = currentIndex;
      prevTaxaRef.current = activeTaxaName;

      const initialMarker = (typeof currentIndex === 'number' && markers[currentIndex])
        ? markers[currentIndex]
        : (markers.find(m => m.name === selectedMarkerId || m.id === selectedMarkerId) || markers[0]);

      if (initialMarker && mapData?.projection) {
        const [x, y] = mapData.projection([initialMarker.lng, initialMarker.lat]) || [0, 0];
        const k = 3.5;
        const transform = d3.zoomIdentity
          .translate(dimensions.width / 2, dimensions.height / 2)
          .scale(k)
          .translate(-x, -y);

        svg.call(zoomBehaviorRef.current.transform, transform);
        setZoomTransform(transform);
      } else {
        svg.call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
        setZoomTransform(d3.zoomIdentity);
      }
      return;
    }

    const svg = d3.select(svgRef.current);

    // 2. Area Navigation Trigger (User clicked a geographic area tab like 'africa' / Afrotropical)
    if (areaNavSignal && areaNavSignal.timestamp !== prevAreaNavTimestamp.current) {
      prevAreaNavTimestamp.current = areaNavSignal.timestamp;
      prevSelectedMarkerId.current = selectedMarkerId;
      prevIndexRef.current = currentIndex;
      prevTaxaRef.current = activeTaxaName;

      const region = GEOGRAPHIC_REGIONS[areaNavSignal.areaId] || GEOGRAPHIC_REGIONS.all;

      if (areaNavSignal.areaId === 'all') {
        svg.transition()
          .duration(900)
          .ease(d3.easeCubicInOut)
          .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
        showRegionBanner(region.name, region.badge, "Resetting to global planetary perspective");
        return;
      }

      // Check if there is a site in this area
      let targetLng = region.centerLng;
      let targetLat = region.centerLat;
      let targetScale = region.zoomScale;
      let siteNameDetail = region.subLabel;

      const activeMarker = markers.find(m => m.name === selectedMarkerId);
      if (activeMarker && isSiteInArea(activeMarker.name, areaNavSignal.areaId)) {
        targetLng = activeMarker.lng;
        targetLat = activeMarker.lat;
        targetScale = 3.4;
        siteNameDetail = activeMarker.name;
      } else {
        const areaMarker = markers.find(m => isSiteInArea(m.name, areaNavSignal.areaId));
        if (areaMarker) {
          targetLng = areaMarker.lng;
          targetLat = areaMarker.lat;
          targetScale = 3.4;
          siteNameDetail = areaMarker.name;
        }
      }

      const [x, y] = mapData.projection([targetLng, targetLat]) || [0, 0];
      const transform = d3.zoomIdentity
        .translate(dimensions.width / 2, dimensions.height / 2)
        .scale(targetScale)
        .translate(-x, -y);

      svg.transition()
        .duration(1100)
        .ease(d3.easeCubicInOut)
        .call(zoomBehaviorRef.current.transform, transform);

      showRegionBanner(region.name, region.badge, `Navigated to ${siteNameDetail} • Zoom: ${targetScale.toFixed(1)}x`);
      return;
    }

    // 3. Taxa, Selected Marker, or Excavation Index Changed
    const taxaChanged = prevTaxaRef.current !== activeTaxaName;
    const indexChanged = typeof currentIndex === 'number' && currentIndex !== prevIndexRef.current;
    const markerChanged = (selectedMarkerId && selectedMarkerId !== prevSelectedMarkerId.current) || indexChanged;

    if (markerChanged || taxaChanged) {
      prevTaxaRef.current = activeTaxaName;
      prevSelectedMarkerId.current = selectedMarkerId;
      prevIndexRef.current = currentIndex;

      const marker = (typeof currentIndex === 'number' && markers[currentIndex])
        ? markers[currentIndex]
        : (markers.find(m => m.name === selectedMarkerId || m.id === selectedMarkerId) || markers[0]);

      if (!marker) return;

      const [x, y] = mapData.projection([marker.lng, marker.lat]) || [0, 0];
      const k = 3.5;
      
      const transform = d3.zoomIdentity
        .translate(dimensions.width / 2, dimensions.height / 2)
        .scale(k)
        .translate(-x, -y);

      svg.transition()
        .duration(1000)
        .ease(d3.easeCubicInOut)
        .call(zoomBehaviorRef.current.transform, transform);
      return;
    }
  }, [selectedMarkerId, currentIndex, activeTaxaName, areaNavSignal, mapData, markers, dimensions]);

  // Guaranteed camera center & zoom animation upon any excavation navigation signal
  const prevSiteNavSignalRef = useRef<number>(0);
  useEffect(() => {
    if (!siteNavSignal || siteNavSignal.timestamp === prevSiteNavSignalRef.current) return;
    prevSiteNavSignalRef.current = siteNavSignal.timestamp;
    if (!svgRef.current || !zoomBehaviorRef.current || !mapData?.projection) return;

    const [x, y] = mapData.projection([siteNavSignal.site.lng, siteNavSignal.site.lat]) || [0, 0];
    const k = 3.5;
    const transform = d3.zoomIdentity
      .translate(dimensions.width / 2, dimensions.height / 2)
      .scale(k)
      .translate(-x, -y);

    d3.select(svgRef.current)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .call(zoomBehaviorRef.current.transform, transform);
  }, [siteNavSignal, mapData, dimensions]);

  // Compute currently targeted excavation site
  const activeExcavationSite = useMemo(() => {
    // 1. If an explicit siteNavSignal is present, prioritize the signaled site
    if (siteNavSignal?.site) {
      const match = markers.find(m => 
        (m.id && siteNavSignal.site.id && m.id === siteNavSignal.site.id) ||
        m.name.toLowerCase().trim() === siteNavSignal.site.name.toLowerCase().trim() ||
        m.name.split(/[,(]/)[0].toLowerCase().trim() === siteNavSignal.site.name.split(/[,(]/)[0].toLowerCase().trim() ||
        (Math.abs(m.lat - siteNavSignal.site.lat) < 0.001 && Math.abs(m.lng - siteNavSignal.site.lng) < 0.001)
      );
      if (match) return match;
      return siteNavSignal.site;
    }
    if (!markers || markers.length === 0) return null;
    if (typeof currentIndex === 'number' && currentIndex >= 0 && currentIndex < markers.length) {
      return markers[currentIndex];
    }
    if (selectedMarkerId) {
      const match = markers.find(m => 
        m.name === selectedMarkerId || 
        m.id === selectedMarkerId ||
        m.name.split(/[,(]/)[0].toLowerCase().trim() === selectedMarkerId.split(/[,(]/)[0].toLowerCase().trim() ||
        m.name.toLowerCase().includes(selectedMarkerId.toLowerCase()) ||
        selectedMarkerId.toLowerCase().includes(m.name.toLowerCase())
      );
      if (match) return match;
    }
    return markers[0] || null;
  }, [markers, currentIndex, selectedMarkerId, siteNavSignal]);

  // Smoothly glide the active excavation pin across the map between sites
  useEffect(() => {
    const targetSite = siteNavSignal?.site || activeExcavationSite;
    if (!targetSite || !mapData?.projection) return;
    const target = mapData.projection([targetSite.lng, targetSite.lat]);
    if (!target) return;

    const endX = target[0];
    const endY = target[1];

    if (!pinPosRef.current) {
      pinPosRef.current = { x: endX, y: endY };
      setAnimatedPinCoords({ x: endX, y: endY });
      return;
    }

    const startX = pinPosRef.current.x;
    const startY = pinPosRef.current.y;
    const dist = Math.hypot(endX - startX, endY - startY);

    if (dist < 0.5) {
      pinPosRef.current = { x: endX, y: endY };
      setAnimatedPinCoords({ x: endX, y: endY });
      return;
    }

    if (pinAnimFrameRef.current) {
      cancelAnimationFrame(pinAnimFrameRef.current);
      pinAnimFrameRef.current = null;
    }

    setFlightTrail({ x1: startX, y1: startY, x2: endX, y2: endY });
    setIsPinGliding(true);

    const startTime = performance.now();
    const duration = 750;

    const animatePin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentX = startX + (endX - startX) * ease;
      const currentY = startY + (endY - startY) * ease;

      pinPosRef.current = { x: currentX, y: currentY };
      setAnimatedPinCoords({ x: currentX, y: currentY });

      if (progress < 1) {
        pinAnimFrameRef.current = requestAnimationFrame(animatePin);
      } else {
        pinAnimFrameRef.current = null;
        setIsPinGliding(false);
      }
    };

    pinAnimFrameRef.current = requestAnimationFrame(animatePin);

    return () => {
      if (pinAnimFrameRef.current) {
        cancelAnimationFrame(pinAnimFrameRef.current);
      }
    };
  }, [activeExcavationSite, siteNavSignal, mapData]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy as any, 1.4);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy as any, 0.7);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(500).call(zoomBehaviorRef.current.transform as any, d3.zoomIdentity);
  };

  const handlePanDirection = (direction: 'north' | 'south' | 'east' | 'west') => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    const step = 150;
    let dx = 0;
    let dy = 0;
    if (direction === 'north') dy = step;
    if (direction === 'south') dy = -step;
    if (direction === 'west') dx = step;
    if (direction === 'east') dx = -step;
    svg.transition().duration(250).ease(d3.easeCubicOut).call(zoomBehaviorRef.current.translateBy as any, dx, dy);
  };

  const handleZoomToPreset = (targetScale: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current || !mapData) return;
    const svg = d3.select(svgRef.current);
    
    if (targetScale === 1) {
      svg.transition().duration(600).ease(d3.easeCubicInOut).call(zoomBehaviorRef.current.transform as any, d3.zoomIdentity);
      return;
    }

    // Zoom centered on active marker if available, else viewport center
    const activeM = markers.find(m => m.name === selectedMarkerId) || markers[0];
    let centerX = dimensions.width / 2;
    let centerY = dimensions.height / 2;

    if (activeM) {
      const pos = mapData.projection([activeM.lng, activeM.lat]);
      if (pos) {
        centerX = pos[0];
        centerY = pos[1];
      }
    }

    const transform = d3.zoomIdentity
      .translate(dimensions.width / 2, dimensions.height / 2)
      .scale(targetScale)
      .translate(-centerX, -centerY);

    svg.transition().duration(750).ease(d3.easeCubicInOut).call(zoomBehaviorRef.current.transform as any, transform);
  };

  // Real-time Viewport Center calculation based on projection and zoom transform
  const viewportCenter = useMemo(() => {
    if (!mapData?.projection) return { lat: 0, lng: 0, text: '0.0°N, 0.0°E' };
    try {
      const centerScreenX = dimensions.width / 2;
      const centerScreenY = dimensions.height / 2;
      const canvasX = (centerScreenX - zoomTransform.x) / zoomTransform.k;
      const canvasY = (centerScreenY - zoomTransform.y) / zoomTransform.k;
      const coords = mapData.projection.invert ? mapData.projection.invert([canvasX, canvasY]) : null;
      if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const lng = coords[0];
        const lat = coords[1];
        const latStr = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`;
        const lngStr = `${Math.abs(lng).toFixed(1)}°${lng >= 0 ? 'E' : 'W'}`;
        return { lat, lng, text: `${latStr}, ${lngStr}` };
      }
    } catch {}
    return { lat: 0, lng: 0, text: 'Equator (0.0°N, 0.0°E)' };
  }, [dimensions, zoomTransform, mapData]);

  const currentActiveMarker = useMemo(() => {
    if (!markers || markers.length === 0) return null;
    if (!selectedMarkerId) return markers[0];
    const exact = markers.find(m => m.name === selectedMarkerId || m.id === selectedMarkerId);
    if (exact) return exact;

    const baseSelected = selectedMarkerId.split(/[,(]/)[0].toLowerCase().trim();
    const fuzzy = markers.find(m => {
      const baseM = m.name.split(/[,(]/)[0].toLowerCase().trim();
      return baseM === baseSelected || m.name.toLowerCase().includes(baseSelected) || selectedMarkerId.toLowerCase().includes(baseM);
    });
    return fuzzy || markers[0];
  }, [markers, selectedMarkerId]);

  // Trail route path connecting the markers in sequence
  const trailPathData = useMemo(() => {
    if (!mapData || markers.length < 2) return null;
    
    const points: [number, number][] = [];
    markers.forEach(m => {
      const pos = mapData.projection([m.lng, m.lat]);
      if (pos) points.push(pos);
    });

    if (points.length < 2) return null;
    
    const lineGen = d3.line<[number, number]>()
      .curve(d3.curveCatmullRom.alpha(0.5))
      .x(d => d[0])
      .y(d => d[1]);

    return lineGen(points);
  }, [mapData, markers]);

  // Historical Species Migratory Footprint Trackway Coordinates & Trail Geometry
  const historicalFootprintTrackway = useMemo(() => {
    if (!mapData || !showFootprintTrails) return null;

    // Collect coordinates from migrationLapse or fallback sites
    const pointsSource = (paleoData?.migrationLapse && paleoData.migrationLapse.length >= 2)
      ? paleoData.migrationLapse
      : markers.length >= 2
      ? markers
      : [
          { name: 'Nesting Ground', lat: 47.0, lng: -106.0, seasonMonth: 'Spring (Q1)', ecologicalActivity: 'Breeding & Clutch Guarding' },
          { name: 'Lowland Delta Corridor', lat: 44.5, lng: -101.5, seasonMonth: 'Summer (Q2)', ecologicalActivity: 'Fluvial Delta Foraging' },
          { name: 'Montane Refuge Corridor', lat: 41.2, lng: -108.2, seasonMonth: 'Autumn (Q3)', ecologicalActivity: 'Highland Mass Herbivore Ambush' },
          { name: 'Coastal Winter Refuge', lat: 38.0, lng: -98.0, seasonMonth: 'Winter (Q4)', ecologicalActivity: 'Low-Elevation Winter Refuge' }
        ];

    const mappedWaypoints = pointsSource.map((wp, idx) => {
      const pos = mapData.projection([wp.lng, wp.lat]);
      return {
        ...wp,
        x: pos ? pos[0] : 0,
        y: pos ? pos[1] : 0,
        idx
      };
    }).filter(p => p.x !== 0 && p.y !== 0);

    if (mappedWaypoints.length < 2) return null;

    // Create polyline connecting points
    const lineGen = d3.line<typeof mappedWaypoints[0]>()
      .curve(d3.curveCatmullRomClosed.alpha(0.5))
      .x(p => p.x)
      .y(p => p.y);

    const polylineD = lineGen(mappedWaypoints) || '';

    // Interpolate trackway steps along each segment
    const trackwaySteps: Array<{
      x: number;
      y: number;
      footX: number;
      footY: number;
      angleDeg: number;
      side: 'left' | 'right';
      stepNum: number;
      seasonColor: string;
      seasonName: string;
      sourceWpName: string;
    }> = [];

    const seasonColors = ['#f59e0b', '#10b981', '#06b6d4', '#38bdf8'];
    const seasonNames = ['Spring Forage', 'Summer Colony', 'Autumn Corridor', 'Winter Refuge'];

    let totalStepCount = 0;

    for (let i = 0; i < mappedWaypoints.length; i++) {
      const p1 = mappedWaypoints[i];
      const p2 = mappedWaypoints[(i + 1) % mappedWaypoints.length];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) continue;

      const angleRad = Math.atan2(dy, dx);
      const angleDeg = (angleRad * 180) / Math.PI;

      // Normal vector for alternating left/right offset
      const nx = -Math.sin(angleRad);
      const ny = Math.cos(angleRad);

      const numSteps = Math.max(4, Math.min(16, Math.floor(dist / 14)));
      const color = seasonColors[i % seasonColors.length];
      const seasonName = seasonNames[i % seasonNames.length];

      for (let s = 1; s <= numSteps; s++) {
        const t = s / (numSteps + 1);
        const bx = p1.x + dx * t;
        const by = p1.y + dy * t;

        const side = (totalStepCount % 2 === 0) ? 'left' : 'right';
        const offsetPx = (side === 'left' ? -3.5 : 3.5) / Math.max(0.6, Math.sqrt(zoomTransform.k));

        const footX = bx + nx * offsetPx;
        const footY = by + ny * offsetPx;

        totalStepCount++;
        trackwaySteps.push({
          x: bx,
          y: by,
          footX,
          footY,
          angleDeg,
          side,
          stepNum: totalStepCount,
          seasonColor: color,
          seasonName,
          sourceWpName: p1.name
        });
      }
    }

    return {
      mappedWaypoints,
      polylineD,
      trackwaySteps,
      totalDistanceKm: Math.round(mappedWaypoints.length * 310)
    };
  }, [mapData, showFootprintTrails, paleoData, markers, zoomTransform.k]);

  // Trackway step runner animation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTrackwayPlaying && historicalFootprintTrackway?.trackwaySteps?.length) {
      interval = setInterval(() => {
        setTrackwayAnimIdx(prev => (prev + 1) % historicalFootprintTrackway.trackwaySteps.length);
      }, 280);
    }
    return () => clearInterval(interval);
  }, [isTrackwayPlaying, historicalFootprintTrackway]);

  // Hovered site details for comprehensive floating "All Specs" tooltip
  const hoveredSiteDetails = useMemo(() => {
    if (!hoveredSiteId || !mapData) return null;
    const site = markers.find(m => m.id === hoveredSiteId);
    if (!site) return null;
    const index = markers.findIndex(m => m.id === hoveredSiteId);
    const pos = mapData.projection([site.lng, site.lat]);
    if (!pos) return null;

    const screenX = pos[0] * zoomTransform.k + zoomTransform.x;
    const screenY = pos[1] * zoomTransform.k + zoomTransform.y;
    const details = getSitePhenomenaDetails(site, index, activeTaxaName, paleoData);

    return {
      site,
      index,
      screenX,
      screenY,
      details
    };
  }, [hoveredSiteId, mapData, markers, zoomTransform, activeTaxaName, paleoData]);

  // Visual icon helper
  const renderWeatherIcon = (iconType: SitePhenomenaInfo['iconType'], className = "w-3.5 h-3.5") => {
    switch (iconType) {
      case 'sun': return <Sun className={className} />;
      case 'rain': return <CloudRain className={className} />;
      case 'waves': return <Waves className={className} />;
      case 'flame': return <Flame className={className} />;
      case 'trees': return <Trees className={className} />;
      case 'wind': return <Wind className={className} />;
      case 'droplets': return <Droplets className={className} />;
      case 'snow': return <Snowflake className={className} />;
      default: return <Sun className={className} />;
    }
  };

  // --- Viewport Elements Renderers (Docked inside container or extracted) ---
  const renderLocalityCardContent = (isInsideContainer: boolean) => {
    const site = hoveredSiteDetails ? hoveredSiteDetails.site : currentActiveMarker || markers[currentIndex || 0];
    if (!site) {
      return (
        <div className={`p-4 text-center text-xs text-slate-400 font-mono ${isInsideContainer ? '' : 'bg-slate-900/90 rounded-2xl border border-slate-700 p-4'}`}>
          No locality selected. Click any marker on the map to inspect.
        </div>
      );
    }
    const idx = markers.findIndex(m => m.id === site.id || m.name === site.name);
    const details = getSitePhenomenaDetails(site, idx >= 0 ? idx : 0, activeTaxaName, paleoData);

    return (
      <div className={`space-y-2.5 text-white ${isInsideContainer ? 'bg-transparent p-0' : 'bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 max-w-[340px] w-full'}`}>
        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono text-[9px] font-bold">
                Stop #{idx >= 0 ? idx + 1 : 1}
              </span>
              <span className="text-[10px] font-rounded font-extrabold text-slate-300 uppercase tracking-wider truncate">
                {details.regionCountry}
              </span>
              <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded border ${details.badgeBg} ${details.badgeText} ${details.badgeBorder}`}>
                {details.stratigraphicPeriod}
              </span>
            </div>
            <h4 className="text-sm font-rounded font-extrabold text-white mt-1 truncate leading-tight">
              {details.locationTitle}
            </h4>
          </div>

          {!isInsideContainer && (
            <button
              onClick={() => handleDockIn('locality_card')}
              className="flex items-center gap-1 px-2 py-1 rounded-xl text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 transition-all cursor-pointer shrink-0"
              title="Dock Locality Card into Elements Deck"
            >
              <ArrowDownToLine size={10} />
              <span>Dock</span>
            </button>
          )}
        </div>

        {/* Geological & Specimen Quick Metrics Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-[9.5px] font-mono">
          <div className="bg-slate-900/80 rounded-lg p-1.5 border border-slate-800">
            <span className="text-slate-400 block text-[8px] uppercase">Formation</span>
            <span className="text-emerald-300 font-bold truncate block">{details.formationName}</span>
          </div>
          <div className="bg-slate-900/80 rounded-lg p-1.5 border border-slate-800">
            <span className="text-slate-400 block text-[8px] uppercase">Recovery</span>
            <span className="text-amber-300 font-bold block">{details.osteologyRecoveryPct}% articulated</span>
          </div>
          <div className="bg-slate-900/80 rounded-lg p-1.5 border border-slate-800">
            <span className="text-slate-400 block text-[8px] uppercase">Coordinates</span>
            <span className="text-slate-200 block truncate">{site.lat.toFixed(2)}°N, {Math.abs(site.lng).toFixed(2)}°W</span>
          </div>
          <div className="bg-slate-900/80 rounded-lg p-1.5 border border-slate-800">
            <span className="text-slate-400 block text-[8px] uppercase">Sediment</span>
            <span className="text-slate-200 block truncate">{details.sedimentMatrix}</span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800">
          <button
            onClick={() => onMarkerClick(site)}
            className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-rounded font-extrabold text-[10.5px] transition-all cursor-pointer shadow-xs active:scale-95"
            title="Focus and snap map to this excavation site"
          >
            <LocateFixed size={12} />
            <span>Focus Site</span>
          </button>
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('overview')}
              className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-rounded font-bold text-[10.5px] border border-slate-700 transition-all cursor-pointer active:scale-95"
              title="Inspect specimen details in main observatory dossier"
            >
              <BookOpen size={12} />
              <span>Specimen Dossier</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCameraNavContent = (isInsideContainer: boolean) => (
    <div className={`flex flex-wrap items-center gap-1.5 ${isInsideContainer ? 'bg-transparent p-0' : 'bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-park-card-border/90 shadow-md'}`}>
      {/* North / Reset Bearing */}
      <button 
        onClick={handleResetZoom}
        className="w-8 h-8 rounded-xl bg-park-sand/50 hover:bg-park-land/30 border border-park-card-border/60 flex items-center justify-center text-park-tree active:scale-95 transition-all group relative cursor-pointer"
        title={`🧭 Viewport Orientation: North-Up (000°) • Center: ${viewportCenter.text} • Click to reset bearing & fit extents`}
      >
        <Compass size={16} strokeWidth={2.4} className="group-hover:rotate-45 transition-transform" />
      </button>

      <div className="w-px h-5 bg-slate-300/80 mx-0.5" />

      {/* 4-Way Directional Viewport Pan */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => handlePanDirection('west')}
          className="w-7 h-7 rounded-lg hover:bg-park-land/30 flex items-center justify-center text-park-tree/80 hover:text-park-tree active:scale-95 transition-all cursor-pointer"
          title={`⬅ Pan West • Current: ${viewportCenter.text}`}
        >
          <ArrowLeft size={13} strokeWidth={2.4} />
        </button>

        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => handlePanDirection('north')}
            className="w-7 h-3.5 rounded-sm hover:bg-park-land/30 flex items-center justify-center text-park-tree/80 hover:text-park-tree active:scale-95 transition-all cursor-pointer"
            title={`⬆ Pan North • Current: ${viewportCenter.text}`}
          >
            <ArrowUp size={11} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handlePanDirection('south')}
            className="w-7 h-3.5 rounded-sm hover:bg-park-land/30 flex items-center justify-center text-park-tree/80 hover:text-park-tree active:scale-95 transition-all cursor-pointer"
            title={`⬇ Pan South • Current: ${viewportCenter.text}`}
          >
            <ArrowDown size={11} strokeWidth={2.5} />
          </button>
        </div>

        <button
          onClick={() => handlePanDirection('east')}
          className="w-7 h-7 rounded-lg hover:bg-park-land/30 flex items-center justify-center text-park-tree/80 hover:text-park-tree active:scale-95 transition-all cursor-pointer"
          title={`➡ Pan East • Current: ${viewportCenter.text}`}
        >
          <ArrowRight size={13} strokeWidth={2.4} />
        </button>
      </div>

      <div className="w-px h-5 bg-slate-300/80 mx-0.5" />

      {/* Zoom Controls */}
      <button 
        onClick={handleZoomOut}
        className="w-7 h-7 rounded-lg hover:bg-park-land/30 flex items-center justify-center text-park-tree active:scale-95 transition-all cursor-pointer"
        title="Zoom Out"
      >
        <Minus size={14} strokeWidth={2.4} />
      </button>

      <button
        onClick={() => handleZoomToPreset(zoomTransform.k > 3 ? 1 : 3.6)}
        className="px-2 py-1 rounded-md bg-park-sand/60 border border-park-card-border/70 text-[9.5px] font-mono font-bold text-park-tree hover:bg-park-land/30 transition-colors cursor-pointer"
        title={`Scale: ${zoomTransform.k.toFixed(1)}x • Span: ~${Math.round(2000 / Math.max(1, zoomTransform.k))} km`}
      >
        {zoomTransform.k.toFixed(1)}x
      </button>

      <button 
        onClick={handleZoomIn}
        className="w-7 h-7 rounded-lg hover:bg-park-land/30 flex items-center justify-center text-park-tree active:scale-95 transition-all cursor-pointer"
        title="Zoom In"
      >
        <Plus size={14} strokeWidth={2.4} />
      </button>

      <button
        onClick={() => handleZoomToPreset(1)}
        className="w-7 h-7 rounded-lg hover:bg-park-land/30 flex items-center justify-center text-park-ink-muted hover:text-park-tree active:scale-95 transition-all cursor-pointer"
        title="Fit Full Continental Viewport Extents (1.0x Global)"
      >
        <Maximize2 size={12} strokeWidth={2.2} />
      </button>

      {/* Reset Layouts if moved */}
      {hasAnyCustomViewportLayout && (
        <button
          onClick={handleResetAllViewportOverlays}
          className="px-2 py-1 rounded-lg text-[8.5px] font-rounded font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 ml-1"
          title="Reset all moved overlays back to default"
        >
          <RotateCcw size={9} className="text-emerald-600" />
          <span>Reset Layouts</span>
        </button>
      )}

      {!isInsideContainer && (
        <button
          onClick={() => handleDockIn('camera_nav')}
          className="px-2 py-1 rounded-lg text-[8.5px] font-rounded font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 ml-1"
          title="Put Navigation controls back into Viewport Elements Deck"
        >
          <ArrowDownToLine size={9} />
          <span>Dock</span>
        </button>
      )}
    </div>
  );

  const renderLayerTogglesContent = (isInsideContainer: boolean) => (
    <div className={`space-y-2 select-none ${isInsideContainer ? 'bg-transparent p-0' : 'bg-white/95 backdrop-blur-md p-2 rounded-2xl border-2 border-white/90 shadow-xl max-w-[340px] w-full'}`}>
      <div className="flex items-center justify-between gap-1 border-b border-park-card-border pb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-park-tree text-white flex items-center justify-center shadow-2xs">
            <Navigation size={11} />
          </div>
          <span className="text-[11px] font-rounded font-extrabold text-park-tree tracking-wide">
            Trail Legend & Layers
          </span>
          <span className="text-[8.5px] font-mono px-1 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">
            {markers.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleShowInfoOnHover}
            className={`px-1.5 py-0.5 rounded-md text-[8px] font-rounded font-bold border transition-all flex items-center gap-1 cursor-pointer ${
              showInfoOnHover
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
            title={showInfoOnHover ? "Tooltip hover info is ON" : "Tooltip hover info is OFF"}
          >
            {showInfoOnHover ? <Eye size={9} className="text-emerald-600" /> : <EyeOff size={9} className="text-slate-400" />}
            <span>Hover Info</span>
          </button>
          {!isInsideContainer && (
            <button
              onClick={() => handleDockIn('layer_toggles')}
              className="px-1.5 py-0.5 rounded-md text-[8px] font-rounded font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-0.5 cursor-pointer shadow-2xs"
              title="Dock Trail Legend back into Elements Deck"
            >
              <ArrowDownToLine size={8} />
              <span>Dock</span>
            </button>
          )}
        </div>
      </div>

      {/* Layer Toggle Chips */}
      <div className="grid grid-cols-4 gap-1 bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80">
        <button
          onClick={() => setLegendFilter('climate')}
          className={`py-1 px-0.5 rounded-lg text-[8.5px] font-rounded font-bold transition-all flex items-center justify-center gap-0.5 cursor-pointer ${
            legendFilter === 'climate'
              ? 'bg-white text-amber-900 shadow-xs border border-slate-200 font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sun size={10} className="text-amber-500 shrink-0" />
          <span>Climate</span>
        </button>

        <button
          onClick={() => setLegendFilter('stratigraphy')}
          className={`py-1 px-0.5 rounded-lg text-[8.5px] font-rounded font-bold transition-all flex items-center justify-center gap-0.5 cursor-pointer ${
            legendFilter === 'stratigraphy'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200 font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mountain size={10} className="text-emerald-600 shrink-0" />
          <span>Strata</span>
        </button>

        <button
          onClick={() => setLegendFilter('taphonomy')}
          className={`py-1 px-0.5 rounded-lg text-[8.5px] font-rounded font-bold transition-all flex items-center justify-center gap-0.5 cursor-pointer ${
            legendFilter === 'taphonomy'
              ? 'bg-white text-sky-900 shadow-xs border border-slate-200 font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock size={10} className="text-sky-600 shrink-0" />
          <span>Recovery</span>
        </button>

        <button
          onClick={() => setLegendFilter('cardinal')}
          className={`py-1 px-0.5 rounded-lg text-[8.5px] font-rounded font-bold transition-all flex items-center justify-center gap-0.5 cursor-pointer ${
            legendFilter === 'cardinal'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200 font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass size={10} className="text-teal-600 shrink-0" />
          <span>Cardinal</span>
        </button>
      </div>

      {/* Historical Species Migratory Footprint Trail Visual Toggle */}
      <button
        onClick={toggleFootprintTrails}
        className={`w-full py-1.5 px-2 rounded-xl text-[10px] font-rounded font-extrabold transition-all flex items-center justify-between gap-1.5 cursor-pointer shadow-3xs border ${
          showFootprintTrails
            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-xs'
            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
        }`}
        title="Toggle Historical Species Migratory Trackway Footprint Overlay"
      >
        <div className="flex items-center gap-1.5">
          <Footprints size={13} className={showFootprintTrails ? 'text-slate-950 animate-bounce' : 'text-slate-500'} />
          <span>Footprint Trails Overlay</span>
        </div>
        <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded ${
          showFootprintTrails ? 'bg-slate-950 text-amber-300' : 'bg-slate-200 text-slate-600'
        }`}>
          {showFootprintTrails ? 'ON' : 'OFF'}
        </span>
      </button>

      {/* Markers roster */}
      <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto pr-0.5">
        {markers.map((marker, idx) => {
          const isCur = marker.name === selectedMarkerId || 
            (selectedMarkerId && marker.name.split(/[,(]/)[0].toLowerCase().trim() === selectedMarkerId.split(/[,(]/)[0].toLowerCase().trim());
          const isHovered = hoveredSiteId === marker.id;
          const details = getSitePhenomenaDetails(marker, idx, activeTaxaName, paleoData);

          const courseBorderColors = ['border-emerald-500', 'border-amber-500', 'border-sky-500', 'border-rose-500', 'border-purple-500', 'border-teal-500'];
          const courseBgColors = ['bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-rose-500', 'bg-purple-500', 'bg-teal-500'];
          const pinBorder = courseBorderColors[idx % courseBorderColors.length];
          const pinBg = courseBgColors[idx % courseBgColors.length];

          return (
            <div
              key={marker.id}
              onClick={() => onMarkerClick(marker)}
              onMouseEnter={() => setHoveredSiteId(marker.id)}
              onMouseLeave={() => setHoveredSiteId(null)}
              className={`group flex items-center gap-2 px-2 py-1 rounded-xl transition-all cursor-pointer ${
                isCur 
                  ? 'bg-rose-50/90 border-2 border-rose-300 shadow-2xs' 
                  : isHovered 
                    ? 'bg-slate-100/80 border border-slate-300' 
                    : 'hover:bg-slate-50 border border-slate-200/50'
              }`}
            >
              <div className="relative shrink-0">
                <div className={`w-7 h-7 rounded-lg bg-white border p-0.5 flex items-center justify-center shadow-2xs overflow-hidden ${
                  isCur ? 'border-rose-500 ring-1 ring-rose-300' : `${pinBorder}`
                }`}>
                  <span className={`absolute -top-1 -left-1 px-1 py-0.2 rounded-sm ${pinBg} text-white text-[7px] font-mono font-bold leading-none`}>
                    #{idx + 1}
                  </span>
                  <svg viewBox="0 0 600 520" className="w-full h-full object-contain">
                    <path 
                      d={dinoSilhouette.silhouettePath} 
                      fill={isCur ? dinoSilhouette.accentColor : '#64748b'} 
                      stroke="#1e293b"
                      strokeWidth="16"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[10.5px] font-rounded font-extrabold truncate ${isCur ? 'text-rose-950 font-black' : 'text-slate-800'}`}>
                    {details.locationTitle}
                  </span>
                  {legendFilter === 'climate' && (
                    <span className={`text-[8px] font-rounded font-bold px-1.5 py-0.2 rounded-md border flex items-center gap-0.8 shrink-0 ${details.badgeBg} ${details.badgeBorder} ${details.badgeText}`}>
                      <span className={details.iconColor}>
                        {renderWeatherIcon(details.iconType, "w-2.5 h-2.5")}
                      </span>
                      <span className="truncate max-w-[65px]">{details.climateBiome}</span>
                    </span>
                  )}
                  {legendFilter === 'stratigraphy' && (
                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 shrink-0">
                      {details.stratigraphicAge}
                    </span>
                  )}
                  {legendFilter === 'taphonomy' && (
                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-sky-50 text-sky-900 border border-sky-200 flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 size={8} className="text-emerald-600" />
                      <span>{details.osteologyRecoveryPct}%</span>
                    </span>
                  )}
                  {legendFilter === 'cardinal' && (() => {
                    if (isCur) {
                      return (
                        <span className="text-[7.5px] font-mono font-extrabold px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-900 border border-rose-200 shrink-0">
                          📍 Origin
                        </span>
                      );
                    }
                    const rel = currentActiveMarker ? computeRelativeLocation(currentActiveMarker, marker) : null;
                    if (!rel) return null;
                    return (
                      <span className="text-[7.5px] font-mono font-bold px-1 py-0.2 rounded-md bg-teal-50 text-teal-900 border border-teal-200 shrink-0">
                        {rel.cardinal} {Math.round(rel.distanceKm)}km
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-center justify-between text-[7.5px] text-slate-500 pt-0.2">
                  <span className="truncate max-w-[120px]">
                    {legendFilter === 'climate' ? details.weatherType : details.formationName}
                  </span>
                  <span className="font-mono text-slate-400">
                    {marker.lat.toFixed(1)}°N, {Math.abs(marker.lng).toFixed(1)}°W
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPlottingRibbonContent = (isInsideContainer: boolean) => (
    <div className={`space-y-1.5 select-none ${isInsideContainer ? 'bg-transparent p-0' : 'bg-white/95 backdrop-blur-md p-2 rounded-2xl border-2 border-white/80 shadow-md max-w-[500px] w-full'}`}>
      <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={13} className="text-emerald-700" />
          <span className="text-[10px] font-rounded font-extrabold tracking-wide uppercase text-slate-800">
            Plotting Specialization Layer
          </span>
          <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            {PLOTTING_MODE_LABELS[plottingConfig.mode] || plottingConfig.mode}
          </span>
        </div>
        {!isInsideContainer && (
          <button
            onClick={() => handleDockIn('plotting_ribbon')}
            className="px-1.5 py-0.5 rounded-md text-[8px] font-rounded font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-0.5 cursor-pointer shadow-2xs"
            title="Dock Plotting Suite into Elements Deck"
          >
            <ArrowDownToLine size={8} />
            <span>Dock</span>
          </button>
        )}
      </div>
      <PlottingSpecializationLayer
        config={plottingConfig}
        onChangeConfig={handleUpdatePlottingConfig}
        isPanelOpen={isPlottingPanelOpen}
        onTogglePanel={handleTogglePlottingPanel}
        markersCount={markers.length}
      />
    </div>
  );

  const renderPinBannerContent = (isInsideContainer: boolean) => {
    if (!currentActiveMarker) return null;
    const idx = markers.findIndex(m => m.id === currentActiveMarker.id || m.name === currentActiveMarker.name);
    return (
      <div className={`flex items-center gap-2 ${isInsideContainer ? 'bg-transparent p-0' : 'bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-2xl border border-emerald-500/60 shadow-xl'} text-white pointer-events-auto`}>
        <div className="relative flex items-center justify-center shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 relative" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-rounded font-extrabold truncate">
          <span className="text-emerald-400 font-mono text-[9.5px] tracking-wider uppercase font-bold">
            PIN {markers.length > 0 ? (idx >= 0 ? idx + 1 : currentIndex + 1) : 0}/{markers.length}:
          </span>
          <span 
            className="text-white hover:text-emerald-300 transition-colors cursor-pointer truncate max-w-[200px] sm:max-w-xs"
            onClick={() => onMarkerClick(currentActiveMarker)}
            title="Click to center map on this pin"
          >
            {currentActiveMarker.name}
          </span>
        </div>
        <div className="text-[9.5px] font-mono text-emerald-300/80 pl-1.5 border-l border-slate-700/80 hidden md:block shrink-0">
          {currentActiveMarker.lat.toFixed(2)}°N, {Math.abs(currentActiveMarker.lng).toFixed(2)}°W
        </div>
        {/* Site Steppers */}
        <div className="flex items-center gap-1 pl-1.5 border-l border-slate-700/80 shrink-0">
          {onPrevSite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (markers.length <= 1) return;
                onPrevSite();
              }}
              disabled={markers.length <= 1}
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 cursor-pointer transition-all active:scale-95"
              title="Previous site"
            >
              <ChevronLeft size={11} />
            </button>
          )}
          {onNextSite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (markers.length <= 1) return;
                onNextSite();
              }}
              disabled={markers.length <= 1}
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 cursor-pointer transition-all active:scale-95"
              title="Next site"
            >
              <ChevronRight size={11} />
            </button>
          )}
        </div>
        {!isInsideContainer && (
          <button
            onClick={() => handleDockIn('pin_banner')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 transition-all cursor-pointer ml-1"
            title="Dock Pin Banner into Elements Deck"
          >
            <ArrowDownToLine size={9} />
            <span>Dock</span>
          </button>
        )}
      </div>
    );
  };

  const renderModeSwitcherContent = (isInsideContainer: boolean) => (
    <div className={`flex flex-wrap items-center gap-1.5 ${isInsideContainer ? 'bg-transparent p-0' : 'bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl'}`}>
      <div className="flex items-center gap-1.5 px-2 py-1 text-emerald-400 font-mono text-[11px] font-bold">
        <Layers size={15} />
        <span className="tracking-wide uppercase hidden sm:inline">Paleo Atlas</span>
      </div>

      <div className="w-px h-4 bg-slate-700 mx-0.5" />

      {/* Switch to Google Earth 3D */}
      {onSwitchToGoogleEarth && (
        <button
          onClick={onSwitchToGoogleEarth}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-rounded font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-xs active:scale-95"
          title="Switch to Google Earth 3D Globe with photorealistic topography and satellite API"
        >
          <Globe size={11} />
          <span>Switch to Google Earth 3D</span>
        </button>
      )}

      {/* Historical Footprint Trails Toggle Pill */}
      <button
        onClick={toggleFootprintTrails}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-rounded font-extrabold transition-all cursor-pointer ${
          showFootprintTrails
            ? 'bg-amber-400 text-slate-950 border border-amber-300 shadow-xs'
            : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50'
        }`}
        title="Toggle Historical Species Migratory Footprint Trails on Paleo Atlas Map"
      >
        <Footprints size={11} className={showFootprintTrails ? 'text-slate-950' : 'text-amber-400'} />
        <span>Footprint Trails: {showFootprintTrails ? 'ON' : 'OFF'}</span>
      </button>

      {/* Hover Info Toggle */}
      <button
        onClick={toggleShowInfoOnHover}
        className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-rounded font-bold transition-all cursor-pointer ${
          showInfoOnHover
            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
            : 'text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700/50'
        }`}
        title="Toggle Map Pin Hover Info"
      >
        {showInfoOnHover ? <Eye size={11} /> : <EyeOff size={11} />}
        <span>Hover: {showInfoOnHover ? 'ON' : 'OFF'}</span>
      </button>

      {showInfoOnHover && (
        <button
          onClick={toggleHoverDetailMode}
          className="px-2 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[9px] font-rounded font-bold transition-all cursor-pointer"
          title="Toggle hover spec detail mode"
        >
          {hoverDetailMode === 'full' ? 'Full Specs' : 'Compact'}
        </button>
      )}

      {/* North reset */}
      <button
        onClick={handleResetZoom}
        className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-mono text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/50 transition-all cursor-pointer"
        title="Reset Viewport to True North"
      >
        <Compass size={11} />
        <span>000° N</span>
      </button>

      {/* Reset all layouts */}
      {hasAnyCustomViewportLayout && (
        <button
          onClick={handleResetAllViewportOverlays}
          className="flex items-center gap-1 px-2 py-1 rounded-xl text-[9px] font-mono font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 transition-all cursor-pointer ml-1"
          title="Reset all dragged and resized overlays back to default"
        >
          <RotateCcw size={10} />
          <span>Reset Layouts</span>
        </button>
      )}

      {!isInsideContainer && (
        <button
          onClick={() => handleDockIn('mode_switcher')}
          className="flex items-center gap-1 px-2 py-1 rounded-xl text-[9.5px] font-mono font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 transition-all cursor-pointer ml-1"
          title="Put Mode Switcher back into Elements Deck"
        >
          <ArrowDownToLine size={10} />
          <span>Dock</span>
        </button>
      )}
    </div>
  );

  const renderViewportElement = (id: ViewportElementId, isInsideContainer: boolean) => {
    switch (id) {
      case 'locality_card':
        return renderLocalityCardContent(isInsideContainer);
      case 'camera_nav':
        return renderCameraNavContent(isInsideContainer);
      case 'layer_toggles':
        return renderLayerTogglesContent(isInsideContainer);
      case 'plotting_ribbon':
        return renderPlottingRibbonContent(isInsideContainer);
      case 'pin_banner':
        return renderPinBannerContent(isInsideContainer);
      case 'mode_switcher':
        return renderModeSwitcherContent(isInsideContainer);
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-park-sea select-none">
      
      {/* Top Left: Plotting Specialisation / Abstraction Layer (MOVEABLE, RESIZABLE, & COLLAPSIBLE) */}
      {!dockedState.plotting_ribbon && (
        <div 
          ref={plottingRef}
          id="plotting-specialisation-layer"
          style={{
            ...(plottingPos ? {
              left: `${plottingPos.x}px`,
              top: `${plottingPos.y}px`,
              right: 'auto',
              bottom: 'auto'
            } : {}),
            ...(isPlottingExpanded && plottingSize ? {
              width: `${plottingSize.width}px`,
              maxWidth: `${plottingSize.width}px`,
              height: isPlottingPanelOpen ? `${plottingSize.height}px` : undefined,
            } : {})
          }}
          className={`absolute z-25 flex flex-col items-start bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border-2 select-none transition-all ${
            plottingPos ? '' : 'top-4 left-4'
          } ${isPlottingExpanded ? 'w-full max-w-[500px]' : 'w-auto'} ${
            isDraggingPlotting
              ? 'cursor-grabbing shadow-2xl ring-2 ring-emerald-500/40 border-emerald-400/80 transition-none'
              : isResizingPlotting
              ? 'cursor-nwse-resize shadow-2xl ring-2 ring-emerald-500/40 border-emerald-400/80 transition-none'
              : 'border-white/80 shadow-md duration-200'
          } max-w-[calc(100vw-2rem)] overflow-hidden`}
        >
          {/* Drag handle header for Plotting Layer */}
          <div 
            onPointerDown={handlePlottingPointerDown}
            onDoubleClick={handleResetPlotting}
            onClick={(e) => {
              // Clicking header when collapsed expands it
              if (!isPlottingExpanded) {
                const target = e.target as HTMLElement;
                if (!target.closest('button')) {
                  setIsPlottingExpanded(true);
                }
              }
            }}
            className={`w-full flex items-center justify-between gap-2 px-1.5 py-1 ${isPlottingExpanded ? 'mb-1' : 'mb-0'} rounded-xl border border-transparent transition-colors touch-none select-none ${
              isDraggingPlotting 
                ? 'bg-emerald-50 text-emerald-800 cursor-grabbing' 
                : 'hover:bg-slate-100/70 text-slate-500 hover:text-slate-800 cursor-grab'
            }`}
            title="Drag anywhere on header to move Plotting Layer anywhere on screen • Double-click to reset • Click to expand/collapse"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <GripVertical size={13} className="text-slate-400 shrink-0" />
              <span className="text-[9.5px] font-rounded font-extrabold tracking-wide uppercase truncate">
                Plotting Specialization
              </span>
              {/* Active Mode Pill Badge */}
              <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[120px]">{PLOTTING_MODE_LABELS[plottingConfig.mode] || plottingConfig.mode}</span>
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Dock button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDockIn('plotting_ribbon');
                }}
                className="px-1.5 py-0.5 rounded-md text-[8px] font-mono font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-0.5 cursor-pointer shadow-2xs"
                title="Dock Plotting Layer into Elements Deck"
                aria-label="Dock Plotting Layer"
              >
                <ArrowDownToLine size={8} />
                <span>Dock</span>
              </button>

              {/* Reset Button (when moved or resized) */}
              {(plottingPos || plottingSize) && (
                <button
                  onClick={handleResetPlotting}
                  className="px-1.5 py-0.5 rounded-md text-[8px] font-mono font-bold bg-white text-slate-600 hover:bg-slate-200 border border-slate-200 flex items-center gap-0.5 cursor-pointer shadow-2xs"
                  title="Reset Plotting Layer position & size"
                  aria-label="Reset position and size"
                >
                  <RotateCcw size={8} />
                  <span>Reset</span>
                </button>
              )}

              {/* Collapse / Expand Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlottingExpanded(prev => !prev);
                }}
                className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                title={isPlottingExpanded ? "Collapse Plotting Specialization layer" : "Expand Plotting Specialization layer"}
                aria-label={isPlottingExpanded ? "Collapse Plotting Specialization" : "Expand Plotting Specialization"}
              >
                {isPlottingExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* Collapsible Content */}
          {isPlottingExpanded && (
            <div className="w-full flex-1 overflow-y-auto pr-0.5 animate-in fade-in duration-150">
              <PlottingSpecializationLayer
                config={plottingConfig}
                onChangeConfig={handleUpdatePlottingConfig}
                isPanelOpen={isPlottingPanelOpen}
                onTogglePanel={handleTogglePlottingPanel}
                markersCount={markers.length}
              />
            </div>
          )}

          {/* Corner Resize Grip (only visible when expanded) */}
          {isPlottingExpanded && (
            <div
              data-plotting-resize
              onPointerDown={handlePlottingResizePointerDown}
              className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize text-slate-400 hover:text-slate-700 flex items-center justify-center select-none touch-none z-20 group"
              title="Drag to resize Plotting Layer width & height"
            >
              <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-current opacity-60 group-hover:opacity-100">
                <circle cx="10" cy="10" r="1.2" />
                <circle cx="6" cy="10" r="1.2" />
                <circle cx="10" cy="6" r="1.2" />
                <circle cx="2" cy="10" r="1.2" />
                <circle cx="6" cy="6" r="1.2" />
                <circle cx="10" cy="2" r="1.2" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Top Left: Extracted Mode Switcher (when snipped out) */}
      {!dockedState.mode_switcher && (
        <div className="absolute top-4 left-4 z-20 pointer-events-auto">
          {renderModeSwitcherContent(false)}
        </div>
      )}

      {/* Top Center: Extracted Pin Banner (when snipped out) */}
      {!dockedState.pin_banner && currentActiveMarker && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          {renderPinBannerContent(false)}
        </div>
      )}

      {/* Extracted Locality Card (when snipped out and a site is active) */}
      {!dockedState.locality_card && (
        <div className="absolute top-16 right-4 z-25 pointer-events-auto hidden md:block">
          {renderLocalityCardContent(false)}
        </div>
      )}

      {/* Top Center: Geographic Area Navigation HUD Notification */}
      {navBanner && (
        <div 
          id="map-geographic-navigation-hud"
          className="absolute top-4 left-1/2 -translate-x-1/2 z-35 flex items-center gap-2.5 px-4 py-2 bg-stone-950/90 text-stone-100 backdrop-blur-md rounded-full border border-amber-500/40 shadow-2xl transition-all duration-300 pointer-events-none animate-in fade-in slide-in-from-top-3 max-w-[90vw]"
        >
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <Compass className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
              {navBanner.badge}
            </span>
            <span className="text-xs font-semibold text-stone-100">{navBanner.title}</span>
            {navBanner.detail && (
              <span className="text-[11px] text-stone-300 font-mono hidden sm:inline truncate max-w-[280px]">
                • {navBanner.detail}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Left: Historical Species Migratory Footprint Trail HUD Card */}
      {showFootprintTrails && historicalFootprintTrackway && (
        <div 
          id="historical-footprint-trail-hud"
          className="absolute bottom-5 left-4 z-30 bg-slate-950/95 text-white backdrop-blur-md p-3 rounded-2xl border border-amber-500/60 shadow-2xl space-y-2 max-w-[280px] sm:max-w-[320px] w-full animate-in fade-in slide-in-from-bottom-2 pointer-events-auto"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xs shrink-0 font-bold">
                <Footprints size={14} className="animate-bounce" />
              </div>
              <div className="min-w-0">
                <h5 className="text-[11px] font-rounded font-extrabold text-amber-300 uppercase tracking-wider truncate">
                  {activeTaxaName} Trackway
                </h5>
                <span className="text-[8.5px] font-mono text-slate-400 block truncate">
                  Historical Species Footprint Overlay
                </span>
              </div>
            </div>

            <button
              onClick={toggleFootprintTrails}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors shrink-0"
              title="Hide Footprint Trails Overlay"
            >
              <X size={12} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[9.5px] font-mono">
            <div className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 text-[8px] uppercase block">Trail Corridor</span>
              <span className="text-amber-300 font-bold block truncate">
                ~{historicalFootprintTrackway.totalDistanceKm.toLocaleString()} km
              </span>
            </div>
            <div className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 text-[8px] uppercase block">Mapped Prints</span>
              <span className="text-emerald-400 font-bold block truncate">
                {historicalFootprintTrackway.trackwaySteps.length} Footprints
              </span>
            </div>
          </div>

          {/* Gait Simulation March Controls */}
          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80">
            <button
              onClick={() => setIsTrackwayPlaying(!isTrackwayPlaying)}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-[10px] font-rounded font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isTrackwayPlaying
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              }`}
              title="Simulate gait march along trackway"
            >
              {isTrackwayPlaying ? <Pause size={11} /> : <Play size={11} />}
              <span>{isTrackwayPlaying ? 'Pause Gait March' : 'Simulate Gait March'}</span>
            </button>

            <span className="text-[8.5px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded-lg border border-amber-800/60 shrink-0 font-bold">
              Step #{trackwayAnimIdx + 1}
            </span>
          </div>
        </div>
      )}

      {/* SVG Canvas Map */}
      {mapData && (
        <svg 
          ref={svgRef} 
          width={dimensions.width} 
          height={dimensions.height}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        >
          <defs>
            <radialGradient id="water-gradient" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#89c2c6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#67b2b8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#418d96" stopOpacity="1" />
            </radialGradient>

            <linearGradient id="land-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e9ecc9" />
              <stop offset="50%" stopColor="#dfe5b5" />
              <stop offset="100%" stopColor="#c5ce96" />
            </linearGradient>

            <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1f3835" floodOpacity="0.25" />
            </filter>

            <filter id="bubble-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.35" />
            </filter>

            {/* Cardinal Vector Arrowheads */}
            <marker
              id="cardinal-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0d9488" />
            </marker>
            <marker
              id="cardinal-arrow-hover"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#0284c7" />
            </marker>
          </defs>

          <g ref={gRef}>
            {/* 1. Ocean Background Layer */}
            <rect width={dimensions.width * 4} height={dimensions.height * 4} x={-dimensions.width * 1.5} y={-dimensions.height * 1.5} fill="url(#water-gradient)" />

            {/* 2. Graticule coordinate lines */}
            <path
              d={mapData.pathGenerator(mapData.graticule) || ''}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.6"
              strokeDasharray="3,6"
              strokeOpacity="0.45"
            />

            {/* 3. Landmass Coastlines */}
            <path
              d={mapData.pathGenerator(mapData.land) || ''}
              fill="url(#land-gradient)"
              stroke="#8a9657"
              strokeWidth="1.2"
              filter="url(#soft-shadow)"
            />

            {/* 4. Country Border Boundaries */}
            <path
              d={mapData.pathGenerator(mapData.countries) || ''}
              fill="none"
              stroke="#9ba866"
              strokeWidth="0.6"
              strokeDasharray="2,3"
              strokeOpacity="0.8"
            />

            {/* 5. Decorative Vegetation Clusters */}
            {DECORATIVE_TREES.map((tree, i) => {
              const pos = mapData.projection([tree.lng, tree.lat]);
              if (!pos) return null;
              const scale = (tree.scale || 1.0) * (1 / Math.max(1, Math.sqrt(zoomTransform.k)));
              return (
                <g key={`tree-${i}`} transform={`translate(${pos[0]}, ${pos[1]}) scale(${scale})`} opacity="0.65" pointerEvents="none">
                  <path d="M 0,-8 L 6,2 L 2,2 L 5,8 L -5,8 L -2,2 L -6,2 Z" fill="#6d8647" />
                  <rect x="-1" y="8" width="2" height="3" fill="#4d3d28" />
                </g>
              );
            })}

            {/* 6. Decorative Ocean Clouds */}
            {DECORATIVE_CLOUDS.map((cloud, i) => {
              const pos = mapData.projection([cloud.lng, cloud.lat]);
              if (!pos) return null;
              const scale = (cloud.size / 50) * (1 / Math.max(1, Math.sqrt(zoomTransform.k)));
              return (
                <g key={`cloud-${i}`} transform={`translate(${pos[0]}, ${pos[1]}) scale(${scale})`} opacity="0.35" pointerEvents="none">
                  <path d="M 10,0 C 10,-8 -5,-10 -10,-4 C -16,-4 -20,2 -16,8 C -18,12 -12,16 -6,15 C 0,18 10,16 12,12 C 18,10 18,2 10,0 Z" fill="#ffffff" filter="url(#soft-shadow)" />
                </g>
              );
            })}

            {/* 7. Decorative Expedition Sailing Vessels */}
            {DECORATIVE_BOATS.map((boat, i) => {
              const pos = mapData.projection([boat.lng, boat.lat]);
              if (!pos) return null;
              const scale = 0.85 * (1 / Math.max(1, Math.sqrt(zoomTransform.k)));
              return (
                <g key={`boat-${i}`} transform={`translate(${pos[0]}, ${pos[1]}) rotate(${boat.angle}) scale(${scale})`} opacity="0.75" pointerEvents="none">
                  <path d="M -12,5 C -8,9 8,9 12,5 L 8,10 C 2,12 -2,12 -8,10 Z" fill="#4a3728" />
                  <line x1="0" y1="5" x2="0" y2="-12" stroke="#2c221a" strokeWidth="1.5" />
                  <path d="M 0,-10 L 8,-3 L 0,-1 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
                  <path d="M -1,-9 L -7,-2 L -1,-1 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
                </g>
              );
            })}

            {/* 8. PLOTTING SPECIALIZATION & ABSTRACTION LAYERS */}
            
            {/* Mode 1: Fossil Sites Survey Trail & Geospatial Buffer Intervals */}
            {plottingConfig.mode === 'trails' && (
              <g pointerEvents="none">
                {/* Trail Route Polyline */}
                {trailPathData && (
                  <g>
                    <path
                      d={trailPathData}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={4 / zoomTransform.k}
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                    <path
                      d={trailPathData}
                      fill="none"
                      stroke="#059669"
                      strokeWidth={2.2 / zoomTransform.k}
                      strokeDasharray={`${6 / zoomTransform.k},${5 / zoomTransform.k}`}
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                  </g>
                )}

                {/* Geospatial Buffer Rings with interactive radius interval */}
                {plottingConfig.bufferRadiusKm > 0 && markers.map((site) => {
                  const pos = mapData.projection([site.lng, site.lat]);
                  if (!pos) return null;
                  const isSelected = site.name === selectedMarkerId;
                  const kmPerDegree = 111.32 * Math.cos((site.lat * Math.PI) / 180);
                  const deltaLng = plottingConfig.bufferRadiusKm / Math.max(1, kmPerDegree);
                  const pOffset = mapData.projection([site.lng + deltaLng, site.lat]);
                  const rPx = pOffset ? Math.abs(pOffset[0] - pos[0]) : (plottingConfig.bufferRadiusKm * 0.4) / zoomTransform.k;

                  return (
                    <g key={`buffer-${site.id}`}>
                      <circle
                        cx={pos[0]}
                        cy={pos[1]}
                        r={rPx}
                        fill={isSelected ? "#10b981" : "#059669"}
                        fillOpacity={isSelected ? 0.08 : 0.04}
                        stroke={isSelected ? "#047857" : "#10b981"}
                        strokeWidth={1.5 / zoomTransform.k}
                        strokeDasharray={`${4 / zoomTransform.k},${3 / zoomTransform.k}`}
                      />
                      {isSelected && (
                        <text
                          x={pos[0]}
                          y={pos[1] - rPx - 4 / zoomTransform.k}
                          textAnchor="middle"
                          fontSize={8 / zoomTransform.k}
                          fill="#047857"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          Buffer: Δr {plottingConfig.bufferRadiusKm} km
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {/* Mode 2: Spatio-Temporal Migration Corridor & Vector Velocity Flow */}
            {plottingConfig.mode === 'migration' && (
              <g pointerEvents="none">
                {(() => {
                  const ptsSource = (paleoData?.migrationLapse && paleoData.migrationLapse.length >= 2)
                    ? paleoData.migrationLapse
                    : markers;
                  if (ptsSource.length < 2) return null;

                  const pts = ptsSource
                    .map(wp => mapData.projection([wp.lng, wp.lat]))
                    .filter(Boolean) as [number, number][];
                  if (pts.length < 2) return null;

                  const loopLine = d3.line<[number, number]>().curve(d3.curveCatmullRomClosed.alpha(0.5)).x(d => d[0]).y(d => d[1]);
                  const pathStr = loopLine(pts);
                  if (!pathStr) return null;

                  const swathWidthPx = Math.max(10, (plottingConfig.corridorWidthKm * 0.22) / Math.max(0.6, Math.sqrt(zoomTransform.k)));

                  return (
                    <g>
                      {/* Wide Corridor Buffer Swath with Width Interval */}
                      <path
                        d={pathStr}
                        fill="#3b82f6"
                        fillOpacity="0.09"
                        stroke="#2563eb"
                        strokeWidth={swathWidthPx}
                        strokeOpacity="0.22"
                        strokeLinecap="round"
                      />

                      {/* Dynamic Vector Flow Line */}
                      <path
                        d={pathStr}
                        fill="none"
                        stroke="#1d4ed8"
                        strokeWidth={2.5 / zoomTransform.k}
                        strokeDasharray={`${12 / zoomTransform.k},${6 / zoomTransform.k}`}
                        strokeLinecap="round"
                        className="animate-pulse"
                      />

                      {/* Milestone Temporal Waypoints */}
                      {pts.map((p, i) => (
                        <g key={`mig-wp-${i}`} transform={`translate(${p[0]}, ${p[1]})`}>
                          <circle r={7 / zoomTransform.k} fill="#ffffff" stroke="#2563eb" strokeWidth={2 / zoomTransform.k} />
                          <circle r={3 / zoomTransform.k} fill="#2563eb" />
                          <text
                            x={0}
                            y={-10 / zoomTransform.k}
                            textAnchor="middle"
                            fontSize={7.5 / zoomTransform.k}
                            fill="#1e3a8a"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            Milestone {i + 1}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Mode 3: Paleo-Elevation Hypsometric Contours with Interval Slicing */}
            {plottingConfig.mode === 'hypsometry' && (
              <g pointerEvents="none">
                {markers.map((site, siteIdx) => {
                  const pos = mapData.projection([site.lng, site.lat]);
                  if (!pos) return null;
                  const baseElevation = site.elevationM || (150 + siteIdx * 160);
                  const numRings = Math.max(2, Math.min(8, Math.floor(Math.min(baseElevation, plottingConfig.maxElevationM) / Math.max(25, plottingConfig.contourIntervalM))));
                  const contourColors = ['#10b981', '#34d399', '#84cc16', '#a3e635', '#f59e0b', '#fbbf24', '#ea580c', '#ef4444'];

                  return (
                    <g key={`hypso-${site.id}`}>
                      {Array.from({ length: numRings }).map((_, rIdx) => {
                        const altLevel = (rIdx + 1) * plottingConfig.contourIntervalM;
                        if (altLevel > plottingConfig.maxElevationM) return null;
                        const rx = ((rIdx + 1) * 16 + 26) / zoomTransform.k;
                        const ry = ((rIdx + 1) * 12 + 20) / zoomTransform.k;
                        const color = contourColors[rIdx % contourColors.length];
                        const isIndex = altLevel % (plottingConfig.contourIntervalM * 2) === 0;

                        return (
                          <g key={`contour-${site.id}-${rIdx}`}>
                            <ellipse
                              cx={pos[0]}
                              cy={pos[1]}
                              rx={rx}
                              ry={ry}
                              fill={color}
                              fillOpacity={0.04}
                              stroke={color}
                              strokeWidth={(isIndex ? 1.5 : 0.9) / zoomTransform.k}
                              strokeDasharray={isIndex ? "none" : `${4 / zoomTransform.k},${3 / zoomTransform.k}`}
                            />
                            {isIndex && (
                              <text
                                x={pos[0] + rx + 3 / zoomTransform.k}
                                y={pos[1]}
                                fontSize={6.5 / zoomTransform.k}
                                fill={color}
                                fontWeight="bold"
                                fontFamily="monospace"
                                alignmentBaseline="middle"
                              >
                                {altLevel}m
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </g>
            )}

            {/* Mode 4: Biomechanical Gait Trackways & Stride Length Kinematics */}
            {plottingConfig.mode === 'locomotion' && (
              <g pointerEvents="none">
                {(() => {
                  if (markers.length < 2) return null;

                  return markers.map((site, sIdx) => {
                    const nextSite = markers[(sIdx + 1) % markers.length];
                    if (!nextSite) return null;

                    const p0 = mapData.projection([site.lng, site.lat]);
                    const p1 = mapData.projection([nextSite.lng, nextSite.lat]);
                    if (!p0 || !p1) return null;

                    const dx = p1[0] - p0[0];
                    const dy = p1[1] - p0[1];
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 10) return null;

                    const angleRad = Math.atan2(dy, dx);
                    const angleDeg = (angleRad * 180) / Math.PI;

                    // Continuous mathematical stride spacing anchored to path vector (eliminates jitter)
                    const stepPx = Math.max(8 / zoomTransform.k, (plottingConfig.strideLengthM * 9) / zoomTransform.k);
                    const gaugePx = 3.5 / zoomTransform.k;

                    const steps = [];
                    let s = 1;
                    while (s * stepPx < dist && steps.length < 35) {
                      const curDist = s * stepPx;
                      const t = curDist / dist;
                      const sideOffset = (s % 2 === 0 ? 1 : -1) * gaugePx;
                      const normalAngle = angleRad + Math.PI / 2;

                      const sx = p0[0] + dx * t + Math.cos(normalAngle) * sideOffset;
                      const sy = p0[1] + dy * t + Math.sin(normalAngle) * sideOffset;
                      const fade = Math.min(1, Math.max(0.2, (dist - curDist) / (stepPx * 0.5)));

                      steps.push({ x: sx, y: sy, isRight: s % 2 === 0, index: s, opacity: fade });
                      s++;
                    }

                    return (
                      <g key={`trackway-${sIdx}`}>
                        {/* Guideline */}
                        <line
                          x1={p0[0]}
                          y1={p0[1]}
                          x2={p1[0]}
                          y2={p1[1]}
                          stroke="#d97706"
                          strokeWidth={1 / zoomTransform.k}
                          strokeDasharray={`${4 / zoomTransform.k},${4 / zoomTransform.k}`}
                          opacity="0.65"
                        />

                        {/* Stride Footprints */}
                        {steps.map((st) => (
                          <g
                            key={`step-${st.index}`}
                            transform={`translate(${st.x}, ${st.y}) rotate(${angleDeg - 90}) scale(${0.02 / zoomTransform.k})`}
                            opacity={st.opacity ?? 0.85}
                          >
                            <path
                              d={DINO_FOOTPRINT_PATH}
                              fill={st.isRight ? "#d97706" : "#b45309"}
                            />
                          </g>
                        ))}
                      </g>
                    );
                  });
                })()}
              </g>
            )}

            {/* Mode 5: Kernel Density Isopleths & Biodiversity Heat Surface */}
            {plottingConfig.mode === 'density' && (
              <g pointerEvents="none">
                {markers.map((site) => {
                  const pos = mapData.projection([site.lng, site.lat]);
                  if (!pos) return null;

                  const kmPerDegree = 111.32 * Math.cos((site.lat * Math.PI) / 180);
                  const deltaLng = plottingConfig.kernelBandwidthKm / Math.max(1, kmPerDegree);
                  const pOffset = mapData.projection([site.lng + deltaLng, site.lat]);
                  const maxR = pOffset ? Math.abs(pOffset[0] - pos[0]) : (plottingConfig.kernelBandwidthKm * 0.3) / zoomTransform.k;

                  const bands = plottingConfig.densityQuantileBands;
                  const densityGradients = ['#ec4899', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3'];

                  return (
                    <g key={`density-${site.id}`}>
                      {Array.from({ length: bands }).map((_, bIdx) => {
                        const ringR = (maxR * (bands - bIdx)) / bands;
                        const opacity = 0.04 + bIdx * 0.04;
                        const strokeColor = densityGradients[bIdx % densityGradients.length];

                        return (
                          <circle
                            key={`density-ring-${site.id}-${bIdx}`}
                            cx={pos[0]}
                            cy={pos[1]}
                            r={ringR}
                            fill={strokeColor}
                            fillOpacity={opacity}
                            stroke={strokeColor}
                            strokeWidth={1 / zoomTransform.k}
                            strokeDasharray={bIdx === 0 ? `${5 / zoomTransform.k},${3 / zoomTransform.k}` : 'none'}
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </g>
            )}

            {/* Mode 6: Cardinal Directionality & Relative Locality Vectors to Neighbouring Excavation Sites */}
            {plottingConfig.mode === 'cardinal' && currentActiveMarker && (
              <g>
                {(() => {
                  const activePos = mapData.projection([currentActiveMarker.lng, currentActiveMarker.lat]);
                  if (!activePos) return null;

                  return (
                    <g key="cardinal-vector-layer">
                      {/* Active Origin Radial Compass Rings & Crosshairs */}
                      <g pointerEvents="none">
                        <circle
                          cx={activePos[0]}
                          cy={activePos[1]}
                          r={28 / zoomTransform.k}
                          fill="none"
                          stroke="#0d9488"
                          strokeWidth={1.2 / zoomTransform.k}
                          strokeDasharray={`${3 / zoomTransform.k},${3 / zoomTransform.k}`}
                          className="animate-spin-slow"
                        />
                        <circle
                          cx={activePos[0]}
                          cy={activePos[1]}
                          r={14 / zoomTransform.k}
                          fill="#0d9488"
                          fillOpacity={0.15}
                          stroke="#0f766e"
                          strokeWidth={1.5 / zoomTransform.k}
                        />
                        {/* 4 Cardinal Crosshair lines radiating from origin */}
                        <line
                          x1={activePos[0]}
                          y1={activePos[1] - 38 / zoomTransform.k}
                          x2={activePos[0]}
                          y2={activePos[1] + 38 / zoomTransform.k}
                          stroke="#0d9488"
                          strokeWidth={0.8 / zoomTransform.k}
                          strokeDasharray={`${2 / zoomTransform.k},${3 / zoomTransform.k}`}
                        />
                        <line
                          x1={activePos[0] - 38 / zoomTransform.k}
                          y1={activePos[1]}
                          x2={activePos[0] + 38 / zoomTransform.k}
                          y2={activePos[1]}
                          stroke="#0d9488"
                          strokeWidth={0.8 / zoomTransform.k}
                          strokeDasharray={`${2 / zoomTransform.k},${3 / zoomTransform.k}`}
                        />
                        <text
                          x={activePos[0]}
                          y={activePos[1] - 42 / zoomTransform.k}
                          textAnchor="middle"
                          fontSize={7 / zoomTransform.k}
                          fontWeight="bold"
                          fill="#0f766e"
                          fontFamily="monospace"
                        >
                          N 000°
                        </text>
                      </g>

                      {/* Directional Vectors to Neighbouring Excavation Sites */}
                      {markers
                        .filter(m => m.id !== currentActiveMarker.id)
                        .map(neighbour => {
                          const nPos = mapData.projection([neighbour.lng, neighbour.lat]);
                          if (!nPos) return null;

                          const rel = computeRelativeLocation(currentActiveMarker, neighbour);
                          // Filter by max distance if set
                          if (plottingConfig.maxNeighbourRadiusKm > 0 && rel.distanceKm > plottingConfig.maxNeighbourRadiusKm) {
                            return null;
                          }

                          const isHovered = hoveredSiteId === neighbour.id;
                          const strokeW = (isHovered ? plottingConfig.vectorLineWidthPx + 1.2 : plottingConfig.vectorLineWidthPx) / zoomTransform.k;

                          // Vector midpoint for the cardinal badge
                          const midX = (activePos[0] + nPos[0]) / 2;
                          const midY = (activePos[1] + nPos[1]) / 2;

                          const bearingText = formatBearingDisplay(rel.azimuthDeg, rel.cardinal, plottingConfig.cardinalBearingMode);
                          const distText = `${Math.round(rel.distanceKm)} km`;

                          return (
                            <g key={`vector-${neighbour.id}`}>
                              {/* Vector Arrow Line */}
                              <line
                                x1={activePos[0]}
                                y1={activePos[1]}
                                x2={nPos[0]}
                                y2={nPos[1]}
                                stroke={isHovered ? "#0284c7" : "#0d9488"}
                                strokeWidth={strokeW}
                                strokeDasharray={isHovered ? "none" : `${6 / zoomTransform.k},${4 / zoomTransform.k}`}
                                strokeOpacity={isHovered ? 1 : 0.75}
                                markerEnd={isHovered ? "url(#cardinal-arrow-hover)" : "url(#cardinal-arrow)"}
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkerClick(neighbour);
                                }}
                                onMouseEnter={() => setHoveredSiteId(neighbour.id)}
                                onMouseLeave={() => setHoveredSiteId(null)}
                              />

                              {/* Interactive Midpoint Cardinal Pill Badge */}
                              <g 
                                transform={`translate(${midX}, ${midY})`}
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkerClick(neighbour);
                                }}
                                onMouseEnter={() => setHoveredSiteId(neighbour.id)}
                                onMouseLeave={() => setHoveredSiteId(null)}
                              >
                                <rect
                                  x={-45 / zoomTransform.k}
                                  y={-10 / zoomTransform.k}
                                  width={90 / zoomTransform.k}
                                  height={20 / zoomTransform.k}
                                  rx={10 / zoomTransform.k}
                                  fill={isHovered ? "#0284c7" : "#042f2e"}
                                  fillOpacity={0.92}
                                  stroke={isHovered ? "#38bdf8" : "#14b8a6"}
                                  strokeWidth={1.2 / zoomTransform.k}
                                  filter="url(#soft-shadow)"
                                />
                                <text
                                  textAnchor="middle"
                                  y={3.5 / zoomTransform.k}
                                  fontSize={7.5 / zoomTransform.k}
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                  fill="#ffffff"
                                >
                                  {bearingText} • {distText}
                                </text>
                              </g>
                            </g>
                          );
                        })}
                    </g>
                  );
                })()}
              </g>
            )}

            {/* HISTORICAL SPECIES MIGRATORY FOOTPRINT TRACKWAY OVERLAY */}
            {showFootprintTrails && historicalFootprintTrackway && (
              <g id="historical-migratory-footprint-layer">
                {/* 1. Base Glowing Trail Polyline */}
                {historicalFootprintTrackway.polylineD && (
                  <g pointerEvents="none">
                    <path
                      d={historicalFootprintTrackway.polylineD}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={4.5 / zoomTransform.k}
                      strokeOpacity="0.35"
                      strokeLinecap="round"
                    />
                    <path
                      d={historicalFootprintTrackway.polylineD}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth={2.2 / zoomTransform.k}
                      strokeDasharray={`${8 / zoomTransform.k},${5 / zoomTransform.k}`}
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                  </g>
                )}

                {/* 2. Alternating Left/Right Trackway Footprints along trajectory */}
                <g pointerEvents="none">
                  {historicalFootprintTrackway.trackwaySteps.map((step, sIdx) => {
                    const isStepActive = sIdx === trackwayAnimIdx;
                    const scale = (isStepActive ? 1.4 : 0.85) / Math.max(0.6, Math.sqrt(zoomTransform.k));

                    return (
                      <g 
                        key={`footprint-step-${sIdx}`} 
                        transform={`translate(${step.footX}, ${step.footY}) rotate(${step.angleDeg + 90}) scale(${scale})`}
                        opacity={isStepActive ? 1.0 : 0.85}
                      >
                        {/* Tridactyl Dinosaur Footprint Silhouette */}
                        <path
                          d="M 0,-7 C -2,-13 -5,-15 -6,-9 C -7,-3 -3,0 0,2 C 3,0 7,-3 6,-9 C 5,-15 2,-13 0,-7 Z M -4,-2 C -8,-6 -12,-6 -11,-1 C -10,3 -5,3 -2,2 Z M 4,-2 C 8,-6 12,-6 11,-1 C 10,3 5,3 2,2 Z M -1,2 C -3,6 -2,10 0,11 C 2,10 3,6 1,2 Z"
                          fill={isStepActive ? '#f59e0b' : step.seasonColor}
                          stroke="#0f172a"
                          strokeWidth="0.8"
                        />
                        {isStepActive && (
                          <circle r="12" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="animate-ping" />
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* 3. Milestone Seasonal Waypoint Badges on Map */}
                <g pointerEvents="none">
                  {historicalFootprintTrackway.mappedWaypoints.map((wp, wpIdx) => {
                    const badgeColors = ['#f59e0b', '#10b981', '#06b6d4', '#38bdf8'];
                    const color = badgeColors[wpIdx % badgeColors.length];

                    return (
                      <g key={`trackway-wp-${wp.idx}-${wpIdx}`} transform={`translate(${wp.x}, ${wp.y})`}>
                        <circle
                          r={10 / zoomTransform.k}
                          fill="#0f172a"
                          stroke={color}
                          strokeWidth={2 / zoomTransform.k}
                          filter="url(#soft-shadow)"
                        />
                        <circle
                          r={4 / zoomTransform.k}
                          fill={color}
                          className="animate-pulse"
                        />
                        <g transform={`translate(0, ${-16 / zoomTransform.k}) scale(${1 / Math.max(0.6, Math.sqrt(zoomTransform.k))})`}>
                          <rect
                            x="-45"
                            y="-11"
                            width="90"
                            height="15"
                            rx="5"
                            fill="#0f172a"
                            fillOpacity="0.9"
                            stroke={color}
                            strokeWidth="1"
                          />
                          <text
                            x="0"
                            y="0"
                            textAnchor="middle"
                            fontSize="8"
                            fill="#ffffff"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                          >
                            🐾 {wp.seasonMonth ? wp.seasonMonth.split(' ')[0] : `Waystation #${wpIdx + 1}`}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>
              </g>
            )}

            {/* 10. Excavation Localities: Active Site has the Full Pin, other sites have Sleek Clickable Discovery Nodes */}
            {[...markers].map((site) => {
              const index = markers.findIndex(m => m.id === site.id);
              const pos = mapData.projection([site.lng, site.lat]);
              if (!pos) return null;
              
              const aCur = typeof currentIndex === 'number' && markers[currentIndex]?.id === site.id;
              const isSelected = Boolean(
                (activeExcavationSite && (
                  site.id === activeExcavationSite.id || 
                  site.name === activeExcavationSite.name || 
                  (Math.abs(site.lat - activeExcavationSite.lat) < 0.001 && Math.abs(site.lng - activeExcavationSite.lng) < 0.001)
                )) ||
                (typeof currentIndex === 'number' && currentIndex >= 0 && markers[currentIndex]?.id === site.id) ||
                (typeof currentIndex === 'number' && currentIndex >= 0 && markers[currentIndex]?.name === site.name) ||
                site.name === selectedMarkerId ||
                (site.id && selectedMarkerId && site.id === selectedMarkerId) ||
                (selectedMarkerId && site.name.split(/[,(]/)[0].toLowerCase().trim() === selectedMarkerId.split(/[,(]/)[0].toLowerCase().trim()) ||
                aCur
              );
              
              const activeScale = 1 / zoomTransform.k;
              const courseColors = ['#10b981', '#f59e0b', '#0284c7', '#f43f5e', '#8b5cf6', '#06b6d4'];
              const pinColor = courseColors[(index >= 0 ? index : 0) % courseColors.length];

              if (isSelected) {
                // Active Site: Prominent Excavation Pin
                const pinScale = 1.25 * activeScale;
                return (
                  <g 
                    key={site.id} 
                    transform={`translate(${pos[0]}, ${pos[1]})`} 
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerClick(site);
                    }}
                    onMouseEnter={() => handlePinMouseEnter(site.id)}
                    onMouseLeave={handlePinMouseLeave}
                  >
                    {/* Selected Site Animated Radar Rings */}
                    <circle 
                      r={32 * activeScale} 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth={2 * activeScale} 
                      className="animate-ping" 
                      opacity="0.5" 
                    />
                    <circle 
                      r={20 * activeScale} 
                      fill="#d1fae5" 
                      fillOpacity="0.3"
                      stroke="#059669" 
                      strokeWidth={1.5 * activeScale} 
                      strokeDasharray={`${3 * activeScale},${3 * activeScale}`}
                    />

                    {/* Square Pin Frame with Dinosaur Silhouette & Number Badge */}
                    <g transform={`scale(${pinScale})`} filter="url(#bubble-shadow)">
                      <rect 
                        x="-18" 
                        y="-18" 
                        width="36" 
                        height="36" 
                        rx="8" 
                        fill="#064e3b" 
                        stroke="#10b981" 
                        strokeWidth={3.5} 
                      />

                      {/* Sequence Number in Corner */}
                      <rect x="-16" y="-16" width="12" height="10" rx="3" fill={pinColor} />
                      <text x="-10" y="-8.5" textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold" fontFamily="monospace">
                        {index >= 0 ? index + 1 : 1}
                      </text>

                      {/* Dinosaur Silhouette Icon */}
                      <g transform="scale(0.045) translate(-140, -140)">
                        <path d={DINO_FOOTPRINT_PATH} fill="#ffffff" />
                      </g>
                    </g>
                  </g>
                );
              }

              // Non-Active Excavation Localities: Clean, minimal clickable discovery node
              return (
                <g 
                  key={site.id} 
                  transform={`translate(${pos[0]}, ${pos[1]})`} 
                  className="cursor-pointer group opacity-85 hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkerClick(site);
                  }}
                  onMouseEnter={() => handlePinMouseEnter(site.id)}
                  onMouseLeave={handlePinMouseLeave}
                >
                  {/* Subtle target ring */}
                  <circle 
                    r={9 * activeScale} 
                    fill="#0f172a" 
                    fillOpacity="0.85"
                    stroke={pinColor} 
                    strokeWidth={1.5 * activeScale} 
                  />
                  {/* Small sequence number */}
                  <text 
                    x="0" 
                    y={3 * activeScale} 
                    textAnchor="middle" 
                    fontSize={7.5 * activeScale} 
                    fill="#ffffff" 
                    fontWeight="bold" 
                    fontFamily="monospace"
                  >
                    {index >= 0 ? index + 1 : ''}
                  </text>
                </g>
              );
            })}

            {/* 11. Interactive Smoothly Gliding Excavation Focal Pin & Navigator Beacon */}
            {activeExcavationSite && (() => {
              const activeScale = 1 / zoomTransform.k;
              const directCoords = mapData?.projection ? mapData.projection([Number(activeExcavationSite.lng), Number(activeExcavationSite.lat)]) : null;
              const coords = animatedPinCoords || (directCoords ? { x: directCoords[0], y: directCoords[1] } : null);
              if (!coords) return null;
              const activeIdx = markers.findIndex(m => m.id === activeExcavationSite.id || m.name === activeExcavationSite.name);

              return (
                <g id="active-excavation-gliding-pin-group">
                  {/* Animated Flight Path / Trail when gliding between excavation localities */}
                  {flightTrail && isPinGliding && (
                    <line
                      x1={flightTrail.x1}
                      y1={flightTrail.y1}
                      x2={coords.x}
                      y2={coords.y}
                      stroke="#f59e0b"
                      strokeWidth={3 * activeScale}
                      strokeDasharray={`${6 * activeScale},${4 * activeScale}`}
                      strokeLinecap="round"
                      className="animate-pulse"
                      opacity="0.85"
                    />
                  )}

                  <g
                    id="active-excavation-focal-pin"
                    transform={`translate(${coords.x}, ${coords.y})`}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerClick(activeExcavationSite);
                    }}
                  >
                    {/* Outer Pulsing Sonar Waves */}
                    <circle
                      r={(isPinGliding ? 42 : 36) * activeScale}
                      fill="none"
                      stroke={isPinGliding ? "#f59e0b" : "#10b981"}
                      strokeWidth={2.5 * activeScale}
                      className="animate-ping"
                      opacity="0.75"
                    />
                    <circle
                      r={24 * activeScale}
                      fill={isPinGliding ? "#fef3c7" : "#d1fae5"}
                      fillOpacity="0.25"
                      stroke={isPinGliding ? "#d97706" : "#059669"}
                      strokeWidth={2 * activeScale}
                      strokeDasharray={`${4 * activeScale},${3 * activeScale}`}
                    />
                    
                    {/* Compass Rose Ring */}
                    <circle
                      r={16 * activeScale}
                      fill={isPinGliding ? "#d97706" : "#047857"}
                      stroke="#ffffff"
                      strokeWidth={2.2 * activeScale}
                      filter="url(#bubble-shadow)"
                    />

                    {/* Center Bone / Specimen Icon */}
                    <text
                      x="0"
                      y={4.5 * activeScale}
                      textAnchor="middle"
                      fontSize={12 * activeScale}
                      fill="#ffffff"
                      fontWeight="bold"
                    >
                      🦴
                    </text>

                    {/* Pointer Triangle Arrow pointing down to exact coordinate */}
                    <polygon
                      points={`0,0 ${-5 * activeScale},${-12 * activeScale} ${5 * activeScale},${-12 * activeScale}`}
                      fill={isPinGliding ? "#d97706" : "#047857"}
                    />

                    {/* Active Site Floating Marker Badge */}
                    <g transform={`translate(0, ${-25 * activeScale})`}>
                      <rect
                        x={-58 * activeScale}
                        y={-14 * activeScale}
                        width={116 * activeScale}
                        height={18 * activeScale}
                        rx={6 * activeScale}
                        fill="#0f172a"
                        fillOpacity="0.95"
                        stroke={isPinGliding ? "#f59e0b" : "#10b981"}
                        strokeWidth={2 * activeScale}
                        filter="url(#bubble-shadow)"
                      />
                      <text
                        x="0"
                        y={-2 * activeScale}
                        textAnchor="middle"
                        fontSize={8 * activeScale}
                        fill={isPinGliding ? "#fbbf24" : "#6ee7b7"}
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {isPinGliding 
                          ? `✈ PIN FLYING → #${activeIdx >= 0 ? activeIdx + 1 : 1}` 
                          : `📍 PIN ${activeIdx >= 0 ? activeIdx + 1 : 1}: ${activeExcavationSite.name.split(/[,(]/)[0].substring(0, 14)}`
                        }
                      </text>
                    </g>
                  </g>
                </g>
              );
            })()}
          </g>
        </svg>
      )}

      {/* 1. FLOATING TOOLTIP ON MAP PIN HOVER WITH OPTION TO SHOW INFO ON HOVER */}
      {hoveredSiteDetails && showInfoOnHover && (
        <div 
          className="absolute z-50 pointer-events-auto transition-all duration-150 transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ 
            left: `${hoveredSiteDetails.screenX}px`, 
            top: `${hoveredSiteDetails.screenY - 14}px` 
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="bg-slate-950/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 max-w-[320px] w-[320px] space-y-2.5 animate-in fade-in zoom-in-95">
            
            {/* Header: Number Badge, Location Title, Country & Interactive Tooltip Controls */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono text-[9px] font-bold">
                    Stop #{hoveredSiteDetails.index + 1}
                  </span>
                  <span className="text-[10px] font-rounded font-extrabold text-slate-300 uppercase tracking-wider truncate">
                    {hoveredSiteDetails.details.regionCountry}
                  </span>
                </div>
                <h4 className="text-sm font-rounded font-extrabold text-white mt-0.5 truncate leading-tight">
                  {hoveredSiteDetails.details.locationTitle}
                </h4>
              </div>

              {/* Action Buttons: Mode Toggle, MapPin, and Dismiss */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHoverDetailMode();
                  }}
                  className="px-1.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[8.5px] font-rounded font-bold transition-all cursor-pointer"
                  title={`Switch to ${hoverDetailMode === 'full' ? 'Compact' : 'Full'} spec view`}
                  aria-label="Toggle hover detail mode"
                >
                  {hoverDetailMode === 'full' ? 'Compact' : 'Full'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHoveredSiteId(null);
                  }}
                  className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Dismiss hover tooltip"
                  aria-label="Close tooltip"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* BODY CONTENT: COMPACT VS FULL SPECS */}
            {hoverDetailMode === 'compact' ? (
              /* Compact Mode View */
              <div className="space-y-1.5 text-[9.5px]">
                <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-rounded font-bold">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      {renderWeatherIcon(hoveredSiteDetails.details.iconType, "w-3.5 h-3.5 text-amber-400")}
                      <span className="text-white font-extrabold">{hoveredSiteDetails.details.weatherType}</span>
                    </div>
                    <span className="font-mono text-amber-300 font-bold bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800/60">
                      {hoveredSiteDetails.details.stratigraphicAge}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[8.5px] text-slate-400 pt-0.5">
                    <span className="truncate">{hoveredSiteDetails.details.formationName}</span>
                    <span className="text-slate-300 font-mono">{hoveredSiteDetails.details.stratigraphicPeriod}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[8.5px] font-mono text-slate-300">
                  <div className="bg-slate-950/70 px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                    <CompassIcon size={10} className="text-sky-400 shrink-0" />
                    <span className="truncate">{hoveredSiteDetails.details.coordinatesFormatted}</span>
                  </div>
                  <div className="bg-slate-950/70 px-2 py-1 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5 font-sans">
                      <CheckCircle2 size={10} />
                      {hoveredSiteDetails.details.osteologyRecoveryPct}%
                    </span>
                    <span className="text-amber-400 font-bold">
                      {hoveredSiteDetails.details.elevationFormatted}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Full Specs Mode View */
              <div className="space-y-2.5">
                {/* Spec Section 1: Stratigraphy Context */}
                <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800 space-y-1.5 text-[9.5px]">
                  <div className="flex items-center justify-between text-[9.5px] font-rounded font-bold text-slate-300">
                    <span className="text-emerald-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                      <Mountain size={11} />
                      <span>Stratigraphic Context</span>
                    </span>
                    <span className="font-mono text-amber-300 font-bold bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800/60">
                      {hoveredSiteDetails.details.stratigraphicAge}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-850">
                      <span className="text-slate-500 block text-[7.5px] uppercase font-bold">Period</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {hoveredSiteDetails.details.stratigraphicPeriod}
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-850">
                      <span className="text-slate-500 block text-[7.5px] uppercase font-bold">Formation / Horizon</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {hoveredSiteDetails.details.formationName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[8.5px] text-slate-300 pt-0.5 px-0.5">
                    <span className="text-slate-400 font-medium">Sediment Matrix:</span>
                    <span className="font-mono text-slate-200 font-semibold truncate max-w-[180px]">
                      {hoveredSiteDetails.details.sedimentMatrix}
                    </span>
                  </div>
                </div>

                {/* Spec Section 2: Climate & Paleo-Weather */}
                <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800 space-y-1 text-[9px]">
                  <div className="flex items-center justify-between font-rounded font-bold">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      {renderWeatherIcon(hoveredSiteDetails.details.iconType, "w-3.5 h-3.5 text-amber-400")}
                      <span className="text-white font-extrabold">{hoveredSiteDetails.details.weatherType}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[8px]">
                      {hoveredSiteDetails.details.climateBiome}
                    </span>
                  </div>
                  <p className="text-[8px] font-rounded text-slate-400 leading-tight">
                    {hoveredSiteDetails.details.phenomenaLabel}
                  </p>
                </div>

                {/* Spec Section 3: Geography & Taphonomy Metrics */}
                <div className="grid grid-cols-2 gap-1 text-[8.5px] font-mono text-slate-300">
                  <div className="bg-slate-950/70 px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                    <CompassIcon size={10} className="text-sky-400 shrink-0" />
                    <span className="truncate">{hoveredSiteDetails.details.coordinatesFormatted}</span>
                  </div>
                  <div className="bg-slate-950/70 px-2 py-1 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5 font-sans">
                      <CheckCircle2 size={10} />
                      {hoveredSiteDetails.details.osteologyRecoveryPct}%
                    </span>
                    <span className="text-amber-400 font-bold">
                      {hoveredSiteDetails.details.elevationFormatted}
                    </span>
                  </div>
                </div>

                {/* Spec Section 4: Cardinal Directionality & Relative Locality to Active Site */}
                {currentActiveMarker && hoveredSiteDetails.site.id !== currentActiveMarker.id && (() => {
                  const rel = computeRelativeLocation(currentActiveMarker, hoveredSiteDetails.site);
                  return (
                    <div className="bg-teal-950/70 rounded-xl p-2 border border-teal-800/80 space-y-1 text-[8.5px]">
                      <div className="flex items-center justify-between font-rounded font-bold">
                        <span className="flex items-center gap-1.5 text-teal-300">
                          <CompassIcon size={11} className="text-teal-400" />
                          <span>Bearing from {currentActiveMarker.name.split(',')[0]}:</span>
                        </span>
                        <span className="bg-teal-900/90 text-teal-200 px-1.5 py-0.5 rounded-md border border-teal-700 font-mono font-extrabold flex items-center gap-1">
                          <Navigation size={8} style={{ transform: `rotate(${rel.azimuthDeg}deg)` }} className="text-teal-300" />
                          {rel.cardinal} ({Math.round(rel.azimuthDeg)}°)
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-slate-300 text-[8px]">
                        <span className="text-slate-400">Geodesic Distance:</span>
                        <span className="text-white font-bold">{rel.distanceKm} km ({rel.distanceMiles} mi)</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[7.5px] text-slate-400 pt-0.5 border-t border-teal-900/60">
                        <span>ΔLat: {rel.deltaLatDeg > 0 ? `+${rel.deltaLatDeg}°` : `${rel.deltaLatDeg}°`} • ΔLng: {rel.deltaLngDeg > 0 ? `+${rel.deltaLngDeg}°` : `${rel.deltaLngDeg}°`}</span>
                        <span className="text-teal-400 font-semibold">Return: {rel.reciprocalCardinal} ({Math.round(rel.reciprocalAzimuthDeg)}°)</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Option to show info on hover footer bar */}
            <div className="pt-2 border-t border-slate-800/90 flex items-center justify-between text-[8.5px] select-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleShowInfoOnHover();
                }}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer group"
                title="Option to toggle showing tooltip info on hover"
              >
                <Eye size={11} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-slate-400">Info on hover:</span>
                <span className="font-mono font-bold text-emerald-400 underline decoration-dotted">
                  ENABLED (Click to turn off)
                </span>
              </button>

              <span className="text-[8px] font-rounded text-slate-500">
                Click pin to select
              </span>
            </div>

          </div>
          
          {/* Tooltip downward pointer arrow */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-slate-950 mx-auto" />
        </div>
      )}

      {/* 1B. MINIMALIST CHIP WHEN HOVER INFO IS TURNED OFF (Keeps map uncluttered while providing option to enable) */}
      {hoveredSiteDetails && !showInfoOnHover && (
        <div 
          className="absolute z-50 pointer-events-auto transition-all duration-150 transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ 
            left: `${hoveredSiteDetails.screenX}px`, 
            top: `${hoveredSiteDetails.screenY - 14}px` 
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="bg-slate-950/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2.5 animate-in fade-in zoom-in-95 select-none">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono font-bold text-slate-400">
                  #{hoveredSiteDetails.index + 1}
                </span>
                <span className="text-[11px] font-rounded font-extrabold text-white truncate max-w-[140px]">
                  {hoveredSiteDetails.details.locationTitle}
                </span>
              </div>
              <span className="text-[8px] text-slate-400 block truncate">
                Hover info is OFF • Click pin to inspect
              </span>
            </div>

            {/* Option to re-enable hover tooltip info */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleShowInfoOnHover();
              }}
              className="px-2 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-rounded font-bold text-[9px] transition-all flex items-center gap-1 shadow-xs cursor-pointer ml-1 active:scale-95"
              title="Turn on full hover tooltip info"
            >
              <Eye size={11} />
              <span>Enable Hover Info</span>
            </button>
          </div>
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-slate-950 mx-auto" />
        </div>
      )}

      {/* 2. MINIMALIST EXPEDITION TRAIL LEGEND (DRAGGABLE & RESIZABLE)
          Relying heavily on visual cues (square pins, color badges, weather icons) & concise keyword tags
      */}
      {!dockedState.layer_toggles && markers.length > 0 && (
        <div 
          ref={legendRef}
          id="expedition-trail-legend"
          style={{
            ...(legendPos ? {
              left: `${legendPos.x}px`,
              top: `${legendPos.y}px`,
              right: 'auto',
              bottom: 'auto'
            } : {}),
            ...(legendSize ? {
              width: `${legendSize.width}px`,
              maxWidth: `${legendSize.width}px`,
            } : {})
          }}
          className={`absolute z-30 pointer-events-auto bg-white/95 backdrop-blur-md border-2 rounded-2xl max-w-[325px] w-full hidden md:block overflow-hidden select-none transition-shadow ${
            legendPos ? '' : 'bottom-5 right-5'
          } ${
            isDraggingLegend 
              ? 'cursor-grabbing shadow-2xl ring-2 ring-emerald-500/40 scale-[1.01] border-emerald-400/80 transition-none' 
              : isResizingLegend
              ? 'cursor-nwse-resize shadow-2xl ring-2 ring-emerald-500/40 border-emerald-400/80 transition-none'
              : 'shadow-xl border-white/90 transition-all duration-300'
          }`}
        >
          {/* Minimalist Legend Header with Drag Handle & Layer Toggle Chips */}
          <div 
            onPointerDown={handleLegendPointerDown}
            onDoubleClick={handleResetLegend}
            className={`p-2.5 bg-gradient-to-r from-park-tree/10 via-white to-park-sand/30 border-b border-park-card-border space-y-2 touch-none select-none transition-colors ${
              isDraggingLegend ? 'cursor-grabbing bg-emerald-50/60' : 'cursor-grab hover:bg-slate-50/80'
            }`}
            title="Click and drag anywhere on the header to move the Trail Legend anywhere on screen • Double-click to reset"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {/* Visual Drag Handle Grip Icon */}
                <div 
                  className="text-slate-400 hover:text-slate-700 flex items-center justify-center -ml-0.5 cursor-grab active:cursor-grabbing transition-colors"
                  title="Drag to move Trail Legend anywhere on screen"
                >
                  <GripVertical size={13} />
                </div>
                <div className="w-5 h-5 rounded-md bg-park-tree text-white flex items-center justify-center shadow-2xs">
                  <Navigation size={11} />
                </div>
                <span className="text-[11px] font-rounded font-extrabold text-park-tree tracking-wide">
                  Trail Legend
                </span>
                <span className="text-[8.5px] font-mono px-1 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                  {markers.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Dock into container */}
                <button
                  onClick={() => handleDockIn('layer_toggles')}
                  className="px-1.5 py-0.5 rounded-md text-[8px] font-rounded font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all flex items-center gap-0.5 cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
                  title="Dock Trail Legend into Elements Deck"
                  aria-label="Dock Trail Legend"
                >
                  <ArrowDownToLine size={8} className="text-emerald-700" />
                  <span>Dock</span>
                </button>

                {/* Reset Position / Size Button if moved or resized */}
                {(legendPos || legendSize) && (
                  <button
                    onClick={handleResetLegend}
                    className="px-1.5 py-0.5 rounded-md text-[8px] font-rounded font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all flex items-center gap-0.5 cursor-pointer shadow-2xs"
                    title="Reset Trail Legend position & size to default"
                    aria-label="Reset legend position and size"
                  >
                    <RotateCcw size={8} className="text-slate-500" />
                    <span>Reset</span>
                  </button>
                )}

                {/* Quick Toggle Hover Info Option */}
                <button
                  onClick={toggleShowInfoOnHover}
                  className={`px-1.5 py-0.5 rounded-md text-[8px] font-rounded font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    showInfoOnHover
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                  title={showInfoOnHover ? "Tooltip hover info is ON (Click to turn off)" : "Tooltip hover info is OFF (Click to turn on)"}
                  aria-label="Toggle hover tooltip info"
                >
                  {showInfoOnHover ? <Eye size={9} className="text-emerald-600" /> : <EyeOff size={9} className="text-slate-400" />}
                  <span>Hover Info</span>
                </button>

                {/* Expand / Collapse Button */}
                <button 
                  onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                  className="w-5 h-5 rounded-md bg-park-sand/80 hover:bg-park-sand border border-park-card-border flex items-center justify-center text-park-tree transition-all cursor-pointer"
                  title={isLegendExpanded ? "Collapse Legend" : "Expand Legend"}
                >
                  {isLegendExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>
              </div>
            </div>

            {/* VISUAL LAYER TOGGLE (Keyword & Visual Icon Filters) */}
            {isLegendExpanded && (
              <div className="grid grid-cols-4 gap-1 bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80">
                <button
                  onClick={() => setLegendFilter('climate')}
                  className={`py-1 px-0.5 rounded-lg text-[8.5px] font-rounded font-bold transition-all flex items-center justify-center gap-0.5 ${
                    legendFilter === 'climate'
                      ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Paleo-Climate & Weather Types"
                >
                  <Sun size={10} className="text-amber-500 shrink-0" />
                  <span>Climate</span>
                </button>

                <button
                  onClick={() => setLegendFilter('stratigraphy')}
                  className={`py-1 px-0.5 rounded-lg text-[8.5px] font-rounded font-bold transition-all flex items-center justify-center gap-0.5 ${
                    legendFilter === 'stratigraphy'
                      ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Formations & Chronostratigraphy"
                >
                  <Mountain size={10} className="text-emerald-600 shrink-0" />
                  <span>Strata</span>
                </button>

                <button
                  onClick={() => setLegendFilter('taphonomy')}
                  className={`py-1 px-0.5 rounded-lg text-[8.5px] font-rounded font-bold transition-all flex items-center justify-center gap-0.5 ${
                    legendFilter === 'taphonomy'
                      ? 'bg-white text-sky-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Osteological Recovery & Transit"
                >
                  <Clock size={10} className="text-sky-600 shrink-0" />
                  <span>Recovery</span>
                </button>

                <button
                  onClick={() => setLegendFilter('cardinal')}
                  className={`py-1 px-0.5 rounded-lg text-[8.5px] font-rounded font-bold transition-all flex items-center justify-center gap-0.5 ${
                    legendFilter === 'cardinal'
                      ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Cardinal Directionality & Relative Locality"
                >
                  <Compass size={10} className="text-teal-600 shrink-0" />
                  <span>Cardinal</span>
                </button>
              </div>
            )}
          </div>

          {/* Minimalist Keyword List with Square Pin Visual Cues */}
          {isLegendExpanded && (
            <div 
              className="flex flex-col gap-1 p-1.5 overflow-y-auto no-scrollbar"
              style={{
                maxHeight: legendSize ? `${Math.max(120, legendSize.height - 85)}px` : '260px'
              }}
            >
              {markers.map((marker, idx) => {
                const isCur = marker.name === selectedMarkerId || 
                  (selectedMarkerId && marker.name.split(/[,(]/)[0].toLowerCase().trim() === selectedMarkerId.split(/[,(]/)[0].toLowerCase().trim());
                const isHovered = hoveredSiteId === marker.id;
                const details = getSitePhenomenaDetails(marker, idx, activeTaxaName, paleoData);

                const courseBorderColors = ['border-emerald-500', 'border-amber-500', 'border-sky-500', 'border-rose-500', 'border-purple-500', 'border-teal-500'];
                const courseBgColors = ['bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-rose-500', 'bg-purple-500', 'bg-teal-500'];
                const pinBorder = courseBorderColors[idx % courseBorderColors.length];
                const pinBg = courseBgColors[idx % courseBgColors.length];

                return (
                  <div
                    key={marker.id}
                    onClick={() => onMarkerClick(marker)}
                    onMouseEnter={() => setHoveredSiteId(marker.id)}
                    onMouseLeave={() => setHoveredSiteId(null)}
                    className={`group flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all cursor-pointer ${
                      isCur 
                        ? 'bg-rose-50/90 border-2 border-rose-300 shadow-2xs' 
                        : isHovered 
                          ? 'bg-slate-50 border border-slate-200' 
                          : 'hover:bg-slate-50/70 border border-transparent'
                    }`}
                  >
                    {/* Visual Cue: Square Avatar Pin */}
                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 rounded-lg bg-white border p-0.5 flex items-center justify-center shadow-2xs overflow-hidden ${
                        isCur ? 'border-rose-500 ring-1 ring-rose-300' : `${pinBorder}`
                      }`}>
                        <span className={`absolute -top-1 -left-1 px-1 py-0.2 rounded-sm ${pinBg} text-white text-[7.5px] font-mono font-bold leading-none`}>
                          #{idx + 1}
                        </span>
                        <svg viewBox="0 0 600 520" className="w-full h-full object-contain">
                          <path 
                            d={dinoSilhouette.silhouettePath} 
                            fill={isCur ? dinoSilhouette.accentColor : '#64748b'} 
                            stroke="#1e293b"
                            strokeWidth="16"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Minimalist Keyword Text Cues */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[11px] font-rounded font-extrabold truncate ${isCur ? 'text-rose-950' : 'text-slate-800'}`}>
                          {details.locationTitle}
                        </span>

                        {/* Keyword Tag based on Active Layer */}
                        {legendFilter === 'climate' && (
                          <span className={`text-[8.5px] font-rounded font-bold px-1.5 py-0.2 rounded-md border flex items-center gap-0.8 shrink-0 ${details.badgeBg} ${details.badgeBorder} ${details.badgeText}`}>
                            <span className={details.iconColor}>
                              {renderWeatherIcon(details.iconType, "w-2.5 h-2.5")}
                            </span>
                            <span className="truncate max-w-[70px]">{details.climateBiome}</span>
                          </span>
                        )}

                        {legendFilter === 'stratigraphy' && (
                          <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 shrink-0">
                            {details.stratigraphicAge}
                          </span>
                        )}

                        {legendFilter === 'taphonomy' && (
                          <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-sky-50 text-sky-900 border border-sky-200 flex items-center gap-0.5 shrink-0">
                            <CheckCircle2 size={9} className="text-emerald-600" />
                            <span>{details.osteologyRecoveryPct}%</span>
                          </span>
                        )}

                        {legendFilter === 'cardinal' && (() => {
                          if (isCur) {
                            return (
                              <span className="text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-900 border border-rose-200 shrink-0">
                                📍 Baseline Origin
                              </span>
                            );
                          }
                          const rel = currentActiveMarker ? computeRelativeLocation(currentActiveMarker, marker) : null;
                          if (!rel) return null;
                          return (
                            <div className="flex items-center gap-1 shrink-0">
                              <Navigation 
                                size={9} 
                                style={{ transform: `rotate(${rel.azimuthDeg}deg)` }} 
                                className="text-teal-600 shrink-0" 
                              />
                              <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-teal-50 text-teal-900 border border-teal-200">
                                {rel.cardinal} {Math.round(rel.azimuthDeg)}° • {Math.round(rel.distanceKm)}km
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Secondary Keyword Subtitle */}
                      <div className="flex items-center justify-between text-[8px] text-slate-500 pt-0.2">
                        <span className="truncate max-w-[120px] font-medium">
                          {legendFilter === 'climate' 
                            ? details.weatherType 
                            : legendFilter === 'stratigraphy' 
                              ? details.formationName 
                              : legendFilter === 'taphonomy'
                                ? `${details.surveyTransitMins}m transit`
                                : (() => {
                                    if (isCur) return 'Reference origin site';
                                    const rel = currentActiveMarker ? computeRelativeLocation(currentActiveMarker, marker) : null;
                                    return rel ? `Return: ${rel.reciprocalCardinal} (${Math.round(rel.reciprocalAzimuthDeg)}°)` : 'Relative site';
                                  })()}
                        </span>
                        <span className="font-mono text-[7.5px] text-slate-400 shrink-0">
                          {legendFilter === 'stratigraphy' 
                            ? details.sedimentMatrix 
                            : legendFilter === 'cardinal' && !isCur && currentActiveMarker
                              ? (() => {
                                  const rel = computeRelativeLocation(currentActiveMarker, marker);
                                  return `${rel.deltaLatDeg > 0 ? '+' : ''}${rel.deltaLatDeg}° lat, ${rel.deltaLngDeg > 0 ? '+' : ''}${rel.deltaLngDeg}° lng`;
                                })()
                              : details.coordinatesFormatted}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Trail Legend Corner Resize Grip */}
          <div
            data-legend-resize
            onPointerDown={handleLegendResizePointerDown}
            className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize text-slate-400 hover:text-slate-700 flex items-center justify-center select-none touch-none z-20 group"
            title="Drag to resize Trail Legend width & height"
          >
            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-current opacity-60 group-hover:opacity-100">
              <circle cx="10" cy="10" r="1.2" />
              <circle cx="6" cy="10" r="1.2" />
              <circle cx="10" cy="6" r="1.2" />
              <circle cx="2" cy="10" r="1.2" />
              <circle cx="6" cy="6" r="1.2" />
              <circle cx="10" cy="2" r="1.2" />
            </svg>
          </div>
        </div>
      )}

      {/* Minimal Viewport Direction & Zoom Control with Directional Tooltips (MOVEABLE & RESIZABLE) */}
      {!dockedState.camera_nav && (
        <div 
          ref={zoomHudRef}
          id="viewport-direction-zoom-control"
          style={{
            ...(zoomHudPos ? {
              left: `${zoomHudPos.x}px`,
              top: `${zoomHudPos.y}px`,
              right: 'auto',
              bottom: 'auto'
            } : {}),
            transform: zoomHudScale !== 1.0 ? `scale(${zoomHudScale})` : undefined,
            transformOrigin: zoomHudPos ? 'top left' : 'bottom left'
          }}
          className={`absolute z-30 flex items-center gap-2 select-none pointer-events-auto transition-shadow ${
            zoomHudPos ? '' : 'bottom-5 left-5'
          } ${
            isDraggingZoomHud
              ? 'cursor-grabbing shadow-2xl ring-2 ring-emerald-500/40'
              : isResizingZoomHud
              ? 'cursor-nwse-resize shadow-2xl ring-2 ring-emerald-500/40'
              : ''
          }`}
        >
          {/* Sleek Minimalist Direction & Zoom HUD Capsule */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-park-card-border/90 shadow-md">
            
            {/* Drag Handle Grip for Zoom HUD */}
            <div 
              onPointerDown={handleZoomHudPointerDown}
              onDoubleClick={handleResetZoomHud}
              className={`flex items-center justify-center -ml-0.5 px-0.5 py-1 text-slate-400 hover:text-slate-700 touch-none select-none rounded transition-colors ${
                isDraggingZoomHud ? 'cursor-grabbing bg-emerald-50 text-emerald-800' : 'cursor-grab hover:bg-slate-100/70'
              }`}
              title="Drag to move Zoom & Direction controls anywhere on screen • Double-click to reset"
            >
              <GripVertical size={13} />
            </div>

            {/* Dock into container */}
            <button
              onClick={() => handleDockIn('camera_nav')}
              className="px-1.5 py-1 rounded-lg text-[8.5px] font-rounded font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5 cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
              title="Dock Navigation controls into Elements Deck"
              aria-label="Dock Navigation controls"
            >
              <ArrowDownToLine size={9} />
              <span>Dock</span>
            </button>

          {/* Switch to Google Earth 3D Button */}
          {onSwitchToGoogleEarth && (
            <>
              <button
                onClick={onSwitchToGoogleEarth}
                className="px-2 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-500/40 text-[9px] font-rounded font-extrabold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                title="Switch to Google Earth Photorealistic 3D Globe & Satellite API"
                aria-label="Switch to Google Earth 3D"
              >
                <Globe size={13} className="text-emerald-400" />
                <span className="hidden sm:inline">Google Earth 3D</span>
              </button>
              <div className="w-px h-4 bg-park-card-border/80 mx-0.5" />
            </>
          )}

          {/* North / Reset Bearing Minimal Tooltip Button */}
          <button 
            onClick={handleResetZoom}
            className="w-8 h-8 rounded-xl bg-park-sand/50 hover:bg-park-land/30 border border-park-card-border/60 flex items-center justify-center text-park-tree active:scale-95 transition-all group relative"
            title={`🧭 Viewport Orientation: North-Up (000°) • Center: ${viewportCenter.text} • Click to reset bearing & fit extents`}
            aria-label="Reset viewport orientation to North-Up"
          >
            <Compass size={16} strokeWidth={2.4} className="group-hover:rotate-45 transition-transform" />
          </button>

          <div className="w-px h-4 bg-park-card-border/80 mx-0.5" />

          {/* Minimal 4-Way Directional Viewport Pan Tooltips */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handlePanDirection('west')}
              className="w-7 h-7 rounded-lg hover:bg-park-land/30 flex items-center justify-center text-park-tree/80 hover:text-park-tree active:scale-95 transition-all"
              title={`⬅ Viewport Direction: Pan West (-Lng) • Current: ${viewportCenter.text}`}
              aria-label="Pan viewport west"
            >
              <ArrowLeft size={13} strokeWidth={2.4} />
            </button>

            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => handlePanDirection('north')}
                className="w-7 h-3.5 rounded-sm hover:bg-park-land/30 flex items-center justify-center text-park-tree/80 hover:text-park-tree active:scale-95 transition-all"
                title={`⬆ Viewport Direction: Pan North (+Lat) • Current: ${viewportCenter.text}`}
                aria-label="Pan viewport north"
              >
                <ArrowUp size={11} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => handlePanDirection('south')}
                className="w-7 h-3.5 rounded-sm hover:bg-park-land/30 flex items-center justify-center text-park-tree/80 hover:text-park-tree active:scale-95 transition-all"
                title={`⬇ Viewport Direction: Pan South (-Lat) • Current: ${viewportCenter.text}`}
                aria-label="Pan viewport south"
              >
                <ArrowDown size={11} strokeWidth={2.5} />
              </button>
            </div>

            <button
              onClick={() => handlePanDirection('east')}
              className="w-7 h-7 rounded-lg hover:bg-park-land/30 flex items-center justify-center text-park-tree/80 hover:text-park-tree active:scale-95 transition-all"
              title={`➡ Viewport Direction: Pan East (+Lng) • Current: ${viewportCenter.text}`}
              aria-label="Pan viewport east"
            >
              <ArrowRight size={13} strokeWidth={2.4} />
            </button>
          </div>

          <div className="w-px h-4 bg-park-card-border/80 mx-0.5" />

          {/* Minimal Zoom Out Tooltip Button */}
          <button 
            onClick={handleZoomOut}
            className="w-7 h-7 rounded-lg hover:bg-park-land/30 flex items-center justify-center text-park-tree active:scale-95 transition-all"
            title={`🔎 Zoom Out (${Math.round(zoomTransform.k * 100)}% → ${Math.round(zoomTransform.k * 70)}%)`}
            aria-label="Zoom out viewport"
          >
            <Minus size={14} strokeWidth={2.4} />
          </button>

          {/* Minimal Scale Badge with Viewport Tooltip */}
          <button
            onClick={() => handleZoomToPreset(zoomTransform.k > 3 ? 1 : 3.6)}
            className="px-1.5 py-0.5 rounded-md bg-park-sand/60 border border-park-card-border/70 text-[9px] font-mono font-bold text-park-tree hover:bg-park-land/30 transition-colors"
            title={`🔍 Viewport Zoom Scale: ${zoomTransform.k.toFixed(1)}x (${Math.round(zoomTransform.k * 100)}%) • Span: ~${Math.round(2000 / Math.max(1, zoomTransform.k))} km • Focus: ${viewportCenter.text}`}
          >
            {zoomTransform.k.toFixed(1)}x
          </button>

          {/* Minimal Zoom In Tooltip Button */}
          <button 
            onClick={handleZoomIn}
            className="w-7 h-7 rounded-lg hover:bg-park-land/30 flex items-center justify-center text-park-tree active:scale-95 transition-all"
            title={`🔍 Zoom In (${Math.round(zoomTransform.k * 100)}% → ${Math.round(zoomTransform.k * 140)}%) • Viewport: ${viewportCenter.text}`}
            aria-label="Zoom in viewport"
          >
            <Plus size={14} strokeWidth={2.4} />
          </button>

          {/* Minimal Extents Fit Tooltip Button */}
          <button
            onClick={() => handleZoomToPreset(1)}
            className="w-7 h-7 rounded-lg hover:bg-park-land/30 flex items-center justify-center text-park-ink-muted hover:text-park-tree active:scale-95 transition-all"
            title="🌐 Fit Full Continental Viewport Extents (1.0x Global)"
            aria-label="Fit global viewport extents"
          >
            <Maximize2 size={12} strokeWidth={2.2} />
          </button>

          {/* Reset Zoom HUD Position/Scale Button if modified */}
          {(zoomHudPos || zoomHudScale !== 1.0) && (
            <button
              onClick={handleResetZoomHud}
              className="px-1.5 py-1 rounded-lg text-[8px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center gap-0.5 cursor-pointer shadow-2xs"
              title="Reset Zoom HUD position & scale"
              aria-label="Reset Zoom HUD"
            >
              <RotateCcw size={8} />
              <span>Reset</span>
            </button>
          )}

          {/* Reset All Viewport Overlays Button (when any widget was moved or resized) */}
          {hasAnyCustomViewportLayout && (
            <button
              onClick={handleResetAllViewportOverlays}
              className="px-2 py-1 rounded-lg text-[8.5px] font-rounded font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
              title="Reset all moved or resized viewport widgets back to their default layouts"
              aria-label="Reset all viewport overlay positions and sizes"
            >
              <RotateCcw size={9} className="text-emerald-600" />
              <span>Reset Overlays</span>
            </button>
          )}

          {/* Zoom HUD Corner Scale Grip */}
          <div
            data-zoomhud-resize
            onPointerDown={handleZoomHudResizePointerDown}
            className="flex items-center justify-center cursor-nwse-resize text-slate-400 hover:text-slate-700 p-0.5 touch-none group"
            title={`Drag to scale Zoom HUD size (${Math.round(zoomHudScale * 100)}%)`}
          >
            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-current opacity-60 group-hover:opacity-100">
              <circle cx="10" cy="10" r="1.2" />
              <circle cx="6" cy="10" r="1.2" />
              <circle cx="10" cy="6" r="1.2" />
              <circle cx="2" cy="10" r="1.2" />
              <circle cx="6" cy="6" r="1.2" />
              <circle cx="10" cy="2" r="1.2" />
            </svg>
          </div>
        </div>

        {/* Dedicated Option: Show Info on Hover */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-park-card-border/90 shadow-md">
          <button
            onClick={toggleShowInfoOnHover}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-rounded font-bold transition-all cursor-pointer select-none active:scale-95 ${
              showInfoOnHover
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
            }`}
            title={
              showInfoOnHover
                ? "Map pin hover info is active. Click to disable hover tooltips."
                : "Map pin hover info is disabled. Click to enable hover tooltips."
            }
            aria-label="Toggle map tooltip info on hover"
          >
            {showInfoOnHover ? (
              <Eye size={13} className="text-emerald-600 shrink-0" />
            ) : (
              <EyeOff size={13} className="text-slate-400 shrink-0" />
            )}
            <span className="whitespace-nowrap">
              Hover Info: <span className={showInfoOnHover ? "text-emerald-700 font-extrabold" : "text-slate-500 font-semibold"}>{showInfoOnHover ? 'ON' : 'OFF'}</span>
            </span>
          </button>

          {showInfoOnHover && (
            <button
              onClick={toggleHoverDetailMode}
              className="px-2 py-1.5 rounded-xl bg-park-sand/40 hover:bg-park-land/30 border border-park-card-border/60 text-[9px] font-rounded font-bold text-park-tree transition-colors cursor-pointer select-none"
              title={`Switch hover detail mode (Current: ${hoverDetailMode === 'full' ? 'Full Multi-Spec' : 'Compact Summary'})`}
              aria-label="Toggle tooltip detail mode"
            >
              {hoverDetailMode === 'full' ? 'Full Specs' : 'Compact'}
            </button>
          )}
        </div>
      </div>
      )}

      {/* Interactive Compass Rose (MOVEABLE & RESIZABLE) */}
      <div
        ref={compassRef}
        id="interactive-compass-rose"
        style={{
          ...(compassPos ? {
            left: `${compassPos.x}px`,
            top: `${compassPos.y}px`,
            right: 'auto',
            bottom: 'auto'
          } : {}),
          transform: compassScale !== 1.0 ? `scale(${compassScale})` : undefined,
          transformOrigin: compassPos ? 'top left' : 'top right'
        }}
        className={`absolute z-25 hidden sm:flex flex-col items-center select-none ${
          compassPos ? '' : 'top-6 right-6'
        } ${
          isDraggingCompass 
            ? 'cursor-grabbing ring-2 ring-emerald-500/40 bg-black/40 rounded-2xl p-2' 
            : isResizingCompass
            ? 'cursor-nwse-resize ring-2 ring-emerald-500/40 bg-black/40 rounded-2xl p-2'
            : 'hover:bg-black/20 rounded-2xl p-2'
        } transition-all`}
      >
        {/* Drag Handle Header for Compass */}
        <div 
          onPointerDown={handleCompassPointerDown}
          onDoubleClick={handleResetCompass}
          className={`flex items-center gap-1 touch-none mb-0.5 px-1 py-0.5 rounded text-white/60 hover:text-white transition-colors ${
            isDraggingCompass ? 'cursor-grabbing bg-white/20 text-white' : 'cursor-grab'
          }`}
          title="Drag to move Compass Rose anywhere on screen • Double-click to reset"
        >
          <GripVertical size={11} />
          {(compassPos || compassScale !== 1.0) && (
            <button
              onClick={handleResetCompass}
              className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-black/60 text-white/80 hover:text-white flex items-center gap-0.5 cursor-pointer shadow-2xs"
              title="Reset Compass position & scale"
              aria-label="Reset Compass"
            >
              <RotateCcw size={7} />
            </button>
          )}
        </div>

        {/* Compass Body Button */}
        <button 
          onClick={handleResetZoom}
          className="cursor-pointer group flex flex-col items-center active:scale-95 transition-all"
          title="🧭 Interactive Paleolithic Azimuth Rose • Click to reset bearing and snap viewport to True North"
          aria-label="Interactive Compass Rose - Reset viewport to True North"
        >
          <div className="text-white font-hand text-3xl font-extrabold tracking-widest leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] group-hover:text-amber-200 transition-colors">
            N
          </div>
          <div className="w-[1.5px] h-12 bg-white drop-shadow-md relative mt-1 group-hover:bg-amber-200 transition-colors">
            <div className="absolute -top-1 -left-[3px] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-white group-hover:border-b-amber-200 transition-colors"></div>
            <div className="absolute top-4 -left-3 w-6 h-[1.5px] bg-white group-hover:bg-amber-200 transition-colors"></div>
          </div>
          <span className="text-[8px] font-mono font-bold text-white/80 bg-black/40 px-1.5 py-0.5 rounded mt-1 backdrop-blur-xs group-hover:text-white">
            000° N
          </span>
        </button>

        {/* Compass Scale Grip */}
        <div
          data-compass-resize
          onPointerDown={handleCompassResizePointerDown}
          className="cursor-nwse-resize text-white/40 hover:text-white p-1 mt-1 touch-none"
          title={`Drag to scale Compass Rose size (${Math.round(compassScale * 100)}%)`}
        >
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-current">
            <circle cx="10" cy="10" r="1.2" />
            <circle cx="6" cy="10" r="1.2" />
            <circle cx="10" cy="6" r="1.2" />
            <circle cx="2" cy="10" r="1.2" />
            <circle cx="6" cy="6" r="1.2" />
            <circle cx="10" cy="2" r="1.2" />
          </svg>
        </div>
      </div>

      {/* Master Viewport Elements Container (Elements Deck) for Paleo Atlas */}
      <ViewportElementsContainer
        storagePrefix="paleo_atlas"
        deckTitle="Paleo Atlas Elements Deck"
        deckSubtitle="Continental Geospatial Observatory"
        dockedState={dockedState}
        onSnipOut={handleSnipOut}
        onDockIn={handleDockIn}
        onSnipAllOut={handleSnipAllOut}
        onDockAllIn={handleDockAllIn}
        renderElement={renderViewportElement}
      />
    </div>
  );
};

export default MapCanvas;
