import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Columns, Maximize2, Minimize2 } from 'lucide-react';

interface ResizableSplitterProps {
  onResize: (newWidth: number) => void;
  currentWidth: number;
  minWidth?: number;
  maxWidth?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onResetDefault?: () => void;
  onMaximizeMap?: () => void;
  onMaximizeDossier?: () => void;
}

export const ResizableSplitter: React.FC<ResizableSplitterProps> = ({
  onResize,
  currentWidth,
  minWidth = 320,
  maxWidth,
  isCollapsed = false,
  onToggleCollapse,
  onResetDefault,
  onMaximizeMap,
  onMaximizeDossier
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth;
      const newWidth = windowWidth - e.clientX;
      
      // Snap collapse: if dragged near right edge (remaining dossier < 200px), collapse dossier -> 100% Map
      if (newWidth < 200 && onMaximizeMap) {
        onMaximizeMap();
        setIsDragging(false);
        return;
      }
      
      // Snap collapse: if dragged near left edge (remaining map < 200px), collapse map -> 100% Dossier
      if (e.clientX < 200 && onMaximizeDossier) {
        onMaximizeDossier();
        setIsDragging(false);
        return;
      }

      const calculatedMaxWidth = maxWidth || windowWidth - 180;
      if (newWidth >= minWidth && newWidth <= calculatedMaxWidth) {
        onResize(newWidth);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const windowWidth = window.innerWidth;
      const newWidth = windowWidth - touch.clientX;
      
      if (newWidth < 200 && onMaximizeMap) {
        onMaximizeMap();
        setIsDragging(false);
        return;
      }
      if (touch.clientX < 200 && onMaximizeDossier) {
        onMaximizeDossier();
        setIsDragging(false);
        return;
      }

      const calculatedMaxWidth = maxWidth || windowWidth - 180;
      if (newWidth >= minWidth && newWidth <= calculatedMaxWidth) {
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, minWidth, maxWidth, onResize, onMaximizeMap, onMaximizeDossier]);

  return (
    <>
      {/* Fullscreen transparent overlay while dragging to keep mouse events fluid over maps & iframes */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
      )}

      <div
        className={`relative flex items-center justify-center w-4 -mx-2 z-30 group cursor-col-resize select-none transition-colors ${
          isDragging ? 'bg-park-accent-green/25' : 'hover:bg-park-land/30'
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={onResetDefault}
        title="Drag to resize • Drag left for Fullscreen Dossier • Drag right for Fullscreen Map • Double-click to reset"
      >
        {/* Visual vertical divider line */}
        <div
          className={`w-[2.5px] h-full transition-colors duration-150 ${
            isDragging
              ? 'bg-park-accent-green shadow-[0_0_10px_rgba(16,185,129,0.7)]'
              : isHovered
              ? 'bg-park-tree'
              : 'bg-park-card-border'
          }`}
        />

        {/* Floating Quick Action Pill on Hover */}
        {isHovered && !isDragging && (
          <div className="absolute top-12 -left-28 bg-slate-950/95 text-white text-[9.5px] font-rounded font-semibold px-2 py-1 rounded-xl shadow-xl backdrop-blur-md z-40 border border-slate-700/80 flex items-center gap-1.5 animate-in pointer-events-auto select-none">
            {onMaximizeDossier && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMaximizeDossier();
                }}
                className="hover:text-emerald-300 p-0.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-0.5 cursor-pointer"
                title="Fullscreen Dossier (100% viewport width)"
              >
                <ChevronLeft size={12} />
                <span>100% Dossier</span>
              </button>
            )}

            <span className="text-slate-600">|</span>

            {onResetDefault && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onResetDefault();
                }}
                className="hover:text-amber-300 p-0.5 rounded hover:bg-slate-800 transition-colors font-mono cursor-pointer"
                title="Reset to 50/50 Balanced Split"
              >
                Split
              </button>
            )}

            <span className="text-slate-600">|</span>

            {onMaximizeMap && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMaximizeMap();
                }}
                className="hover:text-emerald-300 p-0.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-0.5 cursor-pointer"
                title="Fullscreen Map (100% viewport width)"
              >
                <span>100% Map</span>
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ResizableSplitter;
