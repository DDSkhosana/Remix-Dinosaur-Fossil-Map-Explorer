import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Move, 
  Sparkles, 
  Loader2, 
  X,
  Scan,
  Compass,
  Heart,
  Stethoscope,
  Dna,
  Download
} from 'lucide-react';
import { InteractiveOrganSystemViewer } from './InteractiveOrganSystemViewer';
import { getDinosaurBlueprintFallback } from '../utils/dinosaurIllustrations';
import { DINOSAUR_DB } from '../data/dinosaurData';

interface SpecimenBlueprintViewerProps {
  blueprintImage: string | null;
  imgLoading: boolean;
  activeTaxa: string;
  onRefresh: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const SpecimenBlueprintViewer: React.FC<SpecimenBlueprintViewerProps> = ({
  blueprintImage,
  imgLoading,
  activeTaxa,
  onRefresh,
  onNavigateToTab
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState<boolean>(false);
  const [isOrganModalOpen, setIsOrganModalOpen] = useState<boolean>(false);
  
  // Modal Zoom state
  const [modalZoom, setModalZoom] = useState<number>(1);
  const [modalPan, setModalPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isModalDragging, setIsModalDragging] = useState<boolean>(false);
  const [modalDragStart, setModalDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Reset zoom & pan on taxa change
  useEffect(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setModalZoom(1);
    setModalPan({ x: 0, y: 0 });
  }, [activeTaxa]);

  // Clean up any pending animation frames on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Keyboard shortcut listener for Escape key to close modal views
  useEffect(() => {
    if (!isFullscreenModalOpen && !isOrganModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOrganModalOpen) {
          setIsOrganModalOpen(false);
        } else if (isFullscreenModalOpen) {
          setIsFullscreenModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenModalOpen, isOrganModalOpen]);

  // Card Zoom handlers
  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const animFrameRef = useRef<number | null>(null);

  // Card Pan dragging with global window listeners
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const nextX = e.clientX - dragStart.x;
      const nextY = e.clientY - dragStart.y;
      if (animFrameRef.current) return;
      animFrameRef.current = requestAnimationFrame(() => {
        setPanOffset({ x: nextX, y: nextY });
        animFrameRef.current = null;
      });
    };
    const handleUp = () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, dragStart]);

  // Modal Pan dragging with global window listeners
  const handleModalMouseDown = (e: React.MouseEvent) => {
    setIsModalDragging(true);
    setModalDragStart({ x: e.clientX - modalPan.x, y: e.clientY - modalPan.y });
  };

  useEffect(() => {
    if (!isModalDragging) return;
    const handleMove = (e: MouseEvent) => {
      const nextX = e.clientX - modalDragStart.x;
      const nextY = e.clientY - modalDragStart.y;
      if (animFrameRef.current) return;
      animFrameRef.current = requestAnimationFrame(() => {
        setModalPan({ x: nextX, y: nextY });
        animFrameRef.current = null;
      });
    };
    const handleUp = () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setIsModalDragging(false);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isModalDragging, modalDragStart]);

