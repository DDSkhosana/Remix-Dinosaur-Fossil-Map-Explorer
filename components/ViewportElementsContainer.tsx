import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useViewportDimensions } from '../hooks/useViewportDimensions';
import { 
  Boxes, 
  Scissors, 
  ArrowDownToLine, 
  Minimize2, 
  Maximize2, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  ChevronLeft,
  LayoutGrid, 
  Layers, 
  Compass, 
  SlidersHorizontal, 
  Globe, 
  MapPin, 
  ExternalLink,
  RotateCcw,
  Sparkles,
  GripVertical,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Move,
  Search,
  Sliders,
  Filter,
  Columns,
  Square,
  ChevronsLeft,
  ArrowRightToLine,
  ArrowLeftToLine
} from 'lucide-react';

export type ViewportElementId = 
  | 'locality_card'
  | 'camera_nav'
  | 'layer_toggles'
  | 'plotting_ribbon'
  | 'pin_banner'
  | 'mode_switcher';

export type DeckCategory = 'all' | 'navigation' | 'analysis' | 'observatory';

export interface ViewportElementMeta {
  id: ViewportElementId;
  label: string;
  shortLabel: string;
  description: string;
  category: DeckCategory;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const VIEWPORT_ELEMENTS: ViewportElementMeta[] = [
  {
    id: 'locality_card',
    label: 'Excavation Locality Dossier',
    shortLabel: 'Locality Card',
    description: 'Active specimen site, coordinates, osteology progress & field actions',
    category: 'navigation',
    icon: MapPin,
  },
  {
    id: 'camera_nav',
    label: 'Camera & 3D Navigation',
    shortLabel: 'Camera & Nav',
    description: '3D Orbit, center taxon, focus site, 4-way pan, tilt & altitude zoom',
    category: 'navigation',
    icon: Compass,
  },
  {
    id: 'layer_toggles',
    label: 'Trail & Layer Toggles',
    shortLabel: 'Layers & Roster',
    description: 'Pins, expedition trails, plotting, hover tooltips & site roster list',
    category: 'analysis',
    icon: Layers,
  },
  {
    id: 'plotting_ribbon',
    label: 'Cartographic Plotting Suite',
    shortLabel: 'Plotting Suite',
    description: 'Buffers, azimuths, migration corridors, contours, trackways & density',
    category: 'analysis',
    icon: SlidersHorizontal,
  },
  {
    id: 'pin_banner',
    label: 'Active Pin Tracker HUD',
    shortLabel: 'Pin Tracker',
    description: 'Live excavation pin sequence, site name, coordinates & quick steppers',
    category: 'navigation',
    icon: Sparkles,
  },
  {
    id: 'mode_switcher',
    label: 'Observatory Projections & Tools',
    shortLabel: 'Modes & Tools',
    description: '3D Earth, Satellite, Terrain, Paleo Atlas, Expedition Tour & audio',
    category: 'observatory',
    icon: Globe,
  }
];

export const DECK_CATEGORIES: { id: DeckCategory; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'all', label: 'All Panels', icon: Boxes },
  { id: 'navigation', label: 'Navigation & Sites', icon: Compass },
  { id: 'analysis', label: 'Layers & Plotting', icon: SlidersHorizontal },
  { id: 'observatory', label: 'Observatory & Tools', icon: Globe },
];

interface ViewportElementsContainerProps {
  dockedState: Record<ViewportElementId, boolean>;
  onSnipOut: (id: ViewportElementId) => void;
  onDockIn: (id: ViewportElementId) => void;
  onSnipAllOut: () => void;
  onDockAllIn: () => void;
  renderElement: (id: ViewportElementId, isInsideContainer: boolean) => React.ReactNode;
  storagePrefix?: string;
  deckTitle?: string;
}

