import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  Globe, 
  Layers, 
  Compass, 
  RotateCw, 
  Maximize2, 
  Minimize2,
  ZoomIn, 
  ZoomOut, 
  Navigation, 
  Eye, 
  EyeOff,
  Mountain, 
  MapPin, 
  Play, 
  Pause, 
  SkipForward,
  SkipBack,
  Square,
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  CheckCircle2, 
  Info,
  Layers2,
  X,
  RotateCcw,
  SlidersHorizontal,
  Footprints,
  Calendar,
  Activity,
  Bone,
  Flame,
  ShieldAlert,
  GripVertical,
  Sun,
  Wind,
  CloudRain,
  Waves,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Map as MapIcon,
  Keyboard,
  Volume2,
  VolumeX,
  Search,
  ArrowUpDown,
  Scissors,
  ArrowDownToLine
} from 'lucide-react';
import { ViewportElementsContainer, ViewportElementId } from './ViewportElementsContainer';
import { SiteMarker, PaleoData, SpatioTemporalWaypoint } from '../types';
import { DINOSAUR_DB } from '../data/dinosaurData';
import { GOOGLE_MAPS_ATTRIBUTION_ID, loadGoogleMapsApi, isWebGLSupported } from '../utils/googleMapsLoader';
import { GEOGRAPHIC_REGIONS } from '../utils/geoRegions';
import PlottingSpecializationLayer, { PlottingLayerConfig, DEFAULT_PLOTTING_CONFIG, PlottingSpecializationMode } from './PlottingSpecializationLayer';
import { computeAllNeighbouringRelativeLocations, computeRelativeLocation } from '../utils/cardinalDirection';
import { getSitePhenomenaDetails, SitePhenomenaInfo } from '../utils/sitePhenomena';

export type EarthViewMode = 'globe_3d' | 'satellite' | 'terrain';

/**
 * Generate geodesic circle perimeter coordinates on Earth's sphere
 */
function generateGeodesicCircleCoords(
  lat: number,
  lng: number,
  radiusMeters: number,
  numPoints: number = 28
): Array<{ lat: number; lng: number; altitude: number }> {
  const coords: Array<{ lat: number; lng: number; altitude: number }> = [];
  const earthRadius = 6378137; // meters
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const dByR = radiusMeters / earthRadius;

  for (let i = 0; i <= numPoints; i++) {
    const bearing = (i * 2 * Math.PI) / numPoints;
    const pLat = Math.asin(
      Math.sin(latRad) * Math.cos(dByR) +
      Math.cos(latRad) * Math.sin(dByR) * Math.cos(bearing)
    );
    const pLng = lngRad + Math.atan2(
      Math.sin(bearing) * Math.sin(dByR) * Math.cos(latRad),
      Math.cos(dByR) - Math.sin(latRad) * Math.sin(pLat)
    );
    coords.push({
      lat: (pLat * 180) / Math.PI,
      lng: (pLng * 180) / Math.PI,
      altitude: 0
    });
  }
  return coords;
}

interface GoogleEarthViewerProps {
  markers: SiteMarker[];
  selectedMarkerId?: string;
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
  currentIndex?: number;
  onPrevSite?: () => void;
  onNextSite?: () => void;
  onSelectTab?: (tabId: string) => void;
  onSwitchToPaleoMap?: () => void;
}

