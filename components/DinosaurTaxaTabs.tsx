import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import { DINOSAUR_DB } from '../data/dinosaurData';

interface DinosaurTaxaTabsProps {
  taxaList: string[];
  activeTaxa: string;
  onSelectTaxa: (taxa: string) => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export type TaxaDensity = 'compact' | 'normal' | 'large';

export const DinosaurTaxaTabs: React.FC<DinosaurTaxaTabsProps> = ({
  taxaList,
  activeTaxa,
  onSelectTaxa,
  onToggleCollapse
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  
  // Zoom / Density state: 'compact' (dense), 'normal' (standard), 'large' (prominent)
  const [density, setDensity] = useState<TaxaDensity>('normal');

  const updateScrollBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollPercentage((scrollLeft / maxScroll) * 100);
    } else {
      setScrollPercentage(0);
    }
  }, []);

  const scrollToActiveTab = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!activeTaxa) return;
    const activeEl = tabRefs.current[activeTaxa];
    const container = containerRef.current;
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      
      const currentScroll = container.scrollLeft;
      const targetScroll = 
        currentScroll + 
        (activeRect.left - containerRect.left) - 
        (containerRect.width / 2) + 
        (activeRect.width / 2);
      
      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior
      });
      updateScrollBounds();
    }
  }, [activeTaxa, updateScrollBounds]);

  // Center active tab when activeTaxa changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToActiveTab('smooth');
    }, 40);
    return () => clearTimeout(timer);
  }, [activeTaxa, scrollToActiveTab, density]);

  // Listen to container resizing, window viewport area changes, and scroll events
  useEffect(() => {
    updateScrollBounds();
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => updateScrollBounds();
    container.addEventListener('scroll', handleScroll, { passive: true });

    let resizeTimer: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      updateScrollBounds();
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        scrollToActiveTab('auto');
      }, 60);
    });

    resizeObserver.observe(container);
    if (container.parentElement) {
      resizeObserver.observe(container.parentElement);
    }

    window.addEventListener('resize', updateScrollBounds);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScrollBounds);
      clearTimeout(resizeTimer);
    };
  }, [updateScrollBounds, scrollToActiveTab]);

  // Convert vertical mouse wheel scroll to horizontal scrolling when cursor is over the tabs
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollWidth > container.clientWidth) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        container.scrollLeft += e.deltaY * 0.9;
        updateScrollBounds();
      }
    }
  };

  const handleScrollClick = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;
    const scrollDelta = container.clientWidth * 0.65;
    container.scrollBy({
      left: direction === 'left' ? -scrollDelta : scrollDelta,
      behavior: 'smooth'
    });
  };

  const handleJumpToExtreme = (target: 'start' | 'end') => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      left: target === 'start' ? 0 : container.scrollWidth,
      behavior: 'smooth'
    });
  };

  const cycleZoomDensity = () => {
    setDensity(prev => {
      if (prev === 'compact') return 'normal';
      if (prev === 'normal') return 'large';
      return 'compact';
    });
  };

  const zoomIn = () => {
    setDensity(prev => (prev === 'compact' ? 'normal' : 'large'));
  };

  const zoomOut = () => {
    setDensity(prev => (prev === 'large' ? 'normal' : 'compact'));
  };

  // Drag-to-scroll support for touch and mouse
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    setIsPointerDown(true);
    setDragStartX(e.pageX - container.offsetLeft);
    setDragScrollLeft(container.scrollLeft);
    setHasMoved(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPointerDown) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragStartX) * 1.2;
    if (Math.abs(walk) > 4) {
      setHasMoved(true);
    }
    container.scrollLeft = dragScrollLeft - walk;
    updateScrollBounds();
  };

  const handleMouseUpOrLeave = () => {
    setIsPointerDown(false);
  };

  // Map taxon metadata from database for instant period & density visibility
  const taxaMetaMap = useMemo(() => {
    const map: Record<string, { periodCode: string; periodColor: string; sitesCount: number; diet: string; periodName: string }> = {};
    DINOSAUR_DB.forEach(d => {
      const period = d.sites[0]?.geologicalContext.period || '';
      let code = 'K';
      let color = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      if (period.toLowerCase().includes('jurassic')) {
        code = 'J';
        color = 'bg-sky-100 text-sky-800 border-sky-300';
      } else if (period.toLowerCase().includes('triassic')) {
        code = 'Tr';
        color = 'bg-amber-100 text-amber-800 border-amber-300';
      }
      map[d.name] = {
        periodCode: code,
        periodColor: color,
        sitesCount: d.sites.length,
        diet: d.metadata.diet,
        periodName: period || 'Mesozoic'
      };
    });
    return map;
  }, []);

  // Find active index to calculate directional position in roster
  const activeIndex = taxaList.indexOf(activeTaxa);
  const totalTaxa = taxaList.length;

  return (
    <div className="relative flex items-center min-w-0 flex-1 group/taxabar select-none">
      {/* Left Scroll Gradient Fade & Directional Chevron Tools */}
      {canScrollLeft && (
        <div className="absolute left-0 inset-y-0 flex items-center gap-1 z-20 pr-5 bg-gradient-to-r from-[#faf8f2] via-[#faf8f2]/95 to-transparent">
          {/* Jump to Beginning tool with minimal direction tooltip */}
          <button
            onClick={() => handleJumpToExtreme('start')}
            className="w-6 h-6 rounded-lg bg-white/95 border border-park-card-border shadow-xs flex items-center justify-center text-park-ink-muted hover:text-park-tree hover:bg-park-land/20 active:scale-95 transition-all text-[10px]"
            title="⇤ Viewport Direction: Jump to Earliest Taxa (West / Start of Roster)"
            aria-label="Jump to start of taxa list"
          >
            <ChevronsLeft size={13} strokeWidth={2.5} />
          </button>

          {/* Scroll Left tool with minimal direction tooltip */}
          <button
            onClick={() => handleScrollClick('left')}
            className="w-7 h-7 rounded-full bg-white/95 border border-park-card-border shadow-md flex items-center justify-center text-park-tree hover:bg-park-land/30 hover:scale-105 active:scale-95 transition-all"
            title={`⬅ Viewport Direction: Scroll West (${Math.max(0, activeIndex)} preceding taxa)`}
            aria-label="Scroll dinosaur taxa left"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Main Scrollable Dinosaur ID Tabs Container */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex items-center overflow-x-auto no-scrollbar scroll-smooth w-full py-1 px-1.5 ${
          density === 'compact' ? 'gap-1.5' : density === 'large' ? 'gap-2.5' : 'gap-2'
        } ${isPointerDown ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {taxaList.map((taxonName, idx) => {
          const isActive = activeTaxa === taxonName;
          const pillColors = [
            'hover:border-emerald-500 hover:text-emerald-800',
            'hover:border-amber-500 hover:text-amber-800',
            'hover:border-sky-500 hover:text-sky-800',
            'hover:border-rose-500 hover:text-rose-800',
            'hover:border-purple-500 hover:text-purple-800',
            'hover:border-teal-500 hover:text-teal-800'
          ];
          const activeBg = 'bg-park-tree text-white border-park-tree shadow-xs font-bold ring-2 ring-park-tree/20';
          const inactiveBg = 'bg-white/90 border-park-card-border text-park-ink-muted hover:bg-white ' + pillColors[idx % pillColors.length];

          // Padding and typography sizes based on zoom density
          const sizeClasses = 
            density === 'compact'
              ? 'px-2.5 py-1 text-[10px]'
              : density === 'large'
              ? 'px-4 py-2 text-[12.5px]'
              : 'px-3.5 py-1.5 text-[11px]';

          const meta = taxaMetaMap[taxonName];
          const tooltip = meta 
            ? `Taxon #${idx + 1} of ${totalTaxa}: ${taxonName} (${meta.periodName}, ${meta.diet}, ${meta.sitesCount} ${meta.sitesCount === 1 ? 'excavation site' : 'excavation sites'}) • Click to focus map & field dossier`
            : `Taxon #${idx + 1} of ${totalTaxa}: ${taxonName} • Click to focus map & field dossier`;

          return (
            <button
              key={taxonName}
              ref={(el) => {
                tabRefs.current[taxonName] = el;
              }}
              onClick={(e) => {
                if (hasMoved) {
                  e.preventDefault();
                  return;
                }
                onSelectTaxa(taxonName);
              }}
              title={tooltip}
              className={`rounded-full font-rounded tracking-wide border transition-all duration-150 shrink-0 flex items-center gap-1.5 whitespace-nowrap ${sizeClasses} ${
                isActive ? activeBg : inactiveBg
              }`}
            >
              {isActive && <Sparkles size={density === 'compact' ? 9 : 11} className="text-amber-300 animate-pulse" />}
              <span>{taxonName}</span>
              {meta && (
                <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded border ${
                  isActive ? 'bg-white/20 text-white border-white/30' : meta.periodColor
                }`}>
                  {meta.periodCode}
                </span>
              )}
              {density !== 'compact' && meta && (
                <span className={`text-[8.5px] font-mono ${isActive ? 'text-amber-200' : 'text-slate-400'}`}>
                  {meta.sitesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Scroll Gradient Fade & Directional Chevron Tools */}
      {canScrollRight && (
        <div className="absolute right-0 inset-y-0 flex items-center gap-1 z-20 pl-5 bg-gradient-to-l from-[#faf8f2] via-[#faf8f2]/95 to-transparent">
          {/* Scroll Right tool with minimal direction tooltip */}
          <button
            onClick={() => handleScrollClick('right')}
            className="w-7 h-7 rounded-full bg-white/95 border border-park-card-border shadow-md flex items-center justify-center text-park-tree hover:bg-park-land/30 hover:scale-105 active:scale-95 transition-all"
            title={`➡ Viewport Direction: Scroll East (${Math.max(0, totalTaxa - activeIndex - 1)} subsequent taxa)`}
            aria-label="Scroll dinosaur taxa right"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>

          {/* Jump to End tool with minimal direction tooltip */}
          <button
            onClick={() => handleJumpToExtreme('end')}
            className="w-6 h-6 rounded-lg bg-white/95 border border-park-card-border shadow-xs flex items-center justify-center text-park-ink-muted hover:text-park-tree hover:bg-park-land/20 active:scale-95 transition-all text-[10px]"
            title="⇥ Viewport Direction: Jump to Latest Taxa (East / End of Roster)"
            aria-label="Jump to end of taxa list"
          >
            <ChevronsRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Minimalist Zoom / Density Control with Directional & Scale Tooltips */}
      <div className="hidden md:flex items-center gap-0.5 ml-2 pl-2 border-l border-park-card-border/80 shrink-0">
        <button
          onClick={zoomOut}
          disabled={density === 'compact'}
          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
            density === 'compact'
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-park-ink-muted hover:text-park-tree hover:bg-park-land/20'
          }`}
          title="🔍 Zoom Out Taxa Toolbar: Compact View (Displays more taxa in viewport)"
          aria-label="Zoom out taxa toolbar"
        >
          <ZoomOut size={12} />
        </button>

        <button
          onClick={cycleZoomDensity}
          className="px-1.5 py-0.5 rounded-md bg-white border border-park-card-border text-[9px] font-mono font-bold text-park-tree hover:bg-park-land/20 transition-colors shadow-2xs"
          title={`Viewport Density: ${density.toUpperCase()} (Click to toggle Compact / Normal / Large)`}
        >
          {density === 'compact' ? '75%' : density === 'large' ? '125%' : '100%'}
        </button>

        <button
          onClick={zoomIn}
          disabled={density === 'large'}
          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
            density === 'large'
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-park-ink-muted hover:text-park-tree hover:bg-park-land/20'
          }`}
          title="🔎 Zoom In Taxa Toolbar: Large View (Enlarges button targets)"
          aria-label="Zoom in taxa toolbar"
        >
          <ZoomIn size={12} />
        </button>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1 px-2 py-0.5 ml-1.5 rounded-lg bg-white border border-park-card-border text-park-tree text-[10px] font-rounded font-bold hover:bg-park-land/30 hover:border-park-tree/40 transition-all cursor-pointer shadow-3xs shrink-0"
            title="Collapse Dinosaurs & Filters Panel to maximize map viewport"
            aria-label="Collapse Dinosaurs & Filters Panel"
          >
            <ChevronUp size={12} />
            <span className="hidden sm:inline">Collapse</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DinosaurTaxaTabs;