  const handleModalWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setModalZoom(prev => Math.min(Math.max(0.5, prev + delta), 5));
  };

  const handleExportSpecimenData = () => {
    const dinoEntry = DINOSAUR_DB.find(d => d.name.toLowerCase() === activeTaxa.toLowerCase().trim());
    
    // Construct rich, summarized JSON payload
    const exportData = {
      specimenName: activeTaxa,
      exportTimestamp: new Date().toISOString(),
      summary: dinoEntry?.summary || `${activeTaxa} Paleontological Specimen Reconstruction`,
      vitals: {
        diet: dinoEntry?.metadata?.diet || 'Unknown',
        threatLevel: dinoEntry?.metadata?.threatLevel || 'Unknown',
        packBehavior: dinoEntry?.metadata?.packBehavior || 'Unknown',
        integument: dinoEntry?.metadata?.integument || 'Unknown',
        flightCapability: dinoEntry?.metadata?.flight || 'None',
        osteologicalCompleteness: dinoEntry?.metadata?.osteologicalCompleteness ? `${dinoEntry.metadata.osteologicalCompleteness}%` : 'Unknown',
      },
      metrics: dinoEntry?.sites?.reduce((acc, site) => {
        site.stats?.forEach(stat => {
          acc[stat.label] = stat.value;
        });
        return acc;
      }, {} as Record<string, string>) || {
        LENGTH: 'Unknown',
        WEIGHT_CLASS: 'Unknown'
      },
      excavationSites: dinoEntry?.sites?.map(site => ({
        siteName: site.name,
        location: site.coordinates,
        chronostratigraphy: {
          era: site.geologicalContext?.era || 'Unknown',
          period: site.geologicalContext?.period || 'Unknown',
          age: site.geologicalContext?.age || 'Unknown',
          climate: site.geologicalContext?.climate || 'Unknown'
        },
        inventory: site.inventory?.map(inv => ({
          itemName: inv.name,
          category: inv.category,
          description: inv.description
        })) || []
      })) || []
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(exportData, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `${activeTaxa.toLowerCase().replace(/\s+/g, '_')}_specimen_summary.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const displayImage = blueprintImage || getDinosaurBlueprintFallback(activeTaxa);

  return (
    <>
      <div className="p-3.5 bg-[#ffffff] rounded-2xl border border-park-card-border shadow-xs flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden group">
        {/* Header bar with refresh and zoom actions */}
        <div className="w-full flex items-center justify-between px-1 pb-2 border-b border-slate-100 mb-2 z-10 bg-white">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-rounded font-extrabold text-park-ink-muted uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" />
              Paleontological Field Specimen
            </span>
            {zoomLevel > 1 && (
              <span className="text-[9px] font-mono font-bold text-park-tree bg-park-land/30 px-1.5 py-0.2 rounded border border-park-border-green/40">
                {Math.round(zoomLevel * 100)}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Dino Builder Studio Trigger */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateToTab) {
                  onNavigateToTab('builder');
                }
              }}
              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-lg text-[10px] font-rounded font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs mr-1"
              title={`Open interactive Dino Builder Studio for ${activeTaxa} (custom osteology, organ systems, musculature & biomechanics)`}
            >
              <Dna size={11} className="text-amber-600 animate-pulse" />
              <span>Builder</span>
            </button>

            {/* Organ Systems Direct Trigger */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateToTab) {
                  onNavigateToTab('organs');
                } else {
                  setIsOrganModalOpen(true);
                }
              }}
              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-lg text-[10px] font-rounded font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs mr-1"
              title="Inspect Dinosaur Organ Systems & Viscera"
            >
              <Heart size={11} className="text-rose-500 fill-rose-500" />
              <span>Organs</span>
            </button>

            {/* Zoom In/Out on Preview */}
            {displayImage && !imgLoading && (
              <div className="flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200">
                <button
                  onClick={handleZoomIn}
                  className="p-1 hover:bg-white text-slate-600 hover:text-park-tree rounded transition-colors"
                  title="🔍 Zoom In Blueprint View (+50%)"
                  aria-label="Zoom in blueprint view"
                >
                  <ZoomIn size={12} />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1 hover:bg-white text-slate-600 hover:text-park-tree rounded transition-colors"
                  title="🔎 Zoom Out Blueprint View (-50%)"
                  aria-label="Zoom out blueprint view"
                  disabled={zoomLevel <= 1}
                >
                  <ZoomOut size={12} className={zoomLevel <= 1 ? 'opacity-30' : ''} />
                </button>
                {zoomLevel > 1 && (
                  <button
                    onClick={handleResetZoom}
                    className="p-1 hover:bg-white text-slate-600 hover:text-park-tree rounded transition-colors text-[9px] font-mono font-bold px-1.5"
                    title="🧭 Viewport Direction: Reset Blueprint to Origin (1.0x)"
                  >
                    1x
                  </button>
                )}
                <button
                  onClick={() => setIsFullscreenModalOpen(true)}
                  className="p-1 hover:bg-white text-slate-600 hover:text-park-tree rounded transition-colors ml-0.5 border-l border-slate-200 pl-1.5"
                  title="🌐 Open Fullscreen Zoomable Anatomical Lightbox"
                  aria-label="Open fullscreen anatomical lightbox"
                >
                  <Maximize2 size={12} />
                </button>
              </div>
            )}

            <button 
              onClick={onRefresh}
              title="Refresh Specimen Reconstruction"
              className="text-[10px] font-rounded font-bold text-park-ink-muted hover:text-park-tree flex items-center gap-1 hover:bg-slate-50 px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 transition-all ml-1"
            >
              <RotateCcw size={11} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {imgLoading ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <Loader2 className="animate-spin text-park-accent-green" size={28} />
            <span className="text-[11px] font-rounded font-bold text-park-ink-muted animate-pulse">
              Rendering anatomical field blueprint...
            </span>
          </div>
        ) : displayImage ? (
          <div 
            ref={containerRef}
            className={`relative w-full h-56 sm:h-64 flex items-center justify-center bg-[#ffffff] rounded-xl overflow-hidden py-1 ${
              zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
            }`}
            onMouseDown={handleMouseDown}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY * -0.002;
                setZoomLevel(prev => {
                  const next = Math.min(3.5, Math.max(1.0, Number((prev + delta).toFixed(2))));
                  if (next === 1.0) setPanOffset({ x: 0, y: 0 });
                  return next;
                });
              }
            }}
            onClick={() => {
              if (zoomLevel === 1) setIsFullscreenModalOpen(true);
            }}
          >
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`
              }}
            >
              <img 
                src={displayImage} 
                alt={`${activeTaxa} illustration`}
                className="max-h-full max-w-full object-contain rounded-xl select-none pointer-events-none" 
                draggable={false}
              />
            </div>

            {/* Floating Zoom Hint overlay */}
            {zoomLevel === 1 && (
              <div className="absolute bottom-2 right-2 bg-slate-900/70 hover:bg-slate-900/90 text-white text-[9px] font-rounded font-bold px-2 py-0.5 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                <Scan size={10} />
                <span>Click to expand & deep zoom</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[11px] font-rounded text-park-ink-muted py-10 font-semibold">
            Awaiting Field Reconstruction...
          </div>
        )}

        {/* Interactive Integration Link into Builder & Export */}
        <div className="w-full mt-2.5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 z-10">
          <span className="text-[10px] font-rounded text-park-ink-muted font-medium flex items-center gap-1 truncate">
            <span>Anatomical suite for</span>
            <span className="font-bold text-park-tree">{activeTaxa}</span>
          </span>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {/* Export Specimen Data Button */}
            <button
              onClick={handleExportSpecimenData}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-park-tree border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-rounded font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
              title={`Export summarized vitals, metrics, and site data of ${activeTaxa} as JSON`}
            >
              <Download size={11} className="text-slate-500" />
              <span>Export Specimen Data</span>
            </button>

            <button
              onClick={() => {
                if (onNavigateToTab) onNavigateToTab('builder');
              }}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-700 via-rose-700 to-emerald-800 hover:from-amber-600 hover:to-emerald-700 text-white rounded-lg text-[10px] font-rounded font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 active:scale-95"
              title={`Launch Anatomical Synthesizer Builder Studio pre-loaded for ${activeTaxa}`}
            >
              <Dna size={12} className="text-amber-200 animate-pulse" />
              <span>Launch Dino Builder</span>
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isFullscreenModalOpen && displayImage && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col p-3 sm:p-5 animate-in select-none overflow-hidden"
          onWheel={handleModalWheel}
        >
          {/* Dedicated Always-Visible Top-Right Close Button */}
          <button
            onClick={() => setIsFullscreenModalOpen(false)}
            className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[120] bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-rounded font-bold text-[12px] px-3.5 py-2 rounded-xl shadow-2xl border border-rose-400 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Close Lightbox (Esc)"
            aria-label="Close Lightbox"
          >
            <X size={16} strokeWidth={2.5} />
            <span>Close</span>
            <kbd className="text-[10px] bg-rose-700/90 text-rose-100 px-1.5 py-0.5 rounded font-mono ml-0.5">Esc</kbd>
          </button>

          {/* Top Lightbox Toolbar */}
          <div className="flex items-center justify-between z-20 shrink-0 bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-xl gap-2 mb-2 sm:mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-park-land/20 border border-park-border-green/50 flex items-center justify-center text-park-accent-green shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-hand text-lg sm:text-xl font-bold leading-tight truncate">
                  {activeTaxa} • Anatomical Field Reconstruction
                </h3>
                <span className="text-slate-400 text-[10px] font-rounded hidden sm:block">
                  High-Precision Anatomical Specimen View • Scroll or use buttons to Zoom
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-24 sm:pr-28 shrink-0">
              {/* Dino Builder Launch Button */}
              <button
                onClick={() => {
                  setIsFullscreenModalOpen(false);
                  if (onNavigateToTab) onNavigateToTab('builder');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 flex items-center gap-1.5 transition-all text-[11px] font-rounded font-bold cursor-pointer shadow-xs"
                title={`Launch Dino Builder Studio pre-loaded for ${activeTaxa}`}
              >
                <Dna size={13} className="text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Launch Builder</span>
              </button>

              {/* Organ Systems Button */}
              <button
                onClick={() => {
                  setIsFullscreenModalOpen(false);
                  setIsOrganModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-rose-600/25 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 flex items-center gap-1.5 transition-all text-[11px] font-rounded font-bold cursor-pointer shadow-xs"
                title="Inspect Dinosaur Organ Systems & Viscera"
              >
                <Heart size={13} className="text-rose-400 fill-rose-400" />
                <span className="hidden sm:inline">Inspect Organ Systems</span>
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
                <button
                  onClick={() => setModalZoom(prev => Math.min(prev + 0.5, 5))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn size={16} />
                </button>
                <span className="text-white text-[11px] font-mono font-bold px-2">
                  {Math.round(modalZoom * 100)}%
                </span>
                <button
                  onClick={() => setModalZoom(prev => Math.max(prev - 0.5, 0.5))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={() => {
                    setModalZoom(1);
                    setModalPan({ x: 0, y: 0 });
                  }}
                  className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-[10px] font-rounded font-bold border-l border-slate-700 ml-1 cursor-pointer"
                  title="Reset View (100%)"
                >
                  Reset
                </button>
              </div>

              {/* Close Button in toolbar */}
              <button
                onClick={() => setIsFullscreenModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 hover:border-rose-500 flex items-center gap-1.5 transition-all shadow-sm font-rounded font-bold text-[11px] cursor-pointer"
                title="Close Lightbox (Esc)"
              >
                <X size={14} />
                <span className="hidden md:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Modal Main Zoom Canvas */}
          <div 
            ref={modalContainerRef}
            className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing relative rounded-2xl bg-slate-900/50 border border-slate-800"
            onMouseDown={handleModalMouseDown}
          >
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
              style={{
                transform: `scale(${modalZoom}) translate(${modalPan.x / modalZoom}px, ${modalPan.y / modalZoom}px)`
              }}
            >
              <img 
                src={displayImage} 
                alt={`${activeTaxa} anatomical blueprint`}
                className="max-h-full max-w-full object-contain rounded-xl select-none pointer-events-none drop-shadow-2xl p-2" 
                draggable={false}
              />
            </div>

            {/* Draggable Hint with Exit View Button */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-200 text-[11px] font-rounded font-medium px-4 py-2 rounded-full border border-slate-700/80 shadow-2xl flex items-center gap-3 backdrop-blur-xs z-30">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Move size={13} className="text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Drag to pan • Mouse wheel to zoom ({modalZoom.toFixed(1)}x)</span>
                <span className="sm:hidden">Drag • Scroll zoom ({modalZoom.toFixed(1)}x)</span>
              </div>
              <div className="h-3 w-px bg-slate-700" />
              <button
                onClick={() => setIsFullscreenModalOpen(false)}
                className="flex items-center gap-1 text-rose-300 hover:text-white font-bold text-[11px] transition-colors cursor-pointer shrink-0"
                title="Exit Fullscreen (Esc)"
              >
                <X size={13} strokeWidth={2.5} />
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="shrink-0 pt-2 flex items-center justify-between text-slate-400 text-[11px] font-rounded px-2">
            <span>Species: <strong className="text-white">{activeTaxa}</strong></span>
            <span className="hidden sm:inline">Gemini Neural Paleo-Reconstruction • Verified Field Blueprint</span>
            <button
              onClick={() => setIsFullscreenModalOpen(false)}
              className="text-slate-400 hover:text-rose-300 text-[11px] font-rounded underline cursor-pointer transition-colors"
            >
              Close Viewer [Esc]
            </button>
          </div>
        </div>
      )}

      {/* Interactive Organ System Viewer Lightbox Modal */}
      {isOrganModalOpen && (
        <div 
          className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in"
          onClick={() => setIsOrganModalOpen(false)}
        >
          <div 
            className="w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <InteractiveOrganSystemViewer
              taxaName={activeTaxa}
              isModal={true}
              onClose={() => setIsOrganModalOpen(false)}
              onNavigateToTab={(tab) => {
                setIsOrganModalOpen(false);
                if (onNavigateToTab) onNavigateToTab(tab);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SpecimenBlueprintViewer;
