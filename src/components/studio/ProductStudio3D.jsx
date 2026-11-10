import React, { useState, useMemo, useEffect } from 'react';
import ParametricMannequin from '../3d/ParametricMannequin';
import { calculateProductFit } from '../../engine/fitEngine';
import { LUXURY_PRODUCTS } from '../../data/products';
import { 
  RotateCcw, 
  Activity, 
  Shirt, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Palette,
  Sparkles
} from 'lucide-react';

export default function ProductStudio3D({
  customerProfile,
  onOpenFitFinder,
  onLoadDemoProfile,
  selectedProductIndex: externalProductIndex,
  onSelectProduct: externalSelectProduct
}) {
  // Use lifted state if passed from parent, or internal fallback
  const [internalProductIndex, setInternalProductIndex] = useState(0);
  const selectedProductIndex = externalProductIndex !== undefined ? externalProductIndex : internalProductIndex;
  const setSelectedProductIndex = externalSelectProduct || setInternalProductIndex;

  const activeProduct = LUXURY_PRODUCTS[selectedProductIndex] || LUXURY_PRODUCTS[0];

  // User Interactive Overrides
  const [selectedColorId, setSelectedColorId] = useState(activeProduct.default_colorway);
  const [userSelectedSize, setUserSelectedSize] = useState(null);
  const [fitPref, setFitPref] = useState('regular');
  
  // 3D Canvas Controls
  const [wearGarment, setWearGarment] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFitBands, setShowFitBands] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [addedToBag, setAddedToBag] = useState(false);

  // Sync colorway when product changes
  useEffect(() => {
    setSelectedColorId(activeProduct.default_colorway);
    setUserSelectedSize(null);
  }, [activeProduct.id]);

  const activeColorway = useMemo(() => {
    const found = activeProduct.colorways.find(c => c.id === selectedColorId);
    return found || activeProduct.colorways[0];
  }, [activeProduct, selectedColorId]);

  // Run the deterministic Category-Aware Fit Recommendation Engine in real-time
  const fitResult = useMemo(() => {
    return calculateProductFit({
      customerProfile,
      product: activeProduct,
      fitPreference: fitPref
    });
  }, [customerProfile, activeProduct, fitPref]);

  const isCategoryCalibrated = fitResult.status === "success" && Boolean(fitResult.recommended_size);
  const recommendedSize = fitResult.recommended_size || activeProduct.size_chart[0].size;
  const activeSize = userSelectedSize || recommendedSize;

  // Real-time evaluation corresponding to the active selected size
  const activeEvaluation = useMemo(() => {
    if (!fitResult?.all_sizes) return fitResult;
    const found = fitResult.all_sizes.find(s => s.size === activeSize);
    return found || fitResult;
  }, [fitResult, activeSize]);

  const handleAddToBag = () => {
    setAddedToBag(true);
    setTimeout(() => setAddedToBag(false), 2000);
  };

  return (
    <section id="studio-3d" className="w-full pt-14 sm:pt-16 pb-20 px-4 sm:px-8 bg-[#030611] border-t border-white/5 relative scroll-mt-20">
      <div className="container mx-auto max-w-7xl">
        
        {/* ROW 1: Full-Width Section Header (Appears from left to right) */}
        <div className="mb-6 w-full">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-cyan-400 block mb-1">
            Real-Time 3D Atelier & Fit Engine
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-white font-normal tracking-tight">
            Volumetric 3D Customizer
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-light mt-2 leading-relaxed w-full">
            Your universal body profile morphs this 3D model in real time. Switch garments, sizes, or fit preferences to inspect live drape and ease.
          </p>
        </div>

        {/* ROW 2: Virtual Archive Garment Recommendations (Placed Below Heading from left to right) */}
        <div className="w-full mb-8">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Recommended Archive Garments (Click to Try On):</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">
              Active: <span className="text-white font-semibold">{activeProduct.product_name}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            {LUXURY_PRODUCTS.map((prod, idx) => {
              const isSelected = selectedProductIndex === idx;
              return (
                <button
                  key={prod.id}
                  onClick={() => {
                    setSelectedProductIndex(idx);
                    setSelectedColorId(prod.default_colorway);
                    setUserSelectedSize(null);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 border text-left w-full group overflow-hidden ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400/50 scale-[1.01]'
                      : 'bg-neutral-900/60 border-white/10 hover:border-white/30 hover:bg-neutral-900/90'
                  }`}
                  title={`Click to try on ${prod.product_name} on the 3D model`}
                >
                  <img
                    src={prod.image}
                    alt={prod.product_name}
                    className={`w-11 h-11 rounded-xl object-cover flex-shrink-0 transition-all ${
                      isSelected ? 'grayscale-0 ring-1 ring-cyan-400/60' : 'grayscale group-hover:grayscale-0'
                    }`}
                  />
                  <div className="flex-1 min-w-0 pr-1">
                    <div 
                      className={`text-[11px] font-semibold tracking-wide truncate ${
                        isSelected ? 'text-white' : 'text-neutral-300 group-hover:text-white'
                      }`}
                      title={prod.product_name}
                    >
                      {prod.product_name}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                      <span className="text-cyan-400 lowercase">{prod.matchScore} match</span>
                      <span className="text-neutral-500">{prod.price}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ROW 3: Master Studio Workspace (Balanced 50/50 Equal Proportion Split Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* LEFT: 3D REAL-TIME VIEWPORT (Expanded to Equal Proportion) */}
          <div className="rounded-3xl glass-panel border border-cyan-500/20 overflow-hidden relative shadow-[0_0_50px_rgba(0,240,255,0.12)] flex flex-col justify-between h-full min-h-[720px] lg:min-h-[760px] bg-[#040711]">
            
            {/* Top 3D Control Pill Bar */}
            <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              
              {/* Active Garment Finish Swatches */}
              <div className="pointer-events-auto flex items-center gap-2 glass-pill px-3 py-1.5 rounded-full" title="Select fabric weave and colorway">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-mono uppercase text-neutral-400">Fabric:</span>
                <div className="flex items-center gap-1.5">
                  {activeProduct.colorways.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => setSelectedColorId(col.id)}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        activeColorway.id === col.id ? 'scale-125 border-cyan-400 ring-2 ring-cyan-400/50' : 'border-white/20 hover:scale-110'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={`${col.name} — Click to apply to 3D garment`}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-cyan-300 hidden sm:inline ml-1 font-medium">
                  {activeColorway.name}
                </span>
              </div>

              {/* Dynamic Wardrobe & Morphology Toggles */}
              <div className="pointer-events-auto flex items-center gap-2">
                
                {/* Wear / Drape Wardrobe Garment Toggle */}
                <button
                  onClick={() => setWearGarment(!wearGarment)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider flex items-center gap-1.5 transition-all border ${
                    wearGarment
                      ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400/80 shadow-[0_0_15px_rgba(0,240,255,0.35)] ring-1 ring-cyan-400/40 font-semibold'
                      : 'bg-neutral-900/90 text-neutral-300 border-white/20 hover:text-white hover:border-white/40 font-medium'
                  }`}
                  title="Toggle Real Archive Garment Draping vs Pure Biometric Scan"
                >
                  <Shirt className={`w-3.5 h-3.5 ${wearGarment ? 'text-cyan-400' : 'text-neutral-400'}`} />
                  <span className={wearGarment ? 'text-cyan-300 font-semibold' : 'text-neutral-300 font-medium'}>
                    {wearGarment ? 'Draped' : 'Naked Scan'}
                  </span>
                </button>

                {/* Fit Measurement Bands Toggle */}
                <button
                  onClick={() => setShowFitBands(!showFitBands)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider flex items-center gap-1.5 transition-all border ${
                    showFitBands
                      ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400/80 shadow-[0_0_15px_rgba(0,240,255,0.35)] ring-1 ring-cyan-400/40 font-semibold'
                      : 'bg-neutral-900/90 text-neutral-300 border-white/20 hover:text-white hover:border-white/40 font-medium'
                  }`}
                  title="Biometric Fit Bands: Active clearance rings measuring ease gap (in cm) between skin and cloth"
                >
                  <SlidersHorizontal className={`w-3.5 h-3.5 ${showFitBands ? 'text-cyan-400' : 'text-neutral-400'}`} />
                  <span>{showFitBands ? 'Fit Bands' : 'Bands Off'}</span>
                </button>

                {/* Heatmap Tension Toggle */}
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider flex items-center gap-1.5 transition-all border ${
                    showHeatmap
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/40 font-semibold'
                      : 'bg-neutral-900/90 text-neutral-300 border-white/20 hover:text-white hover:border-white/40 font-medium'
                  }`}
                  title="Fabric Tension Heatmap: Green = Optimal Ease, Red = Tight Strain, Blue = Relaxed Drape"
                >
                  <Activity className={`w-3.5 h-3.5 ${showHeatmap ? 'text-emerald-400' : 'text-neutral-400'}`} />
                  <span>{showHeatmap ? 'Tension ON' : 'Heatmap'}</span>
                </button>

                {/* 360 Turntable Auto-Rotate Toggle */}
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`p-2 rounded-full transition-all border ${
                    autoRotate 
                      ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)]' 
                      : 'bg-neutral-900/90 text-neutral-300 border-white/20 hover:text-white hover:border-white/40'
                  }`}
                  title="Toggle 360° Turntable"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Area (Expands fully with container height & width) */}
            <div className="w-full flex-1 relative min-h-[540px]">
              <ParametricMannequin
                profile={customerProfile}
                product={activeProduct}
                selectedSize={activeSize}
                fitPreference={fitPref}
                tensionMap={activeEvaluation.tension_map || fitResult.tension_map}
                colorway={activeColorway}
                wearGarment={wearGarment}
                showHeatmap={showHeatmap}
                showFitBands={showFitBands}
                autoRotate={autoRotate}
              />
            </div>

            {/* Bottom 3D Scene Controls & Metadata Pill */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="pointer-events-auto glass-pill px-3 py-1.5 rounded-full text-[10px] font-mono text-neutral-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>360° Orbit • Drag to Rotate • Scroll to Zoom</span>
              </div>

              <div className="pointer-events-auto glass-pill px-3 py-1.5 rounded-full text-[10px] font-mono text-neutral-300">
                {wearGarment ? (
                  <span>Trying On: <span className="text-cyan-400 font-semibold">{activeProduct.product_name.split('&')[0].trim()}</span> (Size {activeSize} • <span className="uppercase text-emerald-300 font-semibold">{fitPref}</span> • <span className="text-neutral-400">{activeColorway.name}</span>)</span>
                ) : (
                  <span>Morphology: <span className="text-cyan-400 font-semibold uppercase">Calibrated Biometric Scan</span></span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE RECOMMENDATION & FIT TELEMETRY (Uncompressed & Spacious) */}
          <div className="flex flex-col justify-between space-y-6">
            
            {/* Recommendation Result Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-5 bg-[#090d18]/90 flex-1">
              
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                    Deterministic Recommendation
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium mt-1">
                    {activeProduct.product_name}
                  </h3>
                  <div className="text-xs text-neutral-400 font-mono mt-0.5">
                    {activeProduct.price} • {activeProduct.fabric}
                  </div>
                </div>

                {/* Score Pill (Updates with selected size) */}
                <div className="text-right">
                  <div className="font-serif text-3xl sm:text-4xl font-semibold text-white">
                    {isCategoryCalibrated ? `${activeEvaluation.fit_score ?? fitResult.fit_score}%` : '—%'}
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                    isCategoryCalibrated ? 'text-emerald-400' : 'text-neutral-500'
                  }`}>
                    {isCategoryCalibrated ? `${fitResult.confidence} Confidence` : 'Uncalibrated'}
                  </span>
                </div>
              </div>

              {/* Uncalibrated Guest Alert Box vs Verified / Demo Recommendation */}
              {!isCategoryCalibrated ? (
                <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-400/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${fitResult.missing_dimensions ? 'bg-amber-400 animate-ping' : 'bg-cyan-400 animate-ping'}`} />
                    <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold">
                      {fitResult.missing_dimensions ? `Complete Your Measurements for ${activeProduct.product_name}` : 'Body Profile Not Yet Calibrated'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-light">
                    {fitResult.message || fitResult.explanation || "FitMatch AI computes deterministic ease clearances from your actual physical tape measurements. Provide your measurements using Voice or Manual entry to unlock your verified size."}
                  </p>

                  {/* Missing Dimension Badges */}
                  {fitResult.missing_dimensions && fitResult.missing_dimensions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {fitResult.missing_dimensions.map((dim) => {
                        const label = dim.replace('_cm', '').replace('_', ' ');
                        return (
                          <span 
                            key={dim}
                            className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-950/70 text-rose-300 border border-rose-500/40 flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span className="capitalize">{label}</span>
                            <span className="text-rose-400/70">• Missing</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={onOpenFitFinder}
                      className="bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-full text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{fitResult.missing_dimensions ? 'Complete Required Measurements' : 'Calibrate Measurements'}</span>
                    </button>
                    {onLoadDemoProfile && (
                      <button
                        onClick={onLoadDemoProfile}
                        className="glass-panel text-cyan-300 hover:text-white px-4 py-2 rounded-full text-xs font-mono flex items-center gap-1.5 transition-all"
                        title="Load pre-calibrated sample 42R archetype for immediate demonstration"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Load Demo Profile (42R)</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {customerProfile?.is_demo && (
                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                      <span className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Demo Profile Active (Size 42R Archetype)</span>
                      </span>
                      <button
                        onClick={onOpenFitFinder}
                        className="text-amber-300 hover:underline text-[10px] font-mono"
                      >
                        Enter Real Measurements →
                      </button>
                    </div>
                  )}

                  {customerProfile?.measurement_metadata?.verified_by_user && !customerProfile?.is_demo && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
                      <span className="flex items-center gap-1.5 font-mono text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verified Customer Profile Active</span>
                      </span>
                      <button
                        onClick={onOpenFitFinder}
                        className="text-emerald-300 hover:underline text-[10px] font-mono"
                      >
                        Edit Profile →
                      </button>
                    </div>
                  )}

                  {/* Recommended Size Display Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white text-black flex items-center justify-between shadow-xl">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 block">
                        Ideal Size For Your Body
                      </span>
                      <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
                        Size {recommendedSize}
                      </span>
                    </div>
                    
                    {fitResult.alternative_size && (
                      <div className="text-right border-l border-neutral-300 pl-4 sm:pl-6">
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                          Alternative
                        </span>
                        <span className="font-serif text-lg sm:text-xl font-semibold text-neutral-800">
                          Size {fitResult.alternative_size}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Deterministic Explanation */}
                  <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 text-xs text-neutral-300 leading-relaxed font-light">
                    <span className="text-white font-medium">Why this size? </span>
                    {fitResult.explanation}
                  </div>
                </>
              )}

              {/* Size Chart Interactive Selector */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                    Try Any Size On 3D Model:
                  </label>
                  <span className={`text-[10px] font-mono ${isCategoryCalibrated ? 'text-cyan-400' : 'text-neutral-500'}`}>
                    Recommended: {isCategoryCalibrated ? `Size ${recommendedSize}` : 'Pending Complete Measurements'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {activeProduct.size_chart.map((chartItem) => {
                    const isSelected = activeSize === chartItem.size;
                    const isRecommended = isCategoryCalibrated && fitResult.recommended_size === chartItem.size;
                    return (
                      <button
                        key={chartItem.size}
                        onClick={() => setUserSelectedSize(chartItem.size)}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-mono transition-all relative ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/60 text-white font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-1 ring-cyan-400'
                            : 'border-white/10 bg-neutral-900/60 text-neutral-400 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        <span>{chartItem.size}</span>
                        {isRecommended && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black shadow" title="Recommended Fit" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fit Preference Interactive Selector */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 block mb-2">
                  Active Fit Preference:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {['slim', 'regular', 'oversized'].map((pref) => (
                    <button
                      key={pref}
                      onClick={() => setFitPref(pref)}
                      className={`py-2.5 px-3 rounded-xl border text-xs capitalize transition-all ${
                        fitPref === pref
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 font-semibold shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                          : 'border-white/5 bg-neutral-900/40 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension-by-Dimension Breakdown Table (Uncompressed, Highly Legible) */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase text-neutral-500 px-1">
                  <span>Dimension</span>
                  <span>Body / Garment</span>
                  <span>Ease</span>
                  <span>Status</span>
                </div>

                <div className="space-y-2 text-xs">
                  {Object.entries(activeEvaluation.dimension_analysis || fitResult.dimension_analysis || {}).map(([dimKey, anal]) => (
                    <div
                      key={dimKey}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 font-mono"
                    >
                      <span className="text-neutral-200 font-sans font-normal whitespace-nowrap">
                        {anal.name}
                      </span>
                      <span className="text-neutral-400 text-xs whitespace-nowrap">
                        {anal.body_val} / {anal.garment_val} cm
                      </span>
                      <span className="font-semibold text-white text-xs whitespace-nowrap">
                        +{anal.actual_ease}cm
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded font-mono uppercase tracking-wide whitespace-nowrap ${
                          anal.status === 'good'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                            : anal.status === 'slightly_tight'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                            : anal.status === 'too_tight'
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                            : 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {anal.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col gap-3">
                <button
                  onClick={handleAddToBag}
                  className={`w-full py-4 rounded-full text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    addedToBag
                      ? 'bg-emerald-400 text-black shadow-[0_0_25px_rgba(52,211,153,0.5)]'
                      : 'bg-white text-black hover:bg-neutral-200 shadow-xl'
                  }`}
                >
                  {addedToBag ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Added Size {activeSize} to Bag</span>
                    </>
                  ) : (
                    <>
                      <span>Add Size {activeSize} To Bag • {activeProduct.price}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={onOpenFitFinder}
                  className="w-full py-2.5 rounded-full text-[11px] font-mono text-neutral-400 hover:text-white border border-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Edit Biometric Measurements in Fit Finder</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Biometric Guarantee Banner */}
            <div className="p-4 rounded-2xl glass-panel border border-white/5 flex items-center gap-3 text-xs text-neutral-400 font-light">
              <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span>
                FitMatch AI Deterministic Return Guarantee: 99.4% sizing accuracy. If size {activeSize} does not fit your body profile, exchange is complimentary.
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
