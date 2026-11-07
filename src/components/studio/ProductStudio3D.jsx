import React, { useState, useMemo } from 'react';
import { LUXURY_PRODUCTS } from '../../data/products';
import { calculateProductFit } from '../../engine/fitEngine';
import ParametricMannequin from '../3d/ParametricMannequin';
import FitFeedbackModal from './FitFeedbackModal';
import {
  RotateCcw,
  Sparkles,
  Eye,
  Activity,
  ArrowRight,
  ShieldCheck,
  Check,
  ShoppingBag,
  SlidersHorizontal,
  Shirt
} from 'lucide-react';

export default function ProductStudio3D({
  customerProfile,
  onOpenFitFinder
}) {
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const activeProduct = LUXURY_PRODUCTS[selectedProductIndex];

  // 3D Customizer states
  const [selectedColorId, setSelectedColorId] = useState(activeProduct.default_colorway);
  const [wearGarment, setWearGarment] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFitBands, setShowFitBands] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [fitPref, setFitPref] = useState(customerProfile?.fit_preferences?.default_fit || 'regular');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [addedToBag, setAddedToBag] = useState(false);

  // Sync colorway when product changes
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

  const recommendedSize = fitResult.recommended_size || activeProduct.size_chart[0].size;

  const handleAddToBag = () => {
    setAddedToBag(true);
    setTimeout(() => setAddedToBag(false), 2000);
  };

  return (
    <section id="studio-3d" className="w-full py-24 px-4 sm:px-8 bg-[#030611] border-t border-white/5 relative">
      <div className="container mx-auto max-w-7xl">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-cyan-400">
              Real-Time 3D Atelier & Fit Engine
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-white font-normal mt-2">
              Volumetric 3D Customizer
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 font-light mt-1">
              Your universal body profile morphs this 3D model in real time. Switch between virtual try-on, garment draping, and biometric body scan.
            </p>
          </div>

          {/* Product Category Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-none">
            {LUXURY_PRODUCTS.map((prod, idx) => (
              <button
                key={prod.id}
                onClick={() => {
                  setSelectedProductIndex(idx);
                  setSelectedColorId(prod.default_colorway);
                }}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                  selectedProductIndex === idx
                    ? 'bg-white text-black font-semibold shadow-lg'
                    : 'bg-neutral-900/80 text-neutral-400 border border-white/10 hover:border-white/30'
                }`}
              >
                {prod.product_name.split(' ')[0]} {prod.category}
              </button>
            ))}
          </div>
        </div>

        {/* Master Studio Workspace (Split Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: 3D REAL-TIME VIEWPORT (7 Cols) */}
          <div className="lg:col-span-7 rounded-3xl glass-panel border border-cyan-500/20 overflow-hidden relative shadow-[0_0_50px_rgba(0,240,255,0.12)] flex flex-col justify-between h-[640px] bg-[#040711]">
            
            {/* Top 3D Control Pill Bar */}
            <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              
              {/* Active Garment Finish Swatches */}
              <div className="pointer-events-auto flex items-center gap-2 glass-pill px-3 py-1.5 rounded-full">
                <span className="text-[10px] font-mono uppercase text-neutral-400 mr-1">Fabric:</span>
                <div className="flex items-center gap-1.5">
                  {activeProduct.colorways.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => setSelectedColorId(col.id)}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        activeColorway.id === col.id ? 'scale-125 border-cyan-400 ring-2 ring-cyan-400/40' : 'border-white/20 hover:scale-110'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>

              {/* Dynamic Wardrobe & Morphology Toggles */}
              <div className="pointer-events-auto flex items-center gap-2">
                
                {/* Wear / Drape Wardrobe Garment Toggle */}
                <button
                  onClick={() => setWearGarment(!wearGarment)}
                  className={`glass-pill px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider flex items-center gap-1.5 transition-all ${
                    wearGarment
                      ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Toggle Wardrobe Garment Draping over Avatar"
                >
                  <Shirt className="w-3.5 h-3.5" />
                  <span>{wearGarment ? 'Draped' : 'Naked Scan'}</span>
                </button>

                {/* Fit Measurement Bands Toggle */}
                <button
                  onClick={() => setShowFitBands(!showFitBands)}
                  className={`glass-pill px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider flex items-center gap-1.5 transition-all ${
                    showFitBands
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Toggle Real-Time Ease & Caliper Bands"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{showFitBands ? 'Fit Bands' : 'Bands Off'}</span>
                </button>

                {/* Heatmap Tension Toggle */}
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`glass-pill px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider flex items-center gap-1.5 transition-all ${
                    showHeatmap
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Visualize fabric tension: Green = Optimal Ease, Red = Tight Strain"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{showHeatmap ? 'Tension ON' : 'Heatmap'}</span>
                </button>

                {/* 360 Turntable Auto-Rotate Toggle */}
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`glass-pill p-2 rounded-full transition-all ${
                    autoRotate ? 'bg-cyan-400 text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Toggle 360° Turntable"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="w-full h-full relative">
              <ParametricMannequin
                profile={customerProfile}
                product={activeProduct}
                selectedSize={recommendedSize}
                tensionMap={fitResult.tension_map}
                colorway={activeColorway}
                wearGarment={wearGarment}
                showHeatmap={showHeatmap}
                showFitBands={showFitBands}
                autoRotate={autoRotate}
              />
            </div>

            {/* Bottom 3D Scene Controls & Metadata Pill */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
              <div className="pointer-events-auto glass-pill px-3 py-1.5 rounded-full text-[10px] font-mono text-neutral-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>360° Orbit • Drag to Rotate • Pinch to Zoom</span>
              </div>

              <div className="pointer-events-auto glass-pill px-3 py-1.5 rounded-full text-[10px] font-mono text-neutral-300">
                {wearGarment ? (
                  <span>Trying On: <span className="text-cyan-400 font-semibold">{activeProduct.product_name}</span> ({activeColorway.name})</span>
                ) : (
                  <span>Morphology: <span className="text-cyan-400 font-semibold uppercase">Calibrated Biometric Scan</span></span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE RECOMMENDATION & FIT TELEMETRY (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Recommendation Result Card */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-5 bg-[#090d18]/90">
              
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                    Deterministic Recommendation
                  </span>
                  <h3 className="font-serif text-2xl text-white font-medium mt-1">
                    {activeProduct.product_name}
                  </h3>
                  <div className="text-xs text-neutral-400 font-mono mt-0.5">
                    {activeProduct.price} • {activeProduct.fabric}
                  </div>
                </div>

                {/* Score Pill */}
                <div className="text-right">
                  <div className="font-serif text-3xl font-semibold text-white">
                    {fitResult.fit_score}%
                  </div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">
                    {fitResult.confidence} Confidence
                  </span>
                </div>
              </div>

              {/* Recommended Size Display Box */}
              <div className="p-4 rounded-2xl bg-white text-black flex items-center justify-between shadow-xl">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 block">
                    Ideal Size For Your Body
                  </span>
                  <span className="font-serif text-3xl font-bold tracking-tight">
                    Size {recommendedSize}
                  </span>
                </div>
                
                {fitResult.alternative_size && (
                  <div className="text-right border-l border-neutral-300 pl-4">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                      Alternative
                    </span>
                    <span className="font-serif text-lg font-semibold text-neutral-800">
                      Size {fitResult.alternative_size}
                    </span>
                  </div>
                )}
              </div>

              {/* Deterministic Explanation */}
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/5 text-xs text-neutral-300 leading-relaxed font-light">
                <span className="text-white font-medium">Why this size? </span>
                {fitResult.explanation}
              </div>

              {/* Fit Preference Interactive Selector */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 block mb-2">
                  Active Fit Preference:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['slim', 'regular', 'oversized'].map((pref) => (
                    <button
                      key={pref}
                      onClick={() => setFitPref(pref)}
                      className={`py-2 px-3 rounded-xl border text-xs capitalize transition-all ${
                        fitPref === pref
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 font-medium shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                          : 'border-white/5 bg-neutral-900/40 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension-by-Dimension Breakdown Table */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase text-neutral-500 px-1">
                  <span>Dimension</span>
                  <span>Body / Garment</span>
                  <span>Ease</span>
                  <span>Status</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {Object.entries(fitResult.dimension_analysis || {}).map(([dimKey, anal]) => (
                    <div
                      key={dimKey}
                      className="p-2.5 rounded-xl bg-neutral-900/40 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <span className="text-neutral-300 font-medium w-28 truncate">{anal.name}</span>
                      <span className="font-mono text-neutral-400 text-[11px]">
                        {anal.body_val} / {anal.garment_val}
                      </span>
                      <span className="font-mono text-white text-[11px]">
                        +{anal.actual_ease}cm
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${
                          anal.status === 'good'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : anal.status.includes('tight')
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                            : 'bg-blue-950/60 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {anal.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3">
                <button
                  onClick={handleAddToBag}
                  className="w-full bg-white text-black hover:bg-neutral-200 py-3.5 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-all shadow-2xl"
                >
                  {addedToBag ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Added Size {recommendedSize} To Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add Size {recommendedSize} To Bag</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={onOpenFitFinder}
                    className="glass-panel text-neutral-300 hover:text-white hover:border-white/40 py-2.5 rounded-full text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="glass-panel text-neutral-300 hover:text-white hover:border-white/40 py-2.5 rounded-full text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Rate Fit Accuracy</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Post-Trial Feedback Calibration Modal */}
      <FitFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        product={activeProduct}
        recommendedSize={recommendedSize}
      />
    </section>
  );
}