export const GoogleEarthViewer: React.FC<GoogleEarthViewerProps> = ({
  markers,
  selectedMarkerId,
  onMarkerClick,
  activeTaxaName = 'Tyrannosaurus Rex',
  paleoData,
  activeWaypoint,
  plottingConfig = DEFAULT_PLOTTING_CONFIG,
  onChangePlottingConfig,
  isPlottingPanelOpen = false,
  onTogglePlottingPanel,
  activeGeographicArea = 'all',
  areaNavSignal,
  siteNavSignal,
  currentIndex = 0,
  onPrevSite,
  onNextSite,
  onSelectTab,
  onSwitchToPaleoMap
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const map3DElementRef = useRef<any>(null);
  const map2DInstanceRef = useRef<any>(null);
  const markers3DRef = useRef<any[]>([]);
  const markers2DRef = useRef<any[]>([]);
  const trailPolylines2DRef = useRef<any[]>([]);
  const waypoint3DMarkerRef = useRef<any>(null);
  const waypoint2DMarkerRef = useRef<any>(null);
  const overlayOverlays2DRef = useRef<any[]>([]); // Circles, Polylines for plotting layers
  const plotting3DElementsRef = useRef<any[]>([]); // 3D custom elements (gmp-polyline-3d, gmp-polygon-3d)
  const trail3DPolylinesRef = useRef<any[]>([]); // 3D expedition trail polylines
  const orbitAnimIdRef = useRef<number | null>(null);

  // Overlay DOM element refs for bounds calculation
  const siteCardRef = useRef<HTMLDivElement>(null);
  const plottingPanelRef = useRef<HTMLDivElement>(null);
  const cameraHudRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);

  // Drag tracking refs
  const siteCardDragStartRef = useRef<{ pointerId: number; startX: number; startY: number; initialLeft: number; initialTop: number } | null>(null);
  const plottingDragStartRef = useRef<{ pointerId: number; startX: number; startY: number; initialLeft: number; initialTop: number } | null>(null);
  const plottingResizeStartRef = useRef<{ pointerId: number; startX: number; startY: number; initialWidth: number; initialHeight: number } | null>(null);
  const cameraHudDragStartRef = useRef<{ pointerId: number; startX: number; startY: number; initialLeft: number; initialTop: number } | null>(null);
  const legendDragStartRef = useRef<{ pointerId: number; startX: number; startY: number; initialLeft: number; initialTop: number } | null>(null);

  // Screen and Viewport dimensions
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Mode and API states
  const [viewMode, setViewMode] = useState<EarthViewMode>('globe_3d');
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [is3DSupported, setIs3DSupported] = useState(true);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [cameraTilt, setCameraTilt] = useState<number>(65);
  const [cameraHeading, setCameraHeading] = useState<number>(0);
  const [cameraRange, setCameraRange] = useState<number>(15000);
  const [activeSiteInfo, setActiveSiteInfo] = useState<SiteMarker | null>(null);

  // Moveable / Resizable / Collapsible Overlay States
  const [siteCardPos, setSiteCardPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingSiteCard, setIsDraggingSiteCard] = useState(false);
  const [isSiteCardCollapsed, setIsSiteCardCollapsed] = useState(false);

  const [plottingPos, setPlottingPos] = useState<{ x: number; y: number } | null>(null);
  const [plottingSize, setPlottingSize] = useState<{ width: number; height: number } | null>(null);
  const [isDraggingPlotting, setIsDraggingPlotting] = useState(false);
  const [isResizingPlotting, setIsResizingPlotting] = useState(false);
  const [localPlottingPanelOpen, setLocalPlottingPanelOpen] = useState<boolean>(false);
  const [isPlottingMinimized, setIsPlottingMinimized] = useState<boolean>(false);

  const [cameraHudPos, setCameraHudPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingCameraHud, setIsDraggingCameraHud] = useState(false);
  const [isCameraHudCollapsed, setIsCameraHudCollapsed] = useState(true);

  const [legendPos, setLegendPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingLegend, setIsDraggingLegend] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Viewport Container Docked State (Tracks which elements are in the master container vs extracted on map)
  const [dockedState, setDockedState] = useState<Record<ViewportElementId, boolean>>(() => {
    try {
      const saved = localStorage.getItem('google_earth_docked_elements');
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
        localStorage.setItem('google_earth_docked_elements', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleDockIn = useCallback((id: ViewportElementId) => {
    setDockedState(prev => {
      const next = { ...prev, [id]: true };
      try {
        localStorage.setItem('google_earth_docked_elements', JSON.stringify(next));
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
      localStorage.setItem('google_earth_docked_elements', JSON.stringify(next));
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
      localStorage.setItem('google_earth_docked_elements', JSON.stringify(next));
    } catch {}
  }, []);

  // Map Plot Legend Layer Toggles
  const [layerFossilPins, setLayerFossilPins] = useState(true);
  const [layerExpeditionTrails, setLayerExpeditionTrails] = useState(true);
  const [layerPlotting, setLayerPlotting] = useState(true);
  const [layerWaypoints, setLayerWaypoints] = useState(true);

  // Hover Info Tooltip Options
  const [showInfoOnHover, setShowInfoOnHover] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('google_earth_show_info_on_hover');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [hoverDetailMode, setHoverDetailMode] = useState<'full' | 'compact'>(() => {
    try {
      const saved = localStorage.getItem('google_earth_hover_detail_level');
      return saved === 'compact' ? 'compact' : 'full';
    } catch {
      return 'full';
    }
  });

  const [hoveredSiteInfo, setHoveredSiteInfo] = useState<{
    site: SiteMarker;
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  const toggleShowInfoOnHover = () => {
    setShowInfoOnHover(prev => {
      const next = !prev;
      try {
        localStorage.setItem('google_earth_show_info_on_hover', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleHoverDetailMode = () => {
    setHoverDetailMode(prev => {
      const next = prev === 'full' ? 'compact' : 'full';
      try {
        localStorage.setItem('google_earth_hover_detail_level', next);
      } catch {}
      return next;
    });
  };

  // Automated Expedition Fly-Through Tour State
  const [isTourActive, setIsTourActive] = useState(false);
  const [isTourPaused, setIsTourPaused] = useState(false);
  const [tourProgress, setTourProgress] = useState(0);

  // Fullscreen, Shortcuts, Audio, and Locality Filter States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [localitySearchQuery, setLocalitySearchQuery] = useState('');
  const [localitySortMode, setLocalitySortMode] = useState<'sequence' | 'distance' | 'name'>('sequence');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('google_earth_audio_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Subtle web audio chime for locality arrivals and tours
  const playLocalityChime = useCallback((freq = 587.33) => {
    if (!isAudioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.35, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  }, [isAudioEnabled]);

  const toggleAudio = () => {
    setIsAudioEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('google_earth_audio_enabled', String(next));
      } catch {}
      return next;
    });
  };

  // Fullscreen Toggle Helper
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Pending target ref to store site if user navigated while map is initializing
  const pendingFlyTargetRef = useRef<SiteMarker | null>(null);

  // References for dedicated moving Active Excavation Pin
  const activeFossil3DMarkerRef = useRef<any>(null);
  const activeFossil2DMarkerRef = useRef<any>(null);
  const advancedMarkerClassRef = useRef<any>(null);
  const marker3DClassRef = useRef<any>(null);
  const flyCameraToSiteRef = useRef<((site: SiteMarker) => void) | null>(null);

  // Update or move 3D active excavation pin directly at target coordinates
  const update3DActiveMarkerPin = useCallback((targetSite: SiteMarker) => {
    if (!map3DElementRef.current || !targetSite) return;

    try {
      // 1. Remove previous active 3D marker to guarantee clean repositioning
      if (activeFossil3DMarkerRef.current) {
        try {
          if (activeFossil3DMarkerRef.current.parentNode) {
            activeFossil3DMarkerRef.current.parentNode.removeChild(activeFossil3DMarkerRef.current);
          }
        } catch {}
        activeFossil3DMarkerRef.current = null;
      }

      // 2. Instantiate new active marker at exact site coordinates
      const pin3d = document.createElement('gmp-marker-3d');
      pin3d.id = 'active-excavation-site-pin-3d';
      pin3d.setAttribute('position', `${targetSite.lat},${targetSite.lng},25`);
      pin3d.setAttribute('altitude-mode', 'relative-to-ground');
      pin3d.setAttribute('extruded', 'true');
      pin3d.setAttribute('title', `Active Excavation: ${targetSite.name}`);
      (pin3d as any).position = { lat: targetSite.lat, lng: targetSite.lng, altitude: 25 };

      // Prominent Golden Active Excavation Pin with bone icon glyph
      const pinElement = document.createElement('gmp-pin');
      pinElement.setAttribute('background-color', '#f59e0b');
      pinElement.setAttribute('border-color', '#ffffff');
      pinElement.setAttribute('glyph-color', '#0f172a');
      pinElement.setAttribute('scale', '1.6');
      pin3d.appendChild(pinElement);

      pin3d.addEventListener('click', (e: any) => {
        e.stopPropagation();
        setActiveSiteInfo(targetSite);
        onMarkerClick(targetSite);
        if (flyCameraToSiteRef.current) {
          flyCameraToSiteRef.current(targetSite);
        }
      });

      map3DElementRef.current.appendChild(pin3d);
      activeFossil3DMarkerRef.current = pin3d;
    } catch (err) {
      console.warn('3D active marker pin note:', err);
    }
  }, [onMarkerClick]);

  // Update or move 2D active excavation pin with live coordinate translation and visual sync
  const update2DActiveMarkerPin = useCallback(async (targetSite: SiteMarker, mapInstance?: any) => {
    const map = mapInstance || map2DInstanceRef.current;
    if (!map || !targetSite) return;

    try {
      // Resolve AdvancedMarkerElement class
      let AdvancedMarkerClass = advancedMarkerClassRef.current || 
        (window as any).google?.maps?.marker?.AdvancedMarkerElement;

      if (!AdvancedMarkerClass && (window as any).google?.maps?.importLibrary) {
        try {
          const markerLib = await (window as any).google.maps.importLibrary('marker');
          AdvancedMarkerClass = markerLib?.AdvancedMarkerElement;
          advancedMarkerClassRef.current = AdvancedMarkerClass;
        } catch (libErr) {
          console.warn('Could not import marker library dynamically:', libErr);
        }
      }

      // 1. Move or instantiate dedicated high-visibility Active Excavation Pin
      if (!activeFossil2DMarkerRef.current) {
        const pinContainer = document.createElement('div');
        pinContainer.id = 'active-excavation-pin-2d';
        pinContainer.className = 'cursor-pointer flex flex-col items-center pointer-events-auto transition-transform duration-300 z-50';
        pinContainer.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-3 rounded-full bg-emerald-400/50 border-2 border-emerald-400 animate-ping"></div>
            <div class="absolute -inset-1 rounded-full bg-amber-400/35 border border-dashed border-amber-400"></div>
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-400 text-white shadow-2xl ring-4 ring-white flex items-center justify-center font-extrabold text-base z-10">
              🦴
            </div>
            <div class="absolute -bottom-1.5 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-amber-400"></div>
          </div>
          <div class="active-pin-2d-badge mt-1.5 px-2.5 py-1 rounded-lg bg-slate-900/95 text-emerald-300 font-mono text-[10px] font-extrabold border-2 border-emerald-400 shadow-2xl whitespace-nowrap flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="badge-text">ACTIVE: ${targetSite.name.split(/[,(]/)[0]}</span>
          </div>
        `;

        if (AdvancedMarkerClass) {
          const marker = new AdvancedMarkerClass({
            map,
            position: { lat: targetSite.lat, lng: targetSite.lng },
            title: `Active Excavation: ${targetSite.name}`,
            content: pinContainer,
            zIndex: 99999
          });

          marker.addListener('click', () => {
            setActiveSiteInfo(targetSite);
            onMarkerClick(targetSite);
            if (flyCameraToSiteRef.current) {
              flyCameraToSiteRef.current(targetSite);
            }
          });

          activeFossil2DMarkerRef.current = marker;
        } else if ((window as any).google?.maps?.Marker) {
          const marker = new (window as any).google.maps.Marker({
            map,
            position: { lat: targetSite.lat, lng: targetSite.lng },
            title: `Active Excavation: ${targetSite.name}`,
            zIndex: 99999
          });
          marker.addListener('click', () => {
            setActiveSiteInfo(targetSite);
            onMarkerClick(targetSite);
            if (flyCameraToSiteRef.current) {
              flyCameraToSiteRef.current(targetSite);
            }
          });
          activeFossil2DMarkerRef.current = marker;
        }
      } else {
        // MOVE the active pin to target coordinates
        if (typeof activeFossil2DMarkerRef.current.setPosition === 'function') {
          activeFossil2DMarkerRef.current.setPosition({ lat: targetSite.lat, lng: targetSite.lng });
        }
        try {
          activeFossil2DMarkerRef.current.position = { lat: targetSite.lat, lng: targetSite.lng };
        } catch {}
        if (activeFossil2DMarkerRef.current.map !== map) {
          activeFossil2DMarkerRef.current.map = map;
        }
        activeFossil2DMarkerRef.current.title = `Active Excavation: ${targetSite.name}`;
        const badgeText = activeFossil2DMarkerRef.current.content?.querySelector('.badge-text');
        if (badgeText) {
          badgeText.textContent = `ACTIVE: ${targetSite.name.split(/[,(]/)[0]}`;
        }
      }

      // 2. Synchronize visual states of all existing 2D markers
      if (markers2DRef.current && markers2DRef.current.length > 0) {
        markers2DRef.current.forEach((m: any) => {
          const isTarget = (m.siteData && (m.siteData.name === targetSite.name || m.siteData.id === targetSite.id)) ||
            (m.title === targetSite.name) ||
            (m.siteData && Math.abs(m.siteData.lat - targetSite.lat) < 0.001 && Math.abs(m.siteData.lng - targetSite.lng) < 0.001);

          if (m.pinContainer) {
            const circle = m.pinContainer.querySelector('.marker-circle');
            const label = m.pinContainer.querySelector('.marker-label');
            if (circle) {
              circle.className = `marker-circle ${isTarget 
                ? 'w-10 h-10 rounded-full bg-amber-500 ring-4 ring-amber-300 text-white shadow-2xl flex items-center justify-center font-bold text-sm scale-110' 
                : 'w-7 h-7 rounded-full bg-emerald-700/90 ring-2 ring-white/80 text-white/90 shadow-md flex items-center justify-center font-bold text-xs scale-100'
              } transition-all duration-300`;
            }
            if (label) {
              label.className = `marker-label mt-1 px-2 py-0.5 rounded-md ${isTarget 
                ? 'bg-amber-950 text-amber-300 border border-amber-400 font-bold scale-105' 
                : 'bg-slate-900/90 text-slate-300 border border-slate-700'
              } font-mono text-[9px] shadow-md whitespace-nowrap transition-all duration-300`;
            }
          }
        });
      }

      // Center map smoothly on the active site
      map.panTo({ lat: targetSite.lat, lng: targetSite.lng });
    } catch (err) {
      console.warn('2D active marker pin note:', err);
    }
  }, [onMarkerClick]);

  // Fly Camera Directly to a Specific Locality with Audio Ping, Orbit Cancellation, Pin Movement, and Fallback
  const flyCameraToSite = useCallback((site: SiteMarker) => {
    if (!site) return;

    if (orbitAnimIdRef.current) {
      cancelAnimationFrame(orbitAnimIdRef.current);
      orbitAnimIdRef.current = null;
      setIsOrbiting(false);
    }

    pendingFlyTargetRef.current = site;
    const targetCenter = { lat: site.lat, lng: site.lng, altitude: 0 };

    // Move the active map pin to the relevant excavation site
    update3DActiveMarkerPin(site);
    update2DActiveMarkerPin(site);

    if (map3DElementRef.current) {
      let flew = false;
      if (typeof map3DElementRef.current.flyCameraTo === 'function') {
        try {
          map3DElementRef.current.flyCameraTo({
            endCamera: {
              center: targetCenter,
              range: 12000,
              tilt: cameraTilt || 65,
              heading: (cameraHeading + 35) % 360
            },
            durationMillis: 2200,
            duration: 2200
          });
          flew = true;
        } catch (flyErr) {
          console.warn('flyCameraTo note:', flyErr);
        }
      }

      if (!flew) {
        try {
          map3DElementRef.current.center = targetCenter;
          map3DElementRef.current.range = 12000;
          map3DElementRef.current.tilt = cameraTilt || 65;
          map3DElementRef.current.heading = cameraHeading || 15;
        } catch {
          map3DElementRef.current.setAttribute('center', `${site.lat},${site.lng},0`);
          map3DElementRef.current.setAttribute('range', '12000');
          map3DElementRef.current.setAttribute('tilt', String(cameraTilt || 65));
        }
      }
    }

    if (map2DInstanceRef.current) {
      try {
        map2DInstanceRef.current.panTo({ lat: site.lat, lng: site.lng });
        if (map2DInstanceRef.current.getZoom() < 8) {
          map2DInstanceRef.current.setZoom(10);
        }
      } catch (err2d) {
        console.warn('map2D panTo note:', err2d);
      }
    }

    playLocalityChime(659.25);
  }, [cameraTilt, cameraHeading, playLocalityChime, update3DActiveMarkerPin, update2DActiveMarkerPin]);

  flyCameraToSiteRef.current = flyCameraToSite;

  // Guaranteed camera flight AND pin repositioning upon any excavation site navigation signal from App.tsx
  const prevSignalTimeRef = useRef<number>(0);
  useEffect(() => {
    if (!siteNavSignal || siteNavSignal.timestamp === prevSignalTimeRef.current) return;
    prevSignalTimeRef.current = siteNavSignal.timestamp;
    setActiveSiteInfo(siteNavSignal.site);
    update3DActiveMarkerPin(siteNavSignal.site);
    update2DActiveMarkerPin(siteNavSignal.site);
    flyCameraToSite(siteNavSignal.site);
  }, [siteNavSignal, flyCameraToSite, update3DActiveMarkerPin, update2DActiveMarkerPin]);

  // Identify active marker with siteNavSignal and currentIndex prioritization
  const activeMarker = useMemo(() => {
    // 1. If explicit siteNavSignal is provided, prioritize it
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

    // 2. If valid currentIndex is provided, prioritize it
    if (typeof currentIndex === 'number' && currentIndex >= 0 && currentIndex < markers.length) {
      return markers[currentIndex];
    }

    // 3. Match by selectedMarkerId (exact or fuzzy)
    if (selectedMarkerId) {
      const exact = markers.find(m => m.id === selectedMarkerId || m.name === selectedMarkerId);
      if (exact) return exact;

      const baseSelected = selectedMarkerId.split(/[,(]/)[0].toLowerCase().trim();
      const fuzzy = markers.find(m => {
        const baseM = m.name.split(/[,(]/)[0].toLowerCase().trim();
        return baseM === baseSelected || m.name.toLowerCase().includes(baseSelected) || selectedMarkerId.toLowerCase().includes(baseM);
      });
      if (fuzzy) return fuzzy;
    }

    return markers[0];
  }, [markers, currentIndex, selectedMarkerId, siteNavSignal]);

  // Keep activeSiteInfo and map pins in sync with activeMarker
  useEffect(() => {
    if (activeMarker) {
      setActiveSiteInfo(activeMarker);
      update3DActiveMarkerPin(activeMarker);
      update2DActiveMarkerPin(activeMarker);
    }
  }, [activeMarker, update3DActiveMarkerPin, update2DActiveMarkerPin]);

  // Track the last flown marker to guarantee camera moves when excavation site navigation triggers
  const lastFlownMarkerRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeMarker) return;
    const markerKey = `${activeMarker.name}_${activeMarker.lat}_${activeMarker.lng}_${currentIndex}`;
    if (lastFlownMarkerRef.current === markerKey) return;
    lastFlownMarkerRef.current = markerKey;

    flyCameraToSite(activeMarker);
  }, [activeMarker, currentIndex, flyCameraToSite]);

  // Processed and filtered localities roster
  const processedMarkers = useMemo(() => {
    let list = (markers || []).map((m, originalIdx) => ({ site: m, originalIdx }));

    if (localitySearchQuery.trim()) {
      const q = localitySearchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.site.name.toLowerCase().includes(q) ||
        (item.site.country && item.site.country.toLowerCase().includes(q))
      );
    }

    if (localitySortMode === 'name') {
      list.sort((a, b) => a.site.name.localeCompare(b.site.name));
    } else if (localitySortMode === 'distance' && activeMarker) {
      list.sort((a, b) => {
        const relA = computeRelativeLocation(activeMarker, a.site);
        const relB = computeRelativeLocation(activeMarker, b.site);
        return (relA?.distanceKm || 0) - (relB?.distanceKm || 0);
      });
    }
    return list;
  }, [markers, localitySearchQuery, localitySortMode, activeMarker]);

  // Track container dimensions with ResizeObserver for boundary clamping
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Clamping effect for all draggable overlays on screen resize
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    if (siteCardPos && siteCardRef.current) {
      const rect = siteCardRef.current.getBoundingClientRect();
      const maxX = Math.max(8, dimensions.width - rect.width - 8);
      const maxY = Math.max(8, dimensions.height - rect.height - 8);
      if (siteCardPos.x > maxX || siteCardPos.y > maxY) {
        setSiteCardPos({ x: Math.min(siteCardPos.x, maxX), y: Math.min(siteCardPos.y, maxY) });
      }
    }

    if (plottingPos && plottingPanelRef.current) {
      const rect = plottingPanelRef.current.getBoundingClientRect();
      const maxX = Math.max(8, dimensions.width - rect.width - 8);
      const maxY = Math.max(8, dimensions.height - rect.height - 8);
      if (plottingPos.x > maxX || plottingPos.y > maxY) {
        setPlottingPos({ x: Math.min(plottingPos.x, maxX), y: Math.min(plottingPos.y, maxY) });
      }
    }

    if (cameraHudPos && cameraHudRef.current) {
      const rect = cameraHudRef.current.getBoundingClientRect();
      const maxX = Math.max(8, dimensions.width - rect.width - 8);
      const maxY = Math.max(8, dimensions.height - rect.height - 8);
      if (cameraHudPos.x > maxX || cameraHudPos.y > maxY) {
        setCameraHudPos({ x: Math.min(cameraHudPos.x, maxX), y: Math.min(cameraHudPos.y, maxY) });
      }
    }

    if (legendPos && legendRef.current) {
      const rect = legendRef.current.getBoundingClientRect();
      const maxX = Math.max(8, dimensions.width - rect.width - 8);
      const maxY = Math.max(8, dimensions.height - rect.height - 8);
      if (legendPos.x > maxX || legendPos.y > maxY) {
        setLegendPos({ x: Math.min(legendPos.x, maxX), y: Math.min(legendPos.y, maxY) });
      }
    }
  }, [dimensions.width, dimensions.height, siteCardPos, plottingPos, cameraHudPos, legendPos]);

  // Load Google Maps JavaScript API with maps3d & maps libraries
  useEffect(() => {
    let mounted = true;
    const hasWebGL = isWebGLSupported();
    if (!hasWebGL) {
      setIs3DSupported(false);
      setViewMode('satellite');
    }

    loadGoogleMapsApi().then((success) => {
      if (!mounted) return;
      if (success) {
        setIsApiLoaded(true);
      } else {
        setLoadError('Google Maps & Earth API could not be initialized.');
      }
    });

    return () => {
      mounted = false;
      if (orbitAnimIdRef.current) {
        cancelAnimationFrame(orbitAnimIdRef.current);
      }
    };
  }, []);

  // Cleanup 2D/3D instances when switching modes
  const clearMapInstances = useCallback((destroyContainer: boolean = true) => {
    if (orbitAnimIdRef.current) {
      cancelAnimationFrame(orbitAnimIdRef.current);
      orbitAnimIdRef.current = null;
      setIsOrbiting(false);
    }

    // Clean 3D markers
    markers3DRef.current.forEach(m => {
      try {
        if (m.parentNode) m.parentNode.removeChild(m);
      } catch {}
    });
    markers3DRef.current = [];

    if (activeFossil3DMarkerRef.current?.parentNode) {
      try {
        activeFossil3DMarkerRef.current.parentNode.removeChild(activeFossil3DMarkerRef.current);
      } catch {}
      activeFossil3DMarkerRef.current = null;
    }

    if (waypoint3DMarkerRef.current?.parentNode) {
      try {
        waypoint3DMarkerRef.current.parentNode.removeChild(waypoint3DMarkerRef.current);
      } catch {}
      waypoint3DMarkerRef.current = null;
    }

    // Clean 2D markers and overlays
    markers2DRef.current.forEach(m => {
      try {
        if (m.map) m.map = null;
      } catch {}
    });
    markers2DRef.current = [];

    if (activeFossil2DMarkerRef.current?.map) {
      try {
        activeFossil2DMarkerRef.current.map = null;
      } catch {}
      activeFossil2DMarkerRef.current = null;
    }

    trailPolylines2DRef.current.forEach(line => {
      try {
        line.setMap(null);
      } catch {}
    });
    trailPolylines2DRef.current = [];

    if (waypoint2DMarkerRef.current?.map) {
      waypoint2DMarkerRef.current.map = null;
      waypoint2DMarkerRef.current = null;
    }

    overlayOverlays2DRef.current.forEach(overlay => {
      try {
        overlay.setMap(null);
      } catch {}
    });
    overlayOverlays2DRef.current = [];

    // Clean 3D plotting custom elements
    plotting3DElementsRef.current.forEach(el => {
      try {
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch {}
    });
    plotting3DElementsRef.current = [];

    trail3DPolylinesRef.current.forEach(el => {
      try {
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch {}
    });
    trail3DPolylinesRef.current = [];

    if (destroyContainer) {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      map3DElementRef.current = null;
      map2DInstanceRef.current = null;
    }
  }, []);

  // Update 2D Plotting Overlays (Buffer rings, Cardinal lines, Migration vectors, Density rings, Hypsometry, Locomotion)
  const update2DPlottingOverlays = useCallback((mapInstance: any) => {
    if (!mapInstance || !(window as any).google?.maps) return;

    // Clear existing 2D overlays
    overlayOverlays2DRef.current.forEach(overlay => {
      try {
        overlay.setMap(null);
      } catch {}
    });
    overlayOverlays2DRef.current = [];

    if (!layerPlotting) return;

    const googleMaps = (window as any).google.maps;

    // 1. Trails & Buffer Specialization: Draw buffer circles around sites
    if (plottingConfig.mode === 'trails') {
      const radiusMeters = plottingConfig.bufferRadiusKm * 1000;
      markers.forEach(site => {
        // Recovery threshold filter
        if (site.osteologyRecoveryPct !== undefined && site.osteologyRecoveryPct < plottingConfig.minRecoveryPercent) {
          return;
        }
        const isCurrent = activeMarker?.name === site.name;
        const circle = new googleMaps.Circle({
          map: mapInstance,
          center: { lat: site.lat, lng: site.lng },
          radius: radiusMeters,
          fillColor: isCurrent ? '#10b981' : '#059669',
          fillOpacity: isCurrent ? 0.22 : 0.10,
          strokeColor: isCurrent ? '#10b981' : '#047857',
          strokeOpacity: isCurrent ? 0.9 : 0.6,
          strokeWeight: isCurrent ? 2.5 : 1.2,
          clickable: false
        });
        overlayOverlays2DRef.current.push(circle);
      });
    }

    // 2. Cardinal Directionality: Draw azimuth lines radiating to neighboring sites
    if (plottingConfig.mode === 'cardinal' && activeMarker && markers.length > 1) {
      const neighbours = computeAllNeighbouringRelativeLocations(activeMarker, markers);
      neighbours.forEach(n => {
        if (plottingConfig.maxNeighbourRadiusKm > 0 && n.distanceKm > plottingConfig.maxNeighbourRadiusKm) {
          return;
        }

        const line = new googleMaps.Polyline({
          map: mapInstance,
          path: [
            { lat: activeMarker.lat, lng: activeMarker.lng },
            { lat: n.targetLat, lng: n.targetLng }
          ],
          geodesic: true,
          strokeColor: '#0d9488',
          strokeOpacity: 0.85,
          strokeWeight: plottingConfig.vectorLineWidthPx || 2
        });
        overlayOverlays2DRef.current.push(line);
      });
    }

    // 3. Migration Flow: Draw corridor lines & swath boundaries
    if (plottingConfig.mode === 'migration' && activeMarker) {
      const swathOffsetDeg = (plottingConfig.corridorWidthKm / 111.32) * 0.5;

      if (activeWaypoint) {
        const migrationLine = new googleMaps.Polyline({
          map: mapInstance,
          path: [
            { lat: activeMarker.lat, lng: activeMarker.lng },
            { lat: activeWaypoint.lat, lng: activeWaypoint.lng }
          ],
          geodesic: true,
          strokeColor: '#f59e0b',
          strokeOpacity: 0.9,
          strokeWeight: 3
        });
        overlayOverlays2DRef.current.push(migrationLine);
      }

      if (markers.length > 1) {
        for (let i = 0; i < markers.length - 1; i++) {
          const p1 = markers[i];
          const p2 = markers[i + 1];

          // Central spine
          const corridor = new googleMaps.Polyline({
            map: mapInstance,
            path: [
              { lat: p1.lat, lng: p1.lng },
              { lat: p2.lat, lng: p2.lng }
            ],
            geodesic: true,
            strokeColor: '#f59e0b',
            strokeOpacity: 0.75,
            strokeWeight: 2.5
          });
          overlayOverlays2DRef.current.push(corridor);

          // Corridor swath lateral boundary lines
          const boundNorth = new googleMaps.Polyline({
            map: mapInstance,
            path: [
              { lat: p1.lat + swathOffsetDeg, lng: p1.lng },
              { lat: p2.lat + swathOffsetDeg, lng: p2.lng }
            ],
            geodesic: true,
            strokeColor: '#fbbf24',
            strokeOpacity: 0.45,
            strokeWeight: 1.2
          });
          const boundSouth = new googleMaps.Polyline({
            map: mapInstance,
            path: [
              { lat: p1.lat - swathOffsetDeg, lng: p1.lng },
              { lat: p2.lat - swathOffsetDeg, lng: p2.lng }
            ],
            geodesic: true,
            strokeColor: '#fbbf24',
            strokeOpacity: 0.45,
            strokeWeight: 1.2
          });
          overlayOverlays2DRef.current.push(boundNorth);
          overlayOverlays2DRef.current.push(boundSouth);
        }
      }
    }

    // 4. Paleo-Elevation Hypsometry Contours in 2D
    if (plottingConfig.mode === 'hypsometry') {
      const minAlt = plottingConfig.minElevationM;
      const maxAlt = plottingConfig.maxElevationM;
      const interval = Math.max(25, plottingConfig.contourIntervalM);
      const numRings = Math.min(6, Math.floor((maxAlt - minAlt) / interval));

      markers.forEach(site => {
        for (let r = 1; r <= numRings; r++) {
          const altM = minAlt + r * interval;
          const radiusM = r * 18000; // 18km per contour interval
          const isIndex = altM % (interval * 2) === 0;

          const ring = new googleMaps.Circle({
            map: mapInstance,
            center: { lat: site.lat, lng: site.lng },
            radius: radiusM,
            fillOpacity: 0,
            strokeColor: isIndex ? '#0f766e' : '#14b8a6',
            strokeOpacity: isIndex ? 0.8 : 0.45,
            strokeWeight: isIndex ? 2 : 1,
            clickable: false
          });
          overlayOverlays2DRef.current.push(ring);
        }
      });
    }

    // 5. Locomotion & Gait Kinematics in 2D
    if (plottingConfig.mode === 'locomotion' && markers.length > 1) {
      for (let i = 0; i < markers.length - 1; i++) {
        const p1 = markers[i];
        const p2 = markers[i + 1];

        // Trackway segment
        const trackLine = new googleMaps.Polyline({
          map: mapInstance,
          path: [
            { lat: p1.lat, lng: p1.lng },
            { lat: p2.lat, lng: p2.lng }
          ],
          geodesic: true,
          strokeColor: '#06b6d4',
          strokeOpacity: 0.8,
          strokeWeight: 2.5
        });
        overlayOverlays2DRef.current.push(trackLine);

        // Biomechanical gait steps along segment
        const stepsCount = Math.min(8, Math.max(3, Math.round(plottingConfig.strideLengthM * 2)));
        for (let s = 1; s < stepsCount; s++) {
          const frac = s / stepsCount;
          const sLat = p1.lat + (p2.lat - p1.lat) * frac;
          const sLng = p1.lng + (p2.lng - p1.lng) * frac;

          const stepCircle = new googleMaps.Circle({
            map: mapInstance,
            center: { lat: sLat, lng: sLng },
            radius: 3000,
            fillColor: '#22d3ee',
            fillOpacity: 0.35,
            strokeColor: '#0891b2',
            strokeOpacity: 0.8,
            strokeWeight: 1.5,
            clickable: false
          });
          overlayOverlays2DRef.current.push(stepCircle);
        }
      }
    }

    // 6. Kernel Density: Concentric density gradient rings
    if (plottingConfig.mode === 'density' && activeMarker) {
      const bandwidthM = plottingConfig.kernelBandwidthKm * 1000;
      const bands = plottingConfig.densityQuantileBands || 4;
      for (let b = 1; b <= bands; b++) {
        const ringRadius = (bandwidthM / bands) * b;
        const densityRing = new googleMaps.Circle({
          map: mapInstance,
          center: { lat: activeMarker.lat, lng: activeMarker.lng },
          radius: ringRadius,
          fillColor: '#8b5cf6',
          fillOpacity: 0.08 / b,
          strokeColor: '#7c3aed',
          strokeOpacity: 0.4,
          strokeWeight: 1,
          clickable: false
        });
        overlayOverlays2DRef.current.push(densityRing);
      }
    }
  }, [plottingConfig, markers, activeMarker, activeWaypoint, layerPlotting]);

  // Update 3D Plotting Overlays (Buffer rings, Cardinal lines, Migration vectors, Density rings, Hypsometry, Locomotion)
  const update3DPlottingOverlays = useCallback(() => {
    if (!map3DElementRef.current) return;

    // Clean previous 3D plotting elements
    plotting3DElementsRef.current.forEach(el => {
      try {
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch {}
    });
    plotting3DElementsRef.current = [];

    if (!layerPlotting) return;

    const map3d = map3DElementRef.current;

    try {
      // 1. Trails & Buffer Specialization in 3D
      if (plottingConfig.mode === 'trails') {
        const radiusMeters = plottingConfig.bufferRadiusKm * 1000;
        markers.forEach(site => {
          if (site.osteologyRecoveryPct !== undefined && site.osteologyRecoveryPct < plottingConfig.minRecoveryPercent) {
            return;
          }
          const isCur = activeMarker?.name === site.name;
          const circleCoords = generateGeodesicCircleCoords(site.lat, site.lng, radiusMeters, 28);
          
          try {
            const poly3d = document.createElement('gmp-polyline-3d');
            poly3d.setAttribute('altitude-mode', 'clamp-to-ground');
            poly3d.setAttribute('stroke-color', isCur ? '#10b981' : '#059669');
            poly3d.setAttribute('stroke-width', isCur ? '3' : '1.5');
            (poly3d as any).coordinates = circleCoords;
            map3d.appendChild(poly3d);
            plotting3DElementsRef.current.push(poly3d);
          } catch (e) {
            console.warn('3D Buffer ring notice:', e);
          }
        });
      }

      // 2. Cardinal Directionality & Radial Azimuth Vectors in 3D
      if (plottingConfig.mode === 'cardinal' && activeMarker && markers.length > 1) {
        const neighbours = computeAllNeighbouringRelativeLocations(activeMarker, markers);
        neighbours.forEach(n => {
          if (plottingConfig.maxNeighbourRadiusKm > 0 && n.distanceKm > plottingConfig.maxNeighbourRadiusKm) {
            return;
          }

          try {
            const line3d = document.createElement('gmp-polyline-3d');
            line3d.setAttribute('altitude-mode', 'clamp-to-ground');
            line3d.setAttribute('stroke-color', '#0d9488');
            line3d.setAttribute('stroke-width', String(Math.max(2, plottingConfig.vectorLineWidthPx || 2)));
            (line3d as any).coordinates = [
              { lat: activeMarker.lat, lng: activeMarker.lng, altitude: 0 },
              { lat: n.targetLat, lng: n.targetLng, altitude: 0 }
            ];
            map3d.appendChild(line3d);
            plotting3DElementsRef.current.push(line3d);
          } catch (e) {
            console.warn('3D Cardinal line notice:', e);
          }
        });
      }

      // 3. Migration Flow Corridors in 3D
      if (plottingConfig.mode === 'migration' && activeMarker) {
        const swathOffsetDeg = (plottingConfig.corridorWidthKm / 111.32) * 0.5;

        // Active waypoint vector
        if (activeWaypoint) {
          try {
            const wpLine = document.createElement('gmp-polyline-3d');
            wpLine.setAttribute('altitude-mode', 'clamp-to-ground');
            wpLine.setAttribute('stroke-color', '#f59e0b');
            wpLine.setAttribute('stroke-width', '4');
            (wpLine as any).coordinates = [
              { lat: activeMarker.lat, lng: activeMarker.lng, altitude: 0 },
              { lat: activeWaypoint.lat, lng: activeWaypoint.lng, altitude: 0 }
            ];
            map3d.appendChild(wpLine);
            plotting3DElementsRef.current.push(wpLine);
          } catch (e) {}
        }

        // Sequential migration corridor between sites
        if (markers.length > 1) {
          for (let i = 0; i < markers.length - 1; i++) {
            const p1 = markers[i];
            const p2 = markers[i + 1];

            // Central spine
            try {
              const spine = document.createElement('gmp-polyline-3d');
              spine.setAttribute('altitude-mode', 'clamp-to-ground');
              spine.setAttribute('stroke-color', '#f59e0b');
              spine.setAttribute('stroke-width', '3');
              (spine as any).coordinates = [
                { lat: p1.lat, lng: p1.lng, altitude: 0 },
                { lat: p2.lat, lng: p2.lng, altitude: 0 }
              ];
              map3d.appendChild(spine);
              plotting3DElementsRef.current.push(spine);
            } catch (e) {}

            // Corridor swath boundary lines (north and south offsets)
            try {
              const bound1 = document.createElement('gmp-polyline-3d');
              bound1.setAttribute('altitude-mode', 'clamp-to-ground');
              bound1.setAttribute('stroke-color', '#fbbf24');
              bound1.setAttribute('stroke-width', '1.5');
              (bound1 as any).coordinates = [
                { lat: p1.lat + swathOffsetDeg, lng: p1.lng, altitude: 0 },
                { lat: p2.lat + swathOffsetDeg, lng: p2.lng, altitude: 0 }
              ];
              map3d.appendChild(bound1);
              plotting3DElementsRef.current.push(bound1);

              const bound2 = document.createElement('gmp-polyline-3d');
              bound2.setAttribute('altitude-mode', 'clamp-to-ground');
              bound2.setAttribute('stroke-color', '#fbbf24');
              bound2.setAttribute('stroke-width', '1.5');
              (bound2 as any).coordinates = [
                { lat: p1.lat - swathOffsetDeg, lng: p1.lng, altitude: 0 },
                { lat: p2.lat - swathOffsetDeg, lng: p2.lng, altitude: 0 }
              ];
              map3d.appendChild(bound2);
              plotting3DElementsRef.current.push(bound2);
            } catch (e) {}
          }
        }
      }

      // 4. Hypsometry Contours in 3D
      if (plottingConfig.mode === 'hypsometry') {
        const minAlt = plottingConfig.minElevationM;
        const maxAlt = plottingConfig.maxElevationM;
        const interval = Math.max(25, plottingConfig.contourIntervalM);
        const numRings = Math.min(6, Math.floor((maxAlt - minAlt) / interval));

        markers.forEach(site => {
          for (let r = 1; r <= numRings; r++) {
            const altM = minAlt + r * interval;
            const radiusM = r * 18000;
            const isIndex = altM % (interval * 2) === 0;
            const ringCoords = generateGeodesicCircleCoords(site.lat, site.lng, radiusM, 24);

            try {
              const contour3d = document.createElement('gmp-polyline-3d');
              contour3d.setAttribute('altitude-mode', 'clamp-to-ground');
              contour3d.setAttribute('stroke-color', isIndex ? '#0f766e' : '#14b8a6');
              contour3d.setAttribute('stroke-width', isIndex ? '2.5' : '1.2');
              (contour3d as any).coordinates = ringCoords;
              map3d.appendChild(contour3d);
              plotting3DElementsRef.current.push(contour3d);
            } catch (e) {}
          }
        });
      }

      // 5. Locomotion & Gait Kinematics in 3D
      if (plottingConfig.mode === 'locomotion' && markers.length > 1) {
        for (let i = 0; i < markers.length - 1; i++) {
          const p1 = markers[i];
          const p2 = markers[i + 1];

          // Trackway polyline
          try {
            const trackLine = document.createElement('gmp-polyline-3d');
            trackLine.setAttribute('altitude-mode', 'clamp-to-ground');
            trackLine.setAttribute('stroke-color', '#06b6d4');
            trackLine.setAttribute('stroke-width', '2.5');
            (trackLine as any).coordinates = [
              { lat: p1.lat, lng: p1.lng, altitude: 0 },
              { lat: p2.lat, lng: p2.lng, altitude: 0 }
            ];
            map3d.appendChild(trackLine);
            plotting3DElementsRef.current.push(trackLine);
          } catch (e) {}

          // Stride waypoint steps along trackway
          const stepsCount = Math.min(8, Math.max(3, Math.round(plottingConfig.strideLengthM * 2)));
          for (let s = 1; s < stepsCount; s++) {
            const frac = s / stepsCount;
            const sLat = p1.lat + (p2.lat - p1.lat) * frac;
            const sLng = p1.lng + (p2.lng - p1.lng) * frac;
            const stepCoords = generateGeodesicCircleCoords(sLat, sLng, 3000, 12);
            try {
              const stepMarker = document.createElement('gmp-polyline-3d');
              stepMarker.setAttribute('altitude-mode', 'clamp-to-ground');
              stepMarker.setAttribute('stroke-color', '#22d3ee');
              stepMarker.setAttribute('stroke-width', '1.5');
              (stepMarker as any).coordinates = stepCoords;
              map3d.appendChild(stepMarker);
              plotting3DElementsRef.current.push(stepMarker);
            } catch (e) {}
          }
        }
      }

      // 6. Kernel Density Isopleths in 3D
      if (plottingConfig.mode === 'density' && activeMarker) {
        const bandwidthM = plottingConfig.kernelBandwidthKm * 1000;
        const bands = plottingConfig.densityQuantileBands || 4;
        for (let b = 1; b <= bands; b++) {
          const ringRadius = (bandwidthM / bands) * b;
          const densityCoords = generateGeodesicCircleCoords(activeMarker.lat, activeMarker.lng, ringRadius, 28);
          try {
            const ring3d = document.createElement('gmp-polyline-3d');
            ring3d.setAttribute('altitude-mode', 'clamp-to-ground');
            ring3d.setAttribute('stroke-color', '#8b5cf6');
            ring3d.setAttribute('stroke-width', String(Math.max(1, (bands - b + 1) * 0.8)));
            (ring3d as any).coordinates = densityCoords;
            map3d.appendChild(ring3d);
            plotting3DElementsRef.current.push(ring3d);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('3D Plotting overlays update notice:', err);
    }
  }, [plottingConfig, markers, activeMarker, activeWaypoint, layerPlotting]);

  // Update 3D Expedition Trail Connecting Lines
  const update3DTrails = useCallback(() => {
    if (!map3DElementRef.current) return;

    trail3DPolylinesRef.current.forEach(el => {
      try {
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch {}
    });
    trail3DPolylinesRef.current = [];

    if (!layerExpeditionTrails || markers.length <= 1) return;

    try {
      const trail3d = document.createElement('gmp-polyline-3d');
      trail3d.setAttribute('altitude-mode', 'clamp-to-ground');
      trail3d.setAttribute('stroke-color', '#10b981');
      trail3d.setAttribute('stroke-width', '3');
      (trail3d as any).coordinates = markers.map(m => ({ lat: m.lat, lng: m.lng, altitude: 0 }));
      map3DElementRef.current.appendChild(trail3d);
      trail3DPolylinesRef.current.push(trail3d);
    } catch (err) {
      console.warn('3D Expedition trails update notice:', err);
    }
  }, [layerExpeditionTrails, markers]);

  // Update Expedition Trail Connecting Lines in 2D
  const update2DTrails = useCallback((mapInstance: any) => {
    if (!mapInstance || !(window as any).google?.maps) return;

    trailPolylines2DRef.current.forEach(line => {
      try { line.setMap(null); } catch {}
    });
    trailPolylines2DRef.current = [];

    if (!layerExpeditionTrails || markers.length <= 1) return;

    const googleMaps = (window as any).google.maps;
    const pathCoords = markers.map(m => ({ lat: m.lat, lng: m.lng }));

    const trailLine = new googleMaps.Polyline({
      map: mapInstance,
      path: pathCoords,
      geodesic: true,
      strokeColor: '#10b981',
      strokeOpacity: 0.7,
      strokeWeight: 2.5,
      icons: [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
        offset: '0',
        repeat: '15px'
      }]
    });

    trailPolylines2DRef.current.push(trailLine);
  }, [layerExpeditionTrails, markers]);

  // Update Waypoint in 3D Map
  const update3DWaypoint = useCallback(() => {
    if (!map3DElementRef.current) return;

    if (waypoint3DMarkerRef.current?.parentNode) {
      try {
        waypoint3DMarkerRef.current.parentNode.removeChild(waypoint3DMarkerRef.current);
      } catch {}
      waypoint3DMarkerRef.current = null;
    }

    if (activeWaypoint && layerWaypoints) {
      try {
        const wpMarker = document.createElement('gmp-marker-3d');
        wpMarker.setAttribute('position', `${activeWaypoint.lat},${activeWaypoint.lng},0`);
        wpMarker.setAttribute('altitude-mode', 'clamp-to-ground');
        wpMarker.setAttribute('title', `Migration Waypoint: ${activeWaypoint.season}`);

        map3DElementRef.current.appendChild(wpMarker);
        waypoint3DMarkerRef.current = wpMarker;

        // Fly to waypoint
        if (map3DElementRef.current.flyCameraTo) {
          map3DElementRef.current.flyCameraTo({
            endCamera: {
              center: { lat: activeWaypoint.lat, lng: activeWaypoint.lng, altitude: 0 },
              range: 16000,
              tilt: 60,
              heading: 30
            },
            duration: 2200
          });
        }
      } catch (err) {
        console.warn('3D Waypoint note:', err);
      }
    }
  }, [activeWaypoint, layerWaypoints]);

  // Update Waypoint in 2D Map
  const update2DWaypoint = useCallback(async (mapInstance: any) => {
    if (!mapInstance || !(window as any).google?.maps) return;

    if (waypoint2DMarkerRef.current?.map) {
      waypoint2DMarkerRef.current.map = null;
      waypoint2DMarkerRef.current = null;
    }

    if (activeWaypoint && layerWaypoints) {
      try {
        const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary('marker');
        const wpPin = document.createElement('div');
        wpPin.className = 'cursor-pointer flex flex-col items-center animate-bounce';
        wpPin.innerHTML = `
          <div class="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center ring-4 ring-amber-300 shadow-2xl text-xs">
            🧭
          </div>
          <div class="px-2 py-0.5 mt-1 rounded bg-amber-950 text-amber-300 text-[9px] font-mono font-bold border border-amber-500 whitespace-nowrap shadow-md">
            ${activeWaypoint.season} Waypoint
          </div>
        `;

        const marker = new AdvancedMarkerElement({
          map: mapInstance,
          position: { lat: activeWaypoint.lat, lng: activeWaypoint.lng },
          title: `Migration Waypoint: ${activeWaypoint.season}`,
          content: wpPin
        });

        waypoint2DMarkerRef.current = marker;
        mapInstance.panTo({ lat: activeWaypoint.lat, lng: activeWaypoint.lng });
        mapInstance.setZoom(8);
      } catch (err) {
        console.warn('2D Waypoint note:', err);
      }
    }
  }, [activeWaypoint, layerWaypoints]);

  // Initialize or update the Google Earth 3D Globe (<gmp-map-3d>)
  const init3DGlobe = useCallback(async () => {
    if (!containerRef.current || !(window as any).google?.maps) return;

    // Check if gmp-map-3d already exists in container and is connected
    const existingMap3d = containerRef.current.querySelector('gmp-map-3d') as any;
    if (existingMap3d && map3DElementRef.current === existingMap3d) {
      // Element is already mounted and streaming/ready, reuse without tearing down!
      clearMapInstances(false);
      const targetLat = activeMarker ? activeMarker.lat : 35.0;
      const targetLng = activeMarker ? activeMarker.lng : -100.0;
      try {
        existingMap3d.setAttribute('center', `${targetLat},${targetLng},0`);
      } catch {}

      const initialFlyTarget3D = pendingFlyTargetRef.current || activeMarker;
      if (initialFlyTarget3D && layerFossilPins) {
        update3DActiveMarkerPin(initialFlyTarget3D);
      }
      if (activeWaypoint && layerWaypoints) {
        update3DWaypoint();
      }
      update3DPlottingOverlays();
      update3DTrails();
      return;
    }

    clearMapInstances(true);

    try {
      await (window as any).google.maps.importLibrary('maps3d');
      await (window as any).google.maps.importLibrary('marker');

      const targetLat = activeMarker ? activeMarker.lat : 35.0;
      const targetLng = activeMarker ? activeMarker.lng : -100.0;

      // Create <gmp-map-3d> Web Component
      const map3d = document.createElement('gmp-map-3d');
      map3d.setAttribute('center', `${targetLat},${targetLng},0`);
      map3d.setAttribute('range', '18000');
      map3d.setAttribute('tilt', '65');
      map3d.setAttribute('heading', '15');
      map3d.setAttribute('mode', 'hybrid');
      map3d.setAttribute('internal-usage-attribution-ids', GOOGLE_MAPS_ATTRIBUTION_ID);
      map3d.style.width = '100%';
      map3d.style.height = '100%';
      map3d.style.display = 'block';

      containerRef.current.appendChild(map3d);
      map3DElementRef.current = map3d;

      // Add 3D active excavation pin (only the active site has a pin)
      const initialFlyTarget3D = pendingFlyTargetRef.current || activeMarker;
      if (initialFlyTarget3D && layerFossilPins) {
        update3DActiveMarkerPin(initialFlyTarget3D);
        setTimeout(() => {
          flyCameraToSite(initialFlyTarget3D);
        }, 500);
      }

      if (activeWaypoint && layerWaypoints) {
        update3DWaypoint();
      }

      // Add 3D plotting overlays and expedition trails
      update3DPlottingOverlays();
      update3DTrails();
    } catch (err) {
      console.warn('Google Earth 3D component notice, falling back to 3D Vector Satellite:', err);
      setIs3DSupported(false);
      setViewMode('satellite');
    }
  }, [activeMarker, markers, onMarkerClick, clearMapInstances, activeWaypoint, update3DWaypoint, update3DPlottingOverlays, update3DTrails, layerFossilPins, layerWaypoints, showInfoOnHover, flyCameraToSite]);

  // Initialize 2D/Vector Google Earth Satellite/Terrain Map
  const init2DMap = useCallback(async (mapType: 'satellite' | 'hybrid' | 'terrain') => {
    if (!containerRef.current || !(window as any).google?.maps) return;
    clearMapInstances(true);

    try {
      const { Map } = await (window as any).google.maps.importLibrary('maps');
      const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary('marker');
      advancedMarkerClassRef.current = AdvancedMarkerElement;

      const targetLat = activeMarker ? activeMarker.lat : 35.0;
      const targetLng = activeMarker ? activeMarker.lng : -100.0;

      const mapOptions = {
        center: { lat: targetLat, lng: targetLng },
        zoom: activeMarker ? 9 : 4,
        mapTypeId: mapType,
        tilt: 45,
        heading: 0,
        mapId: 'DEMO_MAP_ID', // Enables Vector rendering and 3D tilt
        renderingType: 'VECTOR',
        internalUsageAttributionIds: [GOOGLE_MAPS_ATTRIBUTION_ID],
        disableDefaultUI: false,
        zoomControl: true,
        rotateControl: true,
        scaleControl: true,
        mapTypeControl: false,
        fullscreenControl: false
      };

      const mapInstance = new Map(containerRef.current, mapOptions);
      map2DInstanceRef.current = mapInstance;

      // Add 2D active excavation pin (only the active site has a pin)
      const initialFlyTarget2D = pendingFlyTargetRef.current || activeMarker;
      if (initialFlyTarget2D && layerFossilPins) {
        update2DActiveMarkerPin(initialFlyTarget2D, mapInstance);
        setTimeout(() => {
          flyCameraToSite(initialFlyTarget2D);
        }, 500);
      }
    } catch (err) {
      console.error('Error initializing Google Maps 2D mode:', err);
    }
  }, [activeMarker, markers, onMarkerClick, clearMapInstances, update2DPlottingOverlays, update2DTrails, activeWaypoint, update2DWaypoint, layerFossilPins, layerWaypoints, showInfoOnHover, flyCameraToSite]);

  // Effect to instantiate map depending on viewMode and API readiness
  useEffect(() => {
    if (!isApiLoaded) return;

    if (viewMode === 'globe_3d' && is3DSupported) {
      init3DGlobe();
    } else if (viewMode === 'satellite') {
      init2DMap('hybrid');
    } else if (viewMode === 'terrain') {
      init2DMap('terrain');
    }

    return () => {
      // Retain 3D element if staying in 3D mode
      clearMapInstances(false);
    };
  }, [viewMode, isApiLoaded, is3DSupported]);

  // Dynamically synchronize all excavation site markers when markers prop updates or species changes
  useEffect(() => {
    if (!isApiLoaded || !layerFossilPins) return;

    if (viewMode === 'globe_3d' && map3DElementRef.current) {
      // Clear previous 3D site markers
      markers3DRef.current.forEach(m => {
        try {
          if (m.parentNode) m.parentNode.removeChild(m);
        } catch {}
      });
      markers3DRef.current = [];

      // Re-populate 3D site markers
      markers.forEach((site, index) => {
        try {
          const marker3d = document.createElement('gmp-marker-3d');
          marker3d.setAttribute('position', `${site.lat},${site.lng},0`);
          marker3d.setAttribute('altitude-mode', 'clamp-to-ground');
          marker3d.setAttribute('title', site.name);

          const pinElement = document.createElement('gmp-pin');
          pinElement.setAttribute('background-color', '#059669');
          pinElement.setAttribute('border-color', '#ffffff');
          pinElement.setAttribute('glyph-color', '#ffffff');
          pinElement.setAttribute('scale', '1.0');
          marker3d.appendChild(pinElement);

          marker3d.addEventListener('click', (e: any) => {
            e.stopPropagation();
            setActiveSiteInfo(site);
            onMarkerClick(site);
            flyCameraToSite(site);
          });

          map3DElementRef.current.appendChild(marker3d);
          markers3DRef.current.push(marker3d);
        } catch (mErr) {
          console.warn('3D marker sync note:', mErr);
        }
      });

      if (activeMarker) {
        update3DActiveMarkerPin(activeMarker);
      }
    } else if (map2DInstanceRef.current && (viewMode === 'satellite' || viewMode === 'terrain')) {
      const map = map2DInstanceRef.current;
      // Clear previous 2D site markers
      markers2DRef.current.forEach(m => {
        try {
          if ('map' in m) m.map = null;
          else if (typeof m.setMap === 'function') m.setMap(null);
        } catch {}
      });
      markers2DRef.current = [];

      const AdvancedMarkerClass = advancedMarkerClassRef.current || (window as any).google?.maps?.marker?.AdvancedMarkerElement;

      markers.forEach((site, index) => {
        try {
          if (AdvancedMarkerClass) {
            const pinDiv = document.createElement('div');
            pinDiv.className = 'cursor-pointer group flex flex-col items-center pointer-events-auto';
            pinDiv.innerHTML = `
              <div class="px-2 py-0.5 rounded-full bg-emerald-700 text-white font-mono text-[9px] font-bold shadow-lg border border-white">
                #${index + 1}
              </div>
              <div class="w-3 h-3 bg-emerald-600 rounded-full border-2 border-white shadow-md -mt-1"></div>
            `;
            const m = new AdvancedMarkerClass({
              map,
              position: { lat: site.lat, lng: site.lng },
              title: site.name,
              content: pinDiv
            });
            m.addListener('click', () => {
              setActiveSiteInfo(site);
              onMarkerClick(site);
              flyCameraToSite(site);
            });
            markers2DRef.current.push(m);
          }
        } catch (m2dErr) {
          console.warn('2D marker sync note:', m2dErr);
        }
      });

      if (activeMarker) {
        update2DActiveMarkerPin(activeMarker, map);
      }
    }
  }, [markers, viewMode, isApiLoaded, layerFossilPins, activeMarker, onMarkerClick, flyCameraToSite, update3DActiveMarkerPin, update2DActiveMarkerPin]);

  // Update 2D & 3D overlays whenever plottingConfig, activeMarker, or layer toggles change
  useEffect(() => {
    if (viewMode === 'globe_3d' && map3DElementRef.current) {
      update3DPlottingOverlays();
      update3DTrails();
    } else if (map2DInstanceRef.current && (viewMode === 'satellite' || viewMode === 'terrain')) {
      update2DPlottingOverlays(map2DInstanceRef.current);
      update2DTrails(map2DInstanceRef.current);
    }
  }, [
    plottingConfig, 
    viewMode, 
    activeMarker,
    markers,
    update3DPlottingOverlays, 
    update3DTrails, 
    update2DPlottingOverlays, 
    update2DTrails, 
    layerPlotting, 
    layerExpeditionTrails
  ]);

  // Handle activeWaypoint changes in 3D and 2D
  useEffect(() => {
    if (viewMode === 'globe_3d' && map3DElementRef.current) {
      update3DWaypoint();
    } else if (map2DInstanceRef.current) {
      update2DWaypoint(map2DInstanceRef.current);
    }
  }, [activeWaypoint, viewMode, update3DWaypoint, update2DWaypoint, layerWaypoints]);

  // Geographic Area Navigation Signal & Focus
  useEffect(() => {
    if (!areaNavSignal && activeGeographicArea === 'all') return;
    const regionKey = areaNavSignal?.areaId || activeGeographicArea;
    if (!regionKey) return;

    const targetRegion = GEOGRAPHIC_REGIONS[regionKey];
    if (!targetRegion) return;

    if (regionKey === 'all') {
      fitGlobalEarth();
      return;
    }

    const altitude = Math.max(1500000, Math.round(5500000 / targetRegion.zoomScale));

    if (viewMode === 'globe_3d' && map3DElementRef.current?.flyCameraTo) {
      map3DElementRef.current.flyCameraTo({
        endCamera: {
          center: { lat: targetRegion.centerLat, lng: targetRegion.centerLng, altitude: 0 },
          range: altitude,
          tilt: 45,
          heading: 0
        },
        duration: 2600
      });
      setCameraRange(altitude);
      setCameraTilt(45);
      setCameraHeading(0);
    } else if (map2DInstanceRef.current) {
      map2DInstanceRef.current.panTo({ lat: targetRegion.centerLat, lng: targetRegion.centerLng });
      const targetZoom = Math.min(7, Math.max(3, Math.round(targetRegion.zoomScale + 2)));
      map2DInstanceRef.current.setZoom(targetZoom);
    }
  }, [areaNavSignal, activeGeographicArea, viewMode]);

  // 3D Orbital Fly-around Animation Loop (CPU-sympathetic throttled render loop)
  const toggleOrbit = () => {
    if (isOrbiting) {
      if (orbitAnimIdRef.current) {
        cancelAnimationFrame(orbitAnimIdRef.current);
        orbitAnimIdRef.current = null;
      }
      setIsOrbiting(false);
      if (map3DElementRef.current) {
        setCameraHeading(Math.round(map3DElementRef.current.heading || 0));
      }
    } else {
      if (!map3DElementRef.current) return;
      setIsOrbiting(true);

      let currentHeading = cameraHeading;
      let lastHudUpdate = performance.now();

      const orbitLoop = (now: number) => {
        currentHeading = (currentHeading + 0.25) % 360;
        if (map3DElementRef.current) {
          map3DElementRef.current.heading = currentHeading;
          // Throttle React virtual DOM re-renders to every 250ms (4Hz) while WebGL smoothly rotates at 60fps
          if (now - lastHudUpdate >= 250) {
            setCameraHeading(Math.round(currentHeading));
            lastHudUpdate = now;
          }
        }
        orbitAnimIdRef.current = requestAnimationFrame(orbitLoop);
      };
      orbitAnimIdRef.current = requestAnimationFrame(orbitLoop);
    }
  };

  // 3D Tilt adjustment
  const adjustTilt = (delta: number) => {
    const nextTilt = Math.min(80, Math.max(0, cameraTilt + delta));
    setCameraTilt(nextTilt);
    if (map3DElementRef.current) {
      map3DElementRef.current.tilt = nextTilt;
    }
  };

  // 3D Range adjustment (Altitude)
  const adjustRange = (factor: number) => {
    const nextRange = Math.min(22000000, Math.max(2000, Math.round(cameraRange * factor)));
    setCameraRange(nextRange);
    if (map3DElementRef.current) {
      map3DElementRef.current.range = nextRange;
    } else if (map2DInstanceRef.current) {
      const curZoom = map2DInstanceRef.current.getZoom() || 5;
      map2DInstanceRef.current.setZoom(factor < 1 ? curZoom + 1 : Math.max(2, curZoom - 1));
    }
  };

  // Directional Pan (North, South, East, West)
  const handlePanDirection = (dir: 'north' | 'south' | 'east' | 'west') => {
    const deltaLat = dir === 'north' ? 3.0 : dir === 'south' ? -3.0 : 0;
    const deltaLng = dir === 'east' ? 4.0 : dir === 'west' ? -4.0 : 0;

    if (viewMode === 'globe_3d' && map3DElementRef.current) {
      const center = map3DElementRef.current.center || { lat: activeMarker?.lat || 35, lng: activeMarker?.lng || -100 };
      const nextLat = Math.max(-85, Math.min(85, (center.lat || 0) + deltaLat));
      const nextLng = ((center.lng || 0) + deltaLng);
      map3DElementRef.current.center = { lat: nextLat, lng: nextLng, altitude: 0 };
    } else if (map2DInstanceRef.current) {
      map2DInstanceRef.current.panBy(
        dir === 'east' ? 120 : dir === 'west' ? -120 : 0,
        dir === 'south' ? 120 : dir === 'north' ? -120 : 0
      );
    }
  };

  // Reset to North & level tilt
  const resetOrientation = () => {
    setCameraHeading(0);
    setCameraTilt(60);
    if (map3DElementRef.current) {
      map3DElementRef.current.heading = 0;
      map3DElementRef.current.tilt = 60;
    } else if (map2DInstanceRef.current) {
      map2DInstanceRef.current.setHeading(0);
    }
  };

  // Global Earth reset view
  const fitGlobalEarth = () => {
    if (map3DElementRef.current?.flyCameraTo) {
      map3DElementRef.current.flyCameraTo({
        endCamera: {
          center: { lat: 20, lng: 0, altitude: 0 },
          range: 22000000,
          tilt: 0,
          heading: 0
        },
        duration: 2500
      });
      setCameraTilt(0);
      setCameraHeading(0);
      setCameraRange(22000000);
    } else if (map2DInstanceRef.current) {
      map2DInstanceRef.current.setZoom(2);
      map2DInstanceRef.current.setCenter({ lat: 20, lng: 0 });
    }
  };

  // Active Taxon Auto-Centering: frame all excavation sites for the active species
  const autoCenterTaxonSites = () => {
    if (markers.length === 0) return;

    if (viewMode === 'globe_3d' && map3DElementRef.current?.flyCameraTo) {
      // Compute bounding center
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      markers.forEach(m => {
        if (m.lat < minLat) minLat = m.lat;
        if (m.lat > maxLat) maxLat = m.lat;
        if (m.lng < minLng) minLng = m.lng;
        if (m.lng > maxLng) maxLng = m.lng;
      });

      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const spanDeg = Math.max(Math.abs(maxLat - minLat), Math.abs(maxLng - minLng), 4);
      const targetRange = Math.min(22000000, Math.max(25000, spanDeg * 120000));

      map3DElementRef.current.flyCameraTo({
        endCamera: {
          center: { lat: centerLat, lng: centerLng, altitude: 0 },
          range: targetRange,
          tilt: 50,
          heading: 0
        },
        duration: 2400
      });
      setCameraTilt(50);
      setCameraHeading(0);
      setCameraRange(targetRange);
    } else if (map2DInstanceRef.current && (window as any).google?.maps) {
      const googleMaps = (window as any).google.maps;
      const bounds = new googleMaps.LatLngBounds();
      markers.forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }));
      map2DInstanceRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }
  };

  // Automated Expedition Fly-Through Tour Engine
  const startExpeditionTour = useCallback(() => {
    if (!markers || markers.length === 0) return;
    setIsTourActive(true);
    setIsTourPaused(false);
    setTourProgress(0);
    const target = activeMarker || markers[0];
    flyCameraToSite(target);
  }, [markers, activeMarker, flyCameraToSite]);

  const stopExpeditionTour = useCallback(() => {
    setIsTourActive(false);
    setIsTourPaused(false);
    setTourProgress(0);
  }, []);

  const toggleExpeditionTour = useCallback(() => {
    if (isTourActive) {
      if (isTourPaused) {
        setIsTourPaused(false);
      } else {
        stopExpeditionTour();
      }
    } else {
      startExpeditionTour();
    }
  }, [isTourActive, isTourPaused, stopExpeditionTour, startExpeditionTour]);

  const nextTourStation = useCallback(() => {
    if (!markers || markers.length === 0) return;
    const currentIdx = typeof currentIndex === 'number' && currentIndex >= 0 && currentIndex < markers.length
      ? currentIndex
      : markers.findIndex(m => m.name === activeMarker?.name);
    const nextIdx = (currentIdx + 1) % markers.length;
    const nextSite = markers[nextIdx];
    setActiveSiteInfo(nextSite);
    onMarkerClick(nextSite);
    flyCameraToSite(nextSite);
    setTourProgress(0);
  }, [markers, currentIndex, activeMarker, onMarkerClick, flyCameraToSite]);

  const prevTourStation = useCallback(() => {
    if (!markers || markers.length === 0) return;
    const currentIdx = typeof currentIndex === 'number' && currentIndex >= 0 && currentIndex < markers.length
      ? currentIndex
      : markers.findIndex(m => m.name === activeMarker?.name);
    const prevIdx = (currentIdx - 1 + markers.length) % markers.length;
    const prevSite = markers[prevIdx];
    setActiveSiteInfo(prevSite);
    onMarkerClick(prevSite);
    flyCameraToSite(prevSite);
    setTourProgress(0);
  }, [markers, currentIndex, activeMarker, onMarkerClick, flyCameraToSite]);

  // Automated Tour Interval: 7.5s per locality (throttled to 250ms to minimize virtual DOM re-renders)
  useEffect(() => {
    if (!isTourActive || isTourPaused || markers.length <= 1) return;

    const intervalMs = 250;
    const stepIncrement = (100 / (7500 / intervalMs));

    const timer = setInterval(() => {
      setTourProgress(prev => {
        if (prev + stepIncrement >= 100) {
          nextTourStation();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isTourActive, isTourPaused, markers.length, nextTourStation]);

  // Universal Keyboard Navigation and Exit Handlers (Escape, Arrow keys, O, N, H, T, Space, F, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          return;
        }
        if (isTourActive) {
          stopExpeditionTour();
          return;
        }
        if (isOrbiting) {
          toggleOrbit();
        }
        if (hoveredSiteInfo) {
          setHoveredSiteInfo(null);
        }
        if (isPlottingPanelOpen || localPlottingPanelOpen) {
          if (onTogglePlottingPanel) onTogglePlottingPanel();
          else setLocalPlottingPanelOpen(false);
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        if (isTourActive) {
          e.preventDefault();
          setIsTourPaused(prev => !prev);
        }
      } else if (e.key.toLowerCase() === 't') {
        toggleExpeditionTour();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key === '?') {
        setShowShortcutsModal(prev => !prev);
      } else if (e.key === '1') {
        setViewMode('globe_3d');
      } else if (e.key === '2') {
        setViewMode('satellite');
      } else if (e.key === '3') {
        setViewMode('terrain');
      } else if (e.key === 'ArrowRight' || e.key === ']') {
        if (isTourActive) {
          nextTourStation();
        }
      } else if (e.key === 'ArrowLeft' || e.key === '[') {
        if (isTourActive) {
          prevTourStation();
        }
      } else if (e.key.toLowerCase() === 'o') {
        toggleOrbit();
      } else if (e.key.toLowerCase() === 'n') {
        resetOrientation();
      } else if (e.key.toLowerCase() === 'h') {
        toggleShowInfoOnHover();
      } else if (e.key.toLowerCase() === 'c') {
        autoCenterTaxonSites();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOrbiting, 
    hoveredSiteInfo, 
    isPlottingPanelOpen, 
    localPlottingPanelOpen, 
    onNextSite, 
    onPrevSite, 
    isTourActive, 
    isTourPaused, 
    showShortcutsModal, 
    toggleExpeditionTour, 
    nextTourStation, 
    prevTourStation, 
    stopExpeditionTour, 
    toggleFullscreen,
    currentIndex,
    markers,
    flyCameraToSite
  ]);

  // DRAG HANDLERS: Excavation Site Card
  const handleSiteCardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    const rect = siteCardRef.current?.getBoundingClientRect();
    const parentRect = containerRef.current?.getBoundingClientRect();
    if (!rect || !parentRect) return;

    siteCardDragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left - parentRect.left,
      initialTop: rect.top - parentRect.top,
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setIsDraggingSiteCard(true);
    e.stopPropagation();
  };

  const handleSiteCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!siteCardDragStartRef.current || e.pointerId !== siteCardDragStartRef.current.pointerId || !containerRef.current || !siteCardRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = siteCardRef.current.getBoundingClientRect();

    const deltaX = e.clientX - siteCardDragStartRef.current.startX;
    const deltaY = e.clientY - siteCardDragStartRef.current.startY;

    let nextX = siteCardDragStartRef.current.initialLeft + deltaX;
    let nextY = siteCardDragStartRef.current.initialTop + deltaY;

    const minX = 8;
    const minY = 8;
    const maxX = Math.max(minX, containerRect.width - rect.width - 8);
    const maxY = Math.max(minY, containerRect.height - rect.height - 8);

    nextX = Math.max(minX, Math.min(nextX, maxX));
    nextY = Math.max(minY, Math.min(nextY, maxY));

    setSiteCardPos({ x: nextX, y: nextY });
    e.stopPropagation();
  };

  const handleSiteCardPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (siteCardDragStartRef.current && e.pointerId === siteCardDragStartRef.current.pointerId) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
      siteCardDragStartRef.current = null;
      setIsDraggingSiteCard(false);
      e.stopPropagation();
    }
  };

  // DRAG HANDLERS: Plotting Specialization Panel
  const handlePlottingPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    const rect = plottingPanelRef.current?.getBoundingClientRect();
    const parentRect = containerRef.current?.getBoundingClientRect();
    if (!rect || !parentRect) return;

    plottingDragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left - parentRect.left,
      initialTop: rect.top - parentRect.top,
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setIsDraggingPlotting(true);
    e.stopPropagation();
  };

  const handlePlottingPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!plottingDragStartRef.current || e.pointerId !== plottingDragStartRef.current.pointerId || !containerRef.current || !plottingPanelRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = plottingPanelRef.current.getBoundingClientRect();

    const deltaX = e.clientX - plottingDragStartRef.current.startX;
    const deltaY = e.clientY - plottingDragStartRef.current.startY;

    let nextX = plottingDragStartRef.current.initialLeft + deltaX;
    let nextY = plottingDragStartRef.current.initialTop + deltaY;

    const minX = 8;
    const minY = 8;
    const maxX = Math.max(minX, containerRect.width - rect.width - 8);
    const maxY = Math.max(minY, containerRect.height - rect.height - 8);

    nextX = Math.max(minX, Math.min(nextX, maxX));
    nextY = Math.max(minY, Math.min(nextY, maxY));

    setPlottingPos({ x: nextX, y: nextY });
    e.stopPropagation();
  };

  const handlePlottingPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (plottingDragStartRef.current && e.pointerId === plottingDragStartRef.current.pointerId) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
      plottingDragStartRef.current = null;
      setIsDraggingPlotting(false);
      e.stopPropagation();
    }
  };

  // RESIZE HANDLERS: Plotting Specialization Panel
  const handlePlottingResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const rect = plottingPanelRef.current?.getBoundingClientRect();
    if (!rect) return;

    plottingResizeStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: rect.width,
      initialHeight: rect.height,
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setIsResizingPlotting(true);
    e.stopPropagation();
  };

  const handlePlottingResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!plottingResizeStartRef.current || e.pointerId !== plottingResizeStartRef.current.pointerId) return;
    const deltaX = e.clientX - plottingResizeStartRef.current.startX;
    const deltaY = e.clientY - plottingResizeStartRef.current.startY;

    const nextWidth = Math.max(260, Math.min(600, plottingResizeStartRef.current.initialWidth + deltaX));
    const nextHeight = Math.max(200, Math.min(800, plottingResizeStartRef.current.initialHeight + deltaY));

    setPlottingSize({ width: nextWidth, height: nextHeight });
    e.stopPropagation();
  };

  const handlePlottingResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (plottingResizeStartRef.current && e.pointerId === plottingResizeStartRef.current.pointerId) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
      plottingResizeStartRef.current = null;
      setIsResizingPlotting(false);
      e.stopPropagation();
    }
  };

  // DRAG HANDLERS: Camera HUD
  const handleCameraHudPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    const rect = cameraHudRef.current?.getBoundingClientRect();
    const parentRect = containerRef.current?.getBoundingClientRect();
    if (!rect || !parentRect) return;

    cameraHudDragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left - parentRect.left,
      initialTop: rect.top - parentRect.top,
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setIsDraggingCameraHud(true);
    e.stopPropagation();
  };

  const handleCameraHudPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cameraHudDragStartRef.current || e.pointerId !== cameraHudDragStartRef.current.pointerId || !containerRef.current || !cameraHudRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = cameraHudRef.current.getBoundingClientRect();

    const deltaX = e.clientX - cameraHudDragStartRef.current.startX;
    const deltaY = e.clientY - cameraHudDragStartRef.current.startY;

    let nextX = cameraHudDragStartRef.current.initialLeft + deltaX;
    let nextY = cameraHudDragStartRef.current.initialTop + deltaY;

    const minX = 8;
    const minY = 8;
    const maxX = Math.max(minX, containerRect.width - rect.width - 8);
    const maxY = Math.max(minY, containerRect.height - rect.height - 8);

    nextX = Math.max(minX, Math.min(nextX, maxX));
    nextY = Math.max(minY, Math.min(nextY, maxY));

    setCameraHudPos({ x: nextX, y: nextY });
    e.stopPropagation();
  };

  const handleCameraHudPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cameraHudDragStartRef.current && e.pointerId === cameraHudDragStartRef.current.pointerId) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
      cameraHudDragStartRef.current = null;
      setIsDraggingCameraHud(false);
      e.stopPropagation();
    }
  };

  // DRAG HANDLERS: Trail Legend
  const handleLegendPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    const rect = legendRef.current?.getBoundingClientRect();
    const parentRect = containerRef.current?.getBoundingClientRect();
    if (!rect || !parentRect) return;

    legendDragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left - parentRect.left,
      initialTop: rect.top - parentRect.top,
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setIsDraggingLegend(true);
    e.stopPropagation();
  };

  const handleLegendPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!legendDragStartRef.current || e.pointerId !== legendDragStartRef.current.pointerId || !containerRef.current || !legendRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = legendRef.current.getBoundingClientRect();

    const deltaX = e.clientX - legendDragStartRef.current.startX;
    const deltaY = e.clientY - legendDragStartRef.current.startY;

    let nextX = legendDragStartRef.current.initialLeft + deltaX;
    let nextY = legendDragStartRef.current.initialTop + deltaY;

    const minX = 8;
    const minY = 8;
    const maxX = Math.max(minX, containerRect.width - rect.width - 8);
    const maxY = Math.max(minY, containerRect.height - rect.height - 8);

    nextX = Math.max(minX, Math.min(nextX, maxX));
    nextY = Math.max(minY, Math.min(nextY, maxY));

    setLegendPos({ x: nextX, y: nextY });
    e.stopPropagation();
  };

  const handleLegendPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (legendDragStartRef.current && e.pointerId === legendDragStartRef.current.pointerId) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
      legendDragStartRef.current = null;
      setIsDraggingLegend(false);
      e.stopPropagation();
    }
  };

  // Global window pointer listeners: prevents drag lockup when pointer leaves container or moves rapidly
  useEffect(() => {
    if (!isDraggingSiteCard && !isDraggingPlotting && !isResizingPlotting && !isDraggingCameraHud && !isDraggingLegend) {
      return;
    }

    const handleGlobalPointerMove = (e: PointerEvent) => {
      const syntheticEvent = e as unknown as React.PointerEvent<HTMLDivElement>;
      if (isDraggingSiteCard) {
        handleSiteCardPointerMove(syntheticEvent);
      } else if (isDraggingPlotting) {
        handlePlottingPointerMove(syntheticEvent);
      } else if (isResizingPlotting) {
        handlePlottingResizePointerMove(syntheticEvent);
      } else if (isDraggingCameraHud) {
        handleCameraHudPointerMove(syntheticEvent);
      } else if (isDraggingLegend) {
        handleLegendPointerMove(syntheticEvent);
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      const syntheticEvent = e as unknown as React.PointerEvent<HTMLDivElement>;
      if (isDraggingSiteCard) {
        handleSiteCardPointerUp(syntheticEvent);
      }
      if (isDraggingPlotting) {
        handlePlottingPointerUp(syntheticEvent);
      }
      if (isResizingPlotting) {
        handlePlottingResizePointerUp(syntheticEvent);
      }
      if (isDraggingCameraHud) {
        handleCameraHudPointerUp(syntheticEvent);
      }
      if (isDraggingLegend) {
        handleLegendPointerUp(syntheticEvent);
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [isDraggingSiteCard, isDraggingPlotting, isResizingPlotting, isDraggingCameraHud, isDraggingLegend]);

  // Reset all customized overlay positions & sizes
  const handleResetAllOverlays = () => {
    setSiteCardPos(null);
    setPlottingPos(null);
    setPlottingSize(null);
    setCameraHudPos(null);
    setLegendPos(null);
  };

  const hasAnyCustomLayout = !!(siteCardPos || plottingPos || plottingSize || cameraHudPos || legendPos);

  const isPlottingOpen = isPlottingPanelOpen || localPlottingPanelOpen;
  const togglePlotting = () => {
    if (!layerPlotting) {
      setLayerPlotting(true);
    }
    if (onTogglePlottingPanel) {
      onTogglePlottingPanel();
    } else {
      setLocalPlottingPanelOpen(prev => !prev);
    }
  };

  // Helper for rendering weather icons
  const renderWeatherIcon = (iconType: SitePhenomenaInfo['iconType'], className = "w-3 h-3") => {
    switch (iconType) {
      case 'sun': return <Sun className={className} />;
      case 'wind': return <Wind className={className} />;
      case 'rain': return <CloudRain className={className} />;
      case 'waves': return <Waves className={className} />;
      default: return <Sun className={className} />;
    }
  };

  /* ---------------- VIEWPORT ELEMENT CONTENT RENDERERS ---------------- */

  const renderModeSwitcherContent = (isInsideContainer: boolean) => (
    <div className={`flex flex-wrap items-center gap-1 ${isInsideContainer ? 'bg-transparent p-0' : 'bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl'}`}>
      <div className="flex items-center gap-1.5 px-2 py-1 text-emerald-400 font-mono text-[11px] font-bold">
        <Globe size={15} className="animate-pulse" />
        <span className="tracking-wide uppercase hidden sm:inline">Google Earth</span>
      </div>

      <div className="w-px h-4 bg-slate-700 mx-0.5" />

      {/* 3D Photorealistic Globe Mode */}
      <button
        onClick={() => setViewMode('globe_3d')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-rounded font-bold transition-all cursor-pointer ${
          viewMode === 'globe_3d'
            ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
        title="Google Earth 3D Globe with photorealistic topography, altitude tilt, and 3D terrain"
      >
        <Sparkles size={11} />
        <span>3D Earth</span>
      </button>

      {/* Satellite & Hybrid Mode */}
      <button
        onClick={() => setViewMode('satellite')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-rounded font-bold transition-all cursor-pointer ${
          viewMode === 'satellite'
            ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
        title="Google Earth high-resolution satellite imagery with 45° vector tilt"
      >
        <Eye size={11} />
        <span>Satellite</span>
      </button>

      {/* Topographic Terrain Mode */}
      <button
        onClick={() => setViewMode('terrain')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-rounded font-bold transition-all cursor-pointer ${
          viewMode === 'terrain'
            ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
        title="Physical terrain relief and elevation contour maps"
      >
        <Mountain size={11} />
        <span>Terrain</span>
      </button>

      {/* Plotting Specialization Toggle Button */}
      <button
        onClick={togglePlotting}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-rounded font-bold transition-all cursor-pointer ml-1 ${
          layerPlotting
            ? isPlottingOpen
              ? 'bg-purple-600 text-white font-extrabold shadow-md'
              : 'bg-slate-800 text-purple-300 hover:bg-slate-750 border border-purple-500/40'
            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
        }`}
        title="Toggle cartographic plotting specialization layer (buffers, azimuth lines, migration corridors, density contours)"
      >
        <SlidersHorizontal size={11} className={layerPlotting && isPlottingOpen ? 'text-white' : 'text-purple-400'} />
        <span>Plotting: {layerPlotting ? plottingConfig.mode.toUpperCase() : 'OFF'}</span>
      </button>

      {/* Switch back to Paleo Continental Atlas */}
      {onSwitchToPaleoMap && (
        <button
          onClick={onSwitchToPaleoMap}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-rounded font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-950/60 border border-amber-500/40 transition-all cursor-pointer ml-1"
          title="Return to Mesozoic Paleocontinental Atlas"
        >
          <Layers2 size={12} />
          <span>Paleo Atlas</span>
        </button>
      )}

      {/* Automated Expedition Tour Button */}
      <button
        onClick={toggleExpeditionTour}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] font-rounded font-bold transition-all cursor-pointer ml-1 ${
          isTourActive
            ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-lg animate-pulse'
            : 'bg-slate-800 text-emerald-300 hover:bg-slate-750 border border-emerald-500/40'
        }`}
        title="Automated 3D Expedition Fly-Through Tour across all excavation localities (Hotkey: T or Space)"
      >
        <Play size={11} className={isTourActive ? 'fill-current' : ''} />
        <span>{isTourActive ? (isTourPaused ? 'Tour: Paused' : 'Tour: Active') : 'Expedition Tour'}</span>
      </button>

      {/* Keyboard Shortcuts Trigger */}
      <button
        onClick={() => setShowShortcutsModal(true)}
        className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-mono text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer ml-1"
        title="View Observatory Keyboard Shortcuts [?]"
      >
        <Keyboard size={11} />
        <span className="hidden lg:inline">Shortcuts</span>
      </button>

      {/* Audio Chime Toggle */}
      <button
        onClick={toggleAudio}
        className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-mono border transition-all cursor-pointer ml-1 ${
          isAudioEnabled
            ? 'bg-sky-950/80 text-sky-300 border-sky-500/50'
            : 'text-slate-400 hover:text-slate-200 border-slate-700/60'
        }`}
        title={isAudioEnabled ? "Locality arrival audio chimes enabled (Click to mute)" : "Locality arrival audio chimes muted (Click to enable)"}
      >
        {isAudioEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
      </button>

      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-mono text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer ml-1"
        title="Toggle Fullscreen Observatory [F]"
      >
        {isFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
      </button>

      {/* Reset All Moved Overlays Layouts Button */}
      {hasAnyCustomLayout && (
        <button
          onClick={handleResetAllOverlays}
          className="flex items-center gap-1 px-2 py-1 rounded-xl text-[9px] font-mono font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 transition-all cursor-pointer ml-1"
          title="Reset all dragged and resized overlays back to their default anchor positions"
        >
          <RotateCcw size={10} />
          <span>Reset Layouts</span>
        </button>
      )}

      {/* Dock Back button when extracted on map */}
      {!isInsideContainer && (
        <button
          onClick={() => handleDockIn('mode_switcher')}
          className="flex items-center gap-1 px-2 py-1 rounded-xl text-[9.5px] font-mono font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 transition-all cursor-pointer ml-1"
          title="Put Mode Switcher back into Viewport Elements Deck"
        >
          <ArrowDownToLine size={10} />
          <span>Dock</span>
        </button>
      )}
    </div>
  );

  const renderPinBannerContent = (isInsideContainer: boolean) => {
    if (!activeSiteInfo) return null;
    return (
      <div className={`flex items-center gap-2 ${isInsideContainer ? 'bg-transparent p-0' : 'bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-2xl border border-emerald-500/60 shadow-xl'} text-white pointer-events-auto`}>
        <div className="relative flex items-center justify-center shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 relative" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-rounded font-extrabold truncate">
          <span className="text-emerald-400 font-mono text-[9.5px] tracking-wider uppercase font-bold">
            PIN {markers.length > 0 ? currentIndex + 1 : 0}/{markers.length}:
          </span>
          <span 
            className="text-white hover:text-emerald-300 transition-colors cursor-pointer truncate max-w-[200px] sm:max-w-xs"
            onClick={() => flyCameraToSite(activeSiteInfo)}
            title="Click to center map camera on this pin"
          >
            {activeSiteInfo.name}
          </span>
        </div>
        <div className="text-[9.5px] font-mono text-emerald-300/80 pl-1.5 border-l border-slate-700/80 hidden md:block shrink-0">
          {activeSiteInfo.lat.toFixed(2)}°N, {Math.abs(activeSiteInfo.lng).toFixed(2)}°W
        </div>
        {/* Quick Site Steppers */}
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
              title="Move map pin to previous site ([ or ←)"
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
              title="Move map pin to next site (] or →)"
            >
              <ChevronRight size={11} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              flyCameraToSite(activeSiteInfo);
            }}
            className="px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/40 cursor-pointer transition-all flex items-center gap-1 shrink-0"
            title="Re-center view onto active pin"
          >
            <Crosshair size={10} />
            <span>Center Pin</span>
          </button>
        </div>

        {!isInsideContainer && (
          <button
            onClick={() => handleDockIn('pin_banner')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/40 cursor-pointer ml-1"
            title="Put Pin Tracker back into container"
          >
            <ArrowDownToLine size={10} />
            <span>Dock</span>
          </button>
        )}
      </div>
    );
  };

  const renderPlottingRibbonContent = (isInsideContainer: boolean) => {
    return (
      <div className={`flex flex-wrap items-center gap-1 ${isInsideContainer ? 'bg-transparent p-0' : 'bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-xl border border-purple-500/40 shadow-xl'} max-w-full overflow-x-auto text-[10px]`}>
        <div className="flex items-center gap-1 text-[9.5px] font-mono text-purple-300 font-bold pr-1.5 border-r border-slate-700/80">
          <SlidersHorizontal size={11} className="text-purple-400" />
          <span className="hidden sm:inline">PLOTTING:</span>
        </div>

        {/* Buffers Mode */}
        <button
          onClick={() => onChangePlottingConfig?.({ mode: 'trails' })}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono font-medium transition-all cursor-pointer ${
            plottingConfig.mode === 'trails'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Locality Buffer Radii & Osteology Recovery Filter"
        >
          <Layers size={10} />
          <span>Buffers ({plottingConfig.bufferRadiusKm}km)</span>
        </button>

        {/* Azimuths Mode */}
        <button
          onClick={() => onChangePlottingConfig?.({ mode: 'cardinal' })}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono font-medium transition-all cursor-pointer ${
            plottingConfig.mode === 'cardinal'
              ? 'bg-teal-500 text-slate-950 font-bold shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Radial Compass Azimuths & Bearings to Neighbor Sites"
        >
          <Compass size={10} />
          <span>Azimuths ({plottingConfig.maxNeighbourRadiusKm ? `≤${plottingConfig.maxNeighbourRadiusKm}km` : 'All'})</span>
        </button>

        {/* Migration Mode */}
        <button
          onClick={() => onChangePlottingConfig?.({ mode: 'migration' })}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono font-medium transition-all cursor-pointer ${
            plottingConfig.mode === 'migration'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Migration Flow Corridor Ribbon & Flank Bounds"
        >
          <Navigation size={10} />
          <span>Migration ({plottingConfig.corridorWidthKm}km)</span>
        </button>

        {/* Hypsometry Mode */}
        <button
          onClick={() => onChangePlottingConfig?.({ mode: 'hypsometry' })}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono font-medium transition-all cursor-pointer ${
            plottingConfig.mode === 'hypsometry'
              ? 'bg-sky-500 text-slate-950 font-bold shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Paleo-Elevation Topographic Contours"
        >
          <Mountain size={10} />
          <span>Contours (Δz {plottingConfig.contourIntervalM}m)</span>
        </button>

        {/* Locomotion Mode */}
        <button
          onClick={() => onChangePlottingConfig?.({ mode: 'locomotion' })}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono font-medium transition-all cursor-pointer ${
            plottingConfig.mode === 'locomotion'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Biomechanical Trackways & Locomotion Gait Kinematics"
        >
          <Footprints size={10} />
          <span>Trackways ({plottingConfig.strideLengthM}m)</span>
        </button>

        {/* Density Mode */}
        <button
          onClick={() => onChangePlottingConfig?.({ mode: 'density' })}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono font-medium transition-all cursor-pointer ${
            plottingConfig.mode === 'density'
              ? 'bg-purple-600 text-white font-bold shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Spatial Kernel Density Estimation Quantiles"
        >
          <Activity size={10} />
          <span>Density ({plottingConfig.kernelBandwidthKm}km)</span>
        </button>

        <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

        {/* Open Tuning Panel Button */}
        <button
          onClick={togglePlotting}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono transition-all cursor-pointer ${
            isPlottingOpen
              ? 'bg-purple-600 text-white font-bold'
              : 'text-purple-300 hover:text-white hover:bg-purple-950/60'
          }`}
          title="Open Draggable Fine-Tuning Sliders Panel"
        >
          <SlidersHorizontal size={10} />
          <span>Tune</span>
        </button>

        {!isInsideContainer && (
          <button
            onClick={() => handleDockIn('plotting_ribbon')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-mono text-[9px] font-bold border border-purple-500/40 cursor-pointer ml-1"
            title="Put Plotting Ribbon back into container"
          >
            <ArrowDownToLine size={10} />
            <span>Dock</span>
          </button>
        )}
      </div>
    );
  };

  const renderCameraNavContent = (isInsideContainer: boolean) => (
    <div className="space-y-2">
      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-1">
        {/* 3D Orbit Site Toggle */}
        <button
          onClick={toggleOrbit}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-rounded font-bold transition-all cursor-pointer ${
            isOrbiting
              ? 'bg-amber-500 text-slate-950 animate-pulse font-extrabold shadow-md'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
          }`}
          title={isOrbiting ? "Stop 360° terrain orbit (or press O / Esc)" : "Start continuous 360° orbit around fossil excavation site (O)"}
        >
          <RotateCw size={11} className={isOrbiting ? 'animate-spin' : ''} />
          <span>{isOrbiting ? 'Orbiting...' : 'Orbit (O)'}</span>
        </button>

        {/* Center Taxon Localities Focus Button */}
        <button
          onClick={autoCenterTaxonSites}
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-rounded font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer shadow-sm"
          title="Auto-frame camera to encompass all fossil discovery sites for this taxon"
        >
          <Crosshair size={11} className="text-emerald-400" />
          <span>Frame All</span>
        </button>

        {/* Focus Active Excavation Site Button */}
        {activeMarker && (
          <button
            onClick={() => flyCameraToSite(activeMarker)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-rounded font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer shadow-sm"
            title="Recenter camera on active excavation site marker pin"
          >
            <MapPin size={11} className="text-amber-400" />
            <span>Focus Pin</span>
          </button>
        )}

        {/* Reset to True North Compass Button */}
        <button
          onClick={resetOrientation}
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-rounded font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 hover:border-sky-500/60 transition-all cursor-pointer shadow-sm"
          title="Reset orientation to True North (Heading: 0°, 2D Plan View)"
        >
          <Compass 
            size={12} 
            className="transition-transform duration-300"
            style={{ transform: `rotate(${-cameraHeading}deg)` }}
          />
          <span>North</span>
        </button>

        {/* Directional 4-Way Camera Pan Cross */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 gap-0.5">
          <button
            onClick={() => handlePanDirection('west')}
            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all cursor-pointer"
            title="Pan camera West (-Lng)"
          >
            <ArrowLeft size={11} />
          </button>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => handlePanDirection('north')}
              className="w-6 h-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all cursor-pointer"
              title="Pan camera North (+Lat)"
            >
              <ArrowUp size={9} />
            </button>
            <button
              onClick={() => handlePanDirection('south')}
              className="w-6 h-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all cursor-pointer"
              title="Pan camera South (-Lat)"
            >
              <ArrowDown size={9} />
            </button>
          </div>
          <button
            onClick={() => handlePanDirection('east')}
            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all cursor-pointer"
            title="Pan camera East (+Lng)"
          >
            <ArrowRight size={11} />
          </button>
        </div>

        {/* Altitude Zoom In / Out */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => adjustRange(0.6)}
            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all cursor-pointer"
            title="Zoom closer to ground (reduce altitude)"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={() => adjustRange(1.6)}
            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all cursor-pointer"
            title="Zoom further out into atmosphere (increase altitude)"
          >
            <ZoomOut size={12} />
          </button>
        </div>

        {/* 3D Horizon Tilt / 2D Top-down Tilt */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => adjustTilt(10)}
            className="px-1.5 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-[9px] font-mono font-bold transition-all cursor-pointer"
            title="Tilt camera towards horizon (3D perspective)"
          >
            3D▲
          </button>
          <button
            onClick={() => adjustTilt(-10)}
            className="px-1.5 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-[9px] font-mono font-bold transition-all cursor-pointer"
            title="Tilt camera towards vertical top-down (2D plan view)"
          >
            2D▼
          </button>
        </div>

        {/* Planetary Full Extents */}
        <button
          onClick={fitGlobalEarth}
          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all cursor-pointer"
          title="Fit Planetary Global Extents"
        >
          <Maximize2 size={11} />
        </button>
      </div>

      {/* Metrics Readout */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/80 px-1">
        <span>Tilt: <strong className="text-white">{cameraTilt}°</strong></span>
        <span>Heading: <strong className="text-white">{cameraHeading}°</strong></span>
        <span>Altitude: <strong className="text-sky-300">{(cameraRange / 1000).toFixed(1)} km</strong></span>
      </div>
    </div>
  );

  const renderLayerTogglesContent = (isInsideContainer: boolean) => (
    <div className="space-y-2">
      {/* Layer Toggle Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[9.5px] font-rounded font-bold">
        {/* Fossil Sites Toggle */}
        <button
          onClick={() => setLayerFossilPins(!layerFossilPins)}
          className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
            layerFossilPins 
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' 
              : 'bg-slate-800 text-slate-400 border-slate-700 opacity-60'
          }`}
          title="Toggle Fossil Excavation Site Pins"
        >
          <span>🦴 Pins ({markers.length})</span>
        </button>

        {/* Expedition Trails Toggle */}
        <button
          onClick={() => setLayerExpeditionTrails(!layerExpeditionTrails)}
          className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
            layerExpeditionTrails 
              ? 'bg-sky-950/80 text-sky-300 border-sky-500/50' 
              : 'bg-slate-800 text-slate-400 border-slate-700 opacity-60'
          }`}
          title="Toggle Geodesic Expedition Trails"
        >
          <span>🌐 Trails</span>
        </button>

        {/* Cartographic Plotting Toggle */}
        <button
          onClick={() => setLayerPlotting(!layerPlotting)}
          className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
            layerPlotting 
              ? 'bg-purple-950/80 text-purple-300 border-purple-500/50' 
              : 'bg-slate-800 text-slate-400 border-slate-700 opacity-60'
          }`}
          title="Toggle Plotting Specialization Layer"
        >
          <span>📊 Plotting</span>
        </button>

        {/* Pin Hover Cards Toggle */}
        <button
          onClick={toggleShowInfoOnHover}
          className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
            showInfoOnHover 
              ? 'bg-teal-950/80 text-teal-300 border-teal-500/50' 
              : 'bg-slate-800 text-slate-400 border-slate-700 opacity-60'
          }`}
          title={showInfoOnHover ? "Disable pin hover cards" : "Enable pin hover cards"}
        >
          <span>{showInfoOnHover ? '👁 Hover ON' : '👁 Hover OFF'}</span>
        </button>
      </div>

      {/* Locality Roster List */}
      <div className="pt-1 border-t border-slate-800/80 space-y-1.5">
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
          <span className="font-bold uppercase text-slate-300">Localities ({processedMarkers.length})</span>
          <div className="flex items-center gap-1">
            {localitySearchQuery && (
              <button
                onClick={() => setLocalitySearchQuery('')}
                className="text-[8px] text-rose-400 hover:text-rose-300"
              >
                Clear
              </button>
            )}
            <select
              value={localitySortMode}
              onChange={(e) => setLocalitySortMode(e.target.value as any)}
              className="bg-slate-800 text-slate-300 rounded px-1 py-0.5 text-[8.5px] border border-slate-700 focus:outline-none"
            >
              <option value="default">Default Order</option>
              <option value="name">Name (A-Z)</option>
              <option value="distance">Distance from Pin</option>
            </select>
          </div>
        </div>

        {/* Search Filter Input */}
        <div className="relative">
          <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={localitySearchQuery}
            onChange={(e) => setLocalitySearchQuery(e.target.value)}
            placeholder="Search formation or region..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-6 pr-2 py-1 text-[9.5px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-sans"
          />
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
          {processedMarkers.length === 0 ? (
            <div className="p-2 text-center text-[8.5px] text-slate-500 font-mono">
              No matching localities found
            </div>
          ) : (
            processedMarkers.map(({ site, originalIdx }) => {
              const isCur = Boolean(
                (activeMarker && site.name === activeMarker.name) ||
                (activeMarker && site.id && activeMarker.id && site.id === activeMarker.id) ||
                (activeSiteInfo && (site.name === activeSiteInfo.name || (site.id && site.id === activeSiteInfo.id))) ||
                (activeMarker && Math.abs(site.lat - activeMarker.lat) < 0.001 && Math.abs(site.lng - activeMarker.lng) < 0.001)
              );
              const rel = activeMarker && !isCur ? computeRelativeLocation(activeMarker, site) : null;
              
              const cleanName = site.name;
              const match = cleanName.match(/^([^,(]+)(?:[,(]\s*([^)]*)\)?)?/);
              const formationName = match ? match[1].trim() : cleanName;
              const regionName = match && match[2] ? match[2].trim() : '';

              return (
                <div
                  key={site.id || site.name}
                  onClick={() => {
                    setActiveSiteInfo(site);
                    setIsSiteCardCollapsed(false);
                    update3DActiveMarkerPin(site);
                    update2DActiveMarkerPin(site);
                    onMarkerClick(site);
                    flyCameraToSite(site);
                  }}
                  title={`Click to focus camera and inspect ${site.name}`}
                  className={`group p-1.5 rounded-lg cursor-pointer transition-all flex items-center justify-between text-[9px] ${
                    isCur 
                      ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/70 font-bold shadow-sm' 
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-transparent hover:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isCur ? 'bg-emerald-400 ring-2 ring-emerald-400/50 animate-pulse' : 'bg-slate-500 group-hover:bg-slate-300'}`} />
                    <div className="flex items-baseline gap-1 min-w-0 truncate">
                      <span className="truncate font-semibold text-[9.5px] text-white group-hover:text-emerald-300 transition-colors">
                        {formationName}
                      </span>
                      {regionName && (
                        <span className="text-[8px] text-slate-400 font-mono shrink-0">
                          ({regionName})
                        </span>
                      )}
                    </div>
                  </div>
                  {isCur ? (
                    <span className="font-mono text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span>Active</span>
                    </span>
                  ) : rel ? (
                    <span className="font-mono text-[8px] text-teal-300 shrink-0 flex items-center gap-1 bg-slate-900/70 px-1.5 py-0.5 rounded border border-slate-700/60">
                      <Navigation size={8} style={{ transform: `rotate(${rel.azimuthDeg}deg)` }} className="text-teal-400 shrink-0" />
                      <span>{rel.cardinal}</span>
                      <span>{Math.round(rel.distanceKm)}km</span>
                    </span>
                  ) : (
                    <span className="text-[7.5px] font-mono text-slate-500">#{originalIdx + 1}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const renderLocalityCardContent = (isInsideContainer: boolean) => {
    if (!activeSiteInfo) {
      return (
        <div className="p-4 text-center text-slate-400 text-xs font-mono">
          No excavation site selected. Click any pin or list item to inspect.
        </div>
      );
    }
    return (
      <div className="space-y-2.5">
        {/* Locality Header */}
        <div className="flex items-start justify-between gap-2">
          <div 
            className="space-y-0.5 min-w-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              flyCameraToSite(activeSiteInfo);
            }}
            title="Click to center camera on this excavation site"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-wider uppercase block truncate">
                Locality {markers.length > 0 ? currentIndex + 1 : 0} of {markers.length}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-white leading-tight font-rounded truncate hover:text-emerald-300 transition-colors">
              {activeSiteInfo.name}
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onPrevSite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (markers.length <= 1) return;
                  onPrevSite();
                }}
                disabled={markers.length <= 1}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 active:scale-95 shadow-sm"
                title="Previous fossil locality ([ or ←)"
              >
                <ChevronLeft size={13} />
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
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 active:scale-95 shadow-sm"
                title="Next fossil locality (] or →)"
              >
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Coordinates & Taxon Discovered */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              flyCameraToSite(activeSiteInfo);
              onMarkerClick(activeSiteInfo);
            }}
            className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 cursor-pointer hover:border-emerald-500/60 hover:bg-slate-900 transition-all group"
            title="Click to focus map pin on these excavation coordinates"
          >
            <span className="text-slate-500 text-[8px] uppercase block font-bold group-hover:text-emerald-400 transition-colors">Coordinates 📍</span>
            <span className="text-sky-300 font-semibold truncate block group-hover:text-emerald-300">
              {Math.abs(activeSiteInfo.lat).toFixed(2)}°{activeSiteInfo.lat >= 0 ? 'N' : 'S'}, {Math.abs(activeSiteInfo.lng).toFixed(2)}°{activeSiteInfo.lng >= 0 ? 'E' : 'W'}
            </span>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              flyCameraToSite(activeSiteInfo);
              onMarkerClick(activeSiteInfo);
            }}
            className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 cursor-pointer hover:border-amber-500/60 hover:bg-slate-900 transition-all group"
            title="Click to focus map pin on this taxon discovery"
          >
            <span className="text-slate-500 text-[8px] uppercase block font-bold group-hover:text-amber-400 transition-colors">Taxon Specimen</span>
            <span className="text-amber-300 font-bold truncate block">
              {activeTaxaName}
            </span>
          </div>
        </div>

        {/* Geological Stratum & Osteology */}
        {paleoData?.geologicalContext && (
          <div className="space-y-1.5 pt-0.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[9.5px]">
              <span className="text-slate-400 font-rounded truncate max-w-[180px]">
                {paleoData.geologicalContext.period} • {paleoData.geologicalContext.age}
              </span>
              <span className="text-emerald-400 font-medium font-mono text-[9px]">
                {paleoData.metadata?.osteologicalCompleteness}% Complete
              </span>
            </div>
            {paleoData.metadata?.osteologicalCompleteness && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${paleoData.metadata.osteologicalCompleteness}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Quick Dossier Tab Jumper Buttons */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            onClick={() => {
              onMarkerClick(activeSiteInfo);
              flyCameraToSite(activeSiteInfo);
              onSelectTab?.('overview');
            }}
            className="flex-1 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-rounded font-extrabold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md active:scale-95"
            title="Open field dossier for this excavation site"
          >
            <span>Field Dossier</span>
            <ChevronRight size={11} strokeWidth={3} />
          </button>
          {markers.length > 1 && onSelectTab && (
            <button
              onClick={() => {
                onMarkerClick(activeSiteInfo);
                flyCameraToSite(activeSiteInfo);
                onSelectTab('cardinal');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-teal-900 hover:bg-teal-800 text-teal-200 border border-teal-600/40 text-[10px] font-rounded font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Open Cardinal Direction & Geodesic Azimuth Radar"
            >
              <Compass size={11} />
              <span>Radar</span>
            </button>
          )}
          {onSelectTab && (
            <button
              onClick={() => {
                onMarkerClick(activeSiteInfo);
                flyCameraToSite(activeSiteInfo);
                onSelectTab('elevation');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-rounded font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Open Hypsometric Elevation Profile"
            >
              <Mountain size={11} />
              <span>Elevation</span>
            </button>
          )}
        </div>
      </div>
    );
  };

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
    <div className="w-full h-full relative overflow-hidden bg-slate-950 font-sans select-none">
      {/* Target DOM Element for Google Earth 3D / Maps Vector */}
      <div 
        ref={containerRef} 
        id="google-earth-container" 
        className="w-full h-full relative z-0" 
      />

      {/* Loading state indicator */}
      {!isApiLoaded && !loadError && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30 text-white">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          <div className="text-center space-y-1">
            <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider uppercase block">
              Initializing Google Earth 3D API
            </span>
            <span className="text-[11px] text-slate-400 font-rounded">
              Streaming Photorealistic 3D Globe, Terrain Elevations & Geological Formations
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-30">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-3">
            <X size={24} />
          </div>
          <span className="text-sm font-bold text-white mb-1 font-mono">Google Earth API Notice</span>
          <p className="text-xs text-slate-400 max-w-md mb-4">{loadError}</p>
          {onSwitchToPaleoMap && (
            <button
              onClick={onSwitchToPaleoMap}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-rounded font-bold text-xs transition-colors cursor-pointer"
            >
              Switch to Paleo Continental Atlas
            </button>
          )}
        </div>
      )}

      {/* TOP-LEFT HEADER BAR: Mode Switcher & Non-interfering Main Controls */}
      {(!dockedState.mode_switcher || (!dockedState.pin_banner && activeSiteInfo) || (!dockedState.plotting_ribbon && layerPlotting)) && (
        <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-1.5 pointer-events-auto max-w-[calc(100vw-2rem)]">
          {!dockedState.mode_switcher && renderModeSwitcherContent(false)}
          {!dockedState.pin_banner && activeSiteInfo && renderPinBannerContent(false)}
          {!dockedState.plotting_ribbon && layerPlotting && renderPlottingRibbonContent(false)}
        </div>
      )}

      {/* MINIMALIST CAMERA & DIRECTION HUD (DRAGGABLE & COLLAPSIBLE) */}
      {!dockedState.camera_nav && (
        <div 
          ref={cameraHudRef}
          style={cameraHudPos ? { left: `${cameraHudPos.x}px`, top: `${cameraHudPos.y}px`, right: 'auto', bottom: 'auto' } : undefined}
          className={`absolute z-20 flex flex-col items-end gap-1.5 transition-shadow ${
            cameraHudPos ? '' : 'top-4 right-4'
          }`}
        >
          <div className="bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col gap-1.5">
            {/* Drag Handle & Collapser */}
            <div 
              onPointerDown={handleCameraHudPointerDown}
              onPointerMove={handleCameraHudPointerMove}
              onPointerUp={handleCameraHudPointerUp}
              onPointerCancel={handleCameraHudPointerUp}
              onDoubleClick={() => setCameraHudPos(null)}
              className={`flex items-center justify-between px-1.5 py-0.5 rounded-lg border-b border-slate-800 text-slate-400 touch-none select-none transition-colors ${
                isDraggingCameraHud ? 'cursor-grabbing bg-emerald-950/60 text-emerald-300' : 'cursor-grab hover:bg-slate-800'
              }`}
              title="Drag to move Camera HUD anywhere • Double-click to reset"
            >
              <div className="flex items-center gap-1 text-[9.5px] font-mono font-bold">
                <GripVertical size={11} />
                <Compass size={11} className="text-sky-400" />
                <span>Camera & Nav</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDockIn('camera_nav')}
                  className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[8.5px] font-bold border border-emerald-500/40 flex items-center gap-1 cursor-pointer transition-all"
                  title="Put Camera & Nav HUD back into Viewport Elements Deck"
                >
                  <ArrowDownToLine size={9} />
                  <span>Dock</span>
                </button>
                {cameraHudPos && (
                  <button
                    onClick={() => setCameraHudPos(null)}
                    className="p-0.5 text-[8px] text-slate-400 hover:text-white"
                    title="Reset HUD Position"
                  >
                    <RotateCcw size={9} />
                  </button>
                )}
                <button
                  onClick={() => setIsCameraHudCollapsed(!isCameraHudCollapsed)}
                  className="p-0.5 text-slate-400 hover:text-white"
                  title={isCameraHudCollapsed ? "Expand Camera HUD" : "Collapse Camera HUD"}
                >
                  {isCameraHudCollapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                </button>
              </div>
            </div>

            {!isCameraHudCollapsed && renderCameraNavContent(false)}
          </div>
        </div>
      )}

      {/* FLOATING TRAIL & LAYERS LEGEND (DRAGGABLE & COLLAPSIBLE) */}
      {!dockedState.layer_toggles && (
        <div
          ref={legendRef}
          style={legendPos ? { left: `${legendPos.x}px`, top: `${legendPos.y}px`, right: 'auto', bottom: 'auto' } : undefined}
          className={`absolute z-20 flex flex-col transition-shadow ${
            legendPos ? '' : 'top-16 right-4'
          }`}
        >
          <div className="bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-700/80 shadow-2xl w-64 space-y-2">
            {/* Legend Header & Drag Bar */}
            <div
              onPointerDown={handleLegendPointerDown}
              onPointerMove={handleLegendPointerMove}
              onPointerUp={handleLegendPointerUp}
              onPointerCancel={handleLegendPointerUp}
              onDoubleClick={() => setLegendPos(null)}
              className={`flex items-center justify-between p-1 rounded-lg border-b border-slate-800 text-slate-400 touch-none select-none transition-colors ${
                isDraggingLegend ? 'cursor-grabbing bg-emerald-950/60 text-emerald-300' : 'cursor-grab hover:bg-slate-800'
              }`}
              title="Drag Trail Legend anywhere on screen • Double-click to reset"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-white">
                <GripVertical size={11} className="text-slate-400" />
                <Layers size={11} className="text-emerald-400" />
                <span>Trail & Layer Toggles</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDockIn('layer_toggles')}
                  className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[8.5px] font-bold border border-emerald-500/40 flex items-center gap-1 cursor-pointer transition-all"
                  title="Put Trail & Layer Toggles back into Viewport Elements Deck"
                >
                  <ArrowDownToLine size={9} />
                  <span>Dock</span>
                </button>
                {legendPos && (
                  <button
                    onClick={() => setLegendPos(null)}
                    className="p-0.5 text-[8px] text-slate-400 hover:text-white"
                    title="Reset Legend position"
                  >
                    <RotateCcw size={9} />
                  </button>
                )}
                <button
                  onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                  className="p-0.5 text-slate-400 hover:text-white"
                  title={isLegendExpanded ? "Collapse layers" : "Expand layers"}
                >
                  {isLegendExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            </div>

            {renderLayerTogglesContent(false)}
          </div>
        </div>
      )}

      {/* FLOATING PLOTTING SPECIALIZATION CONFIGURATION MODAL / PANEL (DRAGGABLE & RESIZABLE) */}
      {!dockedState.plotting_ribbon && isPlottingOpen && (
        <div 
          ref={plottingPanelRef}
          style={{
            ...(plottingPos ? {
              left: `${plottingPos.x}px`,
              top: `${plottingPos.y}px`,
              right: 'auto',
              bottom: 'auto'
            } : {}),
            ...(plottingSize ? {
              width: `${plottingSize.width}px`,
              height: `${plottingSize.height}px`,
            } : {})
          }}
          className={`absolute z-30 flex flex-col bg-slate-900/95 backdrop-blur-md border border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden transition-shadow ${
            plottingPos ? '' : 'top-16 left-4'
          } ${plottingSize ? '' : 'w-80 max-h-[80vh]'} ${
            isDraggingPlotting ? 'cursor-grabbing ring-2 ring-purple-400/50' : ''
          }`}
        >
          {/* Header & Drag Bar */}
          <div 
            onPointerDown={handlePlottingPointerDown}
            onPointerMove={handlePlottingPointerMove}
            onPointerUp={handlePlottingPointerUp}
            onPointerCancel={handlePlottingPointerUp}
            onDoubleClick={() => {
              setPlottingPos(null);
              setPlottingSize(null);
            }}
            className={`p-3 bg-purple-950/70 border-b border-purple-500/40 flex items-center justify-between touch-none select-none transition-colors ${
              isDraggingPlotting ? 'cursor-grabbing bg-purple-900/80' : 'cursor-grab hover:bg-purple-900/50'
            }`}
            title="Drag Plotting Panel anywhere on screen • Double-click to reset"
          >
            <div className="flex items-center gap-1.5">
              <GripVertical size={13} className="text-purple-300" />
              <SlidersHorizontal size={14} className="text-purple-400" />
              <span className="text-xs font-rounded font-extrabold text-white">
                Plotting Specialization Layer
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDockIn('plotting_panel')}
                className="px-1.5 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 font-mono text-[8.5px] font-bold border border-purple-500/40 flex items-center gap-1 cursor-pointer transition-all"
                title="Put Plotting Panel back into Viewport Elements Deck"
              >
                <ArrowDownToLine size={9} />
                <span>Dock</span>
              </button>
              {(plottingPos || plottingSize) && (
                <button
                  onClick={() => {
                    setPlottingPos(null);
                    setPlottingSize(null);
                  }}
                  className="p-1 rounded text-purple-300 hover:text-white hover:bg-purple-900/60 cursor-pointer"
                  title="Reset panel position & size"
                >
                  <RotateCcw size={10} />
                </button>
              )}
              <button
                onClick={() => setIsPlottingMinimized(!isPlottingMinimized)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title={isPlottingMinimized ? "Expand Plotting Panel" : "Minimize Plotting Panel"}
              >
                {isPlottingMinimized ? <Maximize2 size={11} /> : <ChevronDown size={12} />}
              </button>
              <button
                onClick={togglePlotting}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                title="Close Plotting Panel"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isPlottingMinimized && (
            <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
              <PlottingSpecializationLayer
                config={plottingConfig}
                onChangeConfig={(newCfg) => onChangePlottingConfig?.(newCfg)}
                isPanelOpen={true}
                onTogglePanel={togglePlotting}
                markersCount={markers.length}
              />
            </div>
          )}

          {/* Corner Resize Grip */}
          <div
            onPointerDown={handlePlottingResizePointerDown}
            onPointerMove={handlePlottingResizePointerMove}
            onPointerUp={handlePlottingResizePointerUp}
            onPointerCancel={handlePlottingResizePointerUp}
            className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize text-purple-400 hover:text-white flex items-center justify-center select-none touch-none z-20"
            title="Drag to resize Plotting Panel"
          >
            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-current opacity-70">
              <circle cx="10" cy="10" r="1.2" />
              <circle cx="6" cy="10" r="1.2" />
              <circle cx="10" cy="6" r="1.2" />
            </svg>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE FLOATING "ALL SPECS" PIN HOVER TOOLTIP */}
      {hoveredSiteInfo && showInfoOnHover && (() => {
        const details = getSitePhenomenaDetails(hoveredSiteInfo.site, hoveredSiteInfo.index, activeTaxaName, paleoData);
        const rel = activeMarker && hoveredSiteInfo.site.id !== activeMarker.id
          ? computeRelativeLocation(activeMarker, hoveredSiteInfo.site)
          : null;

        return (
          <div
            style={{
              left: `${Math.min(window.innerWidth - 320, Math.max(16, hoveredSiteInfo.clientX + 16))}px`,
              top: `${Math.min(window.innerHeight - 360, Math.max(16, hoveredSiteInfo.clientY - 40))}px`
            }}
            className="fixed z-40 w-72 bg-slate-900/98 backdrop-blur-md border border-slate-700/90 rounded-2xl p-3 shadow-2xl pointer-events-auto space-y-2 animate-in"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-1 pb-1 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[8.5px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Site #{hoveredSiteInfo.index + 1} • {activeTaxaName}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white font-rounded truncate max-w-[180px]">
                  {hoveredSiteInfo.site.name}
                </h4>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleHoverDetailMode}
                  className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-800 text-slate-300 hover:text-white"
                  title="Toggle Compact/Full mode"
                >
                  {hoverDetailMode === 'full' ? 'Compact' : 'Full'}
                </button>
                <button
                  onClick={() => setHoveredSiteInfo(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X size={11} />
                </button>
              </div>
            </div>

            {/* Content Mode */}
            {hoverDetailMode === 'compact' ? (
              <div className="space-y-1 text-[9px] font-rounded">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-amber-400 flex items-center gap-1 font-bold">
                    {renderWeatherIcon(details.iconType)}
                    <span>{details.weatherType}</span>
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{details.stratigraphicAge}</span>
                </div>
                <div className="flex items-center justify-between text-[8px] text-slate-400">
                  <span className="truncate">{details.formationName}</span>
                  <span className="font-mono text-emerald-400">{details.osteologyRecoveryPct}% Complete</span>
                </div>
                {rel && (
                  <div className="bg-teal-950/60 px-2 py-1 rounded border border-teal-800/60 flex items-center justify-between font-mono text-[8px] text-teal-300">
                    <span>Bearing from Active Site:</span>
                    <span>{rel.cardinal} ({Math.round(rel.azimuthDeg)}°) • {Math.round(rel.distanceKm)}km</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-[9px]">
                {/* Stratigraphic Matrix */}
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Mountain size={10} />
                      <span>{details.formationName}</span>
                    </span>
                    <span className="font-mono text-amber-300">{details.stratigraphicAge}</span>
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-slate-400">
                    <span>Period: {details.stratigraphicPeriod}</span>
                    <span className="truncate max-w-[120px]">Matrix: {details.sedimentMatrix}</span>
                  </div>
                </div>

                {/* Climate & Biome */}
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-amber-400 flex items-center gap-1">
                      {renderWeatherIcon(details.iconType)}
                      <span>{details.weatherType}</span>
                    </span>
                    <span className="text-slate-400 text-[8px] font-mono">{details.climateBiome}</span>
                  </div>
                  <p className="text-[8px] text-slate-400 leading-tight">{details.phenomenaLabel}</p>
                </div>

                {/* Geography & Osteology */}
                <div className="grid grid-cols-2 gap-1 text-[8.5px] font-mono">
                  <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[7.5px] uppercase block">Coords</span>
                    <span className="text-sky-300 truncate block">{details.coordinatesFormatted}</span>
                  </div>
                  <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[7.5px] uppercase block">Osteology</span>
                    <span className="text-emerald-400 font-bold block">{details.osteologyRecoveryPct}% Recovered</span>
                  </div>
                </div>

                {/* Cardinal Bearing */}
                {rel && (
                  <div className="bg-teal-950/70 p-1.5 rounded-xl border border-teal-800/70 flex items-center justify-between font-mono text-[8px] text-teal-300">
                    <span>Bearing: {rel.cardinal} ({Math.round(rel.azimuthDeg)}°)</span>
                    <span>{Math.round(rel.distanceKm)} km away</span>
                  </div>
                )}
              </div>
            )}

            {/* Click to inspect button */}
            <button
              onClick={() => {
                setActiveSiteInfo(hoveredSiteInfo.site);
                setIsSiteCardCollapsed(false);
                onMarkerClick(hoveredSiteInfo.site);
                flyCameraToSite(hoveredSiteInfo.site);
                setHoveredSiteInfo(null);
              }}
              className="w-full py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-rounded font-extrabold text-[9.5px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
            >
              <span>Inspect & Fly To Locality</span>
              <ChevronRight size={10} strokeWidth={3} />
            </button>
          </div>
        );
      })()}

      {/* ACTIVE MIGRATION WAYPOINT BANNER */}
      {activeWaypoint && layerWaypoints && (
        <div className="absolute top-20 right-4 z-20 max-w-xs w-full bg-gradient-to-r from-amber-950/95 to-slate-900/95 backdrop-blur-md border border-amber-500/80 rounded-2xl p-3 shadow-2xl space-y-1.5 animate-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px] font-bold">
              <Compass size={13} className="animate-spin-slow" />
              <span>Spatio-Temporal Waypoint</span>
            </div>
            {activeMarker && (
              <button
                onClick={() => {
                  flyCameraToSite(activeMarker);
                }}
                className="text-[9px] font-rounded font-bold text-amber-300 hover:underline cursor-pointer"
              >
                Back to Site
              </button>
            )}
          </div>
          <h4 className="text-xs font-rounded font-extrabold text-white">
            {activeWaypoint.season} Season ({activeWaypoint.monthRange})
          </h4>
          <p className="text-[10.5px] text-slate-300 leading-snug font-rounded">
            {activeWaypoint.environmentalConditions}
          </p>
          <div className="grid grid-cols-2 gap-1 text-[9px] font-mono pt-1 text-amber-300/90 border-t border-amber-500/30">
            <span>Lat: {activeWaypoint.lat.toFixed(2)}°</span>
            <span>Lng: {activeWaypoint.lng.toFixed(2)}°</span>
            <span>Temp: {activeWaypoint.tempEstimatedC}°C</span>
            <span>Elev: {activeWaypoint.elevationEstimateM}m</span>
          </div>
        </div>
      )}

      {/* EXCAVATION SITE CARD OVERLAY (MOVEABLE & COLLAPSIBLE) */}
      {!dockedState.locality_card && activeSiteInfo && (
        <div 
          ref={siteCardRef}
          style={siteCardPos ? { left: `${siteCardPos.x}px`, top: `${siteCardPos.y}px`, right: 'auto', bottom: 'auto' } : undefined}
          className={`absolute z-20 max-w-sm w-full transition-shadow ${
            siteCardPos ? '' : 'bottom-6 left-6'
          }`}
        >
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl space-y-2.5">
            {/* Drag Handle & Header */}
            <div 
              onPointerDown={handleSiteCardPointerDown}
              onPointerMove={handleSiteCardPointerMove}
              onPointerUp={handleSiteCardPointerUp}
              onPointerCancel={handleSiteCardPointerUp}
              onDoubleClick={() => setSiteCardPos(null)}
              className={`flex items-start justify-between gap-2 p-1 rounded-lg border-b border-slate-800 touch-none select-none transition-colors ${
                isDraggingSiteCard ? 'cursor-grabbing bg-emerald-950/60' : 'cursor-grab hover:bg-slate-800/80'
              }`}
              title="Drag Excavation Card anywhere on screen • Double-click to reset"
            >
              <div 
                className="space-y-0.5 min-w-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSiteInfo) flyCameraToSite(activeSiteInfo);
                }}
                title="Click to center camera on this excavation site"
              >
                <div className="flex items-center gap-1.5">
                  <GripVertical size={12} className="text-slate-400" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-wider uppercase block truncate">
                    Excavation Locality {markers.length > 0 ? currentIndex + 1 : 0} of {markers.length}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white leading-tight font-rounded truncate hover:text-emerald-300 transition-colors">
                  {activeSiteInfo.name}
                </h3>
              </div>

              {/* Action Buttons: Dock, Reset, Collapse, Next/Prev */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDockIn('locality_card')}
                  className="px-1.5 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/40 flex items-center gap-1 cursor-pointer transition-all"
                  title="Put Locality Card back into Viewport Elements Deck"
                >
                  <ArrowDownToLine size={9} />
                  <span>Dock</span>
                </button>
                {siteCardPos && (
                  <button
                    onClick={() => setSiteCardPos(null)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Reset site card position"
                  >
                    <RotateCcw size={10} />
                  </button>
                )}
                {onPrevSite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (markers.length <= 1) return;
                      onPrevSite();
                    }}
                    disabled={markers.length <= 1}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 active:scale-95 shadow-sm"
                    title="Previous fossil locality ([ or ←) • Moves pin and camera"
                  >
                    <ChevronLeft size={13} />
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
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 active:scale-95 shadow-sm"
                    title="Next fossil locality (] or →) • Moves pin and camera"
                  >
                    <ChevronRight size={13} />
                  </button>
                )}
                <button
                  onClick={() => setIsSiteCardCollapsed(!isSiteCardCollapsed)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  title={isSiteCardCollapsed ? "Expand Site Card" : "Collapse Site Card"}
                >
                  {isSiteCardCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            </div>

            {!isSiteCardCollapsed && renderLocalityCardContent(false)}
          </div>
        </div>
      )}

      {/* EXPEDITION AUTO-TOUR FLOATING BANNER */}
      {isTourActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-500/60 shadow-2xl flex items-center gap-3 text-white overflow-hidden relative">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-rounded font-extrabold text-[10.5px] text-emerald-300 tracking-wide uppercase">
                    Expedition Tour
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    Station {markers.findIndex(m => m.name === activeMarker?.name) + 1} of {markers.length}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                  {activeMarker?.name.split(/[,(]/)[0] || 'Locality'}
                </span>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-700" />

            {/* Tour Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={prevTourStation}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Previous Locality (←)"
              >
                <SkipBack size={12} />
              </button>
              <button
                onClick={() => setIsTourPaused(!isTourPaused)}
                className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                title={isTourPaused ? "Resume Expedition Tour (Space)" : "Pause Tour (Space)"}
              >
                {isTourPaused ? <Play size={11} className="fill-current" /> : <Pause size={11} className="fill-current" />}
                <span>{isTourPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={nextTourStation}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Next Locality (→)"
              >
                <SkipForward size={12} />
              </button>
              <button
                onClick={stopExpeditionTour}
                className="p-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 hover:text-white transition-colors cursor-pointer ml-1"
                title="Exit Expedition Tour (Esc)"
              >
                <Square size={11} className="fill-current" />
              </button>
            </div>

            {/* Continuous Progress Bar under banner */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
              <div 
                className="h-full bg-emerald-400 transition-all duration-100 ease-linear"
                style={{ width: `${isTourPaused ? 0 : tourProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <div 
          onClick={() => setShowShortcutsModal(false)}
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl p-4.5 text-white animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Keyboard size={16} />
                </div>
                <div>
                  <h3 className="font-rounded font-extrabold text-sm text-white">Observatory Shortcuts</h3>
                  <p className="text-[10px] text-slate-400">Quick keyboard navigation & controls</p>
                </div>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-[11px]">
              <div>
                <span className="text-[9.5px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1.5">
                  Camera & Exploration
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
                    <span className="text-slate-300">Expedition Tour</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-[9px] font-bold">T / Space</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
                    <span className="text-slate-300">Continuous Orbit</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-[9px] font-bold">O</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
                    <span className="text-slate-300">Reset True North</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-[9px] font-bold">N</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
                    <span className="text-slate-300">Frame All Sites</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-[9px] font-bold">C</kbd>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[9.5px] font-mono uppercase tracking-wider text-sky-400 font-bold block mb-1.5">
                  View Engine & Display
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
                    <span className="text-slate-300">3D Earth Globe</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-[9px] font-bold">1</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
                    <span className="text-slate-300">Satellite Hybrid</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-[9px] font-bold">2</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
                    <span className="text-slate-300">Terrain Relief</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-[9px] font-bold">3</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
                    <span className="text-slate-300">Fullscreen Mode</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-[9px] font-bold">F</kbd>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[9.5px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1.5">
                  Localities & Navigation
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
                    <span className="text-slate-300">Cycle Localities</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-[9px] font-bold">← / →</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
                    <span className="text-slate-300">Pin Hover Cards</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-[9px] font-bold">H</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50 col-span-2">
                    <span className="text-slate-300">Close Overlay / Exit Tour</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-[9px] font-bold">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED VIEWPORT ELEMENTS CONTAINER (DECK FOR SNIPPING & DOCKING MAP HUDS) */}
      <ViewportElementsContainer
        dockedState={dockedState}
        onSnipOut={handleSnipOut}
        onDockIn={handleDockIn}
        onSnipAllOut={handleSnipAllOut}
        onDockAllIn={handleDockAllIn}
        renderElement={renderViewportElement}
      />

      {/* MANDATORY GOOGLE MAPS PLATFORM TEXT ATTRIBUTION */}
      <div className="absolute bottom-2 right-4 z-20 pointer-events-none text-right">
        <span className="text-[10px] font-mono text-slate-400/80 bg-slate-950/70 px-2 py-0.5 rounded backdrop-blur-xs select-none block">
          Google Maps
        </span>
      </div>
    </div>
  );
};

export default GoogleEarthViewer;
