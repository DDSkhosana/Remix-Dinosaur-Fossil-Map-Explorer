import sys

with open('components/EvolutionaryChronologyMap.tsx', 'r') as f:
    text = f.read()

return_idx = text.find('  return (\n    <div className="w-full bg-white rounded-2xl border border-park-card-border')
if return_idx == -1:
    print('Error finding return block')
    sys.exit(1)

before_return = text[:return_idx]

new_return = '''  return (
    <div className="w-full bg-white rounded-2xl border border-park-card-border p-3.5 sm:p-4 space-y-3.5 shadow-xs text-park-ink">
      
      {/* 1. TOP STAGE: CONTINENTAL DRIFT 3D PROJECTION & PALAEOGEOGRAPHY GRAPHIC */}
      {(viewLayoutMode === 'split' || viewLayoutMode === 'drift') && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3.5 text-white flex flex-col justify-between space-y-3 relative overflow-hidden shadow-lg min-w-0">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 z-10 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Compass size={14} className="text-amber-400" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider block">
                  Continental Drift Projection ({activeAgeMa} Ma)
                </span>
                <span className="text-[9px] font-rounded text-slate-400">
                  Interactive 3D Spherical Landmass Tectonics
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9.5px] font-mono bg-slate-900 text-slate-300 px-2.5 py-0.5 rounded-lg border border-slate-700">
                {activeEvent.continentLayout}
              </span>
              <div className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-mono text-[10px] font-black shadow-xs flex items-center gap-1">
                <Sparkles size={10} className="text-slate-950 animate-pulse" />
                <span>{activeAgeMa} Ma</span>
              </div>
            </div>
          </div>

          {/* Interactive Drag-to-Spin 3D Continental Drift Globe Visualization */}
          <div 
            className="relative w-full h-56 sm:h-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden p-2 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            <div className="absolute top-2 left-3 text-[9px] font-mono text-slate-400 flex items-center gap-1.5 pointer-events-none z-20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              <span>Drag to Rotate 3D Globe ({rotation.toFixed(0)}°)</span>
            </div>

            {/* SVG 3D Globe Container */}
            <svg viewBox="0 0 400 200" className="w-full h-full relative z-10 drop-shadow-[0_0_20px_rgba(56,189,248,0.15)]">
              <defs>
                {/* 3D sphere depth ocean background */}
                <radialGradient id="globe-ocean" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="50%" stopColor="#090d16" />
                  <stop offset="100%" stopColor="#02040a" />
                </radialGradient>
                {/* 3D atmosphere rim highlight */}
                <radialGradient id="globe-atmosphere" cx="50%" cy="50%" r="50%">
                  <stop offset="88%" stopColor="#000000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
                </radialGradient>
                
                <clipPath id="globe-clip">
                  <circle cx={cx} cy={cy} r={R} />
                </clipPath>

                {/* Spreading Displacement Vector Arrow markers */}
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0,1 L 10,5 L 0,9 Z" fill="#facc15" />
                </marker>
              </defs>

              {/* Ocean Sphere base */}
              <circle cx={cx} cy={cy} r={R} fill="url(#globe-ocean)" stroke="#38bdf8" strokeWidth="1.2" />

              {/* Clip everything to globe sphere */}
              <g clipPath="url(#globe-clip)">
                {/* Latitude parallels (Curved in 3D projection) */}
                {[-60, -30, 0, 30, 60].map((lat) => {
                  const y = cy - (lat / 90) * R * 0.9;
                  const rLat = Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy)));
                  return (
                    <ellipse
                      key={lat}
                      cx={cx}
                      cy={y}
                      rx={rLat}
                      ry={rLat * 0.22}
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="0.7"
                      strokeDasharray="2,3"
                    />
                  );
                })}

                {/* Longitude meridians (Rotating curves) */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const mDeg = (i * 30 + rotation) % 360;
                  const rad = (mDeg * Math.PI) / 180;
                  const xOffset = Math.sin(rad) * R;
                  const isVisible = Math.cos(rad) > 0;
                  if (!isVisible) return null;
                  return (
                    <ellipse
                      key={i}
                      cx={cx + xOffset * 0.15}
                      cy={cy}
                      rx={Math.abs(Math.sin(rad) * R)}
                      ry={R}
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="0.6"
                      strokeOpacity="0.7"
                    />
                  );
                })}

                {/* Dynamic Continental Landmasses with Subtly Shifting Mesozoic Rifting */}
                {/* 1. Laurasia (North America, Greenland, Eurasia) */}
                {render3DContinent(
                  laurasiaBase,
                  (1 - driftProgress) * -12 + (activeAgeMa < 100 ? 5 : 0),
                  (1 - driftProgress) * 18 - 10,
                  '#059669',
                  '#34d399'
                )}

                {/* 2. Gondwana / South America & Africa */}
                {render3DContinent(
                  gondwanaBase,
                  (1 - driftProgress) * 15 - 5,
                  (1 - driftProgress) * -15 + 5,
                  '#d97706',
                  '#fbbf24'
                )}

                {/* 3. India Island Continent (Speeding toward Asia) */}
                {render3DContinent(
                  indiaBase,
                  -25 + (1 - driftProgress) * -20 + (driftProgress * 30),
                  20 + (driftProgress * 25),
                  '#dc2626',
                  '#f87171'
                )}

                {/* Oceanic Seaway Rifting & Mid-Ocean Ridge Active Divergence Lines */}
                {activeAgeMa < 180 && (
                  <path
                    d={`M ${cx - 20},${cy - 30} Q ${cx - 5},${cy} ${cx + 10},${cy + 45}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                    className="animate-pulse"
                  />
                )}

                {/* Mid-Atlantic Rifting Spreading Vectors */}
                {activeAgeMa <= 140 && (
                  <g stroke="#facc15" strokeWidth="1">
                    <line x1={cx - 15} y1={cy - 10} x2={cx - 30} y2={cy - 12} markerEnd="url(#arrow)" />
                    <line x1={cx + 5} y1={cy - 10} x2={cx + 20} y2={cy - 8} markerEnd="url(#arrow)" />
                  </g>
                )}

                {/* Active Impact Crater Marker if K-Pg boundary */}
                {activeAgeMa <= 68 && (
                  <g transform={`translate(${cx - 38}, ${cy + 5})`}>
                    <circle cx="0" cy="0" r="14" fill="#ef4444" fillOpacity="0.25" className="animate-ping" />
                    <circle cx="0" cy="0" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="8" y="3" fill="#fca5a5" fontSize="7" fontWeight="bold" fontFamily="monospace">Chicxulub</text>
                  </g>
                )}
              </g>

              {/* 3D Atmospheric Rim Glow Overlay */}
              <circle cx={cx} cy={cy} r={R} fill="url(#globe-atmosphere)" pointerEvents="none" />
            </svg>

            {/* Bottom Latitude / Drift Progress Slider */}
            <div className="absolute bottom-2 left-3 right-3 bg-slate-900/90 backdrop-blur-xs p-1.5 rounded-lg border border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-300 pointer-events-none">
              <span>250 Ma (Pangea)</span>
              <div className="flex-1 mx-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-400 transition-all duration-500" 
                  style={{ width: `${driftProgress * 100}%` }}
                />
              </div>
              <span>66 Ma (Seaways)</span>
            </div>
          </div>

          {/* Tectonic Strain & Volcanic Outgassing Metrics Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono">
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[8px] uppercase">Spreading Rate</span>
              <strong className="text-amber-400">{(2.4 + driftProgress * 2.8).toFixed(1)} cm/yr</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[8px] uppercase">Paleolatitude</span>
              <strong className="text-cyan-400">{Math.round(48.2 - driftProgress * 11.5)}°N</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[8px] uppercase">CO₂ Outgassing</span>
              <strong className="text-emerald-400">{(1.2 + (1 - driftProgress) * 1.6).toFixed(1)} Gt/yr</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[8px] uppercase">Sea Level Delta</span>
              <strong className="text-teal-400">+{Math.round(80 + driftProgress * 170)}m</strong>
            </div>
          </div>

          <div className="text-[10px] font-rounded text-slate-300 flex items-center justify-between">
            <span>Tectonic State: <strong className="text-emerald-400">{activeEvent.continentLayout}</strong></span>
            <span>Drift Index: <strong className="text-amber-300">{(driftProgress * 100).toFixed(0)}% Dispersal</strong></span>
          </div>
        </div>
      )}

      {/* 2. MASTER COORDINATED HEADER RIBBON (Positioned below the 3D graphic) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-park-card-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
            <Globe size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-rounded font-extrabold text-park-accent-green uppercase tracking-wider">
                Paleotectonics & Geochronology
              </span>
              <span className="text-slate-400 text-[10px]" aria-hidden="true">·</span>
              <span className="text-[9.5px] font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.2 rounded-md border border-amber-300/60">
                {activeAgeMa} Ma
              </span>
            </div>
            <h4 className="text-[13px] sm:text-[14px] font-rounded font-extrabold text-park-tree leading-snug">
              Evolutionary Events & Continental Drift Map
            </h4>
            <p className="text-[10px] font-rounded text-park-ink-muted leading-tight">
              Synchronized plate tectonics, evolutionary landmarks & dinosaur lineages
            </p>
          </div>
        </div>

        {/* Chrono-Stratigraphy Time Lapse Player Control (Minimal Size Styling) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsTectonicLapsePlaying(!isTectonicLapsePlaying)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-rounded font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs active:scale-95 ${
              isTectonicLapsePlaying 
                ? 'bg-rose-600 text-white animate-pulse' 
                : 'bg-park-tree text-white hover:bg-park-tree/90'
            }`}
            title="Play automatic timeline film of geological plate tectonics & drift from 250 Ma to 66 Ma"
          >
            {isTectonicLapsePlaying ? <Pause size={11} /> : <Play size={11} />}
            <span>{isTectonicLapsePlaying ? 'Pause' : 'Play Timelapse'}</span>
          </button>

          <span className="text-[9.5px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-600" />
            <span>Synced ({activeAgeMa} Ma)</span>
          </span>
        </div>
      </div>

      {/* 3. INTERACTIVE GEOLOGICAL TIME RANGE SCRUB SLIDER (Positioned below header) */}
      <div className="bg-white p-3 rounded-2xl border border-park-card-border shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0">
              <Clock size={13} />
            </div>
            <div>
              <span className="text-[11px] font-rounded font-extrabold text-park-tree uppercase tracking-wider block">
                Interactive Geological Time Slider (Scrub 252 Ma → 66 Ma)
              </span>
              <span className="text-[9.5px] font-mono text-park-ink-muted">
                Drag slider to continuously simulate plate tectonics & faunal turnover
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Segmented Controls (Minimal Size Styling) */}
            <div className="flex items-center gap-1 bg-park-card-muted/80 p-0.5 sm:p-1 rounded-xl border border-park-card-border/60 text-[9.5px] font-rounded font-bold">
              {(['split', 'drift', 'lineages'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewLayoutMode(mode)}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    viewLayoutMode === mode
                      ? 'bg-park-tree text-white shadow-2xs font-extrabold'
                      : 'text-park-ink-muted hover:text-park-tree hover:bg-white/60'
                  }`}
                >
                  {mode === 'split' ? 'Split View' : mode === 'drift' ? 'Drift Focus' : 'Lineages Focus'}
                </button>
              ))}
            </div>

            {/* Active Age Badge */}
            <div className="px-2 py-0.5 rounded-lg bg-amber-500 text-white font-mono text-xs font-extrabold shadow-3xs flex items-center gap-1">
              <Sparkles size={11} className="text-amber-200 animate-pulse" />
              <span>{activeAgeMa} Ma</span>
            </div>
          </div>
        </div>

        {/* Continuous Range Scrub Slider */}
        <div className="space-y-1.5 pt-1">
          <input
            type="range"
            min="0"
            max="186"
            step="1"
            value={252 - activeAgeMa}
            onChange={(e) => {
              const newMa = 252 - Number(e.target.value);
              onSelectAgeMa(newMa);
            }}
            className="w-full h-2.5 bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />

          {/* Geological Periods Milestones beneath track */}
          <div className="flex justify-between text-[8.5px] font-mono font-bold text-park-ink-muted">
            <span className={activeAgeMa >= 201 ? 'text-emerald-700 font-extrabold' : ''}>
              252 Ma (Triassic Dawn)
            </span>
            <span className={activeAgeMa >= 145 && activeAgeMa < 201 ? 'text-amber-700 font-extrabold' : ''}>
              201 Ma (Jurassic Rifting)
            </span>
            <span className={activeAgeMa >= 66 && activeAgeMa < 145 ? 'text-rose-700 font-extrabold' : ''}>
              145 Ma (Cretaceous Dispersal)
            </span>
            <span className={activeAgeMa <= 68 ? 'text-red-700 font-extrabold' : ''}>
              66 Ma (K-Pg Extinction)
            </span>
          </div>
        </div>
      </div>

      {/* 4. DINOSAUR EVOLUTIONARY GRAPHICS & LINEAGES VIEWPORT */}
      {(viewLayoutMode === 'split' || viewLayoutMode === 'lineages') && (
        <div className="bg-white rounded-2xl border border-park-card-border p-3.5 flex flex-col justify-between space-y-3 shadow-xs overflow-y-auto custom-scrollbar max-h-[390px] min-w-0">
          <div className="flex items-center justify-between border-b border-park-card-border pb-2">
            <div className="flex items-center gap-1.5">
              <Dna size={14} className="text-emerald-700" />
              <span className="text-[11px] font-rounded font-extrabold text-park-tree uppercase tracking-wider">
                Dinosaur Evolutionary Lineages & Graphics
              </span>
            </div>
            <span className="text-[9.5px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              {activeEvent.period}
            </span>
          </div>

          {/* Lineages Graphics Matrix */}
          <div className="space-y-2">
            <div className="text-[10px] font-rounded font-bold text-park-ink-muted uppercase tracking-wider">
              Dominant Faunal Guilds at {activeAgeMa} Ma:
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  🦖
                </div>
                <div>
                  <div className="text-[11px] font-rounded font-extrabold text-emerald-950">Theropoda</div>
                  <div className="text-[9px] font-mono text-emerald-800">Bipedal Carnivores & Birds</div>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  🦕
                </div>
                <div>
                  <div className="text-[11px] font-rounded font-extrabold text-amber-950">Sauropodomorpha</div>
                  <div className="text-[9px] font-mono text-amber-800">Long-Necked Gigantic Herbivores</div>
                </div>
              </div>

              <div className="p-2.5 bg-cyan-50/80 rounded-xl border border-cyan-200 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  🛡️
                </div>
                <div>
                  <div className="text-[11px] font-rounded font-extrabold text-cyan-950">Thyreophora</div>
                  <div className="text-[9px] font-mono text-cyan-800">Armored Stegosaurs & Ankylosaurs</div>
                </div>
              </div>

              <div className="p-2.5 bg-purple-50/80 rounded-xl border border-purple-200 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  👑
                </div>
                <div>
                  <div className="text-[11px] font-rounded font-extrabold text-purple-950">Marginocephalia</div>
                  <div className="text-[9px] font-mono text-purple-800">Ceratopsians & Pachycephalosaurs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Taxa in Horizon */}
          <div className="p-2.5 bg-park-sand/40 rounded-xl border border-park-card-border space-y-1">
            <div className="text-[9.5px] font-rounded font-bold text-park-tree uppercase flex items-center gap-1">
              <Footprints size={12} className="text-amber-600" />
              <span>Key Specimen Fossils Recorded in Horizon:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {activeEvent.keyTaxa.map((taxa, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectTaxon && onSelectTaxon(taxa)}
                  className={`text-[9.5px] font-mono px-2 py-0.5 rounded border font-bold transition-all ${
                    onSelectTaxon ? 'cursor-pointer hover:bg-amber-100 hover:border-amber-400' : ''
                  } ${taxa.toLowerCase() === activeTaxaName.toLowerCase() ? 'bg-amber-500 text-white border-amber-600 shadow-2xs' : 'bg-white text-park-tree border-park-card-border'}`}
                  title={onSelectTaxon ? `Click to inspect ${taxa} in Observatory` : taxa}
                >
                  {taxa}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. MAJOR EVOLUTIONARY EVENTS CONTINUUM TRACKER (Collapsible for zero-scroll fold) */}
      <div className="space-y-2 pt-2 border-t border-park-card-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-600" />
            <h4 className="text-[11px] font-rounded font-extrabold text-park-tree uppercase tracking-wider">
              Geological Evolutionary Landmark Events Tracker
            </h4>
          </div>
          <button
            onClick={() => setShowBottomEventsTracker(!showBottomEventsTracker)}
            className="text-[9.5px] font-mono px-2.5 py-1 rounded-xl bg-white hover:bg-park-sand/60 border border-park-card-border font-bold text-park-tree flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
          >
            <span>{showBottomEventsTracker ? '▲ Collapse Events' : '▼ Expand All 8 Events'}</span>
          </button>
        </div>

        {/* Scrollable Horizontal Event Cards */}
        {showBottomEventsTracker && (
        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar animate-in">
          {EVOLUTIONARY_EVENTS.map((evt) => {
            const isSelected = evt.id === activeEvent.id;
            return (
              <div
                key={evt.id}
                onClick={() => {
                  setSelectedEventId(evt.id);
                  onSelectAgeMa(evt.ageMa);
                }}
                className={`w-72 p-3 rounded-xl border transition-all cursor-pointer shrink-0 space-y-2 select-none ${
                  isSelected
                    ? 'bg-amber-950 text-white border-amber-500 shadow-md ring-2 ring-amber-400/50 scale-102'
                    : 'bg-white hover:bg-park-sand/50 text-park-ink border-park-card-border shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                    evt.type === 'extinction'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : evt.type === 'climate'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : evt.type === 'tectonic'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {evt.type}
                  </span>
                  <span className="text-[10px] font-mono font-extrabold text-amber-300">
                    {evt.ageMa} Ma
                  </span>
                </div>

                <div>
                  <h5 className={`text-xs font-rounded font-bold leading-tight ${isSelected ? 'text-white' : 'text-park-tree'}`}>
                    {evt.title}
                  </h5>
                  <p className={`text-[10px] leading-snug line-clamp-2 mt-1 ${isSelected ? 'text-slate-300' : 'text-park-ink-muted'}`}>
                    {evt.summary}
                  </p>
                </div>

                <div className={`text-[9px] pt-1 border-t flex items-center justify-between ${
                  isSelected ? 'border-amber-800 text-amber-200' : 'border-park-card-border/60 text-park-tree'
                }`}>
                  <span>{evt.epoch}</span>
                  <ChevronRight size={12} className={isSelected ? 'text-amber-400' : 'text-park-tree'} />
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};

export default EvolutionaryChronologyMap;
'''

with open('components/EvolutionaryChronologyMap.tsx', 'w') as f:
    f.write(before_return + new_return)

print('EvolutionaryChronologyMap layout updated successfully')
