import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search, X, Command, Sparkles } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  subLabel?: string;
  badge?: string;
  keywords?: string[];
  description?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  colorHex?: string;
  count?: number;
}

export interface ScrollableTabGroupProps {
  items: TabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  variant?: 'taxa' | 'period' | 'area' | 'climate' | 'journal' | 'metric';
  ariaLabel?: string;
  className?: string;
  searchable?: boolean;
}

export const ScrollableTabGroup: React.FC<ScrollableTabGroupProps> = ({
  items,
  activeId,
  onSelect,
  variant = 'taxa',
  ariaLabel = 'Scrollable Tabs',
  className = '',
  searchable = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  // Filter items based on searchQuery
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter(item => {
      const matchLabel = item.label.toLowerCase().includes(query);
      const matchSubLabel = item.subLabel?.toLowerCase().includes(query);
      const matchBadge = item.badge?.toLowerCase().includes(query);
      const matchDesc = item.description?.toLowerCase().includes(query);
      const matchKeywords = item.keywords?.some(k => k.toLowerCase().includes(query));
      return matchLabel || matchSubLabel || matchBadge || matchDesc || matchKeywords;
    });
  }, [items, searchQuery]);

  const updateScrollBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  const scrollToActiveTab = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!activeId) return;
    const activeEl = tabRefs.current[activeId];
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
  }, [activeId, updateScrollBounds]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToActiveTab('smooth');
    }, 40);
    return () => clearTimeout(timer);
  }, [activeId, scrollToActiveTab, filteredItems]);

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

  // Keyboard shortcut listener for '/' or Cmd/Ctrl+K to focus search
  useEffect(() => {
    if (!searchable) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isSearchOpen) {
        if (searchQuery) {
          setSearchQuery('');
        } else {
          setIsSearchOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchable, isSearchOpen, searchQuery]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollWidth > container.clientWidth) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        container.scrollLeft += e.deltaY * 0.85;
        updateScrollBounds();
      }
    }
  };

  const handleScrollClick = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;
    const scrollDelta = container.clientWidth * 0.6;
    container.scrollBy({
      left: direction === 'left' ? -scrollDelta : scrollDelta,
      behavior: 'smooth'
    });
  };

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

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredItems.length > 0) {
      onSelect(filteredItems[0].id);
      setIsSearchOpen(false);
      setSearchQuery('');
    } else if (e.key === 'Escape') {
      if (searchQuery) {
        setSearchQuery('');
      } else {
        setIsSearchOpen(false);
      }
    }
  };

  return (
    <div className={`relative flex items-center min-w-0 flex-1 group/tabscroll ${className}`}>
      {/* Search Bar / Search Trigger */}
      {searchable && (
        <div className="flex items-center shrink-0 pr-1.5 z-20">
          {isSearchOpen ? (
            <div className="flex items-center gap-1.5 bg-white border border-emerald-500/80 rounded-xl px-2 py-1 shadow-xs ring-2 ring-emerald-500/20 transition-all animate-in">
              <Search size={13} className="text-emerald-700 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search modules (e.g. Organs, Biome, Gait, Plates)..."
                className="w-40 sm:w-56 text-[11px] font-rounded text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                autoFocus
              />
              {searchQuery && (
                <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {filteredItems.length}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="p-0.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                title="Close search (Esc)"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-600 hover:text-park-tree border border-slate-200 hover:border-emerald-400/80 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 text-[10.5px] font-rounded font-bold cursor-pointer shrink-0"
              title="Search and filter dossier tabs (/ or Ctrl+K)"
            >
              <Search size={12} className="text-emerald-700" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden md:inline-block text-[8px] font-mono font-bold bg-slate-100 text-slate-500 px-1 py-0.2 rounded border border-slate-200">
                /
              </kbd>
            </button>
          )}
        </div>
      )}

      {/* Left Scroll Gradient Fade & Chevron Button with Directional Tooltip */}
      {canScrollLeft && !isSearchOpen && (
        <div className="absolute left-0 inset-y-0 flex items-center z-10 pr-3 bg-gradient-to-r from-[#faf8f2] via-[#faf8f2]/90 to-transparent pointer-events-none">
          <button
            onClick={() => handleScrollClick('left')}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/95 border border-park-card-border shadow-md flex items-center justify-center text-park-tree hover:bg-park-land/30 hover:scale-105 active:scale-95 transition-all pointer-events-auto shrink-0"
            title="⬅ Viewport Direction: Scroll Left (Preceding items)"
            aria-label="Scroll tabs left"
          >
            <ChevronLeft size={15} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Main Scrollable Tabs Container */}
      {filteredItems.length === 0 ? (
        <div className="flex items-center gap-2 py-1 px-2 text-[11px] font-rounded text-slate-500 italic">
          <span>No modules matching &quot;{searchQuery}&quot;</span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-emerald-700 font-bold not-italic hover:underline cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          aria-label={ariaLabel}
          className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full py-1 px-1 select-none ${
            isPointerDown ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {filteredItems.map((item, idx) => {
            const isActive = activeId === item.id;
            const Icon = item.icon;

            // Variant-specific styling
            if (variant === 'period') {
              return (
                <button
                  key={item.id}
                  ref={(el) => { tabRefs.current[item.id] = el; }}
                  onClick={(e) => {
                    if (hasMoved) { e.preventDefault(); return; }
                    onSelect(item.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-rounded tracking-wide border transition-all duration-200 shrink-0 flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-purple-900 text-white border-purple-900 shadow-xs font-bold scale-[1.02] ring-2 ring-purple-900/20'
                      : 'bg-white/90 border-park-card-border text-park-ink-muted hover:bg-purple-50 hover:text-purple-900 hover:border-purple-300'
                  }`}
                >
                  {Icon && <Icon size={12} className={isActive ? 'text-amber-300' : 'text-purple-700'} />}
                  <span className="font-extrabold">{item.label}</span>
                  {item.subLabel && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-purple-800 text-purple-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.subLabel}
                    </span>
                  )}
                </button>
              );
            }

            if (variant === 'area') {
              return (
                <button
                  key={item.id}
                  ref={(el) => { tabRefs.current[item.id] = el; }}
                  onClick={(e) => {
                    if (hasMoved) { e.preventDefault(); return; }
                    onSelect(item.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-rounded tracking-wide border transition-all duration-200 shrink-0 flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs font-bold scale-[1.02] ring-2 ring-emerald-800/20'
                      : 'bg-white/90 border-park-card-border text-park-ink-muted hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300'
                  }`}
                >
                  {Icon && <Icon size={12} className={isActive ? 'text-amber-300' : 'text-emerald-700'} />}
                  <span className="font-extrabold">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-50 text-emerald-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            }

            if (variant === 'climate') {
              return (
                <button
                  key={item.id}
                  ref={(el) => { tabRefs.current[item.id] = el; }}
                  onClick={(e) => {
                    if (hasMoved) { e.preventDefault(); return; }
                    onSelect(item.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-rounded tracking-wide border transition-all duration-200 shrink-0 flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-800 text-white border-amber-800 shadow-xs font-bold scale-[1.02] ring-2 ring-amber-800/20'
                      : 'bg-white/90 border-park-card-border text-park-ink-muted hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300'
                  }`}
                >
                  {Icon && <Icon size={12} className={isActive ? 'text-amber-200' : 'text-amber-600'} />}
                  <span className="font-extrabold">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-amber-700 text-amber-100' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            }

            if (variant === 'journal') {
              return (
                <button
                  key={item.id}
                  ref={(el) => { tabRefs.current[item.id] = el; }}
                  onClick={(e) => {
                    if (hasMoved) { e.preventDefault(); return; }
                    onSelect(item.id);
                  }}
                  style={{
                    animation: `journalTabSlideIn 320ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                    animationDelay: `${idx * 30}ms`
                  }}
                  className={`group relative flex items-center gap-2 py-1.5 px-3.5 rounded-xl text-[11px] font-rounded tracking-wide transition-all duration-200 text-center whitespace-nowrap shrink-0 cursor-pointer select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-park-tree to-emerald-900 text-white shadow-md border border-emerald-700/80 -translate-y-0.5 scale-[1.02] ring-2 ring-emerald-500/30 font-black'
                      : 'bg-white/95 text-slate-700 hover:text-park-tree hover:bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] hover:border-emerald-400/60 active:translate-y-0 active:scale-100 font-bold'
                  }`}
                >
                  {/* Active Glowing Indicator Bar / Highlight */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-3 right-3 h-0.5 bg-amber-400 rounded-full shadow-xs animate-pulse" />
                  )}
                  
                  {Icon && (
                    <Icon 
                      size={13} 
                      className={`transition-transform duration-200 ${
                        isActive 
                          ? 'text-amber-300 scale-110 drop-shadow-xs' 
                          : 'text-park-tree/80 group-hover:scale-115 group-hover:text-emerald-700'
                      }`} 
                    />
                  )}
                  <span className="relative z-10 font-rounded">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded-md ml-0.5 transition-all duration-200 ${
                      isActive 
                        ? 'bg-black/30 text-amber-300 border border-amber-400/30 shadow-2xs' 
                        : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-800 group-hover:border-emerald-200 border border-transparent'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            }

            if (variant === 'metric') {
              return (
                <button
                  key={item.id}
                  ref={(el) => { tabRefs.current[item.id] = el; }}
                  onClick={(e) => {
                    if (hasMoved) { e.preventDefault(); return; }
                    onSelect(item.id);
                  }}
                  className={`px-2.5 py-1.2 rounded-lg text-[10px] font-rounded font-bold transition-all duration-150 shrink-0 flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none ${
                    isActive
                      ? 'bg-park-tree text-white shadow-xs border border-park-tree font-extrabold ring-2 ring-emerald-600/30'
                      : 'bg-white/90 text-slate-700 hover:text-park-tree hover:bg-white border border-slate-200/90 shadow-2xs'
                  }`}
                >
                  {Icon && <Icon size={12} className={isActive ? 'text-amber-300' : 'text-park-tree'} />}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[8.5px] font-mono px-1 py-0.2 rounded font-bold ${
                      isActive ? 'bg-black/25 text-amber-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            }

            // Default Taxa pill style
            const pillColors = [
              'hover:border-emerald-500 hover:text-emerald-800',
              'hover:border-amber-500 hover:text-amber-800',
              'hover:border-sky-500 hover:text-sky-800',
              'hover:border-rose-500 hover:text-rose-800',
              'hover:border-purple-500 hover:text-purple-800',
              'hover:border-teal-500 hover:text-teal-800'
            ];
            const activeBg = 'bg-park-tree text-white border-park-tree shadow-xs font-bold scale-[1.03] ring-2 ring-park-tree/20';
            const inactiveBg = 'bg-white/90 border-park-card-border text-park-ink-muted hover:bg-white ' + pillColors[idx % pillColors.length];

            return (
              <button
                key={item.id}
                ref={(el) => { tabRefs.current[item.id] = el; }}
                onClick={(e) => {
                  if (hasMoved) { e.preventDefault(); return; }
                  onSelect(item.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-rounded tracking-wide border transition-all duration-200 shrink-0 flex items-center gap-1.5 whitespace-nowrap ${
                  isActive ? activeBg : inactiveBg
                }`}
              >
                {Icon && <Icon size={11} className="text-amber-300 animate-pulse" />}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-mono opacity-80">({item.badge})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Right Scroll Gradient Fade & Chevron Button with Directional Tooltip */}
      {canScrollRight && !isSearchOpen && (
        <div className="absolute right-0 inset-y-0 flex items-center z-10 pl-3 bg-gradient-to-l from-[#faf8f2] via-[#faf8f2]/90 to-transparent pointer-events-none">
          <button
            onClick={() => handleScrollClick('right')}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/95 border border-park-card-border shadow-md flex items-center justify-center text-park-tree hover:bg-park-land/30 hover:scale-105 active:scale-95 transition-all pointer-events-auto shrink-0"
            title="➡ Viewport Direction: Scroll Right (Subsequent items)"
            aria-label="Scroll tabs right"
          >
            <ChevronRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ScrollableTabGroup;