export const ViewportElementsContainer: React.FC<ViewportElementsContainerProps> = ({
  dockedState,
  onSnipOut,
  onDockIn,
  onSnipAllOut,
  onDockAllIn,
  renderElement,
  storagePrefix = 'deck',
  deckTitle = 'Viewport Elements Deck',
}) => {
  // Master Deck Position (Moveable / Panable)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_container_position`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({ startX: 0, startY: 0, initX: 0, initY: 0 });

  // Moveable Minimized Pill Position
  const [pillPosition, setPillPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_pill_position`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [isPillDragging, setIsPillDragging] = useState(false);
  const pillDragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number; pillW: number; pillH: number; hasMoved: boolean }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    pillW: 240,
    pillH: 44,
    hasMoved: false,
  });
  const pillRef = useRef<HTMLDivElement>(null);

  // Resizable Deck Dimensions
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_container_dimensions`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { width: 920, height: 520 };
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ startX: number; startY: number; initW: number; initH: number; handle: string }>({
    startX: 0, startY: 0, initW: 920, initH: 520, handle: 'se'
  });

  // Zoom scale for master deck (Zoomable: 0.70x to 1.35x)
  const [deckZoom, setDeckZoom] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_container_zoom`);
      if (saved) return Number(saved);
    } catch {}
    return 1.0;
  });

  // Maximize / Full-dashboard mode
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Dynamic Viewport Dimensions
  const { width: screenWidth, height: screenHeight, isMobile: isMobileScreen } = useViewportDimensions();

  // Dynamic boundary clamping whenever viewport dimensions change
  useEffect(() => {
    setPosition(prev => {
      if (!prev) return null;
      const curW = isMaximized ? screenWidth - 24 : Math.min(dimensions.width, screenWidth - 24);
      const curH = isMaximized ? screenHeight - 24 : Math.min(dimensions.height, screenHeight - 80);
      const maxX = Math.max(10, screenWidth - curW - 10);
      const maxY = Math.max(10, screenHeight - curH - 10);
      return {
        x: Math.max(10, Math.min(prev.x, maxX)),
        y: Math.max(10, Math.min(prev.y, maxY))
      };
    });

    setPillPosition(prev => {
      if (!prev) return null;
      const maxX = Math.max(10, screenWidth - 260);
      const maxY = Math.max(10, screenHeight - 60);
      return {
        x: Math.max(10, Math.min(prev.x, maxX)),
        y: Math.max(10, Math.min(prev.y, maxY))
      };
    });
  }, [screenWidth, screenHeight, dimensions.width, dimensions.height, isMaximized]);

  // --- PER-PANEL INTERACTIVITY STATES: COLLAPSIBLE, RESIZABLE, ZOOMABLE, PANABLE ---
  // Collapsed state map for individual panels (Default all collapsed)
  const [panelCollapsed, setPanelCollapsed] = useState<Record<string, boolean>>(() => ({
    locality_card: true,
    camera_nav: true,
    layer_toggles: true,
    plotting_ribbon: true,
    pin_banner: true,
    mode_switcher: true,
  }));
  // Size tier per panel: 'compact' (auto / 180px), 'normal' (320px), 'expanded' (500px)
  const [panelSizeTiers, setPanelSizeTiers] = useState<Record<string, 'compact' | 'normal' | 'expanded'>>({});
  // Local zoom scale per panel: 0.75x to 2.0x
  const [panelZoomLevels, setPanelZoomLevels] = useState<Record<string, number>>({});
  // Local pan offset per panel: { x, y }
  const [panelPanOffsets, setPanelPanOffsets] = useState<Record<string, { x: number; y: number }>>({});
  // Active panning panel ID
  const [activePanPanelId, setActivePanPanelId] = useState<string | null>(null);
  const panelPanStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0, startY: 0, initX: 0, initY: 0
  });

  // Toggle single panel collapsed
  const togglePanelCollapse = (panelId: string) => {
    setPanelCollapsed(prev => ({
      ...prev,
      [panelId]: !prev[panelId]
    }));
  };

  // Step panel zoom
  const stepPanelZoom = (panelId: string, delta: number) => {
    setPanelZoomLevels(prev => {
      const current = prev[panelId] ?? 1.0;
      const next = Math.max(0.70, Math.min(2.0, Number((current + delta).toFixed(2))));
      return { ...prev, [panelId]: next };
    });
  };

  // Reset panel zoom & pan
  const resetPanelTransform = (panelId: string) => {
    setPanelZoomLevels(prev => ({ ...prev, [panelId]: 1.0 }));
    setPanelPanOffsets(prev => ({ ...prev, [panelId]: { x: 0, y: 0 } }));
  };

  // Cycle panel size tier
  const cyclePanelSizeTier = (panelId: string) => {
    setPanelSizeTiers(prev => {
      const current = prev[panelId] || 'normal';
      const order: Array<'compact' | 'normal' | 'expanded'> = ['compact', 'normal', 'expanded'];
      const nextIdx = (order.indexOf(current) + 1) % order.length;
      return { ...prev, [panelId]: order[nextIdx] };
    });
  };

  // Panel drag-to-pan handlers
  const handlePanelPanPointerDown = (panelId: string, e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea, a, [data-nodrag]')) return;
    e.preventDefault();
    const currentOffset = panelPanOffsets[panelId] || { x: 0, y: 0 };
    panelPanStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentOffset.x,
      initY: currentOffset.y,
    };
    setActivePanPanelId(panelId);
  };

  // Window listeners for active panel pan
  useEffect(() => {
    if (!activePanPanelId) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - panelPanStartRef.current.startX;
      const dy = e.clientY - panelPanStartRef.current.startY;
      setPanelPanOffsets(prev => ({
        ...prev,
        [activePanPanelId]: {
          x: panelPanStartRef.current.initX + dx,
          y: panelPanStartRef.current.initY + dy,
        }
      }));
    };

    const handlePointerUp = () => {
      setActivePanPanelId(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activePanPanelId]);

  // Universal Escape key listener to exit maximized mode if open
  useEffect(() => {
    if (!isMaximized) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized]);

  // Position & Size Presets Menu Open State
  const [showPresetsMenu, setShowPresetsMenu] = useState<boolean>(false);

  // Active selected tab inside the container
  const [activeTab, setActiveTab] = useState<ViewportElementId>('locality_card');
  // Selected functional category filter
  const [activeCategory, setActiveCategory] = useState<DeckCategory>('all');
  // Minimized / Collapsed state of the entire master container (Default minimized)
  const [isContainerMinimized, setIsContainerMinimized] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_container_minimized`);
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  // View mode: 'tabbed' (single tab focused), 'grid' (responsive multi-column flex grid), 'dense' (compact rows)
  const [viewLayout, setViewLayout] = useState<'tabbed' | 'grid' | 'dense'>('grid');

  // Search filter for deck items
  const [deckSearchQuery, setDeckSearchQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  const dockedCount = Object.values(dockedState).filter(Boolean).length;
  const extractedCount = Object.values(dockedState).filter(v => !v).length;

  // Persist position
  useEffect(() => {
    if (position) {
      try {
        localStorage.setItem(`${storagePrefix}_container_position`, JSON.stringify(position));
      } catch {}
    } else {
      localStorage.removeItem(`${storagePrefix}_container_position`);
    }
  }, [position, storagePrefix]);

  // Persist dimensions
  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_container_dimensions`, JSON.stringify(dimensions));
    } catch {}
  }, [dimensions, storagePrefix]);

  // Persist zoom
  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_container_zoom`, String(deckZoom));
    } catch {}
  }, [deckZoom, storagePrefix]);

  // Persist minimization
  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_container_minimized`, String(isContainerMinimized));
    } catch {}
  }, [isContainerMinimized, storagePrefix]);

  // Persist pill position
  useEffect(() => {
    if (pillPosition) {
      try {
        localStorage.setItem(`${storagePrefix}_pill_position`, JSON.stringify(pillPosition));
      } catch {}
    } else {
      localStorage.removeItem(`${storagePrefix}_pill_position`);
    }
  }, [pillPosition, storagePrefix]);

  // Handle deck pill dragging
  const handlePillPointerDown = (e: React.PointerEvent) => {
    // If clicking a child button explicitly (e.g. recenter button), do not start drag
    if ((e.target as HTMLElement).closest('button[data-nodrag]')) return;
    e.preventDefault();
    const pill = pillRef.current;
    if (!pill) return;

    const currentX = pillPosition ? pillPosition.x : pill.offsetLeft;
    const currentY = pillPosition ? pillPosition.y : pill.offsetTop;
    const pillW = pill.offsetWidth || 240;
    const pillH = pill.offsetHeight || 44;

    pillDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentX,
      initY: currentY,
      pillW,
      pillH,
      hasMoved: false,
    };
    setIsPillDragging(true);
  };

  // Window-level listeners for pill dragging
  useEffect(() => {
    if (!isPillDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const { startX, startY, initX, initY, pillW, pillH } = pillDragStartRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        pillDragStartRef.current.hasMoved = true;
      }

      const maxX = Math.max(10, window.innerWidth - pillW - 10);
      const maxY = Math.max(10, window.innerHeight - pillH - 10);
      const newX = Math.max(10, Math.min(maxX, initX + dx));
      const newY = Math.max(10, Math.min(maxY, initY + dy));

      setPillPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsPillDragging(false);
      // If the user tapped or clicked without dragging, expand the deck
      if (!pillDragStartRef.current.hasMoved) {
        setIsContainerMinimized(false);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isPillDragging]);

  // Auto-switch tab if current active tab is extracted and another tab is docked
  useEffect(() => {
    if (!dockedState[activeTab]) {
      const nextDocked = VIEWPORT_ELEMENTS.find(el => dockedState[el.id]);
      if (nextDocked) {
        setActiveTab(nextDocked.id);
      }
    }
  }, [dockedState, activeTab]);

  // --- DRAG / PAN HANDLING ---
  const handlePointerDownDrag = (e: React.PointerEvent) => {
    // Only block dragging if clicking directly on a button, input, or interactive child marked data-nodrag
    if ((e.target as HTMLElement).closest('button, input, select, textarea, a, [data-nodrag]')) return;
    if (isMaximized) return; // Cannot drag when maximized
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    // Use container's actual current left/top offsets inside its parent container
    const currentX = position ? position.x : container.offsetLeft;
    const currentY = position ? position.y : container.offsetTop;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentX,
      initY: currentY,
    };
    setIsDragging(true);
  };

  // Window-level dragging listeners for 100% reliable tracking without pointer capture drops
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const maxX = Math.max(10, window.innerWidth - 120);
      const maxY = Math.max(10, window.innerHeight - 80);
      const newX = Math.max(10, Math.min(maxX, dragStartRef.current.initX + dx));
      const newY = Math.max(10, Math.min(maxY, dragStartRef.current.initY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging]);

  // --- 8-WAY RESIZE HANDLING ---
  const handlePointerDownResize = (e: React.PointerEvent, handle: string) => {
    if (isMaximized) return;
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    const currentX = position ? position.x : (container ? container.offsetLeft : window.innerWidth / 2 - dimensions.width / 2);
    const currentY = position ? position.y : (container ? container.offsetTop : window.innerHeight - dimensions.height - 20);

    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initW: dimensions.width,
      initH: dimensions.height,
      handle,
    };
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentX,
      initY: currentY,
    };
    setIsResizing(true);
  };

  // Window-level resize listeners
  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - resizeStartRef.current.startX;
      const dy = e.clientY - resizeStartRef.current.startY;
      const minW = 380;
      const maxW = Math.min(1600, window.innerWidth - 30);
      const minH = 240;
      const maxH = Math.min(960, window.innerHeight - 80);

      let newW = resizeStartRef.current.initW;
      let newH = resizeStartRef.current.initH;

      if (resizeStartRef.current.handle.includes('e')) {
        newW = Math.max(minW, Math.min(maxW, resizeStartRef.current.initW + dx));
      }
      if (resizeStartRef.current.handle.includes('w')) {
        newW = Math.max(minW, Math.min(maxW, resizeStartRef.current.initW - dx));
        if (position) {
          const deltaW = newW - resizeStartRef.current.initW;
          setPosition(prev => prev ? { ...prev, x: Math.max(10, dragStartRef.current.initX - deltaW) } : null);
        }
      }
      if (resizeStartRef.current.handle.includes('s')) {
        newH = Math.max(minH, Math.min(maxH, resizeStartRef.current.initH + dy));
      }
      if (resizeStartRef.current.handle.includes('n')) {
        newH = Math.max(minH, Math.min(maxH, resizeStartRef.current.initH - dy));
        if (position) {
          const deltaH = newH - resizeStartRef.current.initH;
          setPosition(prev => prev ? { ...prev, y: Math.max(10, dragStartRef.current.initY - deltaH) } : null);
        }
      }

      setDimensions({ width: newW, height: newH });
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isResizing, position]);

  // Quick Preset Handlers
  const applyPositionPreset = (type: 'bottom' | 'top' | 'left' | 'right' | 'center') => {
    setShowPresetsMenu(false);
    setIsMaximized(false);
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    switch (type) {
      case 'bottom':
        setPosition(null); // Anchored to bottom center
        break;
      case 'top':
        setPosition({ x: Math.max(20, (screenW - dimensions.width) / 2), y: 20 });
        break;
      case 'left':
        setPosition({ x: 20, y: Math.max(40, (screenH - dimensions.height) / 2) });
        break;
      case 'right':
        setPosition({ x: Math.max(20, screenW - dimensions.width - 20), y: Math.max(40, (screenH - dimensions.height) / 2) });
        break;
      case 'center':
        setPosition({ x: Math.max(20, (screenW - dimensions.width) / 2), y: Math.max(20, (screenH - dimensions.height) / 2) });
        break;
    }
  };

  const applySizePreset = (type: 'compact' | 'standard' | 'wide') => {
    setShowPresetsMenu(false);
    setIsMaximized(false);
    switch (type) {
      case 'compact':
        setDimensions({ width: 680, height: 380 });
        break;
      case 'standard':
        setDimensions({ width: 880, height: 480 });
        break;
      case 'wide':
        setDimensions({ width: 1160, height: 540 });
        break;
    }
  };

  // Filtered elements by category & search
  const visibleElements = VIEWPORT_ELEMENTS.filter(element => {
    const matchesCategory = activeCategory === 'all' || element.category === activeCategory;
    const matchesSearch = deckSearchQuery.trim() === '' || 
      element.label.toLowerCase().includes(deckSearchQuery.toLowerCase()) ||
      element.shortLabel.toLowerCase().includes(deckSearchQuery.toLowerCase()) ||
      element.description.toLowerCase().includes(deckSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY WHEN DECK IS OPEN (Touch to dismiss/collapse) */}
      {isMobileScreen && !isContainerMinimized && (
        <div 
          onClick={() => setIsContainerMinimized(true)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in"
          aria-label="Dismiss Elements Deck"
        />
      )}

      {/* QUICK LAUNCH DOCK CALLOUT BUTTON (Moveable & non-obtrusive pill when deck is collapsed) */}
      {isContainerMinimized && (
        <div 
          ref={pillRef}
          onPointerDown={handlePillPointerDown}
          onDoubleClick={() => setPillPosition(null)}
          style={pillPosition ? {
            position: 'absolute',
            left: `${pillPosition.x}px`,
            top: `${pillPosition.y}px`,
            transform: 'none',
            bottom: 'auto',
            zIndex: 45,
          } : isMobileScreen ? {
            position: 'absolute',
            bottom: '68px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 45,
          } : {
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 35,
          }}
          className={`touch-none select-none transition-all ${
            isPillDragging ? 'cursor-grabbing opacity-90 scale-[1.04] shadow-2xl' : 'cursor-grab hover:scale-102'
          }`}
          title="Click to open Deck • Drag to move pill"
        >
          {isMobileScreen ? (
            /* Ultra-compact, unobtrusive mobile pill */
            <div className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-850 text-white border border-emerald-500/60 shadow-xl backdrop-blur-md group font-rounded font-bold text-xs select-none">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Boxes size={11} />
              </div>
              <span className="text-[11px] font-bold text-slate-100 whitespace-nowrap">HUD Deck</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[9px] border border-emerald-500/40 shrink-0">
                {dockedCount}
              </span>
              <ChevronUp size={13} className="text-emerald-400 group-hover:-translate-y-0.5 transition-transform shrink-0" />
            </div>
          ) : (
            /* Full desktop draggable launch pill */
            <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-900/95 hover:bg-slate-850 text-white border-2 border-emerald-500/70 shadow-2xl backdrop-blur-md group font-rounded font-bold text-xs select-none">
              <div className="text-slate-500 group-hover:text-emerald-400 transition-colors cursor-grab" title="Drag to move pill">
                <GripVertical size={13} />
              </div>
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center group-hover:rotate-12 transition-transform shrink-0">
                <Boxes size={13} />
              </div>
              <span className="whitespace-nowrap">Open {deckTitle}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[9px] border border-emerald-500/40 shrink-0">
                {dockedCount} Docked
              </span>
              <ChevronUp size={14} className="text-emerald-400 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              {pillPosition && (
                <button
                  type="button"
                  data-nodrag="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPillPosition(null);
                  }}
                  className="ml-0.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Reset pill to bottom center"
                >
                  <RotateCcw size={10} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* MOVEABLE, RESIZABLE, ZOOMABLE VIEWPORT DECK CONTAINER */}
      <div 
        ref={containerRef}
        id="map-viewport-elements-container"
        style={isMaximized ? {
          position: 'fixed',
          left: '12px',
          top: '12px',
          right: '12px',
          bottom: '12px',
          width: 'calc(100vw - 24px)',
          height: 'calc(100vh - 24px)',
          maxWidth: 'none',
          maxHeight: 'none',
          transform: 'none',
          zIndex: 55,
        } : isMobileScreen ? {
          position: 'fixed',
          left: '8px',
          right: '8px',
          bottom: '12px',
          width: 'calc(100vw - 16px)',
          maxHeight: '75vh',
          zIndex: 50,
          transform: 'none',
        } : {
          position: 'absolute',
          left: position ? `${position.x}px` : '50%',
          top: position ? `${position.y}px` : 'auto',
          bottom: position ? 'auto' : '16px',
          transform: position ? 'none' : 'translateX(-50%)',
          width: isContainerMinimized ? 'auto' : `${Math.min(dimensions.width, screenWidth - 20)}px`,
          maxWidth: 'calc(100vw - 20px)',
          zIndex: 35,
        }}
        className={`pointer-events-auto select-none transition-shadow ${
          isDragging ? 'opacity-90 shadow-2xl scale-[1.008]' : 'opacity-100 shadow-xl'
        } ${isContainerMinimized ? 'hidden' : 'block'}`}
      >
        <div 
          style={{
            height: isContainerMinimized ? 'auto' : isMaximized ? '100%' : isMobileScreen ? '75vh' : `${Math.min(dimensions.height, window.innerHeight - 80)}px`,
          }}
          className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
        >
          {/* Mobile Handle Pill */}
          {isMobileScreen && (
            <div className="w-12 h-1 bg-slate-700/80 rounded-full mx-auto mt-2 -mb-0.5 shrink-0" />
          )}
          {/* MASTER DRAGGABLE HEADER BAR */}
          <div 
            onPointerDown={handlePointerDownDrag}
            onDoubleClick={() => {
              if (isMaximized) {
                setIsMaximized(false);
              } else {
                setPosition(null);
              }
            }}
            className={`px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 touch-none select-none transition-colors ${
              isDragging ? 'cursor-grabbing bg-emerald-950/60' : isMaximized ? 'cursor-default' : 'cursor-grab hover:bg-slate-950'
            }`}
            title="Click and drag anywhere on this header bar to move the Deck • Double-click to recenter"
          >
            {/* Left Title, Move Grip, & Status Badge */}
            <div className="flex items-center gap-2 min-w-0 select-none">
              {!isMaximized && (
                <div 
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800/80 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border border-slate-700/60 transition-colors cursor-grab"
                  title="Click and drag to move Viewport Deck"
                >
                  <GripVertical size={14} className="shrink-0" />
                  <span className="text-[9px] font-mono uppercase tracking-wider font-bold hidden xs:inline">Move</span>
                </div>
              )}
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Boxes size={13} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-rounded font-extrabold text-white tracking-wide truncate">
                    {deckTitle}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0">
                    {dockedCount} Docked
                  </span>
                  {extractedCount > 0 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 shrink-0">
                      {extractedCount} Extracted
                    </span>
                  )}
                  {isMaximized && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-sky-950 text-sky-300 border border-sky-500/40 shrink-0 hidden sm:inline">
                      Full Deck View
                    </span>
                  )}
                </div>
                <span className="text-[8.5px] text-slate-400 font-mono hidden sm:block truncate">
                  Panable, resizable, collapsible modular HUD deck for observatory elements
                </span>
              </div>
            </div>

            {/* Right Control Actions: Zoom Stepper, Layout Switcher, Presets, Snip/Dock, Maximize, Minimize */}
            <div className="flex items-center gap-1 shrink-0 relative ml-auto" data-nodrag>
              {/* Zoom Controls (Zoomable) */}
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                <button
                  onClick={() => setDeckZoom(prev => Math.max(0.70, Number((prev - 0.1).toFixed(2))))}
                  disabled={deckZoom <= 0.70}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Zoom Out Deck View"
                >
                  <ZoomOut size={11} />
                </button>
                <button
                  onClick={() => setDeckZoom(1.0)}
                  className="px-1 text-[8.5px] font-mono text-emerald-400 hover:underline cursor-pointer"
                  title="Click to reset zoom to 100%"
                >
                  {Math.round(deckZoom * 100)}%
                </button>
                <button
                  onClick={() => setDeckZoom(prev => Math.min(1.35, Number((prev + 0.1).toFixed(2))))}
                  disabled={deckZoom >= 1.35}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Zoom In Deck View"
                >
                  <ZoomIn size={11} />
                </button>
              </div>

              {/* Layout Switcher (Flex-Grid vs Tabbed vs Dense) */}
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    viewLayout === 'grid' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Responsive Multi-Column Flex Grid Layout"
                >
                  <LayoutGrid size={12} />
                </button>
                <button
                  onClick={() => setViewLayout('tabbed')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    viewLayout === 'tabbed' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Single-Panel Tabbed Focus View"
                >
                  <Square size={12} />
                </button>
                <button
                  onClick={() => setViewLayout('dense')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    viewLayout === 'dense' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Compact Dense Overview (All 6 HUDs side-by-side)"
                >
                  <Columns size={12} />
                </button>
              </div>

              {/* Presets Menu Toggle (Positions & Sizes) */}
              <div className="relative">
                <button
                  onClick={() => setShowPresetsMenu(prev => !prev)}
                  className={`p-1 rounded-lg border transition-all cursor-pointer ${
                    showPresetsMenu ? 'bg-emerald-600 text-slate-950 border-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="Deck Presets: Position & Size presets"
                >
                  <Sliders size={12} />
                </button>

                {showPresetsMenu && (
                  <div className="absolute right-0 top-8 w-56 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2.5 z-50 text-[10px] space-y-2">
                    <div>
                      <span className="font-rounded font-extrabold text-slate-300 block mb-1">Position Presets</span>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => applyPositionPreset('bottom')}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/50 cursor-pointer text-left"
                        >
                          Bottom Dock (Default)
                        </button>
                        <button
                          onClick={() => applyPositionPreset('top')}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/50 cursor-pointer text-left"
                        >
                          Top Center
                        </button>
                        <button
                          onClick={() => applyPositionPreset('left')}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/50 cursor-pointer text-left"
                        >
                          Float Left
                        </button>
                        <button
                          onClick={() => applyPositionPreset('right')}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/50 cursor-pointer text-left"
                        >
                          Float Right
                        </button>
                        <button
                          onClick={() => applyPositionPreset('center')}
                          className="col-span-2 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/50 cursor-pointer text-left"
                        >
                          Center Screen
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-1.5">
                      <span className="font-rounded font-extrabold text-slate-300 block mb-1">Size Presets</span>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => applySizePreset('compact')}
                          className="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-emerald-500/50 cursor-pointer text-center"
                        >
                          Compact
                        </button>
                        <button
                          onClick={() => applySizePreset('standard')}
                          className="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-emerald-500/50 cursor-pointer text-center"
                        >
                          Standard
                        </button>
                        <button
                          onClick={() => applySizePreset('wide')}
                          className="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-emerald-500/50 cursor-pointer text-center"
                        >
                          Wide
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between">
                      <span className="text-slate-400">Recenter Default</span>
                      <button
                        onClick={() => {
                          setPosition(null);
                          setDimensions({ width: 920, height: 520 });
                          setDeckZoom(1.0);
                          setShowPresetsMenu(false);
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900 cursor-pointer font-bold"
                      >
                        Reset All
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Snip All Out Button */}
              <button
                onClick={onSnipAllOut}
                disabled={dockedCount === 0}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Snip / Extract all elements out onto the map viewport"
              >
                <Scissors size={10} />
                <span className="hidden md:inline">Snip All</span>
              </button>

              {/* Dock All In Button */}
              <button
                onClick={onDockAllIn}
                disabled={extractedCount === 0}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Put all elements back into this container"
              >
                <ArrowDownToLine size={10} />
                <span className="hidden md:inline">Dock All</span>
              </button>

              {/* Maximize / Restore Toggle */}
              <button
                onClick={() => setIsMaximized(prev => !prev)}
                className={`p-1.5 rounded-lg text-slate-200 border cursor-pointer transition-colors ${
                  isMaximized 
                    ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400 ring-2 ring-sky-400/40' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                }`}
                title={isMaximized ? "Restore down to floating window" : "Maximize Elements Deck to full workspace"}
              >
                {isMaximized ? <Minimize2 size={13} className="text-white" /> : <Maximize2 size={13} />}
              </button>

              {/* Minimize Master Container Button */}
              <button
                onClick={() => {
                  setIsMaximized(false);
                  setIsContainerMinimized(true);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
                title="Minimize Elements Deck into quick-launch pill"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* SECONDARY FUNCTIONAL NAVIGATION STRIP & SEARCH */}
          <div className="px-2.5 py-1.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
            {/* Functional Category Filter Pills (Always visible, neatly divided) */}
            <div className="flex items-center gap-1 shrink-0 pr-2 border-r border-slate-800">
              {DECK_CATEGORIES.map(cat => {
                const CatIcon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2 py-0.8 rounded-md text-[9px] font-rounded font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      isActive 
                        ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-2xs' 
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <CatIcon size={10} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Element Tab Selection Strip (for tabbed view or direct jumper) */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
              {visibleElements.map(element => {
                const Icon = element.icon;
                const isDocked = dockedState[element.id];
                const isActive = activeTab === element.id;

                return (
                  <button
                    key={element.id}
                    onClick={() => {
                      setActiveTab(element.id);
                      if (viewLayout !== 'tabbed') {
                        // In grid/dense mode, clicking also selects tab
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9.5px] font-rounded font-bold transition-all shrink-0 cursor-pointer border ${
                      isActive && viewLayout === 'tabbed'
                        ? 'bg-slate-800 text-white border-emerald-500/60 shadow-xs'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-850'
                    }`}
                  >
                    <Icon size={11} className={isActive ? 'text-emerald-400' : isDocked ? 'text-slate-400' : 'text-amber-400'} />
                    <span className="truncate">{element.shortLabel}</span>
                    {isDocked ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Docked inside container" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Extracted on map" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Filter Search Input */}
            <div className="relative shrink-0 w-36 sm:w-44">
              <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={deckSearchQuery}
                onChange={(e) => setDeckSearchQuery(e.target.value)}
                placeholder="Search deck panels..."
                className="w-full bg-slate-900 border border-slate-700/70 rounded-lg pl-5 pr-2 py-0.5 text-[9px] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
          </div>

          {/* MAIN SCROLLABLE BODY WITH RESPONSIVE FLEX-GRID & RIGHT-MARGIN CLOSED TABS RAIL */}
          {(() => {
            const activeElements = visibleElements.filter(el => !panelCollapsed[el.id]);
            const collapsedElements = visibleElements.filter(el => !!panelCollapsed[el.id]);

            return (
              <div className="flex-1 flex flex-row overflow-hidden min-h-0 relative">
                {/* Left/Center Workspace for Active Elements */}
                <div 
                  className="flex-1 overflow-y-auto custom-scrollbar p-3 relative flex flex-col min-w-0"
                  style={{
                    zoom: deckZoom,
                  }}
                >
                  {activeElements.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40 my-auto">
                      <LayoutGrid size={32} className="text-emerald-400 mb-2.5 animate-pulse" />
                      <h4 className="text-xs font-rounded font-bold text-white">All Panels Docked to Right Margin</h4>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                        Panels are resting as closed tabs on the right margin. Click any tab strip on the right to restore it, or restore all simultaneously.
                      </p>
                      <button
                        onClick={() => setPanelCollapsed({})}
                        className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-rounded font-bold text-[10.5px] cursor-pointer transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                      >
                        <Maximize2 size={12} />
                        <span>Restore All Panels to Workspace</span>
                      </button>
                    </div>
                  ) : viewLayout === 'tabbed' ? (
                    // TABBED SINGLE VIEW
                    activeElements.map(element => {
                      if (element.id !== activeTab && activeElements.some(e => e.id === activeTab)) return null;
                      const targetEl = activeElements.some(e => e.id === activeTab) ? element : activeElements[0];
                      const isDocked = dockedState[targetEl.id];
                      const Icon = targetEl.icon;
                      const localZoom = panelZoomLevels[targetEl.id] || 1.0;
                      const localPan = panelPanOffsets[targetEl.id] || { x: 0, y: 0 };

                      return (
                        <div key={targetEl.id} className="flex-1 flex flex-col space-y-2 min-h-0">
                          {/* Sub-Card Header with Snip/Dock action & Pan/Zoom/Collapse controls */}
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-850/80 border border-slate-800 shrink-0 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                onClick={() => togglePanelCollapse(targetEl.id)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors shrink-0"
                                title="Collapse to right margin tab"
                              >
                                <ArrowRightToLine size={12} />
                              </button>

                              <div className="w-6 h-6 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                <Icon size={13} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-rounded font-extrabold text-white truncate">
                                    {targetEl.label}
                                  </span>
                                  {isDocked ? (
                                    <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                                      Docked in Deck
                                    </span>
                                  ) : (
                                    <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-amber-950/90 text-amber-300 border border-amber-500/40">
                                      Extracted on Viewport
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono block truncate">
                                  {targetEl.description}
                                </span>
                              </div>
                            </div>

                            {/* Header Interactive Panel Controls */}
                            <div className="flex items-center gap-1 shrink-0">
                              {isDocked && (
                                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                                  <button
                                    onClick={() => stepPanelZoom(targetEl.id, -0.15)}
                                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                    title="Zoom out inside panel"
                                  >
                                    <ZoomOut size={10} />
                                  </button>
                                  <button
                                    onClick={() => resetPanelTransform(targetEl.id)}
                                    className="px-1 text-[8.5px] font-mono text-emerald-400 hover:underline cursor-pointer"
                                    title="Reset panel zoom & pan to 100%"
                                  >
                                    {Math.round(localZoom * 100)}%
                                  </button>
                                  <button
                                    onClick={() => stepPanelZoom(targetEl.id, 0.15)}
                                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                    title="Zoom in inside panel"
                                  >
                                    <ZoomIn size={10} />
                                  </button>
                                  <div 
                                    onPointerDown={(e) => handlePanelPanPointerDown(targetEl.id, e)}
                                    className={`p-1 rounded cursor-grab text-slate-400 hover:text-emerald-300 ${
                                      activePanPanelId === targetEl.id ? 'bg-emerald-500/20 text-emerald-400 cursor-grabbing' : ''
                                    }`}
                                    title="Click and drag to pan panel viewport"
                                  >
                                    <Move size={10} />
                                  </div>
                                </div>
                              )}

                              {isDocked ? (
                                <button
                                  onClick={() => onSnipOut(targetEl.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white font-mono text-[9.5px] font-bold border border-amber-500/40 transition-all cursor-pointer shadow-2xs shrink-0"
                                  title="Snip / Extract this element out onto the map viewport"
                                >
                                  <Scissors size={11} />
                                  <span>Snip to Map</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => onDockIn(targetEl.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white font-mono text-[9.5px] font-bold border border-emerald-500/40 transition-all cursor-pointer shadow-2xs shrink-0"
                                  title="Put this element back into the container"
                                >
                                  <ArrowDownToLine size={11} />
                                  <span>Put Back In Deck</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Content Rendering */}
                          <div className="flex-1 overflow-auto custom-scrollbar relative border border-slate-800 rounded-xl bg-slate-900/60 min-h-0">
                            {isDocked ? (
                              <div 
                                style={{
                                  transform: `translate(${localPan.x}px, ${localPan.y}px) scale(${localZoom})`,
                                  transformOrigin: 'top left',
                                  transition: activePanPanelId === targetEl.id ? 'none' : 'transform 0.15s ease-out',
                                }}
                                className="p-1 h-full min-w-full"
                              >
                                {renderElement(targetEl.id, true)}
                              </div>
                            ) : (
                              <div className="p-8 flex flex-col items-center justify-center text-center space-y-2 h-full">
                                <div className="w-10 h-10 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                                  <ExternalLink size={18} />
                                </div>
                                <div>
                                  <h4 className="text-xs font-rounded font-bold text-white">
                                    {targetEl.label} is currently extracted
                                  </h4>
                                  <p className="text-[9.5px] text-slate-400 max-w-sm mt-0.5">
                                    This element is floating freely on the map viewport. You can interact with it there or put it back into this deck anytime.
                                  </p>
                                </div>
                                <button
                                  onClick={() => onDockIn(targetEl.id)}
                                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-rounded font-extrabold text-[10px] transition-all cursor-pointer shadow-md"
                                >
                                  <ArrowDownToLine size={11} />
                                  <span>Put Back in Container</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : viewLayout === 'dense' ? (
                    // DENSE MATRIX OVERVIEW
                    <div className="flex-1 flex flex-col space-y-2 min-w-0">
                      <div className={`grid gap-2 auto-rows-fr ${
                        activeElements.length === 1 ? 'grid-cols-1' : activeElements.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      }`}>
                        {activeElements.map(element => {
                          const isDocked = dockedState[element.id];
                          const Icon = element.icon;
                          const localZoom = panelZoomLevels[element.id] || 1.0;

                          return (
                            <div
                              key={element.id}
                              className={`p-2 rounded-xl border flex flex-col gap-1 transition-all ${
                                isDocked
                                  ? 'bg-slate-900/90 border-slate-700/80 shadow-xs'
                                  : 'bg-slate-950/60 border-dashed border-amber-500/30 opacity-75'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800/80 shrink-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <button
                                    onClick={() => togglePanelCollapse(element.id)}
                                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                                    title="Collapse to right margin tab"
                                  >
                                    <ArrowRightToLine size={11} />
                                  </button>
                                  <div className="w-5 h-5 rounded-md bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0">
                                    <Icon size={11} />
                                  </div>
                                  <span className="text-[10px] font-rounded font-bold text-white truncate">
                                    {element.shortLabel}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  {isDocked ? (
                                    <button
                                      onClick={() => onSnipOut(element.id)}
                                      className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-[8px] border border-amber-500/40 cursor-pointer transition-colors"
                                      title="Snip to map"
                                    >
                                      <Scissors size={9} />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => onDockIn(element.id)}
                                      className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[8px] border border-emerald-500/40 cursor-pointer transition-colors"
                                      title="Dock in deck"
                                    >
                                      <ArrowDownToLine size={9} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex-1 overflow-y-auto max-h-[160px] custom-scrollbar">
                                {isDocked ? (
                                  <div 
                                    style={{
                                      transform: `scale(${localZoom * 0.95})`,
                                      transformOrigin: 'top left',
                                    }}
                                  >
                                    {renderElement(element.id, true)}
                                  </div>
                                ) : (
                                  <div className="py-3 text-center">
                                    <span className="text-[8.5px] font-mono text-amber-300">Extracted on Map</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    // RESPONSIVE FLEX-GRID LAYOUT (REFLOWS & EXPANDS TO AVAILABLE VIEWPORT WIDTH)
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className={`grid gap-2.5 auto-rows-fr ${
                        isMaximized 
                          ? activeElements.length === 1 
                            ? 'grid-cols-1' 
                            : activeElements.length === 2 
                              ? 'grid-cols-1 md:grid-cols-2' 
                              : activeElements.length === 3 
                                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' 
                          : activeElements.length === 1
                            ? 'grid-cols-1'
                            : (dimensions.width > 1050 && activeElements.length >= 3)
                              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                              : (dimensions.width > 640 && activeElements.length >= 2)
                                ? 'grid-cols-1 md:grid-cols-2' 
                                : 'grid-cols-1'
                      }`}>
                        {activeElements.map(element => {
                          const isDocked = dockedState[element.id];
                          const Icon = element.icon;
                          const localZoom = panelZoomLevels[element.id] || 1.0;
                          const localPan = panelPanOffsets[element.id] || { x: 0, y: 0 };
                          const sizeTier = panelSizeTiers[element.id] || 'normal';

                          // Height styling based on tier
                          const heightClass = sizeTier === 'expanded' 
                            ? 'min-h-[380px]' 
                            : sizeTier === 'compact' 
                              ? 'min-h-[160px]' 
                              : 'min-h-[220px]';

                          return (
                            <div 
                              key={element.id} 
                              className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all min-w-0 ${heightClass} ${
                                isDocked
                                  ? 'bg-slate-900/90 border-slate-700/80 shadow-xs hover:border-slate-600'
                                  : 'bg-slate-950/60 border-dashed border-amber-500/30 opacity-75'
                              }`}
                            >
                              {/* Sub-Header with Collapse-to-Right, Resizable, Zoomable, Panable & Snip controls */}
                              <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800/80 shrink-0 select-none">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {/* Collapse to Right Margin Tab */}
                                  <button
                                    onClick={() => togglePanelCollapse(element.id)}
                                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-850 cursor-pointer transition-colors shrink-0 flex items-center gap-0.5"
                                    title="Collapse this panel to right margin tab"
                                  >
                                    <ArrowRightToLine size={11} />
                                  </button>

                                  <div className="w-5 h-5 rounded-md bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0">
                                    <Icon size={12} className={isDocked ? 'text-emerald-400' : 'text-amber-400'} />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[10.5px] font-rounded font-bold text-white truncate block">
                                      {element.shortLabel}
                                    </span>
                                  </div>
                                </div>

                                {/* Control Action Tools */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {isDocked && (
                                    <div className="flex items-center bg-slate-950/90 rounded-md p-0.5 border border-slate-800/80 gap-0.5">
                                      <button
                                        onClick={() => stepPanelZoom(element.id, -0.15)}
                                        className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                                        title="Zoom out inside panel"
                                      >
                                        <ZoomOut size={9} />
                                      </button>
                                      <button
                                        onClick={() => resetPanelTransform(element.id)}
                                        className="text-[8px] font-mono text-emerald-400 hover:underline px-0.5 cursor-pointer"
                                        title="Click to reset zoom & pan"
                                      >
                                        {Math.round(localZoom * 100)}%
                                      </button>
                                      <button
                                        onClick={() => stepPanelZoom(element.id, 0.15)}
                                        className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                                        title="Zoom in inside panel"
                                      >
                                        <ZoomIn size={9} />
                                      </button>
                                      <div 
                                        onPointerDown={(e) => handlePanelPanPointerDown(element.id, e)}
                                        className={`p-0.5 rounded cursor-grab text-slate-400 hover:text-emerald-300 ${
                                          activePanPanelId === element.id ? 'bg-emerald-500/30 text-emerald-300 cursor-grabbing' : ''
                                        }`}
                                        title="Drag to pan inside this panel"
                                      >
                                        <Move size={9} />
                                      </div>
                                      <button
                                        onClick={() => cyclePanelSizeTier(element.id)}
                                        className="px-1 py-0.2 rounded text-[7.5px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer uppercase"
                                        title={`Height tier: ${sizeTier}. Click to toggle compact/normal/expanded`}
                                      >
                                        {sizeTier === 'compact' ? 'S' : sizeTier === 'expanded' ? 'L' : 'M'}
                                      </button>
                                    </div>
                                  )}

                                  {isDocked ? (
                                    <button
                                      onClick={() => onSnipOut(element.id)}
                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-[8.5px] font-bold border border-amber-500/40 cursor-pointer shrink-0 transition-colors"
                                      title="Snip / Extract out to map"
                                    >
                                      <Scissors size={9} />
                                      <span className="hidden sm:inline">Snip</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => onDockIn(element.id)}
                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[8.5px] font-bold border border-emerald-500/40 cursor-pointer shrink-0 transition-colors"
                                      title="Put back in container"
                                    >
                                      <ArrowDownToLine size={9} />
                                      <span className="hidden sm:inline">Dock</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Element inside grid card */}
                              <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative min-h-0">
                                {isDocked ? (
                                  <div 
                                    style={{
                                      transform: `translate(${localPan.x}px, ${localPan.y}px) scale(${localZoom})`,
                                      transformOrigin: 'top left',
                                      transition: activePanPanelId === element.id ? 'none' : 'transform 0.15s ease-out',
                                    }}
                                    className="min-w-0 h-full"
                                  >
                                    {renderElement(element.id, true)}
                                  </div>
                                ) : (
                                  <div className="py-5 flex flex-col items-center justify-center text-center space-y-1">
                                    <span className="text-[9px] font-mono text-amber-300">
                                      Extracted on map canvas
                                    </span>
                                    <button
                                      onClick={() => onDockIn(element.id)}
                                      className="text-[8.5px] text-emerald-400 hover:underline font-rounded font-bold cursor-pointer"
                                    >
                                      Put back in container
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT MARGIN: DEDICATED CLOSED TABS RAIL */}
                {collapsedElements.length > 0 && (
                  <div 
                    id="deck-collapsed-tabs-rail"
                    className="w-10 sm:w-11 bg-slate-950/95 border-l border-slate-800/90 flex flex-col items-center py-2 px-0.5 gap-2 shrink-0 select-none z-10 shadow-inner"
                    title="Collapsed Panels Rail • Click any closed tab to expand back into workspace"
                  >
                    {/* Rail Header with Restore All Icon and Count */}
                    <button
                      onClick={() => setPanelCollapsed({})}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Restore all collapsed panels into workspace"
                    >
                      <ChevronsLeft size={13} />
                    </button>

                    <span className="text-[7px] font-mono font-bold text-slate-500 uppercase tracking-tighter">
                      {collapsedElements.length} TABS
                    </span>

                    <div className="w-5 h-px bg-slate-800/80 my-0.5" />

                    {/* Vertical Closed Tabs */}
                    <div className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar w-full items-center">
                      {collapsedElements.map(element => {
                        const Icon = element.icon;
                        const isDocked = dockedState[element.id];
                        return (
                          <button
                            key={element.id}
                            onClick={() => togglePanelCollapse(element.id)}
                            className="group relative flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-slate-900/90 hover:bg-emerald-950/90 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs w-full max-w-[34px]"
                            title={`Closed Tab: ${element.label} (Click to restore to workspace)`}
                          >
                            <div className="w-5 h-5 rounded-md bg-slate-800 group-hover:bg-emerald-900/80 flex items-center justify-center text-emerald-400 shrink-0">
                              <Icon size={11} />
                            </div>

                            {/* Vertical rotated text label */}
                            <span 
                              className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-300 mt-2 whitespace-nowrap"
                              style={{
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)'
                              }}
                            >
                              {element.shortLabel}
                            </span>

                            {/* Docked Status Indicator Dot */}
                            <span 
                              className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                                isDocked ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                              }`} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 8-WAY RESIZING CORNER & EDGE HANDLES (Active when not maximized) */}
          {!isMaximized && (
            <>
              {/* Top Edge */}
              <div 
                onPointerDown={(e) => handlePointerDownResize(e, 'n')}
                className="absolute top-0 inset-x-8 h-2 cursor-n-resize hover:bg-emerald-500/40 transition-colors z-40 touch-none"
                title="Drag top edge to resize height"
              />
              {/* Bottom Edge */}
              <div 
                onPointerDown={(e) => handlePointerDownResize(e, 's')}
                className="absolute bottom-0 inset-x-8 h-2 cursor-s-resize hover:bg-emerald-500/40 transition-colors z-30 touch-none"
                title="Drag bottom edge to resize height"
              />
              {/* Right Edge */}
              <div 
                onPointerDown={(e) => handlePointerDownResize(e, 'e')}
                className="absolute top-10 bottom-4 right-0 w-2 cursor-e-resize hover:bg-emerald-500/40 transition-colors z-30 touch-none"
                title="Drag right edge to resize width"
              />
              {/* Left Edge */}
              <div 
                onPointerDown={(e) => handlePointerDownResize(e, 'w')}
                className="absolute top-10 bottom-4 left-0 w-2 cursor-w-resize hover:bg-emerald-500/40 transition-colors z-30 touch-none"
                title="Drag left edge to resize width"
              />
              {/* Top-Right Corner */}
              <div 
                onPointerDown={(e) => handlePointerDownResize(e, 'ne')}
                className="absolute top-0 right-0 w-5 h-5 cursor-ne-resize hover:bg-emerald-500/40 transition-colors z-40 touch-none"
                title="Drag top-right corner to resize"
              />
              {/* Top-Left Corner */}
              <div 
                onPointerDown={(e) => handlePointerDownResize(e, 'nw')}
                className="absolute top-0 left-0 w-5 h-5 cursor-nw-resize hover:bg-emerald-500/40 transition-colors z-40 touch-none"
                title="Drag top-left corner to resize"
              />
              {/* Bottom-Right Corner (with visual grip indicator) */}
              <div 
                onPointerDown={(e) => handlePointerDownResize(e, 'se')}
                className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-center justify-center text-slate-500 hover:text-emerald-400 transition-colors z-40 touch-none"
                title="Drag to resize Elements Deck"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-70">
                  <path d="M7 1L1 7M7 4L4 7M7 7H7.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              {/* Bottom-Left Corner */}
              <div 
                onPointerDown={(e) => handlePointerDownResize(e, 'sw')}
                className="absolute bottom-0 left-0 w-5 h-5 cursor-sw-resize hover:bg-emerald-500/40 transition-colors z-40 touch-none"
                title="Drag bottom-left corner to resize"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};
